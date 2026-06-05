import React from 'react';
import { motion } from 'framer-motion';

export function PageTransition({ children, duration = 0.4 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: duration <= 0.25 ? 6 : 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: duration <= 0.25 ? -4 : -15 }}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
