import React, { useState, useEffect } from 'react';

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  price: number;
  bodyStyle: string;
  images?: string[];
}

interface VehiclePreviewProps {
  promotionType: 'single' | 'set' | null;
  selectedVehicles: Vehicle[];
  selectedSet?: { name: string };
  callToAction?: string;
  primaryText?: string;
  headline?: string;
}

export default function VehiclePreview({ promotionType, selectedVehicles, selectedSet, callToAction, primaryText, headline }: VehiclePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullText, setShowFullText] = useState(false);

  const maxVehicles = Math.min(selectedVehicles.length, 10); // Limit to 10 for UI

  // Force re-render when callToAction changes
  useEffect(() => {
    // This ensures the component updates when callToAction changes
  }, [callToAction]);

  // Function to truncate text to 3 lines (Facebook style)
  const truncateText = (text: string, maxLines: number = 3) => {
    // Split by newlines and filter out empty lines to ensure we get actual content lines
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length <= maxLines) {
      return { text, isTruncated: false };
    }
    
    // Take the first 3 non-empty lines and join them without extra spacing
    const visibleLines = lines.slice(0, maxLines);
    return {
      text: visibleLines.join('\n'),
      isTruncated: true
    };
  };

  if (promotionType === 'set' && selectedVehicles.length > 1) {
    // Facebook-style carousel for sets with multiple cards
    return (
      <div className="w-full flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
        {/* Facebook-style header */}
        <div className="p-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">UL</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Unique Leverage</div>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span>Sponsored</span>
                <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Text - Above the carousel like Facebook */}
        {primaryText && (
          <div className="p-3 flex-shrink-0">
            <div className="flex items-end justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line flex-1">
                {showFullText ? primaryText : truncateText(primaryText).text}
              </p>
              {truncateText(primaryText).isTruncated && !showFullText && (
                <button
                  onClick={() => setShowFullText(true)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm ml-2 flex-shrink-0"
                >
                  ...See more
                </button>
              )}
            </div>
            {showFullText && truncateText(primaryText).isTruncated && (
              <button
                onClick={() => setShowFullText(false)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs sm:text-sm mt-1"
              >
                See less
              </button>
            )}
          </div>
        )}

        {/* Facebook-style carousel showing multiple cards */}
        <div className="relative overflow-hidden flex-shrink-0" style={{ height: '300px', aspectRatio: '4/3' }}>
          <div
            className="flex transition-transform duration-300 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
          >
            {selectedVehicles.slice(0, maxVehicles).map((vehicle, index) => (
              <div key={vehicle.id} className="w-1/3 h-full flex-shrink-0 px-1">
                <div className="w-full h-full rounded-lg overflow-hidden shadow-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 relative group hover:shadow-lg transition-shadow duration-200">
                  {/* Vehicle Image */}
                  {vehicle.images && vehicle.images.length > 0 ? (
                    <img
                      src={vehicle.images[0]}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Vehicle Info */}
                  <div className="p-2 bg-white dark:bg-gray-800">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {vehicle.bodyStyle}
                    </p>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* Navigation arrows */}
          {maxVehicles > 3 && (
            <>
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-95 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-100 shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl z-10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(Math.ceil(maxVehicles / 3) - 1, prev + 1))}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-95 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-100 shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl z-10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Set label */}
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
            {selectedSet?.name || 'Vehicle Set'}
          </div>
        </div>

        {/* Ad Footer - Below the carousel like Facebook */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">uniqueleverage.com</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {headline || 'HOME - Unique Leverage'}
              </div>
            </div>
            {callToAction && (
              <button className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-1.5 px-4 rounded text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                {callToAction}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Single image for individual vehicles
  if (selectedVehicles.length > 0 && selectedVehicles[0].images && selectedVehicles[0].images.length > 0) {
    return (
      <div className="w-full flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
        {/* Facebook-style header */}
        <div className="p-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">UL</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Unique Leverage</div>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span>Sponsored</span>
                <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Text - Above the image like Facebook */}
        {primaryText && (
          <div className="p-3 flex-shrink-0">
            <div className="flex items-end justify-between gap-2">
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line flex-1 break-words">
                {showFullText ? primaryText : truncateText(primaryText).text}
              </p>
              {truncateText(primaryText).isTruncated && !showFullText && (
                <button
                  onClick={() => setShowFullText(true)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs sm:text-sm ml-1 flex-shrink-0"
                >
                  ...See more
                </button>
              )}
            </div>
            {showFullText && truncateText(primaryText).isTruncated && (
              <button
                onClick={() => setShowFullText(false)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs sm:text-sm mt-1"
              >
                See less
              </button>
            )}
          </div>
        )}

        {/* Single Vehicle Image */}
        <div className="relative overflow-hidden group flex-shrink-0" style={{ height: '300px', aspectRatio: '4/3' }}>
          {/* Vehicle Image */}
          <img
            src={selectedVehicles[0].images[0]}
            alt={`${selectedVehicles[0].year} ${selectedVehicles[0].make} ${selectedVehicles[0].model}`}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Ad Footer - Below the image like Facebook */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-600 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-600 dark:text-gray-400">uniqueleverage.com</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                {headline || 'HOME - Unique Leverage'}
              </div>
            </div>
            {callToAction && (
              <button className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-1.5 px-4 rounded text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex-shrink-0 self-start">
                {callToAction}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback when no images
  return (
    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}