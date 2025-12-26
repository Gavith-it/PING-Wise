/**
 * Standardized Status and Tag Constants
 * 
 * These constants ensure consistency across the application.
 * All status and tag values are standardized here.
 */

/**
 * Customer Status Constants
 * Used for patient/customer status values
 * Format: Capitalized (Active, Inactive, FollowUp, Booked)
 */
export const CustomerStatus = {
  Active: 'Active',
  Inactive: 'Inactive',
  FollowUp: 'FollowUp',
  Booked: 'Booked',
} as const;

/**
 * Campaign Tag Constants
 * Used for campaign recipient tags
 * Format: Capitalized (Active, Inactive, FollowUp, Booked, New, Birthday, All)
 */
export const CampaignTag = {
  Active: 'Active',
  Inactive: 'Inactive',
  FollowUp: 'FollowUp',
  Booked: 'Booked',
  NewTag: 'New',
  BirthdayTag: 'Birthday',
  AllTag: 'All',
} as const;

/**
 * Type definitions for status values
 */
export type CustomerStatusType = typeof CustomerStatus[keyof typeof CustomerStatus];
export type CampaignTagType = typeof CampaignTag[keyof typeof CampaignTag];

/**
 * Helper function to get all customer status values as array
 */
export const getAllCustomerStatuses = (): string[] => {
  return Object.values(CustomerStatus);
};

/**
 * Helper function to get all campaign tags as array
 */
export const getAllCampaignTags = (): string[] => {
  return Object.values(CampaignTag);
};

/**
 * Helper function to check if a value is a valid customer status
 */
export const isValidCustomerStatus = (status: string): status is CustomerStatusType => {
  return Object.values(CustomerStatus).includes(status as CustomerStatusType);
};

/**
 * Helper function to check if a value is a valid campaign tag
 */
export const isValidCampaignTag = (tag: string): tag is CampaignTagType => {
  return Object.values(CampaignTag).includes(tag as CampaignTagType);
};

/**
 * Convert lowercase/legacy status to standardized CustomerStatus
 * Handles mapping from old format ('active', 'follow-up') to new format ('Active', 'FollowUp')
 */
export const normalizeCustomerStatus = (status: string | undefined | null): CustomerStatusType => {
  if (!status) return CustomerStatus.Active;
  
  const normalized = status.trim();
  
  // Direct match (already standardized)
  if (isValidCustomerStatus(normalized)) {
    return normalized as CustomerStatusType;
  }
  
  // Map from lowercase/legacy format to standardized format
  const lowerStatus = normalized.toLowerCase();
  
  if (lowerStatus === 'active' || lowerStatus.includes('active')) {
    return CustomerStatus.Active;
  }
  if (lowerStatus === 'inactive' || lowerStatus.includes('inactive')) {
    return CustomerStatus.Inactive;
  }
  if (lowerStatus === 'booked' || lowerStatus.includes('booked')) {
    return CustomerStatus.Booked;
  }
  if (lowerStatus === 'follow-up' || lowerStatus === 'followup' || lowerStatus.includes('follow')) {
    return CustomerStatus.FollowUp;
  }
  
  // Default to Active if no match
  return CustomerStatus.Active;
};

/**
 * Convert standardized CustomerStatus to lowercase format (for API compatibility)
 * Use this when sending to APIs that expect lowercase values
 */
export const customerStatusToApiFormat = (status: CustomerStatusType): string => {
  const mapping: Record<CustomerStatusType, string> = {
    [CustomerStatus.Active]: 'active',
    [CustomerStatus.Inactive]: 'inactive',
    [CustomerStatus.Booked]: 'booked',
    [CustomerStatus.FollowUp]: 'follow-up',
  };
  return mapping[status] || 'active';
};

/**
 * Convert lowercase API format to standardized CustomerStatus
 */
export const apiFormatToCustomerStatus = (status: string): CustomerStatusType => {
  return normalizeCustomerStatus(status);
};

/**
 * Convert lowercase/legacy tag to standardized CampaignTag
 */
export const normalizeCampaignTag = (tag: string | undefined | null): CampaignTagType | null => {
  if (!tag) return null;
  
  const normalized = tag.trim();
  
  // Direct match (already standardized)
  if (isValidCampaignTag(normalized)) {
    return normalized as CampaignTagType;
  }
  
  // Map from lowercase/legacy format to standardized format
  const lowerTag = normalized.toLowerCase();
  
  if (lowerTag === 'active' || lowerTag.includes('active')) {
    return CampaignTag.Active;
  }
  if (lowerTag === 'inactive' || lowerTag.includes('inactive')) {
    return CampaignTag.Inactive;
  }
  if (lowerTag === 'booked' || lowerTag.includes('booked')) {
    return CampaignTag.Booked;
  }
  if (lowerTag === 'follow-up' || lowerTag === 'followup' || lowerTag.includes('follow')) {
    return CampaignTag.FollowUp;
  }
  if (lowerTag === 'new' || lowerTag.includes('new')) {
    return CampaignTag.NewTag;
  }
  if (lowerTag === 'birthday' || lowerTag.includes('birthday')) {
    return CampaignTag.BirthdayTag;
  }
  if (lowerTag === 'all' || lowerTag.includes('all')) {
    return CampaignTag.AllTag;
  }
  
  return null;
};

/**
 * Convert standardized CampaignTag to API format
 * The CRM API expects the standardized format directly (Active, FollowUp, etc.)
 * This function returns the standardized format as-is
 */
export const campaignTagToApiFormat = (tag: CampaignTagType): string => {
  // Return the standardized format directly - the API expects this format
  return tag;
};

