-- Conversation Sessions Table
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

-- Conversation Messages Table
CREATE TABLE IF NOT EXISTS conversation_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    metadata TEXT, -- JSON string for wizard state, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES conversation_sessions(id)
);

-- Wizard States Table
CREATE TABLE IF NOT EXISTS wizard_states (
    session_id TEXT PRIMARY KEY,
    step INTEGER NOT NULL,
    ad_type TEXT,
    selected_vehicle TEXT, -- JSON string
    budget TEXT, -- JSON string
    targeting TEXT, -- JSON string
    ad_copy TEXT, -- JSON string
    is_complete BOOLEAN DEFAULT 0,
    is_preview_mode BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES conversation_sessions(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON conversation_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON conversation_messages(created_at);




