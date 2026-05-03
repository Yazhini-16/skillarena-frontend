'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', form);
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success(`Welcome back, ${user.username}!`);
      router.push('/lobby');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px', justifyContent: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={20} color="#fff" fill="#fff"/>
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700 }}>
            Skill<span style={{ color: '#8b5cf6' }}>Arena</span>
          </span>
        </Link>

        <div style={{
          background: '#111118', border: '1px solid #2a2a3a',
          borderRadius: '16px', padding: '32px',
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Welcome back</h1>
          <p style={{ color: '#8888aa', marginBottom: '28px', fontSize: '14px' }}>
            Log in to continue competing
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              icon={<Mail size={16}/>}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              icon={<Lock size={16}/>}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <Button
            fullWidth size="lg"
            onClick={handleSubmit}
            loading={loading}
            style={{ marginTop: '24px' }}
          >
            Log in
          </Button>

          <p style={{ textAlign: 'center', marginTop: '20px', color: '#8888aa', fontSize: '14px' }}>
            No account?{' '}
            <Link href="/register" style={{ color: '#8b5cf6', fontWeight: 500 }}>
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}