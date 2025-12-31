'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { CampaignTag, campaignTagToApiFormat, normalizeCampaignTag } from '@/lib/constants/status';

interface TagSelectorModalProps {
  onClose: () => void;
  onApply: (tags: string[]) => void;
  selectedTags: string[];
}

// Standardized campaign tags using constants
// API values use the standardized format directly (Active, FollowUp, All, etc.)
const availableTags = [
  { id: CampaignTag.AllTag, label: 'All', color: 'bg-gray-500', apiValue: CampaignTag.AllTag }, // 'All'
  { id: CampaignTag.Active, label: 'Active', color: 'bg-green-500', apiValue: CampaignTag.Active }, // 'Active'
  { id: CampaignTag.Inactive, label: 'Inactive', color: 'bg-gray-400', apiValue: CampaignTag.Inactive }, // 'Inactive'
  { id: CampaignTag.Booked, label: 'Booked', color: 'bg-blue-500', apiValue: CampaignTag.Booked }, // 'Booked'
  { id: CampaignTag.FollowUp, label: 'FollowUp', color: 'bg-yellow-500', apiValue: CampaignTag.FollowUp }, // 'FollowUp'
  { id: CampaignTag.NewTag, label: 'New', color: 'bg-purple-500', apiValue: CampaignTag.NewTag }, // 'New'
  { id: CampaignTag.BirthdayTag, label: 'Birthday', color: 'bg-pink-500', apiValue: CampaignTag.BirthdayTag }, // 'Birthday'
];

export default function TagSelectorModal({ onClose, onApply, selectedTags }: TagSelectorModalProps) {
  // Normalize selected tags to standardized format
  const normalizedSelectedTags = selectedTags.map(tag => {
    const normalized = normalizeCampaignTag(tag);
    return normalized || tag;
  });
  
  const [tags, setTags] = useState<string[]>(normalizedSelectedTags);

  const toggleTag = (tagId: string) => {
    const tag = availableTags.find(t => t.id === tagId);
    if (!tag) return;
    
    if (tagId === CampaignTag.AllTag) {
      // If "All" is selected, clear other selections
      setTags([CampaignTag.AllTag]);
    } else {
      // Remove "all" if any specific tag is selected
      const newTags = tags.filter(t => t !== CampaignTag.AllTag);
      
      if (newTags.includes(tagId)) {
        // Deselect tag
        setTags(newTags.filter(t => t !== tagId));
      } else {
        // Select tag
        setTags([...newTags, tagId]);
      }
      
      // If no tags selected, default to "all"
      if (newTags.length === 0 || (newTags.length === 1 && newTags[0] === tagId)) {
        setTags([tagId]);
      }
    }
  };

  const handleApply = () => {
    // Tags are already in standardized format, use them directly for API
    const apiFormatTags = tags.map(tag => {
      const tagObj = availableTags.find(t => t.id === tag);
      // Use the standardized format directly (API expects this format)
      return tagObj ? tagObj.apiValue : tag;
    });
    
    // Ensure at least one tag is selected
    if (apiFormatTags.length === 0) {
      onApply([CampaignTag.AllTag]);
    } else {
      onApply(apiFormatTags);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select Tags</h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select one or more tags to filter recipients for your campaign.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {availableTags.map((tag) => {
                const isSelected = tags.includes(tag.id);
                // Map color classes to border and text colors
                const getColorClasses = (colorClass: string) => {
                  if (colorClass === 'bg-green-500') return { border: 'border-green-500', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' };
                  if (colorClass === 'bg-gray-400') return { border: 'border-gray-400', bg: 'bg-gray-50 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300' };
                  if (colorClass === 'bg-blue-500') return { border: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400' };
                  if (colorClass === 'bg-yellow-500') return { border: 'border-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400' };
                  if (colorClass === 'bg-purple-500') return { border: 'border-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400' };
                  if (colorClass === 'bg-pink-500') return { border: 'border-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-400' };
                  if (colorClass === 'bg-gray-500') return { border: 'border-gray-500', bg: 'bg-gray-50 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300' };
                  return { border: 'border-gray-500', bg: 'bg-gray-50 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300' };
                };
                const colorClasses = getColorClasses(tag.color);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? `${colorClasses.border} ${colorClasses.bg}`
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${tag.color}`}></div>
                        <span className={`font-medium text-sm ${
                          isSelected ? colorClasses.text : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {tag.label}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className={`w-4 h-4 ${colorClasses.text}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2">Selected tags:</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tagId) => {
                  const tag = availableTags.find(t => t.id === tagId);
                  if (!tag) return null;
                  // Map color classes to background and text colors for selected tags
                  const getTagColorClasses = (colorClass: string) => {
                    if (colorClass === 'bg-green-500') return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' };
                    if (colorClass === 'bg-gray-400') return { bg: 'bg-gray-50 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300' };
                    if (colorClass === 'bg-blue-500') return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400' };
                    if (colorClass === 'bg-yellow-500') return { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400' };
                    if (colorClass === 'bg-purple-500') return { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400' };
                    if (colorClass === 'bg-pink-500') return { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-400' };
                    if (colorClass === 'bg-gray-500') return { bg: 'bg-gray-50 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300' };
                    return { bg: 'bg-gray-50 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300' };
                  };
                  const tagColorClasses = getTagColorClasses(tag.color);
                  return (
                    <span
                      key={tagId}
                      className={`inline-flex items-center space-x-1 px-2 py-1 ${tagColorClasses.bg} ${tagColorClasses.text} rounded-lg text-xs`}
                    >
                      <div className={`w-2 h-2 rounded-full ${tag.color}`}></div>
                      <span>{tag.label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg"
            >
              Apply Tags
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

