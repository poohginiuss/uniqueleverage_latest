import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import fs from "fs";

async function initializeConversationSchema() {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'AutoplexMKE.db');
    
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('📊 Initializing conversation schema...');

    // Create conversation sessions table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS conversation_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // Create conversation messages table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS conversation_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES conversation_sessions(id)
      )
    `);

    // Create wizard states table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS wizard_states (
        session_id TEXT PRIMARY KEY,
        step INTEGER NOT NULL,
        ad_type TEXT,
        selected_vehicle TEXT,
        budget TEXT,
        targeting TEXT,
        ad_copy TEXT,
        is_complete BOOLEAN DEFAULT 0,
        is_preview_mode BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES conversation_sessions(id)
      )
    `);

    // Create indexes for performance
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON conversation_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_active ON conversation_sessions(is_active);
      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON conversation_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON conversation_messages(created_at);
    `);

    console.log('✅ Conversation schema initialized successfully!');
    
    await db.close();
  } catch (error) {
    console.error('❌ Error initializing conversation schema:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initializeConversationSchema()
    .then(() => {
      console.log('🎉 Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

export { initializeConversationSchema };




