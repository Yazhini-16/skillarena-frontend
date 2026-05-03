import { create } from 'zustand';

export const useWalletStore = create((set) => ({
  balance: 0,
  lockedBalance: 0,
  transactions: [],

  setWallet: (data) => set({
    balance: parseFloat(data.balance || 0),
    lockedBalance: parseFloat(data.locked_balance || 0),
  }),

  setTransactions: (txns) => set({ transactions: txns }),
  updateBalance: (newBalance) => set({ balance: parseFloat(newBalance) }),
  clearWallet: () => set({ balance: 0, lockedBalance: 0, transactions: [] }),
}));