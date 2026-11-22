-- 079_ensure_students_columns.sql
-- Ensure all candidate student profile and credentials columns exist in students table across all MySQL versions

DROP PROCEDURE IF EXISTS AddStudentColumnIfNotExists;

DELIMITER $$
CREATE PROCEDURE AddStudentColumnIfNotExists(
    IN p_column_name VARCHAR(64),
    IN p_column_type VARCHAR(64)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'students' 
          AND COLUMN_NAME = p_column_name
    ) THEN
        SET @sql = CONCAT('ALTER TABLE students ADD COLUMN `', p_column_name, '` ', p_column_type);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

CALL AddStudentColumnIfNotExists('password', 'VARCHAR(255) NULL');
CALL AddStudentColumnIfNotExists('initial_password', 'VARCHAR(255) NULL');
CALL AddStudentColumnIfNotExists('face_photo', 'LONGTEXT NULL');
CALL AddStudentColumnIfNotExists('face_descriptor', 'TEXT NULL');
CALL AddStudentColumnIfNotExists('otp_code', 'VARCHAR(10) NULL');
CALL AddStudentColumnIfNotExists('otp_expires_at', 'DATETIME NULL');
CALL AddStudentColumnIfNotExists('education_level', 'VARCHAR(100) NULL');
CALL AddStudentColumnIfNotExists('institution_name', 'VARCHAR(255) NULL');
CALL AddStudentColumnIfNotExists('gender', 'VARCHAR(50) NULL');
CALL AddStudentColumnIfNotExists('dob', 'DATE NULL');

DROP PROCEDURE IF EXISTS AddStudentColumnIfNotExists;
