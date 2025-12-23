import { useEffect, useRef } from 'react';
import { useFooterVisibility } from '@/contexts/FooterVisibilityContext';

// Handles footer visibility on scroll
// If containerRef is null, listens to window scroll (for natural page scrolling)
// If containerRef is provided, listens to container scroll (for container-based scrolling)
export function useScrollFooter(containerRef: React.RefObject<HTMLDivElement> | null) {
  const { setIsVisible: setFooterVisible } = useFooterVisibility();
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Get scroll position from container or window
          const currentScrollY = containerRef?.current 
            ? containerRef.current.scrollTop 
            : window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
          
          // Show footer when at top
          if (currentScrollY < 10) {
            setFooterVisible(true);
            lastScrollY.current = currentScrollY;
            ticking = false;
            return;
          }
          
          // Calculate scroll direction
          const scrollDifference = currentScrollY - lastScrollY.current;
          
          // Hide footer when scrolling down (after 20px threshold)
          if (scrollDifference > 5 && currentScrollY > 20) {
            setFooterVisible(false);
          } 
          // Show footer when scrolling up
          else if (scrollDifference < -5) {
            setFooterVisible(true);
          }
          
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    if (containerRef?.current) {
      // Listen to container scroll
      const container = containerRef.current;
      container.addEventListener('scroll', handleScroll, { passive: true });
      container.addEventListener('touchmove', handleScroll, { passive: true });
      
      return () => {
        container.removeEventListener('scroll', handleScroll);
        container.removeEventListener('touchmove', handleScroll);
      };
    } else {
      // Listen to window scroll
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('touchmove', handleScroll, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('touchmove', handleScroll);
      };
    }
  }, [containerRef, setFooterVisible]);
}
