'use client';

import { memo } from 'react';
import { Campaign } from '@/types';
import CampaignCard from './CampaignCard';
import { getStatusColor } from '../utils/templateUtils';

interface CampaignsListProps {
  campaigns: Campaign[];
}

function CampaignsList({ campaigns }: CampaignsListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-6 md:p-8 text-center">
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">No campaigns yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 md:space-y-2 max-h-96 overflow-y-auto pr-2">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          getStatusColor={getStatusColor}
        />
      ))}
    </div>
  );
}

export default memo(CampaignsList);
