-- Database tables for inventory feed request system

-- Table to track feed requests
CREATE TABLE IF NOT EXISTS user_inventory_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  dealership_name VARCHAR(255) NOT NULL,
  provider_key VARCHAR(50) NOT NULL,
  expected_filename VARCHAR(255) NOT NULL,
  status ENUM('pending', 'connected') DEFAULT 'pending',
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  connected_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_expected_filename (expected_filename),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_provider_key (provider_key)
);

-- Table to track processed files
CREATE TABLE IF NOT EXISTS processed_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  dealership_name VARCHAR(255) NOT NULL,
  last_processed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_size BIGINT,
  file_hash VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_filename (filename),
  INDEX idx_dealership_name (dealership_name)
);
