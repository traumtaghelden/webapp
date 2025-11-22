import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Crown,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  UserPlus,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  total_users: number;
  trial_active: number;
  premium_active: number;
  trial_expired: number;
  premium_cancelled: number;
  suspended: number;
  deleted: number;
  grace_period_users: number;
  mrr: number;
}

interface UserActivity {
  id: string;
  name: string;
  email: string;
  action: string;
  timestamp: string;
}

interface Props {
  globalSearch?: string;
}

export default function DashboardOverviewTab({ globalSearch }: Props) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([]);
  const [expiringTrials, setExpiringTrials] = useState<number>(0);
  const [failedPayments, setFailedPayments] = useState<number>(0);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get user stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_user_stats');

      if (statsError) throw statsError;
      setStats(statsData);

      // Get expiring trials (next 24 hours)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: expiringData, error: expiringError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('account_status', 'trial_active')
        .lt('trial_ends_at', tomorrow.toISOString())
        .gt('trial_ends_at', new Date().toISOString());

      if (!expiringError) {
        setExpiringTrials(expiringData?.length || 0);
      }

      // Get recent user registrations (today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: recentUsers, error: recentError } = await supabase
        .from('user_profiles')
        .select('id, email, created_at')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recentError && recentUsers) {
        setRecentActivity(
          recentUsers.map((user) => ({
            id: user.id,
            name: user.email || 'Unbekannt',
            email: user.email || '',
            action: 'Registriert',
            timestamp: user.created_at,
          }))
        );
      }

      // TODO: Get failed payments from subscription_events
      setFailedPayments(0);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Lade Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowUp className="w-4 h-4" />
              <span>+12%</span>
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Gesamt Users</h3>
          <p className="text-3xl font-bold text-white">{stats?.total_users || 0}</p>
          <p className="text-xs text-gray-400 mt-2">Alle registrierten Nutzer</p>
        </div>

        {/* Active Trials */}
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <Minus className="w-4 h-4" />
              <span>0%</span>
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Aktive Trials</h3>
          <p className="text-3xl font-bold text-white">{stats?.trial_active || 0}</p>
          <p className="text-xs text-gray-400 mt-2">Im Trial-Zeitraum</p>
        </div>

        {/* Premium Users */}
        <div className="bg-gradient-to-br from-[#F5B800]/20 to-[#E0A800]/10 border border-[#F5B800]/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#F5B800] p-3 rounded-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowUp className="w-4 h-4" />
              <span>+8%</span>
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Premium Users</h3>
          <p className="text-3xl font-bold text-white">{stats?.premium_active || 0}</p>
          <p className="text-xs text-gray-400 mt-2">Aktive Subscriptions</p>
        </div>

        {/* MRR */}
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowUp className="w-4 h-4" />
              <span>+15%</span>
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">MRR</h3>
          <p className="text-3xl font-bold text-white">{formatCurrency(stats?.mrr || 0)}</p>
          <p className="text-xs text-gray-400 mt-2">Monthly Recurring Revenue</p>
        </div>
      </div>

      {/* Today Stats & Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today Stats */}
        <div className="bg-[#0A1F3D]/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#F5B800]" />
            Heute
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#1a3a5c] rounded-lg">
              <span className="text-gray-300">Neue Registrierungen</span>
              <span className="text-2xl font-bold text-white">{recentActivity.length}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#1a3a5c] rounded-lg">
              <span className="text-gray-300">Ablaufende Trials</span>
              <span className="text-2xl font-bold text-orange-400">{expiringTrials}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#1a3a5c] rounded-lg">
              <span className="text-gray-300">Premium Upgrades</span>
              <span className="text-2xl font-bold text-green-400">0</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#1a3a5c] rounded-lg">
              <span className="text-gray-300">Kündigungen</span>
              <span className="text-2xl font-bold text-red-400">0</span>
            </div>
          </div>
        </div>

        {/* Warnings & Alerts */}
        <div className="bg-[#0A1F3D]/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Warnungen & Alerts
          </h3>

          <div className="space-y-3">
            {expiringTrials > 0 && (
              <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Trials laufen heute ab</p>
                    <p className="text-sm text-gray-300">{expiringTrials} Trial(s) enden in 24h</p>
                  </div>
                  <span className="text-2xl font-bold text-orange-400">{expiringTrials}</span>
                </div>
              </div>
            )}

            {failedPayments > 0 && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Fehlgeschlagene Zahlungen</p>
                    <p className="text-sm text-gray-300">Erfordern Aufmerksamkeit</p>
                  </div>
                  <span className="text-2xl font-bold text-red-400">{failedPayments}</span>
                </div>
              </div>
            )}

            {stats && stats.grace_period_users > 0 && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Grace Period</p>
                    <p className="text-sm text-gray-300">User vor Löschung</p>
                  </div>
                  <span className="text-2xl font-bold text-yellow-400">
                    {stats.grace_period_users}
                  </span>
                </div>
              </div>
            )}

            {expiringTrials === 0 && failedPayments === 0 && stats?.grace_period_users === 0 && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Alles läuft gut!</p>
                    <p className="text-sm text-gray-300">Keine kritischen Probleme</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#0A1F3D]/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#F5B800]" />
          Neueste Aktivität (Heute)
        </h3>

        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="bg-[#1a3a5c] rounded-lg p-4 flex items-center justify-between hover:bg-[#1a3a5c]/80 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#F5B800] p-2 rounded-full">
                    <UserPlus className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{activity.name}</p>
                    <p className="text-sm text-gray-400">{activity.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-300">{activity.action}</p>
                  <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Keine neuen Registrierungen heute</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-[#0A1F3D]/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <button className="bg-[#F5B800] hover:bg-[#E0A800] text-gray-900 font-medium px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Ablaufende Trials
          </button>

          <button className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-medium px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Failed Payments
          </button>

          <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 font-medium px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2">
            <Crown className="w-4 h-4" />
            Alle Premium
          </button>

          <button className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-medium px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4" />
            Neue User
          </button>
        </div>
      </div>
    </div>
  );
}
