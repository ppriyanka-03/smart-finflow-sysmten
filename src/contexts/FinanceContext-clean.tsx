import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface Transaction {
  id: string;
  type: 'payment' | 'emi' | 'cashback' | 'income';
  description: string;
  amount: number;
  date: string;
  method?: string;
  recipient?: string;
  cashbackEarned?: number;
}

export interface EMILoan {
  id: string;
  name: string;
  principal: number;
  rate: number;
  tenure: number;
  emi: number;
  totalInterest: number;
  totalPayable: number;
  paidMonths: number;
  startDate: string;
}

export interface InvestmentItem {
  id: string;
  investedAmount: number;
  currentValue: number;
  [key: string]: unknown;
}

export interface BankAccount {
  id: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolder?: string;
  balance: number;
  isDefault?: boolean;
}

interface FinanceState {
  totalBalance: number;
  walletBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  investmentValue: number;
  totalCashback: number;
  monthCashback: number;
  transactions: Transaction[];
  emiLoans: EMILoan[];
  investments: InvestmentItem[];
  bankAccounts: BankAccount[];
}

interface FinanceContextType extends FinanceState {
  makePayment: (recipient: string, amount: number, method: string, description: string) => { success: boolean; cashback: number };
  redeemCashback: (amount: number) => boolean;
  addEMI: (loan: Omit<EMILoan, 'id' | 'paidMonths' | 'startDate'>) => void;
  payEMI: (loanId: string) => boolean;
  transferToSavingsGoal: (amount: number, source: 'Wallet' | 'Bank', bankAccountId?: string) => { success: boolean; message?: string };
  setBankAccounts: (accounts: BankAccount[]) => void;
  addBankAccount: (account: BankAccount) => void;
  updateBankAccount: (account: BankAccount) => void;
  removeBankAccount: (id: string) => void;
}

const defaultState: FinanceState = {
  totalBalance: 538500,
  walletBalance: 42500,
  monthlyIncome: 125000,
  monthlyExpenses: 68500,
  savings: 156000,
  investmentValue: 340000,
  totalCashback: 3250,
  monthCashback: 850,
  transactions: [
    { id: '1', type: 'income', description: 'Salary Credit', amount: 125000, date: '2026-02-01' },
  ],
  emiLoans: [],
  investments: [],
  bankAccounts: [],
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const normalizeNumber = (value: unknown, fallback?: number) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
};

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<FinanceState>(() => {
    try {
      const savedData = localStorage.getItem("financeData") || localStorage.getItem('sf_finance');

      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed && Object.keys(parsed).length > 0) {
          return {
            ...defaultState,
            ...parsed,
            walletBalance: normalizeNumber(parsed.walletBalance, defaultState.walletBalance),
            savings: normalizeNumber(parsed.savingsGoal ?? parsed.savings, defaultState.savings),
            investmentValue: normalizeNumber(parsed.investmentValue, defaultState.investmentValue),
            totalCashback: normalizeNumber(parsed.totalCashback, defaultState.totalCashback),
            monthCashback: normalizeNumber(parsed.monthCashback, defaultState.monthCashback),
            monthlyIncome: normalizeNumber(parsed.monthlyIncome, defaultState.monthlyIncome),
            monthlyExpenses: normalizeNumber(parsed.monthlyExpenses, defaultState.monthlyExpenses),
            totalBalance: normalizeNumber(parsed.totalBalance, defaultState.totalBalance),
          };
        }
      }

      return defaultState;
    } catch (error) {
      console.error('Storage error:', error);
      return defaultState;
    }
  });

  const computedTotalBalance = state.bankAccounts.reduce((sum, account) => sum + (account.balance || 0), 0)
    + state.walletBalance
    + state.savings
    + state.investmentValue;

  // Auto save data
  useEffect(() => {
    localStorage.setItem("financeData", JSON.stringify({
      ...state,
      bankAccounts: state.bankAccounts,
      walletBalance: state.walletBalance,
      transactions: state.transactions,
      savingsGoal: state.savings,
      investments: state.investments,
      totalBalance: computedTotalBalance
    }));
  }, [state.bankAccounts, state.walletBalance, state.transactions, state.savings, state.investments, state, computedTotalBalance]);

  const { user } = useAuth();
  const fetchFinanceData = useCallback(async () => {
    if (!user) return;
    console.log('Using local finance data for user');
    
    // Use local mock data
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'income',
        description: 'Monthly Salary',
        amount: 125000,
        date: new Date().toISOString().split('T')[0],
        method: 'Bank Transfer'
      },
      {
        id: '2',
        type: 'payment',
        description: 'Rent Payment',
        amount: 28500,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        method: 'Bank Transfer'
      }
    ];

    const income = mockTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = mockTransactions
      .filter(t => t.type === 'payment' || t.type === 'emi')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    setState(prev => ({
      ...prev,
      walletBalance: balance,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      transactions: mockTransactions,
    }));

  }, [user]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  // Payment function
  const makePayment = useCallback((recipient: string, amount: number, method: string, description: string) => {
    if (method === 'Wallet' && state.walletBalance < amount) {
      console.error("Insufficient wallet balance.");
      return { success: false, cashback: 0 };
    }

    let cashbackRate = 0;
    if (method === 'Wallet') cashbackRate = 0.05;
    else if (method === 'Card') cashbackRate = 0.02;
    else if (method === 'Net Banking') cashbackRate = 0.01;

    const cashback = Math.min(amount * cashbackRate, 500);
    const date = new Date().toISOString().split('T')[0];
    const txId = Date.now().toString();

    setState(prev => {
      const nextWalletBalance = method === 'Wallet' ? prev.walletBalance - amount : prev.walletBalance;
      const nextTotalBalance = nextWalletBalance + prev.savings + prev.investmentValue;

      const newTx: Transaction = {
        id: txId,
        type: 'payment',
        description,
        amount,
        date,
        method,
        recipient,
        cashbackEarned: cashback > 0 ? cashback : undefined,
      };

      const updatedTransactions = [newTx, ...prev.transactions];
      if (cashback > 0) {
        updatedTransactions.unshift({
          id: txId + '_cb',
          type: 'cashback',
          description: `Cashback from ${description}`,
          amount: cashback,
          date,
        });
      }

      return {
        ...prev,
        totalBalance: nextTotalBalance,
        walletBalance: nextWalletBalance,
        monthlyExpenses: prev.monthlyExpenses + amount,
        totalCashback: prev.totalCashback + cashback,
        monthCashback: prev.monthCashback + cashback,
        transactions: updatedTransactions,
      };
    });

    return { success: true, cashback };
  }, [state.walletBalance, state.savings, state.investmentValue]);

  const redeemCashback = useCallback((amount: number) => {
    if (amount <= 0 || amount > state.totalCashback) return false;

    setState(prev => {
      const nextWalletBalance = prev.walletBalance + amount;
      const nextTotalBalance = prev.bankAccounts.reduce((sum, account) => sum + (account.balance || 0), 0)
        + nextWalletBalance
        + prev.savings
        + prev.investmentValue;
      return {
        ...prev,
        walletBalance: nextWalletBalance,
        totalBalance: nextTotalBalance,
        totalCashback: prev.totalCashback - amount,
        transactions: [
          {
            id: Date.now().toString(),
            type: 'cashback',
            description: `Redeemed cashback to wallet`,
            amount,
            date: new Date().toISOString().split('T')[0],
          },
          ...prev.transactions,
        ],
      };
    });

    return true;
  }, [state.totalCashback]);

  const setBankAccounts = useCallback((accounts: BankAccount[]) => {
    if (accounts && accounts.length > 0) {
      setState(prev => ({ ...prev, bankAccounts: accounts }));
    }
  }, []);

  const addBankAccount = useCallback((account: BankAccount) => {
    setState(prev => ({ ...prev, bankAccounts: [...prev.bankAccounts, account] }));
  }, []);

  const updateBankAccount = useCallback((account: BankAccount) => {
    setState(prev => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map(item => item.id === account.id ? account : item),
    }));
  }, []);

  const removeBankAccount = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      bankAccounts: prev.bankAccounts.filter(item => item.id !== id),
    }));
  }, []);

  const addEMI = useCallback((loan: Omit<EMILoan, 'id' | 'paidMonths' | 'startDate'>) => {
    const newLoan: EMILoan = {
      id: Date.now().toString(),
      ...loan,
      paidMonths: 0,
      startDate: new Date().toISOString().split('T')[0],
    };

    setState(prev => ({
      ...prev,
      emiLoans: [...prev.emiLoans, newLoan],
    }));
  }, []);

  const payEMI = useCallback((loanId: string) => {
    setState(prev => ({
      ...prev,
      emiLoans: prev.emiLoans.map(loan => 
        loan.id === loanId ? { ...loan, paidMonths: loan.paidMonths + 1 } : loan
      ),
    }));
    return true;
  }, []);

  const transferToSavingsGoal = useCallback((amount: number, source: 'Wallet' | 'Bank', bankAccountId?: string) => {
    if (source === 'Wallet' && state.walletBalance < amount) {
      return { success: false, message: 'Insufficient wallet balance' };
    }

    setState(prev => {
      const nextWalletBalance = source === 'Wallet' ? prev.walletBalance - amount : prev.walletBalance;
      const nextSavings = prev.savings + amount;
      return {
        ...prev,
        walletBalance: nextWalletBalance,
        savings: nextSavings,
        totalBalance: nextWalletBalance + nextSavings + prev.investmentValue,
      };
    });

    return { success: true };
  }, [state.walletBalance, state.savings, state.investmentValue]);

  const contextValue: FinanceContextType = {
    ...state,
    makePayment,
    redeemCashback,
    addEMI,
    payEMI,
    transferToSavingsGoal,
    setBankAccounts,
    addBankAccount,
    updateBankAccount,
    removeBankAccount,
  };

  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
};
