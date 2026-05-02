import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import loginBg from '@/assets/login-bg.jpg';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [remember, setRemember] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [forgotOpen, setForgotOpen] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetSent, setResetSent] = useState<boolean>(false);
  const [lastLogin, setLastLogin] = useState<string>('');

  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    const storedLastLogin = localStorage.getItem('lastLogin');

    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
    if (storedLastLogin) {
      setLastLogin(storedLastLogin);
    }

    // Check Supabase session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setError('Google login temporarily disabled - use email login');
  };

  const handleResetPassword = async () => {
    const normalizedEmail = resetEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      alert("Please enter your email");
      return;
    }

    try {
      const users = JSON.parse(localStorage.getItem("users")) || [];
      const user = users.find(u => u.email === normalizedEmail);

      if (!user) {
        alert("This email is not registered.");
        return;
      }

      // Simulate password reset (in real app, this would send email)
      alert(`Password reset link would be sent to: ${normalizedEmail}`);
      setResetSent(true);
      
    } catch (err) {
      console.error("Reset error:", err);
      alert("Something went wrong while sending reset email.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    setError("");

    // Supabase authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Save session info
    if (remember) {
      localStorage.setItem("savedEmail", email.trim().toLowerCase());
    } else {
      localStorage.removeItem("savedEmail");
    }
    
    localStorage.setItem("lastLogin", new Date().toISOString());

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={loginBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-card p-8 glow-effect">

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl">SmartFinance</span>
          </div>

          <h1 className="text-xl font-semibold text-center mb-1">
            Welcome Back
          </h1>
          <p className="text-sm text-center mb-6">
            Sign in to manage your finances
          </p>
          {lastLogin && (
            <p className="text-sm text-center text-gray-400 mb-4">
              Last login: {new Date(lastLogin).toLocaleString()}
            </p>
          )}

          {error && (
            <div className="mb-4 p-3 rounded bg-red-100 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email or Mobile Number */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
              <Input
                type="text"
                placeholder="Email or Mobile Number"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 !w-auto !min-h-0 p-0"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Remember + Forgot */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(val) => setRemember(val === true)}
                />
                <span className="text-sm">Remember me</span>
              </div>

              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-sm text-blue-500"
              >
                Forgot Password?
              </button>
            </div>

            {/* Button */}
            <Button type="submit" className="w-full">
              {loading ? 'Loading...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm text-muted-foreground my-2">
              -------- OR --------
            </div>

          </form>

          <p className="text-center text-sm mt-6">
            New user?{' '}
            <Link to="/register" className="text-blue-500">
              Create account
            </Link>
          </p>

        </div>
      </motion.div>

      {/* Forgot Password */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>

          {resetSent ? (
            <p className="text-center">Reset link sent (demo)</p>
          ) : (
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Enter email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <Button onClick={handleResetPassword}>
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