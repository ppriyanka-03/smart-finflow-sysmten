import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Transaction {
  id: string;
  type: 'payment' | 'emi' | 'cashback' | 'income';
  description: string;
  amount: number;
  date: string;
  method?: string;
  recipient?: string;
  recipientEmail?: string;
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
  loading: boolean;
}

interface FinanceContextType extends FinanceState {
  makePayment: (recipient: string, amount: number, method: string, description: string, recipientEmail?: string) => Promise<{ success: boolean; cashback: number }>;
  addEMI: (loan: Omit<EMILoan, 'id' | 'paidMonths' | 'startDate'>) => Promise<void>;
  payEMI: (loanId: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [state, setState] = useState<FinanceState>({
    totalBalance: 0, walletBalance: 0, monthlyIncome: 0, monthlyExpenses: 0,
    savings: 0, investmentValue: 0, totalCashback: 0, monthCashback: 0,
    transactions: [], emiLoans: [], loading: true,
  });

  const fetchData = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    const [walletRes, txRes, emiRes] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(100),
      supabase.from('emi_loans').select('*').eq('user_id', user.id),
    ]);

    const w = walletRes.data;
    const txs: Transaction[] = (txRes.data || []).map((t: any) => ({
      id: t.id, type: t.type, description: t.description, amount: Number(t.amount),
      date: t.date, method: t.method, recipient: t.recipient,
      recipientEmail: t.recipient_email, cashbackEarned: t.cashback_earned ? Number(t.cashback_earned) : undefined,
    }));
    const emis: EMILoan[] = (emiRes.data || []).map((e: any) => ({
      id: e.id, name: e.name, principal: Number(e.principal), rate: Number(e.rate),
      tenure: e.tenure, emi: Number(e.emi), totalInterest: Number(e.total_interest),
      totalPayable: Number(e.total_payable), paidMonths: e.paid_months, startDate: e.start_date,
    }));

    setState({
      totalBalance: w ? Number(w.total_balance) : 285400,
      walletBalance: w ? Number(w.wallet_balance) : 42500,
      monthlyIncome: w ? Number(w.monthly_income) : 125000,
      monthlyExpenses: w ? Number(w.monthly_expenses) : 68500,
      savings: w ? Number(w.savings) : 156000,
      investmentValue: w ? Number(w.investment_value) : 340000,
      totalCashback: w ? Number(w.total_cashback) : 3250,
      monthCashback: w ? Number(w.month_cashback) : 850,
      transactions: txs,
      emiLoans: emis,
      loading: false,
    });
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const makePayment = useCallback(async (recipient: string, amount: number, method: string, description: string, recipientEmail?: string) => {
    if (!user || amount > state.totalBalance) return { success: false, cashback: 0 };

    let cashbackRate = 0;
    if (method === 'Wallet') cashbackRate = 0.05;
    else if (method === 'Card') cashbackRate = 0.02;
    else if (method === 'Net Banking') cashbackRate = 0.01;

    const cashback = Math.min(amount * cashbackRate, 500);

    // Insert payment transaction
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id, type: 'payment', description, amount, method, recipient,
      recipient_email: recipientEmail || null, cashback_earned: cashback > 0 ? cashback : null,
    });

    if (txError) { console.error('Transaction insert failed:', txError); return { success: false, cashback: 0 }; }

    // Insert cashback transaction if earned
    if (cashback > 0) {
      await supabase.from('transactions').insert({
        user_id: user.id, type: 'cashback', description: `Cashback from ${description}`, amount: cashback,
      });
    }

    // Update wallet
    await supabase.from('wallets').update({
      total_balance: state.totalBalance - amount + cashback,
      wallet_balance: method === 'Wallet' ? state.walletBalance - amount + cashback : state.walletBalance + cashback,
      monthly_expenses: state.monthlyExpenses + amount,
      total_cashback: state.totalCashback + cashback,
      month_cashback: state.monthCashback + cashback,
    }).eq('user_id', user.id);

    // Send email notification via edge function if recipient email provided
    if (recipientEmail) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await supabase.functions.invoke('send-payment-email', {
            body: { recipientEmail, recipientName: recipient, amount, description, method, senderName: user.name },
          });
        }
      } catch (e) { console.error('Email notification failed:', e); }
    }

    await fetchData();
    return { success: true, cashback };
  }, [user, state.totalBalance, state.walletBalance, state.monthlyExpenses, state.totalCashback, state.monthCashback, fetchData]);

  const addEMI = useCallback(async (loan: Omit<EMILoan, 'id' | 'paidMonths' | 'startDate'>) => {
    if (!user) return;
    await supabase.from('emi_loans').insert({
      user_id: user.id, name: loan.name, principal: loan.principal, rate: loan.rate,
      tenure: loan.tenure, emi: loan.emi, total_interest: loan.totalInterest, total_payable: loan.totalPayable,
    });
    await fetchData();
  }, [user, fetchData]);

  const payEMI = useCallback(async (loanId: string) => {
    if (!user) return false;
    const loan = state.emiLoans.find(l => l.id === loanId);
    if (!loan || loan.paidMonths >= loan.tenure || loan.emi > state.totalBalance) return false;

    await Promise.all([
      supabase.from('emi_loans').update({ paid_months: loan.paidMonths + 1 }).eq('id', loanId),
      supabase.from('transactions').insert({
        user_id: user.id, type: 'emi', description: `${loan.name} EMI Payment`, amount: loan.emi,
      }),
      supabase.from('wallets').update({
        total_balance: state.totalBalance - loan.emi,
        monthly_expenses: state.monthlyExpenses + loan.emi,
      }).eq('user_id', user.id),
    ]);

    await fetchData();
    return true;
  }, [user, state.emiLoans, state.totalBalance, state.monthlyExpenses, fetchData]);

  return (
    <FinanceContext.Provider value={{ ...state, makePayment, addEMI, payEMI, refreshData: fetchData }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
};
