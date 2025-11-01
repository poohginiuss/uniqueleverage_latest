import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userEmail = authResult.user.email;

    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' 
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Please upload an image smaller than 5MB.' 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const emailString = String(userEmail);
    const fileName = `avatar_${emailString.replace('@', '_').replace(/\./g, '_')}_${timestamp}.${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's okay
    }

    // Save file to public/uploads/avatars directory
    const filePath = join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate public URL
    const avatarUrl = `/uploads/avatars/${fileName}`;

    // Update user's avatar in database
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    try {
      await connection.execute(
        'UPDATE users SET avatar_url = ? WHERE email = ?',
        [avatarUrl, String(userEmail)]
      );
      
      await connection.end();
      
      return NextResponse.json({ 
        success: true, 
        avatarUrl: avatarUrl,
        message: 'Avatar uploaded successfully' 
      });
    } catch (dbError) {
      await connection.end();
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to update avatar in database' }, { status: 500 });
    }

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userEmail = authResult.user.email;

    // Remove avatar from database
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    try {
      await connection.execute(
        'UPDATE users SET avatar_url = NULL WHERE email = ?',
        [String(userEmail)]
      );
      
      await connection.end();
      
      return NextResponse.json({ 
        success: true,
        message: 'Avatar removed successfully' 
      });
    } catch (dbError) {
      await connection.end();
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to remove avatar from database' }, { status: 500 });
    }

  } catch (error) {
    console.error('Avatar removal error:', error);
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
  }
}
