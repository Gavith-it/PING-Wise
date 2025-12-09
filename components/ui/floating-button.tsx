'use client';

import { ReactNode, useRef, useState, useEffect, Children, cloneElement, isValidElement } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnClickOutside } from 'usehooks-ts';

type FloatingButtonProps = {
  className?: string;
  children: ReactNode;
  triggerContent: ReactNode;
  draggable?: boolean;
  storageKey?: string;
};

type FloatingButtonItemProps = {
  children: ReactNode;
};

const list = {
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      staggerDirection: -1
    }
  },
  hidden: {
    opacity: 0,
    transition: {
      when: 'afterChildren',
      staggerChildren: 0.1
    }
  }
};

const item = {
  visible: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: 5 }
};

const btn = {
  visible: { rotate: '45deg' },
  hidden: { rotate: 0 }
};

function FloatingButton({ className, children, triggerContent, draggable = true, storageKey = 'floating-button-position' }: FloatingButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

  const [isInitialized, setIsInitialized] = useState(false);

  // Calculate default position based on viewport
  const calculateDefaultPosition = () => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    
    const buttonWidth = 48; // Approximate button width
    const buttonHeight = 48; // Approximate button height
    const isMobile = window.innerWidth < 768;
    
    // On mobile, account for bottom navigation (usually ~60-80px)
    // Use bottom-14 (56px) on mobile, bottom-6 (24px) on desktop
    const bottomOffset = isMobile ? 80 : 24; // Extra space for bottom nav on mobile
    const rightOffset = isMobile ? 16 : 24;
    
    const defaultX = window.innerWidth - buttonWidth - rightOffset;
    const defaultY = window.innerHeight - buttonHeight - bottomOffset;
    
    return { x: defaultX, y: defaultY };
  };

  // Load saved position from localStorage or calculate default
  useEffect(() => {
    if (typeof window !== 'undefined' && draggable && !isInitialized) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.x !== undefined && parsed.y !== undefined && parsed.x > 0 && parsed.y > 0) {
            // Validate saved position is still within viewport
            const buttonWidth = 48;
            const buttonHeight = 48;
            if (parsed.x < window.innerWidth - buttonWidth && parsed.y < window.innerHeight - buttonHeight) {
              setPosition(parsed);
              setIsInitialized(true);
              return;
            }
          }
        } catch (e) {
          // Invalid saved data, use default
        }
      }
      
      // Calculate and set default position
      const defaultPos = calculateDefaultPosition();
      setPosition(defaultPos);
      setIsInitialized(true);
    }
  }, [storageKey, draggable, isInitialized]);

  // Handle window resize to recalculate position if needed
  useEffect(() => {
    if (typeof window === 'undefined' || !draggable || !isInitialized) return;

    const handleResize = () => {
      // If position is off-screen after resize, reset to default
      const buttonWidth = 48;
      const buttonHeight = 48;
      const maxX = window.innerWidth - buttonWidth;
      const maxY = window.innerHeight - buttonHeight;
      
      if (position.x > maxX || position.y > maxY || position.x < 0 || position.y < 0) {
        const defaultPos = calculateDefaultPosition();
        setPosition(defaultPos);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draggable, isInitialized, position]);

  // Save position to localStorage (only after user drags)
  useEffect(() => {
    if (typeof window !== 'undefined' && draggable && isInitialized && !isDragging) {
      // Only save if position has been set (not default 0,0)
      if (position.x > 0 && position.y > 0) {
        localStorage.setItem(storageKey, JSON.stringify(position));
      }
    }
  }, [position, storageKey, draggable, isInitialized, isDragging]);

  useOnClickOutside(ref, () => setIsOpen(false));

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable) return;
    // Don't start drag if clicking on a child button
    const target = e.target as HTMLElement;
    if (target.closest('button') && target.closest('button') !== e.currentTarget.querySelector('button:first-child')) {
      return;
    }
    
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Stop event bubbling
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (position.x || 0),
      y: e.clientY - (position.y || 0)
    });
    setInitialPosition(position);
  };



  // Add global mouse event listeners and prevent scrolling
  useEffect(() => {
    if (!isDragging) {
      // Re-enable scrolling when not dragging
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      return;
    }
    
    // Prevent scrolling while dragging
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    
    const moveHandler = (e: MouseEvent) => {
      if (!draggable) return;
      
      e.preventDefault(); // Prevent default behavior
      e.stopPropagation(); // Stop event bubbling
      
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Constrain to viewport bounds
      const buttonWidth = ref.current?.offsetWidth || 48;
      const buttonHeight = ref.current?.offsetHeight || 48;
      const maxX = window.innerWidth - buttonWidth;
      const maxY = window.innerHeight - buttonHeight;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };
    
    const upHandler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };
    
    // Use capture phase to catch events early
    document.addEventListener('mousemove', moveHandler, { passive: false, capture: true });
    document.addEventListener('mouseup', upHandler, { passive: false, capture: true });
    
    // Also prevent wheel/scroll events
    const wheelHandler = (e: WheelEvent) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    const scrollHandler = (e: Event) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    document.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
    document.addEventListener('scroll', scrollHandler, { passive: false, capture: true });
    
    return () => {
      document.removeEventListener('mousemove', moveHandler, { capture: true } as any);
      document.removeEventListener('mouseup', upHandler, { capture: true } as any);
      document.removeEventListener('wheel', wheelHandler, { capture: true } as any);
      document.removeEventListener('scroll', scrollHandler, { capture: true } as any);
      
      // Re-enable scrolling
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isDragging, dragStart, draggable]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!draggable) {
      setIsOpen(!isOpen);
      return;
    }
    
    // For draggable buttons, check if we actually dragged
    // Use a small threshold to distinguish click from drag
    const moved = Math.abs(position.x - initialPosition.x) > 5 || Math.abs(position.y - initialPosition.y) > 5;
    
    // Only toggle if we didn't drag (or drag was very small)
    if (!moved && !isDragging) {
      setIsOpen(!isOpen);
    }
  };

  // Process children and ensure unique keys
  const processedChildren = Children.toArray(children)
    .filter((child): child is React.ReactElement => isValidElement(child))
    .map((child, index) => {
      // Get the key from the child, or generate one
      const existingKey = child.key;
      const key = existingKey && typeof existingKey === 'string' && existingKey !== '' 
        ? existingKey 
        : `floating-item-${index}`;
      
      // Clone with the key
      return cloneElement(child, { key } as any);
    });

  // Calculate position style
  const getPositionStyle = () => {
    if (!draggable) return {};
    
    // Ensure position is valid and within viewport
    if (typeof window === 'undefined') return {};
    
    const buttonWidth = ref.current?.offsetWidth || 48;
    const buttonHeight = ref.current?.offsetHeight || 48;
    const maxX = Math.max(0, window.innerWidth - buttonWidth);
    const maxY = Math.max(0, window.innerHeight - buttonHeight);
    
    // Use current position or calculate safe default
    let safeX = position.x;
    let safeY = position.y;
    
    // If position is not initialized or invalid, calculate default
    if (!isInitialized || safeX <= 0 || safeY <= 0 || safeX > maxX || safeY > maxY) {
      const defaultPos = calculateDefaultPosition();
      safeX = defaultPos.x;
      safeY = defaultPos.y;
    }
    
    // Clamp to viewport bounds to ensure visibility
    safeX = Math.max(0, Math.min(safeX, maxX));
    safeY = Math.max(0, Math.min(safeY, maxY));
    
    return {
      position: 'fixed' as const,
      left: `${safeX}px`,
      top: `${safeY}px`,
      right: 'auto',
      bottom: 'auto',
      cursor: (isDragging ? 'grabbing' : 'grab') as React.CSSProperties['cursor'],
      zIndex: 9999, // Ensure it's above everything including bottom nav
      pointerEvents: 'auto' as React.CSSProperties['pointerEvents'], // Ensure it's clickable
      touchAction: 'none' as React.CSSProperties['touchAction'], // Prevent touch scrolling while dragging
      userSelect: 'none' as React.CSSProperties['userSelect'], // Prevent text selection while dragging
    };
  };

  const positionStyle = draggable ? getPositionStyle() : {};
  
  // Use refs for touch handlers to ensure they're not passive
  const touchStartRef = useRef<((e: TouchEvent) => void) | null>(null);
  const touchMoveRef = useRef<((e: TouchEvent) => void) | null>(null);
  const touchEndRef = useRef<((e: TouchEvent) => void) | null>(null);

  // Set up non-passive touch event listeners
  useEffect(() => {
    if (!draggable || !ref.current) return;

    const element = ref.current;

    touchStartRef.current = (e: TouchEvent) => {
      if (!draggable) return;
      const touch = e.touches[0];
      if (!touch) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - (position.x || 0),
        y: touch.clientY - (position.y || 0)
      });
      setInitialPosition(position);
    };

    touchMoveRef.current = (e: TouchEvent) => {
      if (!isDragging || !draggable) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      if (!touch) return;
      
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;

      // Constrain to viewport bounds
      const buttonWidth = ref.current?.offsetWidth || 48;
      const buttonHeight = ref.current?.offsetHeight || 48;
      const maxX = window.innerWidth - buttonWidth;
      const maxY = window.innerHeight - buttonHeight;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    touchEndRef.current = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        
        const moved = Math.abs(position.x - initialPosition.x) > 10 || Math.abs(position.y - initialPosition.y) > 10;
        setIsDragging(false);
        
        // If moved significantly, it was a drag, not a click
        if (!moved) {
          setTimeout(() => {
            setIsOpen(!isOpen);
          }, 50);
        }
      }
    };

    // Add non-passive event listeners
    element.addEventListener('touchstart', touchStartRef.current, { passive: false });
    element.addEventListener('touchmove', touchMoveRef.current, { passive: false });
    element.addEventListener('touchend', touchEndRef.current, { passive: false });

    return () => {
      if (touchStartRef.current) {
        element.removeEventListener('touchstart', touchStartRef.current);
      }
      if (touchMoveRef.current) {
        element.removeEventListener('touchmove', touchMoveRef.current);
      }
      if (touchEndRef.current) {
        element.removeEventListener('touchend', touchEndRef.current);
      }
    };
  }, [draggable, isDragging, dragStart, position, initialPosition]);

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center ${draggable ? 'fixed' : 'relative'} ${draggable ? 'select-none' : ''} ${!draggable ? className || '' : ''}`}
      style={{
        ...positionStyle,
        // Ensure visibility
        visibility: 'visible' as const,
        display: 'flex',
      } as React.CSSProperties}
      onMouseDown={handleMouseDown}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            key="floating-menu"
            className="flex flex-col items-center absolute bottom-14 md:bottom-16 gap-3 md:gap-4 pointer-events-auto"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={list}>
            {processedChildren}
          </motion.ul>
        )}
        <motion.div
          key="floating-trigger"
          variants={btn}
          animate={isOpen ? 'visible' : 'hidden'}
          onClick={handleTriggerClick}
          className={`relative z-10 ${draggable && !isDragging ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{ userSelect: 'none' }}>
          {triggerContent}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FloatingButtonItem({ children, ...props }: FloatingButtonItemProps & { key?: string | number }) {
  // Use the key from props (React will handle it)
  return (
    <motion.li variants={item} className="mb-0">
      {children}
    </motion.li>
  );
}

export { FloatingButton, FloatingButtonItem };

