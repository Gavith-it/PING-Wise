'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FontSizeContextType {
  fontSizePercentage: number;
  setFontSizePercentage: (percentage: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

// Font size range: 50% to 200% in 10% increments
const MIN_FONT_SIZE = 50;
const MAX_FONT_SIZE = 200;
const DEFAULT_FONT_SIZE = 100;
const STEP = 10;

export const FontSizeProvider = ({ children }: { children: ReactNode }) => {
  const [fontSizePercentage, setFontSizePercentageState] = useState<number>(DEFAULT_FONT_SIZE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage for saved font size preference
    if (typeof window !== 'undefined') {
      const savedFontSize = localStorage.getItem('fontSizePercentage');
      if (savedFontSize) {
        const percentage = parseInt(savedFontSize, 10);
        if (!isNaN(percentage) && percentage >= MIN_FONT_SIZE && percentage <= MAX_FONT_SIZE) {
          setFontSizePercentageState(percentage);
          // Apply font size: 100% = 16px (default), so we calculate based on percentage
          const fontSizeInPx = (16 * percentage) / 100;
          document.documentElement.style.fontSize = `${fontSizeInPx}px`;
        } else {
          document.documentElement.style.fontSize = `${16}px`;
        }
      } else {
        document.documentElement.style.fontSize = `${16}px`;
      }
    }
  }, []);

  const setFontSizePercentage = (percentage: number) => {
    // Clamp value between min and max
    const clampedPercentage = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, percentage));
    setFontSizePercentageState(clampedPercentage);
    
    if (typeof window !== 'undefined') {
      // Apply font size: 100% = 16px (default), so we calculate based on percentage
      const fontSizeInPx = (16 * clampedPercentage) / 100;
      document.documentElement.style.fontSize = `${fontSizeInPx}px`;
      localStorage.setItem('fontSizePercentage', clampedPercentage.toString());
    }
  };

  const increaseFontSize = () => {
    const newSize = Math.min(MAX_FONT_SIZE, fontSizePercentage + STEP);
    setFontSizePercentage(newSize);
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(MIN_FONT_SIZE, fontSizePercentage - STEP);
    setFontSizePercentage(newSize);
  };

  const resetFontSize = () => {
    setFontSizePercentage(DEFAULT_FONT_SIZE);
  };

  return (
    <FontSizeContext.Provider 
      value={{ 
        fontSizePercentage, 
        setFontSizePercentage, 
        increaseFontSize, 
        decreaseFontSize, 
        resetFontSize 
      }}
    >
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error('useFontSize must be used within FontSizeProvider');
  }
  return context;
};
