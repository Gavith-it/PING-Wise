import { useState, useEffect, useCallback } from 'react';
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

  const loadCampaigns = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      
      // Fetch campaigns from CRM API
      const crmCampaigns = await campaignApi.getCampaigns();
      const newCampaigns = crmCampaignsToCampaigns(crmCampaigns);
      
      // Update cache
      campaignsCache.campaigns = newCampaigns;
      campaignsCache.timestamp = Date.now();
      
      setCampaigns(newCampaigns);
    } catch (error) {
      console.error('Load campaigns error:', error);
      toast.error('Failed to load campaigns');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If we have cached data, use it immediately and refresh in background
    if (isCacheValid && campaigns.length === 0) {
      setCampaigns(campaignsCache.campaigns);
      loadCampaigns(false);
    } else {
      loadCampaigns(true);
    }
  }, [isCacheValid, campaigns.length, loadCampaigns]);

  return {
    campaigns,
    loading,
    loadCampaigns,
  };
}
