'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export const useRequireAuth = () => {
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const hydrated = useAuthStore(state => state._hydrated);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    // Prevent redirect loop on login/register pages
    const publicRoutes = ['/', '/login', '/register'];

    if (!isAuthenticated && !publicRoutes.includes(pathname)) {
      router.replace('/login');
      return;
    }

    setReady(true);
  }, [hydrated, isAuthenticated, pathname, router]);

  return ready;
};