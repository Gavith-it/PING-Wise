/**
 * Campaign API Adapter
 * 
 * Converts between Campaign API models and UI models
 */

import { CrmCampaign, CrmCampaignRequest } from '@/types/crmApi';
import { Campaign } from '@/types';

/**
 * Convert CRM Campaign to UI Campaign model
 */
export function crmCampaignToCampaign(crmCampaign: CrmCampaign): Campaign {
  // Parse scheduled_at to scheduledDate
  let scheduledDate: Date | undefined;
  if (crmCampaign.scheduled_at) {
    scheduledDate = new Date(crmCampaign.scheduled_at);
  }

  return {
    id: crmCampaign.id,
    name: crmCampaign.name,
    title: crmCampaign.name, // Use name as title
    message: crmCampaign.message,
    recipients: crmCampaign.recipients || [],
    recipientTags: [], // Tags are not in response, will need to be derived
    recipientCount: crmCampaign.recipients?.length || 0,
    status: mapCrmStatusToCampaignStatus(crmCampaign.status),
    scheduledDate: scheduledDate,
    sentDate: undefined, // Not available in CRM API
    createdBy: '', // Not available in CRM API
    createdAt: crmCampaign.created_at ? new Date(crmCampaign.created_at) : undefined,
    updatedAt: crmCampaign.updated_at ? new Date(crmCampaign.updated_at) : undefined,
  };
}

/**
 * Convert UI Campaign model to CRM Campaign Request
 */
export function campaignToCrmCampaign(campaign: Partial<Campaign> & { title?: string; message: string; recipientTags?: string[] }): CrmCampaignRequest {
  // Convert scheduledDate + scheduledTime to scheduled_at (ISO string)
  let scheduled_at: string | undefined;
  let is_scheduled = false;

  if (campaign.scheduledDate) {
    const date = campaign.scheduledDate instanceof Date 
      ? campaign.scheduledDate 
      : new Date(campaign.scheduledDate);
    
    scheduled_at = date.toISOString();
    is_scheduled = true;
  }

  // Determine status
  let status = campaign.status || 'draft';
  if (scheduled_at && new Date(scheduled_at) > new Date()) {
    status = 'scheduled';
  } else if (!scheduled_at) {
    status = 'draft';
  }

  return {
    name: campaign.title || campaign.name || '',
    message: campaign.message,
    tags: campaign.recipientTags || [],
    recipients: campaign.recipients || [],
    is_scheduled: is_scheduled,
    scheduled_at: scheduled_at,
    status: status,
  };
}

/**
 * Map CRM status to Campaign status
 */
function mapCrmStatusToCampaignStatus(crmStatus: string): Campaign['status'] {
  const normalized = crmStatus.toLowerCase();
  
  if (normalized === 'draft') return 'draft';
  if (normalized === 'sent' || normalized === 'delivered') return 'sent';
  if (normalized === 'scheduled') return 'scheduled';
  if (normalized === 'sending') return 'sending';
  if (normalized === 'failed') return 'failed';
  
  // Default to draft if status doesn't match
  return 'draft';
}

/**
 * Convert array of CRM Campaigns to array of Campaigns
 */
export function crmCampaignsToCampaigns(campaigns: CrmCampaign[] | null | undefined): Campaign[] {
  if (!campaigns || !Array.isArray(campaigns)) {
    return [];
  }
  
  return campaigns
    .map(crmCampaignToCampaign)
    .filter((campaign): campaign is Campaign => campaign !== undefined);
}

