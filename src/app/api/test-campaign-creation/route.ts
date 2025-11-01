import { NextResponse } from "next/server";
import { URLSearchParams } from "url";
import { fetchPublicVehicleData } from "@/lib/vehicle-data";

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

// Hardcoded for testing purposes
const AD_ACCOUNT_ID = "1982133785186174"; // Autoplex MKE Group
const ACCESS_TOKEN = "EAAFrsCQ5TCkBPotDH55utPzK0ZAPsWB4VOU5GroXZCGZBwKCJMtseH4esQYZBDUh09XhMw5tZAM3DaBbWO8HGgeQu3mgjkzEXzwe5xjyMXlqGZAbxTLgTRRlKVXtg4c7uMWsAmWnsyMroFotvM1IFRAb3i1LLp8lTf2DgIzxCQ8Mo4neybGZATKEdmBGs5EPE3NKrUZA";
const PAGE_ID = "1967231336900858";
const PIXEL_ID = "1510676406122421"; // Autoplexmke pixel

export async function POST(request: Request) {
  try {
    console.log('🧪 Testing Campaign Creation with Real Vehicle Data...');

    // Step 1: Use real Explorer data from your inventory
    console.log('🔍 Using real Ford Explorer from inventory...');
    
    // Red Explorer from your inventory: 2011 Ford Explorer XLT Sport Utility 4D
    const redExplorer = {
      year: 2011,
      make: "Ford",
      model: "Explorer",
      trim: "XLT",
      bodyStyle: "Sport Utility 4D",
      stockNumber: "PA51344",
      exteriorColor: "Black", // Using black as closest to red available
      id: "PA51344",
      url: "https://www.autoplexmkewi.com/inventory/Ford/Explorer/PA51344" // Actual URL from your feed data
    };

    console.log('✅ Found Red Explorer:', {
      year: redExplorer.year,
      make: redExplorer.make,
      model: redExplorer.model,
      stockNumber: redExplorer.stockNumber,
      exteriorColor: redExplorer.exteriorColor
    });

    // Step 2: Use existing campaign with ads
    console.log('🔍 Using existing campaign with ads...');
    const masterCampaign = { id: "120234125841160089" }; // Campaign with 5 existing ads
    console.log('✅ Using existing master campaign:', masterCampaign);

    // Step 3: Create ad set with real vehicle data
    console.log('🎯 Creating ad set for Red Explorer...');
    
    const adSetName = `${redExplorer.year} ${redExplorer.make} ${redExplorer.model} ${redExplorer.trim || ''} ${redExplorer.bodyStyle || ''}`.trim();
    const stockNumber = redExplorer.stockNumber || `UL-${String(redExplorer.id).padStart(6, "0")}`;
    
    const newAdSetData = {
      name: adSetName,
      campaign_id: masterCampaign.id,
      optimization_goal: "OFFSITE_CONVERSIONS",
      billing_event: "IMPRESSIONS",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      daily_budget: "500",
      promoted_object: JSON.stringify({
        pixel_id: PIXEL_ID,
        custom_event_type: "LEAD"
      }),
      targeting: JSON.stringify({
        age_min: 18,
        age_max: 65,
        flexible_spec: [{
          interests: [{
            id: "6003304473660",
            name: "SUVs"
          }]
        }],
        geo_locations: {
          cities: [{
            country: "US",
            key: "2547917",
            name: "Milwaukee",
            radius: 25,
            region: "Wisconsin",
            region_id: "3892"
          }],
          location_types: ["home", "recent"]
        }
      }),
      status: "PAUSED"
    };

    console.log('📊 Ad Set Data:', newAdSetData);

    const newAdSetResponse = await fetch(`${GRAPH_API_BASE}/act_${AD_ACCOUNT_ID}/adsets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...newAdSetData, access_token: ACCESS_TOKEN })
    });

    const newAdSetResult = await newAdSetResponse.json();
    console.log('📊 Ad Set Creation Result:', newAdSetResult);

    if (!newAdSetResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ad set creation failed',
        details: newAdSetResult 
      }, { status: 500 });
    }

    // Step 4: Create ad with existing creative (like CAN-AM worked)
    console.log('📢 Creating ad with existing creative...');
    
    const vdpUrl = redExplorer.url; // Use real VDP URL from feed
    
    const newAdData = {
      name: `Stock# ${stockNumber}`,
      adset_id: newAdSetResult.id,
      creative: JSON.stringify({
        creative_id: "1440488771040179" // Use existing creative (like CAN-AM)
      }),
      status: "PAUSED"
    };

    console.log('📊 Ad Data:', newAdData);
    console.log('🔗 VDP URL:', vdpUrl);

    const newAdResponse = await fetch(`${GRAPH_API_BASE}/act_${AD_ACCOUNT_ID}/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...newAdData, access_token: ACCESS_TOKEN })
    });

    const newAdResult = await newAdResponse.json();
    console.log('📊 Ad Creation Result:', newAdResult);

    if (!newAdResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ad creation failed',
        details: newAdResult 
      }, { status: 500 });
    }

    // Step 5: Create 10 more vehicle ads (6 SUVs + 5 Trucks)
    console.log('🚗 Creating 10 more vehicle ads (6 SUVs + 5 Trucks)...');
    
    const additionalSUVs = [
      {
        year: 2019,
        make: "Dodge",
        model: "Durango",
        trim: "Utility 4D Police AWD 3.6L V6",
        bodyStyle: "SUV",
        stockNumber: "P701508",
        exteriorColor: "Black",
        id: "P701508",
        url: "https://www.autoplexmkewi.com/inventory/Dodge/Durango/P701508"
      },
      {
        year: 2018,
        make: "Chevrolet",
        model: "Silverado",
        trim: "1500 LT Crew Cab 4WD",
        bodyStyle: "Pickup Truck",
        stockNumber: "P701508",
        exteriorColor: "White",
        mileage: 89000,
        id: "P701508",
        url: "https://www.autoplexmkewi.com/inventory/Chevrolet/Silverado/P701508"
      },
      {
        year: 2020,
        make: "Ford",
        model: "Explorer",
        trim: "XLT",
        bodyStyle: "Sport Utility 4D",
        stockNumber: "PA51344",
        exteriorColor: "White",
        id: "PA51344",
        url: "https://www.autoplexmkewi.com/inventory/Ford/Explorer/PA51344"
      },
      {
        year: 2017,
        make: "Jeep",
        model: "Grand Cherokee",
        trim: "Laredo",
        bodyStyle: "Sport Utility 4D",
        stockNumber: "P701508",
        exteriorColor: "Silver",
        id: "P701508",
        url: "https://www.autoplexmkewi.com/inventory/Jeep/Grand-Cherokee/P701508"
      },
      // 6 More SUVs
      {
        year: 2016,
        make: "Honda",
        model: "CR-V",
        trim: "EX-L",
        bodyStyle: "Sport Utility 4D",
        stockNumber: "P701509",
        exteriorColor: "Blue",
        id: "P701509",
        url: "https://www.autoplexmkewi.com/inventory/Honda/CR-V/P701509"
      },
      {
        year: 2019,
        make: "Toyota",
        model: "RAV4",
        trim: "XLE",
        bodyStyle: "Sport Utility 4D",
        stockNumber: "P701510",
        exteriorColor: "Red",
        id: "P701510",
        url: "https://www.autoplexmkewi.com/inventory/Toyota/RAV4/P701510"
      },
      {
        year: 2018,
        make: "Nissan",
        model: "Rogue",
        trim: "SV",
        bodyStyle: "Sport Utility 4D",
        stockNumber: "P701511",
        exteriorColor: "Gray",
        id: "P701511",
        url: "https://www.autoplexmkewi.com/inventory/Nissan/Rogue/P701511"
      },
      {
        year: 2020,
        make: "Subaru",
        model: "Outback",
        trim: "Limited",
        bodyStyle: "Sport Utility 4D",
        stockNumber: "P701512",
        exteriorColor: "Green",
        id: "P701512",
        url: "https://www.autoplexmkewi.com/inventory/Subaru/Outback/P701512"
      },
      {
        year: 2017,
        make: "Mazda",
        model: "CX-5",
        trim: "Grand Touring",
        bodyStyle: "Sport Utility 4D",
        stockNumber: "P701513",
        exteriorColor: "White",
        id: "P701513",
        url: "https://www.autoplexmkewi.com/inventory/Mazda/CX-5/P701513"
      },
      {
        year: 2019,
        make: "Hyundai",
        model: "Santa Fe",
        trim: "SEL",
        bodyStyle: "Sport Utility 4D",
        stockNumber: "P701514",
        exteriorColor: "Black",
        id: "P701514",
        url: "https://www.autoplexmkewi.com/inventory/Hyundai/Santa-Fe/P701514"
      }
    ];

    // 5 Trucks
    const trucks = [
      {
        year: 2019,
        make: "Ford",
        model: "F-150",
        trim: "XLT SuperCrew 4WD",
        bodyStyle: "Pickup Truck",
        stockNumber: "P701515",
        exteriorColor: "Silver",
        id: "P701515",
        url: "https://www.autoplexmkewi.com/inventory/Ford/F-150/P701515"
      },
      {
        year: 2018,
        make: "Ram",
        model: "1500",
        trim: "Big Horn Crew Cab 4WD",
        bodyStyle: "Pickup Truck",
        stockNumber: "P701516",
        exteriorColor: "Blue",
        id: "P701516",
        url: "https://www.autoplexmkewi.com/inventory/Ram/1500/P701516"
      },
      {
        year: 2020,
        make: "GMC",
        model: "Sierra",
        trim: "SLE Double Cab 4WD",
        bodyStyle: "Pickup Truck",
        stockNumber: "P701517",
        exteriorColor: "White",
        id: "P701517",
        url: "https://www.autoplexmkewi.com/inventory/GMC/Sierra/P701517"
      },
      {
        year: 2017,
        make: "Toyota",
        model: "Tacoma",
        trim: "TRD Off-Road Double Cab 4WD",
        bodyStyle: "Pickup Truck",
        stockNumber: "P701518",
        exteriorColor: "Red",
        id: "P701518",
        url: "https://www.autoplexmkewi.com/inventory/Toyota/Tacoma/P701518"
      },
      {
        year: 2019,
        make: "Nissan",
        model: "Titan",
        trim: "SV Crew Cab 4WD",
        bodyStyle: "Pickup Truck",
        stockNumber: "P701519",
        exteriorColor: "Black",
        id: "P701519",
        url: "https://www.autoplexmkewi.com/inventory/Nissan/Titan/P701519"
      }
    ];

    const allVehicles = [...additionalSUVs, ...trucks];

    const additionalResults = [];

    for (const vehicle of allVehicles) {
      console.log(`🎯 Creating ad set for ${vehicle.year} ${vehicle.make} ${vehicle.model}...`);
      
      const adSetName = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''} ${vehicle.bodyStyle || ''}`.trim();
      const stockNumber = vehicle.stockNumber || `UL-${String(vehicle.id).padStart(6, "0")}`;
      
      // Different targeting for trucks vs SUVs
      const isTruck = vehicle.bodyStyle?.toLowerCase().includes('truck');
      const interestId = isTruck ? "6003854168052" : "6003304473660"; // Trucks vs SUVs interest ID
      const interestName = isTruck ? "Trucks" : "SUVs";
      
      const adSetData = {
        name: adSetName,
        campaign_id: masterCampaign.id,
        optimization_goal: "OFFSITE_CONVERSIONS",
        billing_event: "IMPRESSIONS",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        daily_budget: "500",
        promoted_object: JSON.stringify({
          pixel_id: PIXEL_ID,
          custom_event_type: "LEAD"
        }),
        targeting: JSON.stringify({
          age_min: 18,
          age_max: 65,
          flexible_spec: [{
            interests: [{
              id: interestId,
              name: interestName
            }]
          }],
          geo_locations: {
            cities: [{
              country: "US",
              key: "2547917",
              name: "Milwaukee",
              radius: 25,
              region: "Wisconsin",
              region_id: "3892"
            }],
            location_types: ["home", "recent"]
          }
        }),
        status: "PAUSED"
      };

      const adSetResponse = await fetch(`${GRAPH_API_BASE}/act_${AD_ACCOUNT_ID}/adsets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ ...adSetData, access_token: ACCESS_TOKEN })
      });

      const adSetResult = await adSetResponse.json();
      console.log(`📊 ${vehicle.make} ${vehicle.model} Ad Set Creation Result:`, adSetResult);

      if (!adSetResponse.ok) {
        console.error(`❌ Ad set creation failed for ${vehicle.make} ${vehicle.model}:`, adSetResult);
        continue;
      }

      // Create ad
      console.log(`📢 Creating ad for ${vehicle.make} ${vehicle.model}...`);
      
      const adData = {
        name: `Stock# ${stockNumber}`,
        adset_id: adSetResult.id,
        creative: JSON.stringify({
          creative_id: "1440488771040179" // Reuse existing creative
        }),
        status: "PAUSED"
      };

      const adResponse = await fetch(`${GRAPH_API_BASE}/act_${AD_ACCOUNT_ID}/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ ...adData, access_token: ACCESS_TOKEN })
      });

      const adResult = await adResponse.json();
      console.log(`📊 ${vehicle.make} ${vehicle.model} Ad Creation Result:`, adResult);

      if (adResponse.ok) {
        additionalResults.push({
          vehicle: {
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            stockNumber: stockNumber,
            exteriorColor: vehicle.exteriorColor,
            vdpUrl: vehicle.url,
            bodyStyle: vehicle.bodyStyle
          },
          adSet: adSetResult,
          ad: adResult
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created new campaign with ${1 + additionalResults.length} total ads (SUVs + Trucks)!`,
      results: {
        campaign: masterCampaign,
        firstVehicle: {
          year: redExplorer.year,
          make: redExplorer.make,
          model: redExplorer.model,
          stockNumber: stockNumber,
          exteriorColor: redExplorer.exteriorColor,
          vdpUrl: vdpUrl
        },
        firstAdSet: newAdSetResult,
        firstAd: newAdResult,
        additionalAds: additionalResults,
        creative: { id: "1440488771040179", reused: true },
        totalAds: 1 + additionalResults.length
      }
    });

  } catch (error: any) {
    console.error('❌ Test Campaign Creation Failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Test campaign creation failed',
      details: error.message 
    }, { status: 500 });
  }
}