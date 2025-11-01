import React, { useState, useEffect } from 'react';

interface CalendarCardProps {
  provider: 'google' | 'microsoft';
  name: string;
  description: string;
  icon: React.ReactNode;
  onConnect: () => void;
  onDisconnect: () => void;
  onManage: () => void;
  isConnected: boolean;
  connectedEmail?: string;
  isLoading: boolean;
}

export const CalendarCard: React.FC<CalendarCardProps> = ({
  provider,
  name,
  description,
  icon,
  onConnect,
  onDisconnect,
  onManage,
  isConnected,
  connectedEmail,
  isLoading
}) => {
  const handleCardClick = () => {
    if (isLoading) return;
    
    if (isConnected) {
      onManage();
    } else {
      onConnect();
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`group relative flex flex-col items-start rounded-xl bg-primary_alt p-5 ring-1 ring-secondary outline-focus-ring transition duration-100 ease-linear ring-inset cursor-pointer ${isConnected ? 'ring-green-300 bg-green-50 dark:bg-green-900/10' : 'hover:bg-primary_hover hover:ring-blue-300 hover:shadow-md'} ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {/* Connected Status Badge */}
      {isConnected && !isLoading && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            Connected
          </span>
        </div>
      )}
      
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute top-4 right-4 size-4">
          <svg 
            viewBox="0 0 24 24" 
            width="24" 
            height="24" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="animate-spin text-fg-quaternary"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56"></path>
          </svg>
        </div>
      )}
      
      {/* Provider Icon */}
      {icon}
      
      <div className="mt-0 flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-primary" style={{ marginTop: 12, marginBottom: 0 }}>
          {name}
        </p>
        <p className="text-sm text-tertiary" style={{ marginTop: 0, marginBottom: 0 }}>
          {isConnected ? connectedEmail : description}
        </p>
      </div>

      {/* Manage Button for Connected State */}
      {isConnected && !isLoading && (
        <div className="mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onManage();
            }}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Manage
          </button>
        </div>
      )}
    </div>
  );
};
