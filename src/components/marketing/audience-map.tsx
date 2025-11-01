"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Location {
  id: string;
  name: string;
  type: 'city' | 'state' | 'county' | 'zip';
  lat: number;
  lng: number;
  radius: number;
}

interface AudienceMapProps {
  locations: Location[];
  onLocationsChange: (locations: Location[]) => void;
}

export default function AudienceMap({ locations, onLocationsChange }: AudienceMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
          if (response.ok) {
            const results = await response.json();
            setSearchResults(results);
            setShowResults(true);
          }
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    const initializeMap = async () => {
      try {
        // Clear any existing content
        if (mapRef.current) {
          mapRef.current.innerHTML = '';
        }

        const L = (await import('leaflet')).default;
        
        // Create map instance
        if (!mapRef.current) return;
        const map = L.map(mapRef.current, {
          center: [39.8283, -98.5795], // Center of US
          zoom: 4,
          zoomControl: true,
          dragging: true,
          touchZoom: true,
          doubleClickZoom: true,
          scrollWheelZoom: true,
          boxZoom: true,
          keyboard: true
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        mapInstanceRef.current = map;
      } catch (error) {
        console.error('Map initialization error:', error);
      }
    };

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(initializeMap, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (cleanupError) {
          console.error('Map cleanup error:', cleanupError);
        }
      }
    };
  }, []);

  // Update map with locations
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const updateMap = () => {
      const map = mapInstanceRef.current;
      const L = require('leaflet');

      // Clear existing markers
      markersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      markersRef.current = [];

      // Add new markers
      locations.forEach((location) => {
        if (location.type === 'state' || location.type === 'county') {
          // Use circle marker for states and counties
          const marker = L.circleMarker([location.lat, location.lng], {
            radius: 12,
            fillColor: '#3b82f6',
            color: '#1d4ed8',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.6
          }).addTo(map);

          marker.bindPopup(`
            <div class="text-sm">
              <div class="font-semibold">${location.name}</div>
              <div class="text-gray-600">${location.type === 'state' ? 'State' : 'County'}</div>
            </div>
          `);

          markersRef.current.push(marker);
        } else {
          // Use regular marker for cities and zips
          const marker = L.marker([location.lat, location.lng], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: '<div class="w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })
          }).addTo(map);

          marker.bindPopup(`
            <div class="text-sm">
              <div class="font-semibold">${location.name}</div>
              <div class="text-gray-600">${location.type === 'city' ? 'City' : 'ZIP Code'}</div>
              <div class="text-gray-500">${location.radius} mile radius</div>
            </div>
          `);

          markersRef.current.push(marker);

          // Add radius circle for cities and zips
          if (location.radius > 0) {
            const circle = L.circle([location.lat, location.lng], {
              radius: location.radius * 1609.34, // Convert miles to meters
              fillColor: '#3b82f6',
              color: '#1d4ed8',
              weight: 1,
              opacity: 0.3,
              fillOpacity: 0.05
            }).addTo(map);

            markersRef.current.push(circle);
          }
        }
      });
    };

    updateMap();
  }, [locations]);

  const handleLocationSelect = useCallback((result: any) => {
    const newLocation: Location = {
      id: `${result.type}-${Date.now()}`,
      name: result.name,
      type: result.type,
      lat: result.lat,
      lng: result.lng,
      radius: 25 // Default radius
    };

    // Check for duplicates
    const isDuplicate = locations.some(loc => 
      loc.name === newLocation.name && 
      loc.lat === newLocation.lat && 
      loc.lng === newLocation.lng
    );

    if (!isDuplicate) {
      onLocationsChange([...locations, newLocation]);
    }

    setSearchQuery('');
    setShowResults(false);
  }, [locations, onLocationsChange]);

  const handleRemoveLocation = useCallback((locationId: string) => {
    onLocationsChange(locations.filter(loc => loc.id !== locationId));
  }, [locations, onLocationsChange]);

  const handleRadiusChange = useCallback((locationId: string, newRadius: number) => {
    onLocationsChange(locations.map(loc => 
      loc.id === locationId ? { ...loc, radius: newRadius } : loc
    ));
  }, [locations, onLocationsChange]);

  const isQuickAddSelected = useCallback((type: 'state' | 'county' | 'radius25' | 'radius50') => {
    switch (type) {
      case 'state':
        return locations.some(loc => loc.type === 'state');
      case 'county':
        return locations.some(loc => loc.type === 'county');
      case 'radius25':
        return locations.some(loc => loc.type === 'city' && loc.radius === 25);
      case 'radius50':
        return locations.some(loc => loc.type === 'city' && loc.radius === 50);
      default:
        return false;
    }
  }, [locations]);

  const handleQuickAdd = useCallback((type: 'state' | 'county' | 'radius25' | 'radius50') => {
    // Check if this quick add is already selected
    const isAlreadySelected = isQuickAddSelected(type);
    
    if (isAlreadySelected) {
      // If already selected, remove it (toggle off)
      const filteredLocations = locations.filter(loc => {
        if (type === 'state' && loc.type === 'state') return false;
        if (type === 'county' && loc.type === 'county') return false;
        if (type === 'radius25' && loc.type === 'city' && loc.radius === 25) return false;
        if (type === 'radius50' && loc.type === 'city' && loc.radius === 50) return false;
        return true;
      });
      onLocationsChange(filteredLocations);
      return;
    }

    // Remove ALL existing quick add locations (mutually exclusive)
    const filteredLocations = locations.filter(loc => {
      // Remove all quick add locations
      if (loc.type === 'state') return false;
      if (loc.type === 'county') return false;
      if (loc.type === 'city' && (loc.radius === 25 || loc.radius === 50)) return false;
      return true;
    });

    let newLocation: Location;

    switch (type) {
      case 'state':
        newLocation = {
          id: `state-${Date.now()}`,
          name: 'State of Wisconsin',
          type: 'state',
          lat: 44.5,
          lng: -89.5,
          radius: 0
        };
        break;
      case 'county':
        newLocation = {
          id: `county-${Date.now()}`,
          name: 'Milwaukee County',
          type: 'county',
          lat: 43.0389,
          lng: -87.9065,
          radius: 0
        };
        break;
      case 'radius25':
        newLocation = {
          id: `city-${Date.now()}`,
          name: 'Milwaukee + 25 miles',
          type: 'city',
          lat: 43.0389,
          lng: -87.9065,
          radius: 25
        };
        break;
      case 'radius50':
        newLocation = {
          id: `city-${Date.now()}`,
          name: 'Milwaukee + 50 miles',
          type: 'city',
          lat: 43.0389,
          lng: -87.9065,
          radius: 50
        };
        break;
    }

    onLocationsChange([...filteredLocations, newLocation]);
  }, [locations, onLocationsChange, isQuickAddSelected]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search for cities, states, or ZIP codes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-8 sm:pl-10 text-sm sm:text-base border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
        <svg className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <div className="relative z-[9999] w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
          {searchResults.map((result) => (
            <button
              key={result.id}
              onClick={() => handleLocationSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  result.type === 'state' ? 'bg-blue-500' :
                  result.type === 'county' ? 'bg-green-500' :
                  result.type === 'city' ? 'bg-purple-500' : 'bg-orange-500'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{result.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{result.type}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Quick Add Locations */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Add Locations</div>
        <div className="space-y-2">
          <button
            onClick={() => handleQuickAdd('state')}
            className={`w-full p-3 text-left border rounded-lg transition-all duration-200 ${
              isQuickAddSelected('state')
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 shadow-sm dark:shadow-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isQuickAddSelected('state') ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {isQuickAddSelected('state') ? (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">State of Wisconsin</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Target entire state</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleQuickAdd('county')}
            className={`w-full p-3 text-left border rounded-lg transition-all duration-200 ${
              isQuickAddSelected('county')
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 shadow-sm dark:shadow-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isQuickAddSelected('county') ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {isQuickAddSelected('county') ? (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Milwaukee County</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Target county area</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleQuickAdd('radius25')}
            className={`w-full p-3 text-left border rounded-lg transition-all duration-200 ${
              isQuickAddSelected('radius25')
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 shadow-sm dark:shadow-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isQuickAddSelected('radius25') ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {isQuickAddSelected('radius25') ? (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">+25 Mile Radius</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Target within 25 miles</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleQuickAdd('radius50')}
            className={`w-full p-3 text-left border rounded-lg transition-all duration-200 ${
              isQuickAddSelected('radius50')
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 shadow-sm dark:shadow-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isQuickAddSelected('radius50') ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {isQuickAddSelected('radius50') ? (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">+50 Mile Radius</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Target within 50 miles</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="relative">
        <div 
          ref={mapRef}
          id="audience-map"
          className="w-full h-64 border border-gray-200 rounded-lg bg-gray-100"
        />
        {!mapInstanceRef.current && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Locations */}
      {locations.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Locations</div>
          <div className="space-y-2">
            {locations.map((location) => (
              <div key={location.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    location.type === 'state' ? 'bg-blue-500' :
                    location.type === 'county' ? 'bg-green-500' :
                    location.type === 'city' ? 'bg-purple-500' : 'bg-orange-500'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{location.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{location.type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Only show radius dropdown for city and zip locations, not for states or counties */}
                  {(location.type === 'city' || location.type === 'zip') && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400">Radius:</label>
                      <select
                        value={location.radius}
                        onChange={(e) => handleRadiusChange(location.id, parseInt(e.target.value))}
                        className="text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value={5}>5 mi</option>
                        <option value={10}>10 mi</option>
                        <option value={15}>15 mi</option>
                        <option value={25}>25 mi</option>
                        <option value={50}>50 mi</option>
                        <option value={100}>100 mi</option>
                      </select>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleRemoveLocation(location.id)}
                    className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}