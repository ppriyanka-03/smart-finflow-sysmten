import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const EMI = () => {
  const { emiLoans, addEMI, payEMI, totalBalance } = useFinance();
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [tenureType, setTenureType] = useState('months');
  const [emiType, setEmiType] = useState('reducing');
  const [calcResult, setCalcResult] = useState<{ emi: number; totalInterest: number; totalPayable: number; schedule: any[] } | null>(null);
  const [loanName, setLoanName] = useState('');

  const calculate = () => {
    const P = parseFloat(principal);
    const annualRate = parseFloat(rate);
    const N = tenureType === 'years' ? parseFloat(tenure) * 12 : parseFloat(tenure);
    if (!P || !annualRate || !N) return;

    const R = annualRate / 12 / 100;
    let emi: number;

    if (emiType === 'reducing') {
      emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    } else {
      emi = (P + P * annualRate * (N / 12) / 100) / N;
    }

    const totalPayable = emi * N;
    const totalInterest = totalPayable - P;

    // Generate amortization schedule
    const schedule = [];
    let balance = P;
    for (let i = 1; i <= Math.min(N, 60); i++) {
      const interest = balance * R;
      const principalPart = emi - interest;
      balance = Math.max(0, balance - principalPart);
      schedule.push({ month: i, principal: Math.round(principalPart), interest: Math.round(interest), balance: Math.round(balance) });
    }

    setCalcResult({ emi: Math.round(emi), totalInterest: Math.round(totalInterest), totalPayable: Math.round(totalPayable), schedule });
  };

  const handleAddEMI = () => {
    if (!calcResult || !loanName) return;
    const P = parseFloat(principal);
    const N = tenureType === 'years' ? parseFloat(tenure) * 12 : parseFloat(tenure);
    addEMI({
      name: loanName,
      principal: P,
      rate: parseFloat(rate),
      tenure: N,
      emi: calcResult.emi,
      totalInterest: calcResult.totalInterest,
      totalPayable: calcResult.totalPayable,
    });
    setPrincipal('');
    setRate('');
    setTenure('');
    setLoanName('');
    setCalcResult(null);
  };

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">EMI & Loans</h1>
        <p className="text-sm text-muted-foreground">Calculate and manage your EMIs</p>
      </div>

      {/* Active EMIs */}
      {emiLoans.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display font-semibold">Active EMIs</h3>
          {emiLoans.map(loan => {
            const pct = Math.round((loan.paidMonths / loan.tenure) * 100);
            return (
              <motion.div key={loan.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">{loan.name}</p>
                    <p className="text-xs text-muted-foreground">EMI: {fmt(loan.emi)} • {loan.paidMonths}/{loan.tenure} months paid</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => payEMI(loan.id)}
                    disabled={loan.paidMonths >= loan.tenure || loan.emi > totalBalance}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Pay EMI
                  </Button>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} className="h-full bg-primary rounded-full" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{pct}% complete • Remaining: {fmt(loan.emi * (loan.tenure - loan.paidMonths))}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* EMI Calculator */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold">EMI Calculator</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Loan Name</label>
            <Input value={loanName} onChange={e => setLoanName(e.target.value)} placeholder="e.g. Personal Loan" className="bg-secondary/50" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Loan Amount (₹)</label>
            <Input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} placeholder="500000" className="bg-secondary/50" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Interest Rate (%)</label>
            <Input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="8.5" className="bg-secondary/50" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Tenure</label>
            <div className="flex gap-2">
              <Input type="number" value={tenure} onChange={e => setTenure(e.target.value)} placeholder="24" className="bg-secondary/50 flex-1" />
              <Select value={tenureType} onValueChange={setTenureType}>
                <SelectTrigger className="w-28 bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <Select value={emiType} onValueChange={setEmiType}>
            <SelectTrigger className="w-48 bg-secondary/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="reducing">Reducing Balance</SelectItem>
              <SelectItem value="flat">Flat Rate</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={calculate} className="bg-primary text-primary-foreground hover:bg-primary/90">Calculate EMI</Button>
        </div>

        {calcResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                <p className="text-xs text-muted-foreground">Monthly EMI</p>
                <p className="text-xl font-display font-bold text-primary">{fmt(calcResult.emi)}</p>
              </div>
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-center">
                <p className="text-xs text-muted-foreground">Total Interest</p>
                <p className="text-xl font-display font-bold text-warning">{fmt(calcResult.totalInterest)}</p>
              </div>
              <div className="p-4 rounded-xl bg-info/10 border border-info/20 text-center">
                <p className="text-xs text-muted-foreground">Total Payable</p>
                <p className="text-xl font-display font-bold text-info">{fmt(calcResult.totalPayable)}</p>
              </div>
            </div>

            {/* Amortization Chart */}
            <div>
              <h4 className="text-sm font-medium mb-3">EMI Breakdown (Principal vs Interest)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={calcResult.schedule.filter((_, i) => i % Math.max(1, Math.floor(calcResult.schedule.length / 12)) === 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                  <XAxis dataKey="month" stroke="hsl(215 20% 55%)" fontSize={10} />
                  <YAxis stroke="hsl(215 20% 55%)" fontSize={10} />
                  <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 30% 22%)', borderRadius: '8px' }} />
                  <Bar dataKey="principal" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="interest" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <Button onClick={handleAddEMI} disabled={!loanName} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Add This EMI to Active Loans
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EMI;
