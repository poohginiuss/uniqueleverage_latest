require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function checkUser() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔍 Checking for user: gregoberry@live.com\n');
    
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['gregoberry@live.com']
    );

    if (rows.length > 0) {
      console.log('✅ USER FOUND!\n');
      console.log('📋 User Details:');
      console.log('================');
      const user = rows[0];
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Username:', user.username);
      console.log('Name:', user.name);
      console.log('First Name:', user.first_name);
      console.log('Last Name:', user.last_name);
      console.log('Phone:', user.phone);
      console.log('Dealership Name:', user.dealership_name);
      console.log('Website:', user.website);
      console.log('DMS Provider:', user.dms_provider);
      console.log('Business Address:', user.business_address);
      console.log('City:', user.city);
      console.log('State:', user.state);
      console.log('Zip:', user.zip);
      console.log('Customer ID:', user.customer_id);
      console.log('Subscription ID:', user.subscription_id);
      console.log('Subscription Status:', user.subscription_status);
      console.log('Subscription Amount:', user.subscription_amount);
      console.log('Subscription Currency:', user.subscription_currency);
      console.log('Subscription Product Name:', user.subscription_product_name);
      console.log('Role:', user.role);
      console.log('Verified:', user.verified);
      console.log('Created At:', user.created_at);
      console.log('================\n');
    } else {
      console.log('❌ USER NOT FOUND');
      console.log('The webhook may not have processed yet.\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkUser();


