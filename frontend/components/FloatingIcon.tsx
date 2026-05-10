import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

interface FloatingIconProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FloatingIcon({ children, delay = 0, duration = 4, className }: FloatingIconProps) {
  return (
    <motion.div
      animate={{ y: [0, -20, 0] }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
