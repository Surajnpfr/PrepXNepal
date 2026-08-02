-- PrepX Nepal mock tests (Hostinger MySQL / phpMyAdmin)

CREATE TABLE IF NOT EXISTS mock_import_batches (
  id VARCHAR(64) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NULL,
  imported_by_email VARCHAR(255) NOT NULL,
  imported_by_name VARCHAR(255) NOT NULL,
  mock_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mock_tests (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  exam_type VARCHAR(64) NOT NULL DEFAULT 'Nepal CEE',
  mode ENUM('fixed','dynamic') NOT NULL,
  scope ENUM('full','subject','chapter') NOT NULL,
  subject VARCHAR(32) NULL,
  chapter_name VARCHAR(191) NULL,
  duration_sec INT NOT NULL,
  total_questions INT NOT NULL,
  questions_per_page INT NOT NULL DEFAULT 20,
  correct_marks DOUBLE NOT NULL DEFAULT 1,
  wrong_marks DOUBLE NOT NULL DEFAULT -0.25,
  unanswered_marks DOUBLE NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  coin_price INT NULL,
  year VARCHAR(32) NULL,
  allocation_json JSON NULL,
  import_batch_id VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_mocks_published (is_published),
  INDEX idx_mocks_mode_scope (mode, scope),
  INDEX idx_mocks_batch (import_batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mock_questions (
  mock_id VARCHAR(64) NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  position INT NOT NULL,
  PRIMARY KEY (mock_id, question_id),
  UNIQUE KEY uq_mock_position (mock_id, position),
  INDEX idx_mock_questions_mock (mock_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
