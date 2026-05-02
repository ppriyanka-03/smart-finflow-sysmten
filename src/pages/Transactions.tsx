import { useFinance, Transaction } from '@/contexts/FinanceContext';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Transactions = () => {
  const { transactions } = useFinance();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (search) result = result.filter(t => t.description.toLowerCase().includes(search.toLowerCase()) || (t.recipient?.toLowerCase().includes(search.toLowerCase())));
    if (typeFilter !== 'all') result = result.filter(t => t.type === typeFilter);
    if (sortBy === 'amount') result.sort((a, b) => b.amount - a.amount);
    else result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return result;
  }, [transactions, search, typeFilter, sortBy]);

  const formatCurrency = (n: number) => '₹' + n.toLocaleString('en-IN');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-muted-foreground">View and filter all your transactions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary/50" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-secondary/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="emi">EMI</SelectItem>
            <SelectItem value="cashback">Cashback</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 bg-secondary/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">By Date</SelectItem>
            <SelectItem value="amount">By Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transaction List */}
      <div className="glass-card divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No transactions found</div>
        ) : filtered.map((tx, i) => {
          const isIncome = tx.type ? (tx.type === 'income' || tx.type === 'cashback') : tx.amount > 0;
          return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center justify-between p-4 hover:bg-glass-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isIncome ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
              }`}>
                {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-medium">{tx.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{tx.date}</span>
                  {tx.method && <span className="px-1.5 py-0.5 rounded bg-secondary text-xs">{tx.method}</span>}
                  {tx.recipient && <span>→ {tx.recipient}</span>}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                {isIncome ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
              </p>
              {tx.cashbackEarned && <p className="text-xs text-green-500">+₹{tx.cashbackEarned} cashback</p>}
            </div>
          </motion.div>
        )})}
      </div>
    </div>
  );
};

export default Transactions;
