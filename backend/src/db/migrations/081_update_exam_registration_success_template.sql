-- 081_update_exam_registration_success_template.sql
-- Update default exam_registration_success email template with Exam Window and GSFIN executive design

UPDATE email_templates 
SET subject = 'Registration Confirmed: {{exam_name}} - Exam Details & Access Link',
    body = '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
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
</div>'
WHERE id = 'exam_registration_success';
