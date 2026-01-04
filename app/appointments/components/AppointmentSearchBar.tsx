'use client';

import { Search, Plus, Filter } from 'lucide-react';

interface AppointmentSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'confirmed' | 'pending' | 'cancelled';
  onStatusFilterChange: (status: 'all' | 'confirmed' | 'pending' | 'cancelled') => void;
  showFilterMenu: boolean;
  onFilterMenuToggle: () => void;
  onAddClick: () => void;
  filterMenuRef: React.RefObject<HTMLDivElement>;
  isPastDate?: boolean;
}

export default function AppointmentSearchBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  showFilterMenu,
  onFilterMenuToggle,
  onAddClick,
  filterMenuRef,
  isPastDate = false,
}: AppointmentSearchBarProps) {
  return (
    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search appointments..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-[36px] md:h-[44px] pl-7 md:pl-10 pr-2 md:pr-4 bg-white dark:bg-gray-700 rounded-lg md:rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs md:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
        />
      </div>
      <div className="relative flex-shrink-0" ref={filterMenuRef}>
        <button
          onClick={onFilterMenuToggle}
          className="w-[36px] h-[36px] md:w-[44px] md:h-[44px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg md:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
          title="Filter"
        >
          <Filter className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 dark:text-gray-400" />
        </button>
        {showFilterMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
            <button
              onClick={() => {
                onStatusFilterChange('all');
                onFilterMenuToggle();
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                statusFilter === 'all' ? 'bg-primary/10 dark:bg-primary/20 text-primary font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                onStatusFilterChange('confirmed');
                onFilterMenuToggle();
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                statusFilter === 'confirmed' ? 'bg-primary/10 dark:bg-primary/20 text-primary font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => {
                onStatusFilterChange('pending');
                onFilterMenuToggle();
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                statusFilter === 'pending' ? 'bg-primary/10 dark:bg-primary/20 text-primary font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => {
                onStatusFilterChange('cancelled');
                onFilterMenuToggle();
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                statusFilter === 'cancelled' ? 'bg-primary/10 dark:bg-primary/20 text-primary font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              Cancelled
            </button>
          </div>
        )}
      </div>
      <button
        onClick={onAddClick}
        disabled={isPastDate}
        className={`px-3 md:px-6 py-1.5 md:py-2.5 rounded-lg md:rounded-xl font-medium transition-colors flex items-center justify-center shadow-md text-xs md:text-sm flex-shrink-0 h-[36px] md:h-auto whitespace-nowrap ${
          isPastDate
            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-primary text-white hover:bg-primary-dark hover:shadow-lg'
        }`}
        title={isPastDate ? 'Cannot create appointments for past dates' : 'Add new appointment'}
      >
        <span>Add</span>
      </button>
    </div>
  );
}
