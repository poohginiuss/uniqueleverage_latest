import { useState, useEffect, useCallback, useRef } from 'react';

interface InventoryRequest {
  providerKey: string;
  status: string;
  requestDate: string;
  connectedDate: string | null;
  expectedFilename: string;
}

interface InventoryStatus {
  status: 'not_requested' | 'pending' | 'connected' | 'disconnected';
  hasRequest: boolean;
  isConnected: boolean;
  isPending: boolean;
  requestDate?: string;
  connectedDate?: string;
  requests?: InventoryRequest[];
}

interface CacheEntry {
  data: InventoryStatus;
  timestamp: number;
}

// Global cache to share status across all components
const statusCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 30000; // 30 seconds
const MIN_REFETCH_INTERVAL = 5000; // 5 seconds minimum between refetches

// Track ongoing requests to prevent duplicates
const ongoingRequests = new Map<string, Promise<InventoryStatus>>();

export function useInventoryStatus(providerKey?: string) {
  const [status, setStatus] = useState<InventoryStatus>(() => {
    // Always start with default state to force fresh fetch
    return {
      status: 'not_requested',
      hasRequest: false,
      isConnected: false,
      isPending: false
    };
  });
  const [loading, setLoading] = useState(() => {
    // Always start with loading true to force fresh fetch
    return true;
  });
  const lastFetchTime = useRef<number>(0);
  const mountedRef = useRef(true);

  const getCacheKey = useCallback((email: string, provider?: string) => {
    return provider ? `${email}-${provider}` : email;
  }, []);

  const isCacheValid = useCallback((cacheKey: string): boolean => {
    const cached = statusCache.get(cacheKey);
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    return age < CACHE_DURATION;
  }, []);

  const fetchStatus = useCallback(async (skipCache = false): Promise<InventoryStatus | null> => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        setLoading(false);
        return null;
      }

      const cacheKey = getCacheKey(userEmail, providerKey);

      // Return cached data if valid and not skipping cache
      if (!skipCache && isCacheValid(cacheKey)) {
        const cached = statusCache.get(cacheKey);
        if (cached && mountedRef.current) {
          setStatus(cached.data);
          setLoading(false);
          return cached.data;
        }
      }

      // Prevent rapid refetches
      const timeSinceLastFetch = Date.now() - lastFetchTime.current;
      if (timeSinceLastFetch < MIN_REFETCH_INTERVAL && !skipCache) {
        return status;
      }

      // Check if there's already an ongoing request for this cache key
      if (ongoingRequests.has(cacheKey)) {
        const result = await ongoingRequests.get(cacheKey)!;
        if (mountedRef.current) {
          setStatus(result);
          setLoading(false);
        }
        return result;
      }

      // Create new request promise
      const requestPromise = (async () => {
        // Use the correct feed requests status API to check inventory connections
        const url = providerKey
          ? `/api/feed-requests/status?email=${encodeURIComponent(userEmail)}&provider=${providerKey}`
          : `/api/feed-requests/status?email=${encodeURIComponent(userEmail)}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const result = await response.json();
        
        // Cache the result
        statusCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        lastFetchTime.current = Date.now();

        return result;
      })();

      // Store the ongoing request
      ongoingRequests.set(cacheKey, requestPromise);

      try {
        const result = await requestPromise;
        
        if (mountedRef.current) {
          setStatus(result);
          setLoading(false);
        }

        return result;
      } finally {
        // Clean up the ongoing request
        ongoingRequests.delete(cacheKey);
      }

    } catch (error) {
      console.error('Failed to fetch inventory status:', error);
      if (mountedRef.current) {
        setLoading(false);
      }
      return null;
    }
  }, [providerKey, getCacheKey, isCacheValid, status]);

  const refreshStatus = useCallback(() => {
    return fetchStatus(true);
  }, [fetchStatus]);

  const invalidateCache = useCallback(() => {
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      const cacheKey = getCacheKey(userEmail, providerKey);
      statusCache.delete(cacheKey);
    }
  }, [getCacheKey, providerKey]);

  // Initial fetch on mount - fetch once to get real status, then stop
  useEffect(() => {
    mountedRef.current = true;
    fetchStatus(); // Fetch real status once on mount

    return () => {
      mountedRef.current = false;
    };
  }, []); // Remove fetchStatus dependency to prevent re-fetching

  // Poll only when status is pending (not connected yet) - DISABLED to prevent status changes
  useEffect(() => {
    // Disabled polling to prevent status updates after initial render
    return;
    
    if (!status.isPending || status.isConnected) {
      return;
    }

    // Poll every 15 seconds when pending (reduced from 30)
    const interval = setInterval(() => {
      fetchStatus();
    }, 15000);

    return () => clearInterval(interval);
  }, [status.isPending, status.isConnected, fetchStatus]);

  return {
    status,
    loading,
    refreshStatus,
    invalidateCache,
    // Computed helpers
    shouldShowProcessing: status.hasRequest && !status.isConnected,
    connectedCount: status.requests?.filter(r => r.status === 'connected').length || 0
  };
}

