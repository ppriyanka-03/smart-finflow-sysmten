import { useFinance } from '@/contexts/FinanceContext';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const investments = [
  { name: 'Large Cap Fund', invested: 100000, current: 128000, type: 'Mutual Fund' },
  { name: 'Nifty 50 ETF', invested: 80000, current: 95000, type: 'ETF' },
  { name: 'Gold Fund', invested: 50000, current: 58000, type: 'Gold' },
  { name: 'Fixed Deposit', invested: 60000, current: 64000, type: 'FD' },
  { name: 'PPF', invested: 50000, current: 55000, type: 'PPF' },
];

const portfolioData = [
  { month: 'Sep', value: 300000 },
  { month: 'Oct', value: 312000 },
  { month: 'Nov', value: 305000 },
  { month: 'Dec', value: 325000 },
  { month: 'Jan', value: 335000 },
  { month: 'Feb', value: 340000 },
];

const Investments = () => {
  const finance = useFinance();
  const totalInvested = investments.reduce((s, i) => s + i.invested, 0);
  const totalCurrent = investments.reduce((s, i) => s + i.current, 0);
  const totalReturn = totalCurrent - totalInvested;
  const returnPct = ((totalReturn / totalInvested) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Investments</h1>
        <p className="text-sm text-muted-foreground">Your portfolio overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Invested</p>
          <p className="text-2xl font-display font-bold">₹{totalInvested.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Current Value</p>
          <p className="text-2xl font-display font-bold text-primary">₹{totalCurrent.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Returns</p>
          <p className="text-2xl font-display font-bold text-success">+₹{totalReturn.toLocaleString('en-IN')} ({returnPct}%)</p>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-display font-semibold mb-4">Portfolio Growth</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={portfolioData}>
            <defs>
              <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
            <XAxis dataKey="month" stroke="hsl(215 20% 55%)" fontSize={12} />
            <YAxis stroke="hsl(215 20% 55%)" fontSize={12} tickFormatter={v => `₹${(v/1000)}k`} />
            <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 30% 22%)', borderRadius: '8px' }} />
            <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#portGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {investments.map((inv, i) => {
          const ret = inv.current - inv.invested;
          const pct = ((ret / inv.invested) * 100).toFixed(1);
          const isPositive = ret >= 0;
          return (
            <motion.div key={inv.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card-hover p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{inv.name}</p>
                  <p className="text-xs text-muted-foreground">{inv.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">₹{inv.current.toLocaleString('en-IN')}</p>
                  <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{pct}%
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Investments;
