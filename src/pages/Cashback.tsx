import { useFinance } from '@/contexts/FinanceContext';
import { motion } from 'framer-motion';
import { Gift, Trophy, Star, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { aiService } from '@/services/aiService';

const rewardLevels = [
  { name: 'Bronze', min: 0, max: 1000, color: '#cd7f32', icon: '🥉' },
  { name: 'Silver', min: 1000, max: 5000, color: '#c0c0c0', icon: '🥈' },
  { name: 'Gold', min: 5000, max: 10000, color: '#ffd700', icon: '🥇' },
  { name: 'Platinum', min: 10000, max: Infinity, color: '#e5e4e2', icon: '💎' },
];

const Cashback = () => {
  const finance = useFinance();
  const cashbackTxs = finance.transactions.filter(t => t.type === 'cashback');

  // Generate cashback trends using aiService
  const spendingTrends = aiService.getSpendingTrends(finance.transactions);
  
  // Calculate cashback rate
  const totalExpenses = finance.transactions
    .filter(t => t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0);
  const cashbackRate = totalExpenses > 0 ? (finance.totalCashback / totalExpenses) * 100 : 0;

  const currentLevel = rewardLevels.find(l => finance.totalCashback >= l.min && finance.totalCashback < l.max) || rewardLevels[rewardLevels.length - 1];
  const nextLevel = rewardLevels[rewardLevels.indexOf(currentLevel) + 1];
  const progress = nextLevel ? ((finance.totalCashback - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100;

  const monthlyData = [
    { month: 'Sep', cashback: 420 },
    { month: 'Oct', cashback: 580 },
    { month: 'Nov', cashback: 350 },
    { month: 'Dec', cashback: 720 },
    { month: 'Jan', cashback: 630 },
    { month: 'Feb', cashback: finance.monthCashback },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Cashback Rewards</h1>
        <p className="text-sm text-muted-foreground">Track your rewards and cashback earnings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-success" />
            <span className="text-sm text-muted-foreground">Total Cashback</span>
          </div>
          <p className="text-2xl font-display font-bold text-success">₹{finance.totalCashback.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-warning" />
            <span className="text-sm text-muted-foreground">This Month</span>
          </div>
          <p className="text-2xl font-display font-bold text-warning">₹{finance.monthCashback.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Reward Level</span>
          </div>
          <p className="text-2xl font-display font-bold">{currentLevel.icon} {currentLevel.name}</p>
        </div>
      </div>

      {/* Cashback Rate */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold">Cashback Rate</h3>
            <p className="text-sm text-muted-foreground">Your effective cashback rate on all transactions</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-display font-bold text-success">{cashbackRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">₹{finance.totalCashback.toLocaleString()} earned</p>
          </div>
        </div>
      </div>

      {/* Reward Progress */}
      <div className="glass-card p-5 glow-effect">
        <h3 className="font-display font-semibold mb-3">Reward Level Progress</h3>
        <div className="flex items-center gap-4">
          {rewardLevels.map((level, i) => (
            <div key={level.name} className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">{level.icon}</span>
                {i < rewardLevels.length - 1 && <span className="text-xs text-muted-foreground">₹{level.max.toLocaleString()}</span>}
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: finance.totalCashback >= level.max ? '100%' : finance.totalCashback >= level.min ? `${progress}%` : '0%' }}
                  transition={{ duration: 1 }}
                  className="h-full rounded-full"
                  style={{ background: level.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Growth */}
      <div className="glass-card p-5">
        <h3 className="font-display font-semibold mb-4">Monthly Cashback Growth</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
            <XAxis dataKey="month" stroke="hsl(215 20% 55%)" fontSize={12} />
            <YAxis stroke="hsl(215 20% 55%)" fontSize={12} tickFormatter={v => `₹${v}`} />
            <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 30% 22%)', borderRadius: '8px' }} />
            <Bar dataKey="cashback" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cashback Trends */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">Cashback Trends</h3>
          <div className="flex items-center gap-2 text-sm text-success">
            <TrendingUp className="w-4 h-4" />
            <span>+{cashbackRate.toFixed(1)}% effective rate</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
            <XAxis dataKey="month" stroke="hsl(215 20% 55%)" fontSize={12} />
            <YAxis stroke="hsl(215 20% 55%)" fontSize={12} tickFormatter={v => `₹${v}`} />
            <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 30% 22%)', borderRadius: '8px' }} />
            <Line type="monotone" dataKey="cashback" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cashback History */}
      <div className="glass-card p-5">
        <h3 className="font-display font-semibold mb-4">Cashback History</h3>
        {cashbackTxs.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No cashback transactions yet</p>
        ) : (
          <div className="space-y-2">
            {cashbackTxs.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
                <span className="text-sm font-semibold text-success">+₹{tx.amount.toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cashback Rates */}
      <div className="glass-card p-5">
        <h3 className="font-display font-semibold mb-4">Cashback Rates</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { method: 'Wallet', rate: '5%', max: '₹500' },
            { method: 'Card', rate: '2%', max: '₹500' },
            { method: 'Net Banking', rate: '1%', max: '₹500' },
            { method: 'UPI', rate: '0%', max: '-' },
          ].map(r => (
            <div key={r.method} className="p-3 rounded-xl bg-secondary/50 text-center">
              <p className="text-sm font-medium">{r.method}</p>
              <p className="text-lg font-display font-bold text-primary">{r.rate}</p>
              <p className="text-xs text-muted-foreground">Max: {r.max}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cashback;
