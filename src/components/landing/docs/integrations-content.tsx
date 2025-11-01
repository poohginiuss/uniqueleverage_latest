import React, { useState, useEffect } from "react";
import EmailConnectionModal from '@/components/integrations/EmailConnectionModal';
import { CalendarCard } from '@/components/integrations/CalendarCard';
import { CalendarSelectionModal } from '@/components/integrations/CalendarSelectionModal';
import { UnifiedCalendarModal } from '@/components/integrations/UnifiedCalendarModal';
import SocialMediaModal from '@/components/integrations/SocialMediaModal';
import { useSearchParams } from 'next/navigation';
import { useIntegrations } from '@/contexts/integrations-context';

// Integrations page built with React + TypeScript + Tailwind (drop-in TSX component)
// - No external UI libs required
// - Uses semantic HTML and accessible buttons
// - Matches the exact styling and structure of intro-content and install-content

export const ULIntegrationsPage = () => {
  // Use integrations context
  const { calendar: calendarIntegrations, socialMedia, refreshIntegrations } = useIntegrations();
  
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());
  const [inProgressProviders, setInProgressProviders] = useState<Set<string>>(new Set());
  const [connectedEmailAccounts, setConnectedEmailAccounts] = useState<Set<string>>(new Set());
  const [connectedEmailAddresses, setConnectedEmailAddresses] = useState<Map<string, string>>(new Map());

  // Connection status for inventory providers (database-driven)
  const [inventoryConnectionStatus, setInventoryConnectionStatus] = useState<{
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

  // Fetch connection status for inventory providers
  const fetchInventoryConnectionStatus = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) return;

      // Check for any connected inventory (using carsforsale as default)
      const response = await fetch(`/api/feed-requests/status?email=${encodeURIComponent(userEmail)}&provider=carsforsale`);
      if (response.ok) {
        const result = await response.json();
        setInventoryConnectionStatus(result);
      }
    } catch (error) {
      console.error('Failed to fetch inventory connection status:', error);
    }
  };

  // Check if we should show processing state for inventory
  const shouldShowInventoryProcessing = inventoryConnectionStatus.hasRequest && !inventoryConnectionStatus.isConnected;

  // Fetch inventory connection status on mount
  useEffect(() => {
    fetchInventoryConnectionStatus();
  }, []);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedEmailProvider, setSelectedEmailProvider] = useState<{
    name: string;
    icon: string;
    description: string;
  } | null>(null);
  
  // Calendar modal state
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [selectedCalendarProvider, setSelectedCalendarProvider] = useState<'google' | 'microsoft' | 'unified' | null>(null);
  
  // Social media modal state
  const [socialMediaModalOpen, setSocialMediaModalOpen] = useState(false);
  
  const searchParams = useSearchParams();
  
  // Derived state from context
  const facebookConnected = socialMedia.facebook.connected;
  const connectedAccountsCount = socialMedia.facebook.connectedAccountsCount;

  // Handle email account connection
  const handleEmailConnection = (provider: { name: string; icon: string; description: string }) => {
    setSelectedEmailProvider(provider);
    setEmailModalOpen(true);
  };

  const handleEmailConnectionSuccess = (provider: string, email: string) => {
    setConnectedEmailAccounts(prev => new Set([...prev, provider]));
    setConnectedEmailAddresses(prev => new Map([...prev, [provider, email]]));
    // Store in localStorage for persistence
    localStorage.setItem(`email_connected_${provider.toLowerCase().replace(/\s+/g, '')}`, 'true');
    localStorage.setItem(`email_address_${provider.toLowerCase().replace(/\s+/g, '')}`, email);
  };

  const handleEmailModalClose = () => {
    setEmailModalOpen(false);
    setSelectedEmailProvider(null);
  };

  // Calendar integration handlers
  const handleGoogleCalendarConnect = () => {
    // No need to set loading state - context handles this
    window.location.href = '/api/auth/google/start';
  };

  const handleMicrosoftCalendarConnect = () => {
    // No need to set loading state - context handles this
    window.location.href = '/api/auth/microsoft/start';
  };

  const handleCalendarManage = async (provider: 'google' | 'microsoft' | 'unified') => {
    setSelectedCalendarProvider(provider);
    setCalendarModalOpen(true);
    
    // Refresh integrations from context (will use cached data if recent, fetch if needed)
    await refreshIntegrations();
  };

  const handleCalendarDisconnect = async (provider: 'google' | 'microsoft', integrationId?: number) => {
    try {
      if (integrationId) {
        console.log(`Disconnecting ${provider} integration with ID:`, integrationId);
        
        // Disconnect specific integration
        const response = await fetch('/api/integrations/calendars', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ integrationId })
        });
        
        if (response.ok) {
          console.log(`Successfully disconnected ${provider} integration`);
          // Refresh integrations from context to update state
          await refreshIntegrations();
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Failed to disconnect ${provider} integration:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || 'Unknown error'
          });
        }
      } else {
        console.error(`No integration ID provided for ${provider} disconnect`);
      }
    } catch (error) {
      console.error(`Error disconnecting ${provider} calendar:`, error);
    }
  };

  const handleCalendarModalClose = () => {
    setCalendarModalOpen(false);
    setSelectedCalendarProvider(null);
  };

  const handleCalendarSelectionSave = (selectedCalendarIds: string[]) => {
    console.log('Calendar selection saved:', selectedCalendarIds);
    // Calendar selection is saved in the modal, no need to update state here
  };

  // Handle OAuth callback success
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const success = searchParams.get('success');
      const email = searchParams.get('email');
      const gmailConnected = searchParams.get('gmail_connected');
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      
      console.log('Integrations: OAuth callback params:', { success, email, gmailConnected });
      
      if (success === 'true' && email && gmailConnected === 'true') {
        console.log('Integrations: Storing Gmail email and tokens:', email);
        // Mark Gmail as connected
        setConnectedEmailAccounts(prev => new Set([...prev, 'Gmail']));
        setConnectedEmailAddresses(prev => new Map([...prev, ['Gmail', email]]));
        localStorage.setItem('email_connected_gmail', 'true');
        localStorage.setItem('email_address_gmail', email);
        
        // Store Gmail tokens securely in database
        if (accessToken) {
          try {
            await fetch('/api/email-integrations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                provider: 'gmail',
                providerEmail: email,
                accessToken,
                refreshToken,
                expiresAt: null // Gmail tokens don't have explicit expiration
              })
            });
          } catch (error) {
            console.error('Error saving Gmail tokens:', error);
          }
        }
        
        // Clean up URL parameters
        const url = new URL(window.location.href);
        url.searchParams.delete('success');
        url.searchParams.delete('email');
        url.searchParams.delete('gmail_connected');
        url.searchParams.delete('access_token');
        url.searchParams.delete('refresh_token');
        window.history.replaceState({}, '', url.toString());
      }
    };
    
    handleOAuthCallback();
    
    // Handle Microsoft OAuth success
    const microsoftConnected = searchParams.get('microsoft_connected');
    if (microsoftConnected === 'true') {
      console.log('Integrations: Microsoft OAuth successful, refreshing integrations');
      // Refresh integrations from context
      refreshIntegrations();
      
      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('microsoft_connected');
      window.history.replaceState({}, '', url.toString());
    }

    // Handle Google OAuth success
    const googleConnected = searchParams.get('google_connected');
    if (googleConnected === 'true') {
      console.log('Integrations: Google OAuth successful, refreshing integrations');
      // Refresh integrations from context
      refreshIntegrations();

      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('google_connected');
      window.history.replaceState({}, '', url.toString());
    }

    // Handle Facebook OAuth success
    const facebookConnected = searchParams.get('facebook_connected');
    if (facebookConnected === 'true') {
      console.log('Integrations: Facebook OAuth successful, refreshing integrations');
      // Refresh integrations from context
      refreshIntegrations();
      // Open the social media modal to show the connected status
      setSocialMediaModalOpen(true);

      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('facebook_connected');
      window.history.replaceState({}, '', url.toString());
    }

    // Handle Facebook OAuth error
    const facebookError = searchParams.get('facebook_error');
    if (facebookError) {
      console.error('Facebook OAuth error:', facebookError);
      // You could show an error toast here
      
      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('facebook_error');
      window.history.replaceState({}, '', url.toString());
    }
    
    // OAuth success handling is now done above for specific providers
  }, [searchParams, refreshIntegrations, setSocialMediaModalOpen]);

  // Check for connected providers on component mount
  useEffect(() => {
    const checkConnectedProviders = () => {
      const connected = new Set<string>();
      const connectedEmails = new Set<string>();
      const connectedEmailAddressesMap = new Map<string, string>();
      
      // Check localStorage for feed request status
      const inProgress = new Set<string>();
      inventoryProviders.forEach(provider => {
        const providerSlug = provider.name.toLowerCase().replace(/\s+/g, '');
        const completedKey = `feed_request_completed_${providerSlug}`;
        const sentKey = `feed_request_sent_${providerSlug}`;
        
        if (localStorage.getItem(completedKey) === 'true') {
          connected.add(provider.name);
        } else if (localStorage.getItem(sentKey) === 'true') {
          inProgress.add(provider.name);
        }
      });
      setInProgressProviders(inProgress);
      
      // Note: Calendar and social media integrations are now handled by IntegrationsContext
      // No need to fetch here as context loads on mount and caches in localStorage

      // Check localStorage for connected email accounts
      const emailProviders = ['Gmail', 'Microsoft Outlook', 'Yahoo Mail', 'Apple Mail'];
      emailProviders.forEach(provider => {
        const key = `email_connected_${provider.toLowerCase().replace(/\s+/g, '')}`;
        if (localStorage.getItem(key) === 'true') {
          connectedEmails.add(provider);
          
          // Get the corresponding email address
          const emailKey = `email_address_${provider.toLowerCase().replace(/\s+/g, '')}`;
          const emailAddress = localStorage.getItem(emailKey);
          if (emailAddress) {
            connectedEmailAddressesMap.set(provider, emailAddress);
          }
        }
      });
      
      console.log('Integrations: Updated states:', { connected: Array.from(connected), inProgress: Array.from(inProgress) });
      setConnectedProviders(connected);
      setConnectedEmailAccounts(connectedEmails);
      setConnectedEmailAddresses(connectedEmailAddressesMap);
    };

    checkConnectedProviders();
    
    // Listen for storage changes (when user completes feed request or email connection on another tab)
    const handleStorageChange = (e: StorageEvent) => {
      console.log('Integrations: Storage event received:', e.key, e.newValue);
      if (e.key && (e.key.startsWith('feed_request_completed_') || e.key.startsWith('feed_request_sent_') || e.key.startsWith('email_connected_') || e.key.startsWith('email_address_'))) {
        console.log('Integrations: Relevant storage change detected, checking providers...');
        checkConnectedProviders();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div className="flex items-start px-4 py-8 lg:px-8 lg:py-16">
      <main className="relative mx-auto flex w-full min-w-0 flex-1 flex-col lg:flex-row max-w-180">
        {/* Main column */}
        <div className="size-full text-tertiary">
          {/* Intro header */}
          <div className="mb-10">
            <div className="mb-6">
              <div
                className="relative flex shrink-0 items-center justify-center *:data-icon:size-7 bg-primary_alt ring-1 ring-inset before:absolute before:inset-1 before:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_3px_3px_0px_rgba(0,0,0,0.09),1px_8px_5px_0px_rgba(0,0,0,0.05),2px_21px_6px_0px_rgba(0,0,0,0),0px_0px_0px_1px_rgba(0,0,0,0.08),1px_13px_5px_0px_rgba(0,0,0,0.01),0px_-2px_2px_0px_rgba(0,0,0,0.13)_inset] before:ring-1 before:ring-secondary_alt size-14 rounded-[14px] before:rounded-[10px] text-fg-secondary ring-primary dark:ring-secondary dark:before:opacity-0"
                data-featured-icon="true"
              >
                <div className="z-10">
                  {/* Integration icon placeholder */}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="max-w-3xl text-2xl font-semibold text-primary">
                Integrations
              </h1>
            </div>

            <p className="typography mt-3 max-w-3xl text-base whitespace-pre-line">
              This is your hub for connecting external systems with Unique Leverage. Quickly link your inventory providers, ad accounts, calendar, and more — all from one dashboard.
            </p>
          </div>

          <Divider />

          {/* Inventory Providers Section */}
          <Section id="inventory-providers" title="Inventory Providers">
            <p>Select your provider below to connect your feed and start syncing vehicles automatically.</p>
            <div className="grid grid-cols-1 gap-3 mt-8 lg:grid-cols-2">
              {/* Show DealerCenter and CarsforSale first */}
              {inventoryProviders.slice(0, 2).map((provider) => (
                <ProviderCard 
                  key={provider.name} 
                  {...provider} 
                  isConnected={
                    provider.name === 'CarsforSale' 
                      ? inventoryConnectionStatus.isConnected
                      : connectedProviders.has(provider.name)
                  }
                  isInProgress={
                    provider.name === 'CarsforSale' 
                      ? shouldShowInventoryProcessing
                      : inProgressProviders.has(provider.name)
                  }
                />
              ))}
              
              {/* See more partners card */}
              <button
                onClick={() => window.location.href = '/docs/request-feeds'}
                className="group relative flex flex-col items-start rounded-xl bg-primary_alt p-5 ring-1 ring-secondary outline-focus-ring transition duration-100 ease-linear ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 not-dark:hover:bg-primary_hover hover:ring-blue-300 hover:shadow-md lg:col-span-2 no-underline cursor-pointer text-left w-full"
                style={{ fontWeight: 'inherit' }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="absolute top-4 right-4 size-4 text-fg-quaternary"
                >
                  <path d="M12 5v14m0 0 7-7m-7 7-7-7"></path>
                </svg>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-primary"  style={{ marginTop: 0, marginBottom: 12 }}>See more partners</p>
                  <p className="text-sm text-tertiary"  style={{ marginTop: 0, marginBottom: 12 }}>A complete list of inventory integrations.</p>
                </div>
              </button>
            </div>
          </Section>

          <Divider />

          {/* Calendar Integration Section */}
          <Section id="calendar-integration" title="Calendar Integration">
            <p>Sync your calendar with Unique Leverage to manage VSP (Vehicle Scheduling Page) appointments seamlessly.</p>
            <p className="mt-3">
              Schedule test drives, follow-up calls, and service appointments directly from your inventory management system. 
              Sync with popular calendar applications to keep your VSP appointments organized.
            </p>
            
            <div className="mt-6 sm:mt-8">
              <div className="grid grid-cols-1 gap-3">
                {/* Unified Calendar Integration Card */}
                <div 
                  onClick={() => handleCalendarManage('unified')}
                  className="group relative flex flex-col items-start rounded-xl bg-primary_alt p-4 sm:p-5 ring-1 ring-secondary outline-focus-ring transition duration-100 ease-linear ring-inset cursor-pointer hover:bg-primary_hover hover:ring-blue-300 hover:shadow-md"
                >
                  {/* Connection Status Badge */}
                  {(() => {
                    const connectedCount = (calendarIntegrations.google.connected ? 1 : 0) + (calendarIntegrations.microsoft.connected ? 1 : 0);
                    const isConnected = connectedCount > 0;
                    
                    return (
                      <div className="absolute top-4 right-4">
                        {isConnected ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            Connected: {connectedCount} {connectedCount === 1 ? 'account' : 'accounts'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            Not connected
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Provider Icons */}
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    {/* Google Calendar Icon */}
                    <svg viewBox="0 0 24 24" width="24" height="24" className="size-6">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>

                    {/* Microsoft Outlook Icon */}
                    <svg viewBox="0 0 24 24" width="24" height="24" className="size-6">
                      <path fill="#F25022" d="M1 1h10v10H1z"/>
                      <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                      <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                      <path fill="#FFB900" d="M13 13h10v10H13z"/>
                    </svg>
                  </div>

                  <div className="mt-2 sm:mt-3 flex flex-col gap-0.5">
                    <p className="text-sm font-semibold text-primary" style={{ marginTop: 0, marginBottom: 0 }}>
                      Calendar Integration
                    </p>
                    <p className="text-sm text-tertiary leading-relaxed" style={{ marginTop: 0, marginBottom: 0 }}>
                      Connect Google Calendar or Microsoft Outlook/Office 365
                    </p>
                  </div>

                  {/* Manage Button */}
                  <div className="mt-2 sm:mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCalendarManage('unified');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
          </Section>

          <Divider />

          {/* Social Media Integration Section */}
          <Section id="social-media" title="Advertising Integration">
            <p>Take control of your advertising. Create Facebook ad campaigns using your own account—no agency required, no complex Business Manager setup, no website needed.</p>
            <p className="mt-3">Drive traffic to professional vehicle pages and capture appointments automatically. Google Ads support coming soon.</p>
            
            <div className="mt-6 sm:mt-8">
              <div className="grid grid-cols-1 gap-3">
                {/* Unified Social Media Integration Card */}
                <div 
                  onClick={() => setSocialMediaModalOpen(true)}
                  className="group relative flex flex-col items-start rounded-xl bg-primary_alt p-4 sm:p-5 ring-1 ring-secondary outline-focus-ring transition duration-100 ease-linear ring-inset cursor-pointer hover:bg-primary_hover hover:ring-blue-300 hover:shadow-md"
                >
                  {/* Connection Status Badge */}
                  <div className="absolute top-4 right-4">
                    {facebookConnected ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        Connected: {connectedAccountsCount || 0} {(connectedAccountsCount || 0) === 1 ? 'account' : 'accounts'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                        Not connected
                      </span>
                    )}
                  </div>

                  {/* Provider Icons */}
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    {/* Facebook Icon */}
                    <svg viewBox="0 0 24 24" width="24" height="24" className="size-6">
                      <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>

                    {/* Google Ads Icon - Official Logo */}
                    <div className="size-6 flex items-center justify-center">
                      <img src="/icon-sets/google-ads-icon.svg" alt="Google Ads" className="w-full h-full object-contain" />
                    </div>
                  </div>

            <div className="mt-2 sm:mt-3 flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-primary" style={{ marginTop: 0, marginBottom: 0 }}>
                Advertising Integration
              </p>
              <p className="text-sm text-tertiary leading-relaxed" style={{ marginTop: 0, marginBottom: 0 }}>
                Connect Facebook & Google Ads accounts
              </p>
            </div>

                  {/* Manage Button */}
                  <div className="mt-2 sm:mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSocialMediaModalOpen(true);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Divider />

          {/* Meta Pixel Integration Section */}
          <Section id="meta-pixel" title="Meta Pixel Integration">
            <p>Track conversions and optimize your Facebook and Instagram ad campaigns with Meta Pixel integration.</p>
            <p className="mt-3">
              Monitor website visitors, track lead generation, and optimize your ad spend with detailed analytics. 
              Build custom audiences and retarget website visitors across Facebook and Instagram.
            </p>
            <div className="mt-8">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {/* Meta Pixel - Full width */}
                <div className="group relative flex flex-col items-start rounded-xl bg-primary_alt p-5 ring-1 ring-secondary outline-focus-ring transition duration-100 ease-linear ring-inset hover:bg-primary_hover hover:ring-blue-300 hover:shadow-md lg:col-span-2">
                  {/* Action Icon */}
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="absolute top-4 right-4 size-4 text-fg-quaternary">
                    <path d="M9 18l6-6-6-6"></path>
                  </svg>
                  
                  {/* Meta Pixel Icon */}
                  <div className="size-6 flex items-center justify-center">
                    <img src="/icon-sets/pixel-icon.png" alt="Pixel Icon" className="w-full h-full object-contain" />
                  </div>
                  
                  <div className="mt-0 flex flex-col gap-0.5">
                    <p className="text-sm font-semibold text-primary" style={{ marginTop: 12, marginBottom: 0 }}>Meta Pixel</p>
                    <p className="text-sm text-tertiary" style={{ marginTop: 0, marginBottom: 0 }}>Tracking & Analytics</p>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </div>

        
      </main>
      {/* Right rail: On this page */}
        <aside className="sticky top-25 right-4 ml-10 hidden w-64 shrink-0 overflow-y-auto pb-10 text-sm xl:block">
          <div className="flex flex-col max-h-[calc(100vh-7rem)] pb-8">
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4 text-fg-quaternary">
                <path d="M3 12h18M3 6h18M3 18h12"></path>
              </svg>
              <p className="text-xs font-semibold text-primary">On this page</p>
            </div>

            <nav className="mt-4">
              <ol className="flex flex-col gap-2 border-l border-secondary pl-3">
                {[
                  { id: "inventory-providers", label: "Inventory Providers" },
                  { id: "calendar-integration", label: "Calendar" },
                  { id: "social-media", label: "Social Media" },
                  { id: "meta-pixel", label: "Meta Pixel" },
                ].map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="text-sm font-semibold text-quaternary hover:text-brand-secondary">
                      {t.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </aside>
        
        {/* Email Connection Modal */}
        {selectedEmailProvider && (
          <EmailConnectionModal
            isOpen={emailModalOpen}
            onClose={handleEmailModalClose}
            provider={selectedEmailProvider}
            onSuccess={handleEmailConnectionSuccess}
          />
        )}

        {/* Calendar Selection Modal */}
        {selectedCalendarProvider && selectedCalendarProvider !== 'unified' && (
          <CalendarSelectionModal
            isOpen={calendarModalOpen}
            onClose={handleCalendarModalClose}
            onSave={handleCalendarSelectionSave}
            provider={selectedCalendarProvider}
            connectedEmail={calendarIntegrations[selectedCalendarProvider].accounts?.[0]?.email}
          />
        )}
        
        {/* Unified Calendar Management Modal */}
        {selectedCalendarProvider === 'unified' && (
          <UnifiedCalendarModal
            isOpen={calendarModalOpen}
            onClose={handleCalendarModalClose}
            calendarIntegrations={calendarIntegrations}
            onGoogleConnect={handleGoogleCalendarConnect}
            onMicrosoftConnect={handleMicrosoftCalendarConnect}
            onGoogleDisconnect={(integrationId) => handleCalendarDisconnect('google', integrationId)}
            onMicrosoftDisconnect={(integrationId) => handleCalendarDisconnect('microsoft', integrationId)}
          />
        )}
        
        {/* Social Media Integration Modal */}
        <SocialMediaModal
          isOpen={socialMediaModalOpen}
          onClose={() => setSocialMediaModalOpen(false)}
        />
    </div>
  );
};

// Data for inventory providers
const inventoryProviders = [
  {
    name: "DealerCenter",
    description: "Inventory Management",
    href: "/docs/dealercenter",
  },
  {
    name: "CarsforSale",
    description: "Inventory Management", 
    href: "/docs/carsforsale",
  },
  {
    name: "AutoManager",
    description: "Inventory Management",
    href: "/docs/automanager",
  },
  {
    name: "vAuto",
    description: "Inventory Management",
    href: "/docs/vauto",
  },
  {
    name: "DealerCarSearch",
    description: "Inventory Management",
    href: "/docs/dealercarsearch",
  },
  {
    name: "Trailer Ops",
    description: "Inventory Management",
    href: "/docs/trailerops",
  },
  {
    name: "DealerON",
    description: "Inventory Management",
    href: "/docs/dealeron",
  },
  {
    name: "Auto Raptor",
    description: "Inventory Management",
    href: "/docs/autoraptor",
  },
];

// Provider Card Component
function ProviderCard({ name, description, href, isConnected, isInProgress }: { name: string; description: string; href: string; isConnected: boolean; isInProgress?: boolean }) {
  return (
    <a
      className={`group relative flex flex-col items-start rounded-xl bg-primary_alt p-5 ring-1 ring-secondary outline-focus-ring transition duration-100 ease-linear ring-inset hover:bg-primary_hover hover:ring-blue-300 hover:shadow-md no-underline ${
        isConnected ? 'ring-green-300 bg-green-50 dark:bg-green-900/20' : isInProgress ? 'ring-blue-300 bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      href={href}
    >
      {/* Arrow Icon */}
      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="absolute top-4 right-4 size-4 text-fg-quaternary">
        <path d="M7 17 17 7m0 0H7m10 0v10"></path>
      </svg>

      {/* Status Indicator - positioned in top right */}
      {isInProgress && !isConnected && (
        <div className="absolute top-4 right-12 flex items-center gap-2">
          <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Processing...
          </span>
        </div>
      )}
      
      <div className="flex flex-col">
        <p className="text-sm text-tertiary mt-0" style={{ marginTop: 0, marginBottom: 12 }}>{description}</p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-primary" style={{ marginTop: 0, marginBottom: 0 }}>{name}</p>
          {isConnected && (
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              ✓ Connected
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

// Section Component
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-semibold text-primary md:text-xl">
        <a href={`#${id}`}>{title}</a>
      </h2>
      <div className="typography prose prose-invert max-w-none mt-3 not-prose:text-base">
        {children}
      </div>
    </section>
  );
}

// Divider Component
function Divider() {
  return (
    <hr className="my-6 border-t border-secondary" />
  );
}