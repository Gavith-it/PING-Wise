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
  const [hasUserDragged, setHasUserDragged] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);
  
  // Track if a click happened (not a drag)
  const clickStartTime = useRef<number>(0);
  const clickStartPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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

  // Load saved position from sessionStorage or calculate default
  // Using sessionStorage so position resets after login (new session)
  useEffect(() => {
    if (typeof window !== 'undefined' && draggable && !isInitialized) {
      // Clear any old localStorage position (migration)
      if (localStorage.getItem(storageKey)) {
        localStorage.removeItem(storageKey);
      }
      
      // Check sessionStorage for position (only persists during current session)
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.x !== undefined && parsed.y !== undefined && parsed.x > 0 && parsed.y > 0) {
            // Validate saved position is still within viewport
            const buttonWidth = 48;
            const buttonHeight = 48;
            if (parsed.x < window.innerWidth - buttonWidth && parsed.y < window.innerHeight - buttonHeight) {
              setPosition(parsed);
              // User has already dragged in this session, so enable saving
              setHasUserDragged(true);
              setIsInitialized(true);
              return;
            }
          }
        } catch (e) {
          // Invalid saved data, use default
        }
      }
      
      // Calculate and set default position (original/main position)
      // This is used when no saved position exists (new session after login)
      const defaultPos = calculateDefaultPosition();
      setPosition(defaultPos);
      setHasUserDragged(false); // Reset - user hasn't dragged yet in this session
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

  // Save position to sessionStorage (only after user drags)
  // Using sessionStorage so position resets after login (new session)
  // Only saves when user actually drags the button, not on initial load
  useEffect(() => {
    if (typeof window !== 'undefined' && draggable && isInitialized && !isDragging && hasUserDragged) {
      // Only save if user has actually dragged the button
      // Ensure position is valid (not 0,0 and within viewport)
      if (position.x > 0 && position.y > 0) {
        const buttonWidth = 48;
        const buttonHeight = 48;
        const maxX = window.innerWidth - buttonWidth;
        const maxY = window.innerHeight - buttonHeight;
        
        if (position.x <= maxX && position.y <= maxY) {
          sessionStorage.setItem(storageKey, JSON.stringify(position));
        }
      }
    }
  }, [position, storageKey, draggable, isInitialized, isDragging, hasUserDragged]);

  useOnClickOutside(ref, () => setIsOpen(false));

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable) {
      // If not draggable, let click handler work normally
      return;
    }
    
    // Don't start drag if clicking on a child button
    const target = e.target as HTMLElement;
    if (target.closest('button') && target.closest('button') !== e.currentTarget.querySelector('button:first-child')) {
      return;
    }
    
    // Record click start time and position for click detection
    clickStartTime.current = Date.now();
    clickStartPosition.current = { x: e.clientX, y: e.clientY };
    setInitialPosition(position);
    setMouseDown(true);
    
    // Don't set isDragging immediately - wait to see if user actually moves
    // This allows clicks to work properly
    setDragStart({
      x: e.clientX - (position.x || 0),
      y: e.clientY - (position.y || 0)
    });
  };



  // Track if mouse is currently down (for drag detection)
  const [mouseDown, setMouseDown] = useState(false);
  
  // Add global mouse event listeners for drag detection
  useEffect(() => {
    if (!draggable) return;
    
    const moveHandler = (e: MouseEvent) => {
      // Check if mouse moved significantly from start position
      const movedDistance = Math.abs(e.clientX - clickStartPosition.current.x) > 5 ||
                          Math.abs(e.clientY - clickStartPosition.current.y) > 5;
      
      // Only start dragging if user actually moved the mouse
      if (mouseDown && movedDistance && !isDragging) {
        setIsDragging(true);
        // Prevent scrolling while dragging
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
      }
      
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        
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
      }
    };
    
    const upHandler = (e: MouseEvent) => {
      setMouseDown(false);
      
      if (isDragging) {
        // This was a drag
        e.preventDefault();
        e.stopPropagation();
        
        const moved = Math.abs(position.x - initialPosition.x) > 5 || 
                      Math.abs(position.y - initialPosition.y) > 5;
        
        if (moved) {
          setHasUserDragged(true);
        }
        
        setIsDragging(false);
        // Re-enable scrolling
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      }
      // If not dragging, let the click event handle it naturally
    };
    
    // Use capture phase to catch events early
    document.addEventListener('mousemove', moveHandler, { passive: false, capture: true });
    document.addEventListener('mouseup', upHandler, { passive: false, capture: true });
    
    // Also prevent wheel/scroll events while dragging
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
  }, [mouseDown, isDragging, dragStart, draggable, position, initialPosition]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    // If we were dragging, don't treat this as a click
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    e.stopPropagation();
    
    if (!draggable) {
      setIsOpen(!isOpen);
      return;
    }
    
    // For draggable buttons, only toggle if we didn't drag
    // Check both position change and if dragging state was set
    const moved = Math.abs(position.x - initialPosition.x) > 5 || 
                  Math.abs(position.y - initialPosition.y) > 5;
    
    // Only toggle if we didn't drag
    if (!moved) {
      setIsOpen(!isOpen);
    } else {
      // If we dragged, prevent the click
      e.preventDefault();
    }
  };


  // Process children and ensure unique keys and proper event handling
  const processedChildren = Children.toArray(children)
    .filter((child): child is React.ReactElement => isValidElement(child))
    .map((child, index) => {
      // Get the key from the child, or generate one
      const existingKey = child.key;
      const key = existingKey && typeof existingKey === 'string' && existingKey !== '' 
        ? existingKey 
        : `floating-item-${index}`;
      
      // Clone with the key and ensure onClick handlers work
      const childProps = child.props as any;
      const originalOnClick = childProps?.onClick;
      
      return cloneElement(child, { 
        key,
        onClick: (e: React.MouseEvent) => {
          // Stop propagation to prevent parent handlers
          e.stopPropagation();
          // Call original onClick if it exists
          if (originalOnClick) {
            originalOnClick(e);
          }
          // Close the menu after click
          setIsOpen(false);
        },
        style: { ...childProps?.style, pointerEvents: 'auto' as const }
      } as any);
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
      
      // Record touch start time and position for click detection
      clickStartTime.current = Date.now();
      clickStartPosition.current = { x: touch.clientX, y: touch.clientY };
      setInitialPosition(position);
      
      // Don't set isDragging immediately - wait to see if user actually moves
      // This allows taps to work properly
      setDragStart({
        x: touch.clientX - (position.x || 0),
        y: touch.clientY - (position.y || 0)
      });
    };

    touchMoveRef.current = (e: TouchEvent) => {
      if (!draggable) return;
      
      const touch = e.touches[0];
      if (!touch) return;
      
      // Check if user actually moved (drag threshold)
      const movedDistance = Math.abs(touch.clientX - clickStartPosition.current.x) > 5 ||
                          Math.abs(touch.clientY - clickStartPosition.current.y) > 5;
      
      // Only start dragging if user actually moved
      if (movedDistance && !isDragging) {
        setIsDragging(true);
        // Prevent scrolling while dragging
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
      }
      
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        
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
      }
    };

    touchEndRef.current = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      
      if (isDragging) {
        // This was a drag
        e.preventDefault();
        e.stopPropagation();
        
        if (!touch) {
          setIsDragging(false);
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          return;
        }
        
        const moved = Math.abs(position.x - initialPosition.x) > 5 || 
                      Math.abs(position.y - initialPosition.y) > 5;
        
        if (moved) {
          setHasUserDragged(true);
        }
        
        setIsDragging(false);
        // Re-enable scrolling
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      } else if (touch) {
        // This was a tap (not a drag) - let it trigger click naturally
        // The click handler will handle opening the menu
        const clickDuration = Date.now() - clickStartTime.current;
        const movedDistance = Math.abs(touch.clientX - clickStartPosition.current.x) > 5 ||
                            Math.abs(touch.clientY - clickStartPosition.current.y) > 5;
        
        // If it was a quick tap without movement, it's a click
        if (!movedDistance && clickDuration < 300) {
          // Let the click event handle it - don't prevent default
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
          data-floating-trigger
          className={`relative z-10 ${draggable && !isDragging ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{ userSelect: 'none', pointerEvents: 'auto' }}>
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

