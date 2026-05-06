'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, Shield, Clock, Trophy, ChevronRight, Code2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';

import { useAuthStore } from '@/store/authStore';

const features = [
  { icon: <Code2 size={22}/>, title: 'Real coding challenges', desc: 'Solve actual algorithmic problems. Skill decides the winner, nothing else.' },
  { icon: <Clock size={22}/>, title: 'Live 1v1 battles', desc: 'Matched in seconds. Same problem, same clock. First to solve wins.' },
  { icon: <Shield size={22}/>, title: 'Secure & fair', desc: 'Server-authoritative judging. Every submission verified against hidden test cases.' },
  { icon: <Trophy size={22}/>, title: 'Real prizes', desc: 'Win up to 1.8× your entry. Platform takes only 10%. You keep the rest.' },
];

const entryFees = [
  { fee: 10, prize: 18, label: 'Starter' },
  { fee: 25, prize: 45, label: 'Rookie' },
  { fee: 50, prize: 90, label: 'Pro' },
  { fee: 100, prize: 180, label: 'Elite' },
  { fee: 200, prize: 360, label: 'Champion' },
  { fee: 500, prize: 900, label: 'Legend' },
];


export default function LandingPage() {
   const { isAuthenticated } = useAuthStore();
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <Navbar/>

      {/* Hero */}
      // In the Hero section — replace the buttons div:
<div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
  <Link href={isAuthenticated ? '/lobby' : '/register'}>
  <Button size="xl">
    {isAuthenticated ? 'Go to lobby' : 'Create your account'} <ChevronRight size={18}/>
  </Button>
</Link>
  <Link href={isAuthenticated ? '/lobby' : '/login'}>
    <Button variant="secondary" size="xl">
      {isAuthenticated ? 'Go to lobby' : 'Log in'}
    </Button>
  </Link>
</div>
      <section style={{
        padding: '100px 24px 80px',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative',
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '40px', left: '50%',
          transform: 'translateX(-50%)',
          width: '600px', height: '300px',
          background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)', borderRadius: '20px',
            fontSize: '13px', color: '#8b5cf6', marginBottom: '32px',
          }}>
            <Zap size={13} fill="#8b5cf6"/>
            Live 1v1 coding battles
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 7vw, 72px)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '24px',
            color: '#f0f0f5',
          }}>
            Code smarter.<br/>
            <span style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Win bigger.
            </span>
          </h1>

          <p style={{
            fontSize: '18px', color: '#8888aa', lineHeight: 1.7,
            marginBottom: '40px', maxWidth: '560px', margin: '0 auto 40px',
          }}>
            Compete in real-time coding duels. Pay an entry fee, solve the problem faster than your opponent, and walk away with the prize.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register">
              <Button size="xl">
                Start competing <ChevronRight size={18}/>
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="xl">
                Watch a match
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats bar */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          borderTop: '1px solid #1a1a24',
          borderBottom: '1px solid #1a1a24',
          padding: '24px',
          display: 'flex',
          justifyContent: 'center',
          gap: '64px',
          flexWrap: 'wrap',
        }}
      >
        {[
          { value: '2,341', label: 'Matches played' },
          { value: '₹1.2L', label: 'Prizes paid out' },
          { value: '< 5s', label: 'Avg matchmaking' },
          { value: '98.7%', label: 'Uptime' },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#8b5cf6' }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: '#8888aa', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </motion.section>

      {/* Entry fee tiers */}
      <section style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 700, textAlign: 'center', marginBottom: '12px' }}>
          Pick your stake
        </h2>
        <p style={{ textAlign: 'center', color: '#8888aa', marginBottom: '48px', fontSize: '16px' }}>
          From casual to high-stakes — every tier is skill-only.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px',
        }}>
          {entryFees.map((tier, i) => (
            <motion.div
              key={tier.fee}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.04, borderColor: '#7c3aed' }}
              style={{
                background: '#111118',
                border: `1px solid ${tier.fee === 50 ? '#7c3aed' : '#2a2a3a'}`,
                borderRadius: '12px',
                padding: '20px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              {tier.fee === 50 && (
                <div style={{
                  position: 'absolute', top: '-10px', left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  padding: '2px 10px', borderRadius: '10px',
                  fontSize: '10px', fontWeight: 600, color: '#fff',
                  whiteSpace: 'nowrap',
                }}>POPULAR</div>
              )}
              <div style={{ fontSize: '11px', color: '#55556a', marginBottom: '4px', fontWeight: 500 }}>
                {tier.label}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#f0f0f5' }}>₹{tier.fee}</div>
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                Win ₹{tier.prize}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{
        padding: '80px 24px',
        background: '#0d0d14',
        borderTop: '1px solid #1a1a24',
        borderBottom: '1px solid #1a1a24',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, textAlign: 'center', marginBottom: '48px' }}>
            How it works
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { step: '01', title: 'Add funds to wallet', desc: 'Deposit any amount. Funds are held securely until your match resolves.' },
              { step: '02', title: 'Pick your entry fee', desc: 'Choose from ₹10 to ₹500. Higher stakes = harder problems.' },
              { step: '03', title: 'Get matched instantly', desc: 'We find an opponent at the same tier in under 5 seconds.' },
              { step: '04', title: 'Solve the problem', desc: 'Same problem, same 30-minute clock. Code in JS, Python, C++, or Java.' },
              { step: '05', title: 'Winner gets paid', desc: 'Server validates both solutions. Faster correct solution wins the prize pool.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                style={{
                  display: 'flex', gap: '24px', alignItems: 'flex-start',
                  padding: '24px 0',
                  borderBottom: i < 4 ? '1px solid #1a1a24' : 'none',
                }}
              >
                <div style={{
                  fontSize: '12px', fontWeight: 700,
                  color: '#7c3aed', minWidth: '32px',
                  fontVariantNumeric: 'tabular-nums',
                  paddingTop: '2px',
                }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ fontSize: '14px', color: '#8888aa', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 700, textAlign: 'center', marginBottom: '48px' }}>
          Built for serious players
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              style={{
                background: '#111118',
                border: '1px solid #2a2a3a',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex', gap: '16px',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '10px',
                background: 'rgba(124,58,237,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#8b5cf6', flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '6px' }}>{f.title}</div>
                <div style={{ fontSize: '14px', color: '#8888aa', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '80px 24px',
        textAlign: 'center',
        borderTop: '1px solid #1a1a24',
      }}>
        <h2 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '16px' }}>
          Ready to compete?
        </h2>
        <p style={{ color: '#8888aa', marginBottom: '32px', fontSize: '16px' }}>
          Join thousands of developers testing their skills daily.
        </p>
        <Link href="/register">
          <Button size="xl">
            Create your account <ChevronRight size={18}/>
          </Button>
        </Link>
        
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1a1a24',
        padding: '24px',
        textAlign: 'center',
        color: '#55556a',
        fontSize: '13px',
      }}>
        © 2026 SkillArena · Skill-based competition platform · Not gambling
      </footer>
    </div>
  );
}