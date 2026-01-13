'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { useCampaigns } from './hooks/useCampaigns';
import { useTemplates } from './hooks/useTemplates';
import { useCampaignForm } from './hooks/useCampaignForm';
import { useImageHandling } from './hooks/useImageHandling';
import CampaignForm from './components/CampaignForm';
import TemplatesList from './components/TemplatesList';
import CampaignsList from './components/CampaignsList';

// Lazy load modals for better performance
const TagSelectorModal = dynamic(() => import('@/components/modals/TagSelectorModal'), {
  loading: () => null,
  ssr: false
});

const ScheduleModal = dynamic(() => import('@/components/modals/ScheduleModal'), {
  loading: () => null,
  ssr: false
});

export default function CampaignsPage() {
  const [showTagModal, setShowTagModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const { campaigns, loadCampaigns } = useCampaigns();
  const { displayTemplates, loading: templatesLoading } = useTemplates();
  const {
    images,
    imagePreviews,
    fileInputRef,
    handleImageSelect,
    handleRemoveImage,
    clearImages,
  } = useImageHandling();

  const {
    campaignTitle,
    message,
    selectedTags,
    selectedTemplate,
    scheduledDate,
    scheduledTime,
    errors,
    loading,
    setCampaignTitle,
    setMessage,
    setSelectedTemplate,
    handleTagApply,
    handleSchedule,
    handleTemplateClick,
    handleSend,
    resetForm,
  } = useCampaignForm({
    onSuccess: () => {
      clearImages();
      loadCampaigns();
    },
  });

  const handleTitleChange = useCallback((value: string) => {
    setCampaignTitle(value);
  }, [setCampaignTitle]);

  const handleMessageChange = useCallback((value: string) => {
    setMessage(value);
    // Clear template selection if message is manually edited
    // Check if the message matches any content line from the selected template
    if (selectedTemplate && displayTemplates.find(t => t.id === selectedTemplate)) {
      const selectedTemp = displayTemplates.find(t => t.id === selectedTemplate);
      if (selectedTemp && !selectedTemp.content.includes(value)) {
        setSelectedTemplate(null);
      }
    }
  }, [setMessage, selectedTemplate, displayTemplates, setSelectedTemplate]);

  const handleTemplateClickWrapper = useCallback((template: any) => {
    // Pass the full template object to handle cycling through content lines
    handleTemplateClick(template);
  }, [handleTemplateClick]);

  const handleTagApplyWrapper = useCallback((tags: string[]) => {
    handleTagApply(tags);
    setShowTagModal(false);
  }, [handleTagApply]);

  const handleScheduleWrapper = useCallback((date: string, time: string) => {
    handleSchedule(date, time);
    setShowScheduleModal(false);
  }, [handleSchedule]);

  const handleSendWrapper = useCallback(async () => {
    await handleSend();
  }, [handleSend]);

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
          <CampaignForm
            campaignTitle={campaignTitle}
            message={message}
            selectedTags={selectedTags}
            selectedTemplate={selectedTemplate}
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
            errors={errors}
            images={images}
            imagePreviews={imagePreviews}
            loading={loading}
            isSendDisabled={isSendDisabled}
            fileInputRef={fileInputRef}
            onTitleChange={handleTitleChange}
            onMessageChange={handleMessageChange}
            onImageSelect={handleImageSelect}
            onRemoveImage={handleRemoveImage}
            onTagClick={() => setShowTagModal(true)}
            onScheduleClick={() => setShowScheduleModal(true)}
            onImageClick={() => fileInputRef.current?.click()}
            onSend={handleSendWrapper}
            onTemplateDeselect={() => setSelectedTemplate(null)}
          />

          {/* Templates Section */}
          <TemplatesList
            templates={displayTemplates}
            selectedTemplate={selectedTemplate}
            onTemplateClick={handleTemplateClickWrapper}
            loading={templatesLoading}
          />

          {/* Recent Campaigns Section */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">Recent Campaigns</h3>
            <CampaignsList campaigns={campaigns} />
          </div>

          {/* Modals */}
          {showTagModal && (
            <TagSelectorModal
              onClose={() => setShowTagModal(false)}
              onApply={handleTagApplyWrapper}
              selectedTags={selectedTags}
            />
          )}

          {showScheduleModal && (
            <ScheduleModal
              onClose={() => setShowScheduleModal(false)}
              onSchedule={handleScheduleWrapper}
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
