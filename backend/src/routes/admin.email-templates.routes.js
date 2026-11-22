import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

export const DEFAULT_EMAIL_TEMPLATES = [
  {
    id: 'exam_registration_otp',
    name: 'Exam Registration OTP',
    subject: 'Your Registration OTP for {{exam_name}}',
    body: `<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
  {{brand_logo}}
  <h2 style="color: #007AFF;">Verify Your Email</h2>
  <p>Hi {{name}},</p>
  <p>You requested to register for <strong>{{exam_name}}</strong>.</p>
  <p>Please use the following One-Time Password (OTP) to complete your registration:</p>
  <div style="text-align: center; margin: 30px 0;">
    <div style="display: inline-block; padding: 14px 30px; background: #f0f7ff; color: #007AFF; border: 1px dashed #007AFF; border-radius: 8px; font-weight: bold; font-size: 24px; letter-spacing: 4px;">{{otp}}</div>
  </div>
  <p style="font-size: 14px; color: #666;">This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
</div>`
  },
  {
    id: 'exam_registration_success',
    name: 'Exam Registration Success',
    subject: 'Registration Confirmed: {{exam_name}} - Exam Details & Access Link',
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
  {{brand_logo}}
  <div style="background: #0f172a; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; border-bottom: 3px solid #e31b23;">
    <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.01em;">GSFIN CERTIFICATION PORTAL</h2>
    <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Official Examination Sitting &amp; Access Link</p>
  </div>
  <p style="font-size: 15px; line-height: 1.6; margin-top: 0;">Dear <strong>{{name}}</strong>,</p>
  <p style="font-size: 14px; line-height: 1.6; color: #475569;">
    You have been enrolled in the official certification examination for <strong>{{exam_name}}</strong> by <strong>{{center_name}}</strong>.
  </p>
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #0f172a; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Examination Schedule &amp; Access Details</h3>
    <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Exam Title:</strong> {{exam_name}}</p>
    <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Exam Window:</strong> {{exam_window}}</p>
    <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Duration:</strong> {{exam_duration}} Minutes</p>
    <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
      <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Username / Email:</strong> <span style="font-family: monospace; color: #0f172a;">{{email}}</span></p>
      <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Access Password:</strong> <span style="font-family: monospace; color: #0f172a;">{{password}}</span></p>
    </div>
  </div>
  <div style="text-align: center; margin: 28px 0;">
    <a href="{{exam_link}}" style="background: #e31b23; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(227, 27, 35, 0.25);">Launch Exam Sitting →</a>
  </div>
  <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
    <strong>Important:</strong> Live camera face verification is active during the exam sitting. Please ensure your device camera is enabled and functioning properly.
  </p>
  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;">
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">GSFIN Global Standards &bull; Verified Personnel Certification Network</p>
</div>`
  },
  {
    id: 'exam_reminder_1day',
    name: 'Exam Reminder (1 Day Before)',
    subject: 'Reminder: {{exam_name}} is tomorrow',
    body: `<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
  {{brand_logo}}
  <h2 style="color: #4CAF50;">Your Exam is Tomorrow!</h2>
  <p>Hi {{name}},</p>
  <p>This is a reminder that the <strong>{{exam_name}}</strong> is scheduled to start in less than 24 hours.</p>
  <p>Please log in to the portal in advance to ensure everything is set up.</p>
  <div style="text-align: center; margin: 25px 0;">
    <a href="{{exam_link}}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Exam Portal</a>
  </div>
  <p>Good luck!</p>
</div>`
  },
  {
    id: 'exam_reminder_10min',
    name: 'Exam Reminder (10 Minutes Before)',
    subject: 'Starting Soon: {{exam_name}}',
    body: `<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
  {{brand_logo}}
  <h2 style="color: #ff9800;">Your Exam Starts Soon!</h2>
  <p>Hi {{name}},</p>
  <p>The <strong>{{exam_name}}</strong> will begin in approximately 10 minutes.</p>
  <p>Please log in now and wait for the start button to become active.</p>
  <div style="text-align: center; margin: 25px 0;">
    <a href="{{exam_link}}" style="background: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Start Exam Now</a>
  </div>
  <p>Best of luck!</p>
</div>`
  },
  {
    id: 'student_registration_otp',
    name: 'Student Registration Verification OTP',
    subject: 'Your Verification Code: {{otp}} - Student Registration',
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #e31b23;">
    <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.02em;">GSFIN Global Standards</h1>
    <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Authorized Student Registration Verification</p>
  </div>
  <div style="padding: 32px;">
    <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Hello <strong>{{name}}</strong>,</p>
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
      A student registration request was initiated for your profile through <strong>{{center_name}}</strong>. Please use the verification code below to confirm your email:
    </p>
    <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <div style="font-family: monospace; font-size: 36px; font-weight: 700; color: #e31b23; letter-spacing: 8px;">{{otp}}</div>
      <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0 0;">Valid for 10 minutes. Do not share this code.</p>
    </div>
    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">If you did not request this registration, you can safely ignore this email.</p>
  </div>
</div>`
  },
  {
    id: 'student_credentials',
    name: 'Student Login Credentials & Security OTP',
    subject: 'Your Examination Credentials & Security OTP - GSFIN Accreditation',
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #e31b23;">
    <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.02em;">GSFIN Global Standards</h1>
    <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Authorized Partner Examination Credentials</p>
  </div>
  <div style="padding: 32px;">
    <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Hello <strong>{{name}}</strong>,</p>
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
      Your student account has been enrolled by <strong>{{center_name}}</strong>. Below are your official examination portal access credentials:
    </p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
      <div style="margin-bottom: 12px;"><span style="color: #64748b; font-size: 12px; text-transform: uppercase;">Username (Email):</span> <div style="color: #0f172a; font-weight: 600; font-family: monospace;">{{email}}</div></div>
      <div style="margin-bottom: 12px;"><span style="color: #64748b; font-size: 12px; text-transform: uppercase;">Initial Password:</span> <div style="color: #0f172a; font-weight: 600; font-family: monospace;">{{password}}</div></div>
      <div><span style="color: #64748b; font-size: 12px; text-transform: uppercase;">Security OTP:</span> <div style="color: #e31b23; font-weight: 700; font-size: 20px; font-family: monospace;">{{otp}}</div></div>
    </div>
    <div style="text-align: center; margin: 28px 0;">
      <a href="{{login_url}}" style="display: inline-block; background: #e31b23; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px;">Log In to Examination Portal</a>
    </div>
  </div>
</div>`
  },
  {
    id: 'password_reset',
    name: 'Password Reset Request',
    subject: 'Reset Your Password - GSFIN Certification Portal',
    body: `<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
  <h2 style="color: #007AFF;">Reset Your Password</h2>
  <p>You recently requested to reset your password for your GSFIN account.</p>
  <p>Click the link below to choose a new password:</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{reset_link}}" style="background: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
  </div>
  <p style="font-size: 14px; color: #666;">If you didn't request a password reset, please ignore this email or contact support.</p>
</div>`
  },
  {
    id: 'exam_certificate',
    name: 'Certificate Issued Notification',
    subject: 'Your GSFIN Certificate for {{exam_name}} is Ready 🎉',
    body: `<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
  <h2 style="color: #dc2626;">Congratulations! 🎉</h2>
  <p>Dear {{name}},</p>
  <p>You have successfully passed the <strong>{{exam_name}}</strong> qualification exam.</p>
  <p>Your official digital certificate is recorded in the global verification registry.</p>
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 20px 0;">
    <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Certificate Number:</strong> {{certificate_number}}</p>
  </div>
  <div style="text-align: center; margin: 25px 0;">
    <a href="{{verify_url}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Certificate Online</a>
  </div>
</div>`
  }
];

// Auto-healer for email_templates table and initial seeding
export const ensureEmailTemplates = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Ensure all default templates exist
    for (const t of DEFAULT_EMAIL_TEMPLATES) {
      await pool.query(
        `INSERT INTO email_templates (id, name, subject, body) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [t.id, t.name, t.subject, t.body]
      );
    }

    // Update exam_registration_success if it contains old styling or Date & Time instead of Exam Window
    const [regTpl] = await pool.query("SELECT body FROM email_templates WHERE id = 'exam_registration_success'");
    if (regTpl.length > 0 && (!regTpl[0].body || regTpl[0].body.includes('Date & Time') || regTpl[0].body.includes('#4CAF50'))) {
      const defaultReg = DEFAULT_EMAIL_TEMPLATES.find(t => t.id === 'exam_registration_success');
      if (defaultReg) {
        await pool.query(
          "UPDATE email_templates SET subject = ?, body = ? WHERE id = 'exam_registration_success'",
          [defaultReg.subject, defaultReg.body]
        );
        console.log('[EmailTemplates] Successfully updated exam_registration_success to Exam Window executive template.');
      }
    }
  } catch (err) {
    console.error('[EmailTemplates] Auto-healer failed:', err.message);
  }
};

// GET /api/admin/email-templates
router.get('/', async (req, res) => {
  try {
    await ensureEmailTemplates();
    const [templates] = await pool.query('SELECT id, name, subject, body, updated_at FROM email_templates ORDER BY name ASC');
    res.json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/admin/email-templates/reset-defaults (Restore default templates)
router.post('/reset-defaults', async (req, res) => {
  try {
    await ensureEmailTemplates();
    for (const t of DEFAULT_EMAIL_TEMPLATES) {
      await pool.query(
        `INSERT INTO email_templates (id, name, subject, body) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), subject = VALUES(subject), body = VALUES(body)`,
        [t.id, t.name, t.subject, t.body]
      );
    }
    const [templates] = await pool.query('SELECT id, name, subject, body, updated_at FROM email_templates ORDER BY name ASC');
    res.json({ message: 'Email templates reset to defaults successfully', templates });
  } catch (error) {
    console.error('Error resetting email templates:', error);
    res.status(500).json({ message: 'Failed to reset email templates' });
  }
});

// PUT /api/admin/email-templates/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ message: 'Subject and body are required' });
    }

    const [result] = await pool.query(
      'UPDATE email_templates SET subject = ?, body = ? WHERE id = ?',
      [subject, body, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({ message: 'Template updated successfully' });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;