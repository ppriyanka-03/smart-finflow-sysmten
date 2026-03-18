import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface Notification {
  id: string;
  text: string;
  time: string;
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

const defaultNotifications: Notification[] = [
  { id: '1', text: 'EMI payment due in 3 days', time: '2h ago', read: false, type: 'emi' },
  { id: '2', text: 'Cashback of ₹112 credited', time: '5h ago', read: false, type: 'cashback' },
  { id: '3', text: 'Salary credited ₹1,25,000', time: '1d ago', read: true, type: 'system' },
];

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = localStorage.getItem('sf_notifications');
    return stored ? JSON.parse(stored) : defaultNotifications;
  });

  const save = (notifs: Notification[]) => {
    setNotifications(notifs);
    localStorage.setItem('sf_notifications', JSON.stringify(notifs));
  };

  const addNotification = useCallback((text: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      text,
      time: 'Just now',
      read: false,
      type,
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 50);
      localStorage.setItem('sf_notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('sf_notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    save([]);
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
