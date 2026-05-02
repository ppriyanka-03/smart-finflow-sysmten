import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance, BankAccount } from '@/contexts/FinanceContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Building, Repeat, Camera, DollarSign, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { RazorpayPaymentService } from '@/services/razorpay-fixed';

const actionCards = [
  { id: 'payMobile', label: 'Pay to Mobile', icon: Smartphone, subtitle: 'Send quick UPI payment' },
  { id: 'bankTransfer', label: 'Bank Transfer', icon: Building, subtitle: 'Transfer to linked bank' },
  { id: 'selfTransfer', label: 'Self Transfer', icon: Repeat, subtitle: 'Move funds between accounts' },
  { id: 'scanQR', label: 'Scan QR / Show QR', icon: Camera, subtitle: 'Scan or display a demo QR' },
  { id: 'checkBalance', label: 'Check Balance', icon: DollarSign, subtitle: 'View wallet and bank balances' },
];

type PaymentAction = 'payMobile' | 'bankTransfer' | 'selfTransfer' | 'scanQR' | 'checkBalance';

const Payments = () => {
  const { user } = useAuth();
  const { makePayment, totalBalance, walletBalance, transactions, bankAccounts } = useFinance();
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<PaymentAction>('payMobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [selfFromAccountId, setSelfFromAccountId] = useState('');
  const [selfToAccountId, setSelfToAccountId] = useState('');
  const [selfAmount, setSelfAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cashbackEarned, setCashbackEarned] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinEntry, setPinEntry] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingTransaction, setPendingTransaction] = useState<null | {
    action: PaymentAction;
    title: string;
    amount: number;
    method: string;
    recipient: string;
    description: string;
    meta?: Record<string, string>;
  }>(null);
  const [showBalanceInfo, setShowBalanceInfo] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrAmount, setQrAmount] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrError, setQrError] = useState('');
  const [qrCopyMessage, setQrCopyMessage] = useState('');
  const [qrUploadPreview, setQrUploadPreview] = useState('');
  const [qrScanError, setQrScanError] = useState('');
  const [qrScanning, setQrScanning] = useState(false);
  const [qrScanSuccess, setQrScanSuccess] = useState(false);
  const [scannedUpiId, setScannedUpiId] = useState('');
  const [scannedName, setScannedName] = useState('');
  const [scannedAmount, setScannedAmount] = useState('');
  const [scannedRaw, setScannedRaw] = useState('');

  useEffect(() => {
    if (bankAccounts.length > 0) {
      setBankAccountId(prev => prev || bankAccounts[0].id);
      setSelfFromAccountId(prev => prev || bankAccounts[0].id);
      setSelfToAccountId(prev => prev || bankAccounts[1]?.id || bankAccounts[0].id);
    }
  }, [bankAccounts]);

  const getSelectedBank = () => bankAccounts.find(account => account.id === bankAccountId);
  const getSelfFromAccount = () => bankAccounts.find(account => account.id === selfFromAccountId);
  const getSelfToAccount = () => bankAccounts.find(account => account.id === selfToAccountId);

  const hashPin = (pin: string) => btoa(pin.split('').reverse().join(''));
  const verifyPin = () => {
    const storedHash = localStorage.getItem('sf_upi_pin_hash');
    if (!storedHash) {
      setPinError('Set your UPI PIN in Settings first.');
      return false;
    }
    if (!/^[0-9]{4}$/.test(pinEntry)) {
      setPinError('Enter a 4-digit PIN.');
      return false;
    }
    if (hashPin(pinEntry) !== storedHash) {
      setPinError('Incorrect PIN.');
      return false;
    }
    setPinError('');
    return true;
  };

  const getQrPayload = () => {
    const parsed = parseFloat(qrAmount);
    const base = 'upi://pay?pa=demo@upi&pn=SmartFinFlow';
    return parsed > 0 ? `${base}&am=${parsed.toFixed(2)}` : base;
  };

  const generateQrCode = async (payload: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(payload, {
        margin: 1,
        scale: 8,
        color: { dark: '#111827', light: '#f8fafc' },
      });
      setQrCodeUrl(dataUrl);
      setQrError('');
    } catch (error) {
      setQrError('Unable to generate QR code.');
      setQrCodeUrl('');
    }
  };

  useEffect(() => {
    if (!qrModalOpen) return;
    generateQrCode(getQrPayload());
  }, [qrModalOpen, qrAmount]);

  // Auto-redirect to transactions after success
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        window.location.href = '/transactions';
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText('demo@upi');
      setQrCopyMessage('UPI ID copied to clipboard');
    } catch {
      setQrCopyMessage('Copy failed. Try again.');
    }
  };

  const parseUpiQrString = (raw: string) => {
    const data = raw.trim();
    const query = data.startsWith('upi://pay?') ? data.substring('upi://pay?'.length) : data.includes('?') ? data.split('?')[1] : data;
    const params = new URLSearchParams(query);
    return {
      pa: params.get('pa') ?? '',
      pn: params.get('pn') ?? '',
      am: params.get('am') ?? params.get('amount') ?? '',
      raw: data,
    };
  };

  const scanQrFile = async (file: File | null) => {
    setQrScanError('');
    setQrScanning(true);
    setQrScanSuccess(false);
    setScannedUpiId('');
    setScannedName('');
    setScannedAmount('');
    setScannedRaw('');
    setQrUploadPreview('');

    if (!file) {
      setQrScanning(false);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setQrUploadPreview(objectUrl);

    try {
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not create canvas context.'));
            return;
          }
          ctx.drawImage(image, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, canvas.width, canvas.height);
          if (!code?.data) {
            reject(new Error('Invalid QR Code'));
            return;
          }
          const parsed = parseUpiQrString(code.data);
          if (!parsed.pa) {
            reject(new Error('Invalid UPI QR Code'));
            return;
          }
          setScannedUpiId(parsed.pa);
          setScannedName(parsed.pn);
          setScannedAmount(parsed.am);
          setScannedRaw(parsed.raw);
          setQrScanSuccess(true);
          resolve();
        };
        image.onerror = () => reject(new Error('Unable to load uploaded image.'));
        image.src = objectUrl;
      });
    } catch (error: any) {
      setQrScanError(error?.message || 'Invalid QR Code');
    } finally {
      setQrScanning(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleClearUpload = () => {
    setQrUploadPreview('');
    setQrScanError('');
    setQrScanning(false);
    setQrScanSuccess(false);
    setScannedUpiId('');
    setScannedName('');
    setScannedAmount('');
    setScannedRaw('');
  };

  const handleUseScannedQr = () => {
    if (!qrScanSuccess) return;
    if (scannedAmount) {
      setAmount(scannedAmount);
    }
    if (/^[0-9]{10}$/.test(scannedUpiId)) {
      setMobileNumber(scannedUpiId);
    }
  };

  const handleCloseQrModal = () => {
    setQrModalOpen(false);
    setQrAmount('');
    setQrCodeUrl('');
    setQrError('');
    setQrCopyMessage('');
    handleClearUpload();
  };

  const resetForm = () => {
    setMobileNumber('');
    setAmount('');
    setDescription('');
    setSelfAmount('');
    setStatus('idle');
    setErrorMsg('');
    setPinEntry('');
    setPendingTransaction(null);
  };

  const isActionReady = () => {
    const transferAmount = parseFloat(selectedAction === 'selfTransfer' ? selfAmount : amount);
    if (selectedAction === 'payMobile') {
      return /^[6-9][0-9]{9}$/.test(mobileNumber) && transferAmount > 0 && transferAmount <= totalBalance;
    }
    if (selectedAction === 'bankTransfer') {
      const bank = getSelectedBank();
      return !!bank && transferAmount > 0 && transferAmount <= bank.balance;
    }
    if (selectedAction === 'selfTransfer') {
      const from = getSelfFromAccount();
      const to = getSelfToAccount();
      return !!from && !!to && from.id !== to.id && transferAmount > 0 && transferAmount <= from.balance;
    }
    return false;
  };

  const handleActionClick = (action: PaymentAction) => {
    setSelectedAction(action);
    setStatus('idle');
    setErrorMsg('');
    if (action === 'scanQR') {
      setQrModalOpen(true);
      setQrAmount('');
      setQrCodeUrl('');
      setQrError('');
      setQrCopyMessage('');
    } else {
      setQrModalOpen(false);
    }
  };

  const preparePayment = useCallback(async () => {
    const parsedAmount = parseFloat(amount || selfAmount);
    if (selectedAction === 'payMobile') {
      const selectedBank = getSelectedBank();
      if (!/^[6-9][0-9]{9}$/.test(mobileNumber)) {
        setErrorMsg('Enter a valid 10-digit mobile number.');
      }
      if (!selectedBank) {
        setErrorMsg('Select a linked bank account.');
      }
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMsg('Enter a valid amount.');
      }
      if (parsedAmount > selectedBank.balance || parsedAmount > totalBalance) {
        setErrorMsg('Insufficient balance.');
      }
    } else if (selectedAction === 'bankTransfer') {
      const bank = getSelectedBank();
      if (!bank) {
        setErrorMsg('Select a linked bank account.');
      }
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMsg('Enter a valid amount.');
      }
      if (parsedAmount > bank.balance) {
        setErrorMsg('Selected bank account has insufficient balance.');
      }
    } else if (selectedAction === 'selfTransfer') {
      const from = getSelfFromAccount();
      const to = getSelfToAccount();
      const transferAmount = parseFloat(selfAmount);
      if (!from || !to) {
        setErrorMsg('Choose both source and destination accounts.');
      }
      if (from.id === to.id) {
        setErrorMsg('From and To account cannot be the same.');
      }
      if (isNaN(transferAmount) || transferAmount <= 0) {
        setErrorMsg('Enter a valid amount.');
      }
      if (transferAmount > from.balance) {
        setErrorMsg('Insufficient funds in the source account.');
      }
    }
  }, [selectedAction, amount, selfAmount, mobileNumber, getSelectedBank, getSelfFromAccount, getSelfToAccount]);

  const processPayment = async () => {
    const parsedAmount = parseFloat(amount || selfAmount);
    setProcessingPayment(true);
    await preparePayment();
    if (selectedAction === 'payMobile') {
      const selectedBank = getSelectedBank();
      if (!/^[6-9][0-9]{9}$/.test(mobileNumber)) {
        setErrorMsg('Enter a valid mobile number.');
        toast.error('Please enter a valid 10-digit mobile number');
        setStatus('error');
        return;
      }
      if (!selectedBank) {
        setErrorMsg('Select a linked bank account.');
        toast.error('Please select a bank account');
        setStatus('error');
        setProcessingPayment(false);
        return;
      }
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMsg('Enter a valid amount.');
        toast.error('Please enter a valid amount greater than 0');
        setStatus('error');
        setProcessingPayment(false);
        return;
      }
      if (parsedAmount > selectedBank.balance || parsedAmount > totalBalance) {
        setErrorMsg('Insufficient balance.');
        toast.error('Insufficient balance for this transaction');
        setStatus('error');
        setProcessingPayment(false);
        return;
      }
      setPendingTransaction({
        action: 'payMobile',
        title: 'Mobile Payment',
        amount: parsedAmount,
        method: 'UPI',
        recipient: mobileNumber,
        description: description || `Mobile payment to ${mobileNumber}`,
        meta: { accountId: selectedBank.id },
      });
      setPinModalOpen(true);
      setStatus('idle');
      setErrorMsg('');
      setProcessingPayment(false);
      return;
    }

    if (selectedAction === 'bankTransfer') {
      const bank = getSelectedBank();
      if (!bank) {
        setErrorMsg('Select a linked bank account.');
        setStatus('error');
        setProcessingPayment(false);
        return;
      }
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMsg('Enter a valid amount.');
        setStatus('error');
        setProcessingPayment(false);
        return;
      }
      if (parsedAmount > bank.balance) {
        setErrorMsg('Selected bank account has insufficient balance.');
        setStatus('error');
        setProcessingPayment(false);
        return;
      }
      setPendingTransaction({
        action: 'bankTransfer',
        title: `Bank Transfer • ${bank.bankName}`,
        amount: parsedAmount,
        method: 'Net Banking',
        recipient: bank.bankName,
        description: description || `Transfer to ${bank.bankName}`,
        meta: { account: bank.accountNumber },
      });
      setPinModalOpen(true);
      setStatus('idle');
      setErrorMsg('');
      setProcessingPayment(false);
      return;
    }

    if (selectedAction === 'selfTransfer') {
      const from = getSelfFromAccount();
      const to = getSelfToAccount();
      const transferAmount = parseFloat(selfAmount);
      if (!from || !to) {
        setErrorMsg('Choose both source and destination accounts.');
        setStatus('error');
        setProcessingPayment(false);
        return;
      }
      if (from.id === to.id) {
        setErrorMsg('From and To account cannot be the same.');
        setStatus('error');
        setProcessingPayment(false);
        return;
      }
      if (isNaN(transferAmount) || transferAmount <= 0) {
        setErrorMsg('Enter a valid amount.');
        setStatus('error');
        setProcessingPayment(false);
        return;
      }
      if (transferAmount > from.balance) {
        setErrorMsg('Insufficient funds in the source account.');
        setStatus('error');
        setProcessingPayment(false);
        return;
      }
      setPendingTransaction({
        action: 'selfTransfer',
        title: `Self Transfer • ${from.bankName} → ${to.bankName}`,
        amount: transferAmount,
        method: 'Self Transfer',
        recipient: `${to.bankName}`,
        description: `Move funds from ${from.bankName} to ${to.bankName}`,
      });
      setPinModalOpen(true);
      setStatus('idle');
      setErrorMsg('');
      setProcessingPayment(false);
    }
  };

  const completePendingPayment = async () => {
    if (!pendingTransaction) return;
    if (!verifyPin()) return;

    const { action, amount: txAmount, method, recipient, description: desc } = pendingTransaction;
    let cashback = 0;

    if (action === 'bankTransfer') {
      const bank = getSelectedBank();
      // Bank account balance will be updated via database refresh after payment
      const result = await makePayment(recipient, txAmount, method, desc);
      cashback = result.cashback;
    } else if (action === 'payMobile') {
      const selectedAccountId = pendingTransaction.meta?.accountId ?? bankAccountId;
      const selectedBank = bankAccounts.find(account => account.id === selectedAccountId);

      if (!selectedBank) {
        setErrorMsg('Select a valid bank account before paying.');
        setStatus('error');
        setPinModalOpen(false);
        return;
      }

      if (txAmount <= 0 || txAmount > selectedBank.balance || txAmount > totalBalance) {
        setErrorMsg('Unable to process payment due to invalid amount or balance.');
        setStatus('error');
        setPinModalOpen(false);
        return;
      }

      // Initialize Razorpay and create payment order
      try {
        // Initialize Razorpay with environment variable
        const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
        if (razorpayKeyId) {
          RazorpayPaymentService.initialize(razorpayKeyId);
        }

        // Create payment order
        const orderResult = await RazorpayPaymentService.createOrder(
          txAmount,
          desc || `Payment to ${recipient}`,
          user?.email
        );

        if (orderResult.error) {
          setErrorMsg(`Payment order failed: ${orderResult.error}`);
          setStatus('error');
          setPinModalOpen(false);
          return;
        }

        // Open Razorpay payment modal
        const paymentResult = await RazorpayPaymentService.openPaymentModal({
          key: razorpayKeyId,
          amount: txAmount * 100, // Convert to paise
          currency: 'INR',
          name: 'Smart Finance Hub',
          description: desc || `Payment to ${recipient}`,
          image: 'https://example.com/payment-logo.png',
          order_id: orderResult.orderId,
          prefill: {
            contact: recipient,
            email: user?.email,
          },
        });

        if (!paymentResult.success) {
          setErrorMsg(`Payment failed: ${paymentResult.error}`);
          setStatus('error');
          setPinModalOpen(false);
          return;
        }

        // Payment successful - create transaction record
        const transactionResult = await makePayment(
          recipient,
          txAmount,
          'Razorpay',
          desc || `Payment to ${recipient}`,
          user?.email
        );

        if (transactionResult.success) {
          cashback = transactionResult.cashback;
          toast.success('Payment completed successfully!');
        } else {
          setErrorMsg(`Transaction recording failed: ${transactionResult.error}`);
          setStatus('error');
          setPinModalOpen(false);
          return;
        }
      } catch (error) {
        console.error('Razorpay payment error:', error);
        setErrorMsg('Payment processing failed. Please try again.');
        setStatus('error');
        setPinModalOpen(false);
        return;
      }
    } else if (action === 'selfTransfer') {
      const from = getSelfFromAccount();
      const to = getSelfToAccount();
      if (from && to) {
        // Bank account balances will be updated via database refresh after payment
        
        const transferResult = await makePayment(recipient, txAmount, method, desc);
        
        if (!transferResult.success) {
          console.error('Transfer failed:', transferResult.error);
          toast.error(transferResult.error || 'Transfer failed');
          setStatus('error');
          setPinModalOpen(false);
          return;
        }
      }
    }

    setCashbackEarned(cashback);
    setStatus('success');
    setPinModalOpen(false);
    resetForm();
  };

  const recentTransactions = transactions.filter(tx => tx.type === 'payment' || tx.type === 'cashback').slice(0, 5);

  const actionButtonLabel = selectedAction === 'payMobile'
    ? 'Pay Now'
    : selectedAction === 'bankTransfer'
      ? 'Transfer Now'
      : selectedAction === 'selfTransfer'
        ? 'Send Transfer'
        : 'Continue';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Payments</h1>
        <p className="text-sm text-muted-foreground">Experience payments like a modern UPI app</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {actionCards.map(card => {
          const Icon = card.icon;
          const isActive = selectedAction === card.id;
          return (
            <button
              key={card.id}
              onClick={() => handleActionClick(card.id as PaymentAction)}
              className={`rounded-3xl border p-5 text-left transition-all duration-200 ${isActive ? 'border-primary bg-primary/10 shadow-lg' : 'border-border bg-slate-950/50 hover:border-primary/40 hover:bg-slate-950/70'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{card.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                </div>
                <Icon className={`h-6 w-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center glow-effect">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <CheckCircle className="w-20 h-20 text-success mx-auto mb-4" />
            </motion.div>
            <h2 className="font-display text-2xl font-bold mb-3 text-success">Payment Completed Successfully ✔</h2>
            <p className="text-base text-muted-foreground mb-4">Transaction processed securely</p>
            <p className="text-sm text-muted-foreground mb-6">{pendingTransaction?.title || 'Your payment was successful.'}</p>
            {cashbackEarned > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6 p-4 rounded-2xl bg-success/10 border border-success/20">
                <p className="text-lg text-success font-semibold">
                  🎉 Cashback earned ₹{cashbackEarned.toFixed(0)}
                </p>
              </motion.div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setStatus('idle')} className="bg-primary text-primary-foreground">Send Another Payment</Button>
              <Button variant="outline" onClick={() => window.location.href = '/transactions'}>View Receipt</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Redirecting to transactions in 3 seconds...</p>
          </motion.div>
        ) : (
          <motion.div key="payment-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
            {status === 'error' && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {errorMsg}
              </div>
            )}

            {selectedAction === 'payMobile' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Pay From</label>
                  <Select value={bankAccountId} onValueChange={setBankAccountId}>
                    <SelectTrigger className="w-full bg-secondary/50">
                      <SelectValue placeholder="Select linked bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>{account.bankName} • {account.accountNumber?.slice(-4)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Mobile Number</label>
                  <Input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} placeholder="10-digit mobile" className="bg-secondary/50" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Amount (₹)</label>
                    <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="bg-secondary/50" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Note</label>
                    <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Payment note" className="bg-secondary/50" />
                  </div>
                </div>
              </div>
            )}

            {selectedAction === 'bankTransfer' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Pay From</label>
                  <Select value={bankAccountId} onValueChange={setBankAccountId}>
                    <SelectTrigger className="w-full bg-secondary/50">
                      <SelectValue placeholder="Select linked bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>{account.bankName} • {account.accountNumber?.slice(-4) || 'XXXX'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Amount (₹)</label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="bg-secondary/50" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Description</label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Bank transfer note" className="bg-secondary/50" />
                </div>
              </div>
            )}

            {selectedAction === 'selfTransfer' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">From Account</label>
                    <Select value={selfFromAccountId} onValueChange={setSelfFromAccountId}>
                      <SelectTrigger className="w-full bg-secondary/50">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>{account.bankName} • {account.accountNumber?.slice(-4) || 'XXXX'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">To Account</label>
                    <Select value={selfToAccountId} onValueChange={setSelfToAccountId}>
                      <SelectTrigger className="w-full bg-secondary/50">
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>{account.bankName} • {account.accountNumber?.slice(-4) || 'XXXX'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Amount (₹)</label>
                  <Input type="number" value={selfAmount} onChange={e => setSelfAmount(e.target.value)} placeholder="0.00" className="bg-secondary/50" />
                </div>
              </div>
            )}

            {selectedAction === 'scanQR' && (
              <div className="rounded-3xl border border-border/50 bg-slate-950/60 p-6 text-center">
                <p className="text-sm font-medium">Scan QR</p>
                <p className="text-sm text-muted-foreground mt-2">Open the demo QR generator to show a payment QR and copy the UPI ID.</p>
                <div className="mt-4 inline-flex h-48 w-48 items-center justify-center rounded-3xl border border-border bg-background text-muted-foreground">
                  QR UI Preview
                </div>
                <Button onClick={() => setQrModalOpen(true)} className="mt-4 bg-primary text-primary-foreground">Show Demo QR</Button>
              </div>
            )}

            {selectedAction === 'checkBalance' && (
              <div className="space-y-4">
                <div className="rounded-3xl border border-border/50 bg-slate-950/60 p-5">
                  <p className="text-sm font-medium">Total Balance</p>
                  <p className="text-3xl font-bold text-primary">₹{totalBalance.toLocaleString('en-IN')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-border/50 bg-slate-950/60 p-5">
                    <p className="text-sm font-medium">Wallet</p>
                    <p className="text-xl font-semibold">₹{walletBalance.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-3xl border border-border/50 bg-slate-950/60 p-5">
                    <p className="text-sm font-medium">Bank Accounts</p>
                    <p className="text-xl font-semibold">₹{bankAccounts.reduce((sum, account) => sum + account.balance, 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedAction !== 'scanQR' && selectedAction !== 'checkBalance' && (
              <Button onClick={processPayment} className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 disabled:opacity-50" disabled={!isActionReady() || processingPayment}>
                {processingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  actionButtonLabel
                )}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-bold mb-4">Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent payments yet.</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="rounded-3xl border border-border/50 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{tx.recipient || 'Unknown recipient'}</p>
                      <p className="text-sm text-muted-foreground">{tx.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${tx.type === 'income' || tx.type === 'cashback' ? 'text-success' : 'text-destructive'}`}>
                        {tx.type === 'income' || tx.type === 'cashback' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{tx.method || 'UPI'}</span>
                    <span>{tx.type === 'cashback' ? 'Cashback' : 'Payment'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-bold mb-4">Bank Accounts</h2>
          <div className="space-y-3">
            {bankAccounts.map((account) => (
              <div key={account.id} className="rounded-3xl border border-border/50 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{account.bankName}</p>
                    <p className="text-sm text-muted-foreground">{account.accountHolder} • {account.accountNumber?.slice(-4) || 'XXXX'}</p>
                  </div>
                  <p className="font-medium">₹{account.balance.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan / Show QR</DialogTitle>
            <DialogDescription>Use the demo QR code to receive a UPI payment or copy the UPI details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Amount (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={qrAmount}
                  onChange={e => setQrAmount(e.target.value)}
                  placeholder="Optional amount"
                  className="bg-secondary/50"
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-1.5">UPI ID</p>
                <div className="flex items-center justify-between gap-3 rounded-3xl border border-border/50 bg-slate-950/60 p-3">
                  <span className="text-sm">demo@upi</span>
                  <Button size="sm" onClick={handleCopyUpiId}>Copy</Button>
                </div>
                {qrCopyMessage && <p className="text-xs text-muted-foreground mt-2">{qrCopyMessage}</p>}
              </div>
            </div>

            <div className="rounded-3xl border border-border/50 bg-slate-950/60 p-4 text-center">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Demo payment QR code" className="mx-auto h-56 w-56" />
              ) : (
                <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-3xl border border-dashed border-border text-sm text-muted-foreground">
                  {qrError || 'Generating QR code...'}
                </div>
              )}
            </div>
            <div className="rounded-3xl border border-border/50 bg-slate-950/60 p-4 text-left">
              <p className="text-sm font-medium">Demo QR Details</p>
              <p className="text-xs text-muted-foreground mt-1">Tap the code with any UPI scanner or use the UPI ID to pay manually.</p>
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="font-semibold">Name:</span> SmartFinFlow</p>
                <p><span className="font-semibold">UPI ID:</span> demo@upi</p>
                <p><span className="font-semibold">Amount:</span> ₹{qrAmount ? parseFloat(qrAmount).toFixed(2) : '0.00'}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-border/50 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Upload & Scan QR</p>
                  <p className="text-sm text-muted-foreground mt-1">Upload a PNG or JPG to scan a UPI QR code from an image.</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 items-center">
                <label className="inline-flex cursor-pointer items-center rounded-full border border-border px-4 py-2 text-sm hover:border-primary/80">
                  Upload QR Image
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={e => scanQrFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <Button variant="outline" onClick={handleClearUpload} disabled={!qrUploadPreview && !scannedRaw}>Clear Upload</Button>
              </div>
              {qrUploadPreview && (
                <div className="mt-4">
                  <img src={qrUploadPreview} alt="Uploaded QR preview" className="mx-auto rounded-3xl border border-border bg-background max-h-64" />
                </div>
              )}
              {qrScanning && <p className="mt-3 text-sm text-muted-foreground">Scanning QR image…</p>}
              {qrScanError && <p className="mt-3 text-sm text-destructive">{qrScanError}</p>}
              {qrScanSuccess && <p className="mt-3 text-sm text-success">QR scanned successfully.</p>}
              {scannedRaw && (
                <div className="mt-4 space-y-2 rounded-2xl border border-border/30 bg-background p-4 text-sm">
                  <p><span className="font-semibold">UPI ID:</span> {scannedUpiId || 'Not found'}</p>
                  {scannedName && <p><span className="font-semibold">Name:</span> {scannedName}</p>}
                  {scannedAmount && <p><span className="font-semibold">Amount:</span> ₹{scannedAmount}</p>}
                  <p className="text-xs text-muted-foreground">Raw QR: {scannedRaw}</p>
                </div>
              )}
              <div className="mt-4">
                <Button onClick={handleUseScannedQr} disabled={!qrScanSuccess} className="bg-primary text-primary-foreground">Use This QR</Button>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseQrModal}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>Enter your UPI PIN to authorize this transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{pendingTransaction?.title}</p>
            <div className="rounded-3xl border border-border/50 bg-slate-950/60 p-4">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="text-3xl font-bold">₹{pendingTransaction?.amount.toFixed(0)}</p>
            </div>
            <Input type="password" maxLength={4} value={pinEntry} onChange={e => setPinEntry(e.target.value)} placeholder="Enter UPI PIN" className="bg-secondary/50" />
            {pinError && <p className="text-sm text-destructive">{pinError}</p>}
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPinModalOpen(false)}>Cancel</Button>
            <Button onClick={completePendingPayment}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;
