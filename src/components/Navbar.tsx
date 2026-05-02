import { useAuth } from '@/contexts/AuthContext';
import { Bell, User, Sun, Moon, Menu } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onMobileMenuClick }: { onMobileMenuClick: () => void }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const isDark = theme === 'dark';

  const notifications = [
    { id: 1, text: 'EMI payment due in 3 days', time: '2h ago' },
    { id: 2, text: 'Cashback of ₹112 credited', time: '5h ago' },
    { id: 3, text: 'Salary credited ₹1,25,000', time: '1d ago' },
  ];

  return (
    <header className="h-16 border-b border-border bg-card/40 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-6">
      <div>
        <h2 className="font-display font-semibold text-foreground text-lg">
          Welcome back, <span className="gradient-text">{user?.name || 'User'}</span>
        </h2>
        <p className="text-xs text-muted-foreground">Here's your financial overview</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuClick}
          className="mobile-menu-btn w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <DropdownMenu open={showNotifs} onOpenChange={setShowNotifs}>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 bg-card border-border">
            <div className="p-3 font-display font-semibold text-sm">Notifications</div>
            <DropdownMenuSeparator />
            {notifications.map(n => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <span className="text-sm">{n.text}</span>
                <span className="text-xs text-muted-foreground">{n.time}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors">
              <User className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <div className="p-3">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="text-destructive">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;
