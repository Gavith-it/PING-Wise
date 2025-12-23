'use client';

import { memo } from 'react';
import { Campaign } from '@/types';

interface CampaignCardProps {
  campaign: Campaign;
  getStatusColor: (status: string) => string;
}

function CampaignCard({ campaign, getStatusColor }: CampaignCardProps) {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-3 md:p-5 shadow-sm border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-1">
            {campaign.name || campaign.title || 'Campaign'}
          </p>
          <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
            {campaign.message}
          </p>
          <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
            <span>{campaign.recipientCount || 0} patients</span>
            <span>•</span>
            <span>{campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'N/A'}</span>
            {campaign.scheduledDate && (
              <>
                <span>•</span>
                <span>Scheduled: {new Date(campaign.scheduledDate).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
        <span className={`text-[10px] md:text-xs font-medium px-2 md:px-3 py-0.5 md:py-1 rounded-full border ${getStatusColor(campaign.status)} flex-shrink-0`}>
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </span>
      </div>
    </div>
  );
}

export default memo(CampaignCard);
