import React from 'react';
import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-40 -right-40 w-80 h-80 bg-linear-to-r from-orange-400 to-transparent rounded-full blur-3xl opacity-30"
        animate={{
          y: [0, 50, 0],
          x: [0, 30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-linear-to-r from-blue-400 to-transparent rounded-full blur-3xl opacity-30"
        animate={{
          y: [0, -50, 0],
          x: [0, -30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-96 h-96 bg-linear-to-r from-purple-400 to-transparent rounded-full blur-3xl opacity-20"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
