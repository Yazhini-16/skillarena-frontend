'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Zap, RotateCcw, Home } from 'lucide-react';
import { useMatchStore } from '@/store/matchStore';
import { useAuthStore } from '@/store/authStore';
import { useWalletStore } from '@/store/walletStore';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import api from '@/lib/api';

export default function ResultPage() {
  const { result, clearMatch }  = useMatchStore();
  const { user, _hydrated }     = useAuthStore();
  const { updateBalance }       = useWalletStore();
  const router                  = useRouter();
  const [hearts, setHearts]     = useState(null);

  // Determine myId safely — result has winnerId and loserId
  // We know user is either winner or loser
  const myId = _hydrated && user?.id ? user.id : null;
  const isWinner = myId ? result?.winnerId === myId : false;
  const myScore  = myId ? (result?.scores?.[myId] ?? null) : null;
  const myTime   = myId ? (result?.times?.[myId] ?? null) : null;
  const oppId    = myId
    ? (result?.winnerId === myId ? result?.loserId : result?.winnerId)
    : null;
  const oppScore = oppId ? (result?.scores?.[oppId] ?? null) : null;
  const oppTime  = oppId ? (result?.times?.[oppId] ?? null) : null;

  useEffect(() => {
    if (!result) { router.push('/lobby'); return; }
    if (isWinner && result.winnerNewBalance) {
      updateBalance(result.winnerNewBalance);
    }
    // Refresh hearts after match
    api.get('/api/auth/me')
      .then(res => setHearts(res.data.data?.hearts ?? 3))
      .catch(() => {});
  }, [result, isWinner]);

  const handlePlayAgain = () => {
    clearMatch();
    router.push('/lobby');
  };

  if (!result) return null;

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '600px', height: '600px',
        background: isWinner
          ? 'radial-gradient(ellipse,rgba(251,191,36,0.08) 0%,transparent 70%)'
          : 'radial-gradient(ellipse,rgba(239,68,68,0.06) 0%,transparent 70%)',
        pointerEvents: 'none',
      }}/>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', damping: 12 }}
          style={{
            width: 100, height: 100, borderRadius: '50%',
            background: isWinner
              ? 'linear-gradient(135deg,rgba(251,191,36,0.2),rgba(245,158,11,0.1))'
              : 'linear-gradient(135deg,rgba(239,68,68,0.2),rgba(220,38,38,0.1))',
            border: `2px solid ${isWinner ? '#fbbf24' : '#ef4444'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          {isWinner ? <Trophy size={44} color="#fbbf24"/> : <Zap size={44} color="#ef4444"/>}
        </motion.div>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 style={{
            fontSize: '48px', fontWeight: 800,
            letterSpacing: '-0.03em', marginBottom: '8px',
            color: isWinner ? '#fbbf24' : '#ef4444',
          }}>
            {isWinner ? 'You won!' : 'You lost'}
          </h1>
          <p style={{ color: '#8888aa', fontSize: '16px', marginBottom: '24px' }}>
            {result.resolveType === 'FORFEIT'
              ? isWinner ? 'Your opponent disconnected' : 'You disconnected'
              : result.resolveType === 'TIME_UP'
              ? 'Time ran out — scores compared'
              : isWinner ? 'Faster correct solution wins' : 'Better luck next time'}
          </p>
        </motion.div>

        {/* Hearts remaining after match */}
        {hearts !== null && !isWinner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '4px', marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#8888aa', marginRight: '8px' }}>
              Hearts remaining:
            </span>
            {[1,2,3].map(i => (
              <svg key={i} width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill={i <= hearts ? '#ef4444' : 'none'}
                  stroke={i <= hearts ? '#ef4444' : '#3a3a4f'}
                  strokeWidth="2"
                />
              </svg>
            ))}
            {hearts === 0 && (
              <span style={{ fontSize: '13px', color: '#ef4444', marginLeft: '8px' }}>
                — 24hr cooldown active
              </span>
            )}
          </motion.div>
        )}

        {/* Score card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: '#111118',
            border: `1px solid ${isWinner ? 'rgba(251,191,36,0.3)' : '#2a2a3a'}`,
            borderRadius: '16px', padding: '24px', marginBottom: '24px',
          }}
        >
          {/* Prize */}
          {isWinner && (
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#fbbf24', marginBottom: '16px' }}>
              +₹{result.netPrize}
            </div>
          )}

          {/* Stats grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
            paddingTop: isWinner ? '16px' : '0',
            borderTop: isWinner ? '1px solid #2a2a3a' : 'none',
          }}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#0a0a0f', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: '#55556a', marginBottom: '8px', letterSpacing: '0.05em' }}>
                YOUR SCORE
              </div>
              <div style={{
                fontSize: '32px', fontWeight: 800,
                color: myScore === 100 ? '#10b981' : myScore > 0 ? '#f59e0b' : '#ef4444',
              }}>
                {myScore !== null ? `${myScore}%` : '--'}
              </div>
              {myTime !== null && (
                <div style={{ fontSize: '12px', color: '#8888aa', marginTop: '6px' }}>
                  submitted in {(myTime / 1000).toFixed(1)}s
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', padding: '16px', background: '#0a0a0f', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: '#55556a', marginBottom: '8px', letterSpacing: '0.05em' }}>
                OPPONENT
              </div>
              <div style={{
                fontSize: '32px', fontWeight: 800,
                color: '#8888aa',
              }}>
                {oppScore !== null ? `${oppScore}%` : '--'}
              </div>
              {oppTime !== null && (
                <div style={{ fontSize: '12px', color: '#55556a', marginTop: '6px' }}>
                  submitted in {(oppTime / 1000).toFixed(1)}s
                </div>
              )}
            </div>
          </div>

          {/* Win reason */}
          <div style={{
            marginTop: '16px', padding: '10px 14px',
            background: isWinner ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            borderRadius: '8px', fontSize: '13px',
            color: isWinner ? '#10b981' : '#ef4444',
            textAlign: 'center',
          }}>
            {myScore !== null && oppScore !== null && (
              myScore > oppScore
                ? '✓ Won by higher score'
                : myScore < oppScore
                ? '✗ Lost by lower score'
                : myTime !== null && oppTime !== null && myTime < oppTime
                ? '✓ Won by faster submission (equal score)'
                : '✗ Lost by slower submission (equal score)'
            )}
          </div>

          {/* Platform fee */}
          <div style={{
            marginTop: '12px', display: 'flex', justifyContent: 'space-between',
            fontSize: '13px', color: '#55556a',
            paddingTop: '12px', borderTop: '1px solid #1a1a24',
          }}>
            <span>Platform fee</span>
            <span>₹{result.platformFee}</span>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ display: 'flex', gap: '12px' }}
        >
          <Button variant="secondary" size="lg" style={{ flex: 1 }} onClick={handlePlayAgain}>
            <RotateCcw size={16}/> Play again
          </Button>
          <Link href="/" style={{ flex: 1 }}>
            <Button variant="ghost" size="lg" fullWidth>
              <Home size={16}/> Home
            </Button>
          </Link>
        </motion.div>

        {isWinner && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            style={{ marginTop: '16px', fontSize: '13px', color: '#10b981' }}
          >
            ₹{result.netPrize} has been added to your wallet
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}