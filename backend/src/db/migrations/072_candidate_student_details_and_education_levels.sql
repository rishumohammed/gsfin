-- 072_candidate_student_details_and_education_levels.sql
-- Add candidate student profile fields and system education levels configuration

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS password VARCHAR(255) NULL AFTER email,
  ADD COLUMN IF NOT EXISTS education_level VARCHAR(100) NULL AFTER phone,
  ADD COLUMN IF NOT EXISTS institution_name VARCHAR(255) NULL AFTER education_level,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(50) NULL AFTER institution_name,
  ADD COLUMN IF NOT EXISTS dob DATE NULL AFTER gender;

-- Create default education levels in system_config if not exists
INSERT INTO system_config (`key`, `value`)
VALUES ('education_levels', '["SSLC / 10th Standard", "Plus Two / 12th Standard", "Diploma", "Undergraduate / Bachelor Degree", "Postgraduate / Master Degree", "Doctorate / PhD", "Other / Professional"]')
ON DUPLICATE KEY UPDATE `value` = IF(`value` IS NULL OR `value` = '', VALUES(`value`), `value`);
