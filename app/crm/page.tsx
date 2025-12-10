'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, MoreVertical, Eye, Edit, Trash2, Filter, Upload, Users } from 'lucide-react';
import { patientService } from '@/lib/services/api';
import toast from 'react-hot-toast';
import PatientModal from '@/components/modals/PatientModal';
import PatientDetailsModal from '@/components/modals/PatientDetailsModal';
import BulkUploadModal from '@/components/modals/BulkUploadModal';
import FilterModal, { FilterOptions } from '@/components/modals/FilterModal';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import BottomNav from '@/components/BottomNav';
import { Patient } from '@/types';

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

export default function CRMPage() {
  const [patients, setPatients] = useState<Patient[]>(patientsCache.patients);
  const [loading, setLoading] = useState(patientsCache.patients.length === 0); // Only show loading if no cached data
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(patientsCache.total);
  const [hasMore, setHasMore] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({
    status: 'all',
    dateRange: { start: '', end: '' },
    assignedDoctor: '',
    ageRange: { min: '', max: '' },
  });
  const limit = 10;
  const menuRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create filter key to check cache
    const filterKey = JSON.stringify({ searchTerm, statusFilter, advancedFilters });
    const cacheAge = Date.now() - patientsCache.timestamp;
    const isCacheValid = patientsCache.patients.length > 0 && 
                        patientsCache.filters === filterKey && 
                        cacheAge < CACHE_DURATION;
    
    // Only show loading on initial load, not on filter changes
    const isInitialLoad = patients.length === 0 && loading;
    
    if (isCacheValid && isInitialLoad) {
      // Use cached data immediately
      setPatients(patientsCache.patients);
      setTotal(patientsCache.total);
      setLoading(false);
      setIsFiltering(false);
      // Refresh in background
      loadPatients(true, true);
    } else if (isCacheValid && patientsCache.filters === filterKey) {
      // Same filters, cache is valid - use it immediately
      setPatients(patientsCache.patients);
      setTotal(patientsCache.total);
      setLoading(false);
      setIsFiltering(false);
    } else {
      // Filters changed or cache invalid - keep current data visible, fetch in background
      setPage(1);
      setIsFiltering(false); // Don't show filtering state - keep UI smooth
      // Don't clear patients - keep showing current data while fetching
      // Don't show loading spinner on filter changes
      loadPatients(true, true); // Always skip loading spinner on filter changes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, advancedFilters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Close menus if clicking outside
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPatients = async (reset = false, skipLoadingSpinner = false) => {
    try {
      // Only show loading spinner on initial load (when no data exists)
      if (reset && !skipLoadingSpinner && patients.length === 0) {
        setLoading(true);
        setPage(1);
      } else if (reset && skipLoadingSpinner) {
        // Filter change - don't show loading spinner or filtering state
        // Keep current patients visible while fetching
        setPage(1);
        setIsFiltering(false); // Ensure no filtering state
      } else if (!reset) {
        // Loading more - show loading more indicator
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const params: any = {
        page: currentPage,
        limit,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(advancedFilters.dateRange.start && { dateStart: advancedFilters.dateRange.start }),
        ...(advancedFilters.dateRange.end && { dateEnd: advancedFilters.dateRange.end }),
        ...(advancedFilters.ageRange.min && { ageMin: advancedFilters.ageRange.min }),
        ...(advancedFilters.ageRange.max && { ageMax: advancedFilters.ageRange.max }),
        ...(advancedFilters.assignedDoctor && { doctor: advancedFilters.assignedDoctor }),
      };

      const response = await patientService.getPatients(params);
      const newPatients = response.data || [];
      const newTotal = response.total || 0;
      
      if (reset) {
        // Update patients immediately - smooth transition
        setPatients(newPatients);
        // Update cache
        const filterKey = JSON.stringify({ searchTerm, statusFilter, advancedFilters });
        patientsCache.patients = newPatients;
        patientsCache.total = newTotal;
        patientsCache.filters = filterKey;
        patientsCache.timestamp = Date.now();
      } else {
        // Append for pagination
        setPatients([...patients, ...newPatients]);
      }
      
      setTotal(newTotal);
      setHasMore((currentPage * limit) < newTotal);
      if (!reset) {
        setPage(currentPage + 1);
      }
    } catch (error) {
      toast.error('Failed to load patients');
      console.error('Load patients error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsFiltering(false);
    }
  };

  const handleLoadMore = () => {
    loadPatients(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) {
      return;
    }

    try {
      await patientService.deletePatient(id);
      toast.success('Patient deleted successfully');
      loadPatients(true);
    } catch (error) {
      toast.error('Failed to delete patient');
    }
  };

  const handlePatientCreated = () => {
    setShowAddModal(false);
    setSelectedPatient(null);
    loadPatients(true);
  };

  const handleBulkUploadSuccess = () => {
    setShowBulkUploadModal(false);
    loadPatients(true);
  };

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

  // Only show empty state when not loading and no patients
  // During filter changes, we keep showing current patients until new data arrives
  const isEmpty = !loading && patients.length === 0 && !isFiltering;
  const isSearchResult = isEmpty && (searchTerm || statusFilter !== 'all' || 
    advancedFilters.dateRange.start || advancedFilters.dateRange.end ||
    advancedFilters.ageRange.min || advancedFilters.ageRange.max ||
    advancedFilters.assignedDoctor);

  return (
    <PrivateRoute>
      <Layout>
        <div className="flex flex-col h-full min-h-0">
          {/* Fixed Header Section - Search, Filters, and Actions */}
          <div className="flex-shrink-0 space-y-4 md:space-y-6 pb-4 md:pb-6 bg-gray-50">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Patients</h2>
                  <p className="text-sm md:text-base text-gray-600 mt-0.5 md:mt-1">{total} patients</p>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div>
              <div className="flex flex-col gap-2 md:gap-3">
                {/* Search Bar - Full Width */}
                <div className="relative">
                  <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search patients..."
                    className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 bg-white rounded-lg md:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
                  />
                </div>
                {/* Action Buttons - Add Patient (left) and Upload (right) */}
                <div className="flex gap-2 md:gap-2.5">
                  <button
                    onClick={() => {
                      setSelectedPatient(null);
                      setShowAddModal(true);
                    }}
                    className="flex-1 bg-primary text-white py-2.5 px-4 md:py-3 md:px-6 rounded-lg md:rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2 shadow-md hover:shadow-lg text-sm md:text-base"
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                    <span className="truncate">Add Patient</span>
                  </button>
                  <button
                    onClick={() => setShowBulkUploadModal(true)}
                    className="bg-white text-gray-700 py-2 px-3 md:py-2.5 md:px-4 rounded-lg md:rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1.5 border border-gray-200 shadow-sm hover:shadow-md text-xs md:text-sm"
                  >
                    <Upload className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="truncate">Upload</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Status Filter Pills with Filter Button */}
            <div>
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                {/* Status Filter Pills */}
                {['all', 'active', 'booked', 'follow-up', 'inactive'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                      statusFilter === status
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-green-50 hover:border-primary'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
                      status === 'all' ? 'bg-current' :
                      status === 'active' ? 'bg-green-500' :
                      status === 'booked' ? 'bg-blue-500' :
                      status === 'follow-up' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></span>
                    <span className="capitalize">{status === 'all' ? 'All' : status.replace('-', ' ')}</span>
                  </button>
                ))}
                {/* Filter Button - Icon Only - Moved to Last */}
                <button
                  onClick={() => setShowFilterModal(true)}
                  className="bg-white text-gray-700 px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center border border-gray-200 shadow-sm hover:shadow-md"
                >
                  <Filter className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
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
            /* Empty State or No Search Results */
            <div className="bg-white rounded-2xl p-8 md:p-12 text-center">
              {isSearchResult ? (
                <>
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                    No matches found for your search.
                  </h3>
                  <p className="text-sm md:text-base text-gray-500 mb-6">
                    Try adjusting your search terms or filters.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setAdvancedFilters({
                        status: 'all',
                        dateRange: { start: '', end: '' },
                        assignedDoctor: '',
                        ageRange: { min: '', max: '' },
                      });
                    }}
                    className="bg-primary text-white px-6 py-2 rounded-xl font-medium hover:bg-primary-dark transition-colors"
                  >
                    Clear Filters
                  </button>
                </>
              ) : (
                <>
                  <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                    No customers yet.
                  </h3>
                  <p className="text-sm md:text-base text-gray-500 mb-6">
                    Add new customers to start managing your network.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedPatient(null);
                      setShowAddModal(true);
                    }}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add New Customer</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Patient List */}
              <div className="space-y-3 pb-4">
                {patients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onView={() => {
                      setSelectedPatient(patient);
                      setShowDetailsModal(true);
                    }}
                    onEdit={() => {
                      setSelectedPatient(patient);
                      setShowAddModal(true);
                    }}
                    onDelete={() => handleDelete(patient.id)}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-4 pb-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center space-x-2"
                  >
                    {loadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <span>Load More Patients</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Footer - Scrolls with content */}
              <div className="md:hidden mt-4">
                <BottomNav />
              </div>
            </>
          )}
          </div>

          {/* Modals */}
          {showAddModal && (
            <PatientModal
              patient={selectedPatient}
              onClose={() => {
                setShowAddModal(false);
                setSelectedPatient(null);
              }}
              onSuccess={handlePatientCreated}
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

          {showBulkUploadModal && (
            <BulkUploadModal
              onClose={() => setShowBulkUploadModal(false)}
              onSuccess={handleBulkUploadSuccess}
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

function PatientCard({ patient, onView, onEdit, onDelete, getStatusColor }: {
  patient: Patient;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getStatusColor: (status: string) => string;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Generate initials if not present
  const getInitials = (name?: string) => {
    if (!name) return 'P';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Generate avatar color if not present or invalid
  const getAvatarColor = () => {
    // Valid Tailwind color classes
    const validColors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500',
      'bg-orange-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
      'bg-cyan-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500',
      'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500', 'bg-amber-500'
    ];
    
    // Check if patient has a valid color
    if (patient.avatarColor && validColors.includes(patient.avatarColor)) {
      return patient.avatarColor;
    }
    
    // Generate consistent color based on name
    if (patient.name) {
      const nameHash = patient.name.charCodeAt(0);
      return validColors[nameHash % validColors.length];
    }
    
    // Default color
    return 'bg-blue-500';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = patient.initials || getInitials(patient.name);
  const avatarColor = getAvatarColor();
  
  // Ensure initials are never empty
  const displayInitials = initials && initials.trim() ? initials : getInitials(patient.name || 'Patient');

  return (
    <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 md:space-x-4 flex-1 min-w-0">
          <div 
            className={`w-10 h-10 md:w-12 md:h-12 ${avatarColor} rounded-full flex items-center justify-center text-white text-sm md:text-base font-semibold flex-shrink-0 shadow-sm`}
            style={{ minWidth: '2.5rem', minHeight: '2.5rem' }}
          >
            <span className="select-none">{displayInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5 md:space-x-2 mb-1 flex-wrap">
              <p className="font-semibold text-sm md:text-base text-gray-900 truncate">{patient.name}</p>
              <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2.5 py-0.5 rounded-full border ${getStatusColor(patient.status)} flex-shrink-0`}>
                {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1 truncate">{patient.age} years • {patient.phone}</p>
            <p className="text-[10px] md:text-xs text-gray-500 truncate">{patient.email}</p>
            <div className="flex items-center space-x-2 md:space-x-4 mt-1.5 md:mt-2 text-[10px] md:text-xs text-gray-500 flex-wrap">
              <span>Last: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}</span>
              <span>Next: {patient.nextAppointment ? new Date(patient.nextAppointment).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px] py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center space-x-2"
              >
                <Eye className="w-4 h-4 flex-shrink-0" />
                <span>View</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 flex items-center space-x-2"
              >
                <Edit className="w-4 h-4 flex-shrink-0" />
                <span>Edit</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center space-x-2 border-t border-gray-100"
              >
                <Trash2 className="w-4 h-4 flex-shrink-0" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
