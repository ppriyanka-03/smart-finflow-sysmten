import { useFinance } from '@/contexts/FinanceContext';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, PiggyBank, BarChart3, Gift, Calculator
} from 'lucide-react';
import {
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const Dashboard = () => {
  const finance = useFinance();

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
                  {tx.type === 'income' || tx.type === 'cashback' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default Dashboard;
