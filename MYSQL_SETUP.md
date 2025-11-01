# MySQL Setup Guide

## Environment Variables Required

Add the following to your `.env.local` file:

```bash
# MySQL Database Connection (cPanel)
DB_HOST=localhost
DB_USER=your_cpanel_db_username
DB_PASSWORD=your_cpanel_db_password
DB_NAME=your_cpanel_db_name
DB_PORT=3306
```

## cPanel MySQL Setup

### **Option 1: Use Existing Database**
If you already have a MySQL database in cPanel:

1. **Get Database Details** from cPanel:
   - Go to "MySQL Databases" in cPanel
   - Find your database name (usually `username_dbname`)
   - Find your database user (usually `username_dbuser`)
   - Note the password you set

2. **Update Environment Variables**:
   ```bash
   DB_HOST=localhost
   DB_USER=your_cpanel_username_yourdb
   DB_PASSWORD=your_database_password
   DB_NAME=your_cpanel_username_yourdb
   DB_PORT=3306
   ```

### **Option 2: Create New Database**
If you need to create a new database:

1. **Create Database** in cPanel:
   - Go to "MySQL Databases"
   - Create a new database (e.g., `uniqueleverage_auth`)
   - Create a new database user
   - Assign the user to the database with "All Privileges"

2. **Note the Details**:
   - Database name: `cpaneluser_dbname`
   - Username: `cpaneluser_dbuser`
   - Password: (what you set)

## Database Schema

The `users` table will be automatically created with this structure:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Production Deployment

For production (Render.com), add these environment variables:

1. Go to your Render service settings
2. Click "Environment"
3. Add these variables:
   - `DB_HOST`: Your cPanel database host
   - `DB_USER`: Your database username
   - `DB_PASSWORD`: Your database password
   - `DB_NAME`: Your database name
   - `DB_PORT`: 3306

## Benefits

- ✅ Uses your existing cPanel MySQL database
- ✅ No additional hosting costs
- ✅ Persistent storage across deployments
- ✅ Familiar MySQL environment
- ✅ Automatic table creation
- ✅ Connection pooling for performance

## Testing

Once you add the environment variables, the system will:
1. Automatically create the `users` table on first API call
2. Store user credentials securely
3. Handle login/logout across deployments
