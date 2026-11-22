import { pool } from '../db/connection.js';
import emailService from '../services/email.service.js';
import { getFrontendUrl, getBackendUrl } from './url-helper.js';

/**
 * Dispatches exam schedule details & candidate access links to students added to a batch
 */
export async function dispatchBatchEnrollmentEmails({ req, orgId, examId, assignments, opensAt, closesAt }) {
  if (!assignments || assignments.length === 0) return;

  try {
    const studentIds = assignments.map(a => a.studentId);
    if (studentIds.length === 0) return;

    // 1. Fetch Students
    const [students] = await pool.query(
      `SELECT id, name, email, initial_password, otp_code FROM students WHERE id IN (?)`,
      [studentIds]
    );
    if (!students || students.length === 0) return;

    // 2. Fetch Exam Details
    const [exams] = await pool.query(
      `SELECT id, name, duration_minutes FROM exams WHERE id = ?`,
      [examId]
    );
    const exam = exams[0] || { name: 'Certification Examination', duration_minutes: 60 };

    // 3. Fetch Organization (Center) Name
    let centerName = 'GSFIN Authorized Test Center';
    try {
      const [orgs] = await pool.query('SELECT name FROM organizations WHERE id = ?', [orgId]);
      if (orgs.length > 0 && orgs[0].name) centerName = orgs[0].name;
    } catch (e) {}

    // 4. Format Exam Window (Explicitly labeled "Exam Window")
    const formatDate = (val) => {
      try {
        const d = new Date(val);
        return d.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } catch (e) {
        return val;
      }
    };

    let examWindowText = 'Available Immediately (Open-Ended)';
    if (opensAt && closesAt) {
      examWindowText = `${formatDate(opensAt)} to ${formatDate(closesAt)}`;
    } else if (opensAt) {
      examWindowText = `Opens ${formatDate(opensAt)} (Open-Ended)`;
    } else if (closesAt) {
      examWindowText = `Available Immediately until ${formatDate(closesAt)}`;
    }

    // 5. Fetch Template from DB
    let templateSubject = 'Registration Confirmed: {{exam_name}} - Exam Details & Access Link';
    let templateBody = '';
    try {
      const [tplRows] = await pool.query(
        "SELECT subject, body FROM email_templates WHERE id = 'exam_registration_success'"
      );
      if (tplRows.length > 0 && tplRows[0].body) {
        templateSubject = tplRows[0].subject || templateSubject;
        templateBody = tplRows[0].body;
      }
    } catch (tplErr) {
      console.warn('[Batch Email] Could not fetch template from DB:', tplErr.message);
    }

    if (!templateBody) {
      templateBody = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
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
</div>`;
    }

    // 6. Fetch Brand Logo
    let logoHtml = '';
    const backendUrl = getBackendUrl(req);
    try {
      const [logoRows] = await pool.query("SELECT value FROM config WHERE `key` = 'app_logo'");
      if (logoRows.length > 0 && logoRows[0].value) {
        const logoVal = logoRows[0].value;
        const logoUrl = logoVal.startsWith('http') ? logoVal : `${backendUrl}${logoVal}`;
        logoHtml = `<img src="${logoUrl}" alt="GSFIN" style="max-height: 48px; margin-bottom: 20px;" />`;
      }
    } catch (e) {}

    const frontendUrl = getFrontendUrl(req);

    // 7. Dispatch email to each enrolled student
    for (const assign of assignments) {
      const student = students.find(s => s.id === assign.studentId);
      if (!student || !student.email) continue;

      const examLink = `${frontendUrl}/exam/take-${assign.assignmentId}`;
      const studentPassword = student.initial_password || 'Your Registered Password';
      const studentOtp = student.otp_code || '';

      const subject = templateSubject
        .replace(/{{exam_name}}/g, exam.name)
        .replace(/{{name}}/g, student.name || 'Candidate');

      const html = templateBody
        .replace(/{{name}}/g, student.name || 'Candidate')
        .replace(/{{exam_name}}/g, exam.name)
        .replace(/{{exam_window}}/g, examWindowText)
        .replace(/{{exam_date}}/g, examWindowText)
        .replace(/{{exam_duration}}/g, `${exam.duration_minutes || 60}`)
        .replace(/{{email}}/g, student.email)
        .replace(/{{password}}/g, studentPassword)
        .replace(/{{otp}}/g, studentOtp)
        .replace(/{{exam_link}}/g, examLink)
        .replace(/{{center_name}}/g, centerName)
        .replace(/{{brand_logo}}/g, logoHtml);

      emailService.sendEmail({
        to: student.email,
        subject,
        html
      }).catch(err => {
        console.error(`[Batch Email Error] Failed to send email to ${student.email}:`, err.message);
      });
    }
  } catch (err) {
    console.error('[Batch Email] Error dispatching batch enrollment emails:', err.message);
  }
}
