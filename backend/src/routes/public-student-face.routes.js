import express from 'express';
import crypto from 'crypto';
import { pool } from '../db/connection.js';
import emailService from '../services/email.service.js';
import { getFrontendUrl } from '../utils/url-helper.js';
import { ensureStudentsColumns } from './sub-center.routes.js';

const router = express.Router();

async function getCenterName(orgId) {
  let centerName = 'GSFIN Authorized Test Center';
  if (!orgId) return centerName;
  try {
    const [orgs] = await pool.query('SELECT name FROM organizations WHERE id = ?', [orgId]);
    if (orgs.length > 0 && orgs[0].name) centerName = orgs[0].name;
  } catch (_) {}
  return centerName;
}

// GET /api/public/student-face/enroll/:token
router.get('/enroll/:token', async (req, res) => {
  const { token } = req.params;
  try {
    await ensureStudentsColumns();
    const [rows] = await pool.query(
      `SELECT id, org_id, name, email, face_status, face_enroll_token_expires_at
       FROM students
       WHERE face_enroll_token = ?`,
      [token]
    );
    if (rows.length === 0) {
      return res.status(404).json({ valid: false, message: 'This face enrollment link is invalid or has already been used.' });
    }
    const student = rows[0];
    if (student.face_enroll_token_expires_at && new Date(student.face_enroll_token_expires_at) < new Date()) {
      return res.status(410).json({ valid: false, message: 'This face enrollment link has expired. Please contact your test center for a new link.' });
    }
    const centerName = await getCenterName(student.org_id);
    res.json({
      valid: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        center_name: centerName,
        face_status: student.face_status || 'waiting_face_enrollment'
      },
      expires_at: student.face_enroll_token_expires_at
    });
  } catch (err) {
    console.error('Validate student face enroll token error:', err);
    res.status(500).json({ valid: false, message: 'Failed to validate enrollment link.' });
  }
});

// POST /api/public/student-face/enroll/:token
router.post('/enroll/:token', async (req, res) => {
  const { token } = req.params;
  const { face_photo, face_photos, face_descriptor } = req.body;

  if (!face_photo || !face_descriptor) {
    return res.status(400).json({ message: '3 face photos and facial biometric descriptor are required.' });
  }

  try {
    await ensureStudentsColumns();
    const [rows] = await pool.query(
      `SELECT id, org_id, name, email, face_enroll_token_expires_at
       FROM students
       WHERE face_enroll_token = ?`,
      [token]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'This face enrollment link is invalid or has already been used.' });
    }
    const student = rows[0];
    if (student.face_enroll_token_expires_at && new Date(student.face_enroll_token_expires_at) < new Date()) {
      return res.status(410).json({ message: 'This face enrollment link has expired. Please request a new link from your test center.' });
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const descriptorStr = typeof face_descriptor === 'string' ? face_descriptor : JSON.stringify(face_descriptor);
    const photosStr = face_photos ? (typeof face_photos === 'string' ? face_photos : JSON.stringify(face_photos)) : null;

    await pool.query(
      `UPDATE students
       SET face_photo = ?,
           face_photos = ?,
           face_descriptor = ?,
           face_status = 'face_verification_pending',
           face_enroll_token = NULL,
           face_enroll_token_expires_at = NULL,
           face_verify_token = ?,
           face_verify_token_expires_at = ?
       WHERE id = ?`,
      [face_photo, photosStr, descriptorStr, verifyToken, verifyExpiresAt, student.id]
    );

    const centerName = await getCenterName(student.org_id);
    const verifyUrl = `${getFrontendUrl(req)}/student-face/verify?token=${verifyToken}`;

    let emailStatus = { success: false, message: 'Email dispatch pending' };
    try {
      const emailRes = await emailService.sendStudentFaceVerificationLink({
        to: student.email,
        studentName: student.name,
        centerName,
        verifyUrl
      });
      emailStatus = emailRes?.success
        ? { success: true, message: `Verification link dispatched to ${student.email}` }
        : { success: false, message: emailRes?.error || 'Email dispatch failed' };
    } catch (emailErr) {
      emailStatus = { success: false, message: emailErr.message };
    }

    res.json({
      success: true,
      face_status: 'face_verification_pending',
      verify_url: verifyUrl,
      email_status: emailStatus,
      message: '3 face photos enrolled successfully! Please check your email for the Face Verification link.'
    });
  } catch (err) {
    console.error('Submit student face enrollment error:', err);
    res.status(500).json({ message: 'Failed to save face enrollment.' });
  }
});

// GET /api/public/student-face/verify/:token
router.get('/verify/:token', async (req, res) => {
  const { token } = req.params;
  try {
    await ensureStudentsColumns();
    const [rows] = await pool.query(
      `SELECT id, org_id, name, email, face_photo, face_status, face_verify_token_expires_at
       FROM students
       WHERE face_verify_token = ?`,
      [token]
    );
    if (rows.length === 0) {
      return res.status(404).json({ valid: false, message: 'This face verification link is invalid or has already been completed.' });
    }
    const student = rows[0];
    if (student.face_verify_token_expires_at && new Date(student.face_verify_token_expires_at) < new Date()) {
      return res.status(410).json({ valid: false, message: 'This face verification link has expired. Please contact your test center.' });
    }
    const centerName = await getCenterName(student.org_id);
    res.json({
      valid: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        center_name: centerName,
        face_photo: student.face_photo || null,
        face_status: student.face_status || 'face_verification_pending'
      },
      expires_at: student.face_verify_token_expires_at
    });
  } catch (err) {
    console.error('Validate student face verify token error:', err);
    res.status(500).json({ valid: false, message: 'Failed to validate verification link.' });
  }
});

// POST /api/public/student-face/verify/:token
router.post('/verify/:token', async (req, res) => {
  const { token } = req.params;
  const { live_descriptor } = req.body;

  if (!live_descriptor) {
    return res.status(400).json({ matched: false, message: 'Live face biometric capture is required for verification.' });
  }

  try {
    await ensureStudentsColumns();
    const [rows] = await pool.query(
      `SELECT id, org_id, name, email, initial_password, otp_code, face_descriptor, face_verify_token_expires_at
       FROM students
       WHERE face_verify_token = ?`,
      [token]
    );
    if (rows.length === 0) {
      return res.status(404).json({ matched: false, message: 'This face verification link is invalid or has already been completed.' });
    }
    const student = rows[0];
    if (student.face_verify_token_expires_at && new Date(student.face_verify_token_expires_at) < new Date()) {
      return res.status(410).json({ matched: false, message: 'This face verification link has expired.' });
    }

    let matched = false;
    let confidence = 0;

    if (student.face_descriptor) {
      const refVec = typeof student.face_descriptor === 'string' ? JSON.parse(student.face_descriptor) : student.face_descriptor;
      const liveVec = typeof live_descriptor === 'string' ? JSON.parse(live_descriptor) : live_descriptor;
      if (Array.isArray(refVec) && Array.isArray(liveVec) && refVec.length === liveVec.length && refVec.length > 0) {
        let sumSq = 0;
        for (let i = 0; i < refVec.length; i++) {
          sumSq += Math.pow(refVec[i] - liveVec[i], 2);
        }
        const dist = Math.sqrt(sumSq);
        confidence = Math.max(10, Math.min(99, Math.round((1 - Math.min(1, dist / 0.70)) * 100)));
        if (dist <= 0.45) {
          matched = true;
        }
      }
    }

    if (!matched) {
      return res.status(400).json({
        matched: false,
        confidence,
        message: 'Face verification failed. Your live face did not match your enrolled 3-pose photos. Please try again in good lighting or re-enroll your 3 face photos.'
      });
    }

    let otpCode = student.otp_code;
    if (!otpCode) {
      otpCode = String(Math.floor(100000 + Math.random() * 900000));
    }
    const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE students
       SET face_status = 'registration_successful',
           face_verify_token = NULL,
           face_verify_token_expires_at = NULL,
           otp_code = ?,
           otp_expires_at = ?
       WHERE id = ?`,
      [otpCode, otpExpiresAt, student.id]
    );

    const centerName = await getCenterName(student.org_id);
    const passwordToSend = student.initial_password || '(Configured on candidate profile)';

    let emailStatus = { success: false, message: 'Email dispatch pending' };
    try {
      const emailRes = await emailService.sendStudentRegistrationConfirmation({
        to: student.email,
        studentName: student.name,
        email: student.email,
        password: passwordToSend,
        otpCode,
        centerName
      });
      emailStatus = emailRes?.success
        ? { success: true, message: `Registration confirmation dispatched to ${student.email}` }
        : { success: false, message: emailRes?.error || 'Email dispatch failed' };
    } catch (emailErr) {
      emailStatus = { success: false, message: emailErr.message };
    }

    res.json({
      matched: true,
      confidence,
      face_status: 'registration_successful',
      email_status: emailStatus,
      message: 'Face verified successfully! Your registration is complete and a confirmation email has been sent.'
    });
  } catch (err) {
    console.error('Verify student face error:', err);
    res.status(500).json({ matched: false, message: 'Failed to verify face.' });
  }
});

// POST /api/public/student-face/re-enroll/:token - Allow student to redo 3-pose enrollment from verify page
router.post('/re-enroll/:token', async (req, res) => {
  const { token } = req.params;
  try {
    await ensureStudentsColumns();
    const [rows] = await pool.query(
      `SELECT id, face_verify_token_expires_at
       FROM students
       WHERE face_verify_token = ?`,
      [token]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Invalid or expired verification session.' });
    }
    const student = rows[0];
    const enrollToken = crypto.randomBytes(32).toString('hex');
    const enrollExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE students
       SET face_status = 'waiting_face_enrollment',
           face_enroll_token = ?,
           face_enroll_token_expires_at = ?,
           face_verify_token = NULL,
           face_verify_token_expires_at = NULL
       WHERE id = ?`,
      [enrollToken, enrollExpiresAt, student.id]
    );

    res.json({ success: true, enroll_token: enrollToken });
  } catch (err) {
    console.error('Re-enroll student face error:', err);
    res.status(500).json({ message: 'Failed to reset face enrollment.' });
  }
});

export default router;

