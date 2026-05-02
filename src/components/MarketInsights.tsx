import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Sparkles, Star, Globe, Clock, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { fetchMarketData, MarketData, HistoryDataPoint } from '../services/marketService';
import { toast } from 'sonner';

const defaultMarketData: MarketData = {
  goldUSD: 2350,
  goldINR: 6300,
  silverUSD: 28.5,
  silverINR: 76,
  bitcoin: { price: 5500000, change: 2.5 },
  ethereum: { price: 320000, change: 1.8 },
  nifty: { price: 22500, change: 0.5, trend: 'up' },
  sensex: { price: 74000, change: 0.4, trend: 'up' },
  alerts: []
};

const MarketInsights = () => {
  const [data, setData] = useState<MarketData>(defaultMarketData);
  const [history, setHistory] = useState<HistoryDataPoint[]>([]);
  const [lastUpdated, setLastUpdated] = useState('Loading...');
  const [loadedLive, setLoadedLive] = useState(false);

  const loadData = async () => {
    const { data: newData, history: newHistory } = await fetchMarketData();
    
    setData(newData);
    setHistory(newHistory);
    
    // Check and show alerts
    if (newData.alerts && newData.alerts.length > 0) {
      newData.alerts.forEach(alert => {
        toast.warning(alert, { duration: 5000 });
      });
    }

    setLastUpdated(new Date().toLocaleTimeString());
    setLoadedLive(true);
  };

  useEffect(() => {
    loadData();

    // refresh every 5 minutes
    const interval = setInterval(loadData, 300000);

    return () => clearInterval(interval);
  }, []);

  const renderTrend = (direction: 'up' | 'down', value: number) => (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${direction === 'up' ? 'text-emerald-400' : 'text-destructive'}`}>
      {direction === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
      {direction === 'up' ? `+${value}%` : `${value}%`}
    </span>
  );

  // Calculate analytics
  const getWeeklyChange = (key: keyof HistoryDataPoint) => {
    if (history.length < 2) return { value: '+0.0%', isUp: true };
    // Assuming first item is oldest (mock weekly)
    const oldest = history[0][key] as number;
    const current = history[history.length - 1][key] as number;
    const diff = ((current - oldest) / oldest) * 100;
    return {
      value: `${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`,
      isUp: diff >= 0
    };
  };

  const goldWeekly = getWeeklyChange('goldINR');
  const silverWeekly = getWeeklyChange('silverINR');

  return (
    <div className="glass-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="font-display text-xl font-semibold">Market Intelligence</h3>
          <p className="text-sm text-muted-foreground">Live global markets, crypto, and stock analytics.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-900/50 px-3 py-1.5 rounded-full border border-border/50">
          <Clock className="w-4 h-4" />
          {loadedLive ? `Updated: ${lastUpdated}` : 'Loading data...'}
        </div>
      </div>

      {/* Main Metals Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <div className="glass-card-hover p-4 border border-amber-500/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Gold (24K)</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-3xl font-semibold">₹{data.goldINR.toLocaleString('en-IN', { maximumFractionDigits: 2 })}<span className="text-lg text-muted-foreground">/g</span></p>
              </div>
            </div>
            <div className="rounded-full bg-amber-500/10 p-3 h-fit text-amber-400 border border-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm relative z-10">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4" /> Global: ${data.goldUSD.toFixed(2)}/oz
            </div>
            <div className={`font-semibold ${goldWeekly.isUp ? 'text-emerald-400' : 'text-destructive'}`}>
              Weekly: {goldWeekly.value}
            </div>
          </div>
        </div>

        <div className="glass-card-hover p-4 border border-slate-400/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Silver</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-3xl font-semibold">₹{data.silverINR.toLocaleString('en-IN', { maximumFractionDigits: 2 })}<span className="text-lg text-muted-foreground">/g</span></p>
              </div>
            </div>
            <div className="rounded-full bg-slate-400/10 p-3 h-fit text-slate-300 border border-slate-400/20">
              <Star className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm relative z-10">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4" /> Global: ${data.silverUSD.toFixed(2)}/oz
            </div>
            <div className={`font-semibold ${silverWeekly.isUp ? 'text-emerald-400' : 'text-destructive'}`}>
              Weekly: {silverWeekly.value}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {history.length > 0 && (
        <div className="glass-card p-4 mb-6 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Price Trend Analytics
            </h4>
            <span className="text-xs text-muted-foreground">Last {history.length} updates</span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#fbbf24" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} domain={['auto', 'auto']} />
                <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${(val/100000).toFixed(1)}L`} domain={['auto', 'auto']} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '14px' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="goldINR" name="Gold (₹/g)" stroke="#fbbf24" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
                <Line yAxisId="right" type="monotone" dataKey="bitcoin" name="Bitcoin (₹)" stroke="#38bdf8" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Crypto & Stocks Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Bitcoin */}
        <div className="glass-card-hover p-4 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Bitcoin</p>
              <p className="text-lg font-semibold">BTC</p>
            </div>
            {renderTrend(data.bitcoin.change >= 0 ? 'up' : 'down', Math.abs(data.bitcoin.change))}
          </div>
          <p className="text-2xl font-bold">₹{data.bitcoin.price.toLocaleString('en-IN')}</p>
        </div>

        {/* Ethereum */}
        <div className="glass-card-hover p-4 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Ethereum</p>
              <p className="text-lg font-semibold">ETH</p>
            </div>
            {renderTrend(data.ethereum.change >= 0 ? 'up' : 'down', Math.abs(data.ethereum.change))}
          </div>
          <p className="text-2xl font-bold">₹{data.ethereum.price.toLocaleString('en-IN')}</p>
        </div>

        {/* NIFTY 50 */}
        <div className="glass-card-hover p-4 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Stock Index</p>
              <p className="text-lg font-semibold">NIFTY 50</p>
            </div>
            {renderTrend(data.nifty.trend, Math.abs(data.nifty.change))}
          </div>
          <p className="text-2xl font-bold">{data.nifty.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
        </div>

        {/* Sensex */}
        <div className="glass-card-hover p-4 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Stock Index</p>
              <p className="text-lg font-semibold">SENSEX</p>
            </div>
            {renderTrend(data.sensex.trend, Math.abs(data.sensex.change))}
          </div>
          <p className="text-2xl font-bold">{data.sensex.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
        </div>
      </div>
    </div>
  );
};

export default MarketInsights;
