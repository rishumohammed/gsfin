import cron from 'node-cron';
import { pool } from '../db/connection.js';
import emailService from '../services/email.service.js';

export function initMultitenantNotificationsJob() {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await sendImmediateAssignmentNotifications();
      await sendPreExamReminders();
    } catch (err) {
      console.error('[MultitenantNotificationsJob] Error:', err);
    }
  });
}

/**
 * Send initial notification for newly created assignments
 */
async function sendImmediateAssignmentNotifications() {
  try {
    const [assignments] = await pool.query(
      `SELECT ea.id as assignment_id, s.name as student_name, s.email as student_email,
              e.name as exam_name, b.opens_at, b.closes_at, o.name as org_name
       FROM exam_assignments ea
       JOIN students s ON ea.student_id = s.id
       JOIN exams e ON ea.exam_id = e.id
       JOIN batches b ON ea.batch_id = b.id
       JOIN organizations o ON s.org_id = o.id
       WHERE ea.notified_at IS NULL AND ea.status = 'not_started'`
    );

    const tasks = assignments.map(async (assign) => {
      const examUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/exam/take-${assign.assignment_id}`;
      const subject = `Exam Enrollment: ${assign.exam_name}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e3a8a;">Exam Enrollment Confirmation</h2>
          <p>Dear ${assign.student_name},</p>
          <p>You have been enrolled in the following certification exam:</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Exam Name:</strong> ${assign.exam_name}</p>
            ${assign.opens_at ? `<p style="margin: 5px 0;"><strong>Window Opens:</strong> ${new Date(assign.opens_at).toLocaleString()}</p>` : ''}
            ${assign.closes_at ? `<p style="margin: 5px 0;"><strong>Window Closes:</strong> ${new Date(assign.closes_at).toLocaleString()}</p>` : ''}
          </div>
          <p>Click the link below to access your exam sitting:</p>
          <p style="text-align: center; margin: 25px 0;">
            <a href="${examUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Take Exam</a>
          </p>
          <p style="color: #64748b; font-size: 0.875rem;">If you have any questions, please contact your sub-center.</p>
        </div>
      `;

      try {
        await emailService.sendGenericEmail(assign.student_email, subject, htmlContent);
        await pool.query(
          `UPDATE exam_assignments SET notified_at = NOW() WHERE id = ?`,
          [assign.assignment_id]
        );
      } catch (sendErr) {
        console.warn(`[sendImmediateNotifications] Failed for assignment ${assign.assignment_id}:`, sendErr.message);
      }
    });

    await Promise.allSettled(tasks);
  } catch (err) {
    console.error('[sendImmediateNotifications] Error:', err);
  }
}

/**
 * Send 24-hour lead time pre-exam reminder notification
 */
async function sendPreExamReminders() {
  try {
    // Get configured lead time in hours (default 24)
    const [cfg] = await pool.query(`SELECT value FROM system_config WHERE \`key\` = 'reminder_lead_time_hours'`);
    const leadTimeHours = Number(cfg[0]?.value) || 24;

    const [reminders] = await pool.query(
      `SELECT ea.id as assignment_id, s.name as student_name, s.email as student_email,
              e.name as exam_name, b.opens_at, b.closes_at
       FROM exam_assignments ea
       JOIN students s ON ea.student_id = s.id
       JOIN exams e ON ea.exam_id = e.id
       JOIN batches b ON ea.batch_id = b.id
       WHERE ea.reminder_sent_at IS NULL 
         AND ea.status = 'not_started'
         AND b.opens_at IS NOT NULL
         AND b.opens_at <= DATE_ADD(NOW(), INTERVAL ? HOUR)`,
      [leadTimeHours]
    );

    const reminderTasks = reminders.map(async (rem) => {
      const examUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/exam/take-${rem.assignment_id}`;
      const subject = `Reminder: Upcoming Certification Exam - ${rem.exam_name}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e3a8a;">Exam Schedule Reminder</h2>
          <p>Dear ${rem.student_name},</p>
          <p>This is a reminder that your certification exam <strong>${rem.exam_name}</strong> is scheduled to open soon.</p>
          <p><strong>Opens At:</strong> ${new Date(rem.opens_at).toLocaleString()}</p>
          <p style="text-align: center; margin: 25px 0;">
            <a href="${examUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Prepare & Start Exam</a>
          </p>
        </div>
      `;

      try {
        await emailService.sendGenericEmail(rem.student_email, subject, htmlContent);
        await pool.query(
          `UPDATE exam_assignments SET reminder_sent_at = NOW() WHERE id = ?`,
          [rem.assignment_id]
        );
      } catch (sendErr) {
        console.warn(`[sendPreExamReminders] Failed for assignment ${rem.assignment_id}:`, sendErr.message);
      }
    });

    await Promise.allSettled(reminderTasks);
  } catch (err) {
    console.error('[sendPreExamReminders] Error:', err);
  }
}
