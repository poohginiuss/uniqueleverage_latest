'use client';

import { useState } from 'react';

interface EmailConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: {
    name: string;
    icon: string;
    description: string;
  };
  onSuccess: (provider: string, email: string) => void;
}

export default function EmailConnectionModal({ 
  isOpen, 
  onClose, 
  provider, 
  onSuccess 
}: EmailConnectionModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState('');

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      if (provider.name === 'Gmail') {
        // Real Gmail OAuth flow
        const response = await fetch('/api/auth/google/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ provider: 'Gmail' }),
        });

        if (!response.ok) {
          throw new Error('Failed to initiate OAuth');
        }

        const { authUrl } = await response.json();
        
        // Redirect to Google OAuth
        window.location.href = authUrl;
        return;
      } else {
        // Simulate OAuth flow for other providers
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock successful connection
        const mockEmail = `user@${provider.name.toLowerCase().replace(/\s+/g, '')}.com`;
        setConnectedEmail(mockEmail);
        setIsSuccess(true);
        setIsConnecting(false);
        
        // Call success callback
        onSuccess(provider.name, mockEmail);
      }
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnecting(false);
      // You could add error state handling here
    }
  };

  const handleClose = () => {
    setIsConnecting(false);
    setIsSuccess(false);
    setConnectedEmail('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Connect {provider.name} Account
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {!isSuccess ? (
            <>
              {/* Provider Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    {provider.icon}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{provider.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{provider.description}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This will allow Unique Leverage to send emails using your {provider.name} account. 
                You'll be redirected to {provider.name} to authorize the connection.
              </p>

              {/* Connect Button */}
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>Connect with {provider.name}</span>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Successfully Connected!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Your {provider.name} account is now connected to Unique Leverage.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Connected Account: {connectedEmail}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
