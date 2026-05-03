'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Zap, RotateCcw, Home } from 'lucide-react';
import { useMatchStore } from '@/store/matchStore';
import { useAuthStore } from '@/store/authStore';
import { useWalletStore } from '@/store/walletStore';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function ResultPage() {
  const { result, match, opponent, clearMatch } = useMatchStore();
  const { user } = useAuthStore();
  const { updateBalance } = useWalletStore();
  const router = useRouter();

  const isWinner = result?.winnerId === user?.id;

  useEffect(() => {
    if (!result) { router.push('/lobby'); return; }
    if (isWinner && result.winnerNewBalance) {
      updateBalance(result.winnerNewBalance);
    }
  }, []);

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
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px',
        background: isWinner
          ? 'radial-gradient(ellipse, rgba(251,191,36,0.08) 0%, transparent 70%)'
          : 'radial-gradient(ellipse, rgba(239,68,68,0.06) 0%, transparent 70%)',
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
              ? 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))'
              : 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.1))',
            border: `2px solid ${isWinner ? '#fbbf24' : '#ef4444'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          {isWinner
            ? <Trophy size={44} color="#fbbf24"/>
            : <Zap size={44} color="#ef4444"/>
          }
        </motion.div>

        {/* Result title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 style={{
            fontSize: '48px', fontWeight: 800,
            letterSpacing: '-0.03em', marginBottom: '8px',
            color: isWinner ? '#fbbf24' : '#ef4444',
          }}>
            {isWinner ? 'You won!' : 'You lost'}
          </h1>
          <p style={{ color: '#8888aa', fontSize: '16px', marginBottom: '32px' }}>
            {result.resolveType === 'FORFEIT'
              ? isWinner ? 'Your opponent disconnected' : 'You were disconnected'
              : result.resolveType === 'TIME_UP'
              ? "Time ran out — scores compared"
              : isWinner
              ? 'Faster correct solution wins the prize'
              : 'Better luck next time'}
          </p>
        </motion.div>

        {/* Score card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: '#111118',
            border: `1px solid ${isWinner ? 'rgba(251,191,36,0.3)' : '#2a2a3a'}`,
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          {isWinner && (
            <div style={{
              fontSize: '36px', fontWeight: 800,
              color: '#fbbf24', marginBottom: '4px',
            }}>
              +₹{result.netPrize}
            </div>
          )}

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '16px', marginTop: isWinner ? '16px' : '0',
            paddingTop: isWinner ? '16px' : '0',
            borderTop: isWinner ? '1px solid #2a2a3a' : 'none',
          }}>
            <div style={{ textAlign: 'center', padding: '12px', background: '#0a0a0f', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#55556a', marginBottom: '6px' }}>YOUR SCORE</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#f0f0f5' }}>
                {result.scores?.[user?.id] ?? '--'}%
              </div>
              <div style={{ fontSize: '12px', color: '#8888aa', marginTop: '4px' }}>
                {result.times?.[user?.id] ? `${(result.times[user.id] / 1000).toFixed(1)}s` : '—'}
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '12px', background: '#0a0a0f', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#55556a', marginBottom: '6px' }}>OPPONENT</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#8888aa' }}>
                {result.scores?.[result.loserId === user?.id ? result.winnerId : result.loserId] ?? '--'}%
              </div>
              <div style={{ fontSize: '12px', color: '#55556a', marginTop: '4px' }}>
                {result.times?.[result.loserId === user?.id ? result.winnerId : result.loserId]
                  ? `${(result.times[result.loserId === user?.id ? result.winnerId : result.loserId] / 1000).toFixed(1)}s`
                  : '—'}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '16px', paddingTop: '16px',
            borderTop: '1px solid #1a1a24',
            display: 'flex', justifyContent: 'space-between',
            fontSize: '13px', color: '#55556a',
          }}>
            <span>Platform fee</span>
            <span>₹{result.platformFee}</span>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ display: 'flex', gap: '12px' }}
        >
          <Button variant="secondary" size="lg" style={{ flex: 1 }} onClick={handlePlayAgain}>
            <RotateCcw size={16}/>
            Play again
          </Button>
          <Link href="/" style={{ flex: 1 }}>
            <Button variant="ghost" size="lg" fullWidth>
              <Home size={16}/>
              Home
            </Button>
          </Link>
        </motion.div>

        {isWinner && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ marginTop: '16px', fontSize: '13px', color: '#10b981' }}
          >
            ₹{result.netPrize} has been added to your wallet
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}