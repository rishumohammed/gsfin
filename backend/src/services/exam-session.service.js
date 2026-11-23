import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';
import { CertificateService } from './certificate.service.js';
import emailService from './email.service.js';

export class ExamSessionService {
  /**
   * Start a sitting for an assignment
   */
  static async startSitting({ assignmentId }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [assignments] = await connection.query(
        `SELECT ea.*, 
                COALESCE(e.name, pe.name, 'Certification Exam') as exam_name, 
                COALESCE(e.duration_minutes, 60) as duration_minutes, 
                s.name as student_name, s.email as student_email,
                s.face_photo, s.face_descriptor
         FROM exam_assignments ea
         JOIN students s ON ea.student_id = s.id
         LEFT JOIN exams e ON ea.exam_id = e.id
         LEFT JOIN public_exams pe ON ea.exam_id = pe.id
         WHERE ea.id = ? FOR UPDATE`,
        [assignmentId]
      );

      if (assignments.length === 0) throw new Error('Exam assignment not found.');
      const assign = assignments[0];

      // Check assignment status & attempt limits
      if (['passed', 'expired'].includes(assign.status)) {
        throw new Error(`Exam assignment is currently ${assign.status} and cannot be started.`);
      }

      if (assign.attempts_used >= assign.max_attempts && assign.status !== 'in_progress') {
        throw new Error(`Maximum attempts (${assign.max_attempts}) reached for this assignment.`);
      }

      // Check retry link expiration if applicable
      if (assign.is_retry_link && assign.retry_link_expires_at && new Date() > new Date(assign.retry_link_expires_at)) {
        throw new Error('This retry link has expired.');
      }

      const attemptId = uuidv4();
      const startedAt = new Date();

      // Create new attempt record with proctoring baseline
      try {
        await connection.query(
          `INSERT INTO exam_attempts (id, assignment_id, started_at, proctoring_status, reference_selfie_url, baseline_vector)
           VALUES (?, ?, ?, 'approved', ?, ?)`,
          [
            attemptId, 
            assignmentId, 
            startedAt, 
            assign.face_photo || null, 
            assign.face_descriptor ? (typeof assign.face_descriptor === 'string' ? assign.face_descriptor : JSON.stringify(assign.face_descriptor)) : null
          ]
        );
      } catch (insertErr) {
        // Graceful fallback if proctoring columns are missing
        await connection.query(
          `INSERT INTO exam_attempts (id, assignment_id, started_at)
           VALUES (?, ?, ?)`,
          [attemptId, assignmentId, startedAt]
        );
      }

      // Increment attempts_used if starting first time or starting a new attempt
      await connection.query(
        `UPDATE exam_assignments 
         SET attempts_used = attempts_used + 1, status = 'in_progress' 
         WHERE id = ?`,
        [assignmentId]
      );

      await connection.commit();

      const maxCutoffMinutes = assign.duration_minutes * 1.25;

      return {
        attemptId,
        assignmentId,
        studentName: assign.student_name,
        studentEmail: assign.student_email,
        examName: assign.exam_name,
        durationMinutes: assign.duration_minutes,
        maxCutoffMinutes,
        startedAt
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * End a sitting (Submit, Technical Void, or Force Ended Cutoff)
   */
  static async endSitting({ attemptId, endReason, score = 0, percentage = 0, passed = false }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [attempts] = await connection.query(
        `SELECT att.*, ea.id as assignment_id, ea.attempts_used, ea.max_attempts, ea.student_id, ea.exam_id,
                ea.batch_id, ea.wallet_id, b.org_id,
                COALESCE(b.enable_certificate, e.enable_certificate, pe.enable_certificate, 1) as enable_certificate,
                COALESCE(b.enable_proctoring, e.enable_proctoring, e.proctoring_enabled, 0) as enable_proctoring,
                s.name as student_name, s.email as student_email,
                COALESCE(e.name, pe.name, 'Certification Exam') as exam_name
         FROM exam_attempts att
         JOIN exam_assignments ea ON att.assignment_id = ea.id
         JOIN batches b ON ea.batch_id = b.id
         JOIN students s ON ea.student_id = s.id
         LEFT JOIN exams e ON ea.exam_id = e.id
         LEFT JOIN public_exams pe ON ea.exam_id = pe.id
         WHERE att.id = ? FOR UPDATE`,
        [attemptId]
      );

      if (attempts.length === 0) throw new Error('Sitting attempt not found.');
      const att = attempts[0];
      const assignmentId = att.assignment_id;

      const endedAt = new Date();
      const result = passed ? 'pass' : 'fail';

      // Determine proctoring status
      const isProctoringEnabled = att.enable_proctoring !== false && att.enable_proctoring !== 0 && att.enable_proctoring !== '0' && att.enable_proctoring !== null;
      let proctoringStatus = isProctoringEnabled ? 'approved' : 'not_applicable';
      if (isProctoringEnabled) {
        try {
          const [viol] = await connection.query(
            `SELECT COUNT(*) as count FROM proctoring_events 
             WHERE attempt_id = ? AND type IN ('proxy_mismatch', 'multiple_faces', 'face_absent', 'devtools_open', 'mobile_phone_detected', 'phone_detected', 'suspicious_object')`,
            [attemptId]
          );
          if (viol[0] && viol[0].count > 0) {
            proctoringStatus = 'pending_review';
          }
        } catch (_) {}
      }

      // 1. Update current attempt row
      try {
        await connection.query(
          `UPDATE exam_attempts 
           SET ended_at = ?, end_reason = ?, result = ?, proctoring_status = ?
           WHERE id = ?`,
          [endedAt, endReason, result, proctoringStatus, attemptId]
        );
      } catch (updErr) {
        // Fallback without proctoring_status if column unmigrated
        await connection.query(
          `UPDATE exam_attempts 
           SET ended_at = ?, end_reason = ?, result = ?
           WHERE id = ?`,
          [endedAt, endReason, result, attemptId]
        );
      }

      let certDetails = null;
      const isCertEnabled = att.enable_certificate !== false && att.enable_certificate !== 0 && att.enable_certificate !== '0';

      // 2. Handle status & automatic retry logic
      if (endReason === 'technical_void') {
        if (att.attempts_used < att.max_attempts) {
          // Auto-grant retry slot for technical void
          await connection.query(
            `UPDATE exam_assignments SET status = 'not_started' WHERE id = ?`,
            [assignmentId]
          );

          const autoAttemptId = uuidv4();
          await connection.query(
            `INSERT INTO exam_attempts (id, assignment_id, granted_by)
             VALUES (?, ?, 'automatic')`,
            [autoAttemptId, assignmentId]
          );
        } else {
          await connection.query(
            `UPDATE exam_assignments SET status = 'failed' WHERE id = ?`,
            [assignmentId]
          );
        }
      } else {
        // Normal submit or 25% force cutoff end
        if (passed) {
          await connection.query(
            `UPDATE exam_assignments SET status = 'passed' WHERE id = ?`,
            [assignmentId]
          );

          // Generate Certificate only if certificates are enabled for this exam / batch
          if (isCertEnabled) {
            try {
              const { buffer, pdfUrl, certificateNumber } = await CertificateService.generateParticipationCertificate(
                att.student_name,
                att.exam_name,
                endedAt
              );
              certDetails = { pdfUrl, certificateNumber };

              const certId = uuidv4();
              const certNo = certificateNumber || `GSFIN-${Date.now().toString(36).toUpperCase()}`;

              try {
                await connection.query(
                  `INSERT INTO certificates (id, assignment_id, cert_number, status, issued_at, pdf_url)
                   VALUES (?, ?, ?, 'active', NOW(), ?)
                   ON DUPLICATE KEY UPDATE 
                     pdf_url = VALUES(pdf_url),
                     cert_number = COALESCE(cert_number, VALUES(cert_number)),
                     status = 'active'`,
                  [certId, assignmentId, certNo, pdfUrl]
                );
              } catch (certInsertErr) {
                // Fallback for schema without cert_number / status
                await connection.query(
                  `INSERT INTO certificates (id, assignment_id, issued_at, pdf_url)
                   VALUES (?, ?, NOW(), ?)
                   ON DUPLICATE KEY UPDATE pdf_url = VALUES(pdf_url)`,
                  [certId, assignmentId, pdfUrl]
                );
              }

              // Dispatch Certificate by Email directly to candidate!
              if (att.student_email) {
                emailService.sendExamCertificateEmail(
                  { name: att.student_name, email: att.student_email },
                  { name: att.exam_name },
                  buffer,
                  { pdfUrl, certificateNumber: certNo }
                ).catch(emailErr => {
                  console.error('[Exam Certificate Email Error]:', emailErr.message);
                });
              }
            } catch (certErr) {
              console.error('Certificate generation error (non-fatal):', certErr);
            }
          }
        } else {
          await connection.query(
            `UPDATE exam_assignments SET status = 'failed' WHERE id = ?`,
            [assignmentId]
          );
        }

        // 3. Log token redemption audit transaction when candidate completes exam
        try {
          const txId = uuidv4();
          const certNote = passed 
            ? `Token Redeemed: Candidate ${att.student_name} completed and passed ${att.exam_name} (Score: ${percentage}% - Certified)` 
            : `Token Redeemed: Candidate ${att.student_name} completed ${att.exam_name} (Score: ${percentage}% - ${result.toUpperCase()})`;

          await connection.query(
            `INSERT INTO token_transactions 
             (id, org_id, wallet_id, type, token_count, related_batch_id, related_assignment_id, notes)
             VALUES (?, ?, ?, 'redeem', -1, ?, ?, ?)`,
            [txId, att.org_id, att.wallet_id, att.batch_id, assignmentId, certNote]
          );
        } catch (txErr) {
          console.error('Token redemption logging error (non-fatal):', txErr);
        }
      }

      await connection.commit();
      return { 
        success: true, 
        assignmentId, 
        endReason, 
        result,
        enable_certificate: isCertEnabled,
        certificate_url: certDetails?.pdfUrl || null,
        certificate_number: certDetails?.certificateNumber || null
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Manually grant retry for an assignment (Sub-center staff)
   */
  static async grantManualRetry({ orgId, assignmentId, staffUserId }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [assignments] = await connection.query(
        `SELECT ea.*, s.org_id
         FROM exam_assignments ea
         JOIN students s ON ea.student_id = s.id
         WHERE ea.id = ? AND s.org_id = ? FOR UPDATE`,
        [assignmentId, orgId]
      );

      if (assignments.length === 0) throw new Error('Assignment not found or unauthorized.');
      const assign = assignments[0];

      if (assign.attempts_used >= assign.max_attempts) {
        throw new Error(`Cannot grant retry. Maximum attempts limit (${assign.max_attempts}) reached.`);
      }

      await connection.query(
        `UPDATE exam_assignments SET status = 'not_started' WHERE id = ?`,
        [assignmentId]
      );

      const manualAttemptId = uuidv4();
      await connection.query(
        `INSERT INTO exam_attempts (id, assignment_id, granted_by, granted_by_user_id)
         VALUES (?, ?, 'manual_subcenter', ?)`,
        [manualAttemptId, assignmentId, staffUserId]
      );

      await connection.commit();
      return { success: true, assignmentId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
