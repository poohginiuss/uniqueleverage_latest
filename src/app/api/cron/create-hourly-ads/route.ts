import { NextResponse } from "next/server";
import { URLSearchParams } from "url";
import { executeQuery } from "@/lib/mysql";

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

// Hardcoded for testing purposes
const AD_ACCOUNT_ID = "1982133785186174"; // Autoplex MKE Group
const ACCESS_TOKEN = "EAAFrsCQ5TCkBPotDH55utPzK0ZAPsWB4VOU5GroXZCGZBwKCJMtseH4esQYZBDUh09XhMw5tZAM3DaBbWO8HGgeQu3mgjkzEXzwe5xjyMXlqGZAbxTLgTRRlKVXtg4c7uMWsAmWnsyMroFotvM1IFRAb3i1LLp8lTf2DgIzxCQ8Mo4neybGZATKEdmBGs5EPE3NKrUZA";
const PAGE_ID = "1967231336900858";
const PIXEL_ID = "1510676406122421"; // Autoplexmke pixel
const EXISTING_CAMPAIGN_ID = "120234125841160089"; // Campaign with existing ads
const EXISTING_CREATIVE_ID = "1440488771040179"; // Reuse existing creative

// Vehicle pool for cycling through different vehicles each hour
const VEHICLE_POOL = [
  // SUVs
  {
    year: 2016,
    make: "Honda",
    model: "CR-V",
    trim: "EX-L",
    bodyStyle: "Sport Utility 4D",
    stockNumber: "P701509",
    exteriorColor: "Blue",
    id: "P701509",
    url: "https://www.autoplexmkewi.com/inventory/Honda/CR-V/P701509",
    category: "SUV"
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
    url: "https://www.autoplexmkewi.com/inventory/Toyota/RAV4/P701510",
    category: "SUV"
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
    url: "https://www.autoplexmkewi.com/inventory/Nissan/Rogue/P701511",
    category: "SUV"
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
    url: "https://www.autoplexmkewi.com/inventory/Subaru/Outback/P701512",
    category: "SUV"
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
    url: "https://www.autoplexmkewi.com/inventory/Mazda/CX-5/P701513",
    category: "SUV"
  },
  // Trucks
  {
    year: 2019,
    make: "Ford",
    model: "F-150",
    trim: "XLT SuperCrew 4WD",
    bodyStyle: "Pickup Truck",
    stockNumber: "P701515",
    exteriorColor: "Silver",
    id: "P701515",
    url: "https://www.autoplexmkewi.com/inventory/Ford/F-150/P701515",
    category: "Truck"
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
    url: "https://www.autoplexmkewi.com/inventory/Ram/1500/P701516",
    category: "Truck"
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
    url: "https://www.autoplexmkewi.com/inventory/GMC/Sierra/P701517",
    category: "Truck"
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
    url: "https://www.autoplexmkewi.com/inventory/Toyota/Tacoma/P701518",
    category: "Truck"
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
    url: "https://www.autoplexmkewi.com/inventory/Nissan/Titan/P701519",
    category: "Truck"
  }
];

// Helper function for Facebook API requests with error handling
async function fbRequest(endpoint: string, options: RequestInit = {}) {
  console.log(`🔗 Making Facebook API request to: ${endpoint}`);
  const res = await fetch(`${GRAPH_API_BASE}/${endpoint}`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    ...options,
  });
  const data = await res.json();
  console.log(`📡 Facebook API Response Status: ${res.status}`);
  console.log(`📡 Facebook API Response Data:`, JSON.stringify(data, null, 2));
  return { res, data };
}

// Helper function to wait for specified minutes
function wait(minutes: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, minutes * 60 * 1000));
}

// Helper function to select 5 vehicles for this hour (cycling through pool)
function selectVehiclesForHour(): any[] {
  const now = new Date();
  const hourIndex = now.getHours();
  
  // Use hour as seed to cycle through vehicles
  const startIndex = hourIndex % VEHICLE_POOL.length;
  const selectedVehicles = [];
  
  for (let i = 0; i < 5; i++) {
    const vehicleIndex = (startIndex + i) % VEHICLE_POOL.length;
    selectedVehicles.push(VEHICLE_POOL[vehicleIndex]);
  }
  
  return selectedVehicles;
}

// Helper function to fetch reporting data
async function fetchReportingData(campaignId: string, adSetIds: string[], adIds: string[]) {
  const reportingData: {
    campaign: any;
    adSets: Array<{ id: string; insights: any }>;
    ads: Array<{ id: string; insights: any }>;
  } = {
    campaign: null,
    adSets: [],
    ads: []
  };

  try {
    // Fetch campaign insights
    console.log('📊 Fetching campaign insights...');
    const campaignInsights = await fbRequest(`${campaignId}/insights?fields=impressions,clicks,spend,reach,frequency,cpc,cpm,ctr&date_preset=last_7d&access_token=${ACCESS_TOKEN}`);
    if (campaignInsights.res.ok && campaignInsights.data.data) {
      reportingData.campaign = campaignInsights.data.data[0];
    }

    // Fetch ad set insights
    console.log('📊 Fetching ad set insights...');
    for (const adSetId of adSetIds) {
      try {
        const adSetInsights = await fbRequest(`${adSetId}/insights?fields=impressions,clicks,spend,reach,frequency,cpc,cpm,ctr&date_preset=last_7d&access_token=${ACCESS_TOKEN}`);
        if (adSetInsights.res.ok && adSetInsights.data.data) {
          reportingData.adSets.push({
            id: adSetId,
            insights: adSetInsights.data.data[0]
          });
        }
      } catch (error) {
        console.log(`⚠️ Failed to fetch insights for ad set ${adSetId}:`, error);
      }
    }

    // Fetch ad insights
    console.log('📊 Fetching ad insights...');
    for (const adId of adIds) {
      try {
        const adInsights = await fbRequest(`${adId}/insights?fields=impressions,clicks,spend,reach,frequency,cpc,cpm,ctr&date_preset=last_7d&access_token=${ACCESS_TOKEN}`);
        if (adInsights.res.ok && adInsights.data.data) {
          reportingData.ads.push({
            id: adId,
            insights: adInsights.data.data[0]
          });
        }
      } catch (error) {
        console.log(`⚠️ Failed to fetch insights for ad ${adId}:`, error);
      }
    }

  } catch (error) {
    console.log('⚠️ Error fetching reporting data:', error);
  }

  return reportingData;
}

export async function GET(request: Request) {
  try {
    console.log('🕐 Starting hourly ad creation cron job...');
    const startTime = new Date();

    // Select 5 vehicles for this hour
    const selectedVehicles = selectVehiclesForHour();
    console.log('🚗 Selected vehicles for this hour:', selectedVehicles.map(v => `${v.year} ${v.make} ${v.model}`));

    const results: {
      timestamp: string;
      campaignId: string;
      vehicles: Array<{
        year: number;
        make: string;
        model: string;
        stockNumber: string;
        exteriorColor: string;
        vdpUrl: string;
        category: string;
      }>;
      adSets: Array<{ id: string }>;
      ads: Array<{ id: string }>;
      reporting: any;
      errors: Array<{
        vehicle: string;
        step: string;
        error: any;
      }>;
    } = {
      timestamp: startTime.toISOString(),
      campaignId: EXISTING_CAMPAIGN_ID,
      vehicles: [],
      adSets: [],
      ads: [],
      reporting: null,
      errors: []
    };

    // Create 5 ad sets and ads
    for (const vehicle of selectedVehicles) {
      try {
        console.log(`🎯 Creating ad set for ${vehicle.year} ${vehicle.make} ${vehicle.model}...`);
        
        const adSetName = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''} ${vehicle.bodyStyle || ''}`.trim();
        const stockNumber = vehicle.stockNumber || `UL-${String(vehicle.id).padStart(6, "0")}`;
        
        // Different targeting for trucks vs SUVs
        const isTruck = vehicle.category === "Truck";
        const interestId = isTruck ? "6003854168052" : "6003304473660"; // Trucks vs SUVs interest ID
        const interestName = isTruck ? "Trucks" : "SUVs";
        
        const adSetData = {
          name: adSetName,
          campaign_id: EXISTING_CAMPAIGN_ID,
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

        const { res: adSetResponse, data: adSetResult } = await fbRequest(`act_${AD_ACCOUNT_ID}/adsets`, {
          method: 'POST',
          body: new URLSearchParams({ ...adSetData, access_token: ACCESS_TOKEN })
        });

        if (!adSetResponse.ok) {
          const error = {
            vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            step: 'ad_set_creation',
            error: adSetResult
          };
          results.errors.push(error);
          console.error(`❌ Ad set creation failed for ${vehicle.make} ${vehicle.model}:`, adSetResult);
          
          // If campaign is archived or other critical error, wait 30 minutes
          if (adSetResult.error?.error_subcode === 1487866 || adSetResult.error?.code === 17) {
            console.log('⏳ Critical error detected, waiting 30 minutes before retry...');
            await wait(30);
          }
          continue;
        }

        // Create ad
        console.log(`📢 Creating ad for ${vehicle.make} ${vehicle.model}...`);
        
        const adData = {
          name: `Stock# ${stockNumber}`,
          adset_id: adSetResult.id,
          creative: JSON.stringify({
            creative_id: EXISTING_CREATIVE_ID
          }),
          status: "PAUSED"
        };

        const { res: adResponse, data: adResult } = await fbRequest(`act_${AD_ACCOUNT_ID}/ads`, {
          method: 'POST',
          body: new URLSearchParams({ ...adData, access_token: ACCESS_TOKEN })
        });

        if (!adResponse.ok) {
          const error = {
            vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            step: 'ad_creation',
            error: adResult
          };
          results.errors.push(error);
          console.error(`❌ Ad creation failed for ${vehicle.make} ${vehicle.model}:`, adResult);
          continue;
        }

        // Success - add to results
        results.vehicles.push({
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          stockNumber: stockNumber,
          exteriorColor: vehicle.exteriorColor,
          vdpUrl: vehicle.url,
          category: vehicle.category
        });
        results.adSets.push(adSetResult);
        results.ads.push(adResult);

        console.log(`✅ Successfully created ad for ${vehicle.make} ${vehicle.model}`);

      } catch (error: any) {
        const errorObj = {
          vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          step: 'general',
          error: error.message
        };
        results.errors.push(errorObj);
        console.error(`❌ General error for ${vehicle.make} ${vehicle.model}:`, error);
      }

      // Small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Fetch reporting data
    console.log('📊 Fetching reporting data...');
    const reportingData = await fetchReportingData(
      EXISTING_CAMPAIGN_ID,
      results.adSets.map(adSet => adSet.id),
      results.ads.map(ad => ad.id)
    );
    results.reporting = reportingData;

    // Log to database
    try {
      await executeQuery(`
        INSERT INTO facebook_daily_activity (date, activities, success_count, error_count)
        VALUES (CURDATE(), ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        activities = JSON_MERGE_PATCH(COALESCE(activities, '{}'), ?),
        success_count = success_count + ?,
        error_count = error_count + ?,
        updated_at = CURRENT_TIMESTAMP
      `, [
        JSON.stringify(results),
        results.ads.length,
        results.errors.length,
        JSON.stringify(results),
        results.ads.length,
        results.errors.length
      ]);
    } catch (dbError) {
      console.error('❌ Database logging failed:', dbError);
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.log(`✅ Hourly cron job completed in ${duration}ms`);
    console.log(`📊 Created ${results.ads.length} ads, ${results.errors.length} errors`);

    return NextResponse.json({
      success: true,
      message: `Hourly ad creation completed. Created ${results.ads.length} ads with ${results.errors.length} errors.`,
      duration: `${duration}ms`,
      results
    });

  } catch (error: any) {
    console.error('❌ Hourly cron job failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Hourly cron job failed',
      details: error.message 
    }, { status: 500 });
  }
}
