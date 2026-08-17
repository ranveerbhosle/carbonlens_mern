import React from 'react';
import { motion } from 'framer-motion';

export default function Page({ title, subtitle, children }) {
  return (
    <motion.div
      className="page-wrap"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.25 }}
    >
      {title ? <h1 className="page-title">{title}</h1> : null}
      {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      {children}
    </motion.div>
  );
}

