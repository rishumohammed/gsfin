import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';
import { CertificateService } from './certificate.service.js';

export class ExamSessionService {
  /**
   * Start a sitting for an assignment
   */
  static async startSitting({ assignmentId }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [assignments] = await connection.query(
        `SELECT ea.*, e.name as exam_name, e.duration_minutes, s.name as student_name, s.email as student_email
         FROM exam_assignments ea
         JOIN exams e ON ea.exam_id = e.id
         JOIN students s ON ea.student_id = s.id
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

      // Create new attempt record
      await connection.query(
        `INSERT INTO exam_attempts (id, assignment_id, started_at)
         VALUES (?, ?, ?)`,
        [attemptId, assignmentId, startedAt]
      );

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
                s.name as student_name, e.name as exam_name
         FROM exam_attempts att
         JOIN exam_assignments ea ON att.assignment_id = ea.id
         JOIN students s ON ea.student_id = s.id
         JOIN exams e ON ea.exam_id = e.id
         WHERE att.id = ? FOR UPDATE`,
        [attemptId]
      );

      if (attempts.length === 0) throw new Error('Sitting attempt not found.');
      const att = attempts[0];
      const assignmentId = att.assignment_id;

      const endedAt = new Date();
      const result = passed ? 'pass' : 'fail';

      // 1. Update current attempt row
      await connection.query(
        `UPDATE exam_attempts 
         SET ended_at = ?, end_reason = ?, result = ?
         WHERE id = ?`,
        [endedAt, endReason, result, attemptId]
      );

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

          // Generate Certificate (uniform template)
          try {
            const { pdfUrl } = await CertificateService.generateParticipationCertificate(
              att.student_name,
              att.exam_name,
              endedAt
            );

            const certId = uuidv4();
            await connection.query(
              `INSERT INTO certificates (id, assignment_id, issued_at, pdf_url)
               VALUES (?, ?, NOW(), ?)
               ON DUPLICATE KEY UPDATE pdf_url = VALUES(pdf_url)`,
              [certId, assignmentId, pdfUrl]
            );
          } catch (certErr) {
            console.error('Certificate generation error (non-fatal):', certErr);
          }
        } else {
          await connection.query(
            `UPDATE exam_assignments SET status = 'failed' WHERE id = ?`,
            [assignmentId]
          );
        }
      }

      await connection.commit();
      return { success: true, assignmentId, endReason, result };
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
