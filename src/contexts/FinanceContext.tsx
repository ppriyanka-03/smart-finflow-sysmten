import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { RazorpayService } from '@/services/razorpay-service';

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
  voiceInitiated?: boolean;
  voiceTranscript?: string;
  voiceLanguage?: string;
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

export interface BankAccount {
  id: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolder?: string;
  balance: number;
  isDefault?: boolean;
}

export interface UserSettings {
  id: string;
  user_id: string;
  upi_id?: string | null;
  upi_name?: string | null;
  security_notifications: boolean;
  payment_notifications: boolean;
  monthly_reports: boolean;
  biometric_enabled: boolean;
  pin_set: boolean;
  dark_mode: boolean;
  currency: string;
  language: string;
  created_at: string;
  updated_at: string;
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
  bankAccounts: BankAccount[];
  userSettings: UserSettings | null;
  loading: boolean;
}

interface FinanceContextType extends FinanceState {
  makePayment: (recipient: string, amount: number, method: string, description: string, recipientEmail?: string, voiceInitiated?: boolean, voiceTranscript?: string, voiceLanguage?: string) => Promise<{ success: boolean; cashback: number; error?: string }>;
  addEMI: (loan: Omit<EMILoan, 'id' | 'paidMonths' | 'startDate'>) => Promise<void>;
  payEMI: (loanId: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [state, setState] = useState<FinanceState>({
    totalBalance: 0,
    walletBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savings: 0,
    investmentValue: 0,
    totalCashback: 0,
    monthCashback: 0,
    transactions: [],
    emiLoans: [],
    bankAccounts: [],
    userSettings: null,
    loading: true,
  });

  const initializeUserData = async (userId: string) => {
    console.log('Initializing user data for:', userId);
    
    // Create initial wallet record for new user
    const { error: walletError } = await supabase.from('wallets').insert({
      user_id: userId,
      total_balance: 285400,
      wallet_balance: 42500,
      monthly_income: 125000,
      monthly_expenses: 68500,
      savings: 156000,
      investment_value: 340000,
      total_cashback: 3250,
      month_cashback: 850,
    });

    if (walletError) {
      console.error('Failed to initialize user wallet:', walletError);
      throw walletError;
    }

    console.log('Wallet created successfully');

    // Create demo bank accounts for the user
    const { error: bankError } = await supabase.from('bank_accounts').insert([
      {
        user_id: userId,
        bank_name: 'HDFC Bank',
        account_number: 'XXXX1234',
        ifsc_code: 'HDFC0001',
        account_holder: 'Primary Account',
        balance: 150000,
        is_default: true,
      },
      {
        user_id: userId,
        bank_name: 'SBI Bank',
        account_number: 'XXXX5678',
        ifsc_code: 'SBIN0002',
        account_holder: 'Savings Account',
        balance: 135400,
        is_default: false,
      }
    ]);

    if (bankError) {
      console.error('Failed to initialize bank accounts:', bankError);
      // Don't throw error for bank accounts - wallet is more critical
    } else {
      console.log('Bank accounts created successfully');
    }

    // Create default user settings
    const { error: settingsError } = await supabase.from('user_settings').insert({
      user_id: userId,
      upi_id: 'demo@upi',
      upi_name: 'SmartFinFlow User',
      security_notifications: true,
      payment_notifications: true,
      monthly_reports: true,
      biometric_enabled: false,
      pin_set: false,
      dark_mode: false,
      currency: 'INR',
      language: 'en',
    });

    if (settingsError) {
      console.error('Failed to initialize user settings:', settingsError);
      // Don't throw error for settings - wallet is more critical
    } else {
      console.log('User settings created successfully');
    }

    console.log('User data initialization completed');
  };

  const fetchData = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Fetch all data in parallel for optimal performance
      const [walletRes, txRes, emiRes, bankRes, settingsRes] = await Promise.all([
        supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(100),
        supabase.from('emi_loans').select('*').eq('user_id', user.id),
        supabase.from('bank_accounts').select('*').eq('user_id', user.id).order('is_default', { ascending: false }),
        supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      console.log('Fetch data results:', { 
        wallet: walletRes.data, 
        transactions: txRes.data?.length || 0, 
        emiLoans: emiRes.data?.length || 0,
        bankAccounts: bankRes.data?.length || 0,
        userSettings: settingsRes.data ? 'loaded' : 'null'
      });

      const w = walletRes.data;
      
      // If no wallet exists, initialize user data
      if (!w) {
        try {
          await initializeUserData(user.id);
          
          // Refetch after initialization
          const { data: newWallet } = await supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle();
          
          if (newWallet) {
            setState({
              totalBalance: Number(newWallet.total_balance),
              walletBalance: Number(newWallet.wallet_balance),
              monthlyIncome: Number(newWallet.monthly_income),
              monthlyExpenses: Number(newWallet.monthly_expenses),
              savings: Number(newWallet.savings),
              investmentValue: Number(newWallet.investment_value),
              totalCashback: Number(newWallet.total_cashback),
              monthCashback: Number(newWallet.month_cashback),
              transactions: [],
              emiLoans: [],
              bankAccounts: [],
              userSettings: null,
              loading: false,
            });
            return;
          } else {
            console.error('Failed to fetch newly created wallet data');
            // Set default values as fallback but preserve existing transactions
            setState(prev => ({
              totalBalance: 285400,
              walletBalance: 42500,
              monthlyIncome: 125000,
              monthlyExpenses: 68500,
              savings: 156000,
              investmentValue: 340000,
              totalCashback: 3250,
              monthCashback: 850,
              transactions: prev.transactions || [], // ✅ Preserve existing transactions
              emiLoans: prev.emiLoans || [], // ✅ Preserve existing EMI loans
              bankAccounts: prev.bankAccounts || [], // ✅ Preserve existing bank accounts
              userSettings: prev.userSettings, // ✅ Preserve existing settings
              loading: false,
            }));
            return;
          }
        } catch (error) {
          console.error('Failed to initialize user data:', error);
          // Set default values as fallback but preserve existing transactions
          setState(prev => ({
            totalBalance: 285400,
            walletBalance: 42500,
            monthlyIncome: 125000,
            monthlyExpenses: 68500,
            savings: 156000,
            investmentValue: 340000,
            totalCashback: 3250,
            monthCashback: 850,
            transactions: prev.transactions || [], // ✅ Preserve existing transactions
            emiLoans: prev.emiLoans || [], // ✅ Preserve existing EMI loans
            bankAccounts: prev.bankAccounts || [], // ✅ Preserve existing bank accounts
            userSettings: prev.userSettings, // ✅ Preserve existing settings
            loading: false,
          }));
          return;
        }
      }

      // ✅ Ensure transactions are properly mapped from database
      const txs: Transaction[] = (txRes.data || []).map((t: any) => ({
        id: t.id, 
        type: t.type, 
        description: t.description, 
        amount: Number(t.amount),
        date: t.date, 
        method: t.method, 
        recipient: t.recipient,
        recipientEmail: t.recipient_email, 
        cashbackEarned: t.cashback_earned ? Number(t.cashback_earned) : undefined,
      }));
      const emis: EMILoan[] = (emiRes.data || []).map((e: any) => ({
        id: e.id, name: e.name, principal: Number(e.principal), rate: Number(e.rate),
        tenure: e.tenure, emi: Number(e.emi), totalInterest: Number(e.total_interest),
        totalPayable: Number(e.total_payable), paidMonths: e.paid_months, startDate: e.start_date,
      }));

      // Map bank accounts from database
      const bankAccounts: BankAccount[] = (bankRes.data || []).map((b: any) => ({
        id: b.id,
        bankName: b.bank_name,
        accountNumber: b.account_number,
        ifscCode: b.ifsc_code,
        accountHolder: b.account_holder,
        balance: Number(b.balance),
        isDefault: b.is_default,
      }));

      // Ensure we have valid wallet data, otherwise use defaults
      const totalBalance = w.total_balance ? Number(w.total_balance) : 285400;
      const walletBalance = w.wallet_balance ? Number(w.wallet_balance) : 42500;
      const monthlyIncome = w.monthly_income ? Number(w.monthly_income) : 125000;
      const monthlyExpenses = w.monthly_expenses ? Number(w.monthly_expenses) : 68500;
      const savings = w.savings ? Number(w.savings) : 156000;
      const investmentValue = w.investment_value ? Number(w.investment_value) : 340000;
      const totalCashback = w.total_cashback ? Number(w.total_cashback) : 3250;
      const monthCashback = w.month_cashback ? Number(w.month_cashback) : 850;

      setState({
        totalBalance,
        walletBalance,
        monthlyIncome,
        monthlyExpenses,
        savings,
        investmentValue,
        totalCashback,
        monthCashback,
        transactions: txs,
        emiLoans: emis,
        bankAccounts,
        userSettings: settingsRes.data,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // ✅ Preserve existing state, don't reset transactions or balance
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const makePayment = useCallback(async (recipient: string, amount: number, method: string, description: string, recipientEmail?: string, voiceInitiated?: boolean, voiceTranscript?: string, voiceLanguage?: string) => {
    if (!user) {
      return { success: false, cashback: 0, error: 'User not authenticated' };
    }

    console.log('🚀 Starting payment process:', { recipient, amount, method, description, recipientEmail, voiceInitiated, voiceTranscript, voiceLanguage });

    try {
      // 🚀 STEP 1: Process payment through Razorpay if method is 'Razorpay'
      if (method === 'Razorpay') {
        console.log('Processing payment through Razorpay...');
        
        const razorpayResult = await RazorpayService.completePayment(
          amount,
          description,
          user.email,
          {
            recipient,
            method,
            recipient_email: recipientEmail,
          }
        );

        if (!razorpayResult.success) {
          console.error('Razorpay payment failed:', razorpayResult.error);
          return { success: false, cashback: 0, error: razorpayResult.error || 'Razorpay payment failed' };
        }

        console.log('Razorpay payment successful:', razorpayResult);
      }

      // 🚀 STEP 2: Calculate cashback (5% for Card/UPI, 2% for others)
      const cashback = (method === 'Card' || method === 'UPI') ? Math.floor(amount * 0.05) : Math.floor(amount * 0.02);

      // 🚀 STEP 3: Insert payment transaction
      console.log('Creating payment transaction:', { user_id: user.id, type: 'payment', description, amount, method, recipient, voiceInitiated, voiceTranscript, voiceLanguage });
      
      // Add voice metadata to description if voice-initiated
      const finalDescription = voiceInitiated 
        ? `${description} [Voice: ${voiceTranscript || 'N/A'} | Lang: ${voiceLanguage || 'en-IN'}]`
        : description;
      
      const { error: txError, data: txData } = await supabase.from('transactions').insert({
        user_id: user.id, 
        type: 'payment', 
        description: finalDescription, 
        amount, 
        method, 
        recipient: recipient || 'Unknown',
        recipient_email: recipientEmail || null, 
        cashback_earned: cashback > 0 ? cashback : null,
        date: new Date().toISOString(),
      }).select();

      if (txError) { 
        console.error('Transaction insert failed:', txError); 
        console.error('Error details:', JSON.stringify(txError, null, 2));
        return { success: false, cashback: 0, error: `Failed to save transaction: ${txError.message}` };
      }

      console.log('Transaction created successfully:', txData);

      // 🚀 STEP 4: Insert cashback transaction if earned
      if (cashback > 0) {
        const { error: cashbackError } = await supabase.from('transactions').insert({
          user_id: user.id, 
          type: 'cashback', 
          description: `Cashback from ${description}`, 
          amount: cashback,
          date: new Date().toISOString(),
        });
        
        if (cashbackError) {
          console.error('Cashback transaction failed:', cashbackError);
        }
      }

      // 🚀 STEP 5: Update wallet balances
      console.log('Updating wallet balances:', { 
        total_balance: state.totalBalance - amount + cashback,
        wallet_balance: method === 'Wallet' ? state.walletBalance - amount + cashback : state.walletBalance + cashback 
      });
      
      const { error: walletError } = await supabase.from('wallets').update({
        total_balance: state.totalBalance - amount + cashback,
        wallet_balance: method === 'Wallet' ? state.walletBalance - amount + cashback : state.walletBalance + cashback,
        monthly_expenses: state.monthlyExpenses + amount,
        total_cashback: state.totalCashback + cashback,
        month_cashback: state.monthCashback + cashback,
      }).eq('user_id', user.id);

      if (walletError) {
        console.error('Wallet update failed:', walletError);
        console.error('Wallet error details:', JSON.stringify(walletError, null, 2));
        // Continue even if wallet update fails - transaction is already saved
        console.log('Transaction saved but wallet update failed - will refresh to sync');
      }

      // 🚀 STEP 6: Refresh data from database to ensure consistency
      console.log('Wallet updated successfully, refreshing data...');
      await fetchData();
      console.log('Data refresh completed after payment');

      return { success: true, cashback };
    } catch (error) {
      console.error('Payment process failed:', error);
      return { success: false, cashback: 0, error: 'Payment processing failed' };
    }
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
        date: new Date().toISOString(),
      }),
      supabase.from('wallets').update({
        total_balance: state.totalBalance - loan.emi,
        monthly_expenses: state.monthlyExpenses + loan.emi,
      }).eq('user_id', user.id),
    ]);

    await fetchData();
    return true;
  }, [user, state.emiLoans, state.totalBalance, state.monthlyExpenses, fetchData]);

  const refreshData = useCallback(async () => {
    console.log('Manual data refresh requested');
    await fetchData();
  }, [fetchData]);

  const setBankAccounts = useCallback((update: React.SetStateAction<BankAccount[]>) => {
    setState(prev => ({
      ...prev,
      bankAccounts: typeof update === 'function' ? update(prev.bankAccounts) : update,
    }));
  }, []);

  const value = {
    user,
    ...state,
    makePayment,
    addEMI,
    payEMI,
    refreshData,
    setBankAccounts,
  };

return (
  <FinanceContext.Provider value={value}>
    {children}
  </FinanceContext.Provider>
);
};

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
};
