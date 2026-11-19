-- Migration 077: Add lead fields to contact_submissions

ALTER TABLE contact_submissions MODIFY COLUMN name VARCHAR(255) NULL;
ALTER TABLE contact_submissions MODIFY COLUMN email VARCHAR(255) NULL;
ALTER TABLE contact_submissions MODIFY COLUMN phone VARCHAR(50) NULL;

-- Check and add columns safely if not exist
SET @dbname = DATABASE();
SET @tablename = "contact_submissions";

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = "center_name"
  ) > 0,
  "SELECT 1",
  "ALTER TABLE contact_submissions ADD COLUMN center_name VARCHAR(255) DEFAULT NULL AFTER name"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = "address"
  ) > 0,
  "SELECT 1",
  "ALTER TABLE contact_submissions ADD COLUMN address TEXT DEFAULT NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = "location"
  ) > 0,
  "SELECT 1",
  "ALTER TABLE contact_submissions ADD COLUMN location VARCHAR(255) DEFAULT NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = "district"
  ) > 0,
  "SELECT 1",
  "ALTER TABLE contact_submissions ADD COLUMN district VARCHAR(100) DEFAULT NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = "state"
  ) > 0,
  "SELECT 1",
  "ALTER TABLE contact_submissions ADD COLUMN state VARCHAR(100) DEFAULT NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = "country"
  ) > 0,
  "SELECT 1",
  "ALTER TABLE contact_submissions ADD COLUMN country VARCHAR(100) DEFAULT NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = "whatsapp"
  ) > 0,
  "SELECT 1",
  "ALTER TABLE contact_submissions ADD COLUMN whatsapp VARCHAR(50) DEFAULT NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = "website"
  ) > 0,
  "SELECT 1",
  "ALTER TABLE contact_submissions ADD COLUMN website VARCHAR(255) DEFAULT NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

