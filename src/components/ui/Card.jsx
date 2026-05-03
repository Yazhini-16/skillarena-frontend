'use client';
import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover = false, style = {}, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { scale: 1.01, borderColor: '#3a3a4f' } : {}}
      style={{
        background: '#111118',
        border: '1px solid #2a2a3a',
        borderRadius: '12px',
        padding: '24px',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}