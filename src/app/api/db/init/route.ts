import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/mysql';

export async function POST(request: Request) {
  try {
    console.log('🔄 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialization completed');
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

