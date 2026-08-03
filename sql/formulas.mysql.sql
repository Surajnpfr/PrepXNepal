-- Formula Library sheets + import batches (MySQL)

CREATE TABLE IF NOT EXISTS formula_import_batches (
  id VARCHAR(64) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NULL,
  imported_by_email VARCHAR(255) NOT NULL,
  imported_by_name VARCHAR(255) NOT NULL,
  sheet_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS formula_sheets (
  id VARCHAR(64) PRIMARY KEY,
  subject VARCHAR(32) NOT NULL,
  title VARCHAR(512) NOT NULL,
  chapter VARCHAR(255) NOT NULL,
  formulas_json JSON NOT NULL,
  batch_id VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_formula_sheets_subject (subject),
  INDEX idx_formula_sheets_batch (batch_id)
);
