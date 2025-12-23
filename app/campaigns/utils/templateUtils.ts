import { Sparkles, Stethoscope, Heart, Percent, Snowflake } from 'lucide-react';
import { Template } from '@/lib/utils/templateAdapter';

/**
 * Get template icon based on template name
 */
export function getTemplateIcon(templateName: string) {
  const lowerName = templateName.toLowerCase();
  if (lowerName.includes('festival') || lowerName.includes('promotion')) return Sparkles;
  if (lowerName.includes('pre-surgery')) return Stethoscope;
  if (lowerName.includes('post-surgery') || lowerName.includes('care')) return Heart;
  if (lowerName.includes('offer')) return Percent;
  if (lowerName.includes('seasonal')) return Snowflake;
  return Sparkles;
}

/**
 * Get template gradient classes based on template name
 */
export function getTemplateGradient(templateName: string): string {
  const lowerName = templateName.toLowerCase();
  if (lowerName.includes('festival') || lowerName.includes('promotion')) return 'from-purple-500 to-blue-500';
  if (lowerName.includes('pre-surgery')) return 'from-pink-500 to-orange-500';
  if (lowerName.includes('post-surgery') || lowerName.includes('care')) return 'from-blue-500 to-cyan-500';
  if (lowerName.includes('offer')) return 'from-green-500 to-teal-500';
  if (lowerName.includes('seasonal')) return 'from-cyan-500 to-blue-500';
  return 'from-purple-500 to-blue-500';
}

/**
 * Fallback templates (if API doesn't return any)
 */
export const fallbackTemplates: Template[] = [
  { 
    id: '1',
    name: 'Festival Promotions', 
    content: ['🎉 Happy Festival! We\'re offering special health checkup packages this festive season. Book your appointment today and avail exclusive discounts!']
  },
  { 
    id: '2',
    name: 'Pre-Surgery', 
    content: ['📋 Pre-Surgery Reminder: Your surgery is scheduled soon. Please follow the pre-surgery guidelines provided. Contact us if you have any questions.']
  },
  { 
    id: '3',
    name: 'Post-Surgery', 
    content: ['💚 Post-Surgery Care: Hope you\'re recovering well! Remember to follow your post-surgery care instructions. Schedule a follow-up if needed.']
  },
  { 
    id: '4',
    name: 'Special Offers', 
    content: ['🎁 Special Offer: Limited time discount on health packages! Book your appointment now and save up to 30%. Offer valid until month end.']
  },
  { 
    id: '5',
    name: 'Seasonal Offers', 
    content: ['❄️ Seasonal Health Checkup: Stay healthy this season! Book your seasonal health checkup package and get comprehensive health screening at special rates.']
  },
];

/**
 * Get status color classes
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-700';
    case 'scheduled':
      return 'bg-blue-100 text-blue-700';
    case 'sending':
      return 'bg-yellow-100 text-yellow-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}
