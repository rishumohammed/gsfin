-- 069_proctoring_security_and_certificate_hold.sql
-- Adds proctoring_status column and proctoring_config JSON fields for AI security and certificate hold gate

ALTER TABLE public_exams 
  ADD COLUMN proctoring_config JSON NULL;

ALTER TABLE exams 
  ADD COLUMN proctoring_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN max_proctoring_warnings INT DEFAULT 3,
  ADD COLUMN enforce_fullscreen BOOLEAN DEFAULT FALSE,
  ADD COLUMN proctoring_config JSON NULL;

ALTER TABLE exam_attempts 
  ADD COLUMN proctoring_status ENUM('not_applicable', 'pending_review', 'approved', 'flagged') DEFAULT 'not_applicable',
  ADD COLUMN reference_selfie_url VARCHAR(255) NULL,
  ADD COLUMN baseline_vector JSON NULL;

ALTER TABLE public_exam_attempts 
  ADD COLUMN proctoring_status ENUM('not_applicable', 'pending_review', 'approved', 'flagged') DEFAULT 'not_applicable',
  ADD COLUMN reference_selfie_url VARCHAR(255) NULL,
  ADD COLUMN baseline_vector JSON NULL;

CREATE TABLE IF NOT EXISTS proctoring_events (
    id CHAR(36) PRIMARY KEY,
    attempt_id VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    metadata_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attempt_id (attempt_id)
);
