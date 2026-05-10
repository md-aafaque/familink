import React from 'react';
import { motion } from 'framer-motion';

interface TextRevealProps {
  text: string;
  delay?: number;
  duration?: number;
}

export function TextReveal({ text, delay = 0, duration = 0.05 }: TextRevealProps) {
  const words = text.split(' ');

  return (
    <motion.div className="flex flex-wrap gap-2">
      {words.map((word, idx) => (
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            delay: delay + idx * duration,
            duration: 0.5,
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}
