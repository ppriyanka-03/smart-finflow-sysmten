import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { motion } from 'framer-motion';
import { Bell, Copy, CreditCard, Key, Lock, Palette, Shield, Sparkles, Trash2, Upload, User } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/settings/ThemeToggle';
import { LanguageSwitcher } from '@/components/settings/LanguageSwitcher';

interface BankAccount {
  id: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolder?: string;
  balance: number;
  isDefault?: boolean;
}

const getDemoBankAccounts = (): BankAccount[] => [
  {
    id: 'demo-hdfc',
    bankName: 'HDFC Bank',
    accountNumber: 'XXXX1234',
    ifscCode: 'HDFC0001',
    accountHolder: 'Primary Account',
    balance: 34000,
    isDefault: true,
  },
  {
    id: 'demo-sbi',
    bankName: 'SBI Bank',
    accountNumber: 'XXXX5678',
    ifscCode: 'SBIN0002',
    accountHolder: 'Savings Account',
    balance: 25500,
    isDefault: false,
  },
];

const Settings = () => {
  const { user } = useAuth();
  const { bankAccounts, refreshData } = useFinance();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [twoFA, setTwoFA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [cashbackNotifications, setCashbackNotifications] = useState(true);
  const [goalAlerts, setGoalAlerts] = useState(false);
  const [enableAIInsights, setEnableAIInsights] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState(false);
  const [savingsReminders, setSavingsReminders] = useState(false);
  const [smartCashback, setSmartCashback] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');
  const [upiPin, setUpiPin] = useState('');
  const [upiPinConfirm, setUpiPinConfirm] = useState('');
  const [upiPinSet, setUpiPinSet] = useState(false);
  const [upiPinEntry, setUpiPinEntry] = useState('');
  const [upiPinVerifyMessage, setUpiPinVerifyMessage] = useState('');
  const [pinError, setPinError] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankError, setBankError] = useState('');
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState('Bank');
  const [autoPay, setAutoPay] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [upiPinModalOpen, setUpiPinModalOpen] = useState(false);
  const [loginActivity] = useState([
    { date: 'Today, 08:42 AM', device: 'Chrome on Windows', location: 'Home Network' },
    { date: 'Apr 24, 2026 11:02 PM', device: 'Safari on iPhone', location: 'Mobile' },
  ]);

  const paymentMethods = useMemo(() => ['Bank', 'UPI'], []);

  const showSaveMessage = (message: string) => {
    setSaveMessage(message);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const hashPin = (pin: string) => {
    return btoa(pin.split('').reverse().join(''));
  };

  const validateUpi = () => {
    if (!upiId.trim()) {
      setUpiError('UPI ID is required.');
      return false;
    }
    if (!upiId.includes('@')) {
      setUpiError('Enter a valid UPI ID including @.');
      return false;
    }
    setUpiError('');
    return true;
  };

  const saveSettings = async (updates?: { bank_accounts?: BankAccount[]; upi_id?: string }) => {
    if (!user?.email) {
      showSaveMessage('Unable to save settings without an active user.');
      return;
    }

    if (upiId && !validateUpi()) {
      showSaveMessage('Please fix UPI details before saving.');
      return;
    }

    const payload = {
      profile_name: name,
      user_email: email,
      upi_id: updates?.upi_id ?? upiId,
      bank_accounts: updates?.bank_accounts ?? bankAccounts,
      payment_method: updates?.bank_accounts ? defaultPaymentMethod : defaultPaymentMethod,
      auto_pay: autoPay,
      smart_cashback: smartCashback,
      notifications: {
        transactionAlerts,
        paymentReminders,
        cashbackNotifications,
        goalAlerts,
      },
      ai_features: {
        enableAIInsights,
        budgetAlerts,
        savingsReminders,
      },
      updated_at: new Date().toISOString(),
    };

    // Save to localStorage (primary storage)
    localStorage.setItem('sf_settings', JSON.stringify(payload));
    showSaveMessage('Settings saved successfully!');
  };

  const addBankAccount = async () => {
    if (!bankName || !accountNumber || !ifscCode) {
      setBankError('All bank account fields are required.');
      return;
    }
    
    if (!user) {
      setBankError('User not logged in.');
      return;
    }

    console.log('Adding bank account for user:', user.id);

    const nextAccount = {
      user_id: user.id,
      bank_name: bankName,
      account_number: accountNumber,
      ifsc_code: ifscCode,
      account_holder: name || 'Account Holder',
      balance: 0,
      is_default: bankAccounts.length === 0,
    };

    try {
      const { error } = await supabase.from('bank_accounts').insert([nextAccount]);
      if (error) {
        console.error('Bank account insert error:', error);
        
        // Check if the table doesn't exist
        if (error.message?.includes('Could not find the table') || error.message?.includes('does not exist')) {
          setBankError('Database tables not created. Please run the SQL from CREATE_TABLES.sql file in Supabase SQL Editor.');
        } else {
          setBankError('Failed to add bank account: ' + error.message);
        }
        return;
      }
      
      console.log('Bank account added successfully');
      
      // Clear form
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
      setBankError('');
      
      // Refresh data to show new bank account
      await refreshData();
      showSaveMessage('Bank account added successfully.');
    } catch (error) {
      console.error('Bank account add error:', error);
      setBankError('Failed to add bank account. Please check database connection.');
    }
  };

  const deleteBankAccount = async (id: string) => {
    if (!user) {
      showSaveMessage('User not logged in.');
      return;
    }

    try {
      const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
      if (error) {
        showSaveMessage('Failed to delete bank account: ' + error.message);
        return;
      }
      
      // Refresh data to show updated bank accounts
      await refreshData();
      showSaveMessage('Bank account removed successfully.');
    } catch (error) {
      showSaveMessage('Failed to delete bank account.');
    }
  };

  const setDefaultBankAccount = async (id: string) => {
    if (!user) {
      showSaveMessage('User not logged in.');
      return;
    }

    try {
      // First, reset all bank accounts to non-default
      await supabase.from('bank_accounts').update({ is_default: false }).eq('user_id', user.id);
      
      // Then set the selected one as default
      const { error } = await supabase.from('bank_accounts').update({ is_default: true }).eq('id', id);
      if (error) {
        showSaveMessage('Failed to set default bank account: ' + error.message);
        return;
      }
      
      setDefaultPaymentMethod('Bank');
      
      // Refresh data to show updated bank accounts
      await refreshData();
      showSaveMessage('Default bank account updated successfully.');
    } catch (error) {
      showSaveMessage('Failed to set default bank account.');
    }
  };

  const copyUpiToClipboard = async () => {
    if (!upiId) return;
    await navigator.clipboard.writeText(upiId);
    showSaveMessage('UPI ID copied to clipboard.');
  };

  const saveUpiPin = () => {
    if (!/^[0-9]{4}$/.test(upiPin)) {
      setPinError('Enter a 4-digit PIN.');
      return;
    }
    if (upiPin !== upiPinConfirm) {
      setPinError('UPI PIN and confirm PIN do not match.');
      return;
    }
    localStorage.setItem('sf_upi_pin_hash', hashPin(upiPin));
    setUpiPin('');
    setUpiPinConfirm('');
    setPinError('');
    setUpiPinSet(true);
    showSaveMessage('UPI PIN saved securely.');
  };

  const verifyUpiPin = () => {
    const storedHash = localStorage.getItem('sf_upi_pin_hash');
    if (!storedHash) {
      setUpiPinVerifyMessage('Set a UPI PIN before verifying.');
      return;
    }

    if (!upiPinEntry) {
      setUpiPinVerifyMessage('Enter your UPI PIN for verification.');
      return;
    }

    if (storedHash !== hashPin(upiPinEntry)) {
      setUpiPinVerifyMessage('PIN does not match. Please try again.');
      return;
    }

    setUpiPinVerifyMessage('PIN verified successfully. Ready for payment.');
    setUpiPinEntry('');
  };

  const handleExportData = () => {
    const data = {
      profile: { name, email, upiId },
      bankAccounts,
      paymentPreferences: { defaultPaymentMethod, autoPay },
      notifications: { transactionAlerts, paymentReminders, cashbackNotifications },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'smartfinflow-settings.json';
    anchor.click();
    URL.revokeObjectURL(url);
    showSaveMessage('Settings exported successfully.');
  };

  const clearAllData = async () => {
    if (!confirm('This will permanently delete all your settings, bank accounts, and preferences. Are you sure?')) return;

    if (user) {
      try {
        // Delete bank accounts from database
        await supabase.from('bank_accounts').delete().eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to clear bank accounts:', error);
      }
    }

    setName('');
    setEmail('');
    setUpiId('');
    setDefaultPaymentMethod('Bank');
    setAutoPay(false);
    setSmartCashback(false);
    setTransactionAlerts(true);
    setPaymentReminders(true);
    setCashbackNotifications(true);
    setGoalAlerts(false);
    setEnableAIInsights(false);
    setBudgetAlerts(false);
    setSavingsReminders(false);
    setTwoFA(false);
    setUpiPinSet(false);
    localStorage.removeItem('sf_settings');
    localStorage.removeItem('sf_theme');
    localStorage.removeItem('sf_upi_pin_hash');

    // Refresh data to update bank accounts
    await refreshData();
    showSaveMessage('All Settings data cleared.');
  };

  const fetchSettings = async () => {
    if (!user?.email) return;

    setLoadingSettings(true);
    
    // Use localStorage for settings instead of Supabase tables
    const storedSettings = localStorage.getItem('sf_settings');
    setLoadingSettings(false);

    if (storedSettings) {
      try {
        const data = JSON.parse(storedSettings);
        setName(data.profile_name ?? user.name ?? '');
        setEmail(data.user_email ?? user.email);
        setUpiId(data.upi_id ?? '');
        setDefaultPaymentMethod(data.payment_method ?? 'Bank');
        setAutoPay(data.auto_pay ?? false);
        setSmartCashback(data.smart_cashback ?? false);
        setTransactionAlerts(data.notifications?.transactionAlerts ?? true);
        setPaymentReminders(data.notifications?.paymentReminders ?? true);
        setCashbackNotifications(data.notifications?.cashbackNotifications ?? true);
        setGoalAlerts(data.notifications?.goalAlerts ?? false);
        setEnableAIInsights(data.ai_features?.enableAIInsights ?? false);
        setBudgetAlerts(data.ai_features?.budgetAlerts ?? false);
        setSavingsReminders(data.ai_features?.savingsReminders ?? false);
      } catch (error) {
        console.error('Settings load error:', error);
      }
    } else {
      // Set default values
      setName(user.name ?? '');
      setEmail(user.email);
    }
  };

  useEffect(() => {
    const storedPin = localStorage.getItem('sf_upi_pin_hash');
    if (storedPin) {
      setUpiPinSet(true);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [user?.email]);

  const sections = [
    {
      title: 'Profile', icon: User, content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Full Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} className="bg-secondary/50" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <Input value={email} readOnly className="bg-secondary/20" />
          </div>
          <Button onClick={() => saveSettings()} className="bg-primary text-primary-foreground">Save Profile</Button>
        </div>
      ),
    },
    {
      title: 'Linked Bank Accounts', icon: CreditCard, content: (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Bank Name</label>
              <Input value={bankName} onChange={e => setBankName(e.target.value)} className="bg-secondary/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Account Number</label>
              <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="bg-secondary/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">IFSC Code</label>
              <Input value={ifscCode} onChange={e => setIfscCode(e.target.value)} className="bg-secondary/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Account Holder Name</label>
              <Input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} className="bg-secondary/50" />
            </div>
          </div>
          {bankError && <p className="text-sm text-destructive">{bankError}</p>}
          <div className="flex flex-wrap gap-3">
            <Button onClick={addBankAccount} className="bg-primary text-primary-foreground">Add Bank Account</Button>
            <Button variant="secondary" onClick={() => saveSettings({ bank_accounts: bankAccounts })}>Save Bank Settings</Button>
          </div>
          <div className="space-y-3">
            {bankAccounts.map((account) => (
              <div key={account.id} className="rounded-3xl border border-border/50 bg-slate-950/60 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{account.bankName}</p>
                    <p className="text-sm text-muted-foreground">{account.accountHolder} • Balance ₹{account.balance.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">{account.accountNumber.replace(/.(?=.{4})/g, '•')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button variant={account.isDefault ? 'default' : 'outline'} size="sm" onClick={() => setDefaultBankAccount(account.id)}>
                      {account.isDefault ? 'Default' : 'Set Default'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteBankAccount(account.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'UPI Details', icon: Upload, content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">UPI ID</label>
            <Input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="name@upi" className="bg-secondary/50" />
            {upiError && <p className="text-sm text-destructive">{upiError}</p>}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button onClick={() => saveSettings()} className="bg-primary text-primary-foreground">Save UPI</Button>
            <Button variant="outline" onClick={copyUpiToClipboard} disabled={!upiId}>Copy UPI</Button>
          </div>
          <p className="text-sm text-muted-foreground">Current payment method: {defaultPaymentMethod}</p>
          {upiId && <p className="text-sm text-muted-foreground">Current UPI ID: {upiId}</p>}
        </div>
      ),
    },
    {
      title: 'UPI Security', icon: Key, content: (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Set 4-digit PIN</label>
              <Input type="password" maxLength={4} value={upiPin} onChange={e => setUpiPin(e.target.value)} className="bg-secondary/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Confirm PIN</label>
              <Input type="password" maxLength={4} value={upiPinConfirm} onChange={e => setUpiPinConfirm(e.target.value)} className="bg-secondary/50" />
            </div>
          </div>
          {pinError && <p className="text-sm text-destructive">{pinError}</p>}
          <div className="flex items-center gap-3">
            <Button onClick={saveUpiPin} className="bg-primary text-primary-foreground">Save UPI PIN</Button>
            <Button variant="secondary" onClick={() => setUpiPinModalOpen(true)}>Test PIN Entry</Button>
          </div>
          <p className="text-sm text-muted-foreground">UPI PIN required during payments and is stored securely on your device.</p>
          <p className="text-sm text-muted-foreground">PIN status: {upiPinSet ? 'Set' : 'Not set'}</p>
        </div>
      ),
    },
    {
      title: 'Payment Preferences', icon: Shield, content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Default Payment Method</label>
            <select value={defaultPaymentMethod} onChange={e => setDefaultPaymentMethod(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              {paymentMethods.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-Pay</p>
                <p className="text-xs text-muted-foreground">Automatically pay scheduled bills</p>
              </div>
              <Switch checked={autoPay} onCheckedChange={setAutoPay} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Smart Cashback</p>
                <p className="text-xs text-muted-foreground">Optimize cashback on eligible spends</p>
              </div>
              <Switch checked={smartCashback} onCheckedChange={setSmartCashback} />
            </div>
          </div>
          <Button onClick={() => saveSettings()} className="bg-primary text-primary-foreground">Save Payment Preferences</Button>
        </div>
      ),
    },
    {
      title: 'Notifications', icon: Bell, content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Transaction Alerts</p>
              <p className="text-xs text-muted-foreground">Get notified for every transaction</p>
            </div>
            <Switch checked={transactionAlerts} onCheckedChange={setTransactionAlerts} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Payment Reminders</p>
              <p className="text-xs text-muted-foreground">Receive reminders for upcoming payments</p>
            </div>
            <Switch checked={paymentReminders} onCheckedChange={setPaymentReminders} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Cashback Notifications</p>
              <p className="text-xs text-muted-foreground">Know when cashback is credited</p>
            </div>
            <Switch checked={cashbackNotifications} onCheckedChange={setCashbackNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Goal Alerts</p>
              <p className="text-xs text-muted-foreground">Stay on track with savings goals</p>
            </div>
            <Switch checked={goalAlerts} onCheckedChange={setGoalAlerts} />
          </div>
          <Button onClick={() => saveSettings()} className="bg-primary text-primary-foreground">Save Notification Preferences</Button>
        </div>
      ),
    },
    {
      title: 'AI & Smart Features', icon: Sparkles, content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">AI Insights</p>
              <p className="text-xs text-muted-foreground">Enable data-driven financial recommendations</p>
            </div>
            <Switch checked={enableAIInsights} onCheckedChange={setEnableAIInsights} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Budget Alert</p>
              <p className="text-xs text-muted-foreground">Receive proactive spending alerts</p>
            </div>
            <Switch checked={budgetAlerts} onCheckedChange={setBudgetAlerts} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Savings Goal Reminder</p>
              <p className="text-xs text-muted-foreground">Keep your savings targets on track</p>
            </div>
            <Switch checked={savingsReminders} onCheckedChange={setSavingsReminders} />
          </div>
          <Button onClick={() => saveSettings()} className="bg-primary text-primary-foreground">Save Smart Features</Button>
        </div>
      ),
    },
    {
      title: 'Security', icon: Shield, content: (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Current Password</label>
              <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="bg-secondary/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">New Password</label>
              <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="bg-secondary/50" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Add extra security to your account</p>
            </div>
            <Switch checked={twoFA} onCheckedChange={setTwoFA} />
          </div>
          <div className="rounded-3xl border border-border/50 bg-slate-950/60 p-4">
            <p className="text-sm font-medium text-foreground">Recent login activity</p>
            <div className="mt-3 space-y-2">
              {loginActivity.map((item, index) => (
                <div key={index} className="rounded-2xl border border-border/40 bg-background p-3 text-sm">
                  <p className="font-medium">{item.device}</p>
                  <p className="text-muted-foreground">{item.date} · {item.location}</p>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={() => showSaveMessage('Password updated in UI only.')} className="bg-primary text-primary-foreground">Update Password</Button>
        </div>
      ),
    },
    {
      title: 'Theme Settings', icon: Palette, content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-3xl border border-border/40 bg-slate-950/50 p-4">
            <div>
              <p className="text-sm font-medium">Theme Mode</p>
              <p className="text-xs text-muted-foreground">Dark or light interface preference</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Data Management', icon: Upload, content: (
        <div className="space-y-4">
          <Button onClick={handleExportData} className="bg-primary text-primary-foreground">Export Data</Button>
          <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">Clear All Data</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Data Clear</DialogTitle>
                <DialogDescription>Clearing all settings is permanent and will remove saved preferences.</DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4 flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setClearConfirmOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => { clearAllData(); setClearConfirmOpen(false); }}>Clear Data</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account preferences</p>
      </div>

      {saved && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm text-center">
          {saveMessage || 'Changes saved successfully!'}
        </motion.div>
      )}

      <Dialog open={upiPinModalOpen} onOpenChange={setUpiPinModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>UPI PIN Entry</DialogTitle>
            <DialogDescription>Simulated PIN input for payment authorization. This is a secure local verification experience.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="password" maxLength={4} value={upiPinEntry} onChange={e => setUpiPinEntry(e.target.value)} placeholder="Enter your 4-digit UPI PIN" className="bg-secondary/50" />
            {upiPinVerifyMessage && <p className="text-sm text-muted-foreground">{upiPinVerifyMessage}</p>}
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setUpiPinModalOpen(false)}>Close</Button>
            <Button onClick={verifyUpiPin}>Verify PIN</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {sections.map((s, i) => (
        <motion.div key={s.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <s.icon className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">{s.title}</h3>
          </div>
          {s.content}
        </motion.div>
      ))}
    </div>
  );
};

export default Settings;
