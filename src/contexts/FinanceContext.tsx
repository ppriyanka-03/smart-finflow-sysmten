import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

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
}

interface FinanceContextType extends FinanceState {
  makePayment: (recipient: string, amount: number, method: string, description: string) => { success: boolean; cashback: number };
  addEMI: (loan: Omit<EMILoan, 'id' | 'paidMonths' | 'startDate'>) => void;
  payEMI: (loanId: string) => boolean;
}

const defaultState: FinanceState = {
  totalBalance: 285400,
  walletBalance: 42500,
  monthlyIncome: 125000,
  monthlyExpenses: 68500,
  savings: 156000,
  investmentValue: 340000,
  totalCashback: 3250,
  monthCashback: 850,
  transactions: [
    { id: '1', type: 'income', description: 'Salary Credit', amount: 125000, date: '2026-02-01' },
    { id: '2', type: 'payment', description: 'Electricity Bill', amount: 3200, date: '2026-02-03', method: 'UPI', recipient: 'BESCOM' },
    { id: '3', type: 'payment', description: 'Grocery Shopping', amount: 5600, date: '2026-02-05', method: 'Card', recipient: 'BigBasket', cashbackEarned: 112 },
    { id: '4', type: 'emi', description: 'Home Loan EMI', amount: 28500, date: '2026-02-05' },
    { id: '5', type: 'cashback', description: 'Cashback Reward', amount: 112, date: '2026-02-05' },
    { id: '6', type: 'payment', description: 'Mobile Recharge', amount: 599, date: '2026-02-08', method: 'Wallet', recipient: 'Jio', cashbackEarned: 30 },
    { id: '7', type: 'payment', description: 'Netflix Subscription', amount: 649, date: '2026-02-10', method: 'Card', recipient: 'Netflix', cashbackEarned: 13 },
    { id: '8', type: 'payment', description: 'Restaurant', amount: 2400, date: '2026-02-12', method: 'UPI', recipient: 'Zomato' },
    { id: '9', type: 'income', description: 'Freelance Payment', amount: 15000, date: '2026-02-14' },
  ],
  emiLoans: [
    { id: 'emi1', name: 'Home Loan', principal: 2500000, rate: 8.5, tenure: 240, emi: 21698, totalInterest: 2707520, totalPayable: 5207520, paidMonths: 36, startDate: '2023-02-01' },
    { id: 'emi2', name: 'Car Loan', principal: 600000, rate: 9.2, tenure: 60, emi: 12468, totalInterest: 148080, totalPayable: 748080, paidMonths: 12, startDate: '2025-02-01' },
  ],
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<FinanceState>(() => {
    const stored = localStorage.getItem('sf_finance');
    return stored ? JSON.parse(stored) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem('sf_finance', JSON.stringify(state));
  }, [state]);

  const makePayment = useCallback((recipient: string, amount: number, method: string, description: string) => {
    if (amount > state.totalBalance) return { success: false, cashback: 0 };

    let cashbackRate = 0;
    if (method === 'Wallet') cashbackRate = 0.05;
    else if (method === 'Card') cashbackRate = 0.02;
    else if (method === 'Net Banking') cashbackRate = 0.01;

    const cashback = Math.min(amount * cashbackRate, 500);
    const txId = Date.now().toString();

    setState(prev => {
      const newTx: Transaction = {
        id: txId, type: 'payment', description, amount, date: new Date().toISOString().split('T')[0],
        method, recipient, cashbackEarned: cashback > 0 ? cashback : undefined,
      };
      const txs = [newTx, ...prev.transactions];
      if (cashback > 0) {
        txs.unshift({ id: txId + '_cb', type: 'cashback', description: `Cashback from ${description}`, amount: cashback, date: new Date().toISOString().split('T')[0] });
      }
      return {
        ...prev,
        totalBalance: prev.totalBalance - amount + cashback,
        walletBalance: method === 'Wallet' ? prev.walletBalance - amount + cashback : prev.walletBalance + cashback,
        monthlyExpenses: prev.monthlyExpenses + amount,
        totalCashback: prev.totalCashback + cashback,
        monthCashback: prev.monthCashback + cashback,
        transactions: txs,
      };
    });

    return { success: true, cashback };
  }, [state.totalBalance]);

  const addEMI = useCallback((loan: Omit<EMILoan, 'id' | 'paidMonths' | 'startDate'>) => {
    setState(prev => ({
      ...prev,
      emiLoans: [...prev.emiLoans, { ...loan, id: Date.now().toString(), paidMonths: 0, startDate: new Date().toISOString().split('T')[0] }],
    }));
  }, []);

  const payEMI = useCallback((loanId: string) => {
    const loan = state.emiLoans.find(l => l.id === loanId);
    if (!loan || loan.paidMonths >= loan.tenure || loan.emi > state.totalBalance) return false;

    setState(prev => ({
      ...prev,
      totalBalance: prev.totalBalance - loan.emi,
      monthlyExpenses: prev.monthlyExpenses + loan.emi,
      emiLoans: prev.emiLoans.map(l => l.id === loanId ? { ...l, paidMonths: l.paidMonths + 1 } : l),
      transactions: [{ id: Date.now().toString(), type: 'emi', description: `${loan.name} EMI Payment`, amount: loan.emi, date: new Date().toISOString().split('T')[0] }, ...prev.transactions],
    }));
    return true;
  }, [state.emiLoans, state.totalBalance]);

  return (
    <FinanceContext.Provider value={{ ...state, makePayment, addEMI, payEMI }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
};
