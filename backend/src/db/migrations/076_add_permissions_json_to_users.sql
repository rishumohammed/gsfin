-- Migration 076: Add permissions_json to users and audit_logs table
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions_json JSON DEFAULT NULL AFTER status;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  target VARCHAR(255) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
