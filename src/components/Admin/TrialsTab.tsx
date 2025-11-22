import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Download, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface TrialUser {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  trial_start: string;
  trial_end: string;
  days_remaining: number;
  is_premium: boolean | null;
}

type FilterType = 'all' | 'active' | 'expiring' | 'today' | 'expired';

export default function TrialsTab() {
  const { showToast } = useToast();
  const [trials, setTrials] = useState<TrialUser[]>([]);
  const [filteredTrials, setFilteredTrials] = useState<TrialUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('all');

  useEffect(() => {
    loadTrials();
  }, []);

  useEffect(() => {
    filterTrials();
  }, [trials, filterType]);

  const loadTrials = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          trial_started_at,
          trial_ends_at,
          account_status
        `)
        .eq('account_status', 'trial_active')
        .order('trial_ends_at', { ascending: true });

      if (error) throw error;

      const now = Date.now();
      const formattedTrials: TrialUser[] = data.map((user: any) => {
        const trialEnd = new Date(user.trial_ends_at).getTime();
        const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

        return {
          id: user.id,
          user_id: user.id,
          full_name: user.email,
          email: user.email,
          trial_start: user.trial_started_at,
          trial_end: user.trial_ends_at,
          days_remaining: daysRemaining,
          is_premium: false,
        };
      });

      setTrials(formattedTrials);
    } catch (error) {
      console.error('Error loading trials:', error);
      showToast('Fehler beim Laden der Trials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterTrials = () => {
    let filtered = [...trials];

    switch (filterType) {
      case 'active':
        filtered = filtered.filter((t) => t.days_remaining > 0 && !t.is_premium);
        break;
      case 'expiring':
        filtered = filtered.filter((t) => t.days_remaining <= 7 && t.days_remaining > 0 && !t.is_premium);
        break;
      case 'today':
        filtered = filtered.filter((t) => t.days_remaining <= 1 && t.days_remaining >= 0 && !t.is_premium);
        break;
      case 'expired':
        filtered = filtered.filter((t) => t.days_remaining < 0 && !t.is_premium);
        break;
      default:
        // Show all trials that are not premium
        filtered = filtered.filter((t) => !t.is_premium);
    }

    setFilteredTrials(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(dateString));
  };

  const getDaysColor = (days: number) => {
    if (days < 0) return 'text-red-400';
    if (days <= 1) return 'text-red-400';
    if (days <= 3) return 'text-orange-400';
    if (days <= 7) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getDaysBadge = (days: number) => {
    if (days < 0) {
      return (
        <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-medium">
          Abgelaufen ({Math.abs(days)}d)
        </span>
      );
    }
    if (days <= 1) {
      return (
        <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-medium animate-pulse">
          Heute
        </span>
      );
    }
    if (days <= 3) {
      return (
        <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-medium">
          {days} Tage
        </span>
      );
    }
    if (days <= 7) {
      return (
        <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-xs font-medium">
          {days} Tage
        </span>
      );
    }
    return (
      <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-medium">
        {days} Tage
      </span>
    );
  };

  const exportToCSV = () => {
    const headers = ['Name', 'E-Mail', 'Trial-Start', 'Trial-Ende', 'Verbleibende Tage'];
    const rows = filteredTrials.map((trial) => [
      trial.full_name || '',
      trial.email,
      formatDate(trial.trial_start),
      formatDate(trial.trial_end),
      trial.days_remaining.toString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trials_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeTrials = trials.filter((t) => t.days_remaining > 0 && !t.is_premium);
  const expiringToday = trials.filter((t) => t.days_remaining <= 1 && t.days_remaining >= 0 && !t.is_premium);
  const expiring3Days = trials.filter((t) => t.days_remaining <= 3 && t.days_remaining > 0 && !t.is_premium);
  const expiring7Days = trials.filter((t) => t.days_remaining <= 7 && t.days_remaining > 0 && !t.is_premium);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Lade Trials...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm">Aktive Trials</h3>
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{activeTrials.length}</p>
          <p className="text-xs text-gray-400 mt-1">Laufen aktuell</p>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm">Heute ablaufend</h3>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-3xl font-bold text-white">{expiringToday.length}</p>
          <p className="text-xs text-gray-400 mt-1">Kritisch</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm">Ablaufend (3 Tage)</h3>
            <Clock className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-3xl font-bold text-white">{expiring3Days.length}</p>
          <p className="text-xs text-gray-400 mt-1">Hohe Priorität</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm">Ablaufend (7 Tage)</h3>
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">{expiring7Days.length}</p>
          <p className="text-xs text-gray-400 mt-1">Mittlere Priorität</p>
        </div>
      </div>

      {/* Filters and Export */}
      <div className="bg-[#0A1F3D]/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Trial Management</h2>
          <button
            onClick={exportToCSV}
            className="bg-[#F5B800] hover:bg-[#E0A800] text-gray-900 font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === 'all'
                ? 'bg-[#F5B800] text-gray-900'
                : 'bg-transparent text-gray-400 border border-gray-600 hover:bg-gray-700/30'
            }`}
          >
            Alle Trials
          </button>

          <button
            onClick={() => setFilterType('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === 'active'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-transparent text-gray-400 border border-gray-600 hover:bg-gray-700/30'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Aktive
          </button>

          <button
            onClick={() => setFilterType('expiring')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === 'expiring'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-transparent text-gray-400 border border-gray-600 hover:bg-gray-700/30'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Expiring Soon (7d)
          </button>

          <button
            onClick={() => setFilterType('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === 'today'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-transparent text-gray-400 border border-gray-600 hover:bg-gray-700/30'
            }`}
          >
            Heute ablaufend
          </button>

          <button
            onClick={() => setFilterType('expired')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === 'expired'
                ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                : 'bg-transparent text-gray-400 border border-gray-600 hover:bg-gray-700/30'
            }`}
          >
            Abgelaufen
          </button>
        </div>
      </div>

      {/* Trials Table */}
      <div className="bg-[#0A1F3D]/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a3a5c]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">E-Mail</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Trial-Start</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Trial-Ende</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Verbleibend</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredTrials.map((trial) => (
                <tr key={trial.id} className="hover:bg-[#1a3a5c]/50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#F5B800] rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {(trial.full_name || trial.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white font-medium">{trial.full_name || 'Unbekannt'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{trial.email}</td>
                  <td className="px-6 py-4 text-gray-300">{formatDate(trial.trial_start)}</td>
                  <td className="px-6 py-4 text-gray-300">{formatDate(trial.trial_end)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-2xl font-bold ${getDaysColor(trial.days_remaining)}`}>
                      {trial.days_remaining}
                    </span>
                    <span className="text-sm text-gray-400 ml-1">Tage</span>
                  </td>
                  <td className="px-6 py-4">{getDaysBadge(trial.days_remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTrials.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl mb-2">Keine Trials gefunden</p>
            <p className="text-sm text-gray-500">
              {filterType === 'all'
                ? 'Es gibt aktuell keine Trials'
                : 'Versuche einen anderen Filter'}
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-blue-400 text-sm">
          <strong>Hinweis:</strong> Trial-Verlängerungen können direkt im User-Detail-Modal (Users-Tab) durchgeführt werden. Wähle einen User aus und klicke auf "Trial verlängern".
        </p>
      </div>
    </div>
  );
}
