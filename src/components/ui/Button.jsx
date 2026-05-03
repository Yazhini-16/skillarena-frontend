'use client';
import { motion } from 'framer-motion';

export default function Button({
  children, onClick, variant = 'primary',
  size = 'md', disabled = false, loading = false,
  className = '', fullWidth = false, ...props
}) {
  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      color: '#fff',
      border: '1px solid rgba(139,92,246,0.5)',
    },
    secondary: {
      background: '#1a1a24',
      color: '#f0f0f5',
      border: '1px solid #2a2a3a',
    },
    danger: {
      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
      color: '#fff',
      border: '1px solid rgba(239,68,68,0.5)',
    },
    success: {
      background: 'linear-gradient(135deg, #059669, #047857)',
      color: '#fff',
      border: '1px solid rgba(16,185,129,0.5)',
    },
    ghost: {
      background: 'transparent',
      color: '#8888aa',
      border: '1px solid #2a2a3a',
    },
  };

  const sizes = {
    sm: { padding: '6px 14px', fontSize: '13px', borderRadius: '6px' },
    md: { padding: '10px 20px', fontSize: '14px', borderRadius: '8px' },
    lg: { padding: '14px 28px', fontSize: '16px', borderRadius: '10px' },
    xl: { padding: '18px 36px', fontSize: '18px', borderRadius: '12px' },
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02, filter: 'brightness(1.1)' } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      style={{
        ...variants[variant],
        ...sizes[size],
        width: fullWidth ? '100%' : 'auto',
        fontWeight: 500,
        letterSpacing: '0.02em',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.15s ease',
      }}
      className={className}
      {...props}
    >
      {loading ? (
        <span style={{
          width: 16, height: 16, border: '2px solid currentColor',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
          display: 'inline-block',
        }}/>
      ) : children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.button>
  );
}