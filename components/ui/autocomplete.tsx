'use client';

import { useState, useEffect, useRef, KeyboardEvent, useMemo, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface AutocompleteOption {
  id: string;
  label: string;
  [key: string]: any;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (option: AutocompleteOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  getOptionLabel?: (option: AutocompleteOption) => string;
  getOptionValue?: (option: AutocompleteOption) => string;
  className?: string;
  required?: boolean;
  name?: string;
}

export default function Autocomplete({
  options,
  value,
  onChange,
  onSelect,
  placeholder = 'Type to search...',
  disabled = false,
  loading = false,
  getOptionLabel = (option) => option.label,
  getOptionValue = (option) => option.id,
  className = '',
  required = false,
  name,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find selected option
  const selectedOption = useMemo(() => 
    options.find(opt => getOptionValue(opt) === value),
    [options, value, getOptionValue]
  );

  // Debounced filter - only filter when input hasn't changed for 150ms
  const [debouncedInput, setDebouncedInput] = useState(inputValue);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInput(inputValue);
    }, 150);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Filter options based on debounced input
  const filteredOptions = useMemo(() => {
    if (!debouncedInput) return options;
    const searchTerm = debouncedInput.toLowerCase();
    return options.filter(option => {
    const label = getOptionLabel(option).toLowerCase();
    return label.includes(searchTerm);
  });
  }, [options, debouncedInput, getOptionLabel]);

  // Update input value when selected option changes
  useEffect(() => {
    if (selectedOption) {
      setInputValue(getOptionLabel(selectedOption));
    } else {
      setInputValue('');
    }
  }, [selectedOption, getOptionLabel]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset input to selected option label if dropdown closes
        if (selectedOption) {
          setInputValue(getOptionLabel(selectedOption));
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption, getOptionLabel]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
    
    // If input is cleared, clear selection
    if (!newValue) {
      onChange('');
      onSelect(null);
    } else {
      // Check if the typed value exactly matches an option
      const exactMatch = options.find(opt => 
        getOptionLabel(opt).toLowerCase() === newValue.toLowerCase()
      );
      if (exactMatch) {
        const optionValue = getOptionValue(exactMatch);
        onChange(optionValue);
        onSelect(exactMatch);
      }
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSelect = (option: AutocompleteOption) => {
    const optionValue = getOptionValue(option);
    const optionLabel = getOptionLabel(option);
    onChange(optionValue);
    onSelect(option);
    setInputValue(optionLabel);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    onSelect(null);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled || loading) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input for form validation */}
      {required && name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          placeholder={loading ? 'Loading...' : placeholder}
          className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
              tabIndex={-1}
            >
              <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled || loading}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
            tabIndex={-1}
          >
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>
      </div>

      {isOpen && !disabled && !loading && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
              No options found
            </div>
          ) : (
            <ul className="py-1">
              {filteredOptions.map((option, index) => {
                const optionLabel = getOptionLabel(option);
                const isHighlighted = index === highlightedIndex;
                const isSelected = getOptionValue(option) === value;

                return (
                  <li
                    key={getOptionValue(option)}
                    onClick={() => handleSelect(option)}
                    className={`px-4 py-2 cursor-pointer transition-colors ${
                      isHighlighted || isSelected
                        ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {optionLabel}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

