import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';
import { authenticateJWT, authorizeRoles, requirePermission } from '../middleware/auth.js';
import emailService from '../services/email.service.js';

const router = express.Router();

// Helper to log audit actions
const logAudit = async (connection, userId, action, target, metadata) => {
  try {
    await connection.query(
      'INSERT INTO audit_logs (id, user_id, action, target, metadata) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), userId, action, target, JSON.stringify(metadata || {})]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

const SYSTEM_ROLES = [
  'main_admin', 'super_admin', 'sub_admin', 'crm_agent', 
  'placement_coordinator', 'finance_staff', 
  'exam_manager', 'lms_user'
];

// Ensure required users columns and audit_logs table exist
export const ensureSystemUsersColumns = async () => {
  try {
    // 1. Check if permissions_json column exists on users, add if not
    const [cols] = await pool.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'permissions_json'"
    );
    if (!cols || cols.length === 0) {
      try {
        await pool.query("ALTER TABLE users ADD COLUMN permissions_json JSON DEFAULT NULL AFTER status");
        console.log('[Auto-Heal] Added permissions_json column (JSON) to users table.');
      } catch (alterErr) {
        await pool.query("ALTER TABLE users ADD COLUMN permissions_json TEXT DEFAULT NULL AFTER status");
        console.log('[Auto-Heal] Added permissions_json column (TEXT) to users table.');
      }
    }

    // 2. Check if deleted_at column exists on users, add if not
    const [delCols] = await pool.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'deleted_at'"
    );
    if (!delCols || delCols.length === 0) {
      try {
        await pool.query("ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL AFTER updated_at");
        console.log('[Auto-Heal] Added deleted_at column to users table.');
      } catch (alterErr) {
        console.warn('[Auto-Heal] deleted_at column add warning:', alterErr.message);
      }
    }

    // 3. Ensure audit_logs table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NULL,
        action VARCHAR(100) NOT NULL,
        target VARCHAR(255) NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('[Auto-Heal] Error in ensureSystemUsersColumns:', err);
  }
};

// 1. Get all system users
router.get('/', authenticateJWT, authorizeRoles('super_admin', 'main_admin'), async (req, res) => {
  try {
    let users = [];
    try {
      const [rows] = await pool.query(`
        SELECT id, name, email, phone, role, status, last_login_at, created_at, permissions_json 
        FROM users 
        WHERE role IN ('main_admin', 'super_admin', 'sub_admin', 'crm_agent', 'placement_coordinator', 'finance_staff', 'exam_manager', 'lms_user')
        ORDER BY created_at DESC
      `);
      users = rows;
    } catch (queryErr) {
      console.warn('[System Users] Primary query failed, auto-healing columns and retrying...', queryErr.message);
      await ensureSystemUsersColumns();
      try {
        const [retryRows] = await pool.query(`
          SELECT id, name, email, phone, role, status, last_login_at, created_at, permissions_json 
          FROM users 
          WHERE role IN ('main_admin', 'super_admin', 'sub_admin', 'crm_agent', 'placement_coordinator', 'finance_staff', 'exam_manager', 'lms_user')
          ORDER BY created_at DESC
        `);
        users = retryRows;
      } catch (fallbackErr) {
        const [safeRows] = await pool.query(`
          SELECT id, name, email, phone, role, status, last_login_at, created_at, NULL as permissions_json 
          FROM users 
          WHERE role IN ('main_admin', 'super_admin', 'sub_admin', 'crm_agent', 'placement_coordinator', 'finance_staff', 'exam_manager', 'lms_user')
          ORDER BY created_at DESC
        `);
        users = safeRows;
      }
    }
    
    // Calculate dashboard stats
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const superAdmin = users.filter(u => u.role === 'super_admin' || u.role === 'main_admin').length;
    const subAdmin = users.filter(u => u.role === 'sub_admin').length;
    const crm = users.filter(u => u.role === 'crm_agent').length;

    res.json({ 
      users,
      stats: { total, active, superAdmin, subAdmin, crm }
    });
  } catch (error) {
    console.error('[System Users] Error fetching system users:', error);
    res.status(500).json({ message: error.message });
  }
});

// 2. Create System User
router.post('/', authenticateJWT, authorizeRoles('super_admin', 'main_admin'), async (req, res) => {
  const { name, email, phone, role, permissions_json, password } = req.body;
  
  if (!SYSTEM_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Invalid system role specified' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const id = uuidv4();
    const plainPassword = password || Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    const permsStr = permissions_json ? JSON.stringify(permissions_json) : null;

    await connection.query(
      `INSERT INTO users (id, name, email, phone, role, status, password_hash, permissions_json, force_password_change) 
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, TRUE)`,
      [id, name, email, phone, role, hashedPassword, permsStr]
    );

    await connection.query('INSERT INTO user_profiles (user_id) VALUES (?)', [id]);

    await logAudit(connection, req.user.id, 'CREATE_USER', email, { role, permissions_json });

    await connection.commit();

    // Optionally send email with plainPassword
    try {
      await emailService.sendMail({
        to: email,
        subject: 'Your System Account has been created',
        html: `
          <h3>Welcome to the Team, ${name}!</h3>
          <p>Your account has been created with the role: <strong>${role}</strong>.</p>
          <p>Your temporary password is: <strong>${plainPassword}</strong></p>
          <p>Please log in and change your password immediately.</p>
        `
      });
    } catch (e) {
      console.warn('Failed to send welcome email:', e.message);
    }

    res.status(201).json({ message: 'System user created successfully', id });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// 3. Update System User
router.put('/:id', authenticateJWT, authorizeRoles('super_admin', 'main_admin'), async (req, res) => {
  const { name, email, phone, role, permissions_json } = req.body;
  const targetId = req.params.id;

  if (role && !SYSTEM_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Invalid system role specified' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT email, role FROM users WHERE id = ? AND role IN (?)', [targetId, SYSTEM_ROLES]);
    if (existing.length === 0) return res.status(404).json({ message: 'System user not found' });

    // Security check: cannot demote the last active administrator
    if (role && role !== existing[0].role && ['super_admin', 'main_admin'].includes(existing[0].role)) {
      const [remainingAdmins] = await connection.query(
        "SELECT COUNT(*) as count FROM users WHERE role IN ('super_admin', 'main_admin') AND status = 'active' AND id != ?",
        [targetId]
      );
      if (remainingAdmins[0].count === 0) {
        return res.status(400).json({ 
          message: 'Security policy violation: Cannot demote the last active administrator account.' 
        });
      }
    }

    if (email && email !== existing[0].email) {
      const [emailConflict] = await connection.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, targetId]);
      if (emailConflict.length > 0) {
        return res.status(400).json({ message: 'Email address already exists' });
      }
    }

    const permsStr = permissions_json !== undefined
      ? (permissions_json ? JSON.stringify(permissions_json) : null)
      : undefined;

    if (permsStr !== undefined) {
      await connection.query(
        'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), role = COALESCE(?, role), permissions_json = ? WHERE id = ?',
        [name, email, phone, role, permsStr, targetId]
      );
    } else {
      await connection.query(
        'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), role = COALESCE(?, role) WHERE id = ?',
        [name, email, phone, role, targetId]
      );
    }

    await logAudit(connection, req.user.id, 'UPDATE_USER', email || existing[0].email, { role, permissions_json });

    await connection.commit();
    res.json({ message: 'System user updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// 4. Suspend/Activate User
router.put('/:id/status', authenticateJWT, authorizeRoles('super_admin', 'main_admin'), async (req, res) => {
  const { status } = req.body;
  const targetId = req.params.id;

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  // Security check: cannot suspend oneself
  if (status === 'suspended' && targetId === req.user.id) {
    return res.status(400).json({ 
      message: 'Security policy violation: You cannot suspend your own active administrator account.' 
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT id, email, role, status FROM users WHERE id = ? AND role IN (?)', [targetId, SYSTEM_ROLES]);
    if (existing.length === 0) return res.status(404).json({ message: 'System user not found' });

    // Security check: at least one super_admin or main_admin must remain active
    if (status === 'suspended' && ['super_admin', 'main_admin'].includes(existing[0].role)) {
      const [activeAdmins] = await connection.query(
        "SELECT COUNT(*) as count FROM users WHERE role IN ('super_admin', 'main_admin') AND status = 'active' AND deleted_at IS NULL"
      );
      if (activeAdmins[0]?.count <= 1) {
        return res.status(400).json({
          message: 'Security policy violation: At least one Administrator (Super Admin / Main Admin) must remain active at all times.'
        });
      }
    }

    await connection.query('UPDATE users SET status = ? WHERE id = ?', [status, targetId]);

    await logAudit(connection, req.user.id, 'CHANGE_STATUS', existing[0].email, { newStatus: status });

    await connection.commit();
    res.json({ message: `System user ${status} successfully` });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// 5. Reset Password
router.post('/:id/reset-password', authenticateJWT, authorizeRoles('super_admin', 'main_admin'), async (req, res) => {
  const targetId = req.params.id;
  const plainPassword = Math.random().toString(36).slice(-10);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT email, name FROM users WHERE id = ? AND role IN (?)', [targetId, SYSTEM_ROLES]);
    if (existing.length === 0) return res.status(404).json({ message: 'System user not found' });

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await connection.query(
      'UPDATE users SET password_hash = ?, force_password_change = TRUE WHERE id = ?',
      [hashedPassword, targetId]
    );

    await logAudit(connection, req.user.id, 'RESET_PASSWORD', existing[0].email, {});

    await connection.commit();

    try {
      await emailService.sendMail({
        to: existing[0].email,
        subject: 'Password Reset',
        html: `
          <p>Hi ${existing[0].name},</p>
          <p>Your password has been reset by an administrator.</p>
          <p>Your new temporary password is: <strong>${plainPassword}</strong></p>
          <p>Please log in and change your password immediately.</p>
        `
      });
    } catch (e) {
      console.warn('Failed to send reset email:', e.message);
    }

    res.json({ message: 'Password reset successfully', tempPassword: plainPassword });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// 6. Delete System User
router.delete('/:id', authenticateJWT, authorizeRoles('super_admin', 'main_admin'), async (req, res) => {
  const targetId = req.params.id;
  if (targetId === req.user.id) {
    return res.status(400).json({ message: 'Security policy violation: You cannot delete your own account' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT id, email, role FROM users WHERE id = ? AND role IN (?)', [targetId, SYSTEM_ROLES]);
    if (existing.length === 0) return res.status(404).json({ message: 'System user not found' });

    // Security check: cannot delete the last active administrator
    if (['super_admin', 'main_admin'].includes(existing[0].role)) {
      const [remainingAdmins] = await connection.query(
        "SELECT COUNT(*) as count FROM users WHERE role IN ('super_admin', 'main_admin') AND status = 'active' AND deleted_at IS NULL AND id != ?",
        [targetId]
      );
      if (remainingAdmins[0]?.count === 0) {
        return res.status(400).json({ 
          message: 'Security policy violation: Cannot delete the last active administrator account.' 
        });
      }
    }

    const emailSuffix = `.deleted.${Date.now()}`;
    const newEmail = `${existing[0].email}${emailSuffix}`;

    await connection.query(
      "UPDATE users SET deleted_at = NOW(), status = 'inactive', email = ? WHERE id = ?",
      [newEmail, targetId]
    );

    await logAudit(connection, req.user.id, 'DELETE_USER', existing[0].email, {});

    await connection.commit();
    res.json({ message: 'System user deleted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// 7. Get Audit Logs
router.get('/audit-logs', authenticateJWT, authorizeRoles('super_admin', 'main_admin'), async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT a.*, u.name as admin_name 
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Auto-heal check to guarantee at least one super_admin or main_admin is active
export const ensureActiveAdmin = async () => {
  try {
    // 1. Ensure required columns and tables exist
    await ensureSystemUsersColumns();

    // 2. Reactivate administrator accounts if none are active to prevent system lockout
    const [active] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role IN ('super_admin', 'main_admin') AND status = 'active'"
    );
    if (!active[0] || active[0].count === 0) {
      console.warn('[Security Auto-Heal] No active super_admin or main_admin found. Reactivating administrator accounts to prevent system lockout...');
      await pool.query(
        "UPDATE users SET status = 'active' WHERE role IN ('super_admin', 'main_admin')"
      );
      console.log('[Security Auto-Heal] Administrator accounts reactivated successfully.');
    }

    // 3. Ensure a main_admin account exists in the database
    const [mainAdminRows] = await pool.query(
      "SELECT id, email, status FROM users WHERE role = 'main_admin' LIMIT 1"
    );
    if (!mainAdminRows || mainAdminRows.length === 0) {
      console.warn('[Security Auto-Heal] No main_admin found in database. Auto-seeding default main_admin account...');
      await pool.query(`
        INSERT IGNORE INTO users (id, role, org_id, name, email, password_hash, status) VALUES 
        ('u-main-admin-01', 'main_admin', NULL, 'Authority Chief Administrator', 'info@gsfin.uk', '$2b$10$mQDSYjJO4N9Vi8VOjRKliexBtGzZz846W39Zs6GaRexBQ8Leve6aO', 'active')
      `);
      console.log('[Security Auto-Heal] Default main_admin (info@gsfin.uk) seeded successfully.');
    } else if (mainAdminRows[0].status !== 'active') {
      await pool.query("UPDATE users SET status = 'active' WHERE id = ?", [mainAdminRows[0].id]);
      console.log('[Security Auto-Heal] Existing main_admin reactivated to active status.');
    }
  } catch (err) {
    console.error('[Security Auto-Heal] Failed to verify/heal active admin accounts:', err);
  }
};

export default router;
