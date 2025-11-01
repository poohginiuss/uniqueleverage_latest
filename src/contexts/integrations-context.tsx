'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
interface CalendarAccount {
  email: string;
  id: number;
}

interface CalendarIntegrations {
  google: {
    connected: boolean;
    accounts: CalendarAccount[];
    loading: boolean;
  };
  microsoft: {
    connected: boolean;
    accounts: CalendarAccount[];
    loading: boolean;
  };
}

interface FacebookProfile {
  id: string;
  name: string;
  email?: string;
}

interface Page {
  id: string;
  pageId: string;
  name: string;
  category?: string;
  platform: string;
}

interface AdAccount {
  id: string;
  name: string;
  accountId: string;
}

interface SocialMediaIntegrations {
  facebook: {
    connected: boolean;
    profile: FacebookProfile | null;
    connectedAccountsCount: number;
    connectedPages: Page[];
    connectedAdAccounts: AdAccount[];
  };
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface IntegrationsContextType {
  calendar: CalendarIntegrations;
  socialMedia: SocialMediaIntegrations;
  isLoading: boolean;
  refreshIntegrations: () => Promise<void>;
  updateCalendarIntegrations: (data: CalendarIntegrations) => void;
  updateSocialMediaIntegrations: (data: SocialMediaIntegrations) => void;
}

// Cache configuration
const CACHE_TTL = {
  CALENDAR: 5 * 60 * 1000, // 5 minutes
  SOCIAL_MEDIA: 10 * 60 * 1000, // 10 minutes
  SHORT: 30 * 1000, // 30 seconds for frequent updates
};

// Smart cache utilities
const cacheUtils = {
  set<T>(key: string, data: T, ttl: number = CACHE_TTL.SHORT): void {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(key, JSON.stringify(cachedData));
  },

  get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cachedData: CachedData<T> = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - cachedData.timestamp > cachedData.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return cachedData.data;
    } catch (error) {
      localStorage.removeItem(key);
      return null;
    }
  },

  invalidate(key: string): void {
    localStorage.removeItem(key);
  },

  invalidateAll(): void {
    const keys = ['integrations_calendar', 'integrations_social_media'];
    keys.forEach(key => localStorage.removeItem(key));
  }
};

// Default values
const defaultCalendarIntegrations: CalendarIntegrations = {
  google: { connected: false, accounts: [], loading: false },
  microsoft: { connected: false, accounts: [], loading: false }
};

const defaultSocialMediaIntegrations: SocialMediaIntegrations = {
  facebook: { 
    connected: false, 
    profile: null, 
    connectedAccountsCount: 0,
    connectedPages: [],
    connectedAdAccounts: []
  }
};

// Create context
const IntegrationsContext = createContext<IntegrationsContextType | undefined>(undefined);

// Provider component
export function IntegrationsProvider({ children }: { children: ReactNode }) {
  const [calendar, setCalendar] = useState<CalendarIntegrations>(defaultCalendarIntegrations);
  const [socialMedia, setSocialMedia] = useState<SocialMediaIntegrations>(defaultSocialMediaIntegrations);
  const [isLoading, setIsLoading] = useState(true);

  // Load from cache on mount, then fetch fresh data
  useEffect(() => {
    const loadFromCache = () => {
      const cachedCalendar = cacheUtils.get<CalendarIntegrations>('integrations_calendar');
      const cachedSocialMedia = cacheUtils.get<SocialMediaIntegrations>('integrations_social_media');

      if (cachedCalendar) {
        setCalendar(cachedCalendar);
      }
      if (cachedSocialMedia) {
        setSocialMedia(cachedSocialMedia);
      }
    };

    // Load from cache immediately for instant UI
    loadFromCache();
    
    // Fetch fresh data from API
    fetchIntegrations();
  }, []);

  // Fetch integrations from API with smart caching
  const fetchIntegrations = async (forceRefresh = false) => {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cachedCalendar = cacheUtils.get<CalendarIntegrations>('integrations_calendar');
        const cachedSocialMedia = cacheUtils.get<SocialMediaIntegrations>('integrations_social_media');
        
        // If we have fresh cache, use it and skip API calls
        if (cachedCalendar && cachedSocialMedia) {
          setCalendar(cachedCalendar);
          setSocialMedia(cachedSocialMedia);
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(true);

      // Fetch calendar integrations
      const calendarResponse = await fetch('/api/integrations/calendars');
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        if (calendarData.success && calendarData.integrations && calendarData.integrations.length > 0) {
          const googleAccounts: CalendarAccount[] = [];
          const microsoftAccounts: CalendarAccount[] = [];

          calendarData.integrations.forEach((integration: any) => {
            if (integration.provider === 'google') {
              googleAccounts.push({ email: integration.provider_email, id: integration.id });
            } else if (integration.provider === 'microsoft') {
              microsoftAccounts.push({ email: integration.provider_email, id: integration.id });
            }
          });

          const newCalendarState = {
            google: { connected: googleAccounts.length > 0, accounts: googleAccounts, loading: false },
            microsoft: { connected: microsoftAccounts.length > 0, accounts: microsoftAccounts, loading: false }
          };

          setCalendar(newCalendarState);
          cacheUtils.set('integrations_calendar', newCalendarState, CACHE_TTL.CALENDAR);
        } else {
          // No integrations found - clear the state
          const emptyCalendarState = {
            google: { connected: false, accounts: [], loading: false },
            microsoft: { connected: false, accounts: [], loading: false }
          };
          setCalendar(emptyCalendarState);
          cacheUtils.set('integrations_calendar', emptyCalendarState, CACHE_TTL.CALENDAR);
        }
      } else {
        // API error - clear the state
        const emptyCalendarState = {
          google: { connected: false, accounts: [], loading: false },
          microsoft: { connected: false, accounts: [], loading: false }
        };
        setCalendar(emptyCalendarState);
        cacheUtils.set('integrations_calendar', emptyCalendarState, CACHE_TTL.CALENDAR);
      }

      // Fetch social media integrations
      const socialMediaResponse = await fetch('/api/integrations/social-media');
      if (socialMediaResponse.ok) {
        const socialMediaData = await socialMediaResponse.json();
        
        // Calculate total connected accounts count
        const facebookProfileCount = socialMediaData.facebookProfile ? 1 : 0;
        const pagesCount = socialMediaData.connectedPages?.length || 0;
        const adAccountsCount = socialMediaData.connectedAdAccounts?.length || 0;
        const totalConnectedAccounts = facebookProfileCount + pagesCount + adAccountsCount;
        
        
        const newSocialMediaState = {
          facebook: {
            connected: !!socialMediaData.facebookProfile,
            profile: socialMediaData.facebookProfile || null,
            connectedAccountsCount: totalConnectedAccounts,
            connectedPages: socialMediaData.connectedPages || [],
            connectedAdAccounts: socialMediaData.connectedAdAccounts || []
          }
        };

        setSocialMedia(newSocialMediaState);
        cacheUtils.set('integrations_social_media', newSocialMediaState, CACHE_TTL.SOCIAL_MEDIA);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh integrations (called after connect/disconnect) - forces API fetch
  const refreshIntegrations = async () => {
    cacheUtils.invalidateAll(); // Clear cache to force fresh data
    await fetchIntegrations(true); // Force refresh
  };

  // Optimistic update for calendar integrations
  const updateCalendarIntegrations = (data: CalendarIntegrations) => {
    setCalendar(data);
    cacheUtils.set('integrations_calendar', data, CACHE_TTL.SHORT); // Short TTL for optimistic updates
  };

  // Optimistic update for social media integrations
  const updateSocialMediaIntegrations = (data: SocialMediaIntegrations) => {
    setSocialMedia(data);
    cacheUtils.set('integrations_social_media', data, CACHE_TTL.SHORT); // Short TTL for optimistic updates
  };

  const value: IntegrationsContextType = {
    calendar,
    socialMedia,
    isLoading,
    refreshIntegrations,
    updateCalendarIntegrations,
    updateSocialMediaIntegrations
  };

  return (
    <IntegrationsContext.Provider value={value}>
      {children}
    </IntegrationsContext.Provider>
  );
}

// Hook to use the context
export function useIntegrations() {
  const context = useContext(IntegrationsContext);
  if (context === undefined) {
    throw new Error('useIntegrations must be used within an IntegrationsProvider');
  }
  return context;
}

