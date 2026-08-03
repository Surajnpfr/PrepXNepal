-- PrepX Nepal payment claims (dynamic FIFO moderation queue)

CREATE TABLE IF NOT EXISTS payment_claims (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL,
  clerk_user_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  plan_code VARCHAR(64) NOT NULL,
  amount_npr INT NOT NULL,
  list_amount_npr INT NULL,
  promo_code VARCHAR(32) NULL,
  promo_discount_npr INT NOT NULL DEFAULT 0,
  payment_method VARCHAR(32) NOT NULL,
  transaction_ref VARCHAR(191) NOT NULL,
  screenshot_url TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  user_notes TEXT NULL,
  moderator_notes TEXT NULL,
  submitted_at DATETIME(3) NOT NULL,
  verified_at DATETIME(3) NULL,
  verified_by VARCHAR(255) NULL,
  verified_by_clerk_id VARCHAR(64) NULL,
  INDEX idx_payment_claims_status_submitted (status, submitted_at),
  INDEX idx_payment_claims_clerk (clerk_user_id),
  INDEX idx_payment_claims_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
