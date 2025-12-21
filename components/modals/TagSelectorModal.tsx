'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface TagSelectorModalProps {
  onClose: () => void;
  onApply: (tags: string[]) => void;
  selectedTags: string[];
}

const availableTags = [
  { id: 'all', label: 'All', color: 'bg-gray-500' },
  { id: 'active', label: 'Active', color: 'bg-green-500' },
  { id: 'inactive', label: 'Inactive', color: 'bg-gray-400' },
  { id: 'booked', label: 'Booked', color: 'bg-blue-500' },
  { id: 'follow-up', label: 'Follow-up', color: 'bg-yellow-500' },
  { id: 'new', label: 'New', color: 'bg-purple-500' },
  { id: 'birthday', label: 'Birthday', color: 'bg-pink-500' },
];

export default function TagSelectorModal({ onClose, onApply, selectedTags }: TagSelectorModalProps) {
  const [tags, setTags] = useState<string[]>(selectedTags);

  const toggleTag = (tagId: string) => {
    if (tagId === 'all') {
      // If "All" is selected, clear other selections
      setTags(['all']);
    } else {
      // Remove "all" if any specific tag is selected
      const newTags = tags.filter(t => t !== 'all');
      
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
    // Ensure at least one tag is selected
    if (tags.length === 0) {
      onApply(['all']);
    } else {
      onApply(tags);
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
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/10 dark:bg-primary/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${tag.color}`}></div>
                        <span className={`font-medium text-sm ${
                          isSelected ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {tag.label}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary" />
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
                  return (
                    <span
                      key={tagId}
                      className="inline-flex items-center space-x-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs"
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

