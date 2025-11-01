import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';

export async function POST(request: Request) {
  try {
    console.log('📥 Starting vehicle data import...');
    
    // Get the CSV data from the inventory feed
    const feedUrl = process.env.USER_INVENTORY_FEED_URL || 'https://uniqueleverage.com/FacebookCatalogs/AutoplexMKE.csv';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    console.log('🌐 Fetching data from:', feedUrl);
    
    const response = await fetch(`${baseUrl}/api/inventory/feed?url=${encodeURIComponent(feedUrl)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory data: ${response.status}`);
    }
    
    const feedData = await response.json();
    
    if (!feedData.success) {
      throw new Error(feedData.error || 'Failed to fetch inventory data');
    }
    
    const vehicles = feedData.data.vehicles || feedData.data;
    
    if (!Array.isArray(vehicles)) {
      throw new Error('Invalid vehicles data format');
    }
    
    console.log(`📊 Importing ${vehicles.length} vehicles into database...`);
    
    // Clear existing data
    await executeQuery('DELETE FROM vehicles');
    console.log('🗑️ Cleared existing vehicle data');
    
    // Import vehicles in batches
    const batchSize = 50;
    let importedCount = 0;
    
    for (let i = 0; i < vehicles.length; i += batchSize) {
      const batch = vehicles.slice(i, i + batchSize);
      
      for (const vehicle of batch) {
        // Parse images from individual Image[i].url fields
        const images = [];
        for (let j = 0; j < 20; j++) {
          const imageUrl = vehicle[`Image[${j}].url`];
          if (imageUrl && imageUrl.trim() !== '') {
            images.push(imageUrl.trim());
          }
        }
        
        // Debug logging for first vehicle
        if (importedCount === 0) {
          console.log('🔍 Debug first vehicle Image[0].url:', vehicle['Image[0].url']);
          console.log('🔍 Debug first vehicle images array:', images);
        }
        
        const insertQuery = `
          INSERT INTO vehicles (
            vehicle_id, fb_page_id, title, description, availability, vehicle_condition,
            price, sale_price, url, dealer_url, vin, vehicle_registration_plate,
            transmission, body_style, fuel_type, vehicle_type, dealer_privacy_policy_url,
            dealer_communication_channel, drivetrain, days_on_lot, previous_price,
            address_addr1, address_addr2, address_addr3, address_city, address_region,
            address_postal_code, address_country, state_of_vehicle, exterior_color,
            interior_color, make, model, trim, year, dealer_name, stock_number,
            mileage_value, mileage_unit, images
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          vehicle.Vehicle_id || null,
          vehicle.Fb_page_id || null,
          vehicle.Title || null,
          vehicle.Description || null,
          vehicle.Availability || null,
          vehicle.Condition || null,
          vehicle.Price ? parseFloat(vehicle.Price) : null,
          vehicle.Sale_price ? parseFloat(vehicle.Sale_price) : null,
          vehicle.Url || null,
          vehicle.Dealer_url || null,
          vehicle.Vin || null,
          vehicle.Vehicle_registration_plate || null,
          vehicle.Transmission || null,
          vehicle.Body_style || null,
          vehicle.Fuel_type || null,
          vehicle.Vehicle_type || null,
          vehicle.Dealer_privacy_policy_url || null,
          vehicle.Dealer_communication_channel || null,
          vehicle.Drivetrain || null,
          vehicle.Days_on_lot || null,
          vehicle.Previous_price ? parseFloat(vehicle.Previous_price) : null,
          vehicle['Address.addr1'] || null,
          vehicle['Address.addr2'] || null,
          vehicle['Address.addr3'] || null,
          vehicle['Address.city'] || null,
          vehicle['Address.region'] || null,
          vehicle['Address.postal_code'] || null,
          vehicle['Address.country'] || null,
          vehicle.State_of_vehicle || null,
          vehicle.Exterior_color || null,
          vehicle.Interior_color || null,
          vehicle.Make || null,
          vehicle.Model || null,
          vehicle.Trim || null,
          vehicle.Year ? parseInt(vehicle.Year) : null,
          vehicle.Dealer_name || null,
          vehicle.Stock_number || null,
          vehicle['Mileage.value'] ? parseInt(vehicle['Mileage.value']) : null,
          vehicle['Mileage.unit'] || null,
          JSON.stringify(images)
        ];
        
        await executeQuery(insertQuery, values);
        importedCount++;
      }
      
      console.log(`📈 Imported ${importedCount}/${vehicles.length} vehicles...`);
    }
    
    console.log(`✅ Successfully imported ${importedCount} vehicles into database`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedCount} vehicles`,
      importedCount,
      totalVehicles: vehicles.length
    });
    
  } catch (error) {
    console.error('❌ Vehicle import error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to import vehicles'
    }, { status: 500 });
  }
}
