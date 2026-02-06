'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export const MENU_RETURN_PATH_KEY = 'pingwise_menu_return_path';
/** Set to the path we're navigating TO from the menu; Layout uses it to push a duplicate history entry so back only opens menu. */
export const MENU_DEST_KEY = 'pingwise_menu_dest';
/** Set after pushing duplicate entry; popstate handler opens menu and clears this. */
export const NEXT_BACK_OPENS_MENU_KEY = 'pingwise_next_back_opens_menu';

interface MenuContextType {
  isOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  setOpen: (open: boolean) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);

  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);

  return (
    <MenuContext.Provider value={{ isOpen, openMenu, closeMenu, setOpen }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within MenuProvider');
  }
  return context;
}
