import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function addConversationTables() {
  let connection;
  
  try {
    console.log('🔗 Connecting to MySQL database...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'uniqueleverage_main',
      port: parseInt(process.env.DB_PORT || '3306')
    });

    console.log('✅ Connected to MySQL database');

    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'src/lib/mysql-conversation-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📊 Adding conversation tables...');

    // Split schema into individual statements and execute them
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await connection.execute(statement);
      }
    }

    console.log('✅ Conversation tables added successfully!');
    
    // Verify tables were created
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'conversation_%'"
    );
    
    const [wizardTables] = await connection.execute(
      "SHOW TABLES LIKE 'wizard_%'"
    );
    
    console.log('📋 Created tables:');
    (tables as any[]).forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    (wizardTables as any[]).forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });

  } catch (error) {
    console.error('❌ Error adding conversation tables:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run if called directly
if (require.main === module) {
  addConversationTables()
    .then(() => {
      console.log('🎉 Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

export { addConversationTables };
