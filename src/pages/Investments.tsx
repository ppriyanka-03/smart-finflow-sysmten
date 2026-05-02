import { useMemo, useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import type { InvestmentItem } from '@/contexts/FinanceContext';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface InvestmentRow extends Omit<InvestmentItem, 'id'> {
  id: string;
  name?: string;
  subtitle?: string;
  type?: string;
  history?: { month: string; value: number }[];
}
import {
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  DollarSign,
  Layers,
  PieChart as PieIcon,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const allocationPalette: Record<string, string> = {
  Equity: '#10b981',
  ETF: '#3b82f6',
  Gold: '#facc15',
  FD: '#a855f7',
  PPF: '#f97316',
  Others: '#64748b',
};

const defaultPerformanceData = [
  { month: 'Sep', value: 275000 },
  { month: 'Oct', value: 285000 },
  { month: 'Nov', value: 302000 },
  { month: 'Dec', value: 320000 },
  { month: 'Jan', value: 334000 },
  { month: 'Feb', value: 340000 },
];

const defaultInvestmentRows: InvestmentRow[] = [
  {
    id: 'large-cap-fund',
    name: 'Large Cap Fund',
    subtitle: 'Equity mutual fund',
    type: 'Mutual Fund',
    investedAmount: 100000,
    currentValue: 128000,
    history: [
      { month: 'Sep', value: 98000 },
      { month: 'Oct', value: 102000 },
      { month: 'Nov', value: 105000 },
      { month: 'Dec', value: 114000 },
      { month: 'Jan', value: 122000 },
      { month: 'Feb', value: 128000 },
    ],
  },
  {
    id: 'nifty-50-etf',
    name: 'Nifty 50 ETF',
    subtitle: 'Passive index ETF',
    type: 'ETF',
    investedAmount: 80000,
    currentValue: 95000,
    history: [
      { month: 'Sep', value: 76000 },
      { month: 'Oct', value: 78000 },
      { month: 'Nov', value: 81000 },
      { month: 'Dec', value: 86000 },
      { month: 'Jan', value: 90500 },
      { month: 'Feb', value: 95000 },
    ],
  },
  {
    id: 'gold-fund',
    name: 'Gold Fund',
    subtitle: 'Commodity-linked growth',
    type: 'Gold',
    investedAmount: 50000,
    currentValue: 58000,
    history: [
      { month: 'Sep', value: 52000 },
      { month: 'Oct', value: 53000 },
      { month: 'Nov', value: 54000 },
      { month: 'Dec', value: 55000 },
      { month: 'Jan', value: 56500 },
      { month: 'Feb', value: 58000 },
    ],
  },
  {
    id: 'fixed-deposit',
    name: 'Fixed Deposit',
    subtitle: '6.5% annual yield',
    type: 'FD',
    investedAmount: 60000,
    currentValue: 64000,
    history: [
      { month: 'Sep', value: 60200 },
      { month: 'Oct', value: 60600 },
      { month: 'Nov', value: 61000 },
      { month: 'Dec', value: 61800 },
      { month: 'Jan', value: 63200 },
      { month: 'Feb', value: 64000 },
    ],
  },
  {
    id: 'ppf',
    name: 'PPF',
    subtitle: 'Long-term savings plan',
    type: 'PPF',
    investedAmount: 50000,
    currentValue: 55000,
    history: [
      { month: 'Sep', value: 50200 },
      { month: 'Oct', value: 50700 },
      { month: 'Nov', value: 51300 },
      { month: 'Dec', value: 52200 },
      { month: 'Jan', value: 53600 },
      { month: 'Feb', value: 55000 },
    ],
  },
];

const typeOptions = ['All Types', 'Mutual Fund', 'ETF', 'Gold', 'FD', 'PPF'];

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const Investments = () => {
  const finance = useFinance();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [range, setRange] = useState('This Month');
  const [selectedInvestment, setSelectedInvestment] = useState<InvestmentRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const investments = useMemo<InvestmentRow[]>(() => {
    if (Array.isArray(finance?.investments) && finance.investments.length > 0) {
      return finance.investments as InvestmentRow[];
    }
    return defaultInvestmentRows;
  }, [finance?.investments]);

  const totalInvested = investments.reduce((sum, item) => sum + ((typeof item.investedAmount === 'number' ? item.investedAmount : 0) || 0), 0);
  const computedCurrent = investments.reduce((sum, item) => sum + ((typeof item.currentValue === 'number' ? item.currentValue : 0) || 0), 0);
  const totalCurrent = computedCurrent || (typeof finance?.investmentValue === 'number' ? finance.investmentValue : 0);
  const totalReturn = totalCurrent - totalInvested;
  const totalCount = investments.length;
  const totalReturnPct = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  const allocationData = useMemo(() => {
    const categories: Record<string, number> = {
      Equity: 0,
      ETF: 0,
      Gold: 0,
      FD: 0,
      PPF: 0,
      Others: 0,
    };

    investments.forEach((investment) => {
      const type = String(investment.type ?? '').toLowerCase();
      const amount = (typeof investment.currentValue === 'number' ? investment.currentValue : 0) || 0;
      if (/equity|mutual|fund/.test(type)) {
        categories.Equity += amount;
      } else if (/etf/.test(type)) {
        categories.ETF += amount;
      } else if (/gold/.test(type)) {
        categories.Gold += amount;
      } else if (/fd/.test(type)) {
        categories.FD += amount;
      } else if (/ppf/.test(type)) {
        categories.PPF += amount;
      } else {
        categories.Others += amount;
      }
    });

    const total = Object.values(categories).reduce((sum, value) => sum + value, 0) || 1;
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      color: allocationPalette[name] ?? '#64748b',
      percent: Math.round((value / total) * 100),
    })).filter((entry) => entry.value > 0);
  }, [investments]);

  const performanceData = useMemo(() => {
    if (!investments.length || totalCurrent <= 0) {
      return defaultPerformanceData;
    }

    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    const start = Math.max(totalInvested * 0.85, totalInvested - 60000, 0);
    const step = (totalCurrent - start) / Math.max(months.length - 1, 1);

    return months.map((month, index) => ({
      month,
      value: Math.max(Math.round(start + step * index), 0),
    }));
  }, [investments.length, totalCurrent, totalInvested]);

  const insightCards = useMemo(() => {
    const totalAllocation = allocationData.reduce((sum, item) => sum + item.value, 0) || 1;
    const equityPercent = allocationData.find((item) => item.name === 'Equity')?.value ?? 0;
    const fixedPercent = allocationData.find((item) => item.name === 'FD')?.value ?? 0;
    const ppfPercent = allocationData.find((item) => item.name === 'PPF')?.value ?? 0;
    const goldPercent = allocationData.find((item) => item.name === 'Gold')?.value ?? 0;

    const equityPct = Math.round((equityPercent / totalAllocation) * 100);
    const securePct = Math.round(((fixedPercent + ppfPercent) / totalAllocation) * 100);
    const goldPct = Math.round((goldPercent / totalAllocation) * 100);

    return [
      {
        title: equityPct >= 40 ? 'Good Diversification' : 'Equity Opportunity',
        description: equityPct >= 40
          ? `Equity exposure is healthy at ${equityPct}% of the portfolio.`
          : `Current equity exposure is ${equityPct}%. Adding selective equity can help growth.`,
        icon: ShieldCheck,
        color: equityPct >= 40 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-sky-500/10 text-sky-300',
      },
      {
        title: securePct >= 30 ? 'Emergency Fund Stable' : 'Emergency Fund Alert',
        description: securePct >= 30
          ? `FD and PPF cover ${securePct}% of your portfolio, supporting stability.`
          : `Consider increasing FD/PPF allocation to strengthen your emergency reserve.`,
        icon: DollarSign,
        color: securePct >= 30 ? 'bg-amber-500/10 text-amber-300' : 'bg-slate-500/10 text-slate-300',
      },
      {
        title: goldPct >= 10 ? 'Gold Hedge Active' : 'Gold Cushion Low',
        description: goldPct >= 10
          ? `Gold makes up ${goldPct}% of the mix, helping diversify market risk.`
          : `Gold exposure is ${goldPct}%. A small increase may improve portfolio balance.`,
        icon: Sparkles,
        color: goldPct >= 10 ? 'bg-sky-500/10 text-sky-300' : 'bg-amber-500/10 text-amber-300',
      },
    ];
  }, [allocationData]);

  const filteredInvestments = useMemo(() => {
    return investments.filter((investment) => {
      const searchTerm = search.toLowerCase();
      const matchesSearch = String(investment.name ?? '').toLowerCase().includes(searchTerm) ||
        String(investment.subtitle ?? '').toLowerCase().includes(searchTerm) ||
        String(investment.type ?? '').toLowerCase().includes(searchTerm);
      const matchesType = typeFilter === 'All Types' || String(investment.type ?? '') === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [search, typeFilter, investments]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold">Investments</h1>
        <p className="text-sm text-muted-foreground">A modern view of your asset allocation, performance and holdings.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {[
          {
            title: 'Total Investment',
            value: formatCurrency(totalInvested),
            change: `${totalCount} holdings`,
            trend: 'portfolio capital',
            icon: DollarSign,
          },
          {
            title: 'Current Value',
            value: formatCurrency(totalCurrent),
            change: totalInvested > 0 ? `+${totalReturnPct.toFixed(1)}%` : '0.0%',
            trend: 'portfolio value',
            icon: BarChart3,
          },
          {
            title: 'Total Returns',
            value: formatCurrency(totalReturn),
            change: totalInvested > 0 ? `+${totalReturnPct.toFixed(1)}%` : '0.0%',
            trend: 'since purchase',
            icon: TrendingUp,
          },
          {
            title: 'Today’s Change',
            value: totalCurrent > 0 ? `+₹${Math.round(totalCurrent * 0.01).toLocaleString('en-IN')}` : '+₹0',
            change: totalCount > 0 ? '+1.2%' : '0.0%',
            trend: 'market movement',
            icon: ArrowUpRight,
          },
          {
            title: 'Investments Count',
            value: `${totalCount}`,
            change: totalCount > 0 ? `${totalCount} assets` : 'No holdings',
            trend: 'active positions',
            icon: Layers,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
              className="rounded-3xl border border-border/40 bg-background/80 p-5 shadow-sm shadow-black/10"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{card.title}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{card.value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/80 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" /> {card.change}
                </span>
                <span>{card.trend}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.9fr_1fr] gap-4">
        <div className="rounded-[2rem] border border-border/40 bg-background/80 p-6 shadow-lg shadow-black/10">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Portfolio Performance</p>
              <h2 className="text-2xl font-semibold text-foreground">Smooth trend over six months</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-input bg-muted px-3 py-2 text-sm text-foreground">
              <span>{range}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(222 25% 18%)" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(215 20% 55%)" axisLine={false} tickLine={false} />
                <YAxis stroke="hsl(215 20% 55%)" axisLine={false} tickLine={false} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(222 40% 10%)',
                    border: '1px solid hsl(222 30% 22%)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#22c55e" fill="url(#performanceGradient)" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 2, fill: '#0f766e' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border/40 bg-background/80 p-6 shadow-lg shadow-black/10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Asset Allocation</p>
              <h2 className="text-2xl font-semibold text-foreground">Portfolio mix</h2>
            </div>
            <PieIcon className="h-6 w-6 text-primary" />
          </div>

          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative mx-auto h-64 w-64">
              <PieChart width={260} height={260}>
                <Pie
                  data={allocationData}
                  innerRadius={82}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="transparent"
                >
                  {allocationData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalCurrent)}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {allocationData.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-4 rounded-3xl border border-border/50 bg-slate-950/40 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-3.5 w-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.percent}%</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
        <div className="rounded-[2rem] border border-border/40 bg-background/80 p-6 shadow-lg shadow-black/10">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Investments Table</p>
              <h2 className="text-2xl font-semibold text-foreground">Holdings breakdown</h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-[240px]">
                <Input
                  placeholder="Search investments"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="bg-slate-950/60 border-slate-800 text-foreground"
                />
              </div>
              <div>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {typeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-border/40 bg-slate-950/50">
            <table className="min-w-full border-separate border-spacing-0 text-left">
              <thead className="bg-slate-950/80">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Investment</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Type</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Invested</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Current</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Returns</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Returns %</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvestments.map((investment, index) => {
                  const investedAmount = (typeof investment.investedAmount === 'number' ? investment.investedAmount : 0) || 0;
                  const currentValue = (typeof investment.currentValue === 'number' ? investment.currentValue : 0) || 0;
                  const gain = currentValue - investedAmount;
                  const gainPct = investedAmount > 0 ? ((gain / investedAmount) * 100).toFixed(1) : '0.0';
                  const isPositive = gain >= 0;
                  const badgeStyle = {
                    'Mutual Fund': 'border-emerald-500 text-emerald-300',
                    ETF: 'border-sky-500 text-sky-300',
                    Gold: 'border-amber-500 text-amber-300',
                    FD: 'border-violet-500 text-violet-300',
                    PPF: 'border-fuchsia-500 text-fuchsia-300',
                  }[String(investment.type ?? '')] || 'border-muted text-muted-foreground';

                  return (
                    <tr key={investment.id ?? (String(investment.name ?? '') || String(index))} className="border-t border-border/50 transition-colors hover:bg-slate-900/70">
                      <td className="px-5 py-4 align-top">
                        <div className="max-w-[220px]">
                          <p className="font-semibold text-foreground">{String(investment.name ?? '')}</p>
                          <p className="text-sm text-muted-foreground">{String(investment.subtitle ?? '')}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <Badge variant="outline" className={`${badgeStyle} bg-slate-950/60`}>
                          {String(investment.type ?? '')}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 align-top text-foreground">{formatCurrency(investedAmount)}</td>
                      <td className="px-5 py-4 align-top text-foreground">{formatCurrency(currentValue)}</td>
                      <td className={`px-5 py-4 align-top font-semibold ${isPositive ? 'text-emerald-300' : 'text-destructive'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(gain)}
                      </td>
                      <td className={`px-5 py-4 align-top font-semibold ${isPositive ? 'text-emerald-300' : 'text-destructive'}`}>
                        {isPositive ? '+' : ''}{gainPct}%
                      </td>
                      <td className="px-5 py-4 align-top">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-900"
                          onClick={() => {
                            setSelectedInvestment(investment);
                            setModalOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border/40 bg-background/80 p-6 shadow-lg shadow-black/10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Investment Insights</p>
              <h2 className="text-2xl font-semibold text-foreground">Actionable guidance</h2>
            </div>
            <Layers className="h-6 w-6 text-primary" />
          </div>

          <div className="grid gap-4">
            {insightCards.map((insight) => {
              const Icon = insight.icon;
              return (
                <div key={insight.title} className="rounded-3xl border border-border/40 bg-slate-950/60 p-4 shadow-sm shadow-black/10">
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${insight.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-lg font-semibold text-foreground">{insight.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{insight.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        {selectedInvestment && (
          <DialogContent className="max-w-2xl rounded-[2rem] bg-slate-950/95">
            <DialogHeader>
              <DialogTitle>{selectedInvestment.name}</DialogTitle>
              <DialogDescription className="max-w-2xl text-slate-400">
                {selectedInvestment.subtitle}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-border/50 bg-slate-900/80 p-4">
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{selectedInvestment.type}</p>
              </div>
              <div className="rounded-3xl border border-border/50 bg-slate-900/80 p-4">
                <p className="text-sm text-muted-foreground">Profit / Loss</p>
                <p className="mt-2 text-lg font-semibold text-emerald-300">+{formatCurrency((typeof selectedInvestment.currentValue === 'number' ? selectedInvestment.currentValue : 0) - (typeof selectedInvestment.investedAmount === 'number' ? selectedInvestment.investedAmount : 0))}</p>
              </div>
              <div className="rounded-3xl border border-border/50 bg-slate-900/80 p-4">
                <p className="text-sm text-muted-foreground">Invested Amount</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{formatCurrency(typeof selectedInvestment.investedAmount === 'number' ? selectedInvestment.investedAmount : 0)}</p>
              </div>
              <div className="rounded-3xl border border-border/50 bg-slate-900/80 p-4">
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{formatCurrency(typeof selectedInvestment.currentValue === 'number' ? selectedInvestment.currentValue : 0)}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-border/40 bg-slate-950/80 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Mini performance</p>
                  <p className="text-base font-semibold text-foreground">{selectedInvestment.name} trend</p>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedInvestment.history ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="modalTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" vertical={false} />
                    <XAxis dataKey="month" stroke="hsl(215 20% 55%)" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(222 40% 10%)',
                        border: '1px solid hsl(222 30% 22%)',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#38bdf8" fill="url(#modalTrend)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default Investments;
