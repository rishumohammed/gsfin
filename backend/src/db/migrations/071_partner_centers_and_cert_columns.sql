-- 071_partner_centers_and_cert_columns.sql
-- Add partner center profile columns and certificate management columns

ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Global Jurisdiction',
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'International',
  ADD COLUMN IF NOT EXISTS institution_type VARCHAR(100) DEFAULT 'Authorized Training Center',
  ADD COLUMN IF NOT EXISTS programs JSON NULL;

ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS cert_number VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS status ENUM('active', 'revoked') DEFAULT 'active';
