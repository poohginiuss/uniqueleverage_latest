import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Check authentication
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    // Use multiple geocoding services for better coverage
    let data: any[] = [];

    // 1. Try US Census Geocoding API (free, good for US addresses)
    try {
      const censusResponse = await fetch(
        `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(query)}&benchmark=2020&format=json`
      );

      if (censusResponse.ok) {
        const censusData = await censusResponse.json();
        
        if (censusData.result && censusData.result.addressMatches && censusData.result.addressMatches.length > 0) {
          const censusResults = censusData.result.addressMatches.map((match: any, index: number) => {
            const coords = match.coordinates;
            const address = match.addressComponents;
            
            return {
              id: `census-${index}`,
              name: match.matchedAddress,
              type: 'address',
              lat: coords.y,
              lng: coords.x,
              display_name: match.matchedAddress,
              address: {
                house_number: address.fromAddress,
                road: address.streetName + ' ' + (address.suffix || ''),
                city: address.city,
                state: address.state,
                postcode: address.zip
              },
              importance: 0.9 // High importance for Census results
            };
          });

          data = [...data, ...censusResults];
        }
      }
    } catch (error) {
      console.error('Census geocoding error:', error);
    }

    // 2. Try OpenStreetMap with better parameters for addresses
    try {
      const osmResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=15&addressdetails=1&extratags=1&namedetails=1&bounded=1&viewbox=-179.0,18.0,-66.0,72.0`,
        {
          headers: {
            'User-Agent': 'UniqueLeverage/1.0'
          }
        }
      );

      if (osmResponse.ok) {
        const osmData = await osmResponse.json();
        
        const osmResults = osmData.map((item: any) => {
          const address = item.address || {};
          let type = 'address';
          let name = item.display_name;
        
          // Determine location type and format name
          if (address.house_number && address.road) {
            type = 'address';
            name = item.display_name; // Keep full address
          } else if (address.postcode) {
            type = 'zip';
            name = `${address.postcode}`;
          } else if (address.city || address.town || address.village) {
            type = 'city';
            const cityName = address.city || address.town || address.village;
            const stateName = address.state;
            name = `${cityName}${stateName ? `, ${stateName}` : ''}`;
          } else if (address.county) {
            type = 'county';
            name = `${address.county} County`;
          } else if (address.state) {
            type = 'state';
            name = `State of ${address.state}`;
          } else {
            // For other results, keep the full display name
            type = 'place';
            name = item.display_name;
          }

          return {
            id: `osm-${item.place_id}`,
            name,
            type,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            display_name: item.display_name,
            address: address,
            importance: item.importance || 0.5
          };
        });

        data = [...data, ...osmResults];
      }
    } catch (error) {
      console.error('OpenStreetMap geocoding error:', error);
    }

    // Remove duplicates and sort by type priority
    const uniqueResults = data.filter((item: any, index: number, self: any[]) => 
      index === self.findIndex((t: any) => t.name === item.name && t.type === item.type)
    );

    const typePriority = { address: 1, place: 2, zip: 3, city: 4, county: 5, state: 6 };
    uniqueResults.sort((a: any, b: any) => {
      const priorityA = typePriority[a.type as keyof typeof typePriority] || 7;
      const priorityB = typePriority[b.type as keyof typeof typePriority] || 7;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      // If same type, sort by importance (higher importance first)
      return (b.importance || 0) - (a.importance || 0);
    });

    return NextResponse.json(uniqueResults);
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ error: 'Failed to fetch location data' }, { status: 500 });
  }
}
