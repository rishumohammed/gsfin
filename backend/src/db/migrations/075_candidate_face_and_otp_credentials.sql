-- 075_candidate_face_and_otp_credentials.sql
-- Add candidate face photo, facial biometric descriptor, initial password, and OTP verification columns

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS initial_password VARCHAR(255) NULL AFTER password,
  ADD COLUMN IF NOT EXISTS face_photo LONGTEXT NULL,
  ADD COLUMN IF NOT EXISTS face_descriptor TEXT NULL,
  ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS otp_expires_at DATETIME NULL;

ALTER TABLE exam_assignments
  ADD COLUMN IF NOT EXISTS is_authenticated TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS face_verified TINYINT(1) DEFAULT 0;

