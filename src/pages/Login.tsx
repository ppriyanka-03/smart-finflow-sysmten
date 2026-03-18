import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff, Shield, Fingerprint, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill all fields'); return; }
    setLoading(true);
    setError('');
    const success = await login(email, password);
    setLoading(false);
    if (success) navigate('/dashboard');
    else setError('Invalid credentials');
  };

  const securityFeatures = [
    { icon: Shield, text: '256-bit Encryption' },
    { icon: Fingerprint, text: 'Biometric Ready' },
    { icon: KeyRound, text: '2FA Secured' },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left Panel - Branding */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative"
        style={{
          background: 'linear-gradient(135deg, hsl(222 47% 6%) 0%, hsl(222 47% 12%) 50%, hsl(160 84% 15%) 100%)',
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 200 + i * 80,
                height: 200 + i * 80,
                border: '1px solid hsl(160 84% 39% / 0.08)',
                top: `${10 + i * 12}%`,
                left: `${-10 + i * 8}%`,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 30 + i * 10, repeat: Infinity, ease: 'linear' }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center glow-effect">
              <Zap className="w-8 h-8 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-3xl text-foreground">SmartFinance</span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Your Intelligent Financial Partner</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground leading-tight">
              Take Control of<br />
              <span className="gradient-text">Your Finances</span>
            </h1>
            <p className="text-muted-foreground mt-4 text-base leading-relaxed max-w-md">
              Track expenses, manage EMIs, earn cashback, and grow your investments — all in one powerful platform.
            </p>
          </div>

          <div className="flex gap-6">
            {securityFeatures.map((feat) => (
              <motion.div
                key={feat.text}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/40 border border-border"
              >
                <feat.icon className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">{feat.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>🔒 Bank-grade Security</span>
            <span>📊 Real-time Analytics</span>
            <span>💰 Smart Cashback</span>
          </div>
        </div>
      </motion.div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(hsl(160 84% 39%) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center glow-effect">
              <Zap className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-2xl text-foreground">SmartFinance</span>
          </div>

          <div className="glass-card p-8 glow-effect">
            <h1 className="font-display text-2xl font-bold text-center mb-1">Welcome Back</h1>
            <p className="text-sm text-muted-foreground text-center mb-8">Sign in to your secure account</p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10 bg-secondary/50 border-border focus:border-primary h-12 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-secondary/50 border-border focus:border-primary h-12 text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" checked={remember} onCheckedChange={(c) => setRemember(c === true)} />
                  <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Remember me</label>
                </div>
                <button type="button" onClick={() => setForgotOpen(true)} className="text-sm text-primary hover:underline font-medium">
                  Forgot Password?
                </button>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base">
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                ) : (
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Sign In Securely
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              New to SmartFinance?{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold">Create an account</Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" /> Protected by 256-bit SSL encryption
          </p>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Reset Password</DialogTitle>
          </DialogHeader>
          {resetSent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Reset link sent to your email!</p>
              <Button onClick={() => { setResetSent(false); setForgotOpen(false); }} variant="outline" className="mt-4">Close</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter your email to receive a password reset link.</p>
              <Input placeholder="Email address" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="bg-secondary/50" />
              <Button onClick={() => setResetSent(true)} className="w-full bg-primary text-primary-foreground">
                Send Reset Link
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
