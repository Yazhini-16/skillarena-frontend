'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, Clock, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';

import { useAuthStore } from '@/store/authStore';
import { useWalletStore } from '@/store/walletStore';

import { useRequireAuth } from '@/hooks/useRequireAuth';

import api from '@/lib/api';

const TX_CONFIG = {
  DEPOSIT:           { label: 'Deposit',      color: '#10b981', icon: '+', sign: '+' },
  WITHDRAWAL:        { label: 'Withdrawal',   color: '#ef4444', icon: '-', sign: '-' },
  MATCH_ENTRY_DEBIT: { label: 'Match entry',  color: '#f59e0b', icon: '-', sign: '-' },
  MATCH_WIN_CREDIT:  { label: 'Match won',    color: '#10b981', icon: '+', sign: '+' },
  MATCH_LOSS_DEBIT:  { label: 'Match lost',   color: '#ef4444', icon: '-', sign: '-' },
  REFUND:            { label: 'Refund',       color: '#8b5cf6', icon: '+', sign: '+' },
  PLATFORM_FEE:      { label: 'Platform fee', color: '#55556a', icon: '-', sign: '-' },
};

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000];

export default function WalletPage() {
  const ready = useRequireAuth();

  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading]             = useState(false);
  const [txLoading, setTxLoading]         = useState(true);

  const { user } = useAuthStore();

  const {
    balance,
    lockedBalance,
    transactions,
    setWallet,
    setTransactions,
    updateBalance,
  } = useWalletStore();

  useEffect(() => {
    if (!ready) return;
    loadWallet();
  }, [ready]);

  const loadWallet = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        api.get('/api/wallet'),
        api.get('/api/wallet/transactions?limit=30'),
      ]);

      setWallet(walletRes.data.data);
      setTransactions(txRes.data.data);

    } catch {
      toast.error('Failed to load wallet');
    } finally {
      setTxLoading(false);
    }
  };

  const handleRazorpayPayment = useCallback(async () => {
    const amount = parseFloat(depositAmount);

    if (!amount || amount < 10) {
      toast.error('Minimum deposit is ₹10');
      return;
    }

    if (amount > 10000) {
      toast.error('Maximum deposit is ₹10,000');
      return;
    }

    setLoading(true);

    try {
      const orderRes = await api.post('/api/payments/create-order', { amount });

      const { orderId, keyId } = orderRes.data.data;

      const options = {
        key: keyId,
        amount: amount * 100,
        currency: 'INR',
        name: 'SkillArena',
        description: 'Wallet Top-up',
        order_id: orderId,

        prefill: {
          name: user?.username || '',
          email: user?.email || '',
        },

        theme: {
          color: '#7c3aed',
          backdrop_color: 'rgba(10,10,15,0.8)',
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
            toast('Payment cancelled', { icon: '🚫' });
          },
        },

        handler: async (response) => {
          try {
            const verifyRes = await api.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            const {
              balance: newBalance,
              amount: creditedAmount,
            } = verifyRes.data.data;

            updateBalance(newBalance);

            setDepositAmount('');

            toast.success(`₹${creditedAmount} added to your wallet!`);

            loadWallet();

          } catch (err) {
            toast.error(
              err.response?.data?.message || 'Payment verification failed'
            );
          } finally {
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });

      rzp.open();

    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to initiate payment'
      );

      setLoading(false);
    }
  }, [depositAmount, user]);

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: '#8888aa' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <Navbar />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px' }}>
          Wallet
        </h1>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '32px',
          }}
        >

          {/* Balance card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'linear-gradient(135deg, #1a1a24, #111118)',
              border: '1px solid #2a2a3a',
              borderRadius: '16px',
              padding: '28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                color: '#8888aa',
                fontSize: '13px',
              }}
            >
              <Wallet size={14} />
              Available balance
            </div>

            <div
              style={{
                fontSize: '44px',
                fontWeight: 800,
                color: '#f0f0f5',
                letterSpacing: '-0.02em',
              }}
            >
              ₹{parseFloat(balance).toFixed(2)}
            </div>

            {lockedBalance > 0 && (
              <div
                style={{
                  fontSize: '13px',
                  color: '#f59e0b',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Clock size={12} />
                ₹{parseFloat(lockedBalance).toFixed(2)} in active match
              </div>
            )}
          </motion.div>

          {/* Deposit card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: '#111118',
              border: '1px solid #2a2a3a',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                color: '#8888aa',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={14} />
              Add funds
            </div>

            {/* Quick amounts */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                marginBottom: '14px',
                flexWrap: 'wrap',
              }}
            >
              {QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => setDepositAmount(String(amt))}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    background:
                      depositAmount === String(amt)
                        ? 'rgba(124,58,237,0.2)'
                        : '#1a1a24',
                    border: `1px solid ${
                      depositAmount === String(amt)
                        ? '#7c3aed'
                        : '#2a2a3a'
                    }`,
                    color:
                      depositAmount === String(amt)
                        ? '#8b5cf6'
                        : '#8888aa',
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                  }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {/* Custom amount input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="number"
                placeholder="Custom amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleRazorpayPayment()
                }
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: '#0a0a0f',
                  border: '1px solid #2a2a3a',
                  borderRadius: '8px',
                  color: '#f0f0f5',
                  fontSize: '14px',
                }}
              />

              <Button
                onClick={handleRazorpayPayment}
                loading={loading}
                disabled={!depositAmount}
              >
                Pay
              </Button>
            </div>

            {/* Trust badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#55556a',
              }}
            >
              <Shield size={12} color="#10b981" />
              <span>
                Secured by Razorpay · UPI, Cards, Net Banking
              </span>
            </div>
          </motion.div>
        </div>

        {/* Transaction history */}
        <div>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            Transaction history
          </h2>

          {txLoading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#55556a',
              }}
            >
              Loading...
            </div>
          ) : transactions.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px',
                color: '#55556a',
                background: '#111118',
                border: '1px solid #2a2a3a',
                borderRadius: '12px',
                fontSize: '14px',
              }}
            >
              No transactions yet. Add funds to get started.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {transactions.map((tx, i) => {
                const config = TX_CONFIG[tx.type] || TX_CONFIG.DEPOSIT;

                const isCredit = config.sign === '+';

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    style={{
                      background: '#111118',
                      border: '1px solid #2a2a3a',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: `${config.color}18`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: config.color,
                          fontSize: '16px',
                          fontWeight: 700,
                        }}
                      >
                        {config.icon}
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 500,
                          }}
                        >
                          {config.label}
                        </div>

                        <div
                          style={{
                            fontSize: '12px',
                            color: '#55556a',
                            marginTop: '2px',
                          }}
                        >
                          {new Date(tx.created_at).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: isCredit ? '#10b981' : '#ef4444',
                        }}
                      >
                        {config.sign}₹{parseFloat(tx.amount).toFixed(2)}
                      </div>

                      <div
                        style={{
                          fontSize: '12px',
                          color: '#55556a',
                        }}
                      >
                        Bal: ₹{parseFloat(tx.balance_after).toFixed(2)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}