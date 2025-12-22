'use client';

import { Search, Filter } from 'lucide-react';

interface TeamSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onFilterClick: () => void;
  onAddClick: () => void;
}

export default function TeamSearchBar({
  searchQuery,
  onSearchChange,
  onFilterClick,
  onAddClick,
}: TeamSearchBarProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
        <input
          type="text"
          placeholder="Search by staff name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 md:pl-11 pr-4 py-2 md:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
        />
      </div>
      <button
        onClick={onFilterClick}
        className="flex items-center justify-center p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
      >
        <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>
      <button
        onClick={onAddClick}
        className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0 text-sm font-medium"
      >
        Add
      </button>
    </div>
  );
}
