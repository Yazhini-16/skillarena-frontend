'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWalletStore } from '@/store/walletStore';
import api from '@/lib/api';

export default function AuthProvider({ children }) {
  const { isAuthenticated } = useAuthStore();
  const { setWallet } = useWalletStore();

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/api/wallet')
        .then(res => setWallet(res.data.data))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  return children;
}