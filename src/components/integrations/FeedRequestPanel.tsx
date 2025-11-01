'use client';

import React, { useState, useEffect } from 'react';
import { getInventoryProvider, type InventoryProviderKey } from '@/lib/providers/inventoryProviders';
import { buildFeedRequestEmail } from '@/lib/email/templates/feedRequest';

interface FeedRequestPanelProps {
  providerKey: InventoryProviderKey;
}

export function FeedRequestPanel({ providerKey }: FeedRequestPanelProps) {
  const [connectionStatus, setConnectionStatus] = useState<{
    status: 'not_requested' | 'pending' | 'connected' | 'disconnected';
    hasRequest: boolean;
    isConnected: boolean;
    isPending: boolean;
    requestDate?: string;
    connectedDate?: string;
  }>({
    status: 'not_requested',
    hasRequest: false,
    isConnected: false,
    isPending: false
  });
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    dealerName: '',
    dealerWebsite: '',
    dealerAddress: '',
    dealerCity: '',
    dealerState: '',
    dealerZip: '',
    dealerContactName: '',
    dealerContactEmail: '',
    dcsId: '' // DCS ID for Dealercarsearch
  });
  
  // Fetch connection status from database
  const fetchConnectionStatus = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      console.log('🔍 Fetching connection status for:', userEmail, 'provider:', providerKey);
      
      if (!userEmail) {
        console.log('❌ No user email found in localStorage');
        setLoadingStatus(false);
        return;
      }

      const url = `/api/feed-requests/status?email=${encodeURIComponent(userEmail)}&provider=${providerKey}`;
      console.log('📡 Fetching from URL:', url);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📡 Connection status result:', result);
        setConnectionStatus(result);
        
        // Clear processing state if status becomes connected
        if (result.isConnected) {
          setIsProcessing(false);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Failed to fetch connection status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingUserData(true);
        
        // Check localStorage first (from signup flow)
        const savedData = localStorage.getItem('accountData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setFormData({
            dealerName: parsedData.dealershipName || '',
            dealerWebsite: parsedData.website ? (parsedData.website.startsWith('http') ? parsedData.website : `https://${parsedData.website}`) : '',
            dealerAddress: parsedData.businessAddress || '',
            dealerCity: parsedData.city || '',
            dealerState: parsedData.state || '',
            dealerZip: parsedData.zip || '',
            dealerContactName: `${parsedData.firstName || ''} ${parsedData.lastName || ''}`.trim(),
            dealerContactEmail: parsedData.email || '',
            dcsId: ''
          });
        } else {
          // No account data found in localStorage - try to fetch from API using logged-in user's email
          const userEmail = localStorage.getItem('userEmail');
          const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
          
          if (isLoggedIn && userEmail) {
            const response = await fetch(`/api/account?email=${encodeURIComponent(userEmail)}`);
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                const data = result.data;
                setFormData({
                  dealerName: data.dealershipName || '',
                  dealerWebsite: data.website ? (data.website.startsWith('http') ? data.website : `https://${data.website}`) : '',
                  dealerAddress: data.businessAddress || '',
                  dealerCity: data.city || '',
                  dealerState: data.state || '',
                  dealerZip: data.zip || '',
                  dealerContactName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                  dealerContactEmail: data.email || '',
                  dcsId: ''
                });
                // Store in localStorage for future use
                localStorage.setItem('accountData', JSON.stringify(data));
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to default values if API fails
        setFormData({
          dealerName: 'Your Dealership Name',
          dealerWebsite: 'https://yourwebsite.com',
          dealerAddress: 'Your Address',
          dealerCity: 'Your City',
          dealerState: 'Your State',
          dealerZip: 'Your ZIP',
          dealerContactName: 'Your Name',
          dealerContactEmail: 'your@email.com',
          dcsId: ''
        });
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch connection status on mount and when provider changes
  useEffect(() => {
    console.log('🔄 useEffect triggered - fetching connection status for provider:', providerKey);
    fetchConnectionStatus();
  }, [providerKey]);

  // Check if we should show processing state (user has sent request but file not detected yet)
  const shouldShowProcessing = isProcessing || (connectionStatus.hasRequest && !connectionStatus.isConnected);

  // Poll for status updates when processing
  useEffect(() => {
    if (!isProcessing) return;

    const pollInterval = setInterval(async () => {
      console.log('🔄 Polling for status update...');
      await fetchConnectionStatus();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(pollInterval);
  }, [isProcessing]);

  
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string | React.ReactNode } | null>(null);

  const provider = getInventoryProvider(providerKey);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle disconnect action
  const handleDisconnect = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const userEmail = localStorage.getItem('userEmail');
      const response = await fetch('/api/feed-requests/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          providerKey
        }),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Successfully disconnected from inventory feed. You can request a new connection anytime.'
        });
        // Refresh connection status
        await fetchConnectionStatus();
      } else {
        const errorData = await response.json();
        setMessage({
          type: 'error',
          text: errorData.error || 'Failed to disconnect. Please try again.'
        });
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      setMessage({
        type: 'error',
        text: 'Failed to disconnect. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasPermission) {
      setMessage({ type: 'error', text: 'Please confirm you have permission to contact CarsforSale' });
      return;
    }

    // Check if DCS ID is required for Dealercarsearch
    if (providerKey === 'dealercarsearch' && (!formData.dcsId || formData.dcsId.trim().length === 0)) {
      setMessage({ type: 'error', text: 'DCS ID is required for Dealercarsearch.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/feed-requests/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: localStorage.getItem('userEmail'),
          providerKey,
          dealerName: formData.dealerName,
          dealerWebsite: formData.dealerWebsite,
          dealerAddress: `${formData.dealerAddress}\n${formData.dealerCity}, ${formData.dealerState} ${formData.dealerZip}`,
          dealerContactName: formData.dealerContactName,
          dealerContactEmail: formData.dealerContactEmail,
          dcsId: formData.dcsId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({ 
          type: 'success', 
          text: (
            <>
              Request sent successfully! Check your email inbox, click <strong>"Reply All"</strong>, and type <strong>"I approve"</strong> to complete the process.
            </>
          )
        });
        
        // Set processing state immediately
        setIsProcessing(true);
        
        // Refresh connection status to check for updates
        await fetchConnectionStatus();
        
        // Keep processing state active - it will be cleared when file arrives and status becomes 'connected'
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to send request' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };



  // Show loading state while fetching user data
  if (loadingUserData) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your account information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
      {/* Read-only email details */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">⚠️ Warning: "Reply All" required or provider won't see your approval.</h4>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div><strong>To:</strong> {provider.toEmail}</div>
            <div><strong>From:</strong> support@uniqueleverage.com</div>
    <div className="flex items-center gap-2">
      <span><strong>CC:</strong></span>
      <input
        type="text"
        value={formData.dealerContactEmail}
        onChange={(e) => setFormData(prev => ({ ...prev, dealerContactEmail: e.target.value }))}
        disabled={connectionStatus.isConnected || connectionStatus.isPending}
        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder="Enter CC email addresses (comma-separated)"
      />
    </div>
    {provider.requiresCustomId && (
      <div className="flex items-center gap-2">
        <span><strong>DCS ID:</strong> <span className="text-red-500">*</span></span>
        <input
          type="text"
          value={formData.dcsId || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, dcsId: e.target.value }))}
          disabled={connectionStatus.isConnected || connectionStatus.isPending}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Enter your DCS ID (e.g., 84758)"
          required
        />
      </div>
    )}
            <div><strong>Subject:</strong> Feed Request from Unique Leverage to {provider.name}</div>
          </div>
          
              <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Email Content:</div>
                <div 
                  className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{
                    __html: buildFeedRequestEmail({
                      providerName: provider.name,
                      dealerName: formData.dealerName,
                      dealerWebsite: formData.dealerWebsite,
                      dealerAddress: `${formData.dealerAddress}\n${formData.dealerCity}, ${formData.dealerState} ${formData.dealerZip}`,
                      dealerContactName: formData.dealerContactName,
                      dealerContactEmail: formData.dealerContactEmail,
                      filename: provider.customFilenameFormat 
                        ? provider.customFilenameFormat.replace('{dcsId}', formData.dcsId)
                        : provider.filenameConvention(formData.dealerName),
                      ftpHost: provider.ftpHost,
                      ftpUser: provider.ftpUser,
                      ftpPass: provider.ftpPass
                    }).bodyContent
                  }}
                />
              </div>
        </div>

        {/* Permission checkbox */}
        <div className="flex items-start space-x-2 mt-4">
          <input
            type="checkbox"
            checked={hasPermission}
            onChange={(e) => setHasPermission(e.target.checked)}
            required
            disabled={connectionStatus.isConnected || connectionStatus.isPending}
            className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
          />
          <label className="text-sm text-gray-700 dark:text-gray-300">
            I have permission to contact {provider.name} on behalf of this dealership.
          </label>
        </div>

        {/* Message display */}
        {message && (
          <div className={`p-3 rounded-lg text-sm mt-4 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {typeof message.text === 'string' ? message.text : message.text}
          </div>
        )}

        {/* Dynamic Action Button */}
        <div className="flex flex-col gap-3 mt-4">
          {loadingStatus ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading status...</p>
            </div>
          ) : shouldShowProcessing ? (
            /* Processing State - After Submit */
            <div className="text-center">
              <button
                type="button"
                disabled
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
              >
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </button>
              <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                ⏳ Waiting for inventory file to arrive...
              </p>
            </div>
          ) : connectionStatus.isConnected ? (
            /* Connected State - Disconnect Button */
            <div className="text-center">
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Disconnecting...' : 'Disconnect'}
              </button>
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                ✓ Connected since {connectionStatus.connectedDate ? new Date(connectionStatus.connectedDate).toLocaleDateString() : 'recently'}
              </p>
            </div>
          ) : (
            /* Not Requested State - Send Request Button */
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !hasPermission}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Feed Request'}
            </button>
          )}
        </div>

    </div>
  );
}
