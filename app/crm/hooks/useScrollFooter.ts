import { useEffect, useRef } from 'react';
import { useFooterVisibility } from '@/contexts/FooterVisibilityContext';

/**
 * Custom hook to handle scroll visibility for footer
 * @param containerRef - Ref to the scrollable container
 */
export function useScrollFooter(containerRef: React.RefObject<HTMLDivElement>) {
  const { setIsVisible: setFooterVisible } = useFooterVisibility();
  const lastScrollY = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = container.scrollTop;
          
          // Show footer when at top of list
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

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchmove', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchmove', handleScroll);
    };
  }, [containerRef, setFooterVisible]);
}
