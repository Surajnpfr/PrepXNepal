-- PrepX Nepal question bank (Hostinger MySQL / phpMyAdmin)

CREATE TABLE IF NOT EXISTS import_batches (
  id VARCHAR(64) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NULL,
  imported_by_email VARCHAR(255) NOT NULL,
  imported_by_name VARCHAR(255) NOT NULL,
  question_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(64) PRIMARY KEY,
  subject VARCHAR(32) NOT NULL,
  chapter VARCHAR(191) NOT NULL,
  stem TEXT NOT NULL,
  image_url TEXT NULL,
  options_json JSON NOT NULL,
  option_images_json JSON NULL,
  correct_option_key ENUM('A','B','C','D') NOT NULL,
  explanation TEXT NOT NULL,
  tags_json JSON NOT NULL,
  language ENUM('en','ne') NOT NULL DEFAULT 'en',
  status ENUM('pending_review','published','flagged') NOT NULL DEFAULT 'published',
  source VARCHAR(255) NULL,
  flag_count INT NOT NULL DEFAULT 0,
  batch_id VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_questions_subject (subject),
  INDEX idx_questions_status_subject (status, subject),
  INDEX idx_questions_batch (batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- If the table already exists, run:
-- ALTER TABLE questions ADD COLUMN image_url TEXT NULL;
-- ALTER TABLE questions ADD COLUMN option_images_json JSON NULL;
