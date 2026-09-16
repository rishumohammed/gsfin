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
    const [[metrics]] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM organizations) as totalSubCenters,
        (SELECT COUNT(*) FROM batches WHERE status = 'open') as activeBatches,
        (SELECT COALESCE(SUM(tokens_purchased), 0) FROM sub_center_wallets) as totalTokensSold,
        (SELECT COALESCE(SUM(tokens_used), 0) FROM sub_center_wallets) as totalTokensConsumed
    `);

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
        totalSubCenters: Number(metrics.totalSubCenters) || 0,
        activeBatches: Number(metrics.activeBatches) || 0,
        totalTokensSold: Number(metrics.totalTokensSold) || 0,
        totalTokensConsumed: Number(metrics.totalTokensConsumed) || 0
      },
      recentBatches
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/reports/analytics', async (req, res) => {
  try {
    // 1. Overview KPIs
    const [[overview]] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM public_exams WHERE deleted_at IS NULL) as total_exams,
        (SELECT COUNT(*) FROM public_exam_attempts) as total_attempts,
        (SELECT COUNT(*) FROM public_exam_attempts WHERE is_passed = TRUE) as passed_attempts,
        (SELECT COUNT(*) FROM public_exam_issued_certificates WHERE revoked_at IS NULL) as total_certificates,
        (SELECT COUNT(*) FROM qualifications WHERE deleted_at IS NULL) as total_qualifications,
        (SELECT COUNT(*) FROM organizations) as total_sub_centers,
        (SELECT COALESCE(SUM(tokens_purchased), 0) FROM sub_center_wallets) as tokens_purchased,
        (SELECT COALESCE(SUM(tokens_used), 0) FROM sub_center_wallets) as tokens_used,
        (SELECT COUNT(*) FROM proctoring_events) as proctoring_incidents
    `);

    // 2. Exam performance breakdown
    const [examBreakdown] = await pool.query(`
      SELECT e.id, e.title, e.category_id,
             COUNT(pea.id) as total_attempts,
             SUM(CASE WHEN pea.is_passed = 1 THEN 1 ELSE 0 END) as passed_count,
             SUM(CASE WHEN pea.is_passed = 0 THEN 1 ELSE 0 END) as failed_count,
             ROUND(AVG(pea.score_percentage), 1) as avg_score
      FROM public_exams e
      LEFT JOIN public_exam_attempts pea ON e.id = pea.exam_id
      WHERE e.deleted_at IS NULL
      GROUP BY e.id
      ORDER BY total_attempts DESC
      LIMIT 15
    `);

    // 3. Sub-center partner breakdown
    const [partnerBreakdown] = await pool.query(`
      SELECT o.id, o.name, o.code, o.city, o.country,
             COALESCE(SUM(w.tokens_remaining), 0) as tokens_remaining,
             COALESCE(SUM(w.tokens_purchased), 0) as tokens_purchased,
             COALESCE(SUM(w.tokens_used), 0) as tokens_used,
             (SELECT COUNT(*) FROM batches b WHERE b.org_id = o.id) as batch_count
      FROM organizations o
      LEFT JOIN sub_center_wallets w ON o.id = w.org_id
      GROUP BY o.id
      ORDER BY tokens_purchased DESC
      LIMIT 15
    `);

    // 4. Certificates by qualification standard
    const [certBreakdown] = await pool.query(`
      SELECT c.qualification_name,
             COUNT(c.id) as total_issued,
             SUM(CASE WHEN c.revoked_at IS NULL THEN 1 ELSE 0 END) as active_count,
             SUM(CASE WHEN c.revoked_at IS NOT NULL THEN 1 ELSE 0 END) as revoked_count
      FROM public_exam_issued_certificates c
      GROUP BY c.qualification_name
      ORDER BY total_issued DESC
    `);

    // 5. Monthly Exam Attempt Velocity
    const [monthlyTrend] = await pool.query(`
      SELECT 
        DATE_FORMAT(completed_at, '%b %Y') as month_label,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_passed = 1 THEN 1 ELSE 0 END) as passed_attempts
      FROM public_exam_attempts
      WHERE completed_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(completed_at, '%Y-%m'), DATE_FORMAT(completed_at, '%b %Y')
      ORDER BY MIN(completed_at) ASC
    `);

    res.json({
      overview: {
        total_exams: Number(overview.total_exams) || 0,
        total_attempts: Number(overview.total_attempts) || 0,
        passed_attempts: Number(overview.passed_attempts) || 0,
        pass_rate: overview.total_attempts > 0 
          ? Math.round((overview.passed_attempts / overview.total_attempts) * 100) 
          : 0,
        total_certificates: Number(overview.total_certificates) || 0,
        total_qualifications: Number(overview.total_qualifications) || 0,
        total_sub_centers: Number(overview.total_sub_centers) || 0,
        tokens_purchased: Number(overview.tokens_purchased) || 0,
        tokens_used: Number(overview.tokens_used) || 0,
        proctoring_incidents: Number(overview.proctoring_incidents) || 0
      },
      examBreakdown,
      partnerBreakdown,
      certBreakdown,
      monthlyTrend
    });
  } catch (error) {
    console.error('Error fetching analytics report:', error);
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

router.get('/organizations/:id', async (req, res) => {
  try {
    const [[org]] = await pool.query(`
      SELECT o.*, 
             COALESCE(SUM(w.tokens_remaining), 0) as tokens_remaining,
             COALESCE(SUM(w.tokens_purchased), 0) as tokens_purchased,
             COALESCE(SUM(w.tokens_used), 0) as tokens_used
      FROM organizations o
      LEFT JOIN sub_center_wallets w ON o.id = w.org_id
      WHERE o.id = ?
      GROUP BY o.id
    `, [req.params.id]);

    if (!org) {
      return res.status(404).json({ message: 'Partner center organization not found.' });
    }

    const [batches] = await pool.query(`
      SELECT b.*, e.name as exam_name,
             COUNT(ea.id) as student_count,
             SUM(CASE WHEN ea.status = 'passed' THEN 1 ELSE 0 END) as passed_count,
             SUM(CASE WHEN ea.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
             SUM(CASE WHEN ea.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count
      FROM batches b
      JOIN exams e ON b.exam_id = e.id
      LEFT JOIN exam_assignments ea ON b.id = ea.batch_id
      WHERE b.org_id = ?
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `, [req.params.id]);

    const [transactions] = await pool.query(`
      SELECT tt.*, tp.name as package_name
      FROM token_transactions tt
      LEFT JOIN sub_center_wallets w ON tt.wallet_id = w.id
      LEFT JOIN token_packages tp ON w.package_id = tp.id
      WHERE tt.org_id = ?
      ORDER BY tt.created_at DESC
      LIMIT 50
    `, [req.params.id]);

    const [staff] = await pool.query(`
      SELECT id, name, email, role, status, IF(status = 'active', 1, 0) as is_active, created_at
      FROM users
      WHERE org_id = ?
      ORDER BY created_at DESC
    `, [req.params.id]);

    res.json({
      organization: org,
      batches: batches || [],
      transactions: transactions || [],
      staff: staff || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/organizations', async (req, res) => {
  const { name, contact_email, contact_phone, country, city, institution_type, programs } = req.body;
  if (!name || !contact_email) {
    return res.status(400).json({ message: 'Name and contact email are required.' });
  }

  try {
    const id = uuidv4();
    const programsJson = typeof programs === 'string' ? programs : JSON.stringify(programs || ['CODEX HACCP', 'ISO 22000']);
    await pool.query(
      `INSERT INTO organizations (id, name, contact_email, contact_phone, country, city, institution_type, programs, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [id, name, contact_email, contact_phone || null, country || 'Global Jurisdiction', city || 'International', institution_type || 'Authorized Training Center', programsJson]
    );

    res.status(201).json({ id, message: 'Partner center organization created successfully.' });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/organizations/:id', async (req, res) => {
  const { name, contact_email, contact_phone, country, city, institution_type, programs, status } = req.body;
  if (!name || !contact_email) {
    return res.status(400).json({ message: 'Name and contact email are required.' });
  }

  try {
    const programsJson = typeof programs === 'string' ? programs : JSON.stringify(programs || ['CODEX HACCP']);
    await pool.query(
      `UPDATE organizations SET name = ?, contact_email = ?, contact_phone = ?, country = ?, city = ?, institution_type = ?, programs = ?, status = ? WHERE id = ?`,
      [name, contact_email, contact_phone || null, country || 'Global Jurisdiction', city || 'International', institution_type || 'Authorized Training Center', programsJson, status || 'active', req.params.id]
    );
    res.json({ message: 'Partner center updated successfully.' });
  } catch (error) {
    console.error('Update organization error:', error);
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

router.delete('/organizations/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM organizations WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Partner center deleted successfully.' });
  } catch (error) {
    console.error('Delete organization error:', error);
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

// ─── 5. Certificate Governance & Audit Trail ──────────────────────────────

router.get('/certificates', async (req, res) => {
  try {
    const [platformCerts] = await pool.query(`
      SELECT 
        c.id,
        COALESCE(c.cert_number, CONCAT('CERT-', UPPER(SUBSTRING(c.id, 1, 8)))) as cert_number,
        s.name as student_name,
        s.email as email,
        e.name as course_title,
        c.issued_at as issued_at,
        COALESCE(c.status, 'active') as status,
        'platform' as type
      FROM certificates c
      JOIN exam_assignments ea ON c.assignment_id = ea.id
      JOIN students s ON ea.student_id = s.id
      JOIN exams e ON ea.exam_id = e.id
    `);

    const [publicCerts] = await pool.query(`
      SELECT 
        c.id,
        CONCAT('CERT-PUB-', UPPER(SUBSTRING(c.id, 1, 8))) as cert_number,
        c.candidate_name as student_name,
        c.candidate_email as email,
        e.name as course_title,
        c.created_at as issued_at,
        'active' as status,
        'public_exam' as type
      FROM public_exam_issued_certificates c
      JOIN public_exams e ON c.exam_id = e.id
    `);

    const allCerts = [...platformCerts, ...publicCerts].sort(
      (a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
    );

    res.json(allCerts);
  } catch (error) {
    console.error('Fetch admin certificates error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/certificates/:certNumber/revoke', async (req, res) => {
  try {
    await pool.query(
      `UPDATE certificates SET status = 'revoked' WHERE cert_number = ? OR id = ?`,
      [req.params.certNumber, req.params.certNumber]
    );
    res.json({ message: 'Certificate revoked successfully.' });
  } catch (error) {
    console.error('Revoke certificate error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/certificates/:certNumber/reissue', async (req, res) => {
  try {
    const newCertNumber = `CERT-RE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await pool.query(
      `UPDATE certificates SET status = 'active', cert_number = ? WHERE cert_number = ? OR id = ?`,
      [newCertNumber, req.params.certNumber, req.params.certNumber]
    );
    res.json({ message: 'Certificate re-issued successfully.', newCertNumber });
  } catch (error) {
    console.error('Re-issue certificate error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

