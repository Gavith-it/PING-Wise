'use client';

import { memo } from 'react';
import { Campaign } from '@/types';
import { CampaignTag, normalizeCampaignTag } from '@/lib/constants/status';

interface CampaignCardProps {
  campaign: Campaign;
  getStatusColor: (status: string) => string;
}

// Helper function to format time ago
function formatTimeAgo(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

// Tag color mapping (same as CampaignForm)
const getTagColor = (tagId: string) => {
  const normalized = normalizeCampaignTag(tagId);
  if (!normalized) {
    return { bg: 'bg-gray-50 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-500' };
  }
  if (normalized === CampaignTag.AllTag) return { bg: 'bg-gray-50 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-500' };
  if (normalized === CampaignTag.Active) return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' };
  if (normalized === CampaignTag.Inactive) return { bg: 'bg-gray-50 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-400' };
  if (normalized === CampaignTag.Booked) return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' };
  if (normalized === CampaignTag.FollowUp) return { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' };
  if (normalized === CampaignTag.NewTag) return { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' };
  if (normalized === CampaignTag.BirthdayTag) return { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-400', dot: 'bg-pink-500' };
  return { bg: 'bg-gray-50 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-500' };
};

const tagLabels: Record<string, string> = {
  'all': 'All',
  'active': 'Active',
  'inactive': 'Inactive',
  'booked': 'Booked',
  'follow-up': 'FollowUp',
  'followup': 'FollowUp',
  'new': 'New',
  'birthday': 'Birthday',
};

function CampaignCard({ campaign, getStatusColor }: CampaignCardProps) {
  const timeAgo = formatTimeAgo(campaign.createdAt || campaign.sentDate);
  const tags = campaign.recipientTags || [];

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-2.5 md:p-3 shadow-sm border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white mb-1 md:mb-1.5">
            {campaign.name || campaign.title || 'Campaign'}
          </p>
          
          {/* Patient count and time */}
          <div className="flex items-center space-x-2 text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-1.5 md:mb-2">
            <span>{campaign.recipientCount || 0} patients</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5 md:mt-2">
              {tags.map((tagId) => {
                const tagColor = getTagColor(tagId);
                const normalized = normalizeCampaignTag(tagId);
                const label = normalized ? tagLabels[normalized.toLowerCase()] || tagId : tagLabels[tagId.toLowerCase()] || tagId;
                return (
                  <span
                    key={tagId}
                    className={`inline-flex items-center space-x-1 px-1.5 py-0.5 ${tagColor.bg} ${tagColor.text} rounded-md text-[10px]`}
                  >
                    <div className={`w-1 h-1 rounded-full ${tagColor.dot}`}></div>
                    <span>{label}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Status Badge - Right Side */}
        <span className={`text-[9px] md:text-[10px] font-medium px-1.5 md:px-2 py-0.5 rounded-full border ${getStatusColor(campaign.status)} flex-shrink-0`}>
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </span>
      </div>
    </div>
  );
}

export default memo(CampaignCard);
