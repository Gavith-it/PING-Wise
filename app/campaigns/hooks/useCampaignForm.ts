import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { campaignApi } from '@/lib/services/campaignApi';
import { campaignToCrmCampaign } from '@/lib/utils/campaignAdapter';
import { Template } from '@/lib/utils/templateAdapter';

interface CampaignFormErrors {
  title?: string;
  message?: string;
  tags?: string;
  schedule?: string;
}

interface UseCampaignFormParams {
  onSuccess: () => void;
}

interface UseCampaignFormReturn {
  campaignTitle: string;
  message: string;
  selectedTags: string[];
  selectedTemplate: string | null;
  scheduledDate: string;
  scheduledTime: string;
  errors: CampaignFormErrors;
  loading: boolean;
  setCampaignTitle: (value: string) => void;
  setMessage: (value: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setSelectedTemplate: (templateId: string | null) => void;
  setScheduledDate: (date: string) => void;
  setScheduledTime: (time: string) => void;
  handleTagApply: (tags: string[]) => void;
  handleSchedule: (date: string, time: string) => void;
  handleTemplateClick: (template: Template) => void;
  validateForm: () => boolean;
  handleSend: () => Promise<void>;
  resetForm: () => void;
}

export function useCampaignForm({ onSuccess }: UseCampaignFormParams): UseCampaignFormReturn {
  const [campaignTitle, setCampaignTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [errors, setErrors] = useState<CampaignFormErrors>({});
  const [loading, setLoading] = useState(false);
  
  // Track current content index for each template (templateId -> contentIndex)
  const templateContentIndexRef = useRef<Map<string, number>>(new Map());

  const validateForm = useCallback((): boolean => {
    const newErrors: CampaignFormErrors = {};

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
  }, [campaignTitle, message, selectedTags, scheduledDate, scheduledTime]);

  const handleTagApply = useCallback((tags: string[]) => {
    setSelectedTags(tags);
    if (errors.tags && tags.length > 0) {
      setErrors(prev => ({ ...prev, tags: '' }));
    }
  }, [errors.tags]);

  const handleSchedule = useCallback((date: string, time: string) => {
    if (date && time) {
      setScheduledDate(date);
      setScheduledTime(time);
      
      // Validate scheduled date/time
      const scheduledDateTime = new Date(`${date}T${time}`);
      const now = new Date();
      
      if (scheduledDateTime <= now) {
        toast.error('Scheduled date and time must be in the future');
        setErrors(prev => ({ ...prev, schedule: 'Scheduled date and time must be in the future' }));
        return;
      }
      
      setErrors(prev => ({ ...prev, schedule: '' }));
      toast.success('Campaign scheduled successfully');
    } else {
      setScheduledDate('');
      setScheduledTime('');
      setErrors(prev => ({ ...prev, schedule: '' }));
    }
  }, []);

  const handleTemplateClick = useCallback((template: Template) => {
    // Get template content array
    const contentArray = template.content || [];
    
    if (contentArray.length === 0) {
      // No content available, set empty message
      setMessage('');
      setSelectedTemplate(template.id);
      return;
    }
    
    // Check if this is the same template that was previously selected
    const isSameTemplate = selectedTemplate === template.id;
    
    // Get current index for this template (default to 0 if not set)
    const currentIndex = templateContentIndexRef.current.get(template.id) || 0;
    
    // Determine next index
    let nextIndex: number;
    if (isSameTemplate) {
      // Same template clicked again - cycle to next content line
      nextIndex = (currentIndex + 1) % contentArray.length;
    } else {
      // Different template clicked - start from first content line
      nextIndex = 0;
    }
    
    // Update the index for this template
    templateContentIndexRef.current.set(template.id, nextIndex);
    
    // Get the content at the next index
    const nextContent = contentArray[nextIndex];
    
    // Update message and selected template
    setMessage(nextContent);
    setSelectedTemplate(template.id);
  }, [selectedTemplate]);

  const handleSend = useCallback(async () => {
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
      resetForm();
      
      // Call success callback
      onSuccess();
    } catch (error: any) {
      // Handle 401 Unauthorized specifically
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        // Clear tokens
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('access_token');
          // Redirect to login after showing error
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000); // Give user time to read the error message
        }
      } else {
        // Handle other errors
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            'Failed to send campaign';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [campaignTitle, message, selectedTags, scheduledDate, scheduledTime, validateForm, errors, onSuccess]);

  const resetForm = useCallback(() => {
    setCampaignTitle('');
    setMessage('');
    setSelectedTags([]);
    setSelectedTemplate(null);
    setScheduledDate('');
    setScheduledTime('');
    setErrors({});
    // Reset template content indices when form is reset
    templateContentIndexRef.current.clear();
  }, []);

  const setCampaignTitleWithErrorClear = useCallback((value: string) => {
    setCampaignTitle(value);
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: '' }));
    }
  }, [errors.title]);

  const setMessageWithErrorClear = useCallback((value: string) => {
    setMessage(value);
    if (errors.message) {
      setErrors(prev => ({ ...prev, message: '' }));
    }
  }, [errors.message]);

  return {
    campaignTitle,
    message,
    selectedTags,
    selectedTemplate,
    scheduledDate,
    scheduledTime,
    errors,
    loading,
    setCampaignTitle: setCampaignTitleWithErrorClear,
    setMessage: setMessageWithErrorClear,
    setSelectedTags,
    setSelectedTemplate,
    setScheduledDate,
    setScheduledTime,
    handleTagApply,
    handleSchedule,
    handleTemplateClick,
    validateForm,
    handleSend,
    resetForm,
  };
}
