'use client';

import { useState, useEffect } from 'react';
import CRMPatientModal from '@/components/modals/CRMPatientModal';
import PatientDetailsModal from '@/components/modals/PatientDetailsModal';
import FilterModal, { FilterOptions } from '@/components/modals/FilterModal';
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

export default function CRMPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({
    status: 'all',
    dateRange: { start: '', end: '' },
    assignedDoctor: '',
    ageRange: { min: '', max: '' },
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
    
    if (normalized === 'active' || normalized.includes('active')) {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    if (normalized === 'booked' || normalized.includes('booked')) {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    if (normalized === 'follow-up' || normalized === 'followup' || normalized.includes('follow')) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
    if (normalized === 'inactive' || normalized.includes('inactive')) {
      return 'bg-gray-100 text-gray-700 border-gray-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAdvancedFilters({
      status: 'all',
      dateRange: { start: '', end: '' },
      assignedDoctor: '',
      ageRange: { min: '', max: '' },
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
    advancedFilters.ageRange.min || 
    advancedFilters.ageRange.max ||
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
              />
            </div>

            {/* Status Filter Pills with Filter Button */}
            <div>
              <PatientStatusFilters
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                onFilterClick={() => setShowFilterModal(true)}
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
        </div>
      </Layout>
    </PrivateRoute>
  );
}
