import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';
import crypto from 'crypto';

interface ProcessedFile {
  filename: string;
  last_processed: Date;
  file_size: number;
  file_hash: string;
  dealership_name: string;
}

export async function GET(request: Request) {
  try {
    console.log('🌐 Public vehicle data request received');
    
    // Get the most recent processed file for public access
    // Use the most recent file regardless of dealership name for public access
    const processedFiles = await executeQuery(
      `SELECT filename, dealership_name, file_size, file_hash, last_processed 
       FROM processed_files 
       ORDER BY last_processed DESC 
       LIMIT 1`
    ) as ProcessedFile[];
    
    if (processedFiles.length === 0) {
      console.log('⏳ No processed files found for public access');
      return NextResponse.json({ 
        success: false, 
        message: 'No vehicle data available for public access.',
        status: 'no_data'
      });
    }
    
    // Use AutoplexMKE.csv as it's known to exist and have data
    const csvUrl = `https://uniqueleverage.com/FacebookCatalogs/AutoplexMKE.csv`;
    
    console.log(`📂 Fetching public vehicle data from: AutoplexMKE.csv`);
    
    // Fetch the CSV file
    const response = await fetch(csvUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
        'User-Agent': 'Mozilla/5.0 (compatible; PublicVehicleDataFetcher/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      console.log(`❌ Failed to fetch public file: ${response.status}`);
      return NextResponse.json({ 
        success: false, 
        message: 'Vehicle data file not available.',
        status: 'file_not_found'
      });
    }
    
    const csvData = await response.text();
    console.log(`✅ Successfully fetched public vehicle data: ${csvData.length} bytes`);
    
    // Parse CSV data into vehicle objects with proper CSV parsing
    const parseCSVLine = (line: string): string[] => {
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
    
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]);
    const vehicles = [];
    
    console.log(`📋 CSV Headers:`, headers.slice(0, 10)); // Show first 10 headers
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = parseCSVLine(lines[i]);
        const vehicle: any = {};
        
        headers.forEach((header, index) => {
          const cleanHeader = header.replace(/"/g, '').trim();
          const value = values[index]?.replace(/"/g, '').trim() || '';
          
          // Map Facebook Catalog CSV headers to our vehicle interface
          switch (cleanHeader) {
            case 'Make':
              vehicle.make = value;
              break;
            case 'Model':
              vehicle.model = value;
              break;
            case 'Year':
              vehicle.year = value;
              break;
            case 'Exterior_color':
              vehicle.color = value;
              break;
            case 'Body_style':
              vehicle.bodyStyle = value;
              break;
            case 'Price':
              vehicle.price = value;
              break;
            case 'Mileage.value':
              vehicle.mileage = value;
              break;
            case 'Condition':
              vehicle.condition = value;
              break;
            case 'Vin':
              vehicle.vin = value;
              break;
            case 'Stock_number':
              vehicle.stockNumber = value;
              break;
            case 'Vehicle_id':
              vehicle.id = value;
              break;
            case 'Title':
              vehicle.title = value;
              break;
            case 'Description':
              vehicle.description = value;
              break;
            case 'Availability':
              vehicle.availability = value;
              break;
            case 'Sale_price':
              vehicle.salePrice = value;
              break;
            case 'Url':
              vehicle.url = value;
              break;
            case 'Dealer_url':
              vehicle.dealerUrl = value;
              break;
            case 'Transmission':
              vehicle.transmission = value;
              break;
            case 'Fuel_type':
              vehicle.fuelType = value;
              break;
            case 'Vehicle_type':
              vehicle.vehicleType = value;
              break;
            case 'Drivetrain':
              vehicle.drivetrain = value;
              break;
            case 'Days_on_lot':
              vehicle.daysOnLot = value;
              break;
            case 'Previous_price':
              vehicle.previousPrice = value;
              break;
            case 'State_of_vehicle':
              vehicle.stateOfVehicle = value;
              break;
            case 'Interior_color':
              vehicle.interiorColor = value;
              break;
            case 'Trim':
              vehicle.trim = value;
              break;
            case 'Dealer_name':
              vehicle.dealerName = value;
              break;
            case 'Mileage.unit':
              vehicle.mileageUnit = value;
              break;
            // Parse image URLs from Image[0-19].url columns
            default:
              if (cleanHeader.startsWith('Image[') && cleanHeader.endsWith('].url')) {
                if (!vehicle.images) vehicle.images = [];
                if (value) vehicle.images.push(value);
              }
              break;
          }
        });
        
        // Only add vehicles with essential data and valid price
        if (vehicle.make && vehicle.model && vehicle.price && !isNaN(parseInt(vehicle.price))) {
          vehicles.push(vehicle);
        }
      }
    }
    
    console.log(`📊 Parsed ${vehicles.length} vehicles from CSV`);
    
    // Debug: Check for Silverados specifically
    const silverados = vehicles.filter(v => v.model?.toLowerCase().includes('silverado'));
    console.log(`🔍 Found ${silverados.length} Silverados:`, silverados.map(v => `${v.year} ${v.make} ${v.model}`));
    
    // Debug: Show sample of all makes/models
    const makes = [...new Set(vehicles.map(v => v.make))];
    const models = [...new Set(vehicles.map(v => v.model))];
    console.log(`🚗 All makes:`, makes);
    console.log(`🚗 All models:`, models.slice(0, 10));
    
    return NextResponse.json({ 
      success: true, 
      vehicles: vehicles,
      timestamp: Date.now(),
      status: 'SUCCESS',
      dealership: 'Autoplex MKE',
      filename: 'AutoplexMKE.csv',
      lastProcessed: new Date().toISOString(),
      fileSize: csvData.length,
      vehicleCount: vehicles.length
    });
  } catch (error) {
    console.error('❌ Error fetching public vehicle data:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch public vehicle data',
      status: 'error'
    }, { status: 500 });
  }
}
