import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserFromSession, generateExpectedFilename } from '@/lib/auth-utils';
import { executeQuery } from '@/lib/mysql';
import crypto from 'crypto';

interface ConnectionStatus {
  status: string;
  connected_date: Date | null;
  provider_key: string;
}

interface ProcessedFile {
  filename: string;
  last_processed: Date;
  file_size: number;
  file_hash: string;
}

interface UserInventoryRequest {
  id: number;
  expected_filename: string;
  status: string;
}

export async function GET(request: Request) {
  try {
    // Get email from URL parameter (same pattern as /api/account)
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      console.log('❌ No email provided in URL parameters');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get user data from email
    const user = await getUserFromSession(email);
    if (!user) {
      console.log('❌ User not found for email:', email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`\n🔍 Fetching inventory for user: ${user.dealershipName} (ID: ${user.id})`);
    
    // Get the feed request (whether pending or connected)
    const feedRequest = await executeQuery(
      'SELECT id, expected_filename, status FROM user_inventory_requests WHERE user_id = ? ORDER BY request_date DESC LIMIT 1',
      [user.id]
    ) as UserInventoryRequest[];
    
    if (feedRequest.length === 0) {
      console.log('⏳ No feed request found for user');
      return NextResponse.json({ 
        success: false, 
        message: 'No inventory feed request found. Please submit a feed request first.',
        status: 'no_request',
        dealership: user.dealershipName
      });
    }
    
    const requestRecord = feedRequest[0];
    const expectedFilename = requestRecord.expected_filename;
    console.log(`📂 Checking for file: ${expectedFilename} (current status: ${requestRecord.status})`);
    
    const csvUrl = `https://uniqueleverage.com/FacebookCatalogs/${expectedFilename}`;
    
    // Attempt to fetch the file
    const response = await fetch(csvUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
        'User-Agent': 'Mozilla/5.0 (compatible; VehicleDataFetcher/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      // File doesn't exist yet
      console.log(`⏳ File not found yet: ${response.status} - Status remains: ${requestRecord.status}`);
      return NextResponse.json({ 
        success: false, 
        message: 'Inventory file not found yet. Please wait for your feed request to be processed.',
        status: 'pending',
        dealership: user.dealershipName
      });
    }
    
    // File exists! Get the data
    const csvData = await response.text();
    const fileSize = csvData.length;
    const fileHash = crypto.createHash('md5').update(csvData).digest('hex');
    
    console.log(`✅ Successfully fetched inventory file: ${fileSize} bytes`);
    
    // Check if file is already in processed_files table
    const existingFile = await executeQuery(
      'SELECT filename, file_hash, file_size FROM processed_files WHERE filename = ?',
      [expectedFilename]
    ) as ProcessedFile[];
    
    if (existingFile.length === 0) {
      // NEW FILE - Insert into processed_files
      console.log(`📝 Recording new file in database: ${expectedFilename}`);
      await executeQuery(
        `INSERT INTO processed_files (filename, dealership_name, file_size, file_hash, last_processed) 
         VALUES (?, ?, ?, ?, NOW())`,
        [expectedFilename, user.dealershipName, fileSize, fileHash]
      );
    } else if (existingFile[0].file_hash !== fileHash || existingFile[0].file_size !== fileSize) {
      // FILE UPDATED - Update processed_files
      console.log(`🔄 File has been updated - updating database record`);
      await executeQuery(
        `UPDATE processed_files 
         SET file_size = ?, file_hash = ?, last_processed = NOW(), updated_at = NOW() 
         WHERE filename = ?`,
        [fileSize, fileHash, expectedFilename]
      );
    }
    
    // If request status is still "pending", mark it as "connected" NOW
    if (requestRecord.status === 'pending') {
      console.log(`🎉 Marking feed request as CONNECTED (was pending)`);
      await executeQuery(
        'UPDATE user_inventory_requests SET status = "connected", connected_date = NOW() WHERE id = ?',
        [requestRecord.id]
      );
    }
    
    // Get updated connection info
    const connectionStatus = await executeQuery(
      `SELECT status, connected_date, provider_key 
       FROM user_inventory_requests 
       WHERE user_id = ?
       ORDER BY connected_date DESC`,
      [user.id]
    ) as ConnectionStatus[];
    
    return NextResponse.json({ 
      success: true, 
      data: csvData,
      timestamp: Date.now(),
      status: 'connected',
      dealership: user.dealershipName,
      filename: expectedFilename,
      connectedDate: connectionStatus[0]?.connected_date || new Date(),
      providers: connectionStatus.map(c => c.provider_key),
      fileSize: fileSize
    });
  } catch (error) {
    console.error('❌ Error fetching user inventory:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch inventory',
      status: 'error'
    }, { status: 500 });
  }
}
