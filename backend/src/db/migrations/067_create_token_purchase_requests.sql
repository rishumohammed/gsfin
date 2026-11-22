-- Migration 067: Create token_purchase_requests table
CREATE TABLE IF NOT EXISTS token_purchase_requests (
    id CHAR(36) PRIMARY KEY,
    org_id CHAR(36) NOT NULL,
    package_id CHAR(36) NOT NULL,
    token_count INT NOT NULL DEFAULT 0,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    requested_by_user_id CHAR(36) NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    payment_reference VARCHAR(255) NULL,
    admin_notes TEXT NULL,
    approved_by_user_id CHAR(36) NULL,
    approved_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tpr_org (org_id),
    INDEX idx_tpr_status (status),
    INDEX idx_tpr_package (package_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
