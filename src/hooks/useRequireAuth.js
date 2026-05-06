'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export const useRequireAuth = () => {
  const { isAuthenticated, _hydrated } = useAuthStore();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!_hydrated) return; // wait for store to hydrate from localStorage

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    setReady(true);
  }, [_hydrated, isAuthenticated]);

  return ready;
};