'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
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
  const selectedOption = options.find(opt => getOptionValue(opt) === value);

  // Filter options based on input
  const filteredOptions = options.filter(option => {
    const label = getOptionLabel(option).toLowerCase();
    const searchTerm = inputValue.toLowerCase();
    return label.includes(searchTerm);
  });

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
          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              tabIndex={-1}
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled || loading}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            tabIndex={-1}
          >
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>
      </div>

      {isOpen && !disabled && !loading && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
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
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-gray-50 text-gray-900'
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

