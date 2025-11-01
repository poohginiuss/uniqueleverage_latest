import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, initializeDatabase } from '@/lib/mysql';

export async function GET(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();
    
    console.log('Testing verification tokens...');
    
    // Test if verification_tokens table exists
    const tables = await executeQuery('SHOW TABLES LIKE "verification_tokens"');
    console.log('Verification tokens table exists:', tables);
    
    // Test if we can insert a token
    const testToken = 'test-token-123';
    const testEmail = 'test@example.com';
    const testExpires = Date.now() + 3600000;
    
    try {
      await executeQuery(
        'INSERT INTO verification_tokens (token, email, expires) VALUES (?, ?, ?)',
        [testToken, testEmail, testExpires]
      );
      console.log('Successfully inserted test token');
      
      // Test if we can retrieve it
      const retrieved = await executeQuery(
        'SELECT email, expires FROM verification_tokens WHERE token = ?',
        [testToken]
      );
      console.log('Retrieved token:', retrieved);
      
      // Clean up test token
      await executeQuery(
        'DELETE FROM verification_tokens WHERE token = ?',
        [testToken]
      );
      console.log('Cleaned up test token');
      
      return NextResponse.json({
        success: true,
        message: 'Verification tokens system working',
        tableExists: Array.isArray(tables) && tables.length > 0,
        insertTest: true,
        retrieveTest: Array.isArray(retrieved) && retrieved.length > 0
      });
      
    } catch (insertError) {
      console.error('Error testing verification tokens:', insertError);
      const errorMessage = insertError instanceof Error ? insertError.message : 'Unknown error';
      return NextResponse.json({
        success: false,
        error: errorMessage,
        tableExists: Array.isArray(tables) && tables.length > 0
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error testing verification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
