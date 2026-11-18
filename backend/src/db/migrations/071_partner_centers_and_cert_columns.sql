-- 071_partner_centers_and_cert_columns.sql
-- Add partner center profile columns and certificate management columns

ALTER TABLE organizations ADD COLUMN country VARCHAR(100) DEFAULT 'Global Jurisdiction';
ALTER TABLE organizations ADD COLUMN city VARCHAR(100) DEFAULT 'International';
ALTER TABLE organizations ADD COLUMN institution_type VARCHAR(100) DEFAULT 'Authorized Training Center';
ALTER TABLE organizations ADD COLUMN programs JSON NULL;

ALTER TABLE certificates ADD COLUMN cert_number VARCHAR(100) NULL;
ALTER TABLE certificates ADD COLUMN status ENUM('active', 'revoked') DEFAULT 'active';

-- Initialize default partner countries and training programs
INSERT IGNORE INTO system_config (`key`, `value`, `group`, is_sensitive) VALUES
('partner_countries', '["India","United Arab Emirates","Saudi Arabia","Qatar","Oman","Kuwait","Bahrain","United Kingdom","United States","Singapore","Malaysia","Australia","Canada","Germany","Egypt","South Africa"]', 'partner', 0),
('partner_training_programs', '["CODEX HACCP","ISO 22000 Food Safety","Food Safety Manager","Halal Audit Certification","BRCGS Global Standard","FSSC 22000 Lead Auditor","Food Science & Technology","GHP & GMP Foundation"]', 'partner', 0);
