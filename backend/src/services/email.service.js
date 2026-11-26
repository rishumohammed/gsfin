import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db/connection.js';
import { ConfigService } from './config.service.js';
import axios from 'axios';
import { getFrontendUrl } from '../utils/url-helper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class EmailService {
  constructor() {
    this.ready = false;
    this.resendApiKey = '';
    this.fromEmail = 'noreply@gsfin.uk';
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
      this.fromEmail = configMap.smtp_from_email || configMap.resend_from_email || process.env.RESEND_FROM || process.env.SMTP_FROM || 'noreply@gsfin.uk';
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
      const resetLink = `${getFrontendUrl()}/reset-password?token=${token}`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #007AFF;">Reset Your Password</h2>
          <p>You requested a password reset for your GSFIN Certification Portal account.</p>
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
        subject: 'Reset Your Password - GSFIN Certification Portal',
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
        .replace(/{{LOGIN_URL}}/g, `${getFrontendUrl()}/login`);

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
        const fullPdfUrl = `${getFrontendUrl()}${certificateDetails.pdfUrl}`;
        certButton = `<a href="${fullPdfUrl}" target="_blank" class="btn">Download Certificate</a>`;
      }

      let profilePicHtml = '';
      if (student.name) {
        const parts = student.name.trim().split(' ');
        let initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]) : parts[0].substring(0, 2);
        initials = initials.toUpperCase();
        
        if (student.avatar_url) {
          const fullAvatarUrl = student.avatar_url.startsWith('http') ? student.avatar_url : `${getFrontendUrl()}${student.avatar_url}`;
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
        .replace(/{{FRONTEND_URL}}/g, getFrontendUrl());

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
            <a href="${getFrontendUrl()}/dashboard/placements" style="display: inline-block; padding: 14px 30px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Placement Details</a>
          </div>
          <p style="font-size: 14px; color: #666;">If you have any questions, feel free to contact your career counselor or the employer directly.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">GSFIN Certification Authority Team</p>
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

  async sendExamCertificateEmail(candidate, exam, pdfBuffer = null, certData = null) {
    try {
      const frontendUrl = getFrontendUrl();
      const certNo = certData?.certificateNumber || 'GSFIN Certified';
      const pdfUrl = certData?.pdfUrl ? (certData.pdfUrl.startsWith('http') ? certData.pdfUrl : `${frontendUrl}${certData.pdfUrl}`) : null;
      const verifyUrl = `${frontendUrl}/verify-certificate?number=${encodeURIComponent(certNo)}`;

      let subject = `Your GSFIN Certificate for ${exam.name} is Ready 🎉`;
      let html = '';

      try {
        const [tplRows] = await pool.query("SELECT subject, body FROM email_templates WHERE id = 'exam_certificate'");
        if (tplRows && tplRows.length > 0 && tplRows[0].body) {
          subject = tplRows[0].subject || subject;
          html = tplRows[0].body;
        }
      } catch (_) {}

      if (html) {
        subject = subject
          .replace(/{{exam_name}}/g, exam.name)
          .replace(/{{name}}/g, candidate.name || 'Candidate');

        html = html
          .replace(/{{name}}/g, candidate.name || 'Candidate')
          .replace(/{{exam_name}}/g, exam.name)
          .replace(/{{certificate_number}}/g, certNo)
          .replace(/{{verify_url}}/g, verifyUrl)
          .replace(/{{download_url}}/g, pdfUrl || verifyUrl)
          .replace(/{{pdf_url}}/g, pdfUrl || verifyUrl);
      } else {
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
            <div style="background: #0f172a; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; border-bottom: 3px solid #e31b23;">
              <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.01em;">GSFIN CERTIFICATION REGISTRY</h2>
              <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Official Personnel Credential Award</p>
            </div>
            <p style="font-size: 15px; line-height: 1.6; margin-top: 0;">Dear <strong>${candidate.name || 'Candidate'}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              Congratulations on successfully passing the <strong>${exam.name}</strong> qualification examination!
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0f172a; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Official Certificate Record</h3>
              <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Examination:</strong> ${exam.name}</p>
              <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Certificate Number:</strong> <span style="font-family: monospace; font-weight: 600; color: #0f172a;">${certNo}</span></p>
              <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Status:</strong> <span style="color: #059669; font-weight: 600;">ACTIVE &amp; VERIFIED</span></p>
            </div>
            <div style="text-align: center; margin: 28px 0;">
              ${pdfUrl ? `<a href="${pdfUrl}" style="background: #e31b23; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(227, 27, 35, 0.25); margin: 6px;">Download Certificate PDF →</a>` : ''}
              <a href="${verifyUrl}" style="background: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; display: inline-block; margin: 6px;">Verify in Registry →</a>
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
              A PDF copy of your certificate has also been attached to this email for your records.
            </p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;">
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">GSFIN Global Standards &bull; Verified Personnel Certification Network</p>
          </div>
        `;
      }

      const attachments = [];
      if (pdfBuffer) {
        attachments.push({
          filename: `GSFIN_Certificate_${exam.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          content: pdfBuffer.toString('base64'),
        });
      }

      await this.sendEmail({
        to: candidate.email,
        subject,
        html,
        attachments
      });
      console.log(`[EmailService] Certificate email sent successfully to ${candidate.email}`);
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

  async sendCandidateCredentialsAndOtp({ to, studentName, email, password, otpCode, centerName }) {
    try {
      const subject = `Your Examination Credentials & Security OTP - GSFIN Accreditation`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #e31b23;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em;">GSFIN GLOBAL STANDARDS</h2>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Official Candidate Examination Access &amp; Biometric Verification</p>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Dear <strong>${studentName}</strong>,</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              You have been enrolled as an official certification candidate by <strong>${centerName || 'your authorized GSFIN Test Center'}</strong>.
              Please retain these credentials securely. You will be required to authenticate with your password and complete live camera face verification before taking your proctored certification examinations.
            </p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 12px;">Candidate Access Credentials</div>
              
              <div style="margin-bottom: 12px;">
                <span style="font-size: 12px; color: #64748b; display: block;">Username / Login Email:</span>
                <strong style="font-size: 15px; color: #0f172a; font-family: monospace;">${email}</strong>
              </div>

              <div style="margin-bottom: 12px;">
                <span style="font-size: 12px; color: #64748b; display: block;">Exam Access Password:</span>
                <strong style="font-size: 15px; color: #0f172a; font-family: monospace;">${password}</strong>
              </div>

              ${otpCode ? `
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin-top: 16px;">
                <span style="font-size: 12px; color: #991b1b; display: block; font-weight: 600;">One-Time Security OTP Code:</span>
                <div style="font-size: 26px; font-weight: 700; color: #e31b23; letter-spacing: 6px; font-family: monospace; margin-top: 4px;">${otpCode}</div>
                <span style="font-size: 11px; color: #b91c1c;">Use this 6-digit code for 2-factor verification on the exam login screen.</span>
              </div>
              ` : ''}
            </div>

            <div style="background: #f1f5f9; border-left: 4px solid #0f172a; padding: 14px 16px; border-radius: 4px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;">
                <strong>Biometric Live Check:</strong> Ensure your computer or smartphone has an operational camera. The exam portal will perform biometric face matching against your enrolled profile before granting sitting access.
              </p>
            </div>

            <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">GSFIN Global Standards &bull; Accreditation &amp; Assessment Security</p>
          </div>
        </div>
      `;

      const result = await this.sendEmail({
        to,
        subject,
        html
      });
      return { success: true, result };
    } catch (error) {
      console.error('Failed to send candidate credentials email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendStudentRegistrationOtp({ to, studentName, otpCode, centerName }) {
    try {
      const subject = `Your Verification Code: ${otpCode} - Student Registration`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #e31b23;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em;">GSFIN GLOBAL STANDARDS</h2>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Official Candidate Registration Verification</p>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Hello <strong>${studentName || 'Student'}</strong>,</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              Please use the verification code below to verify your email address and confirm your student enrollment at <strong>${centerName || 'GSFIN Authorized Test Center'}</strong>.
            </p>

            <div style="background: #fef2f2; border: 1.5px dashed #f87171; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #b91c1c; letter-spacing: 0.05em; margin-bottom: 8px;">Email Verification Code (OTP)</div>
              <div style="font-size: 36px; font-family: monospace; font-weight: 800; color: #e31b23; letter-spacing: 0.25em;">${otpCode}</div>
              <p style="font-size: 12px; color: #7f1d1d; margin: 8px 0 0 0;">This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
            </div>

            <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              This is an automated security verification from the GSFIN Examination &amp; Certification Network.
            </p>
          </div>
        </div>
      `;

      const result = await this.sendEmail({
        to,
        subject,
        html
      });
      return { success: true, result };
    } catch (error) {
      console.error('Failed to send student registration OTP email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendStudentFaceEnrollmentRequest({ to, studentName, centerName, enrollUrl }) {
    try {
      const subject = `Action Required: Enroll Your Face Profile (3 Photos) - GSFIN`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #e31b23;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em;">GSFIN GLOBAL STANDARDS</h2>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Step 1 of 2: Biometric Face Enrollment</p>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Dear <strong>${studentName || 'Candidate'}</strong>,</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              <strong>${centerName || 'An authorized GSFIN Test Center'}</strong> has initiated your candidate registration.
              To complete your registration, please enroll your biometric face profile by capturing <strong>3 reference photos</strong> (Front, Slight Left, and Slight Right) for higher accuracy during proctored examinations.
            </p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 22px 0;">
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 10px;">Enrollment Instructions</div>
              <ol style="margin: 0; padding-left: 18px; font-size: 13px; color: #334155; line-height: 1.8;">
                <li>Click the button below using a device with a working camera.</li>
                <li>Capture <strong>3 clear face photos</strong>: Front/Center, Slight Left, and Slight Right.</li>
                <li>Once submitted, you will receive a <strong>Face Verification link</strong> via email to confirm your face profile works properly.</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${enrollUrl}" style="display: inline-block; padding: 14px 32px; background: #e31b23; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">
                Enroll 3 Face Photos Now &rarr;
              </a>
            </div>

            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px;">
              If the button does not work, copy and paste this link into your browser:<br>
              <a href="${enrollUrl}" style="color: #e31b23; word-break: break-all;">${enrollUrl}</a>
            </p>

            <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              GSFIN Global Standards &bull; Accreditation &amp; Assessment Security
            </p>
          </div>
        </div>
      `;

      const result = await this.sendEmail({ to, subject, html });
      return { success: true, result };
    } catch (error) {
      console.error('Failed to send student face enrollment request email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendStudentFaceVerificationLink({ to, studentName, centerName, verifyUrl }) {
    try {
      const subject = `Step 2: Verify Your Enrolled Face Profile - GSFIN`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #e31b23;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em;">GSFIN GLOBAL STANDARDS</h2>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Step 2 of 2: Live Face Verification Check</p>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Dear <strong>${studentName || 'Candidate'}</strong>,</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              Your 3 reference face photos for <strong>${centerName || 'GSFIN Test Center'}</strong> have been saved!
              Before we finalize your registration, please click the button below to run a quick <strong>live face verification check</strong> so you can confirm your enrolled face profile is working accurately.
            </p>

            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px 20px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
                <strong>What happens next?</strong> Once your live face check passes, your registration will be marked successful and you will immediately receive your final <strong>Registration Confirmation &amp; Exam Credentials</strong> email.
              </p>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: #e31b23; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">
                Verify My Face Now &rarr;
              </a>
            </div>

            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px;">
              If the button does not work, copy and paste this link into your browser:<br>
              <a href="${verifyUrl}" style="color: #e31b23; word-break: break-all;">${verifyUrl}</a>
            </p>

            <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              GSFIN Global Standards &bull; Accreditation &amp; Assessment Security
            </p>
          </div>
        </div>
      `;

      const result = await this.sendEmail({ to, subject, html });
      return { success: true, result };
    } catch (error) {
      console.error('Failed to send student face verification link email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendStudentRegistrationConfirmation({ to, studentName, email, password, otpCode, centerName }) {
    try {
      const subject = `Registration Successful & Exam Credentials - GSFIN Accreditation`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #059669;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em;">GSFIN GLOBAL STANDARDS</h2>
            <p style="color: #86efac; margin: 4px 0 0 0; font-size: 13px;">Registration Confirmed &amp; Biometric Profile Verified</p>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Congratulations <strong>${studentName || 'Candidate'}</strong>,</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              Your biometric face verification was successful and your candidate registration with <strong>${centerName || 'your authorized GSFIN Test Center'}</strong> is now <strong>confirmed</strong>.
            </p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 12px;">Candidate Access Credentials</div>
              <div style="margin-bottom: 12px;">
                <span style="font-size: 12px; color: #64748b; display: block;">Username / Login Email:</span>
                <strong style="font-size: 15px; color: #0f172a; font-family: monospace;">${email}</strong>
              </div>
              ${password ? `
              <div style="margin-bottom: 12px;">
                <span style="font-size: 12px; color: #64748b; display: block;">Exam Access Password:</span>
                <strong style="font-size: 15px; color: #0f172a; font-family: monospace;">${password}</strong>
              </div>
              ` : ''}
              ${otpCode ? `
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin-top: 16px;">
                <span style="font-size: 12px; color: #991b1b; display: block; font-weight: 600;">One-Time Security OTP Code:</span>
                <div style="font-size: 26px; font-weight: 600; color: #e31b23; letter-spacing: 6px; font-family: monospace; margin-top: 4px;">${otpCode}</div>
                <span style="font-size: 11px; color: #b91c1c;">Use this 6-digit code for 2-factor verification on the exam login screen.</span>
              </div>
              ` : ''}
            </div>

            <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 14px 16px; border-radius: 4px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; color: #065f46; line-height: 1.5;">
                <strong>Ready for Examination:</strong> Your 3-pose biometric profile is verified and active. Please retain your credentials securely for your upcoming exam sitting.
              </p>
            </div>

            <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">GSFIN Global Standards &bull; Accreditation &amp; Assessment Security</p>
          </div>
        </div>
      `;

      const result = await this.sendEmail({ to, subject, html });
      return { success: true, result };
    } catch (error) {
      console.error('Failed to send student registration confirmation email:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();
