import { useState, useEffect, useRef, useCallback } from 'react';
import { crmPatientService } from '@/lib/services/crmPatientService';
import toast from 'react-hot-toast';
import { Patient } from '@/types';
import { FilterOptions } from '@/components/modals/FilterModal';

// Patients cache - stores ALL patients (not filtered)
const patientsCache: {
  allPatients: Patient[];
  timestamp: number;
} = {
  allPatients: [],
  timestamp: 0,
};

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const LIMIT = 10; // Pagination limit for display
const MAX_FETCH_LIMIT = 1000; // Maximum patients to fetch in one API call

// Invalidate cache when patients are added/updated elsewhere
export function invalidatePatientsCache(): void {
  patientsCache.allPatients = [];
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
  hasPrevious: boolean;
  page: number;
  totalPages: number;
  loadPatients: (reset?: boolean, skipLoadingSpinner?: boolean) => Promise<void>;
  handleNextPage: () => void;
  handlePreviousPage: () => void;
  handleDelete: (id: string) => Promise<void>;
  handlePatientCreated: (newPatient?: Patient) => void;
}

export function usePatients({ debouncedSearchTerm, statusFilter, advancedFilters }: UsePatientsParams): UsePatientsReturn {
  // Store ALL patients (unfiltered)
  const [allPatients, setAllPatients] = useState<Patient[]>(patientsCache.allPatients);
  // Store filtered and paginated patients (what's displayed)
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(patientsCache.allPatients.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const hasInitialized = useRef(false);
  const isLoadingRef = useRef(false);

  // Load ALL patients from API (no filters, no search)
  const loadAllPatients = useCallback(async (skipLoadingSpinner = false) => {
    // Prevent concurrent calls
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      
      if (!skipLoadingSpinner) {
        setLoading(true);
      }

      // Load all patients in batches if needed
      let allLoadedPatients: Patient[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      let totalCount = 0;

      while (hasMorePages && allLoadedPatients.length < MAX_FETCH_LIMIT) {
        const params: any = {
          page: currentPage,
          limit: 100, // Fetch 100 at a time to get all patients efficiently
        };

        const response = await crmPatientService.getPatients(params);
        const pagePatients = response.data || [];
        totalCount = response.total || 0;
        
        allLoadedPatients = [...allLoadedPatients, ...pagePatients];
        
        // Check if there are more pages
        hasMorePages = (currentPage * 100) < totalCount && allLoadedPatients.length < MAX_FETCH_LIMIT;
        currentPage++;
      }

      // Update allPatients state and cache
      setAllPatients(allLoadedPatients);
      patientsCache.allPatients = allLoadedPatients;
      patientsCache.timestamp = Date.now();
      
    } catch (error) {
      toast.error('Failed to load patients');
      console.error('Load patients error:', error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Client-side filtering function
  const filterPatients = useCallback((patientsToFilter: Patient[]): Patient[] => {
    let filtered = [...patientsToFilter];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Search filter (name, email, phone)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchLower) ||
        p.email?.toLowerCase().includes(searchLower) ||
        p.phone?.includes(debouncedSearchTerm)
      );
    }

    // Age range filter
    if (advancedFilters.ageRange.min) {
      const minAge = parseInt(advancedFilters.ageRange.min);
      if (!isNaN(minAge)) {
        filtered = filtered.filter(p => p.age >= minAge);
      }
    }
    if (advancedFilters.ageRange.max) {
      const maxAge = parseInt(advancedFilters.ageRange.max);
      if (!isNaN(maxAge)) {
        filtered = filtered.filter(p => p.age <= maxAge);
      }
    }

    // Assigned doctor filter
    if (advancedFilters.assignedDoctor) {
      filtered = filtered.filter(p => p.assignedDoctor === advancedFilters.assignedDoctor);
    }

    // Date range filter (lastVisit)
    if (advancedFilters.dateRange.start) {
      const startDate = new Date(advancedFilters.dateRange.start);
      filtered = filtered.filter(p => {
        if (!p.lastVisit) return false;
        const lastVisitDate = new Date(p.lastVisit);
        return lastVisitDate >= startDate;
      });
    }
    if (advancedFilters.dateRange.end) {
      const endDate = new Date(advancedFilters.dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include entire end date
      filtered = filtered.filter(p => {
        if (!p.lastVisit) return false;
        const lastVisitDate = new Date(p.lastVisit);
        return lastVisitDate <= endDate;
      });
    }

    return filtered;
  }, [debouncedSearchTerm, statusFilter, advancedFilters]);

  // Load all patients on initial mount or when cache is invalid
  useEffect(() => {
    const cacheAge = Date.now() - patientsCache.timestamp;
    const isCacheValid = patientsCache.allPatients.length > 0 && cacheAge < CACHE_DURATION;
    
    const isInitialLoad = !hasInitialized.current;
    
    if (isCacheValid && isInitialLoad) {
      // Use cached data
      setAllPatients(patientsCache.allPatients);
      hasInitialized.current = true;
      // Refresh in background to get latest data
      if (!isLoadingRef.current) {
        loadAllPatients(true);
      }
    } else if (!isCacheValid) {
      // Cache invalid or empty - load all patients
      hasInitialized.current = true;
      loadAllPatients(!isInitialLoad);
    } else {
      hasInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply client-side filtering and pagination when filters or allPatients change
  useEffect(() => {
    // Filter all patients client-side
    const filtered = filterPatients(allPatients);
    const totalFiltered = filtered.length;
    
    // Calculate pagination
    const calculatedTotalPages = Math.ceil(totalFiltered / LIMIT);
    const startIndex = (page - 1) * LIMIT;
    const endIndex = startIndex + LIMIT;
    const paginatedPatients = filtered.slice(startIndex, endIndex);
    
    setPatients(paginatedPatients);
    setTotal(totalFiltered);
    setTotalPages(calculatedTotalPages);
    setHasMore(page < calculatedTotalPages);
    setHasPrevious(page > 1);
    
    // Reset to page 1 if filters changed (but not if it's just page change)
    if (page > calculatedTotalPages && calculatedTotalPages > 0) {
      setPage(1);
    }
  }, [allPatients, filterPatients, page]);

  // Scroll to top when page changes
  useEffect(() => {
    if (hasInitialized.current) {
      // Scroll to top smoothly when page changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  const handleNextPage = useCallback(() => {
    setPage(prev => {
      const filtered = filterPatients(allPatients);
      const totalFiltered = filtered.length;
      const calculatedTotalPages = Math.ceil(totalFiltered / LIMIT);
      return prev < calculatedTotalPages ? prev + 1 : prev;
    });
  }, [allPatients, filterPatients]);

  const handlePreviousPage = useCallback(() => {
    setPage(prev => prev > 1 ? prev - 1 : 1);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) {
      return;
    }

    try {
      // Optimistic update: Remove from allPatients immediately
      setAllPatients(prevAllPatients => prevAllPatients.filter(p => p.id !== id));
      
      // Update cache
      patientsCache.allPatients = patientsCache.allPatients.filter(p => p.id !== id);
      patientsCache.timestamp = Date.now();
      
      // Delete in background
      await crmPatientService.deletePatient(id);
      toast.success('Patient deleted successfully');
      
      // Optionally refresh in background to ensure sync (non-blocking)
      loadAllPatients(true).catch(() => {
        // Silent fail - we already updated optimistically
      });
    } catch (error) {
      // Revert optimistic update on error
      loadAllPatients(true);
      toast.error('Failed to delete patient');
    }
  }, [loadAllPatients]);

  const handlePatientCreated = useCallback((newPatient?: Patient) => {
    if (newPatient) {
      // Optimistic update: Add/update patient in allPatients immediately
      setAllPatients(prevAllPatients => {
        const existingIndex = prevAllPatients.findIndex(p => p.id === newPatient.id);
        const isNew = existingIndex < 0;
        
        if (isNew) {
          // Add new patient at the beginning
          return [newPatient, ...prevAllPatients];
        } else {
          // Update existing patient
          const updated = [...prevAllPatients];
          updated[existingIndex] = newPatient;
          return updated;
        }
      });
      
      // Update cache with the new/updated patient data
      // No need to refetch - we already have the latest data from the API response
      const existingCacheIndex = patientsCache.allPatients.findIndex(p => p.id === newPatient.id);
      if (existingCacheIndex >= 0) {
        // Update existing patient in cache
        patientsCache.allPatients[existingCacheIndex] = newPatient;
      } else {
        // Add new patient to cache at the beginning
        patientsCache.allPatients = [newPatient, ...patientsCache.allPatients];
      }
      patientsCache.timestamp = Date.now();
      
      // No need to call loadAllPatients - we already have the updated data from the API response
      // The optimistic update is sufficient and more efficient
    } else {
      // Fallback: Only reload if no patient data provided (shouldn't happen in normal flow)
      // This is a safety fallback in case onSuccess is called without patient data
      loadAllPatients(true);
    }
  }, [loadAllPatients]);

  // Reset page to 1 when filters change (but not on initial mount)
  useEffect(() => {
    if (hasInitialized.current) {
      setPage(1);
    }
  }, [debouncedSearchTerm, statusFilter, advancedFilters]);

  // Wrapper for loadPatients to match expected signature
  const loadPatients = useCallback(async (reset?: boolean, skipLoadingSpinner?: boolean) => {
    await loadAllPatients(skipLoadingSpinner);
  }, [loadAllPatients]);

  return {
    patients,
    loading,
    loadingMore: false, // Client-side pagination is instant, no loading state needed
    total,
    hasMore,
    hasPrevious,
    page,
    totalPages,
    loadPatients,
    handleNextPage,
    handlePreviousPage,
    handleDelete,
    handlePatientCreated,
  };
}
