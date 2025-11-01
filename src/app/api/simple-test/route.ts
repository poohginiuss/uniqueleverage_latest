import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  console.log('=== SIMPLE TEST POST ===');
  console.log('This endpoint works without any imports or database');
  
  return NextResponse.json({ 
    success: true, 
    message: 'Simple test POST endpoint working',
    timestamp: new Date().toISOString()
  });
}
