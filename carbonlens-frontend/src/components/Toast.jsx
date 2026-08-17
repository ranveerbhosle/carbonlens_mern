import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Toast() {
  const { toast } = useAuth();
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          className="toast"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
        >
          {toast}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

