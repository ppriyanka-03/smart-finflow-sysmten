import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  text: string;
  created_at: string;
  read: boolean;
  type: 'payment' | 'cashback' | 'emi' | 'system';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (text: string, type: Notification['type']) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    // For local auth, get notifications from localStorage or use mock data
    const mockNotifications: Notification[] = [
      {
        id: '1',
        text: 'Welcome to SmartFinance!',
        created_at: new Date().toISOString(),
        read: false,
        type: 'system'
      }
    ];
    
    setNotifications(mockNotifications);
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Real-time subscription (disabled for local auth)
  useEffect(() => {
    if (!user) return;
    // Local auth doesn't need real-time subscriptions
  }, []);

  const addNotification = useCallback((text: string, type: Notification['type']) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      text,
      created_at: new Date().toISOString(),
      read: false,
      type
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
