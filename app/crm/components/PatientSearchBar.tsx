'use client';

import { Search, Plus } from 'lucide-react';

interface PatientSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}

export default function PatientSearchBar({ searchTerm, onSearchChange, onAddClick }: PatientSearchBarProps) {
  return (
    <div className="flex flex-col gap-2 md:gap-3">
      {/* Search Bar - Full Width */}
      <div className="relative">
        <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search patients..."
          className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 bg-white dark:bg-gray-700 rounded-lg md:rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
        />
      </div>
      {/* Action Buttons - Add Patient */}
      <div className="flex gap-2 md:gap-2.5">
        <button
          onClick={onAddClick}
          className="flex-1 bg-primary text-white py-2.5 px-4 md:py-3 md:px-6 rounded-lg md:rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2 shadow-md hover:shadow-lg text-sm md:text-base"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="truncate">Add Patient</span>
        </button>
      </div>
    </div>
  );
}
