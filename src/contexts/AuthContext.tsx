import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const mapSessionUser = (sessionUser: any): User | null => {
    if (!sessionUser?.email) return null;
    return {
      id: sessionUser.id,
      email: sessionUser.email,
      name:
        sessionUser.user_metadata?.display_name ??
        sessionUser.user_metadata?.full_name ??
        sessionUser.email.split('@')[0],
    };
  };

  // Load Supabase session user on refresh and auth changes.
  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (error) {
          console.error('Auth session error:', error);
          return;
        }
        
        setUser(mapSessionUser(data.session?.user ?? null));
      } catch (error) {
        console.error('Failed to load auth session:', error);
      }
    };

    loadSession();

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(mapSessionUser(session?.user ?? null));
    });

    return () => {
      mounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  // Register user in Supabase Auth.
  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            display_name: name,
            full_name: name,
          },
        },
      });

      if (error) {
        console.error('Registration failed:', error.message);
        return false;
      }

      const mapped = mapSessionUser(data.user);
      if (mapped) {
        setUser(mapped);
        console.log('User registered successfully. Data will be initialized on first login.');
      }
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  }, []);

  // Login via Supabase email/password auth.
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        console.error('Login failed:', error.message);
        return false;
      }

      const mapped = mapSessionUser(data.user);
      if (!mapped) return false;
      setUser(mapped);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  // Logout from Supabase - only clears session, preserves database data
  const logout = useCallback(async () => {
    try {
      // Only sign out from auth session, do NOT delete database data
      await supabase.auth.signOut();
      setUser(null);
      console.log('User logged out successfully. Database data preserved.');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};