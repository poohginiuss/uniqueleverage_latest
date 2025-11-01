import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';
import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import crypto from 'crypto';

// Simple encryption/decryption functions
function encrypt(text: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const keyBuffer = Buffer.from(key.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const keyBuffer = Buffer.from(key.padEnd(32, '0').slice(0, 32));
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode session token to get user email
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);
    
    // Get user ID
    const users = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];
    
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = users[0].id;
    
    // Get calendar integrations (Google or Microsoft)
    const integrations = await executeQuery(
      'SELECT * FROM user_integrations WHERE user_id = ? AND integration_type = ? AND status = ?',
      [userId, 'calendar', 'active']
    ) as any[];
    
    if (!integrations || integrations.length === 0) {
      return NextResponse.json({ 
        success: true, 
        integrations: [],
        calendars: []
      });
    }
    
    // Return integration data for frontend detection
    return NextResponse.json({ 
      success: true, 
      integrations: integrations,
      calendars: [] // We'll fetch calendars separately when needed
    });

  } catch (error: any) {
    console.error('Calendar integration error:', error);
    
    if (error.code === 'ETIMEDOUT') {
      return NextResponse.json({ 
        error: 'Database connection timeout. Please try again.' 
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred while fetching calendar integrations' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get integration ID from request body
    const { integrationId } = await request.json();

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 });
    }

    // Decode session token to get user email
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);
    
    // Get user ID
    const users = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];
    
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = users[0].id;

    // Verify the integration belongs to the user
    const integration = await executeQuery(
      'SELECT id FROM user_integrations WHERE id = ? AND user_id = ?',
      [integrationId, userId]
    ) as any[];

    if (!integration || integration.length === 0) {
      return NextResponse.json({ error: 'Integration not found or not authorized' }, { status: 404 });
    }

    // Delete associated calendars first
    await executeQuery(
      'DELETE FROM user_calendars WHERE integration_id = ?',
      [integrationId]
    );

    // Delete the integration
    await executeQuery(
      'DELETE FROM user_integrations WHERE id = ? AND user_id = ?',
      [integrationId, userId]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Integration disconnected successfully' 
    });

  } catch (error: any) {
    console.error('Error disconnecting integration:', error);
    
    if (error.code === 'ETIMEDOUT') {
      return NextResponse.json({ 
        error: 'Database connection timeout. Please try again.' 
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred while disconnecting integration' 
    }, { status: 500 });
  }
}