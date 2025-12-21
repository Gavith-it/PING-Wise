'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Clock, Tag, Sparkles, Stethoscope, Heart, Percent, Snowflake, Image as ImageIcon, X } from 'lucide-react';
import { campaignApi } from '@/lib/services/campaignApi';
import { templateApi } from '@/lib/services/templateApi';
import { crmCampaignsToCampaigns, campaignToCrmCampaign } from '@/lib/utils/campaignAdapter';
import { crmTemplatesToTemplates, crmTemplateToTemplate } from '@/lib/utils/templateAdapter';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import TagSelectorModal from '@/components/modals/TagSelectorModal';
import ScheduleModal from '@/components/modals/ScheduleModal';
import { Campaign } from '@/types';
import { Template } from '@/lib/utils/templateAdapter';

// Cache for campaigns data to enable instant navigation
const campaignsCache: {
  campaigns: Campaign[];
  timestamp: number;
} = {
  campaigns: [],
  timestamp: 0,
};

const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

export default function CampaignsPage() {
  const [campaignTitle, setCampaignTitle] = useState('');
  const [message, setMessage] = useState('');
  // Initialize with cached data if available
  const cacheAge = Date.now() - campaignsCache.timestamp;
  const isCacheValid = campaignsCache.campaigns.length > 0 && cacheAge < CACHE_DURATION;
  const [campaigns, setCampaigns] = useState<Campaign[]>(isCacheValid ? campaignsCache.campaigns : []);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [showTagModal, setShowTagModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; message?: string; tags?: string; schedule?: string }>({});
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If we have cached data, use it immediately and refresh in background
    if (isCacheValid && campaigns.length === 0) {
      setCampaigns(campaignsCache.campaigns);
      loadCampaigns(false);
    } else {
      loadCampaigns(true);
    }
    // Load templates from API
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up image previews when component unmounts
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [imagePreviews]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }

      // Validate file size (max 5MB per image)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return;
      }

      // Limit to 5 images total
      if (images.length + newFiles.length >= 5) {
        toast.error('Maximum 5 images allowed');
        return;
      }

      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    if (newFiles.length > 0) {
      setImages([...images, ...newFiles]);
      setImagePreviews([...imagePreviews, ...newPreviews]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    // Revoke object URL to free memory
    if (imagePreviews[index]?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviews[index]);
    }

    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const loadCampaigns = async (showLoading = false) => {
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
  };

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      
      // Fetch templates from API
      const crmTemplates = await templateApi.getTemplates();
      const newTemplates = crmTemplatesToTemplates(crmTemplates);
      
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Load templates error:', error);
      // Don't show error toast, just use empty array (fallback to hardcoded templates)
    } finally {
      setLoadingTemplates(false);
    }
  };

  // TemplateCard Component
  type TemplateCardProps = {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    subtitle: string;
    gradientClasses: string;
    isSelected?: boolean;
    onClick?: () => void;
  };

  const TemplateCard = ({ icon: Icon, title, subtitle, gradientClasses, isSelected, onClick }: TemplateCardProps) => {
    return (
      <button
        onClick={onClick}
        className={`bg-gradient-to-r ${gradientClasses} rounded-[20px] md:rounded-[22px] w-full h-[120px] md:h-[140px] max-w-[260px] mx-auto relative overflow-hidden hover:scale-[1.02] transition-transform ${
          isSelected ? 'ring-2 ring-white ring-opacity-50' : ''
        }`}
      >
        {/* Icon: 16px from top and left */}
        <div className="absolute top-4 left-4">
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white stroke-2" />
        </div>
        {/* Title and Subtitle: 8-10px gap below icon, 16px left padding */}
        <div className="absolute top-[44px] md:top-[48px] left-4">
          <p className="text-white font-semibold text-sm md:text-base leading-tight text-left">{title}</p>
          <p className="text-xs md:text-sm mt-1 text-left" style={{ color: '#FFFFFF99' }}>{subtitle}</p>
        </div>
      </button>
    );
  };

  // Fallback templates (if API doesn't return any)
  const fallbackTemplates: Template[] = [
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

  // Use API templates if available, otherwise use fallback
  const displayTemplates = templates.length > 0 ? templates : fallbackTemplates;

  // Template icon mapping
  const getTemplateIcon = (templateName: string) => {
    const lowerName = templateName.toLowerCase();
    if (lowerName.includes('festival') || lowerName.includes('promotion')) return Sparkles;
    if (lowerName.includes('pre-surgery')) return Stethoscope;
    if (lowerName.includes('post-surgery') || lowerName.includes('care')) return Heart;
    if (lowerName.includes('offer')) return Percent;
    if (lowerName.includes('seasonal')) return Snowflake;
    return Sparkles;
  };

  // Template gradient mapping
  const getTemplateGradient = (templateName: string) => {
    const lowerName = templateName.toLowerCase();
    if (lowerName.includes('festival') || lowerName.includes('promotion')) return 'from-purple-500 to-blue-500';
    if (lowerName.includes('pre-surgery')) return 'from-pink-500 to-orange-500';
    if (lowerName.includes('post-surgery') || lowerName.includes('care')) return 'from-blue-500 to-cyan-500';
    if (lowerName.includes('offer')) return 'from-green-500 to-teal-500';
    if (lowerName.includes('seasonal')) return 'from-cyan-500 to-blue-500';
    return 'from-purple-500 to-blue-500';
  };

  const handleTemplateClick = (template: Template) => {
    // Use first content item as message (templates have content as array)
    const templateMessage = template.content && template.content.length > 0 
      ? template.content[0] 
      : '';
    setMessage(templateMessage);
    setSelectedTemplate(template.id);
  };

  const handleTagApply = (tags: string[]) => {
    setSelectedTags(tags);
    if (errors.tags && tags.length > 0) {
      setErrors({ ...errors, tags: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { title?: string; message?: string; tags?: string; schedule?: string } = {};

    // Title validation (required)
    if (!campaignTitle.trim()) {
      newErrors.title = 'Campaign title is required';
    } else if (campaignTitle.trim().length < 3) {
      newErrors.title = 'Campaign title must be at least 3 characters';
    } else if (campaignTitle.trim().length > 100) {
      newErrors.title = 'Campaign title must be less than 100 characters';
    }

    // Message validation
    if (!message.trim()) {
      newErrors.message = 'Campaign message is required';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (message.trim().length > 1000) {
      newErrors.message = 'Message must be less than 1000 characters';
    }

    // Tags validation
    if (selectedTags.length === 0) {
      newErrors.tags = 'Please select at least one recipient tag';
    }

    // Schedule validation (if scheduled)
    if (scheduledDate && scheduledTime) {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const now = new Date();
      
      if (scheduledDateTime <= now) {
        newErrors.schedule = 'Scheduled date and time must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSchedule = (date: string, time: string) => {
    if (date && time) {
      setScheduledDate(date);
      setScheduledTime(time);
      
      // Validate scheduled date/time
      const scheduledDateTime = new Date(`${date}T${time}`);
      const now = new Date();
      
      if (scheduledDateTime <= now) {
        toast.error('Scheduled date and time must be in the future');
        setErrors({ ...errors, schedule: 'Scheduled date and time must be in the future' });
        return;
      }
      
      setErrors({ ...errors, schedule: '' });
      toast.success('Campaign scheduled successfully');
    } else {
      setScheduledDate('');
      setScheduledTime('');
      setErrors({ ...errors, schedule: '' });
    }
  };

  const handleSend = async () => {
    // Validate form before submission
    if (!validateForm()) {
      // Show specific error messages
      if (errors.message) {
        toast.error(errors.message);
      } else if (errors.tags) {
        toast.error(errors.tags);
      } else if (errors.schedule) {
        toast.error(errors.schedule);
      } else {
        toast.error('Please fix the errors in the form');
      }
      return;
    }

    setLoading(true);
    try {
      const campaignData: any = {
        title: campaignTitle.trim() || undefined,
        message: message.trim(),
        recipientTags: selectedTags,
        // Template reference removed - not sent in CRM API request
      };

      // Convert to CRM Campaign format using adapter
      const crmCampaignData = campaignToCrmCampaign({
        title: campaignTitle.trim(),
        message: message.trim(),
        recipientTags: selectedTags,
        scheduledDate: scheduledDate && scheduledTime 
          ? new Date(`${scheduledDate}T${scheduledTime}`)
          : undefined,
      });

      // Create campaign via API
      await campaignApi.createCampaign(crmCampaignData);
      toast.success(scheduledDate && scheduledTime ? 'Campaign scheduled successfully' : 'Campaign sent successfully');
      
      // Reset form
      setCampaignTitle('');
      setMessage('');
      setSelectedTags([]);
      setSelectedTemplate(null);
      setScheduledDate('');
      setScheduledTime('');
      setErrors({});
      // Clean up image previews
      imagePreviews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
      setImages([]);
      setImagePreviews([]);
      
      loadCampaigns();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
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
  };

  // Check if Send Campaign button should be disabled
  const isSendDisabled = loading || !campaignTitle.trim() || !message.trim() || selectedTags.length === 0;

  return (
    <PrivateRoute>
      <Layout>
        <div className="space-y-4 md:space-y-6">
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Campaigns</h2>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-0.5 md:mt-1">Send messages to your patients</p>
              </div>
            </div>
          </div>

          {/* Create Campaign Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-4 md:mb-6">
            <div className="mb-3 md:mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Create New Campaign</h3>
              </div>
              {/* Campaign Title/Header Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Campaign Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => {
                    setCampaignTitle(e.target.value);
                    if (errors.title) {
                      setErrors({ ...errors, title: '' });
                    }
                  }}
                  placeholder="Enter campaign title"
                  className={`w-full p-2 md:p-2.5 border rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                    errors.title ? 'border-red-300 dark:border-red-600 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600'
                  }`}
                  maxLength={100}
                  required
                />
              </div>
              {errors.title && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.title}</p>
              )}
              {campaignTitle.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {campaignTitle.length}/100 characters
                </p>
              )}
            </div>
            
            {/* Message Input */}
            <div>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  // Clear template selection if message is manually edited
                  if (selectedTemplate && displayTemplates.find(t => t.id === selectedTemplate)) {
                    const selectedTemp = displayTemplates.find(t => t.id === selectedTemplate);
                    if (selectedTemp && selectedTemp.content[0] !== e.target.value) {
                      setSelectedTemplate(null);
                    }
                  }
                  if (errors.message) {
                    setErrors({ ...errors, message: '' });
                  }
                }}
                placeholder="Write your message…"
                className={`w-full h-24 md:h-32 p-3 md:p-4 border rounded-lg md:rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-1 text-sm md:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                  errors.message ? 'border-red-300 dark:border-red-600 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600'
                }`}
                maxLength={1000}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              {errors.message && (
                <p className="text-sm text-red-600 mb-2">{errors.message}</p>
              )}
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {message.length}/1000 characters
                  {message.trim().length < 10 && message.length > 0 && (
                    <span className="text-red-500 dark:text-red-400 ml-1">(minimum 10 characters required)</span>
                  )}
                </p>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mb-3 md:mb-4">
                  <div className="flex flex-wrap gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {images.length} image{images.length !== 1 ? 's' : ''} selected (max 5)
                  </p>
                </div>
              )}
            </div>

            {/* Selected Tags Display */}
            <div className="mb-3 md:mb-4">
              {selectedTags.length > 0 ? (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Selected tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tagId) => {
                      const tagLabels: Record<string, string> = {
                        'all': 'All',
                        'active': 'Active',
                        'inactive': 'Inactive',
                        'booked': 'Booked',
                        'follow-up': 'Follow-up',
                        'new': 'New',
                        'birthday': 'Birthday',
                      };
                      return (
                        <span
                          key={tagId}
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs"
                        >
                          <span>{tagLabels[tagId] || tagId}</span>
                        </span>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">No tags selected</p>
              )}
              {errors.tags && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.tags}</p>
              )}
            </div>

            {/* Scheduled Info Display */}
            {scheduledDate && scheduledTime && (
              <div className="mb-3 md:mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Scheduled for:</p>
                <p className={`text-sm ${errors.schedule ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                </p>
                {errors.schedule && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.schedule}</p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 md:gap-2.5">
              <button
                onClick={handleSend}
                disabled={isSendDisabled}
                className="flex-[2] bg-primary text-white py-2 px-3 md:px-4 rounded-lg md:rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 shadow-md hover:shadow-lg"
              >
                <Send className="w-4 h-4 md:w-4 md:h-4 flex-shrink-0" />
                <span className="hidden md:inline">{loading ? 'Sending...' : 'Send Campaign'}</span>
              </button>
              <button 
                onClick={() => setShowScheduleModal(true)}
                className="flex-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-2 md:px-3 rounded-lg md:rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-1 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md text-xs"
              >
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Schedule</span>
              </button>
              <button 
                onClick={() => setShowTagModal(true)}
                className="flex-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-2 md:px-3 rounded-lg md:rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-1 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md text-xs"
              >
                <Tag className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Tags</span>
              </button>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-2 md:px-3 rounded-lg md:rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-1 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md text-xs"
                title="Add images"
              >
                <ImageIcon className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Images</span>
              </button>
            </div>
          </div>

          {/* Templates Section */}
          <div className="mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 md:mb-4">Templates</h3>
            {/* Mobile: Horizontal scroll with centered 2x2 grid */}
            <div className="md:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              <div className="flex gap-0">
                {/* First 4 templates in centered 2x2 grid */}
                <div className="flex-shrink-0 snap-start w-full flex justify-center px-4">
                  <div className="grid grid-cols-2 gap-4 w-full max-w-[600px]">
                    {displayTemplates.slice(0, 4).map((template) => (
                      <TemplateCard
                        key={template.id}
                        icon={getTemplateIcon(template.name)}
                        title={template.name}
                        subtitle="Template"
                        gradientClasses={getTemplateGradient(template.name)}
                        isSelected={selectedTemplate === template.id}
                        onClick={() => handleTemplateClick(template)}
                      />
                    ))}
                  </div>
                </div>
                {/* 5th template - accessible by scrolling */}
                {displayTemplates.length > 4 && (
                  <div className="flex-shrink-0 snap-start w-full flex justify-center px-4">
                    <div className="grid grid-cols-2 gap-4 w-full max-w-[600px]">
                      <TemplateCard
                        icon={getTemplateIcon(displayTemplates[4].name)}
                        title={displayTemplates[4].name}
                        subtitle="Template"
                        gradientClasses={getTemplateGradient(displayTemplates[4].name)}
                        isSelected={selectedTemplate === displayTemplates[4].id}
                        onClick={() => handleTemplateClick(displayTemplates[4])}
                      />
                      <div></div> {/* Empty space to maintain grid */}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Desktop: All cards in a single row */}
            <div className="hidden md:grid md:grid-cols-5 gap-4">
              {displayTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  icon={getTemplateIcon(template.name)}
                  title={template.name}
                  subtitle="Template"
                  gradientClasses={getTemplateGradient(template.name)}
                  isSelected={selectedTemplate === template.id}
                  onClick={() => handleTemplateClick(template)}
                />
              ))}
            </div>
          </div>

          {/* Recent Campaigns Section */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">Recent Campaigns</h3>
            <div className="space-y-2 md:space-y-3 max-h-96 overflow-y-auto pr-2">
              {campaigns.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-6 md:p-8 text-center">
                  <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">No campaigns yet</p>
                </div>
              ) : (
                campaigns.map((campaign) => (
                  <div 
                    key={campaign.id} 
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
                ))
              )}
            </div>
          </div>

          {/* Modals */}
          {showTagModal && (
            <TagSelectorModal
              onClose={() => setShowTagModal(false)}
              onApply={handleTagApply}
              selectedTags={selectedTags}
            />
          )}

          {showScheduleModal && (
            <ScheduleModal
              onClose={() => setShowScheduleModal(false)}
              onSchedule={handleSchedule}
              initialDate={scheduledDate}
              initialTime={scheduledTime}
              message={message}
            />
          )}
        </div>
      </Layout>
    </PrivateRoute>
  );
}
