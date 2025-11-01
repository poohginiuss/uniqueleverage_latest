import React from 'react';

interface FacebookAdPreviewProps {
  vehicle: any;
  adType: 'single' | 'carousel';
  budget: { amount: number; type: 'daily' | 'lifetime' };
  targeting: {
    ageRange: string;
    locations: string | string[];
    interests: string | string[];
  };
  adCopy: {
    headline: string;
    primaryText: string;
    description?: string;
    callToAction: string;
    destination: string;
  };
}

export default function FacebookAdPreview({
  vehicle,
  adType,
  budget,
  targeting,
  adCopy
}: FacebookAdPreviewProps) {
  console.log('🎨 FacebookAdPreview rendering with data:', { vehicle, adType, budget, targeting, adCopy });
  
  const budgetText = budget.type === 'daily' 
    ? `$${budget.amount}/day` 
    : `$${budget.amount} lifetime`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Ads Manager</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{adType === 'single' ? 'Single Vehicle Ad' : 'Carousel Ad'}</p>
        </div>
      </div>

      {/* Facebook Ad Mockup */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        {/* Ad Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">Unique Leverage</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Sponsored</span>
        </div>

        {/* Ad Content */}
        <div className="space-y-3">
          {/* Headline */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
            {adCopy.headline || 'Amazing Vehicle Deal!'}
          </h2>

          {/* Primary Text */}
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {adCopy.primaryText || 'Check out this incredible vehicle at an unbeatable price!'}
          </p>

          {/* Vehicle Image */}
          <div className="relative">
            {vehicle?.images && vehicle.images.length > 0 ? (
              <img 
                src={vehicle.images[0]} 
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                    <svg width="100%" height="200" xmlns="http://www.w3.org/2000/svg">
                      <rect width="100%" height="100%" fill="#f8fafc"/>
                      <text x="50%" y="50%" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="16">Vehicle Image</text>
                    </svg>
                  `)}`;
                }}
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg">
                <span className="text-gray-500 dark:text-gray-400">Vehicle Image</span>
              </div>
            )}
            
            {/* Price Badge */}
            <div className="absolute top-3 right-3 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-lg">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ${vehicle?.price ? parseFloat(vehicle.price).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {vehicle?.year || ''} {vehicle?.make} {vehicle?.model}
                </h3>
                {vehicle?.trim && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{vehicle.trim}</p>
                )}
              </div>
              <div className="text-right">
                {vehicle?.mileage_value && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {vehicle.mileage_value.toLocaleString()} {vehicle.mileage_unit || 'MI'}
                  </p>
                )}
                {vehicle?.exterior_color && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{vehicle.exterior_color}</p>
                )}
              </div>
            </div>
            
            {vehicle?.stock_number && (
              <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                Stock #: {vehicle.stock_number}
              </p>
            )}
          </div>

          {/* Call to Action Button */}
          <div className="flex justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              {adCopy.callToAction || 'Learn More'}
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Details */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Budget:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-white">{budgetText}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Targeting:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-white">{targeting.ageRange}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Location:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-white">
            {Array.isArray(targeting.locations) ? targeting.locations.join(', ') : targeting.locations}
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Interests:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-white">
            {Array.isArray(targeting.interests) ? targeting.interests.join(', ') : targeting.interests}
          </span>
        </div>
      </div>
    </div>
  );
}
