import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { User, Lock, Bell, Palette, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

const Settings = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [twoFA, setTwoFA] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emiReminders, setEmiReminders] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
            <Input value={email} onChange={e => setEmail(e.target.value)} className="bg-secondary/50" />
          </div>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">Save Changes</Button>
        </div>
      ),
    },
    {
      title: 'Change Password', icon: Lock, content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Current Password</label>
            <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="bg-secondary/50" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">New Password</label>
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="bg-secondary/50" />
          </div>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">Update Password</Button>
        </div>
      ),
    },
    {
      title: 'Security', icon: Shield, content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Add extra security to your account</p>
            </div>
            <Switch checked={twoFA} onCheckedChange={setTwoFA} />
          </div>
          {twoFA && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary">2FA is now enabled (simulated). A verification code would be sent to your email on each login.</p>
            </motion.div>
          )}
        </div>
      ),
    },
    {
      title: 'Notifications', icon: Bell, content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-xs text-muted-foreground">Browser notifications</p>
            </div>
            <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">EMI Reminders</p>
              <p className="text-xs text-muted-foreground">Get reminded before EMI due dates</p>
            </div>
            <Switch checked={emiReminders} onCheckedChange={setEmiReminders} />
          </div>
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
          Changes saved successfully!
        </motion.div>
      )}

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
