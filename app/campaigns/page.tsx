'use client';

import { useState, useEffect } from 'react';
import { Send, Clock, Tag, Sparkles, Stethoscope, Heart, Percent, Snowflake } from 'lucide-react';
import { campaignService } from '@/lib/services/api';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import TagSelectorModal from '@/components/modals/TagSelectorModal';
import ScheduleModal from '@/components/modals/ScheduleModal';
import { Campaign } from '@/types';

export default function CampaignsPage() {
  const [message, setMessage] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [showTagModal, setShowTagModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [errors, setErrors] = useState<{ message?: string; tags?: string; schedule?: string }>({});

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await campaignService.getCampaigns();
      setCampaigns(response.data || []);
    } catch (error) {
      console.error('Load campaigns error:', error);
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

  const templates = [
    { 
      name: 'Festival Promotions', 
      subtitle: 'Seasonal',
      icon: Sparkles, 
      gradient: 'from-purple-500 to-blue-500',
      message: '🎉 Happy Festival! We\'re offering special health checkup packages this festive season. Book your appointment today and avail exclusive discounts!'
    },
    { 
      name: 'Pre-Surgery', 
      subtitle: 'Medical',
      icon: Stethoscope, 
      gradient: 'from-pink-500 to-orange-500',
      message: '📋 Pre-Surgery Reminder: Your surgery is scheduled soon. Please follow the pre-surgery guidelines provided. Contact us if you have any questions.'
    },
    { 
      name: 'Post-Surgery', 
      subtitle: 'Recovery',
      icon: Heart, 
      gradient: 'from-blue-500 to-cyan-500',
      message: '💚 Post-Surgery Care: Hope you\'re recovering well! Remember to follow your post-surgery care instructions. Schedule a follow-up if needed.'
    },
    { 
      name: 'Special Offers', 
      subtitle: 'Offers',
      icon: Percent, 
      gradient: 'from-green-500 to-teal-500',
      message: '🎁 Special Offer: Limited time discount on health packages! Book your appointment now and save up to 30%. Offer valid until month end.'
    },
    { 
      name: 'Seasonal Offers', 
      subtitle: 'Seasonal',
      icon: Snowflake, 
      gradient: 'from-cyan-500 to-blue-500',
      message: '❄️ Seasonal Health Checkup: Stay healthy this season! Book your seasonal health checkup package and get comprehensive health screening at special rates.'
    },
  ];

  const handleTemplateClick = (template: typeof templates[0]) => {
    setMessage(template.message);
    setSelectedTemplate(template.name);
  };

  const handleTagApply = (tags: string[]) => {
    setSelectedTags(tags);
    if (errors.tags && tags.length > 0) {
      setErrors({ ...errors, tags: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { message?: string; tags?: string; schedule?: string } = {};

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
        message: message.trim(),
        recipientTags: selectedTags,
        template: selectedTemplate || '',
      };

      // If scheduled date/time is set and in future, add scheduling
      if (scheduledDate && scheduledTime) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        const now = new Date();
        
        if (scheduledDateTime > now) {
          campaignData.scheduledDate = scheduledDate;
          campaignData.scheduledTime = scheduledTime;
          campaignData.status = 'scheduled';
        }
      }

      await campaignService.createCampaign(campaignData);
      toast.success(scheduledDate && scheduledTime ? 'Campaign scheduled successfully' : 'Campaign sent successfully');
      
      // Reset form
      setMessage('');
      setSelectedTags([]);
      setSelectedTemplate(null);
      setScheduledDate('');
      setScheduledTime('');
      setErrors({});
      
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
  const isSendDisabled = loading || !message.trim() || selectedTags.length === 0;

  return (
    <PrivateRoute>
      <Layout>
        <div className="space-y-4 md:space-y-6">
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Campaigns</h2>
                <p className="text-sm md:text-base text-gray-600 mt-0.5 md:mt-1">Send messages to your patients</p>
              </div>
            </div>
          </div>

          {/* Create Campaign Section */}
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Create New Campaign</h3>
            
            {/* Message Input */}
            <div>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (e.target.value !== templates.find(t => t.name === selectedTemplate)?.message) {
                    setSelectedTemplate(null);
                  }
                  if (errors.message) {
                    setErrors({ ...errors, message: '' });
                  }
                }}
                placeholder="Write your message…"
                className={`w-full h-24 md:h-32 p-3 md:p-4 border rounded-lg md:rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-1 text-sm md:text-base ${
                  errors.message ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                }`}
                maxLength={1000}
              />
              {errors.message && (
                <p className="text-sm text-red-600 mb-2">{errors.message}</p>
              )}
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <p className="text-xs text-gray-500">
                  {message.length}/1000 characters
                  {message.trim().length < 10 && message.length > 0 && (
                    <span className="text-red-500 ml-1">(minimum 10 characters required)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Selected Tags Display */}
            <div className="mb-3 md:mb-4">
              {selectedTags.length > 0 ? (
                <>
                  <p className="text-xs text-gray-500 mb-2">Selected tags:</p>
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
                <p className="text-xs text-gray-500 mb-2">No tags selected</p>
              )}
              {errors.tags && (
                <p className="text-sm text-red-600 mt-1">{errors.tags}</p>
              )}
            </div>

            {/* Scheduled Info Display */}
            {scheduledDate && scheduledTime && (
              <div className="mb-3 md:mb-4">
                <p className="text-xs text-gray-500 mb-1">Scheduled for:</p>
                <p className={`text-sm ${errors.schedule ? 'text-red-600' : 'text-gray-700'}`}>
                  {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                </p>
                {errors.schedule && (
                  <p className="text-sm text-red-600 mt-1">{errors.schedule}</p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 md:gap-2.5">
              <button
                onClick={handleSend}
                disabled={isSendDisabled}
                className="flex-[2] bg-primary text-white py-2 px-3 md:px-4 rounded-lg md:rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 shadow-md hover:shadow-lg text-xs md:text-sm"
              >
                <Send className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span>{loading ? 'Sending...' : 'Send Campaign'}</span>
              </button>
              <button 
                onClick={() => setShowScheduleModal(true)}
                className="flex-1 bg-white text-gray-700 py-2 px-2 md:px-3 rounded-lg md:rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1 border border-gray-200 shadow-sm hover:shadow-md text-xs"
              >
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Schedule</span>
              </button>
              <button 
                onClick={() => setShowTagModal(true)}
                className="flex-1 bg-white text-gray-700 py-2 px-2 md:px-3 rounded-lg md:rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1 border border-gray-200 shadow-sm hover:shadow-md text-xs"
              >
                <Tag className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Tags</span>
              </button>
            </div>
          </div>

          {/* Templates Section */}
          <div className="mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-4">Templates</h3>
            {/* Mobile: Horizontal scroll with centered 2x2 grid */}
            <div className="md:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              <div className="flex gap-0">
                {/* First 4 templates in centered 2x2 grid */}
                <div className="flex-shrink-0 snap-start w-full flex justify-center px-4">
                  <div className="grid grid-cols-2 gap-4 w-full max-w-[600px]">
                    {templates.slice(0, 4).map((template) => (
                      <TemplateCard
                        key={template.name}
                        icon={template.icon}
                        title={template.name}
                        subtitle={template.subtitle}
                        gradientClasses={template.gradient}
                        isSelected={selectedTemplate === template.name}
                        onClick={() => handleTemplateClick(template)}
                      />
                    ))}
                  </div>
                </div>
                {/* 5th template - accessible by scrolling */}
                {templates.length > 4 && (
                  <div className="flex-shrink-0 snap-start w-full flex justify-center px-4">
                    <div className="grid grid-cols-2 gap-4 w-full max-w-[600px]">
                      <TemplateCard
                        icon={templates[4].icon}
                        title={templates[4].name}
                        subtitle={templates[4].subtitle}
                        gradientClasses={templates[4].gradient}
                        isSelected={selectedTemplate === templates[4].name}
                        onClick={() => handleTemplateClick(templates[4])}
                      />
                      <div></div> {/* Empty space to maintain grid */}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Desktop: All cards in a single row */}
            <div className="hidden md:grid md:grid-cols-5 gap-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.name}
                  icon={template.icon}
                  title={template.name}
                  subtitle={template.subtitle}
                  gradientClasses={template.gradient}
                  isSelected={selectedTemplate === template.name}
                  onClick={() => handleTemplateClick(template)}
                />
              ))}
            </div>
          </div>

          {/* Recent Campaigns Section */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">Recent Campaigns</h3>
            <div className="space-y-2 md:space-y-3 max-h-96 overflow-y-auto pr-2">
              {campaigns.length === 0 ? (
                <div className="bg-white rounded-xl md:rounded-2xl p-6 md:p-8 text-center">
                  <p className="text-sm md:text-base text-gray-500">No campaigns yet</p>
                </div>
              ) : (
                campaigns.map((campaign) => (
                  <div 
                    key={campaign.id} 
                    className="bg-white rounded-lg md:rounded-xl p-3 md:p-5 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm md:text-base text-gray-900 mb-1">
                          {campaign.name || campaign.title || 'Campaign'}
                        </p>
                        <p className="text-xs md:text-sm text-gray-700 mb-2 line-clamp-2">
                          {campaign.message}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
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
