import { useState, useEffect, useCallback } from 'react';
import { templateApi } from '@/lib/services/templateApi';
import { crmTemplatesToTemplates } from '@/lib/utils/templateAdapter';
import { Template } from '@/lib/utils/templateAdapter';
import { fallbackTemplates } from '../utils/templateUtils';

interface UseTemplatesReturn {
  templates: Template[];
  loading: boolean;
  displayTemplates: Template[];
  loadTemplates: () => Promise<void>;
}

export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch templates from API
      const crmTemplates = await templateApi.getTemplates();
      const newTemplates = crmTemplatesToTemplates(crmTemplates);
      
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Load templates error:', error);
      // Don't show error toast, just use empty array (fallback to hardcoded templates)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Use API templates if available, otherwise use fallback
  const displayTemplates = templates.length > 0 ? templates : fallbackTemplates;

  return {
    templates,
    loading,
    displayTemplates,
    loadTemplates,
  };
}
