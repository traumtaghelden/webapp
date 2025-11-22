import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function DeletionsTab() {
  const [deletions, setDeletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeletions();
  }, []);

  const loadDeletions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          account_status,
          trial_ends_at
        `)
        .eq('account_status', 'trial_expired')
        .order('trial_ends_at', { ascending: true });

      if (error) throw error;

      const formattedDeletions = data?.map(user => {
        const trialEnd = new Date(user.trial_ends_at);
        const gracePeriodEnd = new Date(trialEnd.getTime() + 30 * 24 * 60 * 60 * 1000);

        return {
          id: user.id,
          user_id: user.id,
          full_name: user.email,
          email: user.email,
          grace_period_ends_at: gracePeriodEnd.toISOString(),
          user_profiles: { full_name: user.email, email: user.email }
        };
      }) || [];

      setDeletions(formattedDeletions);
    } catch (error) {
      console.error('Error loading deletions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getDaysRemaining = (dateString: string) => {
    const days = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return <div className="text-white text-center py-12">Lade Löschungen...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#0A1F3D]/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Trash2 className="w-6 h-6 text-red-400" />
          Geplante Löschungen
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1a3a5c] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Geplante Löschungen</p>
            <p className="text-3xl font-bold text-yellow-400">{deletions.length}</p>
          </div>
          <div className="bg-[#1a3a5c] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Heute</p>
            <p className="text-3xl font-bold text-red-400">
              {deletions.filter((d) => getDaysRemaining(d.grace_period_ends_at) <= 1).length}
            </p>
          </div>
          <div className="bg-[#1a3a5c] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Diese Woche</p>
            <p className="text-3xl font-bold text-orange-400">
              {deletions.filter((d) => getDaysRemaining(d.grace_period_ends_at) <= 7).length}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a3a5c]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">E-Mail</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Löschung geplant für
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Verbleibend
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {deletions.map((deletion: any) => {
                const daysRemaining = getDaysRemaining(deletion.grace_period_ends_at);
                const isCritical = daysRemaining <= 1;

                return (
                  <tr
                    key={deletion.id}
                    className={`hover:bg-[#1a3a5c]/50 transition-all ${
                      isCritical ? 'bg-red-500/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-white font-medium">
                      {deletion.user_profiles?.full_name || 'Unbekannt'}
                    </td>
                    <td className="px-6 py-4 text-gray-300">{deletion.user_profiles?.email}</td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDate(deletion.grace_period_ends_at)}
                    </td>
                    <td className="px-6 py-4">
                      {isCritical ? (
                        <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          {daysRemaining} Tage
                        </span>
                      ) : (
                        <span className="text-yellow-400 font-medium">{daysRemaining} Tage</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {deletions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Trash2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Keine geplanten Löschungen</p>
          </div>
        )}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-blue-400 text-sm">
          <strong>Hinweis:</strong> Löschungen können im User-Detail-Modal abgebrochen oder verschoben werden. Wähle einen User aus der Users-Tab und klicke auf "Löschung abbrechen" oder "Grace Period verlängern".
        </p>
      </div>
    </div>
  );
}
