-- MySQL Schema for Multi-Tenant Conversation System
-- Add these tables to your existing MySQL database

-- Conversation Sessions Table (per customer)
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id VARCHAR(36) PRIMARY KEY,
    customer_id INT NOT NULL,
    title VARCHAR(255) DEFAULT 'New Chat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    INDEX idx_customer_id (customer_id),
    INDEX idx_active (is_active),
    INDEX idx_last_updated (last_updated)
);

-- Conversation Messages Table (per customer)
CREATE TABLE IF NOT EXISTS conversation_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    customer_id INT NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_created_at (created_at)
);

-- Wizard States Table (per customer)
CREATE TABLE IF NOT EXISTS wizard_states (
    session_id VARCHAR(36) PRIMARY KEY,
    customer_id INT NOT NULL,
    step INT NOT NULL DEFAULT 0,
    ad_type VARCHAR(50),
    selected_vehicle JSON,
    budget JSON,
    targeting JSON,
    ad_copy JSON,
    is_complete BOOLEAN DEFAULT 0,
    is_preview_mode BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id)
);

-- Add customer_id to existing users table if not already present
-- ALTER TABLE users ADD COLUMN customer_id INT;
-- ALTER TABLE users ADD INDEX idx_customer_id (customer_id);

