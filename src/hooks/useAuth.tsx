import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password?: string, businessName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  loginAsGuest: () => void;
  isLoading: boolean;
  updateUser: (updates: { businessName?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for active session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          businessName: session.user.user_metadata?.businessName || 'আমার ব্যবসা'
        });
      }
      setIsLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          businessName: session.user.user_metadata?.businessName || 'আমার ব্যবসা'
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string) => {
    if (!password) throw new Error('পাসওয়ার্ড প্রয়োজন');
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          businessName: data.user.user_metadata?.businessName || 'আমার ব্যবসা'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password?: string, businessName?: string) => {
    if (!password) throw new Error('পাসওয়ার্ড প্রয়োজন');

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            businessName: businessName
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.user && data?.session) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          businessName: data.user.user_metadata?.businessName || 'আমার ব্যবসা'
        });
      }

      // If signup is successful but session is null, it means email confirmation is required
      if (data.user && !data.session) {
        throw new Error('CONFIRM_EMAIL_REQUIRED');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
  };

  const loginAsGuest = () => {
    setUser({
      id: 'guest',
      email: 'guest@example.com',
      businessName: 'অতিথি শপ'
    });
  };

  const updateUser = async (updates: { businessName?: string }) => {
    if (user?.id === 'guest') {
      setUser(prev => prev ? { ...prev, ...updates } : null);
      return;
    }

    const { data, error } = await supabase.auth.updateUser({
      data: { businessName: updates.businessName }
    });

    if (error) throw error;

    if (data?.user) {
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        businessName: data.user.user_metadata?.businessName || 'আমার ব্যবসা'
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, resendConfirmation, loginAsGuest, isLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
