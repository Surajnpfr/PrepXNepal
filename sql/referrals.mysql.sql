-- PrepX Nepal staff referral links + paid-conversion commissions (Hostinger MySQL)

CREATE TABLE IF NOT EXISTS referral_links (
  owner_clerk_id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(32) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  owner_role VARCHAR(64) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_referral_links_code (code),
  INDEX idx_referral_links_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS referral_attributions (
  referred_clerk_id VARCHAR(64) PRIMARY KEY,
  referrer_clerk_id VARCHAR(64) NOT NULL,
  code VARCHAR(32) NOT NULL,
  attributed_at DATETIME(3) NOT NULL,
  INDEX idx_referral_attr_referrer (referrer_clerk_id),
  INDEX idx_referral_attr_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS referral_commissions (
  id VARCHAR(64) PRIMARY KEY,
  claim_id VARCHAR(128) NOT NULL,
  referred_clerk_id VARCHAR(64) NOT NULL,
  referrer_clerk_id VARCHAR(64) NOT NULL,
  conversion_amount_npr INT NOT NULL,
  commission_rate DOUBLE NOT NULL,
  commission_amount_npr INT NOT NULL,
  status ENUM('pending', 'settled') NOT NULL DEFAULT 'pending',
  created_at DATETIME(3) NOT NULL,
  settled_at DATETIME(3) NULL,
  settled_by_clerk_id VARCHAR(64) NULL,
  UNIQUE KEY uq_referral_commissions_claim (claim_id),
  INDEX idx_referral_comm_referrer (referrer_clerk_id),
  INDEX idx_referral_comm_status (status),
  INDEX idx_referral_comm_referred (referred_clerk_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
