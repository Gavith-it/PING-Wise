'use client';

/**
 * Toggle Switch Component
 * 
 * A modern, accessible toggle switch component
 */

import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
  label,
  size = 'md',
  className = '',
}: ToggleSwitchProps) {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!enabled);
    }
  };

  const sizeClasses = {
    sm: {
      track: 'w-9 h-5',
      thumb: 'w-4 h-4',
      translate: 'translate-x-4',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label || 'Toggle'}
      onClick={handleToggle}
      disabled={disabled}
      className={`
        relative inline-flex items-center focus:outline-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <span
        className={`
          ${currentSize.track}
          relative inline-flex flex-shrink-0 rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out
          ${enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}
          ${disabled ? 'opacity-50' : ''}
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        <span
          className={`
            ${currentSize.thumb}
            pointer-events-none inline-block rounded-full bg-white shadow-lg
            transform ring-0 transition duration-200 ease-in-out
            ${enabled ? currentSize.translate : 'translate-x-0'}
          `}
        />
      </span>
    </button>
  );
}
