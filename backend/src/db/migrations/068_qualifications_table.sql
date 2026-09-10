-- 068_qualifications_table.sql
-- Create qualifications table for GSFIN global food safety standards

CREATE TABLE IF NOT EXISTS qualifications (
    id CHAR(36) PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255) NULL,
    short_description TEXT NULL,
    full_description LONGTEXT NULL,
    category VARCHAR(100) DEFAULT 'Food Safety Standard',
    level VARCHAR(50) DEFAULT 'Professional',
    duration VARCHAR(100) DEFAULT '30 Hours Self-Paced',
    assessment_type VARCHAR(100) DEFAULT 'Online Exam',
    validity VARCHAR(100) DEFAULT '3 Years Global Validity',
    prerequisites TEXT NULL,
    key_modules JSON NULL,
    who_should_attend JSON NULL,
    benefits JSON NULL,
    badge_tag VARCHAR(100) DEFAULT 'GSFIN Standard',
    image_url VARCHAR(500) NULL,
    icon_name VARCHAR(100) DEFAULT 'mdi-shield-check-outline',
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL
);
