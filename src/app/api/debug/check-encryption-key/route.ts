import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    return NextResponse.json({
      success: true,
      encryptionKey: encryptionKey ? encryptionKey.substring(0, 10) + '...' : 'undefined',
      encryptionKeyLength: encryptionKey ? encryptionKey.length : 0,
      encryptionKeyType: typeof encryptionKey
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error)
    });
  }
}
