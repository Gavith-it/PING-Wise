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

  const templates = [
    { 
      name: 'Festival Promotions', 
      subtitle: 'Seasonal',
      icon: Sparkles, 
      gradient: 'from-purple-500 to-pink-500',
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
      gradient: 'from-green-500 to-emerald-500',
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
  };

  const handleSchedule = (date: string, time: string) => {
    if (date && time) {
      setScheduledDate(date);
      setScheduledTime(time);
      toast.success('Campaign scheduled successfully');
    } else {
      setScheduledDate('');
      setScheduledTime('');
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message or select a template');
      return;
    }

    if (selectedTags.length === 0) {
      toast.error('Please select at least one tag');
      return;
    }

    setLoading(true);
    try {
      const campaignData: any = {
        message,
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
      
      loadCampaigns();
    } catch (error) {
      toast.error('Failed to send campaign');
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
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (e.target.value !== templates.find(t => t.name === selectedTemplate)?.message) {
                  setSelectedTemplate(null);
                }
              }}
              placeholder="Write your message…"
              className="w-full h-24 md:h-32 p-3 md:p-4 border border-gray-200 rounded-lg md:rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-3 md:mb-4 text-sm md:text-base"
            />

            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
              <div className="mb-3 md:mb-4">
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
              </div>
            )}

            {/* Scheduled Info Display */}
            {scheduledDate && scheduledTime && (
              <div className="mb-3 md:mb-4">
                <p className="text-xs text-gray-500 mb-1">Scheduled for:</p>
                <p className="text-sm text-gray-700">
                  {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                </p>
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

          {/* Template Options Section */}
          <div className="mb-4 md:mb-6">
            <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3">Campaign Templates</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5 md:gap-2">
              {templates.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplate === template.name;
                return (
                  <button
                    key={template.name}
                    onClick={() => handleTemplateClick(template)}
                    className={`bg-gradient-to-br ${template.gradient} rounded-lg md:rounded-xl p-2 md:p-2.5 text-white text-center hover:scale-[1.02] transition-transform shadow-md hover:shadow-lg border-2 aspect-square flex flex-col items-center justify-center ${
                      isSelected ? 'border-white border-opacity-50 ring-2 ring-white ring-opacity-30' : 'border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 md:w-4 md:h-4 mb-1 flex-shrink-0" />
                    <p className="font-semibold mb-0.5 text-[10px] md:text-xs leading-tight">{template.name}</p>
                    <p className="text-[9px] md:text-[10px] opacity-90">{template.subtitle}</p>
                  </button>
                );
              })}
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
            />
          )}
        </div>
      </Layout>
    </PrivateRoute>
  );
}
