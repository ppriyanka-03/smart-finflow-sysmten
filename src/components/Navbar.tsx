import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, User, Sun, Moon, CheckCheck, Mail, CreditCard, Gift, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

const typeIcons: Record<string, typeof Bell> = {
  payment: CreditCard,
  cashback: Gift,
  emi: AlertTriangle,
  system: Mail,
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);

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
          onClick={() => setDarkMode(!darkMode)}
          className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <DropdownMenu open={showNotifs} onOpenChange={setShowNotifs}>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-card border-border max-h-96 overflow-y-auto">
            <div className="p-3 flex items-center justify-between">
              <span className="font-display font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
            ) : (
              notifications.slice(0, 15).map(n => {
                const Icon = typeIcons[n.type] || Bell;
                return (
                  <DropdownMenuItem key={n.id} className="flex items-start gap-3 p-3 cursor-pointer">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      n.read ? 'bg-secondary' : 'bg-primary/15'
                    }`}>
                      <Icon className={`w-4 h-4 ${n.read ? 'text-muted-foreground' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm block leading-snug ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>{n.text}</span>
                      <span className="text-xs text-muted-foreground mt-0.5 block">{n.time}</span>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                  </DropdownMenuItem>
                );
              })
            )}
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
