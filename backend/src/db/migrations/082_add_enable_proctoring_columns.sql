-- 082_add_enable_proctoring_columns.sql
-- Adds enable_proctoring column to exams and batches tables

ALTER TABLE exams 
  ADD COLUMN enable_proctoring TINYINT(1) DEFAULT 1;

ALTER TABLE batches 
  ADD COLUMN enable_proctoring TINYINT(1) DEFAULT NULL;

