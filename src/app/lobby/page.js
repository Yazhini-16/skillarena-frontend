'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { useMatchStore } from '@/store/matchStore';
import { useWalletStore } from '@/store/walletStore';
import { connectSocket } from '@/lib/socket';
import api from '@/lib/api';

const ENTRY_FEES = [
  { fee: 10,  prize: 18,  label: 'Starter',  difficulty: 'Easy',   popular: false },
  { fee: 25,  prize: 45,  label: 'Rookie',   difficulty: 'Easy',   popular: false },
  { fee: 50,  prize: 90,  label: 'Pro',      difficulty: 'Medium', popular: true  },
  { fee: 100, prize: 180, label: 'Elite',    difficulty: 'Medium', popular: false },
  { fee: 200, prize: 360, label: 'Champion', difficulty: 'Hard',   popular: false },
  { fee: 500, prize: 900, label: 'Legend',   difficulty: 'Hard',   popular: false },
];

const CATEGORIES = [
  { id: 'all',             label: 'All'             },
  { id: 'arrays',          label: 'Arrays'          },
  { id: 'strings',         label: 'Strings'         },
  { id: 'math',            label: 'Math'            },
  { id: 'algorithms',      label: 'Algorithms'      },
  { id: 'data-structures', label: 'Data Structures' },
];

export default function LobbyPage() {
  const [selectedFee,      setSelectedFee]      = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inQueue,          setInQueue]          = useState(false);
  const [queueTime,        setQueueTime]        = useState(0);
  const socketRef  = useRef(null);
  const timerRef   = useRef(null);

  const { isAuthenticated }    = useAuthStore();
  const { setMatch }           = useMatchStore();
  const { balance, setWallet } = useWalletStore();
  const router                 = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }

    api.get('/api/wallet')
      .then(res => setWallet(res.data.data))
      .catch(() => {});

    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('queue:joined', () => {
      setInQueue(true);
      toast.success('In queue — finding opponent...');
    });

    socket.on('queue:error', (data) => {
      toast.error(data.message);
      setInQueue(false);
    });

    socket.on('match:ready', (data) => {
      setMatch(data);
      toast.success('Opponent found! Starting match...');
      router.push('/match');
    });

    return () => {
      socket.off('queue:joined');
      socket.off('queue:error');
      socket.off('match:ready');
    };
  }, [isAuthenticated]);

  // Queue timer
  useEffect(() => {
    if (inQueue) {
      timerRef.current = setInterval(() => setQueueTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setQueueTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [inQueue]);

  const joinQueue = () => {
    if (!selectedFee) { toast.error('Select an entry fee first'); return; }
    if (balance < selectedFee) {
      toast.error('Insufficient balance — add funds first');
      router.push('/wallet');
      return;
    }
    const socket = connectSocket();
    socketRef.current = socket;
    // category is passed here so the server picks a problem from that category
    socket.emit('queue:join', { entryFee: selectedFee, category: selectedCategory });
  };

  const leaveQueue = () => {
    socketRef.current?.emit('queue:leave');
    setInQueue(false);
    toast('Left the queue');
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const difficultyVariant = (d) =>
    d === 'Easy' ? 'success' : d === 'Medium' ? 'warning' : 'danger';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
            Choose your battle
          </h1>
          <p style={{ color: '#8888aa' }}>
            Select a category, pick an entry fee, get matched, code faster than your opponent.
          </p>
        </div>

        {/* Low balance warning */}
        {balance < 10 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '10px', padding: '14px 18px',
              marginBottom: '24px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b', fontSize: '14px' }}>
              <Wallet size={16} />
              Your balance is ₹{parseFloat(balance).toFixed(2)}. Add funds to compete.
            </div>
            <Button size="sm" onClick={() => router.push('/wallet')}>
              Add funds
            </Button>
          </motion.div>
        )}

        {/* Category selector */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', color: '#8888aa', marginBottom: '10px', fontWeight: 500 }}>
            Problem category
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => !inQueue && setSelectedCategory(cat.id)}
                style={{
                  padding: '6px 16px', borderRadius: '20px',
                  fontSize: '13px', fontWeight: 500,
                  background: selectedCategory === cat.id
                    ? 'rgba(124,58,237,0.2)' : '#111118',
                  border: `1px solid ${selectedCategory === cat.id ? '#7c3aed' : '#2a2a3a'}`,
                  color: selectedCategory === cat.id ? '#8b5cf6' : '#8888aa',
                  cursor: inQueue ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Entry fee grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px', marginBottom: '32px',
        }}>
          {ENTRY_FEES.map((tier) => {
            const locked   = balance < tier.fee;
            const selected = selectedFee === tier.fee;
            return (
              <motion.div
                key={tier.fee}
                whileHover={!inQueue && !locked ? { scale: 1.02 } : {}}
                whileTap={!inQueue && !locked ? { scale: 0.98 } : {}}
                onClick={() => !inQueue && !locked && setSelectedFee(tier.fee)}
                style={{
                  background: selected ? 'rgba(124,58,237,0.1)' : '#111118',
                  border: `1px solid ${selected ? '#7c3aed' : '#2a2a3a'}`,
                  borderRadius: '12px', padding: '20px',
                  cursor: inQueue || locked ? 'not-allowed' : 'pointer',
                  position: 'relative', transition: 'all 0.15s',
                  opacity: locked ? 0.45 : 1,
                }}
              >
                {tier.popular && (
                  <div style={{
                    position: 'absolute', top: '-10px', left: '16px',
                    background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                    padding: '2px 10px', borderRadius: '10px',
                    fontSize: '10px', fontWeight: 700, color: '#fff',
                    letterSpacing: '0.05em',
                  }}>POPULAR</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#8888aa', marginBottom: '4px' }}>{tier.label}</div>
                    <div style={{ fontSize: '28px', fontWeight: 700 }}>₹{tier.fee}</div>
                  </div>
                  <Badge variant={difficultyVariant(tier.difficulty)}>{tier.difficulty}</Badge>
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  paddingTop: '16px', borderTop: '1px solid #1a1a24',
                }}>
                  <span style={{ fontSize: '13px', color: '#8888aa' }}>Prize pool</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>₹{tier.prize}</span>
                </div>

                {selected && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: '2px', background: '#7c3aed',
                      borderRadius: '0 0 12px 12px', transformOrigin: 'left',
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Queue CTA */}
        <AnimatePresence mode="wait">
          {!inQueue ? (
            <motion.div key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button size="xl" fullWidth onClick={joinQueue} disabled={!selectedFee}>
                <Zap size={20} fill="currentColor" />
                {selectedFee
                  ? `Enter match — ₹${selectedFee} · ${CATEGORIES.find(c => c.id === selectedCategory)?.label}`
                  : 'Select an entry fee'}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="queue"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: '#111118', border: '1px solid #2a2a3a',
                borderRadius: '16px', padding: '40px', textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                    style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c3aed' }}
                  />
                ))}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                Finding opponent...
              </div>
              <div style={{ color: '#8888aa', fontSize: '14px', marginBottom: '4px' }}>
                Entry fee: <strong style={{ color: '#f0f0f5' }}>₹{selectedFee}</strong>
                {' · '}
                Category: <strong style={{ color: '#8b5cf6' }}>
                  {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                </strong>
              </div>
              <div style={{
                fontSize: '36px', fontWeight: 800, color: '#8b5cf6',
                margin: '20px 0', fontVariantNumeric: 'tabular-nums',
              }}>
                {formatTime(queueTime)}
              </div>
              <Button variant="ghost" size="sm" onClick={leaveQueue}>
                Cancel search
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}