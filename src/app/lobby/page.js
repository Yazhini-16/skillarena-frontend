'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Wallet, Layers, Hash, Type, Calculator, GitBranch, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { useMatchStore } from '@/store/matchStore';
import { useWalletStore } from '@/store/walletStore';
import { connectSocket } from '@/lib/socket';
import { useRequireAuth } from '@/hooks/useRequireAuth';
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
  {
    id: 'all',
    label: 'All Topics',
    icon: <Layers size={10}/>,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.35)',
  },
  {
    id: 'arrays',
    label: 'Arrays',
    icon: <Hash size={10}/>,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.35)',
  },
  {
    id: 'strings',
    label: 'Strings',
    icon: <Type size={10}/>,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.35)',
  },
  {
    id: 'math',
    label: 'Math',
    icon: <Calculator size={10}/>,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
  },
  {
    id: 'algorithms',
    label: 'Algorithms',
    icon: <GitBranch size={10}/>,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.35)',
  },
  {
    id: 'data-structures',
    label: 'Data Structures',
    icon: <Database size={10}/>,
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.12)',
    border: 'rgba(236,72,153,0.35)',
  },
];

export default function LobbyPage() {
  const ready = useRequireAuth();
  const [selectedFee,      setSelectedFee]      = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inQueue,          setInQueue]          = useState(false);
  const [queueTime,        setQueueTime]        = useState(0);
  const socketRef = useRef(null);
  const timerRef  = useRef(null);

  const { setMatch }           = useMatchStore();
  const { balance, setWallet } = useWalletStore();
  const router                 = useRouter();

  useEffect(() => {
    if (!ready) return;
    api.get('/api/wallet').then(res => setWallet(res.data.data)).catch(() => {});

    const socket = connectSocket();
    if (!socket) return;
    socketRef.current = socket;

    const onJoined  = () => { setInQueue(true); toast.success('In queue — finding opponent...'); };
    const onError   = (d) => { toast.error(d.message); setInQueue(false); };
    const onReady   = (d) => { setMatch(d); toast.success('Opponent found!'); router.push('/match'); };

    socket.on('queue:joined', onJoined);
    socket.on('queue:error',  onError);
    socket.on('match:ready',  onReady);

    return () => {
      socket.off('queue:joined', onJoined);
      socket.off('queue:error',  onError);
      socket.off('match:ready',  onReady);
    };
  }, [ready]);

  useEffect(() => {
    if (inQueue) {
      timerRef.current = setInterval(() => setQueueTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setQueueTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [inQueue]);

  const joinQueue = async () => {
    if (!selectedFee) { toast.error('Select an entry fee first'); return; }
    if (balance < selectedFee) { toast.error('Insufficient balance'); router.push('/wallet'); return; }
    const socket = socketRef.current;
    if (!socket?.connected) { toast.error('Not connected. Refresh.'); return; }
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {}
    socket.emit('queue:join', { entryFee: selectedFee, category: selectedCategory });
  };

  const leaveQueue = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    socketRef.current?.emit('queue:leave');
    setInQueue(false);
    toast('Left the queue');
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const difficultyVariant = (d) => d === 'Easy' ? 'success' : d === 'Medium' ? 'warning' : 'danger';
  const selectedCat = CATEGORIES.find(c => c.id === selectedCategory);

  if (!ready) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#8888aa' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <Navbar/>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>Choose your battle</h1>
          <p style={{ color: '#8888aa' }}>Pick a topic and entry fee. Get matched instantly. Code to win.</p>
        </div>

        {balance < 10 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '10px', padding: '14px 18px', marginBottom: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span style={{ color: '#f59e0b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={16}/> Balance ₹{parseFloat(balance).toFixed(2)} — add funds to compete.
            </span>
            <Button size="sm" onClick={() => router.push('/wallet')}>Add funds</Button>
          </motion.div>
        )}

        {/* Category selector — large, colorful, icon-driven */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '12px', color: '#55556a', marginBottom: '14px', fontWeight: 600, letterSpacing: '0.08em' }}>
            CHOOSE TOPIC
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: '6px',
            overflow: 'hidden',
          }}>
            {CATEGORIES.map(cat => {
              const active = selectedCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => !inQueue && setSelectedCategory(cat.id)}
                  whileHover={!inQueue ? { scale: 1.03, y: -2 } : {}}
                  whileTap={!inQueue ? { scale: 0.97 } : {}}
                  style={{
                    padding: '8px 10px',
                    height: '48px',
                    background: active ? cat.bg : '#111118',
                    border: `1.5px solid ${active ? cat.border : '#2a2a3a'}`,
                    borderRadius: '14px',
                    cursor: inQueue ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '10px',
                    transition: 'all 0.15s',
                    boxShadow: active ? `0 0 16px ${cat.bg}` : 'none',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '6px',
                    background: active ? cat.bg : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? cat.border : '#2a2a3a'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: active ? cat.color : '#55556a',
                    transition: 'all 0.15s',
                  }}>
                    {cat.icon}
                  </div>
                  <span style={{
                    fontSize: '12px', fontWeight: active ? 600 : 500,
                    color: active ? cat.color : '#8888aa',
                    whiteSpace: 'nowrap',
                  }}>
                    {cat.label}
                  </span>
                  {active && (
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: cat.color,
                    }}/>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Entry fee grid */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#55556a', marginBottom: '14px', fontWeight: 600, letterSpacing: '0.08em' }}>
            CHOOSE ENTRY FEE
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '14px', marginBottom: '32px',
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
                  opacity: locked ? 0.4 : 1,
                }}
              >
                {tier.popular && (
                  <div style={{
                    position: 'absolute', top: '-10px', left: '16px',
                    background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                    padding: '2px 10px', borderRadius: '10px',
                    fontSize: '10px', fontWeight: 700, color: '#fff',
                  }}>POPULAR</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#8888aa', marginBottom: '4px' }}>{tier.label}</div>
                    <div style={{ fontSize: '28px', fontWeight: 700 }}>₹{tier.fee}</div>
                  </div>
                  <Badge variant={difficultyVariant(tier.difficulty)}>{tier.difficulty}</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #1a1a24' }}>
                  <span style={{ fontSize: '13px', color: '#8888aa' }}>Prize pool</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>₹{tier.prize}</span>
                </div>
                {selected && (
                  <motion.div
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
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
                <Zap size={20} fill="currentColor"/>
                {selectedFee
                  ? `Enter match — ₹${selectedFee} · ${selectedCat?.label}`
                  : 'Select an entry fee to continue'}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="queue"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{
                background: '#111118', border: `1px solid ${selectedCat?.border || '#2a2a3a'}`,
                borderRadius: '16px', padding: '40px', textAlign: 'center',
                boxShadow: `0 0 40px ${selectedCat?.bg || 'transparent'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                {[0,1,2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1,1.5,1], opacity: [0.4,1,0.4] }}
                    transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                    style={{ width: 10, height: 10, borderRadius: '50%', background: selectedCat?.color || '#7c3aed' }}
                  />
                ))}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Finding opponent...</div>
              <div style={{ color: '#8888aa', fontSize: '14px', marginBottom: '4px' }}>
                <span style={{ color: selectedCat?.color }}>
                  {selectedCat?.icon && (
                    <span style={{ verticalAlign: 'middle', marginRight: '4px' }}>{selectedCat.icon}</span>
                  )}
                  {selectedCat?.label}
                </span>
                {' · '}
                <strong style={{ color: '#f0f0f5' }}>₹{selectedFee}</strong>
                {' · Prize '}
                <strong style={{ color: '#10b981' }}>₹{ENTRY_FEES.find(f => f.fee === selectedFee)?.prize}</strong>
              </div>
              <div style={{
                fontSize: '40px', fontWeight: 800,
                color: selectedCat?.color || '#8b5cf6',
                margin: '20px 0', fontVariantNumeric: 'tabular-nums',
              }}>
                {formatTime(queueTime)}
              </div>
              <Button variant="ghost" size="sm" onClick={leaveQueue}>Cancel search</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}