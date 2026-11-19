-- Migration 078: Allow 'converted' in contact_submissions status
ALTER TABLE contact_submissions MODIFY COLUMN status ENUM('new', 'read', 'replied', 'converted') DEFAULT 'new';
