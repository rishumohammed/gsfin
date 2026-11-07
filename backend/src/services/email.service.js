import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConfigService } from './config.service.js';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class EmailService {
  constructor() {
    this.ready = false;
    this.resendApiKey = '';
    this.fromEmail = 'noreply@gsfin.org';
    this.fromName = 'GSFIN Certifying Authority';
    this.sendMail = this.sendEmail.bind(this);
    this.init();
  }

  async init() {
    try {
      // Fetch dynamic config from DB (unmasked)
      let configMap = {};
      try {
        const config = await ConfigService.getAll(false);
        config.forEach(c => { configMap[c.key] = c.value; });
      } catch (e) {
        console.warn('Could not fetch config from DB, falling back to ENV');
      }

      this.resendApiKey = configMap.resend_api_key || process.env.RESEND_API_KEY || '';
      this.fromEmail = configMap.smtp_from_email || configMap.resend_from_email || process.env.RESEND_FROM || process.env.SMTP_FROM || 'noreply@gsfin.org';
      this.fromName = configMap.smtp_from_name || process.env.SMTP_FROM_NAME || 'GSFIN Certifying Authority';

      if (this.resendApiKey && this.resendApiKey.trim().length > 0) {
        this.ready = true;
      } else {
        this.ready = false;
      }
    } catch (err) {
      console.error('EmailService init error:', err);
      this.ready = false;
    }
  }

  async sendEmailViaResend({ to, subject, html, attachments }) {
    try {
      const recipientList = Array.isArray(to) ? to : [to];
      const fromField = this.fromName ? `"${this.fromName}" <${this.fromEmail}>` : this.fromEmail;

      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: fromField,
          to: recipientList,
          subject: subject,
          html: html,
          ...(attachments && { attachments })
        },
        {
          headers: {
            Authorization: `Bearer ${this.resendApiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log('Email successfully dispatched via Resend REST API:', response.data?.id);
      return { messageId: response.data?.id, ...response.data };
    } catch (error) {
      const errorDetail = error.response?.data?.message || error.response?.data?.error || error.message;
      console.error('Resend REST API send error:', error.response?.data || error.message);
      throw new Error(`Resend Email Error: ${errorDetail}`);
    }
  }

  async sendGenericEmail({ to, subject, html, attachments }) {
    return this.sendEmail({ to, subject, html, attachments });
  }

  async sendEmail({ to, subject, html, attachments }) {
    await this.init(); // Refresh config dynamically before sending

    if (!this.ready) {
      console.log('\n--- EMAIL LOG (NO RESEND API KEY CONFIGURED) ---');
      console.log('From:', `"${this.fromName}" <${this.fromEmail}>`);
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Content:', html);
      console.log('------------------------------------------------\n');
      return { messageId: 'console-log-dev-mode', status: 'logged_to_console' };
    }

    try {
      return await this.sendEmailViaResend({ to, subject, html, attachments });
    } catch (error) {
      console.error('Error sending email via Resend:', error.message);
      throw error;
    }
  }

  async sendPasswordResetEmail(email, token) {
    try {
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #007AFF;">Reset Your Password</h2>
          <p>You requested a password reset for your Kefta Talent Hunt account.</p>
          <p>Please click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; padding: 14px 30px; background: #007AFF; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">This link will expire in 1 hour.</p>
        </div>
      `;

      await this.sendEmail({
        to: email,
        subject: 'Reset Your Password - Kefta Talent Hunt',
        html
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
  }

  async sendWelcomeEmail(student, credentials, courseName) {
    try {
      const templatePath = path.join(__dirname, '../templates/emails/welcome-student.html');
      let html = await fs.readFile(templatePath, 'utf-8');

      // Replace placeholders
      html = html
        .replace(/{{NAME}}/g, student.name)
        .replace(/{{EMAIL}}/g, student.email)
        .replace(/{{PASSWORD}}/g, credentials.password)
        .replace(/{{COURSE_NAME}}/g, courseName)
        .replace(/{{LOGIN_URL}}/g, `${process.env.FRONTEND_URL}/login`);

      await this.sendEmail({
        to: student.email,
        subject: 'Your Account Has Been Created',
        html
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }

  async sendCourseCompletionEmail(student, courseName, completionDate, certificateDetails) {
    try {
      const templatePath = path.join(__dirname, '../templates/emails/course-completion.html');
      let html = await fs.readFile(templatePath, 'utf-8');

      const dateStr = new Date(completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      
      let certText = '';
      let certButton = '';
      
      if (certificateDetails && certificateDetails.pdfUrl) {
        certText = 'Your certificate of completion has been generated and is now available for download.';
        const fullPdfUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}${certificateDetails.pdfUrl}`;
        certButton = `<a href="${fullPdfUrl}" target="_blank" class="btn">Download Certificate</a>`;
      }

      let profilePicHtml = '';
      if (student.name) {
        const parts = student.name.trim().split(' ');
        let initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]) : parts[0].substring(0, 2);
        initials = initials.toUpperCase();
        
        if (student.avatar_url) {
          const fullAvatarUrl = student.avatar_url.startsWith('http') ? student.avatar_url : `${process.env.FRONTEND_URL || 'http://localhost:3000'}${student.avatar_url}`;
          profilePicHtml = `<img src="${fullAvatarUrl}" alt="Profile Picture" style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-bottom: 20px; object-fit: cover;">`;
        } else {
          profilePicHtml = `<div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #4f46e5, #ec4899); color: #ffffff; font-size: 32px; font-weight: bold; line-height: 80px; text-align: center; border: 4px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin: 0 auto 20px auto;">${initials}</div>`;
        }
      }

      html = html
        .replace(/{{PROFILE_PICTURE_HTML}}/g, profilePicHtml)
        .replace(/{{STUDENT_NAME}}/g, student.name)
        .replace(/{{COURSE_NAME}}/g, courseName)
        .replace(/{{COMPLETION_DATE}}/g, dateStr)
        .replace(/{{CERTIFICATE_TEXT}}/g, certText)
        .replace(/{{CERTIFICATE_BUTTON}}/g, certButton)
        .replace(/{{FRONTEND_URL}}/g, process.env.FRONTEND_URL || 'http://localhost:3000');

      await this.sendEmail({
        to: student.email,
        subject: `Congratulations on Completing ${courseName}! 🎉`,
        html
      });
    } catch (error) {
      console.error('Failed to send course completion email:', error);
    }
  }

  async sendPlacementEmail(student, jobTitle, companyName) {
    try {
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #4f46e5;">🎉 Congratulations! You Have Been Selected</h2>
          <p>Dear ${student.name || 'Candidate'},</p>
          <p>We are thrilled to inform you that you have been selected for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
          <p>Your hard work and dedication have paid off. The employer will be reaching out to you shortly with the official offer details and your joining schedule.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/placements" style="display: inline-block; padding: 14px 30px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Placement Details</a>
          </div>
          <p style="font-size: 14px; color: #666;">If you have any questions, feel free to contact your career counselor or the employer directly.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">Kefta Talent Hunt Team</p>
        </div>
      `;

      await this.sendEmail({
        to: student.email,
        subject: `Congratulations! You Have Been Selected for ${jobTitle}`,
        html
      });
    } catch (error) {
      console.error('Failed to send placement email:', error);
    }
  }

  async sendExamCertificateEmail(candidate, exam, pdfBuffer) {
    try {
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #dc2626;">Congratulations! 🎉</h2>
          <p>Dear ${candidate.name},</p>
          <p>Thank you for participating in <strong>${exam.name}</strong>.</p>
          <p>We have attached your Verified GSFIN Personnel Competency Certificate to this email.</p>
          <p style="font-size: 14px; color: #666;">If you have any questions, feel free to contact us.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">GSFIN Certifying Authority Team</p>
        </div>
      `;

      await this.sendEmail({
        to: candidate.email,
        subject: `Your GSFIN Certificate for ${exam.name}`,
        html,
        attachments: [
          {
            filename: `GSFIN_Certificate_${exam.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
            content: pdfBuffer.toString('base64'),
          }
        ]
      });
    } catch (error) {
      console.error('Failed to send exam certificate email:', error);
    }
  }

  async sendFaceReEnrollmentEmail(candidate, exam, reEnrollUrl, customMessage = '') {
    try {
      const customMessageHtml = customMessage ? `
        <div style="background: #f1f5f9; border-left: 4px solid #dc2626; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
          <strong style="color: #334155; display: block; margin-bottom: 4px;">Message from Administrator:</strong>
          <span style="color: #475569; font-size: 14px; line-height: 1.5;">${customMessage}</span>
        </div>
      ` : '';

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px 24px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; background: #dc2626; color: #ffffff; font-size: 30px;">📷</div>
            <h2 style="color: #0f172a; margin-top: 14px; margin-bottom: 4px; font-size: 22px;">Face Profile Re-Enrollment</h2>
            <p style="color: #64748b; font-size: 15px; margin: 0; font-weight: 500;">${exam.name}</p>
          </div>
          
          <p style="font-size: 15px; line-height: 1.6;">Dear <strong>${candidate.name}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">The certification administration team has requested that you re-enroll your reference face profile for the examination: <strong>${exam.name}</strong>.</p>
          
          ${customMessageHtml}

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <div style="font-weight: bold; color: #1e293b; font-size: 14px; margin-bottom: 10px;">📋 Re-Enrollment Steps:</div>
            <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.8;">
              <li>Click the button below to open your secure re-enrollment link.</li>
              <li>Verify your identity by entering your registered <strong>Username/Email and Password</strong>.</li>
              <li>Allow camera access and capture <strong>3 reference face photos</strong> (Center, Slight Left, Slight Right).</li>
              <li>Review and submit your updated profile.</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${reEnrollUrl}" style="display: inline-block; padding: 14px 36px; background: #dc2626; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);">
              Re-Enroll Your Face Profile Now →
            </a>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 6px;">
            <strong style="color: #92400e; font-size: 13px; display: block; margin-bottom: 2px;">⚠️ Important Note:</strong>
            <span style="color: #78350f; font-size: 12px; line-height: 1.4;">This single-use link is valid for 48 hours and will automatically deactivate once your 3 photos are submitted.</span>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">If the button above does not work, copy and paste this link into your browser:<br><a href="${reEnrollUrl}" style="color: #dc2626; word-break: break-all;">${reEnrollUrl}</a></p>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">GSFIN Certifying Authority Security &amp; Proctoring Team</p>
        </div>
      `;

      await this.sendEmail({
        to: candidate.email,
        subject: `[Action Required] Face Re-Enrollment Link for ${exam.name}`,
        html
      });
    } catch (error) {
      console.error('Failed to send face re-enrollment email:', error);
    }
  }
}

export default new EmailService();
