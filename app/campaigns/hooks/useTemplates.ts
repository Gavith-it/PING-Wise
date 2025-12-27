import { useState, useEffect, useCallback, useRef } from 'react';
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
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const loadTemplates = useCallback(async () => {
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      
      // Fetch templates from API
      const crmTemplates = await templateApi.getTemplates();
      const newTemplates = crmTemplatesToTemplates(crmTemplates);
      
      setTemplates(newTemplates);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('Load templates error:', error);
      // Don't show error toast, just use empty array (fallback to hardcoded templates)
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prevent duplicate calls on mount (React Strict Mode)
    if (hasLoadedRef.current || isLoadingRef.current) {
      return;
    }

    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Use API templates if available, otherwise use fallback
  const displayTemplates = templates.length > 0 ? templates : fallbackTemplates;

  return {
    templates,
    loading,
    displayTemplates,
    loadTemplates,
  };
}
