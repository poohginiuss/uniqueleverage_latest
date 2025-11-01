import { NextResponse } from 'next/server';
import { initializeDatabase, executeQuery } from '@/lib/mysql';

export async function GET() {
  try {
    await initializeDatabase();
    
    const rows = await executeQuery(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT 20'
    );
    
    // Ensure rows is an array for TypeScript
    const users = Array.isArray(rows) ? rows : [];
    
    return NextResponse.json({ 
      success: true, 
      users: users,
      count: users.length 
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
