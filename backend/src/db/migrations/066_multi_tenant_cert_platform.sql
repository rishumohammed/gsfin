-- 066_multi_tenant_cert_platform.sql
-- Multi-Tenant Certification Platform Migration

-- 1. Modify users table to support main_admin & sub_center_staff roles and org_id link
ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'main_admin', 'sub_center_staff', 'crm_agent', 'tutor', 'student', 'employer', 'visitor') NOT NULL;
ALTER TABLE users ADD COLUMN org_id CHAR(36) NULL AFTER role;

-- 2. Organizations Table (Sub-centers only)
CREATE TABLE IF NOT EXISTS organizations (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    status ENUM('active', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Students Table (Scoped strictly to an organization)
CREATE TABLE IF NOT EXISTS students (
    id CHAR(36) PRIMARY KEY,
    org_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- 4. Exams Catalog Table
CREATE TABLE IF NOT EXISTS exams (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT DEFAULT 60,
    max_attempts INT DEFAULT 1,
    status ENUM('active', 'retired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Token Packages Catalog Table
CREATE TABLE IF NOT EXISTS token_packages (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    covers JSON COMMENT 'List of exam_ids or category tag e.g. ["*"]',
    token_count INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'retired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Sub-Center Wallets
CREATE TABLE IF NOT EXISTS sub_center_wallets (
    id CHAR(36) PRIMARY KEY,
    org_id CHAR(36) NOT NULL,
    package_id CHAR(36) NOT NULL,
    tokens_purchased INT NOT NULL DEFAULT 0,
    tokens_used INT NOT NULL DEFAULT 0,
    tokens_remaining INT NOT NULL DEFAULT 0,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES token_packages(id) ON DELETE RESTRICT
);

-- 7. Token Transactions Audit Trail
CREATE TABLE IF NOT EXISTS token_transactions (
    id CHAR(36) PRIMARY KEY,
    org_id CHAR(36) NOT NULL,
    wallet_id CHAR(36) NOT NULL,
    type ENUM('purchase', 'consume', 'refund_unused', 'refund_edit_removal') NOT NULL,
    token_count INT NOT NULL,
    related_batch_id CHAR(36) NULL,
    related_assignment_id CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_id) REFERENCES sub_center_wallets(id) ON DELETE CASCADE
);

-- 8. Batches Table
CREATE TABLE IF NOT EXISTS batches (
    id CHAR(36) PRIMARY KEY,
    org_id CHAR(36) NOT NULL,
    exam_id CHAR(36) NOT NULL,
    created_by CHAR(36) NOT NULL,
    status ENUM('draft', 'open', 'closed', 'cancelled') DEFAULT 'draft',
    opens_at DATETIME NULL,
    closes_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 9. Exam Assignments Table
CREATE TABLE IF NOT EXISTS exam_assignments (
    id CHAR(36) PRIMARY KEY,
    student_id CHAR(36) NOT NULL,
    exam_id CHAR(36) NOT NULL,
    batch_id CHAR(36) NOT NULL,
    wallet_id CHAR(36) NOT NULL,
    max_attempts INT NOT NULL,
    attempts_used INT NOT NULL DEFAULT 0,
    status ENUM('not_started', 'in_progress', 'passed', 'failed', 'expired') DEFAULT 'not_started',
    is_retry_link BOOLEAN DEFAULT FALSE,
    retry_link_expires_at DATETIME NULL,
    notified_at DATETIME NULL,
    reminder_sent_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_id) REFERENCES sub_center_wallets(id) ON DELETE CASCADE
);

-- 10. Exam Attempts Table
CREATE TABLE IF NOT EXISTS exam_attempts (
    id CHAR(36) PRIMARY KEY,
    assignment_id CHAR(36) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME NULL,
    end_reason ENUM('submitted', 'technical_void', 'force_ended_cutoff') NULL,
    result ENUM('pass', 'fail') NULL,
    granted_by ENUM('automatic', 'manual_subcenter') NULL,
    granted_by_user_id CHAR(36) NULL,
    FOREIGN KEY (assignment_id) REFERENCES exam_assignments(id) ON DELETE CASCADE
);

-- 11. Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id CHAR(36) PRIMARY KEY,
    assignment_id CHAR(36) NOT NULL UNIQUE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pdf_url VARCHAR(255) NULL,
    FOREIGN KEY (assignment_id) REFERENCES exam_assignments(id) ON DELETE CASCADE
);

-- 12. Seed system configuration
INSERT IGNORE INTO system_config (`key`, `value`, `group`, is_sensitive) VALUES 
('reminder_lead_time_hours', '24', 'notifications', FALSE);

-- 13. Pre-seed Default Token Packages
INSERT IGNORE INTO token_packages (id, name, covers, token_count, price, status) VALUES
('tp-starter-50', 'Starter Pack (50 Tokens)', '["*"]', 50, 500.00, 'active'),
('tp-pro-200', 'Pro Pack (200 Tokens)', '["*"]', 200, 1800.00, 'active'),
('tp-enterprise-1000', 'Enterprise Pack (1000 Tokens)', '["*"]', 1000, 8000.00, 'active');

-- 14. Pre-seed Standard Exams
INSERT IGNORE INTO exams (id, name, description, duration_minutes, max_attempts, status) VALUES
('ex-sec-fundamentals', 'Cybersecurity Fundamentals Certification', 'Comprehensive exam covering network security, threat vectors, and risk mitigation.', 60, 2, 'active'),
('ex-cloud-architect', 'Cloud Systems Architecture Exam', 'Advanced evaluation of multi-cloud deployment, infrastructure as code, and security compliance.', 90, 2, 'active'),
('ex-data-privacy', 'Global Data Privacy & Compliance', 'Certification testing knowledge of GDPR, CCPA, and ISO/IEC 27001 standards.', 45, 1, 'active');

-- 15. Pre-seed Demo Main Admin User & Demo Sub-Center Organization
-- Main Admin: mainadmin@certification.org / Password123!
INSERT IGNORE INTO users (id, role, org_id, name, email, password_hash, status) VALUES
('u-main-admin-01', 'main_admin', NULL, 'Authority Chief Administrator', 'mainadmin@certification.org', '$2b$10$mQDSYjJO4N9Vi8VOjRKliexBtGzZz846W39Zs6GaRexBQ8Leve6aO', 'active');

-- Sub-center Org: Apex Testing Center
INSERT IGNORE INTO organizations (id, name, contact_email, contact_phone, status) VALUES
('org-apex-01', 'Apex Testing Center', 'contact@apexcenter.com', '+1-555-0199', 'active');

-- Sub-center Staff User: staff@apexcenter.com / Password123!
INSERT IGNORE INTO users (id, role, org_id, name, email, password_hash, status) VALUES
('u-apex-staff-01', 'sub_center_staff', 'org-apex-01', 'Apex Center Administrator', 'staff@apexcenter.com', '$2b$10$mQDSYjJO4N9Vi8VOjRKliexBtGzZz846W39Zs6GaRexBQ8Leve6aO', 'active');
