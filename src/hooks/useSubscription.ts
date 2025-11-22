import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type AccountStatus =
  | 'trial_active'
  | 'trial_expired'
  | 'premium_active'
  | 'premium_cancelled'
  | 'suspended'
  | 'deleted';

export interface SubscriptionStatus {
  accountStatus: AccountStatus | null;
  hasAccess: boolean;
  isReadOnly: boolean;
  daysRemaining: number;
  trialEndsAt: string | null;
  deletionScheduledAt: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function useSubscription(): SubscriptionStatus {
  const [status, setStatus] = useState<SubscriptionStatus>({
    accountStatus: null,
    hasAccess: false,
    isReadOnly: true,
    daysRemaining: 0,
    trialEndsAt: null,
    deletionScheduledAt: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    let refreshInterval: number | undefined;

    async function fetchStatus() {
      try {
        const { data, error } = await supabase.rpc('check_trial_status');

        if (error) throw error;

        if (isMounted && data) {
          setStatus({
            accountStatus: data.accountStatus as AccountStatus,
            hasAccess: data.hasAccess || false,
            isReadOnly: data.isReadOnly || false,
            daysRemaining: data.daysRemaining || 0,
            trialEndsAt: data.trialEndsAt || null,
            deletionScheduledAt: data.deletionScheduledAt || null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
        if (isMounted) {
          setStatus(prev => ({
            ...prev,
            isLoading: false,
            error: error as Error,
          }));
        }
      }
    }

    fetchStatus();

    refreshInterval = window.setInterval(() => {
      fetchStatus();
    }, 5 * 60 * 1000);

    const subscription = supabase
      .channel('user_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${supabase.auth.getUser().then(r => r.data.user?.id)}`,
        },
        () => {
          fetchStatus();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (refreshInterval) clearInterval(refreshInterval);
      subscription.unsubscribe();
    };
  }, []);

  return status;
}
