import { executeQuery } from "./mysql";

export async function createFacebookActivityTable() {
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS facebook_daily_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        activities JSON,
        success_count INT DEFAULT 0,
        error_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Facebook daily activity table created/verified');
  } catch (error) {
    console.error('❌ Error creating Facebook daily activity table:', error);
  }
}
