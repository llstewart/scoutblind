'use client';

import { createContext, useContext, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';

interface AuthContextValue {
  user: ReturnType<typeof useUser>['user'];
  subscription: ReturnType<typeof useUser>['subscription'];
  isAuthLoading: boolean;
  credits: number;
  tier: string;
  isPremium: boolean;
  refreshUser: () => Promise<void>;
  getCredits: () => Promise<number>;
  deductCredit: (amount?: number) => Promise<boolean>;
  handleSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const { user, subscription, isLoading: isAuthLoading, credits, tier, refreshUser, deductCredit, getCredits } = useUser();

  const isPremium = !!user && !!subscription && subscription.tier !== 'free';

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear sessionStorage for search state
    try {
      sessionStorage.removeItem('packleads_session');
    } catch {
      // ignore
    }
    localStorage.removeItem('packleads_tour_complete');
    router.replace('/');
  }, [router]);

  const value: AuthContextValue = {
    user,
    subscription,
    isAuthLoading,
    credits,
    tier,
    isPremium,
    refreshUser,
    getCredits,
    deductCredit,
    handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
