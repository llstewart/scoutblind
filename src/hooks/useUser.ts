'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

const FREE_SIGNUP_CREDITS = 5;

interface Subscription {
  tier: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  credits_remaining: number;
  credits_purchased: number;
  credits_monthly_allowance: number;
  current_period_end: string | null;
}

interface UseUserReturn {
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;
  credits: number;
  tier: string;
  refreshUser: () => Promise<void>;
  deductCredit: (amount?: number) => Promise<boolean>;
  getCredits: () => Promise<number>;
}

const defaultSubscription: Subscription = {
  tier: 'free',
  status: 'active',
  credits_remaining: FREE_SIGNUP_CREDITS,
  credits_purchased: 0,
  credits_monthly_allowance: 0,
  current_period_end: null,
};

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch subscription data
        const { data: sub, error: fetchError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (sub) {
          setSubscription(sub as Subscription);
        } else if (fetchError?.code === 'PGRST116') {
          // No subscription found - call API to create one with free credits
          console.log('[useUser] No subscription found, calling init API...');
          try {
            const response = await fetch('/api/init-subscription', { method: 'POST' });
            if (response.ok) {
              // Refetch subscription after creation
              const { data: newSub } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

              if (newSub) {
                setSubscription(newSub as Subscription);
              } else {
                setSubscription(defaultSubscription);
              }
            } else {
              console.error('[useUser] Init subscription API failed');
              setSubscription(defaultSubscription);
            }
          } catch (apiError) {
            console.error('[useUser] Error calling init subscription API:', apiError);
            setSubscription(defaultSubscription);
          }
        } else {
          setSubscription(defaultSubscription);
        }
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUser();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          fetchUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSubscription(null);
        }
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, [fetchUser, supabase.auth]);

  // Get fresh credits from database (bypasses React state timing issues)
  const getCredits = useCallback(async (): Promise<number> => {
    if (!user) return 0;

    try {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('credits_remaining, credits_purchased')
        .eq('user_id', user.id)
        .single();

      if (sub) {
        return (sub.credits_remaining || 0) + (sub.credits_purchased || 0);
      }
      return 0;
    } catch (error) {
      console.error('Error fetching credits:', error);
      return 0;
    }
  }, [user, supabase]);

  const deductCredit = useCallback(async (amount: number = 1): Promise<boolean> => {
    if (!user) return false;

    try {
      // First check if user has enough credits
      const currentCredits = await getCredits();
      if (currentCredits < amount) {
        console.error(`Insufficient credits: need ${amount}, have ${currentCredits}`);
        return false;
      }

      const { data, error } = await supabase.rpc('deduct_credits', {
        p_user_id: user.id,
        p_amount: amount,
        p_description: 'Business analysis',
      });

      if (error) {
        console.error('Error deducting credit:', error);
        return false;
      }

      // Refresh subscription data
      await fetchUser();
      return data === true;
    } catch (error) {
      console.error('Error deducting credit:', error);
      return false;
    }
  }, [user, supabase, fetchUser, getCredits]);

  const credits = subscription
    ? subscription.credits_remaining + subscription.credits_purchased
    : 0;

  const tier = subscription?.tier || 'free';

  return {
    user,
    subscription,
    isLoading,
    credits,
    tier,
    refreshUser: fetchUser,
    deductCredit,
    getCredits,
  };
}
