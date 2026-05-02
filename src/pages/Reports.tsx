import { useFinance } from '@/contexts/FinanceContext';
import { motion } from 'framer-motion';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Reports = () => {
  const finance = useFinance();

  const reports = [
    { name: 'Monthly Summary - February 2026', type: 'Summary', date: '2026-02-22', size: '2.4 MB' },
    { name: 'Transaction History - Q4 2025', type: 'Transactions', date: '2026-01-05', size: '5.1 MB' },
    { name: 'Investment Report - 2025', type: 'Investments', date: '2026-01-01', size: '3.8 MB' },
    { name: 'Tax Summary - FY 2025-26', type: 'Tax', date: '2026-02-15', size: '1.2 MB' },
    { name: 'EMI Amortization Schedule', type: 'EMI', date: '2026-02-10', size: '0.8 MB' },
  ];

  const handleDownloadReport = (reportName: string) => {
    if (!finance.transactions || finance.transactions.length === 0) {
      alert('No data to download');
      return;
    }

    const headers = ['Date', 'Type', 'Amount', 'Description', 'Method', 'Recipient'];
    const rows = finance.transactions.map((tx) => [
      tx.date,
      tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
      tx.amount.toFixed(2),
      tx.description.replace(/\r?\n/g, ' '),
      tx.method ?? '',
      tx.recipient ?? '',
    ]);

    const escapeCell = (value: string) => {
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCell(String(cell))).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Download and view your financial reports</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <FileText className="w-4 h-4 mr-2" /> Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Transactions</p>
          <p className="text-2xl font-display font-bold">{finance.transactions.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Reports Generated</p>
          <p className="text-2xl font-display font-bold">{reports.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Last Generated</p>
          <p className="text-2xl font-display font-bold text-primary">Today</p>
        </div>
      </div>

      <div className="space-y-3">
        {reports.map((r, i) => (
          <motion.div key={r.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card-hover p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.type} • {r.date} • {r.size}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => handleDownloadReport(r.name)}
            >
              <Download className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
