'use client';

import { useState, useRef } from 'react';
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
  
  const listContainerRef = useRef<HTMLDivElement>(null);
  
  // Use custom hooks
  const {
    patients,
    loading,
    loadingMore,
    total,
    hasMore,
    handleLoadMore,
    handleDelete,
    handlePatientCreated,
  } = usePatients({
    debouncedSearchTerm,
    statusFilter,
    advancedFilters,
  });

  // Handle scroll visibility for footer
  useScrollFooter(listContainerRef);

  const handleFilterApply = (filters: FilterOptions) => {
    setAdvancedFilters(filters);
    setStatusFilter(filters.status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'booked':
        return 'bg-blue-100 text-blue-700';
      case 'follow-up':
        return 'bg-yellow-100 text-yellow-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
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

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
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
        <div className="flex flex-col h-full min-h-0 pb-16 md:pb-0">
          {/* Fixed Header Section - Search, Filters, and Actions */}
          <div className="flex-shrink-0 space-y-4 md:space-y-6 pb-4 md:pb-6 bg-gray-50 dark:bg-gray-900/50">
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

          {/* Scrollable Patient List Container - Only this section scrolls */}
          <div 
            ref={listContainerRef}
            className="flex-1 overflow-y-auto min-h-0 pr-1"
            style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
          >
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
                onView={handleViewPatient}
                onEdit={handleEditPatient}
                onDelete={handleDelete}
                onLoadMore={handleLoadMore}
                getStatusColor={getStatusColor}
              />
            )}
          </div>

          {/* Modals */}
          {showAddModal && (
            <CRMPatientModal
              patient={selectedPatient}
              onClose={() => {
                setShowAddModal(false);
                setSelectedPatient(null);
              }}
              onSuccess={handlePatientCreatedWithModal}
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
                setShowDetailsModal(false);
                setShowAddModal(true);
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
