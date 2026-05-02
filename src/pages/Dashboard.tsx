import { useEffect, useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, PiggyBank, BarChart3, Gift, Calculator
} from 'lucide-react';
import {
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import MarketInsights from '@/components/MarketInsights';

const Dashboard = () => {
  const navigate = useNavigate();
  const finance = useFinance();

  useEffect(() => {
    // Check Supabase session instead of localStorage
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/login");
      }
    });
  }, [navigate]);

  const stats = [
    { label: 'Total Balance', value: finance.totalBalance, icon: Wallet, color: 'text-primary' },
    { label: 'Wallet Balance', value: finance.walletBalance, icon: Wallet, color: 'text-info' },
    { label: 'Monthly Income', value: finance.monthlyIncome, icon: ArrowDownLeft, color: 'text-success' },
    { label: 'Monthly Expenses', value: finance.monthlyExpenses, icon: ArrowUpRight, color: 'text-destructive' },
    { label: 'Savings', value: finance.savings, icon: PiggyBank, color: 'text-warning' },
    { label: 'Investments', value: finance.investmentValue, icon: TrendingUp, color: 'text-primary' },
    { label: 'Total Cashback', value: finance.totalCashback, icon: Gift, color: 'text-success' },
    { label: 'Active EMI', value: finance.emiLoans.reduce((s, l) => s + (l.paidMonths < l.tenure ? l.emi : 0), 0), icon: Calculator, color: 'text-warning' },
  ];

  const incomeExpenseData = [
    { month: 'Sep', income: 110000, expenses: 62000 },
    { month: 'Oct', income: 115000, expenses: 71000 },
    { month: 'Nov', income: 120000, expenses: 65000 },
    { month: 'Dec', income: 118000, expenses: 78000 },
    { month: 'Jan', income: 122000, expenses: 69000 },
    { month: 'Feb', income: finance.monthlyIncome, expenses: finance.monthlyExpenses },
  ];

  const expenseBreakdown = [
    { name: 'Housing', value: 28500, color: '#10b981' },
    { name: 'Food', value: 12000, color: '#3b82f6' },
    { name: 'Transport', value: 8000, color: '#f59e0b' },
    { name: 'Shopping', value: 10000, color: '#8b5cf6' },
    { name: 'Bills', value: 5000, color: '#ef4444' },
    { name: 'Other', value: 5000, color: '#6b7280' },
  ];

  const monthlyComparison = [
    { month: 'Sep', amount: 62000 },
    { month: 'Oct', amount: 71000 },
    { month: 'Nov', amount: 65000 },
    { month: 'Dec', amount: 78000 },
    { month: 'Jan', amount: 69000 },
    { month: 'Feb', amount: finance.monthlyExpenses },
  ];

  const formatCurrency = (n: number) => '₹' + n.toLocaleString('en-IN');

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  const totalBalance = finance.totalBalance || 0;
  const saved = finance.savings || 0;
  const currentCashback = finance.totalCashback || 0;
  const currentExpenses = finance.monthlyExpenses || 0;
  const currentInvestments = finance.investmentValue || 0;
  const ongoingPayments = finance.transactions.filter(tx => tx.type === 'payment').reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const insights = [] as { icon: string; text: string }[];
  if (saved < totalBalance * 0.2) {
    insights.push({ icon: '⚠️', text: 'Try to increase your savings for better financial stability.' });
  }
  if (currentExpenses > (finance.monthlyIncome || 0) * 0.7 || ongoingPayments > totalBalance * 0.15) {
    insights.push({ icon: '💡', text: 'Your spending is higher than usual this month.' });
  }
  if (currentInvestments > totalBalance * 0.15) {
    insights.push({ icon: '📊', text: 'Good job! Your investments are performing well.' });
  }
  if (currentCashback > 0) {
    insights.push({ icon: '✨', text: 'You have unused cashback—consider redeeming it.' });
  }
  if (!insights.length) {
    insights.push({ icon: '💡', text: 'Everything looks stable. Keep tracking your progress regularly.' });
  }

  const bankAccounts = finance.bankAccounts || [];
  const [goalName, setGoalName] = useState('Buy Laptop');
  const [targetAmount, setTargetAmount] = useState(totalBalance > 0 ? Math.max(totalBalance * 0.6, 50000) : 50000);
  const [savedAmount, setSavedAmount] = useState(saved);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalSource, setGoalSource] = useState<'Wallet' | 'Bank'>('Wallet');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [goalTransferAmount, setGoalTransferAmount] = useState('');
  const [goalError, setGoalError] = useState('');
  const [goalSuccess, setGoalSuccess] = useState('');

  useEffect(() => {
    setSavedAmount(saved);
  }, [saved]);

  const progress = targetAmount > 0 ? Math.min(100, Math.round((savedAmount / targetAmount) * 100)) : 0;
  const remaining = Math.max(0, targetAmount - savedAmount);

  const openGoalTransferModal = () => {
    setGoalError('');
    setGoalTransferAmount('');
    setGoalSource('Wallet');
    setSelectedBankAccountId(bankAccounts[0]?.id ?? '');
    setGoalModalOpen(true);
  };

  const transferToGoal = () => {
    const amount = Number(goalTransferAmount) || 0;
    if (amount <= 0) {
      setGoalError('Enter an amount greater than 0.');
      return;
    }

    if (goalSource === 'Bank') {
      if (!selectedBankAccountId) {
        setGoalError('Select a bank account.');
        return;
      }
      const bank = bankAccounts.find(account => account.id === selectedBankAccountId);
      if (!bank || amount > (bank.balance || 0)) {
        setGoalError('Insufficient bank balance.');
        return;
      }
    }

    if (goalSource === 'Wallet' && amount > (finance.walletBalance || 0)) {
      setGoalError('Insufficient wallet balance.');
      return;
    }

    const result = finance.transferToSavingsGoal(amount, goalSource, goalSource === 'Bank' ? selectedBankAccountId : undefined);
    if (!result.success) {
      setGoalError(result.message || 'Unable to add funds to the goal.');
      return;
    }

    setGoalSuccess(`₹${amount.toLocaleString('en-IN')} added to your goal`);
    setGoalError('');
    setGoalModalOpen(false);
    setGoalTransferAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <motion.div key={s.label} variants={item} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{formatCurrency(s.value)}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses */}
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={incomeExpenseData}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
              <XAxis dataKey="month" stroke="hsl(215 20% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 55%)" fontSize={12} tickFormatter={v => `₹${(v/1000)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 30% 22%)', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
                {expenseBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 30% 22%)', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {expenseBreakdown.map(e => (
              <div key={e.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                {e.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Comparison */}
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold mb-4">Monthly Expenses Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
              <XAxis dataKey="month" stroke="hsl(215 20% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 55%)" fontSize={12} tickFormatter={v => `₹${(v/1000)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 30% 22%)', borderRadius: '8px' }} />
              <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {finance.transactions.slice(0, 6).map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    tx.type === 'income' || tx.type === 'cashback' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                  }`}>
                    {tx.type === 'income' || tx.type === 'cashback' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'income' || tx.type === 'cashback' ? 'text-success' : 'text-destructive'}`}>
                  {tx.type === 'income' || tx.type === 'cashback' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MarketInsights />

      {/* AI Insight */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="glass-card p-5 border-primary/20 glow-effect">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm mb-1">AI Financial Insight</h3>
            <p className="text-sm text-muted-foreground">
              Your EMI payments account for {Math.round((finance.emiLoans.reduce((s, l) => s + l.emi, 0) / finance.monthlyIncome) * 100)}% of your monthly income.
              {finance.emiLoans.reduce((s, l) => s + l.emi, 0) / finance.monthlyIncome > 0.3
                ? ' Consider refinancing or increasing tenure to keep it below 30%.'
                : ' This is within the healthy range. Keep it up!'}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-display font-semibold">AI Insights</h3>
            <p className="text-sm text-muted-foreground">Smart suggestions based on your latest finance data.</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Auto-updating</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.slice(0, 4).map(insight => (
            <div key={insight.text} className="rounded-3xl border border-border/70 bg-slate-950/80 p-4">
              <p className="text-lg">{insight.icon}</p>
              <p className="mt-3 text-sm text-muted-foreground">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-display font-semibold">Savings Goal</h3>
            <p className="text-sm text-muted-foreground">Track progress toward your next financial target.</p>
          </div>
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">Goal</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Goal Name</label>
            <Input value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="Buy Laptop" className="bg-secondary/50" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Target Amount</label>
            <Input
              type="number"
              min={0}
              value={targetAmount}
              onChange={e => setTargetAmount(Number(e.target.value) || 0)}
              placeholder="₹50,000"
              className="bg-secondary/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Saved Amount</label>
            <Input
              type="number"
              min={0}
              value={savedAmount}
              onChange={e => setSavedAmount(Number(e.target.value) || 0)}
              placeholder="₹0"
              className="bg-secondary/50"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-border/50 bg-slate-950/60 p-4 mb-4">
          <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
            <span>Progress</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="rounded-3xl border border-border/50 bg-slate-950/60 p-4">
            <p className="text-xs text-muted-foreground">Saved</p>
            <p className="text-lg font-semibold">₹{savedAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-3xl border border-border/50 bg-slate-950/60 p-4">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="text-lg font-semibold">₹{remaining.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button onClick={openGoalTransferModal} disabled={progress >= 100 || targetAmount <= 0} className="bg-primary text-primary-foreground">
            Add Money to Goal
          </Button>
          <p className="text-sm text-muted-foreground">Transfer funds from wallet or bank into this goal.</p>
        </div>
        {goalSuccess ? (
          <p className="mt-3 text-sm text-success">{goalSuccess}</p>
        ) : null}
      </div>

      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent className="max-w-lg rounded-[2rem] bg-slate-950/95">
          <DialogHeader>
            <DialogTitle>Add Money to Goal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Source</label>
              <select
                value={goalSource}
                onChange={e => setGoalSource(e.target.value as 'Wallet' | 'Bank')}
                className="input w-full bg-secondary/50"
              >
                <option value="Wallet">Wallet</option>
                <option value="Bank">Bank Account</option>
              </select>
            </div>
            {goalSource === 'Bank' ? (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Select Account</label>
                <select
                  value={selectedBankAccountId}
                  onChange={e => setSelectedBankAccountId(e.target.value)}
                  className="input w-full bg-secondary/50"
                >
                  <option value="" disabled>Select account</option>
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.bankName || 'Bank'} • ₹{(account.balance || 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Amount</label>
              <Input
                type="number"
                min={0}
                value={goalTransferAmount}
                onChange={e => setGoalTransferAmount(e.target.value)}
                placeholder="₹0"
                className="bg-secondary/50"
              />
            </div>
            {goalError ? <p className="text-sm text-destructive">{goalError}</p> : null}
          </div>
          <DialogFooter className="mt-2 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={transferToGoal} className="bg-primary text-primary-foreground">
              Add Money
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
