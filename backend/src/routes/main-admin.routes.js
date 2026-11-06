import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import emailService from '../services/email.service.js';
import { WalletService } from '../services/wallet.service.js';

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
        (SELECT COALESCE(SUM(tokens_used), 0) FROM sub_center_wallets) as totalTokensConsumed,
        (SELECT COUNT(*) FROM token_purchase_requests WHERE status = 'pending') as pendingTokenRequests
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
        totalTokensConsumed: Number(metrics.totalTokensConsumed) || 0,
        pendingTokenRequests: Number(metrics.pendingTokenRequests) || 0
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
             COALESCE(w.tokens_remaining, 0) as tokens_remaining,
             COALESCE(w.tokens_purchased, 0) as tokens_purchased,
             COALESCE(w.tokens_used, 0) as tokens_used,
             COALESCE(stats.attended_students, 0) as attended_students,
             COALESCE(stats.passed_students, 0) as passed_students,
             COALESCE(stats.total_enrolled, 0) as total_enrolled
      FROM organizations o
      LEFT JOIN (
        SELECT org_id,
               SUM(tokens_remaining) as tokens_remaining,
               SUM(tokens_purchased) as tokens_purchased,
               SUM(tokens_used) as tokens_used
        FROM sub_center_wallets
        GROUP BY org_id
      ) w ON o.id = w.org_id
      LEFT JOIN (
        SELECT b.org_id,
               COUNT(ea.id) as total_enrolled,
               SUM(CASE WHEN ea.attempts_used > 0 OR ea.status IN ('passed', 'failed', 'in_progress') THEN 1 ELSE 0 END) as attended_students,
               SUM(CASE WHEN ea.status = 'passed' THEN 1 ELSE 0 END) as passed_students
        FROM batches b
        JOIN exam_assignments ea ON b.id = ea.batch_id
        GROUP BY b.org_id
      ) stats ON o.id = stats.org_id
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

    const [tokenRequests] = await pool.query(`
      SELECT r.*, tp.name as package_name, u.name as requested_by_name, admin_u.name as approved_by_name
      FROM token_purchase_requests r
      JOIN token_packages tp ON r.package_id = tp.id
      LEFT JOIN users u ON r.requested_by_user_id = u.id
      LEFT JOIN users admin_u ON r.approved_by_user_id = admin_u.id
      WHERE r.org_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.id]);

    res.json({
      organization: org,
      batches: batches || [],
      transactions: transactions || [],
      staff: staff || [],
      tokenRequests: tokenRequests || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/batches/:id', async (req, res) => {
  try {
    const [batches] = await pool.query(
      `SELECT b.*, o.name as org_name, e.name as exam_name, e.duration_minutes 
       FROM batches b
       JOIN organizations o ON b.org_id = o.id
       JOIN exams e ON b.exam_id = e.id
       WHERE b.id = ?`,
      [req.params.id]
    );
    if (batches.length === 0) return res.status(404).json({ message: 'Batch not found.' });

    const [assignments] = await pool.query(
      `SELECT ea.*, s.name as student_name, s.email as student_email, c.pdf_url as certificate_url, c.certificate_number
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

router.post('/organizations', async (req, res) => {
  const { name, contact_email, contact_phone, country, city, institution_type, programs, initial_password } = req.body;
  if (!name || !contact_email) {
    return res.status(400).json({ message: 'Name and contact email are required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const id = uuidv4();
    const programsJson = typeof programs === 'string' ? programs : JSON.stringify(programs || ['CODEX HACCP', 'ISO 22000']);
    await connection.query(
      `INSERT INTO organizations (id, name, contact_email, contact_phone, country, city, institution_type, programs, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [id, name, contact_email, contact_phone || null, country || 'Global Jurisdiction', city || 'International', institution_type || 'Authorized Training Center', programsJson]
    );

    // Auto-provision initial wallet with 0 tokens if not existing
    const walletId = uuidv4();
    await connection.query(
      `INSERT INTO sub_center_wallets (id, org_id, package_id, tokens_purchased, tokens_used, tokens_remaining)
       VALUES (?, ?, 'tp-starter-50', 0, 0, 0)`,
      [walletId, id]
    );

    // Check if user already exists
    const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', [contact_email]);
    let tempPassword = initial_password || `GSFIN-${Math.random().toString(36).slice(-8).toUpperCase()}`;

    if (existingUsers.length === 0) {
      const userId = uuidv4();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      await connection.query(
        `INSERT INTO users (id, role, org_id, name, email, password_hash, phone, status, force_password_change)
         VALUES (?, 'sub_center_staff', ?, ?, ?, ?, ?, 'active', TRUE)`,
        [userId, id, `${name} Administrator`, contact_email, hashedPassword, contact_phone || null]
      );
      await connection.query('INSERT IGNORE INTO user_profiles (user_id) VALUES (?)', [userId]);
    } else {
      await connection.query('UPDATE users SET org_id = ?, role = "sub_center_staff" WHERE email = ?', [id, contact_email]);
    }

    await connection.commit();

    // Send credentials email
    try {
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
      await emailService.sendMail({
        to: contact_email,
        subject: 'Welcome to GSFIN Partner Portal - Your Account Credentials',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1E293B; line-height: 1.6;">
            <h2 style="color: #E31B23; margin-top: 0;">Welcome to GSFIN Partner Network</h2>
            <p>Dear ${name} Team,</p>
            <p>Your Authorized Partner Center has been approved and registered on the GSFIN International Examination & Certification Platform.</p>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 18px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Portal Login URL:</strong> <a href="${loginUrl}" style="color: #2563EB;">${loginUrl}</a></p>
              <p style="margin: 0 0 8px 0;"><strong>Username / Email:</strong> ${contact_email}</p>
              <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="background: #E2E8F0; padding: 3px 8px; border-radius: 4px; font-size: 1.15em; color: #0F172A; font-weight: bold;">${tempPassword}</code></p>
            </div>
            <p>Please log in and update your password upon your first visit. You can now generate exam batches, enroll candidates, and manage wallet tokens.</p>
            <p style="color: #64748B; font-size: 0.85em; margin-top: 30px;">GSFIN Global Standards & Accreditation Authority</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.warn('Failed to dispatch welcome email:', emailErr.message);
    }

    res.status(201).json({ 
      id, 
      message: 'Partner center organization created successfully and credentials provisioned.',
      tempPassword
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create organization error:', error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// Reset Password for Partner Center
router.post('/organizations/:id/reset-password', async (req, res) => {
  const orgId = req.params.id;
  const { password, email: customEmail, send_email = true } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[org]] = await connection.query('SELECT * FROM organizations WHERE id = ?', [orgId]);
    if (!org) {
      await connection.rollback();
      return res.status(404).json({ message: 'Partner center organization not found.' });
    }

    // Find staff user for this org
    let [users] = await connection.query(
      'SELECT id, name, email FROM users WHERE org_id = ? ORDER BY created_at ASC',
      [orgId]
    );

    let targetUser = users[0];
    const targetEmail = customEmail || (targetUser ? targetUser.email : org.contact_email);
    const tempPassword = password || `GSFIN-${Math.random().toString(36).slice(-8).toUpperCase()}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    if (!targetUser) {
      // If no staff user exists yet for this org, create one now
      const newUserId = uuidv4();
      await connection.query(
        `INSERT INTO users (id, role, org_id, name, email, password_hash, phone, status, force_password_change)
         VALUES (?, 'sub_center_staff', ?, ?, ?, ?, ?, 'active', TRUE)`,
        [newUserId, orgId, `${org.name} Administrator`, targetEmail, hashedPassword, org.contact_phone || null]
      );
      await connection.query('INSERT IGNORE INTO user_profiles (user_id) VALUES (?)', [newUserId]);
      targetUser = { id: newUserId, name: `${org.name} Administrator`, email: targetEmail };
    } else {
      // Update existing user password
      await connection.query(
        'UPDATE users SET password_hash = ?, force_password_change = TRUE WHERE id = ?',
        [hashedPassword, targetUser.id]
      );
    }

    await connection.commit();

    if (send_email) {
      try {
        const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
        await emailService.sendMail({
          to: targetEmail,
          subject: 'GSFIN Partner Center - Password Reset Credentials',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1E293B; line-height: 1.6;">
              <h2 style="color: #E31B23; margin-top: 0;">Password Reset Notification</h2>
              <p>Dear ${org.name} Administrator,</p>
              <p>Your password for the GSFIN Partner Center portal has been reset by a system administrator.</p>
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 18px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Portal Login:</strong> <a href="${loginUrl}" style="color: #2563EB;">${loginUrl}</a></p>
                <p style="margin: 0 0 8px 0;"><strong>Account Email:</strong> ${targetEmail}</p>
                <p style="margin: 0;"><strong>New Temporary Password:</strong> <code style="background: #E2E8F0; padding: 3px 8px; border-radius: 4px; font-size: 1.15em; color: #0F172A; font-weight: bold;">${tempPassword}</code></p>
              </div>
              <p>Please log in and update your password immediately in Settings.</p>
              <p style="color: #64748B; font-size: 0.85em; margin-top: 30px;">GSFIN Global Standards & Accreditation Authority</p>
            </div>
          `
        });
      } catch (mailErr) {
        console.warn('Failed to send reset email:', mailErr.message);
      }
    }

    res.json({
      success: true,
      message: `Password reset successfully for ${targetEmail}.`,
      tempPassword,
      email: targetEmail
    });
  } catch (error) {
    await connection.rollback();
    console.error('Reset partner password error:', error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
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

// Take back / refund tokens from a partner center
router.post('/organizations/:id/refund-tokens', async (req, res) => {
  const { amount, reason } = req.body;
  try {
    const result = await WalletService.revokeOrRefundTokens({
      orgId: req.params.id,
      amount,
      reason,
      adminUserId: req.user?.id || null
    });
    res.json({ message: `Successfully refunded ${amount} tokens from ${result.orgName}.`, ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Manually grant bonus/complementary tokens to a partner center
router.post('/organizations/:id/grant-tokens', async (req, res) => {
  const { amount, reason } = req.body;
  try {
    const result = await WalletService.grantTokens({
      orgId: req.params.id,
      amount,
      reason,
      adminUserId: req.user?.id || null
    });
    res.json({ message: `Successfully granted ${amount} tokens to ${result.orgName}.`, ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
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

// ─── 4b. Partner Token Purchase Requests & Approvals ──────────────────────────

router.get('/token-requests', async (req, res) => {
  const { status } = req.query;
  try {
    let query = `
      SELECT r.*, o.name as org_name, o.city as org_city, o.country as org_country,
             tp.name as package_name, u.name as requested_by_name, admin_u.name as approved_by_name
      FROM token_purchase_requests r
      JOIN organizations o ON r.org_id = o.id
      JOIN token_packages tp ON r.package_id = tp.id
      LEFT JOIN users u ON r.requested_by_user_id = u.id
      LEFT JOIN users admin_u ON r.approved_by_user_id = admin_u.id
    `;
    const params = [];
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query += ` WHERE r.status = ?`;
      params.push(status);
    }
    query += ` ORDER BY CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END, r.created_at DESC`;
    const [requests] = await pool.query(query, params);

    const [counts] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM token_purchase_requests
    `);

    res.json({
      requests,
      counts: {
        total: Number(counts[0]?.total || 0),
        pending: Number(counts[0]?.pending || 0),
        approved: Number(counts[0]?.approved || 0),
        rejected: Number(counts[0]?.rejected || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/token-requests/:id/approve', async (req, res) => {
  const { admin_notes, payment_reference } = req.body;
  try {
    const result = await WalletService.approveTokenRequest({
      requestId: req.params.id,
      adminUserId: req.user?.id || null,
      adminNotes: admin_notes || null,
      paymentReference: payment_reference || null
    });
    res.json({ message: 'Token purchase request approved and tokens credited successfully.', ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/token-requests/:id/reject', async (req, res) => {
  const { admin_notes } = req.body;
  try {
    const result = await WalletService.rejectTokenRequest({
      requestId: req.params.id,
      adminUserId: req.user?.id || null,
      adminNotes: admin_notes || null
    });
    res.json({ message: 'Token purchase request rejected.', ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─── 5. Certificate Governance & Audit Trail ──────────────────────────────

router.get('/certificates', async (req, res) => {
  try {
    const [platformCerts] = await pool.query(`
      SELECT 
        c.id,
        COALESCE(c.cert_number, CONCAT('CERT-', UPPER(SUBSTRING(c.id, 1, 8)))) as cert_number,
        s.id as student_id,
        s.name as student_name,
        s.email as email,
        s.phone as phone,
        e.id as exam_id,
        e.name as course_title,
        c.issued_at as issued_at,
        COALESCE(c.status, 'active') as status,
        'platform' as type,
        ea.id as assignment_id,
        ea.status as exam_status,
        ea.attempts_used,
        b.id as batch_id,
        b.status as batch_status,
        COALESCE(o.id, 'org-apex-01') as partner_id,
        COALESCE(o.name, 'Apex Testing Center') as partner_name,
        COALESCE(o.contact_email, 'contact@apexcenter.com') as partner_email,
        COALESCE(o.contact_phone, '+1-555-0199') as partner_phone,
        COALESCE(o.city, 'Dubai') as partner_city,
        COALESCE(o.country, 'UAE') as partner_country,
        COALESCE(o.institution_type, 'Authorized Testing Center') as partner_type
      FROM certificates c
      JOIN exam_assignments ea ON c.assignment_id = ea.id
      JOIN students s ON ea.student_id = s.id
      JOIN exams e ON ea.exam_id = e.id
      LEFT JOIN batches b ON ea.batch_id = b.id
      LEFT JOIN organizations o ON (b.org_id = o.id OR s.org_id = o.id)
    `);

    const [publicCerts] = await pool.query(`
      SELECT 
        c.id,
        CONCAT('CERT-PUB-', UPPER(SUBSTRING(c.id, 1, 8))) as cert_number,
        NULL as student_id,
        c.candidate_name as student_name,
        c.candidate_email as email,
        NULL as phone,
        e.id as exam_id,
        e.title as course_title,
        c.created_at as issued_at,
        'active' as status,
        'public_exam' as type,
        NULL as assignment_id,
        'passed' as exam_status,
        1 as attempts_used,
        NULL as batch_id,
        'closed' as batch_status,
        'org-gsfin-direct' as partner_id,
        'GSFIN Direct Certification' as partner_name,
        'support@gsfin.org' as partner_email,
        '+41-44-668-0000' as partner_phone,
        'Zurich' as partner_city,
        'Switzerland' as partner_country,
        'GSFIN Authority' as partner_type
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

router.get('/certificates/hierarchy', async (req, res) => {
  try {
    // 1. Fetch all partner organizations
    const [organizations] = await pool.query(`
      SELECT id, name, contact_email, contact_phone, country, city, institution_type, status, created_at
      FROM organizations
      ORDER BY name ASC
    `);

    // 2. Fetch all batches (conducted exams) with exam metadata
    const [batches] = await pool.query(`
      SELECT 
        b.id as batch_id,
        b.org_id,
        b.exam_id,
        b.status as batch_status,
        b.opens_at,
        b.closes_at,
        b.created_at,
        e.name as exam_name,
        e.duration_minutes,
        e.max_attempts
      FROM batches b
      JOIN exams e ON b.exam_id = e.id
      ORDER BY b.created_at DESC
    `);

    // 3. Fetch all student assignments in batches with certificate info
    const [assignments] = await pool.query(`
      SELECT 
        ea.id as assignment_id,
        ea.batch_id,
        ea.student_id,
        ea.status as exam_status,
        ea.attempts_used,
        ea.max_attempts,
        ea.created_at as enrolled_at,
        s.name as student_name,
        s.email as student_email,
        s.phone as student_phone,
        c.id as certificate_id,
        COALESCE(c.cert_number, CONCAT('CERT-', UPPER(SUBSTRING(c.id, 1, 8)))) as cert_number,
        c.issued_at,
        COALESCE(c.status, 'active') as cert_status,
        c.pdf_url
      FROM exam_assignments ea
      JOIN students s ON ea.student_id = s.id
      LEFT JOIN certificates c ON ea.id = c.assignment_id
      ORDER BY s.name ASC
    `);

    // 4. Fetch public exam certificates
    const [publicCerts] = await pool.query(`
      SELECT 
        c.id as certificate_id,
        CONCAT('CERT-PUB-', UPPER(SUBSTRING(c.id, 1, 8))) as cert_number,
        c.candidate_name as student_name,
        c.candidate_email as student_email,
        c.created_at as issued_at,
        'active' as cert_status,
        'passed' as exam_status,
        1 as attempts_used,
        1 as max_attempts,
        e.id as exam_id,
        e.title as exam_name,
        e.duration_minutes
      FROM public_exam_issued_certificates c
      JOIN public_exams e ON c.exam_id = e.id
      ORDER BY c.created_at DESC
    `);

    // Map into Partner Center Cards Hierarchy
    const partnersMap = new Map();

    organizations.forEach(org => {
      partnersMap.set(org.id, {
        id: org.id,
        name: org.name,
        email: org.contact_email,
        phone: org.contact_phone || 'N/A',
        city: org.city || 'International',
        country: org.country || 'Global Jurisdiction',
        type: org.institution_type || 'Authorized Testing Center',
        status: org.status || 'active',
        total_exams: 0,
        total_students: 0,
        total_certificates: 0,
        exams: []
      });
    });

    // Map assignments to batches
    const assignmentsByBatch = new Map();
    assignments.forEach(a => {
      if (!assignmentsByBatch.has(a.batch_id)) {
        assignmentsByBatch.set(a.batch_id, []);
      }
      assignmentsByBatch.get(a.batch_id).push(a);
    });

    // Map batches to partners
    batches.forEach(b => {
      let partner = partnersMap.get(b.org_id);
      if (!partner) {
        partner = {
          id: b.org_id,
          name: 'Partner Center (' + b.org_id.slice(0, 8) + ')',
          email: 'partner@center.org',
          phone: 'N/A',
          city: 'International',
          country: 'Global Jurisdiction',
          type: 'Authorized Testing Center',
          status: 'active',
          total_exams: 0,
          total_students: 0,
          total_certificates: 0,
          exams: []
        };
        partnersMap.set(b.org_id, partner);
      }

      const batchStudents = assignmentsByBatch.get(b.batch_id) || [];
      const certCount = batchStudents.filter(s => !!s.cert_number).length;

      partner.total_exams += 1;
      partner.total_students += batchStudents.length;
      partner.total_certificates += certCount;

      partner.exams.push({
        batch_id: b.batch_id,
        exam_id: b.exam_id,
        exam_name: b.exam_name,
        duration_minutes: b.duration_minutes,
        batch_status: b.batch_status,
        opens_at: b.opens_at,
        closes_at: b.closes_at,
        created_at: b.created_at,
        total_students: batchStudents.length,
        total_certificates: certCount,
        students: batchStudents
      });
    });

    // Also include any standalone certificates under their partner
    const [standaloneCerts] = await pool.query(`
      SELECT 
        c.id as certificate_id,
        COALESCE(c.cert_number, CONCAT('CERT-', UPPER(SUBSTRING(c.id, 1, 8)))) as cert_number,
        s.name as student_name,
        s.email as student_email,
        e.name as exam_name,
        c.issued_at,
        COALESCE(c.status, 'active') as cert_status,
        ea.batch_id,
        COALESCE(s.org_id, 'org-apex-01') as org_id
      FROM certificates c
      JOIN exam_assignments ea ON c.assignment_id = ea.id
      JOIN students s ON ea.student_id = s.id
      JOIN exams e ON ea.exam_id = e.id
      WHERE ea.batch_id NOT IN (SELECT id FROM batches)
    `);

    if (standaloneCerts.length > 0) {
      standaloneCerts.forEach(sc => {
        let partner = partnersMap.get(sc.org_id);
        if (!partner) {
          partner = partnersMap.get('org-apex-01') || {
            id: sc.org_id,
            name: 'Apex Testing Center',
            email: 'contact@apexcenter.com',
            phone: '+1-555-0199',
            city: 'Dubai',
            country: 'UAE',
            type: 'Authorized Testing Center',
            status: 'active',
            total_exams: 0,
            total_students: 0,
            total_certificates: 0,
            exams: []
          };
          partnersMap.set(sc.org_id, partner);
        }

        // Find or create exam in partner
        let examObj = partner.exams.find(e => e.exam_name === sc.exam_name);
        if (!examObj) {
          examObj = {
            batch_id: sc.batch_id || 'batch-direct',
            exam_id: 'exam-direct',
            exam_name: sc.exam_name,
            duration_minutes: 60,
            batch_status: 'closed',
            created_at: sc.issued_at,
            total_students: 0,
            total_certificates: 0,
            students: []
          };
          partner.exams.push(examObj);
          partner.total_exams += 1;
        }

        if (!examObj.students.some(s => s.cert_number === sc.cert_number)) {
          examObj.total_students += 1;
          examObj.total_certificates += 1;
          partner.total_students += 1;
          partner.total_certificates += 1;
          examObj.students.push({
            assignment_id: 'assign-' + sc.certificate_id,
            student_name: sc.student_name,
            student_email: sc.student_email,
            student_phone: 'N/A',
            exam_status: 'passed',
            attempts_used: 1,
            max_attempts: 1,
            certificate_id: sc.certificate_id,
            cert_number: sc.cert_number,
            issued_at: sc.issued_at,
            cert_status: sc.cert_status,
            pdf_url: null
          });
        }
      });
    }

    // Add GSFIN Direct Certification if public certs exist
    if (publicCerts.length > 0) {
      const directExamsMap = new Map();
      publicCerts.forEach(pc => {
        if (!directExamsMap.has(pc.exam_id)) {
          directExamsMap.set(pc.exam_id, {
            batch_id: 'direct-' + pc.exam_id,
            exam_id: pc.exam_id,
            exam_name: pc.exam_name,
            duration_minutes: pc.duration_minutes || 60,
            batch_status: 'open',
            created_at: pc.issued_at,
            total_students: 0,
            total_certificates: 0,
            students: []
          });
        }
        const examObj = directExamsMap.get(pc.exam_id);
        examObj.total_students += 1;
        examObj.total_certificates += 1;
        examObj.students.push({
          assignment_id: 'pub-' + pc.certificate_id,
          student_name: pc.student_name,
          student_email: pc.student_email,
          student_phone: 'N/A',
          exam_status: 'passed',
          attempts_used: pc.attempts_used,
          max_attempts: pc.max_attempts,
          certificate_id: pc.certificate_id,
          cert_number: pc.cert_number,
          issued_at: pc.issued_at,
          cert_status: pc.cert_status,
          pdf_url: null
        });
      });

      const directExams = Array.from(directExamsMap.values());
      const totalStudents = directExams.reduce((sum, e) => sum + e.total_students, 0);
      const totalCerts = directExams.reduce((sum, e) => sum + e.total_certificates, 0);

      partnersMap.set('gsfin-direct', {
        id: 'gsfin-direct',
        name: 'GSFIN Global Examination Board',
        email: 'support@gsfin.org',
        phone: '+41-44-668-0000',
        city: 'Zurich / London',
        country: 'International',
        type: 'GSFIN Central Authority',
        status: 'active',
        total_exams: directExams.length,
        total_students: totalStudents,
        total_certificates: totalCerts,
        exams: directExams
      });
    }

    const partnerTree = Array.from(partnersMap.values());
    res.json(partnerTree);
  } catch (error) {
    console.error('Fetch certificate hierarchy error:', error);
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

