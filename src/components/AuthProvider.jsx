'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWalletStore } from '@/store/walletStore';
import api from '@/lib/api';

export default function AuthProvider({ children }) {
  const { isAuthenticated, _hydrated } = useAuthStore();
  const { setWallet } = useWalletStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !_hydrated) return;
    if (isAuthenticated) {
      api.get('/api/wallet')
        .then(res => setWallet(res.data.data))
        .catch(() => {});
    }
  }, [mounted, _hydrated, isAuthenticated]);

  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid #7c3aed',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return children;
}