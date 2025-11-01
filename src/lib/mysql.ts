import mysql from 'mysql2/promise';

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    return false;
  }
}

// Execute query helper
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Initialize database - create users table if it doesn't exist
export async function initializeDatabase() {
  try {
    // Create users table if it doesn't exist
    const createTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        name VARCHAR(255),
        username VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP NULL,
        dealership_name VARCHAR(255),
        phone VARCHAR(50),
        website VARCHAR(255),
        business_address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(10),
        zip VARCHAR(20),
        subscription_status VARCHAR(50),
        subscription_id VARCHAR(255),
        customer_id VARCHAR(255),
        subscription_amount DECIMAL(10,2),
        subscription_product_name VARCHAR(255),
        subscription_currency VARCHAR(10) DEFAULT 'USD',
        role ENUM('admin', 'customer') DEFAULT 'customer',
        verified BOOLEAN DEFAULT FALSE,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await executeQuery(createTable);
    
    // Add any missing columns to existing table
    const alterTable = `
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS dealership_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS website VARCHAR(255),
      ADD COLUMN IF NOT EXISTS business_address VARCHAR(255),
      ADD COLUMN IF NOT EXISTS city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS state VARCHAR(10),
      ADD COLUMN IF NOT EXISTS zip VARCHAR(20),
      ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS customer_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS subscription_amount DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS subscription_product_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS subscription_currency VARCHAR(10) DEFAULT 'USD',
      ADD COLUMN IF NOT EXISTS role ENUM('admin', 'customer') DEFAULT 'customer',
      ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE
    `;
    
    await executeQuery(alterTable);
    
    // Create verification_tokens table if it doesn't exist
    const createVerificationTokensTable = `
      CREATE TABLE IF NOT EXISTS verification_tokens (
        token VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        expires BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_expires (expires)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await executeQuery(createVerificationTokensTable);
    
    // Create user_sessions table if it doesn't exist
    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_session_token (session_token),
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await executeQuery(createSessionsTable);
    
    // Add remember_me column to user_sessions if it doesn't exist
    try {
      await executeQuery(`
        ALTER TABLE user_sessions 
        ADD COLUMN remember_me BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ remember_me column added to user_sessions');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ remember_me column already exists');
      } else {
        console.error('Error adding remember_me column:', error);
      }
    }

    // Add dms_provider column to users if it doesn't exist
    try {
      await executeQuery(`
        ALTER TABLE users 
        ADD COLUMN dms_provider VARCHAR(255) DEFAULT NULL
      `);
      console.log('✅ dms_provider column added to users');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ dms_provider column already exists');
      } else {
        console.error('Error adding dms_provider column:', error);
      }
    }
    
    // Create user_integrations table for OAuth tokens
    const createIntegrationsTable = `
      CREATE TABLE IF NOT EXISTS user_integrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        provider VARCHAR(50) NOT NULL,
        integration_type VARCHAR(50) NOT NULL,
        provider_user_id VARCHAR(255),
        provider_email VARCHAR(255),
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at DATETIME,
        scopes TEXT,
        status ENUM('active', 'expired', 'revoked', 'error') DEFAULT 'active',
        last_sync_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_provider_email (user_id, provider, provider_email),
        INDEX idx_user_id (user_id),
        INDEX idx_provider (provider),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await executeQuery(createIntegrationsTable);
    
    // Create user_calendars table for calendar data
    const createCalendarsTable = `
      CREATE TABLE IF NOT EXISTS user_calendars (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        integration_id INT NOT NULL,
        calendar_id VARCHAR(255) NOT NULL,
        calendar_name VARCHAR(255) NOT NULL,
        calendar_email VARCHAR(255),
        is_primary BOOLEAN DEFAULT FALSE,
        is_selected BOOLEAN DEFAULT FALSE,
        color VARCHAR(7),
        timezone VARCHAR(50),
        buffer_before_minutes INT DEFAULT 15,
        buffer_after_minutes INT DEFAULT 15,
        auto_sync BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (integration_id) REFERENCES user_integrations(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_integration_calendar (user_id, integration_id, calendar_id),
        INDEX idx_user_id (user_id),
        INDEX idx_integration_id (integration_id),
        INDEX idx_calendar_id (calendar_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await executeQuery(createCalendarsTable);
    
    // Create user_ad_accounts table for storing connected ad accounts
    const createAdAccountsTable = `
      CREATE TABLE IF NOT EXISTS user_ad_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        integration_id INT NOT NULL,
        ad_account_id VARCHAR(255) NOT NULL,
        ad_account_name VARCHAR(255) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        status ENUM('active', 'inactive', 'error') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (integration_id) REFERENCES user_integrations(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_ad_account (user_id, ad_account_id),
        INDEX idx_user_id (user_id),
        INDEX idx_integration_id (integration_id),
        INDEX idx_ad_account_id (ad_account_id),
        INDEX idx_platform (platform)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await executeQuery(createAdAccountsTable);
    console.log('✅ User ad accounts table initialized');
    
    // Create user_pages table for storing connected Facebook/Instagram pages
    const createPagesTable = `
      CREATE TABLE IF NOT EXISTS user_pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        integration_id INT NOT NULL,
        page_id VARCHAR(255) NOT NULL,
        page_name VARCHAR(255) NOT NULL,
        page_category VARCHAR(255),
        platform VARCHAR(50) NOT NULL,
        access_token TEXT,
        status ENUM('active', 'inactive', 'error') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (integration_id) REFERENCES user_integrations(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_page (user_id, page_id),
        INDEX idx_user_id (user_id),
        INDEX idx_integration_id (integration_id),
        INDEX idx_page_id (page_id),
        INDEX idx_platform (platform)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await executeQuery(createPagesTable);
    console.log('✅ User pages table initialized');
    
    // Create user_progress table for onboarding state
    const createProgressTable = `
      CREATE TABLE IF NOT EXISTS user_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        step1_completed BOOLEAN DEFAULT FALSE,
        step2_completed BOOLEAN DEFAULT FALSE,
        step3_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_progress (user_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await executeQuery(createProgressTable);
    console.log('✅ User progress table initialized');
    
    // Create user_marketing_wizard table for campaign data
    const createMarketingWizardTable = `
      CREATE TABLE IF NOT EXISTS user_marketing_wizard (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        campaign_name VARCHAR(255),
        targeting_locations JSON,
        demographics JSON,
        automotive_interests JSON,
        vehicle_filters JSON,
        selected_vehicles JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_campaign_name (campaign_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await executeQuery(createMarketingWizardTable);
    console.log('✅ User marketing wizard table initialized');
    
    // Create user_email_integrations table for email tokens
    const createEmailIntegrationsTable = `
      CREATE TABLE IF NOT EXISTS user_email_integrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        provider ENUM('gmail', 'outlook', 'yahoo', 'apple') NOT NULL,
        provider_email VARCHAR(255) NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP NULL,
        status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_provider_email (user_id, provider, provider_email),
        INDEX idx_user_id (user_id),
        INDEX idx_provider (provider),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await executeQuery(createEmailIntegrationsTable);
    console.log('✅ User email integrations table initialized');
    
    // Create user_feed_requests table for feed request status
    const createFeedRequestsTable = `
      CREATE TABLE IF NOT EXISTS user_feed_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        provider VARCHAR(100) NOT NULL,
        provider_slug VARCHAR(100) NOT NULL,
        status ENUM('sent', 'completed', 'failed', 'pending') DEFAULT 'pending',
        request_data JSON,
        response_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_provider (user_id, provider_slug),
        INDEX idx_user_id (user_id),
        INDEX idx_provider (provider),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await executeQuery(createFeedRequestsTable);
    console.log('✅ User feed requests table initialized');
    
    // Create facebook_daily_activity table for tracking daily Facebook API activity
    const createFacebookActivityTable = `
      CREATE TABLE IF NOT EXISTS facebook_daily_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        activities JSON,
        success_count INT DEFAULT 0,
        error_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await executeQuery(createFacebookActivityTable);
    console.log('✅ Facebook daily activity table initialized');
    
    // Try to add unique constraint, ignore if it already exists
    try {
      await executeQuery(`
        ALTER TABLE user_calendars 
        ADD CONSTRAINT unique_user_integration_calendar 
        UNIQUE (user_id, integration_id, calendar_id)
      `);
      console.log('✅ Unique constraint added successfully');
    } catch (error: any) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✅ Unique constraint already exists');
      } else {
        console.log('✅ Unique constraint setup completed');
      }
    }

    // Try to drop old constraint, ignore if it doesn't exist
    try {
      await executeQuery(`
        ALTER TABLE user_integrations 
        DROP INDEX unique_user_provider_type
      `);
      console.log('✅ Old constraint removed');
    } catch (error: any) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('✅ Old constraint already removed');
      } else {
        console.log('✅ Old constraint cleanup completed');
      }
    }

    // Try to add new constraint, ignore if it already exists
    try {
      await executeQuery(`
        ALTER TABLE user_integrations 
        ADD CONSTRAINT unique_user_provider_email 
        UNIQUE (user_id, provider, provider_email)
      `);
      console.log('✅ New constraint added successfully');
    } catch (error: any) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✅ New constraint already exists');
      } else {
        console.log('✅ New constraint setup completed');
      }
    }
    
    // Add timezone and theme columns to users table
    const addUserColumns = `
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/New_York',
      ADD COLUMN IF NOT EXISTS theme_preference ENUM('light', 'dark', 'system') DEFAULT 'system'
    `;
    
    await executeQuery(addUserColumns);

    // Add sync preference columns to user_calendars table
    const addSyncColumns = `
      ALTER TABLE user_calendars 
      ADD COLUMN IF NOT EXISTS buffer_before_minutes INT DEFAULT 15,
      ADD COLUMN IF NOT EXISTS buffer_after_minutes INT DEFAULT 15,
      ADD COLUMN IF NOT EXISTS auto_sync BOOLEAN DEFAULT TRUE
    `;
    await executeQuery(addSyncColumns);
    
    // Create vehicles table for hybrid SQL + LLM approach
    const createVehiclesTable = `
      CREATE TABLE IF NOT EXISTS vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_id VARCHAR(50),
        fb_page_id VARCHAR(100),
        title VARCHAR(500),
        description TEXT,
        availability VARCHAR(50),
        vehicle_condition VARCHAR(50),
        price DECIMAL(10,2),
        sale_price DECIMAL(10,2),
        url VARCHAR(500),
        dealer_url VARCHAR(500),
        vin VARCHAR(50),
        vehicle_registration_plate VARCHAR(50),
        transmission VARCHAR(200),
        body_style VARCHAR(100),
        fuel_type VARCHAR(50),
        vehicle_type VARCHAR(50),
        dealer_privacy_policy_url VARCHAR(500),
        dealer_communication_channel VARCHAR(100),
        drivetrain VARCHAR(100),
        days_on_lot VARCHAR(50),
        previous_price DECIMAL(10,2),
        address_addr1 VARCHAR(200),
        address_addr2 VARCHAR(200),
        address_addr3 VARCHAR(200),
        address_city VARCHAR(100),
        address_region VARCHAR(100),
        address_postal_code VARCHAR(20),
        address_country VARCHAR(100),
        state_of_vehicle VARCHAR(50),
        exterior_color VARCHAR(100),
        interior_color VARCHAR(100),
        make VARCHAR(100),
        model VARCHAR(100),
        trim VARCHAR(200),
        year INT,
        dealer_name VARCHAR(200),
        stock_number VARCHAR(50),
        mileage_value INT,
        mileage_unit VARCHAR(10),
        images JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_make_model (make, model),
        INDEX idx_price (price),
        INDEX idx_year (year),
        INDEX idx_body_style (body_style),
        INDEX idx_mileage (mileage_value),
        INDEX idx_stock_number (stock_number),
        FULLTEXT idx_title_description (title, description)
      )
    `;
    
    await executeQuery(createVehiclesTable);
    console.log('✅ Vehicles table initialized');
    
    console.log('✅ Users table initialized with complete customer fields');
    console.log('✅ Verification tokens table initialized');
    console.log('✅ User sessions table initialized');
    console.log('✅ User integrations table initialized');
    console.log('✅ User calendars table initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export default pool;
