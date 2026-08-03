-- PrepX Nepal support / issue reports queue

CREATE TABLE IF NOT EXISTS support_issues (
  id VARCHAR(64) PRIMARY KEY,
  clerk_user_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  category VARCHAR(32) NOT NULL,
  body TEXT NOT NULL,
  status ENUM('open', 'resolved') NOT NULL DEFAULT 'open',
  staff_notes TEXT NULL,
  created_at DATETIME(3) NOT NULL,
  resolved_at DATETIME(3) NULL,
  resolved_by VARCHAR(255) NULL,
  resolved_by_clerk_id VARCHAR(64) NULL,
  INDEX idx_support_issues_status_created (status, created_at),
  INDEX idx_support_issues_clerk (clerk_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
