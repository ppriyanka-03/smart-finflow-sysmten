import { useFinance } from '@/contexts/FinanceContext';
import { motion } from 'framer-motion';

const budgetItems = [
  { category: 'Housing', allocated: 30000, color: '#10b981' },
  { category: 'Food & Dining', allocated: 15000, color: '#3b82f6' },
  { category: 'Transportation', allocated: 10000, color: '#f59e0b' },
  { category: 'Shopping', allocated: 12000, color: '#8b5cf6' },
  { category: 'Bills & Utilities', allocated: 8000, color: '#ef4444' },
  { category: 'Entertainment', allocated: 5000, color: '#06b6d4' },
];

const Budget = () => {
  const finance = useFinance();

  // Simulate spent amounts based on actual expenses ratio
  const totalAllocated = budgetItems.reduce((s, b) => s + b.allocated, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Budget</h1>
        <p className="text-sm text-muted-foreground">Track your spending against budget</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Budget</p>
          <p className="text-2xl font-display font-bold">₹{totalAllocated.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Spent</p>
          <p className="text-2xl font-display font-bold text-destructive">₹{finance.monthlyExpenses.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className="text-2xl font-display font-bold text-success">₹{Math.max(0, totalAllocated - finance.monthlyExpenses).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Budget Items */}
      <div className="space-y-4">
        {budgetItems.map((b, i) => {
          const spent = Math.round(b.allocated * (0.5 + Math.random() * 0.5));
          const pct = Math.min(100, Math.round((spent / b.allocated) * 100));
          return (
            <motion.div
              key={b.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: b.color }} />
                  <span className="text-sm font-medium">{b.category}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ₹{spent.toLocaleString('en-IN')} / ₹{b.allocated.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                  className="h-full rounded-full"
                  style={{ background: pct > 90 ? '#ef4444' : b.color }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-right">{pct}%</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Budget;
