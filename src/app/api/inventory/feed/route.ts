import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Inventory feed request received');
    
    // Get the inventory feed URL from query parameters or environment
    const feedUrl = request.nextUrl.searchParams.get('url') || 
                   process.env.USER_INVENTORY_FEED_URL || 
                   'http://localhost:3000/api/vehicles/public';
    
    console.log('🌐 Fetching from feed URL:', feedUrl);
    
    // Fetch from the user's inventory feed
    const response = await fetch(feedUrl, {
      headers: {
        'Accept': 'text/csv,application/json',
        'User-Agent': 'UniqueLeverage-AI-Agent/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from inventory feed: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    let data;
    
    if (contentType.includes('csv') || feedUrl.includes('.csv')) {
      // Handle CSV data
      const csvText = await response.text();
      console.log('📄 CSV data received, length:', csvText.length);
      
      // Parse CSV data with proper handling of quoted fields
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('No data found in CSV file');
      }
      
      // Parse CSV line handling quoted fields with commas
      const parseCSVLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };
      
      const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));
      const vehicles = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]).map(v => v.replace(/"/g, ''));
        if (values.length === headers.length) {
          const vehicle: { [key: string]: any } = {};
          headers.forEach((header, index) => {
            vehicle[header] = values[index];
          });
          vehicles.push(vehicle);
        }
      }
      
      data = {
        vehicles: vehicles,
        vehicleCount: vehicles.length,
        source: 'csv',
        headers: headers
      };
    } else {
      // Handle JSON data
      data = await response.json();
    }
    
    console.log('✅ Successfully fetched inventory data:', {
      source: feedUrl,
      vehicleCount: data.vehicles?.length || data.length || 0,
      dataKeys: Object.keys(data)
    });
    
    return NextResponse.json({
      success: true,
      source: feedUrl,
      data: data,
      vehicleCount: data.vehicles?.length || data.length || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Inventory feed error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch inventory feed',
      fallback: 'Using local CSV data'
    }, { status: 500 });
  }
}
