'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useWalletStore } from '@/store/walletStore';
import { Zap, Wallet, LogOut, Code2 } from 'lucide-react';
import Button from './ui/Button';
import { motion } from 'framer-motion';
import api from '@/lib/api';

function Heart({ filled }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={filled ? '#ef4444' : 'none'}
        stroke={filled ? '#ef4444' : '#3a3a4f'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Navbar() {
  const { isAuthenticated, user, logout, _hydrated } = useAuthStore();
  const { balance } = useWalletStore();
  const router   = useRouter();
  const pathname = usePathname();
  const [hearts, setHearts] = useState(3);

  useEffect(() => {
    if (!isAuthenticated || !_hydrated) return;
    api.get('/api/auth/me')
      .then(res => {
        const h = res.data.data?.hearts;
        if (h !== undefined && h !== null) setHearts(Number(h));
      })
      .catch(() => {});
  }, [isAuthenticated, _hydrated, pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navLink = (href, label, icon) => {
    const active = pathname === href;
    return (
      <Link href={href} style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        fontSize: '13px', fontWeight: active ? 600 : 400,
        color: active ? '#8b5cf6' : '#8888aa',
        padding: '5px 10px', borderRadius: '6px',
        background: active ? 'rgba(124,58,237,0.1)' : 'transparent',
        border: active ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent',
        transition: 'all 0.15s',
      }}>
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1a1a24',
        padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '8px',
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Zap size={18} color="#fff" fill="#fff"/>
        </div>
        <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0f0f5' }}>
          Skill<span style={{ color: '#8b5cf6' }}>Arena</span>
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isAuthenticated && _hydrated ? (
          <>
            {/* Nav links */}
            {navLink('/lobby',    'Compete', <Zap size={14}/>)}
            {navLink('/practice', 'Practice', <Code2 size={14}/>)}

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: '#2a2a3a', margin: '0 4px' }}/>

            {/* Hearts */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '2px',
              padding: '5px 10px', background: '#111118',
              border: '1px solid #2a2a3a', borderRadius: '8px',
            }}>
              {[1,2,3].map(i => (
                <motion.div
                  key={i}
                  animate={i > hearts ? { scale: [1,1.4,1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <Heart filled={i <= hearts}/>
                </motion.div>
              ))}
            </div>

            {/* Wallet */}
            <Link href="/wallet" style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', background: '#111118',
              border: '1px solid #2a2a3a', borderRadius: '8px',
              fontSize: '13px', fontWeight: 600, color: '#10b981',
              transition: 'all 0.15s', textDecoration: 'none',
            }}>
              <Wallet size={14}/>
              ₹{parseFloat(balance || 0).toFixed(2)}
            </Link>

            {/* Username */}
            <span style={{
              fontSize: '13px', color: '#8888aa',
              padding: '5px 8px',
            }}>
              {user?.username}
            </span>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Log out"
              style={{
                display: 'flex', alignItems: 'center',
                color: '#55556a', background: 'none',
                padding: '6px', borderRadius: '6px',
                transition: 'color 0.15s', border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#55556a'}
            >
              <LogOut size={15}/>
            </button>
          </>
        ) : (
          <>
            {navLink('/practice', 'Practice', <Code2 size={14}/>)}
            <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link href="/register"><Button size="sm">Get started</Button></Link>
          </>
        )}
      </div>
    </motion.nav>
  );
}