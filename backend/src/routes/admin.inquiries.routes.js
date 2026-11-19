import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import emailService from '../services/email.service.js';

const router = express.Router();

router.use(authenticateJWT, authorizeRoles('super_admin', 'main_admin', 'sub_admin', 'admin'));

// GET /api/admin/inquiries - List all contact & partner submissions
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    let query = 'SELECT * FROM contact_submissions WHERE 1=1';
    const params = [];

    if (type === 'partner') {
      query += ' AND (subject LIKE "%Partner%" OR subject LIKE "%Center Lead%" OR center_name IS NOT NULL)';
    } else if (type === 'general') {
      query += ' AND (subject NOT LIKE "%Partner%" AND subject NOT LIKE "%Center Lead%" AND center_name IS NULL)';
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY submitted_at DESC LIMIT 200';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching admin inquiries:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// POST /api/admin/inquiries - Create new lead from admin panel
router.post('/', async (req, res) => {
  try {
    const {
      center_name,
      name,
      contact_person,
      address,
      location,
      district,
      state,
      country,
      phone,
      whatsapp,
      website,
      message,
      email,
      subject,
      status
    } = req.body;

    const leadCenter = center_name?.trim() || name?.trim();
    if (!leadCenter) {
      return res.status(400).json({ error: 'Center Name is required.' });
    }

    const id = uuidv4();
    const person = contact_person?.trim() || name?.trim() || leadCenter;
    const leadSubject = subject?.trim() || `Center Lead: ${leadCenter}`;
    const validStatus = ['new', 'read', 'replied'].includes(status) ? status : 'new';

    await pool.query(
      `INSERT INTO contact_submissions 
       (id, name, center_name, email, phone, whatsapp, address, location, district, state, country, website, subject, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        person,
        leadCenter,
        email?.trim() || null,
        phone?.trim() || null,
        whatsapp?.trim() || null,
        address?.trim() || null,
        location?.trim() || null,
        district?.trim() || null,
        state?.trim() || null,
        country?.trim() || null,
        website?.trim() || null,
        leadSubject,
        message?.trim() || null,
        validStatus
      ]
    );

    const [[created]] = await pool.query('SELECT * FROM contact_submissions WHERE id = ?', [id]);
    res.status(201).json({ message: 'Lead added successfully', inquiry: created });
  } catch (error) {
    console.error('Error creating admin inquiry:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// GET /api/admin/inquiries/:id - Get single inquiry details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [[inquiry]] = await pool.query('SELECT * FROM contact_submissions WHERE id = ?', [id]);

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry submission not found' });
    }

    res.json(inquiry);
  } catch (error) {
    console.error('Error fetching inquiry detail:', error);
    res.status(500).json({ error: 'Failed to fetch inquiry detail' });
  }
});

// PUT /api/admin/inquiries/:id - Update inquiry details & status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      center_name,
      contact_person,
      email,
      phone,
      whatsapp,
      address,
      location,
      district,
      state,
      country,
      website,
      subject,
      message,
      status
    } = req.body;

    const leadCenter = center_name?.trim() || name?.trim();
    const person = contact_person?.trim() || name?.trim() || leadCenter || 'Contact Person';
    const validStatus = ['new', 'read', 'replied'].includes(status) ? status : 'read';

    await pool.query(
      `UPDATE contact_submissions 
       SET name = ?, center_name = ?, email = ?, phone = ?, whatsapp = ?,
           address = ?, location = ?, district = ?, state = ?, country = ?,
           website = ?, subject = ?, message = ?, status = ? 
       WHERE id = ?`,
      [
        person,
        leadCenter || null,
        email?.trim() || null,
        phone?.trim() || null,
        whatsapp?.trim() || null,
        address?.trim() || null,
        location?.trim() || null,
        district?.trim() || null,
        state?.trim() || null,
        country?.trim() || null,
        website?.trim() || null,
        subject || `Center Lead: ${leadCenter || person}`,
        message || '',
        validStatus,
        id
      ]
    );

    const [[updated]] = await pool.query('SELECT * FROM contact_submissions WHERE id = ?', [id]);
    res.json({ message: 'Inquiry updated successfully', inquiry: updated });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
});

// PATCH /api/admin/inquiries/:id/status - Update inquiry status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    await pool.query('UPDATE contact_submissions SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Inquiry status updated successfully' });
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ error: 'Failed to update inquiry status' });
  }
});

// POST /api/admin/inquiries/:id/convert-partner - Convert lead into an active Partner Center
router.post('/:id/convert-partner', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_email, contact_phone, country, city, institution_type, programs } = req.body;

    const orgName = name?.trim();
    const email = contact_email?.trim();

    if (!orgName || !email) {
      return res.status(400).json({ error: 'Organization name and contact email are required to convert to a partner.' });
    }

    // Check if an organization with same name or email already exists
    const [existing] = await pool.query(
      'SELECT id, name FROM organizations WHERE name = ? OR contact_email = ?',
      [orgName, email]
    );

    let orgId;
    let tempPassword = `GSFIN-${Math.random().toString(36).slice(-8).toUpperCase()}`;

    if (existing.length > 0) {
      orgId = existing[0].id;
    } else {
      orgId = uuidv4();
      const programsJson = typeof programs === 'string' ? programs : JSON.stringify(programs || ['CODEX HACCP', 'ISO 22000']);
      await pool.query(
        `INSERT INTO organizations (id, name, contact_email, contact_phone, country, city, institution_type, programs, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [orgId, orgName, email, contact_phone || null, country || 'Global Jurisdiction', city || 'International', institution_type || 'Authorized Training Center', programsJson]
      );

      // Auto-provision initial wallet
      const walletId = uuidv4();
      await pool.query(
        `INSERT INTO sub_center_wallets (id, org_id, package_id, tokens_purchased, tokens_used, tokens_remaining)
         VALUES (?, ?, 'tp-starter-50', 0, 0, 0)`,
        [walletId, orgId]
      );

      // Auto-provision staff login user
      const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUsers.length === 0) {
        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        await pool.query(
          `INSERT INTO users (id, role, org_id, name, email, password_hash, phone, status, force_password_change)
           VALUES (?, 'sub_center_staff', ?, ?, ?, ?, ?, 'active', TRUE)`,
          [userId, orgId, `${orgName} Administrator`, email, hashedPassword, contact_phone || null]
        );
        await pool.query('INSERT IGNORE INTO user_profiles (user_id) VALUES (?)', [userId]);

        // Dispatch welcome credentials email
        try {
          const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
          await emailService.sendMail({
            to: email,
            subject: 'Congratulations! Your GSFIN Authorized Partner Center Account is Ready',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1E293B; line-height: 1.6;">
                <h2 style="color: #E31B23; margin-top: 0;">Authorized Partner Center Approved</h2>
                <p>Dear ${orgName} Team,</p>
                <p>We are delighted to inform you that your application has been approved. You are now officially registered as an Authorized Partner Center with GSFIN.</p>
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 18px; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0;"><strong>Partner Portal Login:</strong> <a href="${loginUrl}" style="color: #2563EB;">${loginUrl}</a></p>
                  <p style="margin: 0 0 8px 0;"><strong>Username / Email:</strong> ${email}</p>
                  <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="background: #E2E8F0; padding: 3px 8px; border-radius: 4px; font-size: 1.15em; color: #0F172A; font-weight: bold;">${tempPassword}</code></p>
                </div>
                <p>Please log in and update your password immediately upon accessing the portal.</p>
                <p style="color: #64748B; font-size: 0.85em; margin-top: 30px;">GSFIN Global Standards & Accreditation Authority</p>
              </div>
            `
          });
        } catch (mailErr) {
          console.warn('Failed to dispatch partner welcome email:', mailErr.message);
        }
      } else {
        await pool.query('UPDATE users SET org_id = ?, role = "sub_center_staff" WHERE email = ?', [orgId, email]);
      }
    }

    // Mark inquiry as replied
    await pool.query('UPDATE contact_submissions SET status = "replied" WHERE id = ?', [id]);

    res.json({
      success: true,
      org_id: orgId,
      tempPassword,
      message: `Successfully converted "${orgName}" into an Authorized Partner Center!`
    });
  } catch (error) {
    console.error('Error converting lead to partner:', error);
    res.status(500).json({ error: error.message || 'Failed to convert lead to partner center' });
  }
});

// Delete submission
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM contact_submissions WHERE id = ?', [id]);
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
});

// Auto-heal contact_submissions columns
export async function ensureInquiriesColumns() {
  try {
    await pool.query('ALTER TABLE contact_submissions MODIFY COLUMN name VARCHAR(255) NULL');
    await pool.query('ALTER TABLE contact_submissions MODIFY COLUMN email VARCHAR(255) NULL');
    await pool.query('ALTER TABLE contact_submissions MODIFY COLUMN phone VARCHAR(50) NULL');

    const [cols] = await pool.query('DESCRIBE contact_submissions');
    const existing = cols.map(c => c.Field);

    const addCol = async (name, def) => {
      if (!existing.includes(name)) {
        await pool.query(`ALTER TABLE contact_submissions ADD COLUMN ${name} ${def}`);
      }
    };

    await addCol('center_name', 'VARCHAR(255) NULL AFTER name');
    await addCol('address', 'TEXT NULL');
    await addCol('location', 'VARCHAR(255) NULL');
    await addCol('district', 'VARCHAR(100) NULL');
    await addCol('state', 'VARCHAR(100) NULL');
    await addCol('country', 'VARCHAR(100) NULL');
    await addCol('whatsapp', 'VARCHAR(50) NULL');
    await addCol('website', 'VARCHAR(255) NULL');
  } catch (err) {
    console.error('[Startup] Failed to ensure contact_submissions columns:', err);
  }
}

export default router;

