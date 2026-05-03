export default function Badge({ children, variant = 'default' }) {
  const variants = {
    default: { background: '#1a1a24', color: '#8888aa', border: '1px solid #2a2a3a' },
    success: { background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' },
    danger: { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' },
    warning: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' },
    purple: { background: 'rgba(124,58,237,0.15)', color: '#8b5cf6', border: '1px solid rgba(124,58,237,0.3)' },
    gold: { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' },
  };

  return (
    <span style={{
      ...variants[variant],
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 500,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    }}>
      {children}
    </span>
  );
}