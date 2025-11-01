"use client";

import React, { useState } from 'react';

interface EditableFacebookAdPreviewProps {
  vehicle: any;
  adType: 'single' | 'carousel';
  budget: { amount: number; type: 'daily' | 'lifetime' };
  targeting: {
    ageRange: string;
    locations: string | string[];
    interests: string | string[];
  };
  adCopy: {
    headline: string | null;
    primaryText: string | null;
    description?: string | null;
    callToAction: string | null;
    destination: string | null;
  };
  onUpdate: (field: string, value: string) => void;
}

export default function EditableFacebookAdPreview({
  vehicle,
  adType,
  budget,
  targeting,
  adCopy,
  onUpdate
}: EditableFacebookAdPreviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (field: string, currentValue: string | null | undefined) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const handleSave = (field: string) => {
    onUpdate(field, editValue);
    setEditingField(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && field !== 'primaryText') {
      handleSave(field);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Auto-populate ad copy with vehicle data if not already set
  const getPrimaryText = () => {
    if (adCopy.primaryText) return adCopy.primaryText;
    if (!vehicle) return 'SALE: $N/A\n6000 W Forest Home Ave, Milwaukee\nPlease call or schedule an appointment!';
    return `SALE: $${vehicle.price?.toLocaleString() || 'N/A'}\n${vehicle.address || '6000 W Forest Home Ave, Milwaukee'}\nPlease call or schedule an appointment!`;
  };

  const getHeadline = () => {
    if (adCopy.headline) return adCopy.headline;
    if (!vehicle) return 'Vehicle Title';
    return `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.trim || ''}`.trim();
  };

  const getDescription = () => {
    if (adCopy.description) return adCopy.description;
    if (!vehicle) return 'Mileage: N/A MI';
    return `Mileage: ${vehicle.mileage_value?.toLocaleString() || 'N/A'} ${vehicle.mileage_unit || 'MI'}`;
  };

  const renderEditableText = (field: string, value: string | null | undefined, placeholder: string, className: string = '') => {
    const displayValue = value || (field === 'primaryText' ? getPrimaryText() : field === 'headline' ? getHeadline() : field === 'description' ? getDescription() : placeholder);
    
    if (editingField === field) {
      return (
        <div className="relative">
          {field === 'primaryText' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, field)}
              onBlur={() => handleSave(field)}
              className={`w-full bg-white dark:bg-gray-800 border border-blue-500 rounded px-2 py-1 text-sm resize-none min-h-[60px] ${className}`}
              placeholder={placeholder}
              autoFocus
              rows={3}
              style={{ minHeight: '60px', height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, field)}
              onBlur={() => handleSave(field)}
              className={`w-full bg-white dark:bg-gray-800 border border-blue-500 rounded px-2 py-1 text-sm ${className}`}
              placeholder={placeholder}
              autoFocus
            />
          )}
          <div className="absolute right-1 top-1 flex gap-1">
            <button
              onClick={() => handleSave(field)}
              className="text-green-600 hover:text-green-800 text-xs"
            >
              ✓
            </button>
            <button
              onClick={handleCancel}
              className="text-red-600 hover:text-red-800 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="group relative">
        <div
          onClick={() => handleEdit(field, value)}
          className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 transition-colors ${className}`}
          title="Click to edit"
        >
          {displayValue || (
            <span className="text-gray-400 italic">{placeholder}</span>
          )}
        </div>
        {/* Edit icon */}
        <button
          onClick={() => handleEdit(field, value)}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 text-xs"
          title="Edit"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Facebook Profile Header */}
      <div className="flex items-center gap-2 p-3">
        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">f</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Unique Leverage</span>
          <span className="mx-2">•</span>
          <span>Sponsored</span>
        </div>
      </div>

      {/* Ad Content - Facebook Placement Order */}
      <div className="p-3 space-y-3">
        {/* 1. Primary Text (above image) */}
        <div>
          {renderEditableText('primaryText', adCopy.primaryText, 'HERE IS PRIMARY TEXT', 'text-sm text-gray-900 dark:text-gray-100 leading-relaxed font-medium whitespace-pre-line')}
        </div>

        {/* 2. Vehicle Image */}
        <div className="relative">
          <img
            src={vehicle?.images?.[0] || '/placeholder-vehicle.jpg'}
            alt={vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Vehicle Image'}
            className="w-full h-80 object-cover rounded-lg"
            style={{ minHeight: '320px', maxHeight: '400px' }}
            onError={(e) => {
              e.currentTarget.src = '/placeholder-vehicle.jpg';
            }}
          />
        </div>

        {/* 3. Website/Link (Facebook shows this below image) */}
        <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
          autoplexmkewi.com
        </div>

        {/* 4. Headline, Description, and Call to Action (horizontal layout) */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Headline */}
            <div className="mb-2">
              {renderEditableText('headline', adCopy.headline, 'HERE IS HEADLINE', 'text-base font-bold text-gray-900 dark:text-white leading-tight')}
            </div>
            {/* Description */}
            <div>
              {renderEditableText('description', adCopy.description, 'HERE IS DESCRIPTIOIN', 'text-sm text-gray-900 dark:text-gray-100 leading-relaxed')}
            </div>
          </div>
          {/* Call to Action Button */}
          <div className="flex-shrink-0">
            <div className="relative">
              <select
                value={adCopy.callToAction || 'Learn more'}
                onChange={(e) => onUpdate('callToAction', e.target.value)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm font-medium transition-colors appearance-none pr-8 cursor-pointer"
              >
                <option value="Get Quote">Get Quote</option>
                <option value="Shop Now">Shop Now</option>
                <option value="Learn more">Learn more</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Details (smaller, below CTA) */}
        <div className="text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between">
            <span>{vehicle?.year || 'N/A'} {vehicle?.make || 'N/A'} {vehicle?.model || 'N/A'} • {vehicle?.mileage_value?.toLocaleString() || 'N/A'} {vehicle?.mileage_unit || 'MI'}</span>
            <span>Stock #: {vehicle?.stock_number || 'N/A'}</span>
          </div>
        </div>

        {/* Facebook Engagement Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <button className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Like</span>
            </button>
            <button className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Comment</span>
            </button>
            <button className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ad Settings Summary */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div><span className="font-medium">Budget:</span> ${budget.amount}/{budget.type}</div>
          <div><span className="font-medium">Targeting:</span> {targeting.ageRange}</div>
          <div><span className="font-medium">Location:</span> {Array.isArray(targeting.locations) ? targeting.locations.join(', ') : targeting.locations}</div>
          <div><span className="font-medium">Interests:</span> {Array.isArray(targeting.interests) ? targeting.interests.join(', ') : targeting.interests}</div>
        </div>
      </div>
    </div>
  );
}
