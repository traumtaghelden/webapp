import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AnalyticsTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: statsData } = await supabase.rpc('get_user_stats');
      const { data: conversionRate } = await supabase.rpc('get_conversion_rate');

      setStats({
        ...statsData,
        conversion_rate: conversionRate || 0,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
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

  if (loading) {
    return <div className="text-white text-center py-12">Lade Analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#0A1F3D]/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#F5B800]" />
          Analytics & Statistiken
        </h2>

        {/* Revenue Metrics */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Revenue-Metriken</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-500 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <h4 className="text-gray-400 text-sm mb-1">MRR</h4>
              <p className="text-3xl font-bold text-white">{formatCurrency(stats?.mrr || 0)}</p>
              <p className="text-xs text-gray-400 mt-2">Monthly Recurring Revenue</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <h4 className="text-gray-400 text-sm mb-1">ARR</h4>
              <p className="text-3xl font-bold text-white">
                {formatCurrency((stats?.mrr || 0) * 12)}
              </p>
              <p className="text-xs text-gray-400 mt-2">Annual Recurring Revenue</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <h4 className="text-gray-400 text-sm mb-1">ARPU</h4>
              <p className="text-3xl font-bold text-white">
                {stats?.premium_users > 0
                  ? formatCurrency((stats?.mrr || 0) / stats.premium_users)
                  : formatCurrency(0)}
              </p>
              <p className="text-xs text-gray-400 mt-2">Average Revenue Per User</p>
            </div>
          </div>
        </div>

        {/* Conversion Metrics */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Conversion-Metriken</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#1a3a5c] p-6 rounded-lg">
              <h4 className="text-gray-400 text-sm mb-2">Trial-zu-Premium Conversion Rate</h4>
              <p className="text-4xl font-bold text-[#F5B800]">
                {stats?.conversion_rate?.toFixed(1) || 0}%
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Letzte 30 Tage
              </p>
            </div>

            <div className="bg-[#1a3a5c] p-6 rounded-lg">
              <h4 className="text-gray-400 text-sm mb-2">Premium Retention</h4>
              <p className="text-4xl font-bold text-green-400">~92%</p>
              <p className="text-sm text-gray-400 mt-2">
                Durchschnittliche Retention-Rate
              </p>
            </div>
          </div>
        </div>

        {/* User Growth */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">User-Wachstum</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#1a3a5c] p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Gesamt Users</p>
              <p className="text-2xl font-bold text-white">{stats?.total_users || 0}</p>
            </div>

            <div className="bg-[#1a3a5c] p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Aktive Trials</p>
              <p className="text-2xl font-bold text-blue-400">{stats?.active_trials || 0}</p>
            </div>

            <div className="bg-[#1a3a5c] p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Premium Users</p>
              <p className="text-2xl font-bold text-[#F5B800]">{stats?.premium_users || 0}</p>
            </div>

            <div className="bg-[#1a3a5c] p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Neue heute</p>
              <p className="text-2xl font-bold text-green-400">{stats?.new_today || 0}</p>
            </div>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">User-Funnel</h3>
          <div className="space-y-3">
            <div className="bg-[#1a3a5c] p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Registrierungen</span>
                <span className="text-white font-bold">{stats?.total_users || 0}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div className="bg-blue-500 h-4 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="bg-[#1a3a5c] p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Aktive Trials</span>
                <span className="text-white font-bold">{stats?.active_trials || 0}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-orange-500 h-4 rounded-full"
                  style={{
                    width: `${
                      stats?.total_users > 0
                        ? ((stats?.active_trials || 0) / stats.total_users) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-[#1a3a5c] p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Premium Users</span>
                <span className="text-white font-bold">{stats?.premium_users || 0}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-[#F5B800] h-4 rounded-full"
                  style={{
                    width: `${
                      stats?.total_users > 0
                        ? ((stats?.premium_users || 0) / stats.total_users) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
