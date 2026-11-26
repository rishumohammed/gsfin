-- 085_student_face_enrollment_workflow.sql
-- Adds 3-pose email face enrollment & verification workflow columns to students table

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS face_status VARCHAR(50) DEFAULT 'waiting_face_enrollment',
  ADD COLUMN IF NOT EXISTS face_photos LONGTEXT NULL,
  ADD COLUMN IF NOT EXISTS face_enroll_token VARCHAR(128) NULL,
  ADD COLUMN IF NOT EXISTS face_enroll_token_expires_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS face_verify_token VARCHAR(128) NULL,
  ADD COLUMN IF NOT EXISTS face_verify_token_expires_at DATETIME NULL;

-- Backfill existing students who already have a face_photo enrolled
UPDATE students
SET face_status = 'registration_successful'
WHERE face_photo IS NOT NULL AND face_photo != '' AND (face_status IS NULL OR face_status = 'waiting_face_enrollment');
