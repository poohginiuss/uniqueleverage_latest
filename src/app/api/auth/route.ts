import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { executeQuery, initializeDatabase } from '@/lib/mysql';

export async function PUT(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { action, email, username, role } = await request.json();
    
    if (action === 'update_user') {
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }
      
      const updateFields = [];
      const updateValues = [];
      
      if (username) {
        updateFields.push('username = ?');
        updateValues.push(username);
      }
      
      if (role) {
        updateFields.push('role = ?');
        updateValues.push(role);
      }
      
      if (updateFields.length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }
      
      updateValues.push(email);
      
      const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE email = ?`;
      console.log('UPDATE SQL:', sql);
      console.log('UPDATE VALUES:', updateValues);
      
      const result = await executeQuery(sql, updateValues);
      console.log('UPDATE RESULT:', result);
      
      return NextResponse.json({ success: true, message: 'User updated successfully' });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Auth POST request received');
    // Initialize database on first request
    await initializeDatabase();
    console.log('Database initialized successfully');

          const { 
          action, 
          email, 
          password, 
          firstName, 
          lastName,
          dealershipName,
          phone,
          website,
          businessAddress,
          city,
          state,
          zip,
          subscriptionStatus,
          subscriptionId,
          customerId,
          subscriptionAmount,
          subscriptionProductName,
          subscriptionCurrency,
          verified,
          role
        } = await request.json();

    if (action === 'register') {
      // Register new user credentials
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }

      // Check if user already exists
      const existingUsers = await executeQuery(
        'SELECT id, password FROM users WHERE email = ?',
        [email]
      );
      
      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        // User already exists
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      // Hash password (in production, use bcrypt)
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      
            // Insert new user with all customer data
            const result = await executeQuery(
              `INSERT INTO users (
                email, password, first_name, last_name, name, username, role,
                dealership_name, phone, website, business_address, city, state, zip,
                subscription_status, subscription_id, customer_id, subscription_amount,
                subscription_product_name, subscription_currency, verified
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                email, 
                hashedPassword, 
                firstName || email.split('@')[0], 
                lastName || '', 
                dealershipName || email.split('@')[0], 
                email, // Use email as username 
                'customer', // All signups are customers by default
                dealershipName,
                phone,
                website,
                businessAddress,
                city,
                state,
                zip,
                subscriptionStatus,
                subscriptionId,
                customerId,
                subscriptionAmount,
                subscriptionProductName,
                subscriptionCurrency,
                verified || false
              ]
            );

      return NextResponse.json({ success: true, message: 'User registered successfully' });

    } else if (action === 'set-password') {
      // Set password for existing user (after email verification or password reset)
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }

      // Check if this is a password reset (token provided)
      const resetToken = request.headers.get('x-reset-token');
      if (resetToken) {
        // Validate reset token
        const tokenRows = await executeQuery(
          'SELECT email, expires FROM verification_tokens WHERE token = ? AND email = ?',
          [`reset_${resetToken}`, email]
        );
        
        if (!Array.isArray(tokenRows) || tokenRows.length === 0) {
          return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
        }
        
        const tokenData = tokenRows[0] as any;
        if (Date.now() > tokenData.expires) {
          // Clean up expired token
          await executeQuery(
            'DELETE FROM verification_tokens WHERE token = ?',
            [`reset_${resetToken}`]
          );
          return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 });
        }
        
        // Delete the used reset token
        await executeQuery(
          'DELETE FROM verification_tokens WHERE token = ?',
          [`reset_${resetToken}`]
        );
      }

      // Check if user exists
      const existingUsers = await executeQuery(
        'SELECT id, password FROM users WHERE email = ?',
        [email]
      );
      
      if (!Array.isArray(existingUsers) || existingUsers.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const existingUser = existingUsers[0] as any;
      
      console.log('Setting password for existing user:', existingUser.id);
      console.log('Current password field:', existingUser.password);
      
      // Hash password
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      
      // Update user with password and mark as verified
      await executeQuery(
        'UPDATE users SET password = ?, verified = 1 WHERE email = ?',
        [hashedPassword, email]
      );
      
      console.log('Password set successfully for user:', email);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Password set successfully',
        user: { email, verified: true }
      });

    } else if (action === 'login') {
      // Validate login credentials
      if (!email || !password) {
        return NextResponse.json({ error: 'Email/Username and password are required' }, { status: 400 });
      }

      // Determine if input is email or username based on format
      const isEmail = email.includes('@');
      let users;
      
      if (isEmail) {
        // Customer login - email only, no role check
        users = await executeQuery(
          'SELECT id, email, password, first_name, last_name, name, username, role FROM users WHERE email = ?',
          [email]
        );
      } else {
        // Admin login - username only, must have admin role
        users = await executeQuery(
          'SELECT id, email, password, first_name, last_name, name, username, role FROM users WHERE username = ? AND role = "admin"',
          [email] // Using 'email' variable as it contains the username input
        );
      }
      
      if (!Array.isArray(users) || users.length === 0) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const user = users[0] as any;

      // Verify password
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      if (user.password !== hashedPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      // Update last login using the actual email from the user record
      await executeQuery(
        'UPDATE users SET last_login_at = NOW() WHERE email = ?',
        [user.email]
      );

            return NextResponse.json({ 
              success: true, 
              message: 'Login successful',
              user: { email: user.email, firstName: user.first_name, lastName: user.last_name, name: user.name, username: user.username, role: user.role }
            });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Auth API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      env: {
        DB_HOST: process.env.DB_HOST ? 'Set' : 'Not set',
        DB_USER: process.env.DB_USER ? 'Set' : 'Not set',
        DB_NAME: process.env.DB_NAME ? 'Set' : 'Not set',
      }
    });
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// For debugging - get all users (remove in production)
export async function GET() {
  try {
    await initializeDatabase();
    
    const users = await executeQuery(
      `SELECT 
        id, email, first_name, last_name, name, username, role, dealership_name, phone, website, 
        business_address, city, state, zip, 
        subscription_status, subscription_id, customer_id, 
        subscription_amount, subscription_product_name, subscription_currency,
        verified, created_at, last_login_at 
      FROM users ORDER BY created_at DESC`
    );
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// Test endpoint to manually update a user's role
export async function PATCH(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { email, role } = await request.json();
    
    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }
    
    console.log(`Updating user ${email} to role ${role}`);
    
    const result = await executeQuery(
      'UPDATE users SET role = ? WHERE email = ?',
      [role, email]
    );
    
    console.log('PATCH RESULT:', result);
    
    return NextResponse.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    console.error('PATCH user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
