'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface FooterVisibilityContextType {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

const FooterVisibilityContext = createContext<FooterVisibilityContextType | undefined>(undefined);

export function FooterVisibilityProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <FooterVisibilityContext.Provider value={{ isVisible, setIsVisible }}>
      {children}
    </FooterVisibilityContext.Provider>
  );
}

export function useFooterVisibility() {
  const context = useContext(FooterVisibilityContext);
  if (!context) {
    throw new Error('useFooterVisibility must be used within FooterVisibilityProvider');
  }
  return context;
}

