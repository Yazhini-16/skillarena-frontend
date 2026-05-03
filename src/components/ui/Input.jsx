'use client';
import { useState } from 'react';

export default function Input({
  label, type = 'text', placeholder, value,
  onChange, error, icon, disabled = false, ...props
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#8888aa' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)', color: '#55556a', pointerEvents: 'none',
          }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: icon ? '12px 12px 12px 40px' : '12px 14px',
            background: '#111118',
            border: `1px solid ${error ? '#ef4444' : focused ? '#7c3aed' : '#2a2a3a'}`,
            borderRadius: '8px',
            color: '#f0f0f5',
            fontSize: '14px',
            transition: 'border-color 0.15s ease',
            boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.15)'}` : 'none',
          }}
          {...props}
        />
      </div>
      {error && (
        <span style={{ fontSize: '12px', color: '#ef4444' }}>{error}</span>
      )}
    </div>
  );
}