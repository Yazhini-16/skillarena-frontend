'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useWalletStore } from '@/store/walletStore';
import { Zap, Wallet, LogOut, Trophy } from 'lucide-react';
import Button from './ui/Button';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { balance } = useWalletStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1a1a24',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '8px',
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={18} color="#fff" fill="#fff"/>
        </div>
        <span style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em' }}>
          Skill<span style={{ color: '#8b5cf6' }}>Arena</span>
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuthenticated ? (
          <>
            <Link href="/wallet" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', background: '#1a1a24',
              border: '1px solid #2a2a3a', borderRadius: '8px',
              fontSize: '14px', fontWeight: 500, color: '#10b981',
              transition: 'all 0.15s',
            }}>
              <Wallet size={15}/>
              ₹{parseFloat(balance).toFixed(2)}
            </Link>

            // Add to auth store - update src/store/authStore.js to include hearts
// In Navbar, after the wallet balance display:
{isAuthenticated && (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '6px 12px', background: '#1a1a24',
    border: '1px solid #2a2a3a', borderRadius: '8px',
  }}>
    {[1, 2, 3].map(i => (
      <span key={i} style={{
        fontSize: '16px',
        filter: i <= (user?.hearts ?? 3) ? 'none' : 'grayscale(1) opacity(0.3)',
      }}>❤️</span>
    ))}
  </div>
)}

            <Link href="/leaderboard" style={{
              color: '#8888aa', fontSize: '14px',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <Trophy size={15}/>
            </Link>
            <span style={{ fontSize: '13px', color: '#8888aa' }}>
              {user?.username}
            </span>
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              color: '#55556a', background: 'none', fontSize: '13px',
              padding: '6px', borderRadius: '6px',
              transition: 'color 0.15s',
            }}
              onMouseEnter={(e) => e.target.style.color = '#ef4444'}
              onMouseLeave={(e) => e.target.style.color = '#55556a'}
            >
              <LogOut size={15}/>
            </button>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  );
}