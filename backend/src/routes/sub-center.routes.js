import express from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { pool, redis } from '../db/connection.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import { WalletService } from '../services/wallet.service.js';
import { BatchService } from '../services/batch.service.js';
import { ExamSessionService } from '../services/exam-session.service.js';
import { ExamCatalogService } from '../services/exam-catalog.service.js';
import emailService from '../services/email.service.js';
import { CertificateService } from '../services/certificate.service.js';
import { getFrontendUrl, getBackendUrl } from '../utils/url-helper.js';
import { dispatchBatchEnrollmentEmails } from '../utils/batch-email.helper.js';

const router = express.Router();

// Auto-healer for certificates table columns
export const ensureCertificatesColumns = async () => {
  try {
    const requiredColumns = [
      { name: 'cert_number', type: 'VARCHAR(100) NULL' },
      { name: 'status', type: "ENUM('active', 'revoked') DEFAULT 'active'" },
      { name: 'pdf_url', type: 'VARCHAR(255) NULL' },
      { name: 'issued_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];

    let existingColNames = new Set();
    try {
      const [cols] = await pool.query('SHOW COLUMNS FROM certificates');
      existingColNames = new Set(cols.map(c => c.Field.toLowerCase()));
    } catch (e) {
      // Create certificates table if missing
      await pool.query(`
        CREATE TABLE IF NOT EXISTS certificates (
          id CHAR(36) PRIMARY KEY,
          assignment_id CHAR(36) NOT NULL UNIQUE,
          cert_number VARCHAR(100) NULL,
          status ENUM('active', 'revoked') DEFAULT 'active',
          issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          pdf_url VARCHAR(255) NULL
        )
      `);
      return;
    }

    for (const col of requiredColumns) {
      if (!existingColNames.has(col.name.toLowerCase())) {
        try {
          await pool.query(`ALTER TABLE certificates ADD COLUMN \`${col.name}\` ${col.type}`);
          console.log(`[Auto-Heal] Added column '${col.name}' to certificates table.`);
        } catch (addErr) {
          if (addErr.errno !== 1060 && !addErr.message?.includes('Duplicate column')) {
            console.warn(`[Auto-Heal] Column '${col.name}' add warning:`, addErr.message);
          }
        }
      }
    }

    // Backfill any empty certificate numbers for completed exams
    try {
      await pool.query(`
        UPDATE certificates 
        SET cert_number = CONCAT('GSFIN-', UPPER(SUBSTRING(id, 1, 8))) 
        WHERE cert_number IS NULL OR cert_number = ''
      `);
    } catch (_) { }
  } catch (err) {
    console.error('[Auto-Heal] Error in ensureCertificatesColumns:', err);
  }
};

// Auto-healer for students table columns to ensure cross-MySQL compatibility without IF NOT EXISTS syntax errors
export const ensureStudentsColumns = async () => {
  try {
    const requiredColumns = [
      { name: 'password', type: 'VARCHAR(255) NULL' },
      { name: 'initial_password', type: 'VARCHAR(255) NULL' },
      { name: 'face_photo', type: 'LONGTEXT NULL' },
      { name: 'face_descriptor', type: 'TEXT NULL' },
      { name: 'otp_code', type: 'VARCHAR(10) NULL' },
      { name: 'otp_expires_at', type: 'DATETIME NULL' },
      { name: 'education_level', type: 'VARCHAR(100) NULL' },
      { name: 'institution_name', type: 'VARCHAR(255) NULL' },
      { name: 'gender', type: 'VARCHAR(50) NULL' },
      { name: 'dob', type: 'DATE NULL' },
      { name: 'face_status', type: "VARCHAR(50) DEFAULT 'waiting_face_enrollment'" },
      { name: 'face_photos', type: 'LONGTEXT NULL' },
      { name: 'face_enroll_token', type: 'VARCHAR(128) NULL' },
      { name: 'face_enroll_token_expires_at', type: 'DATETIME NULL' },
      { name: 'face_verify_token', type: 'VARCHAR(128) NULL' },
      { name: 'face_verify_token_expires_at', type: 'DATETIME NULL' }
    ];

    let existingColNames = new Set();
    try {
      const [cols] = await pool.query('SHOW COLUMNS FROM students');
      existingColNames = new Set((cols || []).map(c => (c.Field || c.COLUMN_NAME || '').toLowerCase()));
    } catch (showErr) {
      const [cols] = await pool.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'"
      );
      existingColNames = new Set((cols || []).map(c => c.COLUMN_NAME.toLowerCase()));
    }

    for (const col of requiredColumns) {
      if (!existingColNames.has(col.name.toLowerCase())) {
        try {
          await pool.query(`ALTER TABLE students ADD COLUMN \`${col.name}\` ${col.type}`);
          console.log(`[Auto-Heal] Added column '${col.name}' to students table.`);
        } catch (colErr) {
          if (colErr.errno !== 1060 && !colErr.message?.includes('Duplicate column')) {
            console.warn(`[Auto-Heal] Column '${col.name}' add warning:`, colErr.message);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Auto-Heal] Error in ensureStudentsColumns:', err);
  }
};

// Authenticate and ensure user is sub_center_staff with valid org_id
router.use(authenticateJWT, authorizeRoles('sub_center_staff', 'super_admin'), (req, res, next) => {
  if (req.user.role === 'sub_center_staff' && !req.user.org_id) {
    return res.status(403).json({ message: 'Sub-center account is not linked to any organization.' });
  }
  next();
});

// Helper helper to get active org_id
const getOrgId = (req) => req.user.org_id || req.query.org_id;

// ─── 1. Student Registration & Management ───────────────────────────────────

router.get('/education-levels', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT `value` FROM system_config WHERE `key` = 'education_levels'"
    );
    if (rows.length && rows[0].value) {
      try {
        const parsed = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json(parsed);
        }
      } catch (e) {
        // Fallback below
      }
    }
    res.json([
      'SSLC / 10th Standard',
      'Plus Two / 12th Standard',
      'Diploma',
      'Undergraduate / Bachelor Degree',
      'Postgraduate / Master Degree',
      'Doctorate / PhD',
      'Other / Professional'
    ]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/students', async (req, res) => {
  const orgId = getOrgId(req);
  try {
    const [students] = await pool.query(
      `SELECT * FROM students WHERE org_id = ? ORDER BY created_at DESC`,
      [orgId]
    );
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// In-memory fallback OTP storage for student registration (with Redis integration)
const studentRegOtpMap = new Map();

const storeStudentOtp = async (orgId, email, otp) => {
  const key = `student_reg_otp:${orgId}:${email.toLowerCase().trim()}`;
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  studentRegOtpMap.set(key, { otp, expiresAt });
  try {
    if (redis && redis.status === 'ready') {
      await redis.setex(key, 600, otp);
    }
  } catch (e) { }
};

const verifyStudentOtp = async (orgId, email, userOtp) => {
  if (!userOtp) return false;
  const key = `student_reg_otp:${orgId}:${email.toLowerCase().trim()}`;
  let storedOtp = null;
  try {
    if (redis && redis.status === 'ready') {
      storedOtp = await redis.get(key);
    }
  } catch (e) { }
  if (!storedOtp) {
    const mem = studentRegOtpMap.get(key);
    if (mem && mem.expiresAt > Date.now()) {
      storedOtp = mem.otp;
    }
  }
  if (!storedOtp) return false;
  return String(storedOtp).trim() === String(userOtp).trim();
};

const clearStudentOtp = async (orgId, email) => {
  const key = `student_reg_otp:${orgId}:${email.toLowerCase().trim()}`;
  studentRegOtpMap.delete(key);
  try {
    if (redis && redis.status === 'ready') {
      await redis.del(key);
    }
  } catch (e) { }
};

router.post('/students/send-email-otp', async (req, res) => {
  const orgId = getOrgId(req);
  const { email, name } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }

  try {
    // Check if student with this email is already registered in this organization
    const [existing] = await pool.query(
      'SELECT id FROM students WHERE email = ? AND org_id = ?',
      [email.toLowerCase().trim(), orgId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A student with this email address is already registered in your center.' });
    }

    // Generate 6-digit verification code
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await storeStudentOtp(orgId, email, otp);

    // Fetch center name
    let centerName = 'GSFIN Authorized Test Center';
    try {
      const [orgs] = await pool.query('SELECT name FROM organizations WHERE id = ?', [orgId]);
      if (orgs.length > 0 && orgs[0].name) centerName = orgs[0].name;
    } catch (e) { }

    // Dispatch OTP email
    const emailRes = await emailService.sendStudentRegistrationOtp({
      to: email.trim(),
      studentName: name || 'Student',
      otpCode: otp,
      centerName
    });

    if (emailRes?.result?.status === 'logged_to_console') {
      return res.json({
        success: true,
        simulated: true,
        message: `Verification code generated: ${otp} (Logged to server console in dev mode as Resend API key is not configured)`
      });
    }

    if (emailRes && !emailRes.success) {
      return res.status(500).json({
        message: emailRes.error || 'Failed to dispatch email verification code. Please check email configuration.'
      });
    }

    return res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${email}.`
    });
  } catch (error) {
    console.error('Send student registration OTP error:', error);
    res.status(500).json({ message: error.message || 'Failed to send verification code.' });
  }
});

router.post('/students', async (req, res) => {
  const orgId = getOrgId(req);
  const { name, email, phone, password, face_photo, face_descriptor, education_level, institution_name, gender, dob } = req.body;

  if (!name || !email || !email.includes('@')) {
    return res.status(400).json({ message: 'Student full name and a valid email address are required.' });
  }

  try {
    // Ensure table columns exist dynamically
    await ensureStudentsColumns();

    // Check if student with this email is already registered in this organization
    const [existing] = await pool.query(
      'SELECT id FROM students WHERE email = ? AND org_id = ?',
      [email.toLowerCase().trim(), orgId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A student with this email address is already registered in your center.' });
    }

    // Generate clean initial password if not supplied
    const rawPassword = password && password.trim().length > 0
      ? password.trim()
      : 'GSFIN-' + Math.floor(100000 + Math.random() * 900000);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Generate 6-digit OTP verification code valid for 24 hours
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const id = uuidv4();
    const hasInitialFace = !!face_photo;
    const faceStatus = hasInitialFace ? 'registration_successful' : 'waiting_face_enrollment';
    const faceEnrollToken = hasInitialFace ? null : crypto.randomBytes(32).toString('hex');
    const faceEnrollTokenExpiresAt = hasInitialFace ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const insertPayload = {
      id,
      org_id: orgId,
      name,
      email,
      phone: phone || null,
      password: hashedPassword,
      initial_password: rawPassword,
      face_photo: face_photo || null,
      face_descriptor: face_descriptor ? (typeof face_descriptor === 'string' ? face_descriptor : JSON.stringify(face_descriptor)) : null,
      face_status: faceStatus,
      face_enroll_token: faceEnrollToken,
      face_enroll_token_expires_at: faceEnrollTokenExpiresAt,
      otp_code: otpCode,
      otp_expires_at: otpExpiresAt,
      education_level: education_level || null,
      institution_name: institution_name || null,
      gender: gender || null,
      dob: dob || null
    };

    try {
      await pool.query(
        `INSERT INTO students (id, org_id, name, email, phone, password, initial_password, face_photo, face_descriptor, face_status, face_enroll_token, face_enroll_token_expires_at, otp_code, otp_expires_at, education_level, institution_name, gender, dob) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          orgId,
          name,
          email,
          phone || null,
          hashedPassword,
          rawPassword,
          face_photo || null,
          insertPayload.face_descriptor,
          faceStatus,
          faceEnrollToken,
          faceEnrollTokenExpiresAt,
          otpCode,
          otpExpiresAt,
          education_level || null,
          institution_name || null,
          gender || null,
          dob || null
        ]
      );
    } catch (insertErr) {
      if (insertErr.code === 'ER_BAD_FIELD_ERROR' || insertErr.message?.includes('Unknown column')) {
        console.warn('[Students Registration] Primary insert failed with unknown column, auto-healing columns and retrying...', insertErr.message);
        await ensureStudentsColumns();

        const [availableCols] = await pool.query('SHOW COLUMNS FROM students');
        const colSet = new Set((availableCols || []).map(c => (c.Field || c.COLUMN_NAME || '').toLowerCase()));

        const validKeys = Object.keys(insertPayload).filter(k => colSet.has(k.toLowerCase()));
        const colList = validKeys.map(k => `\`${k}\``).join(', ');
        const placeholders = validKeys.map(() => '?').join(', ');
        const values = validKeys.map(k => insertPayload[k]);

        await pool.query(`INSERT INTO students (${colList}) VALUES (${placeholders})`, values);
        console.log('[Students Registration] Registered student successfully with adaptive schema.');
      } else {
        throw insertErr;
      }
    }

    // Clear verification OTP since registration succeeded
    await clearStudentOtp(orgId, email);

    // Fetch center name for email branding
    let centerName = 'GSFIN Authorized Test Center';
    try {
      const [orgs] = await pool.query('SELECT name FROM organizations WHERE id = ?', [orgId]);
      if (orgs.length > 0 && orgs[0].name) centerName = orgs[0].name;
    } catch (orgErr) {
      // Non-fatal
    }

    const enrollUrl = faceEnrollToken ? `${getFrontendUrl(req)}/student-face/enroll?token=${faceEnrollToken}` : null;

    // Dispatch Email 1 (Face Enrollment Request) if face not enrolled yet, otherwise final confirmation
    let emailStatus = { success: false, message: 'Email dispatch pending' };
    try {
      const emailRes = hasInitialFace
        ? await emailService.sendStudentRegistrationConfirmation({
            to: email,
            studentName: name,
            email,
            password: rawPassword,
            otpCode,
            centerName
          })
        : await emailService.sendStudentFaceEnrollmentRequest({
            to: email,
            studentName: name,
            centerName,
            enrollUrl
          });

      if (emailRes?.success) {
        if (emailRes.result?.status === 'logged_to_console') {
          emailStatus = {
            success: false,
            simulated: true,
            message: 'Resend API key is not configured in Admin Settings. Email was logged to server terminal in dev mode.'
          };
        } else {
          emailStatus = {
            success: true,
            message: `Dispatched to ${email} via Resend.`
          };
        }
      } else {
        emailStatus = {
          success: false,
          message: emailRes?.error || 'Email dispatch failed'
        };
      }
    } catch (emailErr) {
      console.error('Student registration email notice (non-fatal):', emailErr.message);
      emailStatus = { success: false, message: emailErr.message };
    }

    res.status(201).json({
      id,
      name,
      email,
      initial_password: rawPassword,
      otp_code: otpCode,
      has_face: hasInitialFace,
      face_status: faceStatus,
      enroll_url: enrollUrl,
      face_photo: face_photo || null,
      email_status: emailStatus,
      message: emailStatus.success
        ? (hasInitialFace
            ? 'Candidate student registered successfully! Confirmation email dispatched.'
            : 'Student registered! Face enrollment request email (3 photos) dispatched to student.')
        : `Candidate student registered! Note: ${emailStatus.message}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/sub-center/students/bulk-import - Bulk import students from CSV and send face enrollment emails
router.post('/students/bulk-import', async (req, res) => {
  const orgId = getOrgId(req);
  const { students: rows } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ message: 'Please provide a non-empty list of students to import.' });
  }
  if (rows.length > 500) {
    return res.status(400).json({ message: 'Maximum 500 students can be imported per CSV upload.' });
  }

  try {
    await ensureStudentsColumns();

    // Fetch existing emails in this org
    const [existingRows] = await pool.query(
      'SELECT LOWER(TRIM(email)) as email FROM students WHERE org_id = ?',
      [orgId]
    );
    const existingEmails = new Set((existingRows || []).map(r => r.email).filter(Boolean));

    // Fetch center name once for email branding
    let centerName = 'GSFIN Authorized Test Center';
    try {
      const [orgs] = await pool.query('SELECT name FROM organizations WHERE id = ?', [orgId]);
      if (orgs.length > 0 && orgs[0].name) centerName = orgs[0].name;
    } catch (_) {}

    const frontendUrl = getFrontendUrl(req);
    const imported = [];
    const skipped = [];
    let emailsSentCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] || {};
      const rowNum = i + 1;
      const name = String(row.name || '').trim();
      const email = String(row.email || '').trim().toLowerCase();
      const phone = row.phone ? String(row.phone).trim() : null;
      const educationLevel = row.education_level ? String(row.education_level).trim() : null;
      const institutionName = row.institution_name ? String(row.institution_name).trim() : null;
      const gender = row.gender ? String(row.gender).trim() : null;
      const dobRaw = row.dob ? String(row.dob).trim() : '';
      const dob = /^\d{4}-\d{2}-\d{2}$/.test(dobRaw) ? dobRaw : null;

      if (!name) {
        skipped.push({ row: rowNum, name: name || '-', email: email || '-', reason: 'Missing student name' });
        continue;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        skipped.push({ row: rowNum, name, email: email || '-', reason: 'Invalid or missing email address' });
        continue;
      }
      if (existingEmails.has(email)) {
        skipped.push({ row: rowNum, name, email, reason: 'Email already registered in your center' });
        continue;
      }

      existingEmails.add(email);

      const id = uuidv4();
      const rawPassword = row.password && String(row.password).trim().length > 0
        ? String(row.password).trim()
        : 'GSFIN-' + Math.floor(100000 + Math.random() * 900000);
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const faceEnrollToken = crypto.randomBytes(32).toString('hex');
      const faceEnrollTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await pool.query(
        `INSERT INTO students (id, org_id, name, email, phone, password, initial_password, face_photo, face_descriptor, face_status, face_enroll_token, face_enroll_token_expires_at, otp_code, otp_expires_at, education_level, institution_name, gender, dob)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'waiting_face_enrollment', ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          orgId,
          name,
          email,
          phone,
          hashedPassword,
          rawPassword,
          faceEnrollToken,
          faceEnrollTokenExpiresAt,
          otpCode,
          otpExpiresAt,
          educationLevel,
          institutionName,
          gender,
          dob
        ]
      );

      let emailSent = false;
      try {
        const enrollUrl = `${frontendUrl}/student-face/enroll?token=${faceEnrollToken}`;
        const emailRes = await emailService.sendStudentFaceEnrollmentRequest({
          to: email,
          studentName: name,
          centerName,
          enrollUrl
        });
        if (emailRes?.success && emailRes.result?.status !== 'logged_to_console') {
          emailSent = true;
          emailsSentCount++;
        }
      } catch (emailErr) {
        console.warn(`Bulk import email failed for ${email}:`, emailErr.message);
      }

      imported.push({ id, name, email, email_sent: emailSent });
    }

    res.status(201).json({
      success: true,
      imported_count: imported.length,
      skipped_count: skipped.length,
      emails_sent_count: emailsSentCount,
      imported,
      skipped,
      message: `Imported ${imported.length} student(s) (${emailsSentCount} face enrollment email(s) sent)${skipped.length > 0 ? `, ${skipped.length} skipped` : ''}.`
    });
  } catch (error) {
    console.error('Bulk import students error:', error);
    res.status(500).json({ message: error.message || 'Failed to bulk import students.' });
  }
});

router.get('/students/:id', async (req, res) => {
  const orgId = getOrgId(req);
  const { id } = req.params;
  try {
    let student;
    try {
      const [students] = await pool.query(
        `SELECT id, org_id, name, email, phone, initial_password, otp_code, face_photo, education_level, institution_name, gender, dob, created_at, updated_at
         FROM students 
         WHERE id = ? AND org_id = ?`,
        [id, orgId]
      );
      if (students.length === 0) {
        return res.status(404).json({ message: 'Candidate student not found in your organization.' });
      }
      student = students[0];
    } catch (queryErr) {
      if (queryErr.code === 'ER_BAD_FIELD_ERROR' || queryErr.message?.includes('Unknown column')) {
        await ensureStudentsColumns();
        const [safeStudents] = await pool.query(
          `SELECT * FROM students WHERE id = ? AND org_id = ?`,
          [id, orgId]
        );
        if (safeStudents.length === 0) {
          return res.status(404).json({ message: 'Candidate student not found in your organization.' });
        }
        student = safeStudents[0];
      } else {
        throw queryErr;
      }
    }

    // Fetch student's exam assignments / history
    const [assignments] = await pool.query(
      `SELECT ea.id as assignment_id, ea.exam_id, ea.status, ea.attempts_used, ea.max_attempts, ea.is_retry_link,
              ea.retry_link_expires_at, ea.created_at, ea.updated_at,
              e.name as exam_name, e.description as exam_description, e.duration_minutes, 70 as passing_score,
              b.id as batch_id, b.status as batch_status, b.opens_at as batch_opens_at, b.closes_at as batch_closes_at,
              c.id as certificate_id, c.cert_number, c.issued_at as certificate_issued_at, c.pdf_url as certificate_url, c.status as certificate_status
       FROM exam_assignments ea
       JOIN exams e ON ea.exam_id = e.id
       JOIN batches b ON ea.batch_id = b.id
       LEFT JOIN certificates c ON ea.id = c.assignment_id
       WHERE ea.student_id = ?
       ORDER BY ea.created_at DESC`,
      [id]
    );

    // Fetch all attempts for these assignments
    const assignmentIds = assignments.map(a => a.assignment_id);
    let attempts = [];
    if (assignmentIds.length > 0) {
      const [attemptRows] = await pool.query(
        `SELECT id, assignment_id, started_at, ended_at, end_reason, result, proctoring_status
         FROM exam_attempts
         WHERE assignment_id IN (?)
         ORDER BY started_at DESC`,
        [assignmentIds]
      );
      attempts = attemptRows;
    }

    // Attach attempts to corresponding assignments
    const enrichedAssignments = assignments.map(a => {
      const aAttempts = attempts.filter(att => att.assignment_id === a.assignment_id);
      return {
        ...a,
        attempts: aAttempts
      };
    });

    // Extract all certificates
    const certificates = assignments
      .filter(a => a.certificate_id || a.certificate_url)
      .map(a => ({
        id: a.certificate_id,
        assignment_id: a.assignment_id,
        cert_number: a.cert_number,
        exam_name: a.exam_name,
        issued_at: a.certificate_issued_at,
        pdf_url: a.certificate_url,
        status: a.certificate_status || 'active'
      }));

    res.json({
      ...student,
      assignments: enrichedAssignments,
      certificates
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/students/:id', async (req, res) => {
  const orgId = getOrgId(req);
  const { id } = req.params;
  const { name, email, phone, password, face_photo, face_descriptor, education_level, institution_name, gender, dob } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Candidate name and email are required.' });
  }

  try {
    await ensureStudentsColumns();
    const [existing] = await pool.query(
      'SELECT id, email, face_status, face_photo, face_enroll_token, face_verify_token FROM students WHERE id = ? AND org_id = ?',
      [id, orgId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Candidate not found in your organization.' });
    }
    const prevStudent = existing[0];
    const emailChanged = prevStudent.email?.toLowerCase().trim() !== email.toLowerCase().trim();

    const [duplicate] = await pool.query(
      'SELECT id FROM students WHERE email = ? AND org_id = ? AND id != ?',
      [email, orgId, id]
    );
    if (duplicate.length > 0) {
      return res.status(400).json({ message: 'Another candidate in your organization is already registered with this email address.' });
    }

    const formattedDob = dob ? dob.slice(0, 10) : null;

    let updateSql = `UPDATE students SET name = ?, email = ?, phone = ?, education_level = ?, institution_name = ?, gender = ?, dob = ?`;
    const params = [name, email, phone || null, education_level || null, institution_name || null, gender || null, formattedDob];

    if (password && password.trim().length > 0) {
      const rawPassword = password.trim();
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      updateSql += `, password = ?, initial_password = ?`;
      params.push(hashedPassword, rawPassword);
    }

    if (face_photo) {
      updateSql += `, face_photo = ?`;
      params.push(face_photo);
      if (face_descriptor) {
        updateSql += `, face_descriptor = ?`;
        params.push(typeof face_descriptor === 'string' ? face_descriptor : JSON.stringify(face_descriptor));
      }
    }

    updateSql += ` WHERE id = ? AND org_id = ?`;
    params.push(id, orgId);

    await pool.query(updateSql, params);

    let emailResent = false;
    let emailStatus = null;
    const effectiveStatus = prevStudent.face_status || (prevStudent.face_photo ? 'registration_successful' : 'waiting_face_enrollment');

    if (emailChanged && effectiveStatus !== 'registration_successful') {
      let centerName = 'GSFIN Authorized Test Center';
      try {
        const [orgs] = await pool.query('SELECT name FROM organizations WHERE id = ?', [orgId]);
        if (orgs.length > 0 && orgs[0].name) centerName = orgs[0].name;
      } catch (_) {}

      try {
        if (effectiveStatus === 'face_verification_pending') {
          const verifyToken = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await pool.query(
            'UPDATE students SET face_verify_token = ?, face_verify_token_expires_at = ? WHERE id = ?',
            [verifyToken, expiresAt, id]
          );
          const verifyUrl = `${getFrontendUrl(req)}/student-face/verify?token=${verifyToken}`;
          const resEmail = await emailService.sendStudentFaceVerificationLink({
            to: email.trim(),
            studentName: name.trim(),
            centerName,
            verifyUrl
          });
          emailResent = !!resEmail?.success;
          emailStatus = resEmail;
        } else {
          const enrollToken = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await pool.query(
            'UPDATE students SET face_enroll_token = ?, face_enroll_token_expires_at = ?, face_status = ? WHERE id = ?',
            [enrollToken, expiresAt, 'waiting_face_enrollment', id]
          );
          const enrollUrl = `${getFrontendUrl(req)}/student-face/enroll?token=${enrollToken}`;
          const resEmail = await emailService.sendStudentFaceEnrollmentRequest({
            to: email.trim(),
            studentName: name.trim(),
            centerName,
            enrollUrl
          });
          emailResent = !!resEmail?.success;
          emailStatus = resEmail;
        }
      } catch (emailErr) {
        console.warn('Auto-resend face link on email edit warning:', emailErr.message);
      }
    }

    res.json({
      email_resent: emailResent,
      email_status: emailStatus,
      message: emailResent
        ? `Candidate details updated and a new face enrollment/verification link was sent to ${email.trim()}.`
        : 'Candidate details updated successfully.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/students/:id/resend-credentials', async (req, res) => {
  const orgId = getOrgId(req);
  const { id } = req.params;

  try {
    await ensureStudentsColumns();
    const [students] = await pool.query(
      `SELECT id, org_id, name, email, initial_password, otp_code, face_photo, face_status, face_enroll_token, face_verify_token
       FROM students 
       WHERE id = ? AND org_id = ?`,
      [id, orgId]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: 'Candidate student not found in your organization.' });
    }

    const student = students[0];
    const effectiveStatus = student.face_status || (student.face_photo ? 'registration_successful' : 'waiting_face_enrollment');

    // Fetch center name
    let centerName = 'GSFIN Authorized Test Center';
    try {
      const [orgs] = await pool.query('SELECT name FROM organizations WHERE id = ?', [orgId]);
      if (orgs.length > 0 && orgs[0].name) centerName = orgs[0].name;
    } catch (orgErr) {
      // Non-fatal
    }

    let emailRes;
    let successMsg = '';

    if (effectiveStatus === 'waiting_face_enrollment') {
      const enrollToken = student.face_enroll_token || crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await pool.query(
        'UPDATE students SET face_enroll_token = ?, face_enroll_token_expires_at = ?, face_status = ? WHERE id = ?',
        [enrollToken, expiresAt, 'waiting_face_enrollment', student.id]
      );
      const enrollUrl = `${getFrontendUrl(req)}/student-face/enroll?token=${enrollToken}`;
      emailRes = await emailService.sendStudentFaceEnrollmentRequest({
        to: student.email,
        studentName: student.name,
        centerName,
        enrollUrl
      });
      successMsg = `Face enrollment request link (3 photos) resent to ${student.email}.`;
    } else if (effectiveStatus === 'face_verification_pending') {
      const verifyToken = student.face_verify_token || crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await pool.query(
        'UPDATE students SET face_verify_token = ?, face_verify_token_expires_at = ?, face_status = ? WHERE id = ?',
        [verifyToken, expiresAt, 'face_verification_pending', student.id]
      );
      const verifyUrl = `${getFrontendUrl(req)}/student-face/verify?token=${verifyToken}`;
      emailRes = await emailService.sendStudentFaceVerificationLink({
        to: student.email,
        studentName: student.name,
        centerName,
        verifyUrl
      });
      successMsg = `Face verification link resent to ${student.email}.`;
    } else {
      // Ensure student has a valid OTP code
      let otpCode = student.otp_code;
      if (!otpCode) {
        otpCode = String(Math.floor(100000 + Math.random() * 900000));
        const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await pool.query(
          'UPDATE students SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
          [otpCode, otpExpiresAt, student.id]
        );
      }

      const passwordToSend = student.initial_password || '(Configured on candidate profile)';
      emailRes = await emailService.sendStudentRegistrationConfirmation({
        to: student.email,
        studentName: student.name,
        email: student.email,
        password: passwordToSend,
        otpCode,
        centerName
      });
      successMsg = `Registration confirmation & credentials resent to ${student.email}.`;
    }

    if (emailRes?.success) {
      if (emailRes.result?.status === 'logged_to_console') {
        return res.json({
          success: false,
          simulated: true,
          message: 'Resend API key is not configured in Admin Settings. Email was logged to server terminal in dev mode.'
        });
      }
      return res.json({
        success: true,
        message: successMsg
      });
    } else {
      return res.status(400).json({
        success: false,
        message: emailRes?.error || 'Failed to dispatch email via Resend.'
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/students/:id', async (req, res) => {
  const orgId = getOrgId(req);
  const { id } = req.params;

  try {
    const [existing] = await pool.query(
      'SELECT id, name FROM students WHERE id = ? AND org_id = ?',
      [id, orgId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Candidate not found in your organization.' });
    }

    const [[inProgress]] = await pool.query(
      'SELECT COUNT(*) as count FROM exam_assignments WHERE student_id = ? AND status = "in_progress"',
      [id]
    );
    if (inProgress.count > 0) {
      return res.status(400).json({ message: 'Cannot delete candidate while they have an exam session in progress.' });
    }

    await pool.query('DELETE FROM students WHERE id = ? AND org_id = ?', [id, orgId]);
    res.json({ message: `Candidate ${existing[0].name} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 2. Wallet & Token Packages Store ───────────────────────────────────────

router.get('/wallet', async (req, res) => {
  const orgId = getOrgId(req);
  try {
    const walletData = await WalletService.getSubCenterWallets(orgId);
    res.json(walletData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/token-packages', async (req, res) => {
  try {
    const [packages] = await pool.query(
      `SELECT * FROM token_packages WHERE status = 'active' ORDER BY price ASC`
    );
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// List token purchase requests for this sub-center
router.get('/token-requests', async (req, res) => {
  const orgId = getOrgId(req);
  try {
    const [requests] = await pool.query(
      `SELECT r.*, tp.name as package_name, u.name as requested_by_name
       FROM token_purchase_requests r
       JOIN token_packages tp ON r.package_id = tp.id
       LEFT JOIN users u ON r.requested_by_user_id = u.id
       WHERE r.org_id = ?
       ORDER BY r.created_at DESC`,
      [orgId]
    );
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit a new token purchase request
router.post('/token-requests', async (req, res) => {
  const orgId = getOrgId(req);
  const { package_id, payment_reference, notes } = req.body;

  if (!package_id) {
    return res.status(400).json({ message: 'Package ID is required.' });
  }

  try {
    const result = await WalletService.createTokenRequest({
      orgId,
      packageId: package_id,
      requestedByUserId: req.user?.id || null,
      paymentReference: payment_reference || null,
      notes: notes || null
    });
    res.status(201).json({
      message: 'Token purchase request submitted successfully. Awaiting administrator payment verification and approval.',
      ...result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/packages/purchase', async (req, res) => {
  const orgId = getOrgId(req);
  const { package_id } = req.body;

  if (!package_id) {
    return res.status(400).json({ message: 'Package ID is required.' });
  }

  try {
    const result = await WalletService.purchaseTokenPackage({ orgId, packageId: package_id });
    res.json({ message: 'Token package purchased successfully.', ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/transactions', async (req, res) => {
  const orgId = getOrgId(req);
  try {
    const [txs] = await pool.query(
      `SELECT tt.*, tp.name as package_name, e.name as exam_name
       FROM token_transactions tt
       LEFT JOIN sub_center_wallets w ON tt.wallet_id = w.id
       LEFT JOIN token_packages tp ON w.package_id = tp.id
       LEFT JOIN batches b ON tt.related_batch_id = b.id
       LEFT JOIN exams e ON b.exam_id = e.id
       WHERE tt.org_id = ?
       ORDER BY tt.created_at DESC`,
      [orgId]
    );
    res.json(txs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 3. Exam Catalog View ───────────────────────────────────────────────────

router.get('/exams', async (req, res) => {
  const orgId = getOrgId(req);
  try {
    const exams = await ExamCatalogService.getAuthorizedExamsForOrg(orgId);
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 4. Batch Operations ────────────────────────────────────────────────────

router.get('/batches', async (req, res) => {
  const orgId = getOrgId(req);
  try {
    let batches = [];
    try {
      [batches] = await pool.query(
        `SELECT b.*, e.name as exam_name, e.duration_minutes, e.max_attempts,
                COALESCE(b.enable_certificate, e.enable_certificate, 1) as enable_certificate,
                COALESCE(b.enable_proctoring, e.enable_proctoring, 1) as enable_proctoring,
                COUNT(ea.id) as student_count,
                SUM(CASE WHEN ea.status = 'passed' THEN 1 ELSE 0 END) as passed_count,
                SUM(CASE WHEN ea.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                SUM(CASE WHEN ea.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count
         FROM batches b
         JOIN exams e ON b.exam_id = e.id
         LEFT JOIN exam_assignments ea ON b.id = ea.batch_id
         WHERE b.org_id = ?
         GROUP BY b.id
         ORDER BY b.created_at DESC`,
        [orgId]
      );
    } catch (_) {
      // Fallback if enable_proctoring is not yet present on batches or exams
      [batches] = await pool.query(
        `SELECT b.*, e.name as exam_name, e.duration_minutes, e.max_attempts,
                COALESCE(b.enable_certificate, e.enable_certificate, 1) as enable_certificate,
                1 as enable_proctoring,
                COUNT(ea.id) as student_count,
                SUM(CASE WHEN ea.status = 'passed' THEN 1 ELSE 0 END) as passed_count,
                SUM(CASE WHEN ea.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                SUM(CASE WHEN ea.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count
         FROM batches b
         JOIN exams e ON b.exam_id = e.id
         LEFT JOIN exam_assignments ea ON b.id = ea.batch_id
         WHERE b.org_id = ?
         GROUP BY b.id
         ORDER BY b.created_at DESC`,
        [orgId]
      );
    }
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/batches/:id', async (req, res) => {
  const orgId = getOrgId(req);
  try {
    let batches = [];
    try {
      [batches] = await pool.query(
        `SELECT b.*, e.name as exam_name, e.duration_minutes,
                COALESCE(b.enable_certificate, e.enable_certificate, 1) as enable_certificate,
                COALESCE(b.enable_proctoring, e.enable_proctoring, 1) as enable_proctoring
         FROM batches b
         JOIN exams e ON b.exam_id = e.id
         WHERE b.id = ? AND b.org_id = ?`,
        [req.params.id, orgId]
      );
    } catch (_) {
      [batches] = await pool.query(
        `SELECT b.*, e.name as exam_name, e.duration_minutes,
                COALESCE(b.enable_certificate, e.enable_certificate, 1) as enable_certificate,
                1 as enable_proctoring
         FROM batches b
         JOIN exams e ON b.exam_id = e.id
         WHERE b.id = ? AND b.org_id = ?`,
        [req.params.id, orgId]
      );
    }
    if (batches.length === 0) return res.status(404).json({ message: 'Batch not found.' });

    const [assignments] = await pool.query(
      `SELECT ea.*, s.name as student_name, s.email as student_email, c.pdf_url as certificate_url
       FROM exam_assignments ea
       JOIN students s ON ea.student_id = s.id
       LEFT JOIN certificates c ON ea.id = c.assignment_id
       WHERE ea.batch_id = ?
       ORDER BY s.name ASC`,
      [req.params.id]
    );

    res.json({ batch: batches[0], assignments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/batches', async (req, res) => {
  const orgId = getOrgId(req);
  const { exam_id, student_ids, opens_at, closes_at, enable_certificate, enable_proctoring } = req.body;

  try {
    const result = await BatchService.createBatch({
      orgId,
      examId: exam_id,
      createdBy: req.user.id,
      studentIds: student_ids,
      opensAt: opens_at || null,
      closesAt: closes_at || null,
      enableCertificate: enable_certificate !== undefined ? enable_certificate : null,
      enableProctoring: enable_proctoring !== undefined ? enable_proctoring : null
    });

    // Dispatches exam details & access links to enrolled candidates asynchronously
    dispatchBatchEnrollmentEmails({
      req,
      orgId,
      examId: exam_id,
      assignments: result.assignments || [],
      opensAt: opens_at || null,
      closesAt: closes_at || null
    }).catch(err => console.error('[Batch Creation Email Dispatch Error]:', err));

    res.status(201).json({
      message: 'Batch created successfully. Exam details and access links dispatched to all enrolled candidates.',
      ...result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/batches/:id', async (req, res) => {
  const orgId = getOrgId(req);
  const { add_student_ids, remove_student_ids, opens_at, closes_at, enable_certificate, enable_proctoring } = req.body;

  try {
    const result = await BatchService.editBatch({
      orgId,
      batchId: req.params.id,
      addStudentIds: add_student_ids || [],
      removeStudentIds: remove_student_ids || [],
      opensAt: opens_at !== undefined ? opens_at : undefined,
      closesAt: closes_at !== undefined ? closes_at : undefined,
      enableCertificate: enable_certificate !== undefined ? enable_certificate : undefined,
      enableProctoring: enable_proctoring !== undefined ? enable_proctoring : undefined
    });

    if (result.newAssignments && result.newAssignments.length > 0) {
      dispatchBatchEnrollmentEmails({
        req,
        orgId,
        examId: result.examId,
        assignments: result.newAssignments,
        opensAt: result.opensAt,
        closesAt: result.closesAt
      }).catch(err => console.error('[Batch Update Email Dispatch Error]:', err));
    }

    res.json({ message: 'Batch updated successfully.', ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/batches/:id/resend-email', async (req, res) => {
  const orgId = getOrgId(req);
  const { student_id, assignment_id } = req.body;

  try {
    const [batches] = await pool.query(
      `SELECT b.*, e.name as exam_name FROM batches b JOIN exams e ON b.exam_id = e.id WHERE b.id = ? AND b.org_id = ?`,
      [req.params.id, orgId]
    );
    if (batches.length === 0) {
      return res.status(404).json({ message: 'Exam batch not found.' });
    }
    const batch = batches[0];

    let assignmentQuery = `SELECT id, student_id FROM exam_assignments WHERE batch_id = ?`;
    const queryParams = [batch.id];
    if (assignment_id) {
      assignmentQuery += ` AND id = ?`;
      queryParams.push(assignment_id);
    } else if (student_id) {
      assignmentQuery += ` AND student_id = ?`;
      queryParams.push(student_id);
    }

    const [assignments] = await pool.query(assignmentQuery, queryParams);
    if (assignments.length === 0) {
      return res.status(404).json({ message: 'No candidate assignments found for this request.' });
    }

    const mappedAssignments = assignments.map(a => ({ assignmentId: a.id, studentId: a.student_id }));

    dispatchBatchEnrollmentEmails({
      req,
      orgId,
      examId: batch.exam_id,
      assignments: mappedAssignments,
      opensAt: batch.opens_at,
      closesAt: batch.closes_at
    }).catch(err => console.error('[Resend Batch Email Error]:', err));

    res.json({
      success: true,
      count: mappedAssignments.length,
      message: `Exam details email successfully sent to ${mappedAssignments.length} candidate(s).`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/batches/:id/cancel', async (req, res) => {
  const orgId = getOrgId(req);
  try {
    const result = await BatchService.cancelBatch({ orgId, batchId: req.params.id });
    res.json({ message: 'Batch cancelled and unstarted tokens refunded.', ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─── 5. Manual Retry & Dedicated Single-Student Retry Link ───────────────────

router.post('/assignments/:id/grant-retry', async (req, res) => {
  const orgId = getOrgId(req);
  try {
    const result = await ExamSessionService.grantManualRetry({
      orgId,
      assignmentId: req.params.id,
      staffUserId: req.user.id
    });
    res.json({ message: 'Technical retry granted successfully.', ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/assignments/:id/retry-link', async (req, res) => {
  const orgId = getOrgId(req);
  const { expires_at } = req.body;

  try {
    const result = await BatchService.createDedicatedRetryLink({
      orgId,
      originalAssignmentId: req.params.id,
      expiresAt: expires_at || null
    });
    res.status(201).json({ message: 'Dedicated single-student retry link created.', ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─── 6. Center Certificates & Student Verifications ──────────────────────────

router.get('/certificates', async (req, res) => {
  let orgId = getOrgId(req);
  if (!orgId && req.user?.role === 'super_admin') {
    try {
      const [firstOrg] = await pool.query('SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1');
      if (firstOrg.length > 0) {
        orgId = firstOrg[0].id;
      }
    } catch (_) {}
  }

  try {
    await ensureCertificatesColumns();

    // Auto-reconcile passed assignments that miss certificates table record
    try {
      const [passedWithoutCert] = await pool.query(
        `SELECT ea.id as assignment_id, s.name as student_name, 
                COALESCE(e.name, pe.name, 'Certification Exam') as exam_name,
                ea.updated_at
         FROM exam_assignments ea
         JOIN students s ON ea.student_id = s.id
         JOIN batches b ON ea.batch_id = b.id
         LEFT JOIN exams e ON ea.exam_id = e.id
         LEFT JOIN public_exams pe ON ea.exam_id = pe.id
         LEFT JOIN certificates c ON ea.id = c.assignment_id
         WHERE (? IS NULL OR b.org_id = ? OR s.org_id = ?) AND ea.status = 'passed' AND c.id IS NULL`,
        [orgId, orgId, orgId]
      );

      for (const missing of passedWithoutCert) {
        try {
          const { pdfUrl, certificateNumber } = await CertificateService.generateParticipationCertificate(
            missing.student_name,
            missing.exam_name,
            missing.updated_at || new Date()
          );
          const certId = uuidv4();
          await pool.query(
            `INSERT INTO certificates (id, assignment_id, cert_number, status, issued_at, pdf_url)
             VALUES (?, ?, ?, 'active', NOW(), ?)
             ON DUPLICATE KEY UPDATE pdf_url = VALUES(pdf_url)`,
            [certId, missing.assignment_id, certificateNumber, pdfUrl]
          );
        } catch (genErr) {
          console.warn('Auto-reconcile certificate generation failed for assignment:', missing.assignment_id, genErr.message);
        }
      }
    } catch (recErr) {
      console.warn('Certificate auto-reconciliation check error:', recErr.message);
    }

    const [certificates] = await pool.query(
      `SELECT c.id, 
              COALESCE(c.cert_number, CONCAT('GSFIN-', UPPER(SUBSTRING(c.id, 1, 8)))) as certificate_number, 
              c.issued_at as issue_date, 
              c.pdf_url,
              s.name as student_name, 
              s.email as student_email,
              COALESCE(e.name, pe.name, 'Certification Exam') as exam_name, 
              b.id as batch_id
       FROM certificates c
       JOIN exam_assignments ea ON c.assignment_id = ea.id
       JOIN students s ON ea.student_id = s.id
       JOIN batches b ON ea.batch_id = b.id
       LEFT JOIN exams e ON b.exam_id = e.id
       LEFT JOIN public_exams pe ON b.exam_id = pe.id
       WHERE (? IS NULL OR b.org_id = ? OR s.org_id = ?)
       ORDER BY c.issued_at DESC`,
      [orgId, orgId, orgId]
    );
    res.json(certificates);
  } catch (error) {
    console.error('Error in GET /sub-center/certificates:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─── 7. Sub-Center Profile & Settings Details ───────────────────────────────

router.get('/profile', async (req, res) => {
  const orgId = getOrgId(req);
  try {
    const [orgs] = await pool.query(`SELECT * FROM organizations WHERE id = ?`, [orgId]);
    const [user] = await pool.query(
      `SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?`,
      [req.user.id]
    );
    res.json({
      user: user[0] || req.user,
      organization: orgs[0] || { id: orgId, name: 'Authorized Sub-Center' }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile', async (req, res) => {
  const orgId = getOrgId(req);
  const { name, phone, organization_name } = req.body;

  try {
    if (name) {
      await pool.query(`UPDATE users SET name = ?, phone = ? WHERE id = ?`, [name, phone || null, req.user.id]);
    }
    if (organization_name && orgId) {
      await pool.query(`UPDATE organizations SET name = ? WHERE id = ?`, [organization_name, orgId]);
    }

    const [orgs] = await pool.query(`SELECT * FROM organizations WHERE id = ?`, [orgId]);
    const [user] = await pool.query(
      `SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?`,
      [req.user.id]
    );

    res.json({
      message: 'Profile updated successfully.',
      user: user[0] || req.user,
      organization: orgs[0] || { id: orgId, name: organization_name || 'Authorized Sub-Center' }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
