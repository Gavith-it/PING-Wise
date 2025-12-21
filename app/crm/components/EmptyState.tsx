'use client';

import { Search, Plus, Users } from 'lucide-react';
import { FilterOptions } from '@/components/modals/FilterModal';

interface EmptyStateProps {
  isSearchResult: boolean;
  onClearFilters: () => void;
  onAddPatient: () => void;
}

export default function EmptyState({ isSearchResult, onClearFilters, onAddPatient }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 text-center">
      {isSearchResult ? (
        <>
          <Search className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1.5 md:mb-2">
            No matches found for your search.
          </h3>
          <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">
            Try adjusting your search terms or filters.
          </p>
          <button
            onClick={onClearFilters}
            className="bg-primary text-white px-4 py-2 md:px-6 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Clear Filters
          </button>
        </>
      ) : (
        <>
          <Users className="w-14 h-14 md:w-20 md:h-20 text-gray-300 mx-auto mb-3 md:mb-4" />
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1.5 md:mb-2">
            No customers yet.
          </h3>
          <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">
            Add new customers to start managing your network.
          </p>
          <button
            onClick={onAddPatient}
            className="bg-primary text-white px-4 py-2.5 md:px-6 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-medium hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span>Add New Customer</span>
          </button>
        </>
      )}
    </div>
  );
}
