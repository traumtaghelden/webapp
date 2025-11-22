import React, { useState, useEffect } from 'react';
import { Crown, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function PremiumTab() {
  const [premiumUsers, setPremiumUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPremiumUsers();
  }, []);

  const loadPremiumUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          account_status,
          premium_since
        `)
        .in('account_status', ['premium_active', 'premium_cancelled'])
        .order('premium_since', { ascending: false });

      if (error) throw error;

      const formattedUsers = data?.map(user => ({
        id: user.id,
        user_id: user.id,
        full_name: user.email,
        email: user.email,
        is_premium: user.account_status === 'premium_active',
        premium_activated_at: user.premium_since,
        premium_expires_at: null,
        user_profiles: { full_name: user.email, email: user.email }
      })) || [];

      setPremiumUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading premium users:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(dateString));
  };

  if (loading) {
    return <div className="text-white text-center py-12">Lade Premium-User...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#0A1F3D]/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Crown className="w-6 h-6 text-[#F5B800]" />
          Premium Subscriptions
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1a3a5c] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Aktive Premium</p>
            <p className="text-3xl font-bold text-[#F5B800]">{premiumUsers.length}</p>
          </div>
          <div className="bg-[#1a3a5c] p-4 rounded-lg">
            <p className="text-sm text-gray-400">MRR</p>
            <p className="text-3xl font-bold text-white">
              {(premiumUsers.length * 29.99).toFixed(2)} €
            </p>
          </div>
          <div className="bg-[#1a3a5c] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Conversion Rate</p>
            <p className="text-3xl font-bold text-green-400">~15%</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a3a5c]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">E-Mail</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Aktiviert am
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {premiumUsers.map((user: any) => (
                <tr key={user.id} className="hover:bg-[#1a3a5c]/50 transition-all">
                  <td className="px-6 py-4 text-white font-medium">
                    {user.user_profiles?.full_name || 'Unbekannt'}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{user.user_profiles?.email}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {formatDate(user.premium_activated_at)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-[#F5B800]/20 text-[#F5B800] border border-[#F5B800]/30 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                      <Crown className="w-3 h-3" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {premiumUsers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Crown className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Keine Premium-User vorhanden</p>
          </div>
        )}
      </div>
    </div>
  );
}
