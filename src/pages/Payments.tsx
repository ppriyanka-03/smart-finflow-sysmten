import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Smartphone, Building, Wallet, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const paymentMethods = [
  { id: 'UPI', label: 'UPI', icon: Smartphone, cashback: '0%' },
  { id: 'Card', label: 'Credit/Debit Card', icon: CreditCard, cashback: '2%' },
  { id: 'Net Banking', label: 'Net Banking', icon: Building, cashback: '1%' },
  { id: 'Wallet', label: 'Wallet Payment', icon: Wallet, cashback: '5%' },
  { id: 'Email', label: 'Email Transfer', icon: Mail, cashback: '1%' },
];

const Payments = () => {
  const { makePayment, totalBalance, walletBalance } = useFinance();
  const { addNotification } = useNotifications();
  const [recipient, setRecipient] = useState('');
  const [accountId, setAccountId] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cashbackEarned, setCashbackEarned] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [notifiedEmail, setNotifiedEmail] = useState('');

  const handlePayment = () => {
    if (!recipient || !amount || !method || !description) {
      setErrorMsg('Please fill all fields');
      setStatus('error');
      return;
    }
    if (method === 'Email' && !recipientEmail) {
      setErrorMsg('Please enter recipient email address');
      setStatus('error');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Enter a valid amount');
      setStatus('error');
      return;
    }
    if (amt > totalBalance) {
      setErrorMsg('Insufficient balance');
      setStatus('error');
      return;
    }

    const result = makePayment(recipient, amt, method === 'Email' ? 'Net Banking' : method, description);
    if (result.success) {
      setCashbackEarned(result.cashback);
      setStatus('success');

      // Send in-app notification
      addNotification(
        `Payment of ₹${amt.toLocaleString('en-IN')} sent to ${recipient}${method === 'Email' ? ` (${recipientEmail})` : ''} for "${description}"`,
        'payment'
      );

      if (result.cashback > 0) {
        addNotification(`🎉 Cashback of ₹${result.cashback.toFixed(0)} credited to your wallet!`, 'cashback');
      }

      if (method === 'Email' && recipientEmail) {
        // Simulate email notification to recipient
        addNotification(`📧 Payment notification sent to ${recipientEmail}`, 'system');
        setNotifiedEmail(recipientEmail);
      }

      setRecipient('');
      setAccountId('');
      setRecipientEmail('');
      setAmount('');
      setDescription('');
      setMethod('');
    } else {
      setErrorMsg('Payment failed');
      setStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Payments</h1>
        <p className="text-sm text-muted-foreground">Send money securely</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Available Balance</p>
          <p className="text-2xl font-display font-bold text-primary">₹{totalBalance.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Wallet Balance</p>
          <p className="text-2xl font-display font-bold text-info">₹{walletBalance.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass-card p-8 text-center glow-effect">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <CheckCircle className="w-20 h-20 text-success mx-auto mb-4" />
            </motion.div>
            <h2 className="font-display text-xl font-bold mb-2">Payment Successful!</h2>
            {cashbackEarned > 0 && (
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-lg text-success font-semibold mb-2">
                🎉 You earned ₹{cashbackEarned.toFixed(0)} cashback!
              </motion.p>
            )}
            {notifiedEmail && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-3 p-3 rounded-lg bg-info/10 border border-info/20 inline-flex items-center gap-2"
              >
                <Mail className="w-4 h-4 text-info" />
                <span className="text-sm text-info">Notification sent to <strong>{notifiedEmail}</strong></span>
              </motion.div>
            )}
            <div className="mt-6">
              <Button onClick={() => { setStatus('idle'); setNotifiedEmail(''); }} className="bg-primary text-primary-foreground">
                Make Another Payment
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-5">
            {status === 'error' && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {errorMsg}
              </div>
            )}

            {/* Payment Method Selection */}
            <div>
              <label className="text-sm font-medium mb-3 block">Payment Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {paymentMethods.map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => { setMethod(pm.id); setStatus('idle'); }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                      method === pm.id ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30 hover:border-primary/30'
                    }`}
                  >
                    <pm.icon className={`w-6 h-6 mx-auto mb-2 ${method === pm.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="text-xs font-medium">{pm.label}</p>
                    <p className="text-xs text-primary mt-1">{pm.cashback} cashback</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Recipient Name</label>
                <Input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Enter name" className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {method === 'Email' ? 'Recipient Email' : 'Account / UPI ID'}
                </label>
                {method === 'Email' ? (
                  <Input
                    type="email"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="bg-secondary/50"
                  />
                ) : (
                  <Input value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="Enter ID" className="bg-secondary/50" />
                )}
              </div>
            </div>

            {/* Show email field alongside account ID for non-email methods */}
            {method !== 'Email' && method !== '' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-info" />
                  Recipient Email <span className="text-xs text-muted-foreground">(optional — for payment notification)</span>
                </label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="bg-secondary/50"
                />
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Amount (₹)</label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Payment for..." className="bg-secondary/50" />
              </div>
            </div>

            <Button onClick={handlePayment} className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90">
              {method === 'Email' ? '📧 Send Payment & Notify' : 'Send Payment'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payments;
