import { useFinance } from '@/contexts/FinanceContext';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const Analytics = () => {
  const finance = useFinance();

  const spendingTrend = [
    { month: 'Sep', amount: 62000 },
    { month: 'Oct', amount: 71000 },
    { month: 'Nov', amount: 65000 },
    { month: 'Dec', amount: 78000 },
    { month: 'Jan', amount: 69000 },
    { month: 'Feb', amount: finance.monthlyExpenses },
  ];

  const categoryData = [
    { name: 'Housing', value: 28500, color: '#10b981' },
    { name: 'Food', value: 12000, color: '#3b82f6' },
    { name: 'Transport', value: 8000, color: '#f59e0b' },
    { name: 'Shopping', value: 10000, color: '#8b5cf6' },
    { name: 'Bills', value: 5000, color: '#ef4444' },
  ];

  const savingsRate = Math.round((finance.savings / finance.monthlyIncome) * 100);
  const healthScore = Math.min(100, Math.max(0, savingsRate * 2 + 20));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Insights into your financial health</p>
      </div>

      {/* Health Score */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 glow-effect">
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="hsl(222 30% 18%)" strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="42" stroke="hsl(160 84% 39%)" strokeWidth="8" fill="none"
                strokeDasharray={`${healthScore * 2.64} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-2xl font-bold text-primary">{healthScore}</span>
            </div>
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg">Financial Health Score</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {healthScore >= 80 ? 'Excellent! Your finances are in great shape.' :
               healthScore >= 60 ? 'Good. Some room for improvement.' :
               'Needs attention. Consider reducing expenses.'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Savings rate: {savingsRate}% of income</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold mb-4">Spending Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={spendingTrend}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
              <XAxis dataKey="month" stroke="hsl(215 20% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 55%)" fontSize={12} tickFormatter={v => `₹${(v/1000)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 30% 22%)', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#spendGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-display font-semibold mb-4">Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 30% 22%)', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center">
            {categoryData.map(c => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                {c.name}: ₹{(c.value/1000).toFixed(0)}k
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
