import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Require main_admin or super_admin role for all routes in this router
router.use(authenticateJWT, authorizeRoles('main_admin', 'super_admin'));

// ─── 1. Real-Time Read-Only Dashboard & Reporting ───────────────────────────

router.get('/dashboard/overview', async (req, res) => {
  try {
    const [[{ totalSubCenters }]] = await pool.query(`SELECT COUNT(*) as totalSubCenters FROM organizations`);
    const [[{ activeBatches }]] = await pool.query(`SELECT COUNT(*) as activeBatches FROM batches WHERE status = 'open'`);
    const [[{ totalTokensSold }]] = await pool.query(`SELECT COALESCE(SUM(tokens_purchased), 0) as totalTokensSold FROM sub_center_wallets`);
    const [[{ totalTokensConsumed }]] = await pool.query(`SELECT COALESCE(SUM(tokens_used), 0) as totalTokensConsumed FROM sub_center_wallets`);

    const [recentBatches] = await pool.query(`
      SELECT b.*, o.name as org_name, e.name as exam_name,
             COUNT(ea.id) as student_count,
             SUM(CASE WHEN ea.status = 'passed' THEN 1 ELSE 0 END) as passed_count,
             SUM(CASE WHEN ea.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
             SUM(CASE WHEN ea.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count
      FROM batches b
      JOIN organizations o ON b.org_id = o.id
      JOIN exams e ON b.exam_id = e.id
      LEFT JOIN exam_assignments ea ON b.id = ea.batch_id
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT 20
    `);

    res.json({
      metrics: {
        totalSubCenters,
        activeBatches,
        totalTokensSold,
        totalTokensConsumed
      },
      recentBatches
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/audit-transactions', async (req, res) => {
  try {
    const [transactions] = await pool.query(`
      SELECT tt.*, o.name as org_name, tp.name as package_name
      FROM token_transactions tt
      JOIN organizations o ON tt.org_id = o.id
      LEFT JOIN sub_center_wallets w ON tt.wallet_id = w.id
      LEFT JOIN token_packages tp ON w.package_id = tp.id
      ORDER BY tt.created_at DESC
      LIMIT 100
    `);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 2. Sub-Center Management ────────────────────────────────────────────────

router.get('/organizations', async (req, res) => {
  try {
    const [orgs] = await pool.query(`
      SELECT o.*, 
             COALESCE(SUM(w.tokens_remaining), 0) as tokens_remaining,
             COALESCE(SUM(w.tokens_purchased), 0) as tokens_purchased,
             COALESCE(SUM(w.tokens_used), 0) as tokens_used
      FROM organizations o
      LEFT JOIN sub_center_wallets w ON o.id = w.org_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/organizations', async (req, res) => {
  const { name, contact_email, contact_phone } = req.body;
  if (!name || !contact_email) {
    return res.status(400).json({ message: 'Name and contact email are required.' });
  }

  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO organizations (id, name, contact_email, contact_phone, status) VALUES (?, ?, ?, ?, 'active')`,
      [id, name, contact_email, contact_phone]
    );

    res.status(201).json({ id, message: 'Sub-center organization created successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/organizations/:id/status', async (req, res) => {
  const { status } = req.body; // 'active' or 'suspended'
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  try {
    await pool.query(`UPDATE organizations SET status = ? WHERE id = ?`, [status, req.params.id]);
    res.json({ message: `Sub-center status updated to ${status}.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 3. Exam Catalog Management ─────────────────────────────────────────────

router.get('/exams', async (req, res) => {
  try {
    const [exams] = await pool.query(`SELECT * FROM exams ORDER BY created_at DESC`);
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/exams', async (req, res) => {
  const { name, description, duration_minutes, max_attempts } = req.body;
  if (!name) return res.status(400).json({ message: 'Exam name is required.' });

  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO exams (id, name, description, duration_minutes, max_attempts, status) VALUES (?, ?, ?, ?, ?, 'active')`,
      [id, name, description, duration_minutes || 60, max_attempts || 1]
    );
    res.status(201).json({ id, message: 'Exam catalog item created.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/exams/:id', async (req, res) => {
  const { name, description, duration_minutes, max_attempts, status } = req.body;
  try {
    await pool.query(
      `UPDATE exams SET name = ?, description = ?, duration_minutes = ?, max_attempts = ?, status = ? WHERE id = ?`,
      [name, description, duration_minutes, max_attempts, status, req.params.id]
    );
    res.json({ message: 'Exam updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 4. Token Package Catalog Management ────────────────────────────────────

router.get('/token-packages', async (req, res) => {
  try {
    const [packages] = await pool.query(`SELECT * FROM token_packages ORDER BY created_at DESC`);
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/token-packages', async (req, res) => {
  const { name, covers, token_count, price } = req.body;
  if (!name || !token_count || !price) {
    return res.status(400).json({ message: 'Name, token_count, and price are required.' });
  }

  try {
    const id = uuidv4();
    const coversJson = JSON.stringify(covers || ["*"]);
    await pool.query(
      `INSERT INTO token_packages (id, name, covers, token_count, price, status) VALUES (?, ?, ?, ?, ?, 'active')`,
      [id, name, coversJson, token_count, price]
    );
    res.status(201).json({ id, message: 'Token package created.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/token-packages/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['active', 'retired'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }
  try {
    await pool.query(`UPDATE token_packages SET status = ? WHERE id = ?`, [status, req.params.id]);
    res.json({ message: `Package status updated to ${status}.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
