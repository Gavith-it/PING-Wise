'use client';

import { ReactNode, useRef, useState, Children, cloneElement, isValidElement } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnClickOutside } from 'usehooks-ts';

type FloatingButtonProps = {
  className?: string;
  children: ReactNode;
  triggerContent: ReactNode;
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

function FloatingButton({ className, children, triggerContent }: FloatingButtonProps) {
  const ref = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useOnClickOutside(ref, () => setIsOpen(false));

  return (
    <div ref={ref} className={`flex flex-col items-center relative ${className || ''}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            className="flex flex-col items-center absolute bottom-14 md:bottom-16 gap-3 md:gap-4 pointer-events-auto"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={list}>
            {Children.map(children, (child, index) => {
              if (isValidElement(child)) {
                return cloneElement(child, { key: child.key || `floating-item-${index}` });
              }
              return child;
            })}
          </motion.ul>
        )}
        <motion.div
          variants={btn}
          animate={isOpen ? 'visible' : 'hidden'}
          onClick={() => setIsOpen(!isOpen)}
          className="relative z-10">
          {triggerContent}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FloatingButtonItem({ children }: FloatingButtonItemProps) {
  return (
    <motion.li variants={item} className="mb-0">
      {children}
    </motion.li>
  );
}

export { FloatingButton, FloatingButtonItem };

