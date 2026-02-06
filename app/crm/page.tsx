'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { Patient } from '@/types';
import { useDebounce } from './hooks/useDebounce';
import { usePatients } from './hooks/usePatients';
import { useScrollFooter } from './hooks/useScrollFooter';
import PatientSearchBar from './components/PatientSearchBar';
import PatientStatusFilters from './components/PatientStatusFilters';
import PatientList from './components/PatientList';
import EmptyState from './components/EmptyState';
import type { FilterOptions } from '@/components/modals/FilterModal';

// Lazy load modals for better performance
const CRMPatientModal = dynamic(() => import('@/components/modals/CRMPatientModal'), {
  loading: () => null,
  ssr: false
});

const PatientDetailsModal = dynamic(() => import('@/components/modals/PatientDetailsModal'), {
  loading: () => null,
  ssr: false
});

const FilterModal = dynamic(() => import('@/components/modals/FilterModal').then(mod => ({ default: mod.default })), {
  loading: () => null,
  ssr: false
});

const BulkUploadModal = dynamic(() => import('@/components/modals/BulkUploadModal'), {
  loading: () => null,
  ssr: false
});

export default function CRMPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({
    status: 'all',
    dateRange: { start: '', end: '' },
    nextAppointmentDateRange: { start: '', end: '' },
    assignedDoctor: '',
  });
  
  // Reset status filter to 'all' when user starts searching (search is independent of filters)
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      // User is typing in search - automatically reset status filter to 'all'
      if (statusFilter !== 'all') {
        setStatusFilter('all');
      }
      // Also reset status in advancedFilters to keep them in sync
      if (advancedFilters.status !== 'all') {
        setAdvancedFilters(prev => ({
          ...prev,
          status: 'all',
        }));
      }
    }
  }, [searchTerm, statusFilter, advancedFilters.status]);
  
  const {
    patients,
    loading,
    loadingMore,
    total,
    hasMore,
    hasPrevious,
    page,
    totalPages,
    patientIdsWithActiveAppointments,
    handleNextPage,
    handlePreviousPage,
    handleDelete,
    handlePatientCreated,
  } = usePatients({
    debouncedSearchTerm,
    statusFilter,
    advancedFilters,
  });

  // Handle scroll visibility for footer (now listens to window scroll)
  useScrollFooter(null);

  const handleFilterApply = (filters: FilterOptions) => {
    setAdvancedFilters(filters);
    setStatusFilter(filters.status);
  };

  const getStatusColor = (status: string) => {
    // Normalize status to standardized format for comparison
    const normalized = status.toLowerCase();
    
    // Check inactive FIRST (before active) because "inactive" contains "active" as substring
    if (normalized === 'inactive') {
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
    if (normalized === 'active') {
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    }
    if (normalized === 'booked') {
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    }
    if (normalized === 'follow-up' || normalized === 'followup') {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    }
    // Also check for capitalized 'FollowUp' (in case it comes from API directly)
    if (status === 'FollowUp' || status === 'Follow-up') {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    }
    // Fallback for includes checks (only if exact match didn't work)
    if (normalized.includes('inactive')) {
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
    if (normalized.includes('active')) {
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    }
    if (normalized.includes('booked')) {
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    }
    if (normalized.includes('follow')) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAdvancedFilters({
      status: 'all',
      dateRange: { start: '', end: '' },
      nextAppointmentDateRange: { start: '', end: '' },
      assignedDoctor: '',
    });
  };

  const handleAddPatient = () => {
    setSelectedPatient(null);
    setShowAddModal(true);
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const handleEditPatient = async (patient: Patient) => {
    // Fetch full patient details to ensure all fields (including dateOfBirth) are available
    try {
      const { crmPatientService } = await import('@/lib/services/crmPatientService');
      const response = await crmPatientService.getPatient(patient.id);
      if (response.data) {
        setSelectedPatient(response.data);
      } else {
        setSelectedPatient(patient); // Fallback to list patient data
      }
    } catch (error) {
      console.error('Error fetching full patient details:', error);
      setSelectedPatient(patient); // Fallback to list patient data
    }
    setShowAddModal(true);
  };

  const handlePatientCreatedWithModal = (newPatient?: Patient) => {
    setShowAddModal(false);
    setSelectedPatient(null);
    handlePatientCreated(newPatient);
  };

  // Only show empty state when not loading and no patients
  const isEmpty = !loading && patients.length === 0;
  const hasActiveFilters = !!(
    searchTerm || 
    statusFilter !== 'all' || 
    advancedFilters.dateRange.start || 
    advancedFilters.dateRange.end ||
    advancedFilters.nextAppointmentDateRange.start || 
    advancedFilters.nextAppointmentDateRange.end ||
    advancedFilters.assignedDoctor
  );
  const isSearchResult = isEmpty && hasActiveFilters;

  return (
    <PrivateRoute>
      <Layout>
        <div className="pb-16 md:pb-0">
          {/* Sticky Header Section - Search, Filters, and Actions */}
          <div className="sticky top-0 z-10 space-y-4 md:space-y-6 pb-4 md:pb-6 bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Patients</h2>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-0.5 md:mt-1">{total} patients</p>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div>
              <PatientSearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onAddClick={handleAddPatient}
                onFilterClick={() => setShowFilterModal(true)}
                onBulkUploadClick={() => setShowBulkUploadModal(true)}
              />
            </div>

            {/* Status Filter Pills */}
            <div>
              <PatientStatusFilters
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
              />
            </div>
          </div>

          {/* Patient List - Scrolls naturally with page */}
          <div className="pr-1">
            {/* Loading State - Only on initial load when no data exists */}
            {loading && patients.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : isEmpty ? (
              <EmptyState
                isSearchResult={isSearchResult}
                onClearFilters={handleClearFilters}
                onAddPatient={handleAddPatient}
              />
            ) : (
              <PatientList
                patients={patients}
                loadingMore={loadingMore}
                hasMore={hasMore}
                hasPrevious={hasPrevious}
                page={page}
                totalPages={totalPages}
                onCardClick={handleViewPatient}
                onNextPage={handleNextPage}
                onPreviousPage={handlePreviousPage}
                getStatusColor={getStatusColor}
                patientIdsWithActiveAppointments={patientIdsWithActiveAppointments}
              />
            )}
          </div>

          {/* Modals */}
          {showAddModal && (
            <CRMPatientModal
              patient={selectedPatient}
              onClose={() => {
                // If we were editing (selectedPatient exists), go back to details modal
                if (selectedPatient) {
                  setShowAddModal(false);
                  setShowDetailsModal(true);
                } else {
                  // If adding new, close completely
                  setShowAddModal(false);
                  setSelectedPatient(null);
                }
              }}
              onSuccess={(updatedPatient) => {
                // If we were editing (selectedPatient exists), update and go back to details modal
                if (selectedPatient && updatedPatient) {
                  setSelectedPatient(updatedPatient);
                  setShowAddModal(false);
                  setShowDetailsModal(true);
                  handlePatientCreatedWithModal(updatedPatient);
                } else {
                  // If adding new, close and refresh
                  handlePatientCreatedWithModal(updatedPatient);
                  setShowAddModal(false);
                  setSelectedPatient(null);
                }
              }}
            />
          )}

          {showDetailsModal && selectedPatient && (
            <PatientDetailsModal
              patient={selectedPatient}
              onClose={() => {
                setShowDetailsModal(false);
                setSelectedPatient(null);
              }}
              onEdit={() => {
                // Close details modal but preserve selectedPatient for edit modal
                setShowDetailsModal(false);
                // Open edit modal with the same patient (don't clear selectedPatient)
                setShowAddModal(true);
              }}
              onDelete={(id) => {
                handleDelete(id);
                setShowDetailsModal(false);
                setSelectedPatient(null);
              }}
            />
          )}

          {showFilterModal && (
            <FilterModal
              onClose={() => setShowFilterModal(false)}
              onApply={handleFilterApply}
              currentFilters={advancedFilters}
            />
          )}

          {showBulkUploadModal && (
            <BulkUploadModal
              onClose={() => setShowBulkUploadModal(false)}
              onSuccess={() => {
                // Refresh patient list after successful bulk upload
                handlePatientCreated();
                setShowBulkUploadModal(false);
              }}
            />
          )}
        </div>
      </Layout>
    </PrivateRoute>
  );
}
