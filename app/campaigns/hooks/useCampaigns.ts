import { useState, useEffect, useCallback, useRef } from 'react';
import { campaignApi } from '@/lib/services/campaignApi';
import { crmCampaignsToCampaigns } from '@/lib/utils/campaignAdapter';
import toast from 'react-hot-toast';
import { Campaign } from '@/types';

// Campaigns cache
const campaignsCache: {
  campaigns: Campaign[];
  timestamp: number;
} = {
  campaigns: [],
  timestamp: 0,
};

const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

interface UseCampaignsReturn {
  campaigns: Campaign[];
  loading: boolean;
  loadCampaigns: (showLoading?: boolean) => Promise<void>;
}

export function useCampaigns(): UseCampaignsReturn {
  const cacheAge = Date.now() - campaignsCache.timestamp;
  const isCacheValid = campaignsCache.campaigns.length > 0 && cacheAge < CACHE_DURATION;
  const [campaigns, setCampaigns] = useState<Campaign[]>(isCacheValid ? campaignsCache.campaigns : []);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const loadCampaigns = useCallback(async (showLoading = false) => {
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      if (showLoading) setLoading(true);
      
      // Fetch campaigns from CRM API
      const crmCampaigns = await campaignApi.getCampaigns();
      const newCampaigns = crmCampaignsToCampaigns(crmCampaigns);
      
      // Update cache
      campaignsCache.campaigns = newCampaigns;
      campaignsCache.timestamp = Date.now();
      
      setCampaigns(newCampaigns);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('Load campaigns error:', error);
      toast.error('Failed to load campaigns');
    } finally {
      isLoadingRef.current = false;
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prevent duplicate calls on mount (React Strict Mode)
    if (hasLoadedRef.current || isLoadingRef.current) {
      return;
    }

    // If we have cached data, use it immediately and refresh in background
    if (isCacheValid && campaigns.length === 0) {
      setCampaigns(campaignsCache.campaigns);
      loadCampaigns(false);
    } else if (!hasLoadedRef.current) {
      loadCampaigns(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  return {
    campaigns,
    loading,
    loadCampaigns,
  };
}
