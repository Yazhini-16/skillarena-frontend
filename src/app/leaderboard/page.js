'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, TrendingUp } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Badge from '@/components/ui/Badge';
import api from '@/lib/api';

export default function LeaderboardPage() {
  const [players, setPlayers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [period,  setPeriod]    = useState('all');

  useEffect(() => {
    api.get(`/api/users/leaderboard?period=${period}`)
      .then(res => setPlayers(res.data.data || []))
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, [period]);

  const rankColor = (i) => {
    if (i === 0) return '#fbbf24';
    if (i === 1) return '#94a3b8';
    if (i === 2) return '#f97316';
    return '#55556a';
  };

  const rankIcon = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <Navbar/>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '10px',
            background: 'linear-gradient(135deg,#f59e0b,#d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trophy size={20} color="#fff"/>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700 }}>Leaderboard</h1>
        </div>
        <p style={{ color: '#8888aa', marginBottom: '32px' }}>
          Top players ranked by skill rating and wins.
        </p>

        {/* Period filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          {[
            { id: 'all',   label: 'All Time'   },
            { id: 'week',  label: 'This Week'  },
            { id: 'month', label: 'This Month' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => { setPeriod(p.id); setLoading(true); }}
              style={{
                padding: '7px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                background: period === p.id ? 'rgba(124,58,237,0.2)' : '#111118',
                border: `1px solid ${period === p.id ? '#7c3aed' : '#2a2a3a'}`,
                color: period === p.id ? '#8b5cf6' : '#8888aa',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#55556a' }}>Loading...</div>
        ) : players.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px',
            background: '#111118', borderRadius: '12px',
            border: '1px solid #2a2a3a', color: '#55556a',
          }}>
            No players yet. Be the first to compete!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {players.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  background: i < 3 ? `rgba(${i===0?'251,191,36':i===1?'148,163,184':'249,115,22'},0.06)` : '#111118',
                  border: `1px solid ${i < 3 ? rankColor(i) + '40' : '#2a2a3a'}`,
                  borderRadius: '12px', padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                }}
              >
                {/* Rank */}
                <div style={{
                  fontSize: i < 3 ? '22px' : '14px',
                  fontWeight: 700, minWidth: '36px',
                  color: rankColor(i), textAlign: 'center',
                }}>
                  {rankIcon(i)}
                </div>

                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `hsl(${(player.username?.charCodeAt(0) || 0) * 30},50%,20%)`,
                  border: `2px solid ${rankColor(i)}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', fontWeight: 700, color: rankColor(i),
                  flexShrink: 0,
                }}>
                  {player.username?.[0]?.toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '3px' }}>
                    {player.username}
                  </div>
                  <div style={{ fontSize: '12px', color: '#55556a', display: 'flex', gap: '12px' }}>
                    <span>{player.matches_played} matches</span>
                    <span style={{ color: '#10b981' }}>
                      {player.matches_played > 0
                        ? `${Math.round((player.matches_won / player.matches_played) * 100)}% win rate`
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '18px', fontWeight: 700,
                    color: i < 3 ? rankColor(i) : '#f0f0f5',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <TrendingUp size={14}/>
                    {player.skill_rating}
                  </div>
                  <div style={{ fontSize: '11px', color: '#55556a', marginTop: '2px' }}>
                    {player.matches_won}W / {player.matches_played - player.matches_won}L
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}