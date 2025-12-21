import { useState, useEffect, useRef, useCallback } from 'react';
import { crmPatientService } from '@/lib/services/crmPatientService';
import toast from 'react-hot-toast';
import { Patient } from '@/types';
import { FilterOptions } from '@/components/modals/FilterModal';

// Cache for patients data to enable instant navigation
const patientsCache: {
  patients: Patient[];
  total: number;
  filters: string;
  timestamp: number;
} = {
  patients: [],
  total: 0,
  filters: '',
  timestamp: 0,
};

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const LIMIT = 10;

/**
 * Invalidate the patients cache
 * Call this when patients are added/updated from other pages (like dashboard)
 */
export function invalidatePatientsCache(): void {
  patientsCache.patients = [];
  patientsCache.total = 0;
  patientsCache.filters = '';
  patientsCache.timestamp = 0;
}

interface UsePatientsParams {
  debouncedSearchTerm: string;
  statusFilter: string;
  advancedFilters: FilterOptions;
}

interface UsePatientsReturn {
  patients: Patient[];
  loading: boolean;
  loadingMore: boolean;
  total: number;
  hasMore: boolean;
  page: number;
  loadPatients: (reset?: boolean, skipLoadingSpinner?: boolean) => Promise<void>;
  handleLoadMore: () => void;
  handleDelete: (id: string) => Promise<void>;
  handlePatientCreated: (newPatient?: Patient) => void;
}

export function usePatients({ debouncedSearchTerm, statusFilter, advancedFilters }: UsePatientsParams): UsePatientsReturn {
  // Initialize with cached data for instant display
  const [patients, setPatients] = useState<Patient[]>(patientsCache.patients);
  const [loading, setLoading] = useState(patientsCache.patients.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(patientsCache.total);
  const [hasMore, setHasMore] = useState(false);
  const hasInitialized = useRef(false);
  const previousFilters = useRef<string>('');
  const isLoadingRef = useRef(false);

  const loadPatients = useCallback(async (reset = false, skipLoadingSpinner = false) => {
    // Prevent concurrent calls
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      
      // Only show loading spinner on initial load (when no data exists)
      // Use functional update to get current patients length without dependency
      if (reset && !skipLoadingSpinner) {
        setLoading(prev => {
          // Only show loading if we don't have patients
          setPatients(currentPatients => {
            if (currentPatients.length === 0) {
              return currentPatients; // Will be set below
            }
            return currentPatients;
          });
          return true;
        });
        setPage(1);
      } else if (reset && skipLoadingSpinner) {
        // Filter change - don't show loading spinner
        setPage(1);
      } else if (!reset) {
        // Loading more - show loading more indicator
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const params: any = {
        page: currentPage,
        limit: LIMIT,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(advancedFilters.dateRange.start && { dateStart: advancedFilters.dateRange.start }),
        ...(advancedFilters.dateRange.end && { dateEnd: advancedFilters.dateRange.end }),
        ...(advancedFilters.ageRange.min && { ageMin: advancedFilters.ageRange.min }),
        ...(advancedFilters.ageRange.max && { ageMax: advancedFilters.ageRange.max }),
        ...(advancedFilters.assignedDoctor && { doctor: advancedFilters.assignedDoctor }),
      };

      const response = await crmPatientService.getPatients(params);
      const newPatients = response.data || [];
      const newTotal = response.total || 0;
      
      if (reset) {
        // Update patients immediately
        setPatients(newPatients);
        // Update cache
        const filterKey = JSON.stringify({ searchTerm: debouncedSearchTerm, statusFilter, advancedFilters });
        patientsCache.patients = newPatients;
        patientsCache.total = newTotal;
        patientsCache.filters = filterKey;
        patientsCache.timestamp = Date.now();
      } else {
        // Append for pagination
        setPatients(prev => [...prev, ...newPatients]);
      }
      
      setTotal(newTotal);
      setHasMore((currentPage * LIMIT) < newTotal);
      if (!reset) {
        setPage(currentPage + 1);
      }
    } catch (error) {
      toast.error('Failed to load patients');
      console.error('Load patients error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [debouncedSearchTerm, statusFilter, advancedFilters, page]);

  // Main effect to load patients - optimized to prevent duplicate calls
  useEffect(() => {
    // Create filter key to check cache
    const filterKey = JSON.stringify({ searchTerm: debouncedSearchTerm, statusFilter, advancedFilters });
    
    // Prevent duplicate calls - check if filters actually changed
    if (hasInitialized.current && previousFilters.current === filterKey) {
      return; // Filters haven't changed, skip
    }
    
    previousFilters.current = filterKey;
    const cacheAge = Date.now() - patientsCache.timestamp;
    const isCacheValid = patientsCache.patients.length > 0 && 
                        patientsCache.filters === filterKey && 
                        cacheAge < CACHE_DURATION;
    
    // Only show loading on initial load, not on filter changes
    const isInitialLoad = !hasInitialized.current;
    const hasCachedData = patientsCache.patients.length > 0;
    
    if (isCacheValid && isInitialLoad) {
      // Use cached data immediately for fast display
      setPatients(patientsCache.patients);
      setTotal(patientsCache.total);
      setLoading(false);
      hasInitialized.current = true;
      // Always refresh in background when navigating to page to get latest data
      // This ensures new patients added from dashboard show up immediately
      // Refresh regardless of cache age to ensure fresh data on every page visit
      if (!isLoadingRef.current) {
        loadPatients(true, true);
      }
    } else if (isCacheValid) {
      // Same filters, cache is valid - use it immediately
      setPatients(patientsCache.patients);
      setTotal(patientsCache.total);
      setLoading(false);
      hasInitialized.current = true;
      // On subsequent visits (not initial load), refresh if cache is older than 2 seconds
      // This ensures new patients added from other pages show up
      if (cacheAge > 2 * 1000 && !isLoadingRef.current) {
        loadPatients(true, true);
      }
    } else {
      // Filters changed or cache invalid - load new data
      setPage(1);
      hasInitialized.current = true;
      // Only show loading on initial load when no cached data
      if (isInitialLoad && !hasCachedData) {
        loadPatients(true, false);
      } else {
        // Filter change - keep current data visible, fetch in background
        loadPatients(true, true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, statusFilter, advancedFilters]);

  const handleLoadMore = useCallback(() => {
    loadPatients(false);
  }, [loadPatients]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) {
      return;
    }

    try {
      // Optimistic update: Remove from list immediately
      setPatients(prevPatients => prevPatients.filter(p => p.id !== id));
      setTotal(prevTotal => Math.max(0, prevTotal - 1));
      
      // Update cache
      patientsCache.patients = patientsCache.patients.filter(p => p.id !== id);
      patientsCache.total = Math.max(0, patientsCache.total - 1);
      
      // Delete in background
      await crmPatientService.deletePatient(id);
      toast.success('Patient deleted successfully');
      
      // Optionally refresh in background to ensure sync (non-blocking)
      loadPatients(true, true).catch(() => {
        // Silent fail - we already updated optimistically
      });
    } catch (error) {
      // Revert optimistic update on error
      loadPatients(true, true);
      toast.error('Failed to delete patient');
    }
  }, [loadPatients]);

  const handlePatientCreated = useCallback((newPatient?: Patient) => {
    if (newPatient) {
      // Optimistic update: Add/update patient in list immediately
      setPatients(prevPatients => {
        const existingIndex = prevPatients.findIndex(p => p.id === newPatient.id);
        const isNew = existingIndex < 0;
        
        if (isNew) {
          // Update total if it's a new patient
          setTotal(prevTotal => prevTotal + 1);
          patientsCache.total = (patientsCache.total || 0) + 1;
          // Add new patient at the beginning
          return [newPatient, ...prevPatients];
        } else {
          // Update existing patient
          const updated = [...prevPatients];
          updated[existingIndex] = newPatient;
          return updated;
        }
      });
      
      // Update cache
      patientsCache.patients = [newPatient, ...patientsCache.patients.filter(p => p.id !== newPatient.id)];
      patientsCache.timestamp = Date.now();
      
      // Optionally refresh in background to ensure sync (non-blocking)
      loadPatients(true, true).catch(() => {
        // Silent fail - we already updated optimistically
      });
    } else {
      // Fallback: Reload if no patient data provided
      loadPatients(true, true);
    }
  }, [loadPatients]);

  return {
    patients,
    loading,
    loadingMore,
    total,
    hasMore,
    page,
    loadPatients,
    handleLoadMore,
    handleDelete,
    handlePatientCreated,
  };
}
