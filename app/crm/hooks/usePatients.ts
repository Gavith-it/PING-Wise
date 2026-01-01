import { useState, useEffect, useRef, useCallback } from 'react';
import { crmPatientService } from '@/lib/services/crmPatientService';
import toast from 'react-hot-toast';
import { Patient } from '@/types';
import { FilterOptions } from '@/components/modals/FilterModal';
import { normalizeCustomerStatus } from '@/lib/constants/status';
import { formDataCache, preloadInProgress } from '@/components/modals/AppointmentModal';

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
      
      // Check shared cache from AppointmentModal first (prevents duplicate API calls)
      const sharedCacheAge = Date.now() - formDataCache.timestamp;
      const isSharedCacheValid = formDataCache.patients.length > 0 && sharedCacheAge < CACHE_DURATION;
      
      // If shared cache is valid and we're not waiting for a preload, use it
      if (isSharedCacheValid && !preloadInProgress) {
        // Use shared cache to avoid duplicate API call
        const sharedPatients = formDataCache.patients;
        setAllPatients(sharedPatients);
        patientsCache.allPatients = sharedPatients;
        patientsCache.timestamp = Date.now();
        
        if (!skipLoadingSpinner) {
          setLoading(false);
        }
        isLoadingRef.current = false;
        
        // If shared cache is small (only 50 patients), fetch more in background
        if (sharedPatients.length < 100) {
          // Continue fetching in background to get all patients
          // This ensures we have complete data but doesn't block the UI
        } else {
          // Shared cache has enough data, we're done
          return;
        }
      }
      
      // If preload is in progress, check cache once and proceed without blocking
      // This prevents blocking the UI while preload completes
      if (preloadInProgress) {
        // Check if shared cache is available (even if preload is still in progress)
        const sharedCacheAge = Date.now() - formDataCache.timestamp;
        const isSharedCacheAvailable = formDataCache.patients.length > 0 && sharedCacheAge < CACHE_DURATION;
        
        if (isSharedCacheAvailable) {
          // Use available cache immediately without waiting
          const sharedPatients = formDataCache.patients;
          setAllPatients(sharedPatients);
          patientsCache.allPatients = sharedPatients;
          patientsCache.timestamp = Date.now();
          
          if (!skipLoadingSpinner) {
            setLoading(false);
          }
          isLoadingRef.current = false;
          return;
        }
        // If cache not available and preload in progress, proceed with loading anyway
        // Don't block - let preload complete in background
      }
      
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
      
      // Also update shared cache for AppointmentModal
      formDataCache.patients = allLoadedPatients;
      formDataCache.timestamp = Date.now();
      
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

    // Status filter - normalize both sides for comparison
    if (statusFilter !== 'all') {
      // Normalize filter value to standardized format for comparison
      const normalizedFilter = normalizeCustomerStatus(statusFilter);
      filtered = filtered.filter(p => {
        // Normalize patient status to standardized format for comparison
        const normalizedPatientStatus = normalizeCustomerStatus(p.status);
        return normalizedPatientStatus === normalizedFilter;
      });
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
    // Find the patient to check their status
    const patient = allPatients.find(p => p.id === id);
    
    // Check if patient has appointments based on status
    // "booked" and "followup"/"follow-up" statuses indicate the patient has appointments scheduled
    // "active" and "inactive" statuses indicate no appointments
    let hasAppointments = false;
    
    if (patient) {
      const status = (patient.status || '').toLowerCase();
      // Normalize status variations
      const normalizedStatus = status === 'follow-up' || status === 'followup' ? 'followup' : status;
      
      // Statuses that indicate appointments: "booked", "followup"
      hasAppointments = normalizedStatus === 'booked' || normalizedStatus === 'followup';
      
      console.log('[Delete Patient] Status check:', {
        patientId: id,
        patientName: patient.name,
        status: patient.status,
        normalizedStatus,
        hasAppointments
      });
    } else {
      console.warn('[Delete Patient] Patient not found in list, assuming no appointments');
      hasAppointments = false;
    }

    // Show appropriate confirmation message based on patient status
    // Only show appointment warning if patient status indicates appointments
    const confirmationMessage = hasAppointments
      ? 'This patient has appointments scheduled. Are you sure you want to delete? The appointments will show as "Unknown" patient.'
      : 'Are you sure you want to delete this patient?';

    console.log('[Delete Patient] Showing confirmation:', {
      hasAppointments,
      message: confirmationMessage
    });

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    // Store the original patient list for potential revert
    const originalPatients = [...allPatients];
    const originalCache = [...patientsCache.allPatients];

    try {
      // Log the delete attempt
      console.log('[Delete Patient] ============================================');
      console.log('[Delete Patient] STARTING DELETE OPERATION');
      console.log('[Delete Patient] Patient ID:', id);
      console.log('[Delete Patient] Has Appointments:', hasAppointments);
      console.log('[Delete Patient] ============================================');
      
      // IMPORTANT: Call API FIRST and WAIT for response before updating UI
      // This ensures the API is definitely called and we have confirmation
      console.log('[Delete Patient] Step 1: Calling DELETE API...');
      console.log('[Delete Patient] Waiting for API response...');
      
      const deleteResponse = await crmPatientService.deletePatient(id);
      
      console.log('[Delete Patient] Step 2: API call completed!');
      console.log('[Delete Patient] API Response:', deleteResponse);
      console.log('[Delete Patient] API Response Success:', deleteResponse?.success);
      
      // Verify the API call was successful
      if (!deleteResponse || (deleteResponse.success === false)) {
        throw new Error('API returned unsuccessful response');
      }
      
      console.log('[Delete Patient] Step 3: API confirmed successful - updating UI...');
      
      // ONLY update UI after confirmed successful API call
      setAllPatients(prevAllPatients => {
        const filtered = prevAllPatients.filter(p => p.id !== id);
        console.log('[Delete Patient] UI updated. Remaining patients:', filtered.length);
        return filtered;
      });
      
      // Update cache
      patientsCache.allPatients = patientsCache.allPatients.filter(p => p.id !== id);
      patientsCache.timestamp = Date.now();
      
      console.log('[Delete Patient] Step 4: Patient deleted successfully from database AND UI');
      console.log('[Delete Patient] ============================================');
      toast.success('Patient deleted successfully');
      
      // Refresh in background to ensure sync (non-blocking)
      console.log('[Delete Patient] Step 5: Refreshing patient list in background...');
      loadAllPatients(true).catch((refreshError) => {
        console.warn('[Delete Patient] Background refresh failed (non-critical):', refreshError);
      });
    } catch (error: any) {
      // API call failed - DO NOT update UI
      console.error('[Delete Patient] ============================================');
      console.error('[Delete Patient] DELETE OPERATION FAILED');
      console.error('[Delete Patient] Error:', error);
      console.error('[Delete Patient] Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        url: error?.config?.url,
        method: error?.config?.method,
      });
      console.error('[Delete Patient] UI will NOT be updated - keeping original state');
      console.error('[Delete Patient] ============================================');
      
      // Restore original state (in case any partial update happened)
      setAllPatients(originalPatients);
      patientsCache.allPatients = originalCache;
      patientsCache.timestamp = Date.now();
      
      // Show detailed error message
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Failed to delete patient. The patient was NOT deleted from the database.';
      toast.error(errorMessage);
    }
  }, [allPatients, loadAllPatients]);

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
