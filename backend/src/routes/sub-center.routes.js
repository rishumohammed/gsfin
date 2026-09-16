import express from 'express';
import { v4 as uuidv4 } from 'uuid';
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
  const { name, email, phone } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Student name and email are required.' });
  }

  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO students (id, org_id, name, email, phone) VALUES (?, ?, ?, ?, ?)`,
      [id, orgId, name, email, phone]
    );

    res.status(201).json({ id, message: 'Student registered under your sub-center.' });
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
      `SELECT tt.*, tp.name as package_name
       FROM token_transactions tt
       LEFT JOIN sub_center_wallets w ON tt.wallet_id = w.id
       LEFT JOIN token_packages tp ON w.package_id = tp.id
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
      `SELECT c.id, c.certificate_number, c.issue_date, c.pdf_url, c.verification_url,
              s.name as student_name, s.email as student_email,
              e.name as exam_name, b.id as batch_id
       FROM certificates c
       JOIN exam_assignments ea ON c.assignment_id = ea.id
       JOIN students s ON ea.student_id = s.id
       JOIN batches b ON ea.batch_id = b.id
       JOIN exams e ON b.exam_id = e.id
       WHERE b.org_id = ?
       ORDER BY c.issue_date DESC`,
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
