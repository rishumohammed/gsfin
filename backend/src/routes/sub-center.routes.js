import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { pool } from '../db/connection.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import { WalletService } from '../services/wallet.service.js';
import { BatchService } from '../services/batch.service.js';
import { ExamSessionService } from '../services/exam-session.service.js';

const router = express.Router();

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

router.post('/students', async (req, res) => {
  const orgId = getOrgId(req);
  const { name, email, phone, password, education_level, institution_name, gender, dob } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Student full name and email address are required.' });
  }

  try {
    // Ensure column existence dynamically so insertion never fails if migration hasn't run yet
    try {
      await pool.query(`
        ALTER TABLE students
          ADD COLUMN IF NOT EXISTS password VARCHAR(255) NULL AFTER email,
          ADD COLUMN IF NOT EXISTS education_level VARCHAR(100) NULL AFTER phone,
          ADD COLUMN IF NOT EXISTS institution_name VARCHAR(255) NULL AFTER education_level,
          ADD COLUMN IF NOT EXISTS gender VARCHAR(50) NULL AFTER institution_name,
          ADD COLUMN IF NOT EXISTS dob DATE NULL AFTER gender
      `);
    } catch (e) {
      // Ignore if columns exist or ALTER unsupported
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    const id = uuidv4();
    await pool.query(
      `INSERT INTO students (id, org_id, name, email, phone, password, education_level, institution_name, gender, dob) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        orgId, 
        name, 
        email, 
        phone || null, 
        hashedPassword, 
        education_level || null, 
        institution_name || null, 
        gender || null, 
        dob || null
      ]
    );

    res.status(201).json({ id, message: 'Candidate student registered under your sub-center.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/students/:id', async (req, res) => {
  const orgId = getOrgId(req);
  const { id } = req.params;
  try {
    const [students] = await pool.query(
      `SELECT id, org_id, name, email, phone, education_level, institution_name, gender, dob, created_at, updated_at
       FROM students 
       WHERE id = ? AND org_id = ?`,
      [id, orgId]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: 'Candidate student not found in your organization.' });
    }

    const student = students[0];

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
  const { name, email, phone, password, education_level, institution_name, gender, dob } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Candidate name and email are required.' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM students WHERE id = ? AND org_id = ?',
      [id, orgId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Candidate not found in your organization.' });
    }

    const [duplicate] = await pool.query(
      'SELECT id FROM students WHERE email = ? AND org_id = ? AND id != ?',
      [email, orgId, id]
    );
    if (duplicate.length > 0) {
      return res.status(400).json({ message: 'Another candidate in your organization is already registered with this email address.' });
    }

    const formattedDob = dob ? dob.slice(0, 10) : null;

    if (password && password.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE students 
         SET name = ?, email = ?, phone = ?, password = ?, education_level = ?, institution_name = ?, gender = ?, dob = ?
         WHERE id = ? AND org_id = ?`,
        [name, email, phone || null, hashedPassword, education_level || null, institution_name || null, gender || null, formattedDob, id, orgId]
      );
    } else {
      await pool.query(
        `UPDATE students 
         SET name = ?, email = ?, phone = ?, education_level = ?, institution_name = ?, gender = ?, dob = ?
         WHERE id = ? AND org_id = ?`,
        [name, email, phone || null, education_level || null, institution_name || null, gender || null, formattedDob, id, orgId]
      );
    }

    res.json({ message: 'Candidate details updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
  try {
    const [exams] = await pool.query(`SELECT * FROM exams WHERE status = 'active' ORDER BY name ASC`);
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 4. Batch Operations ────────────────────────────────────────────────────

router.get('/batches', async (req, res) => {
  const orgId = getOrgId(req);
  try {
    const [batches] = await pool.query(
      `SELECT b.*, e.name as exam_name, e.duration_minutes, e.max_attempts,
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
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/batches/:id', async (req, res) => {
  const orgId = getOrgId(req);
  try {
    const [batches] = await pool.query(
      `SELECT b.*, e.name as exam_name, e.duration_minutes 
       FROM batches b
       JOIN exams e ON b.exam_id = e.id
       WHERE b.id = ? AND b.org_id = ?`,
      [req.params.id, orgId]
    );
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
  const { exam_id, student_ids, opens_at, closes_at } = req.body;

  try {
    const result = await BatchService.createBatch({
      orgId,
      examId: exam_id,
      createdBy: req.user.id,
      studentIds: student_ids,
      opensAt: opens_at || null,
      closesAt: closes_at || null
    });
    res.status(201).json({ message: 'Batch created successfully.', ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/batches/:id', async (req, res) => {
  const orgId = getOrgId(req);
  const { add_student_ids, remove_student_ids } = req.body;

  try {
    const result = await BatchService.editBatch({
      orgId,
      batchId: req.params.id,
      addStudentIds: add_student_ids || [],
      removeStudentIds: remove_student_ids || []
    });
    res.json({ message: 'Batch updated successfully.', ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
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
  const orgId = getOrgId(req);
  try {
    const [certificates] = await pool.query(
      `SELECT c.id, c.cert_number as certificate_number, c.issued_at as issue_date, c.pdf_url,
              s.name as student_name, s.email as student_email,
              e.name as exam_name, b.id as batch_id
       FROM certificates c
       JOIN exam_assignments ea ON c.assignment_id = ea.id
       JOIN students s ON ea.student_id = s.id
       JOIN batches b ON ea.batch_id = b.id
       JOIN exams e ON b.exam_id = e.id
       WHERE b.org_id = ?
       ORDER BY c.issued_at DESC`,
      [orgId]
    );
    res.json(certificates);
  } catch (error) {
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
