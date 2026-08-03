-- PrepX Nepal admin-managed checkout promo codes

CREATE TABLE IF NOT EXISTS promo_codes (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(32) NOT NULL,
  description VARCHAR(500) NULL,
  discount_type ENUM('percent', 'fixed') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  applicable_plan_codes JSON NULL,
  max_redemptions INT NULL,
  redemption_count INT NOT NULL DEFAULT 0,
  starts_at DATETIME(3) NULL,
  expires_at DATETIME(3) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  created_by_clerk_id VARCHAR(64) NULL,
  created_by_name VARCHAR(255) NULL,
  UNIQUE KEY uq_promo_codes_code (code),
  INDEX idx_promo_codes_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
