'use client';

import { Send, Clock, Tag, Image as ImageIcon, X } from 'lucide-react';

interface CampaignFormProps {
  campaignTitle: string;
  message: string;
  selectedTags: string[];
  selectedTemplate: string | null;
  scheduledDate: string;
  scheduledTime: string;
  errors: { title?: string; message?: string; tags?: string; schedule?: string };
  images: File[];
  imagePreviews: string[];
  loading: boolean;
  isSendDisabled: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onTitleChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onTagClick: () => void;
  onScheduleClick: () => void;
  onImageClick: () => void;
  onSend: () => void;
  onTemplateDeselect: () => void;
}

export default function CampaignForm({
  campaignTitle,
  message,
  selectedTags,
  scheduledDate,
  scheduledTime,
  errors,
  images,
  imagePreviews,
  loading,
  isSendDisabled,
  fileInputRef,
  onTitleChange,
  onMessageChange,
  onImageSelect,
  onRemoveImage,
  onTagClick,
  onScheduleClick,
  onImageClick,
  onSend,
  onTemplateDeselect,
}: CampaignFormProps) {
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
              onTitleChange(e.target.value);
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
            onMessageChange(e.target.value);
            onTemplateDeselect();
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
          onChange={onImageSelect}
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
                    onClick={() => onRemoveImage(index)}
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
              {selectedTags.map((tagId) => (
                <span
                  key={tagId}
                  className="inline-flex items-center space-x-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs"
                >
                  <span>{tagLabels[tagId] || tagId}</span>
                </span>
              ))}
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
          onClick={onSend}
          disabled={isSendDisabled}
          className="flex-[2] bg-primary text-white py-2 px-3 md:px-4 rounded-lg md:rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 shadow-md hover:shadow-lg"
        >
          <Send className="w-4 h-4 md:w-4 md:h-4 flex-shrink-0" />
          <span className="hidden md:inline">{loading ? 'Sending...' : 'Send Campaign'}</span>
        </button>
        <button 
          onClick={onScheduleClick}
          className="flex-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-2 md:px-3 rounded-lg md:rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-1 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md text-xs"
        >
          <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Schedule</span>
        </button>
        <button 
          onClick={onTagClick}
          className="flex-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-2 md:px-3 rounded-lg md:rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-1 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md text-xs"
        >
          <Tag className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Tags</span>
        </button>
        <button 
          type="button"
          onClick={onImageClick}
          className="flex-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-2 md:px-3 rounded-lg md:rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-1 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md text-xs"
          title="Add images"
        >
          <ImageIcon className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Images</span>
        </button>
      </div>
    </div>
  );
}
