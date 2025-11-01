import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';
import crypto from 'crypto';

interface PendingRequest {
  id: number;
  user_id: number;
  dealership_name: string;
  provider_key: string;
  expected_filename: string;
  status: string;
}

interface ProcessedFile {
  filename: string;
  dealership_name: string;
  file_size: number;
  file_hash: string;
  last_processed: Date;
}

export async function GET(request: Request) {
  try {
    // Optional security check - you can add a secret key later
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.BACKGROUND_JOB_SECRET;
    
    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Starting background inventory monitoring...');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    const results = {
      timestamp: new Date().toISOString(),
      scanned: 0,
      newConnections: 0,
      fileUpdates: 0,
      errors: 0,
      details: [] as any[]
    };

    // 1. Get all feed requests from database (both pending and connected)
    const allRequests = await executeQuery(
      'SELECT * FROM user_inventory_requests ORDER BY request_date DESC'
    ) as PendingRequest[];
    
    console.log(`📋 Found ${allRequests.length} total feed requests to check`);
    results.scanned = allRequests.length;
    
    // 2. For each request, check if file exists and track changes
    for (const request of allRequests) {
      const filename = request.expected_filename;
      const fileUrl = `https://uniqueleverage.com/FacebookCatalogs/${filename}`;
      
      try {
        console.log(`\n🔎 Checking: ${filename}`);
        
        // Fetch file to check existence and get content for hashing
        const response = await fetch(fileUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'InventoryMonitor/1.0',
            'Accept': 'text/csv'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (response.ok) {
          // File exists! Get file details
          const fileContent = await response.text();
          const fileSize = fileContent.length;
          const fileHash = crypto.createHash('md5').update(fileContent).digest('hex');
          
          console.log(`  📦 File size: ${fileSize} bytes`);
          console.log(`  🔐 File hash: ${fileHash}`);
          
          // Check if we've processed this file before
          const existingFile = await executeQuery(
            'SELECT * FROM processed_files WHERE filename = ?',
            [filename]
          ) as ProcessedFile[];
          
          if (existingFile.length === 0) {
            // NEW FILE - First time seeing this file
            console.log(`  ✅ NEW FILE DETECTED: ${filename}`);
            
            // Insert into processed_files table
            await executeQuery(
              `INSERT INTO processed_files 
               (filename, dealership_name, file_size, file_hash, last_processed) 
               VALUES (?, ?, ?, ?, NOW())`,
              [filename, request.dealership_name, fileSize, fileHash]
            );
            
            // Update user_inventory_requests to "connected" if pending
            if (request.status === 'pending') {
              await executeQuery(
                'UPDATE user_inventory_requests SET status = "connected", connected_date = NOW() WHERE id = ?',
                [request.id]
              );
              results.newConnections++;
              console.log(`  🎉 Status updated to CONNECTED for user_id: ${request.user_id}`);
            }
            
            results.details.push({
              filename,
              status: 'new_file_detected',
              dealership: request.dealership_name,
              user_id: request.user_id
            });
            
          } else {
            // EXISTING FILE - Check if it's been updated
            const previousHash = existingFile[0].file_hash;
            const previousSize = existingFile[0].file_size;
            
            if (fileHash !== previousHash || fileSize !== previousSize) {
              // FILE HAS BEEN UPDATED
              console.log(`  🔄 FILE UPDATED: ${filename}`);
              console.log(`    Old hash: ${previousHash} → New hash: ${fileHash}`);
              console.log(`    Old size: ${previousSize} → New size: ${fileSize}`);
              
              // Update processed_files table
              await executeQuery(
                `UPDATE processed_files 
                 SET file_size = ?, file_hash = ?, last_processed = NOW(), updated_at = NOW() 
                 WHERE filename = ?`,
                [fileSize, fileHash, filename]
              );
              
              results.fileUpdates++;
              results.details.push({
                filename,
                status: 'file_updated',
                dealership: request.dealership_name,
                user_id: request.user_id,
                changes: {
                  size: { old: previousSize, new: fileSize },
                  hash_changed: fileHash !== previousHash
                }
              });
              
              console.log(`  ✅ File update recorded`);
            } else {
              console.log(`  ℹ️  File unchanged (already processed)`);
              
              results.details.push({
                filename,
                status: 'no_change',
                dealership: request.dealership_name
              });
            }
          }
          
        } else {
          // File not found yet (pending)
          console.log(`  ⏳ File not found yet: ${response.status}`);
          
          results.details.push({
            filename,
            status: 'pending',
            dealership: request.dealership_name,
            http_status: response.status
          });
        }
        
      } catch (error) {
        console.error(`  ❌ Error checking file ${filename}:`, error);
        results.errors++;
        
        results.details.push({
          filename,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log('\n📊 MONITORING SUMMARY:');
    console.log(`  Scanned: ${results.scanned}`);
    console.log(`  New Connections: ${results.newConnections}`);
    console.log(`  File Updates: ${results.fileUpdates}`);
    console.log(`  Errors: ${results.errors}`);
    console.log('✅ Background monitoring completed\n');
    
    return NextResponse.json({ 
      success: true,
      results
    });
    
  } catch (error) {
    console.error('❌ Background monitoring critical error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Monitoring failed' 
    }, { status: 500 });
  }
}

