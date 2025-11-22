import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Crown,
  Heart,
  Activity,
  FileText,
  Clock,
  Calendar,
  DollarSign,
  ExternalLink,
  Plus,
  Save,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface User {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  user_role: string;
  wedding_id: string | null;
  trial_end: string | null;
  is_premium: boolean | null;
  grace_period_ends_at: string | null;
}

interface Props {
  user: User;
  onClose: () => void;
}

type TabType = 'grunddaten' | 'subscription' | 'wedding' | 'activity' | 'notes';

export default function UserDetailModal({ user, onClose }: Props) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('grunddaten');
  const [weddingData, setWeddingData] = useState<any>(null);
  const [subscriptionEvents, setSubscriptionEvents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [supportNotes, setSupportNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Trial Extension
  const [showTrialExtension, setShowTrialExtension] = useState(false);
  const [trialDays, setTrialDays] = useState(7);
  const [trialReason, setTrialReason] = useState('');

  // Grace Period Extension
  const [showGraceExtension, setShowGraceExtension] = useState(false);
  const [graceDays, setGraceDays] = useState(7);
  const [graceReason, setGraceReason] = useState('');

  useEffect(() => {
    loadUserDetails();
  }, [user.id]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);

      // Load wedding data
      if (user.wedding_id) {
        const { data: wedding } = await supabase
          .from('weddings')
          .select(`
            *,
            guests:guests(count),
            budget_items:budget_items(amount),
            tasks:tasks(count),
            timeline_events:wedding_day_blocks(count)
          `)
          .eq('id', user.wedding_id)
          .single();

        if (wedding) {
          setWeddingData(wedding);
        }
      }

      // Load subscription events
      const { data: events } = await supabase
        .from('subscription_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (events) {
        setSubscriptionEvents(events);
      }

      // Load audit logs
      const { data: logs } = await supabase
        .from('admin_audit_log')
        .select(`
          *,
          admin:user_profiles!admin_id(email)
        `)
        .eq('target_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (logs) {
        setAuditLogs(logs);
      }

      // Load support notes
      const { data: notes } = await supabase
        .from('admin_support_notes')
        .select(`
          *,
          admin:user_profiles!admin_id(email)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (notes) {
        setSupportNotes(notes);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtendTrial = async () => {
    if (!trialReason.trim()) {
      showToast('Bitte gib einen Grund ein', 'error');
      return;
    }

    try {
      setActionLoading(true);

      const { data, error } = await supabase.rpc('admin_extend_trial', {
        p_user_id: user.id,
        p_days: trialDays,
        p_reason: trialReason,
      });

      if (error) throw error;

      showToast(`Trial um ${trialDays} Tage verlängert!`, 'success');
      setShowTrialExtension(false);
      setTrialReason('');
      loadUserDetails();
    } catch (error: any) {
      console.error('Error extending trial:', error);
      showToast(error.message || 'Fehler beim Verlängern', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivatePremium = async () => {
    if (!confirm('Premium manuell aktivieren?')) return;

    try {
      setActionLoading(true);

      const { error } = await supabase.rpc('admin_activate_premium', {
        p_user_id: user.id,
        p_reason: 'Manuell durch Admin aktiviert',
      });

      if (error) throw error;

      showToast('Premium erfolgreich aktiviert!', 'success');
      loadUserDetails();
    } catch (error: any) {
      console.error('Error activating premium:', error);
      showToast(error.message || 'Fehler beim Aktivieren', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivatePremium = async () => {
    if (!confirm('Premium deaktivieren? User verliert Zugriff auf Premium-Features.')) return;

    try {
      setActionLoading(true);

      const { error } = await supabase.rpc('admin_deactivate_premium', {
        p_user_id: user.id,
        p_reason: 'Manuell durch Admin deaktiviert',
      });

      if (error) throw error;

      showToast('Premium deaktiviert!', 'success');
      loadUserDetails();
    } catch (error: any) {
      console.error('Error deactivating premium:', error);
      showToast(error.message || 'Fehler beim Deaktivieren', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!confirm('Löschung abbrechen? User behält alle Daten.')) return;

    try {
      setActionLoading(true);

      const { error } = await supabase.rpc('admin_cancel_deletion', {
        p_user_id: user.id,
        p_reason: 'Löschung durch Admin abgebrochen',
      });

      if (error) throw error;

      showToast('Löschung erfolgreich abgebrochen!', 'success');
      loadUserDetails();
    } catch (error: any) {
      console.error('Error canceling deletion:', error);
      showToast(error.message || 'Fehler beim Abbrechen', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendGracePeriod = async () => {
    if (!graceReason.trim()) {
      showToast('Bitte gib einen Grund ein', 'error');
      return;
    }

    try {
      setActionLoading(true);

      const { error } = await supabase.rpc('admin_extend_grace_period', {
        p_user_id: user.id,
        p_days: graceDays,
        p_reason: graceReason,
      });

      if (error) throw error;

      showToast(`Grace Period um ${graceDays} Tage verlängert!`, 'success');
      setShowGraceExtension(false);
      setGraceReason('');
      loadUserDetails();
    } catch (error: any) {
      console.error('Error extending grace period:', error);
      showToast(error.message || 'Fehler beim Verlängern', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      showToast('Bitte gib eine Notiz ein', 'error');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Keine Session');

      const { error } = await supabase.from('admin_support_notes').insert({
        user_id: user.id,
        admin_id: session.user.id,
        note: newNote,
      });

      if (error) throw error;

      showToast('Notiz hinzugefügt!', 'success');
      setNewNote('');
      loadUserDetails();
    } catch (error: any) {
      console.error('Error adding note:', error);
      showToast(error.message || 'Fehler beim Hinzufügen', 'error');
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

  const tabs = [
    { id: 'grunddaten' as TabType, label: 'Grunddaten', icon: User },
    { id: 'subscription' as TabType, label: 'Subscription', icon: Crown },
    { id: 'wedding' as TabType, label: 'Wedding-Daten', icon: Heart },
    { id: 'activity' as TabType, label: 'Activity', icon: Activity },
    { id: 'notes' as TabType, label: 'Support-Notizen', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-700">
          <div className="bg-[#F5B800] p-3 rounded-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{user.full_name || 'Unbekannt'}</h2>
            <p className="text-sm text-gray-300 mt-1">{user.email}</p>
            {user.user_role === 'admin' && (
              <span className="inline-block bg-[#F5B800]/20 text-[#F5B800] px-3 py-1 rounded-full text-xs font-medium mt-2">
                Admin
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 px-6 pt-4 border-b border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t-lg font-medium text-sm flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-[#F5B800] text-gray-900'
                    : 'bg-transparent text-gray-300 hover:bg-gray-700/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-white">Lade Daten...</div>
            </div>
          ) : (
            <>
              {/* Grunddaten Tab */}
              {activeTab === 'grunddaten' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                      <p className="text-white font-medium">{user.full_name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">E-Mail</label>
                      <p className="text-white font-medium">{user.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">User-ID</label>
                      <p className="text-gray-300 text-sm font-mono">{user.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Rolle</label>
                      <p className="text-white font-medium capitalize">{user.user_role}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Registriert am
                      </label>
                      <p className="text-white font-medium">{formatDate(user.created_at)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Wedding-ID
                      </label>
                      <p className="text-gray-300 text-sm font-mono">{user.wedding_id || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription Tab */}
              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  {/* Trial Info */}
                  <div className="bg-[#1a3a5c] rounded-lg p-4 border border-gray-600">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-400" />
                      Trial Status
                    </h4>

                    {user.trial_end ? (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-400">Trial-Ende</p>
                            <p className="text-white font-medium">{formatDate(user.trial_end)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Verbleibende Tage</p>
                            <p className="text-white font-medium">
                              {getDaysRemaining(user.trial_end)} Tage
                            </p>
                          </div>
                        </div>

                        {!showTrialExtension ? (
                          <button
                            onClick={() => setShowTrialExtension(true)}
                            className="bg-[#F5B800] hover:bg-[#E0A800] text-gray-900 font-medium px-4 py-2 rounded-lg transition-all"
                          >
                            Trial verlängern
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-gray-300 mb-2">Tage</label>
                              <select
                                value={trialDays}
                                onChange={(e) => setTrialDays(Number(e.target.value))}
                                className="w-full bg-[#0A1F3D] border border-gray-600 rounded-lg px-4 py-2 text-white"
                              >
                                <option value={7}>7 Tage</option>
                                <option value={14}>14 Tage</option>
                                <option value={30}>30 Tage</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-300 mb-2">
                                Grund<span className="text-red-400">*</span>
                              </label>
                              <textarea
                                value={trialReason}
                                onChange={(e) => setTrialReason(e.target.value)}
                                placeholder="z.B. Technisches Problem, Support-Case..."
                                className="w-full bg-[#0A1F3D] border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[80px]"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleExtendTrial}
                                disabled={actionLoading}
                                className="bg-[#F5B800] hover:bg-[#E0A800] text-gray-900 font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                              >
                                {actionLoading ? 'Speichere...' : 'Bestätigen'}
                              </button>
                              <button
                                onClick={() => setShowTrialExtension(false)}
                                className="bg-transparent border border-gray-600 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-700/30 transition-all"
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-400">Kein Trial vorhanden</p>
                    )}
                  </div>

                  {/* Premium Info */}
                  <div className="bg-[#1a3a5c] rounded-lg p-4 border border-gray-600">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-[#F5B800]" />
                      Premium Status
                    </h4>

                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-1">Status</p>
                      <p className="text-white font-medium">
                        {user.is_premium ? (
                          <span className="text-[#F5B800]">✓ Premium Aktiv</span>
                        ) : (
                          <span className="text-gray-400">Nicht Premium</span>
                        )}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!user.is_premium ? (
                        <button
                          onClick={handleActivatePremium}
                          disabled={actionLoading}
                          className="bg-[#F5B800] hover:bg-[#E0A800] text-gray-900 font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                        >
                          Premium aktivieren
                        </button>
                      ) : (
                        <button
                          onClick={handleDeactivatePremium}
                          disabled={actionLoading}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                        >
                          Premium deaktivieren
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Grace Period */}
                  {user.grace_period_ends_at && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                        Grace Period
                      </h4>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-400">Löschung geplant für</p>
                          <p className="text-white font-medium">
                            {formatDate(user.grace_period_ends_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Verbleibende Tage</p>
                          <p className="text-yellow-400 font-medium">
                            {getDaysRemaining(user.grace_period_ends_at)} Tage
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelDeletion}
                          disabled={actionLoading}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                        >
                          Löschung abbrechen
                        </button>

                        {!showGraceExtension ? (
                          <button
                            onClick={() => setShowGraceExtension(true)}
                            className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 font-medium px-4 py-2 rounded-lg transition-all"
                          >
                            Grace Period verlängern
                          </button>
                        ) : (
                          <div className="w-full space-y-3 mt-3">
                            <div>
                              <label className="block text-sm text-gray-300 mb-2">Tage</label>
                              <select
                                value={graceDays}
                                onChange={(e) => setGraceDays(Number(e.target.value))}
                                className="w-full bg-[#0A1F3D] border border-gray-600 rounded-lg px-4 py-2 text-white"
                              >
                                <option value={7}>7 Tage</option>
                                <option value={14}>14 Tage</option>
                                <option value={30}>30 Tage</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-300 mb-2">
                                Grund<span className="text-red-400">*</span>
                              </label>
                              <textarea
                                value={graceReason}
                                onChange={(e) => setGraceReason(e.target.value)}
                                placeholder="z.B. Zahlungsproblem gelöst..."
                                className="w-full bg-[#0A1F3D] border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[80px]"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleExtendGracePeriod}
                                disabled={actionLoading}
                                className="bg-[#F5B800] hover:bg-[#E0A800] text-gray-900 font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                              >
                                {actionLoading ? 'Speichere...' : 'Bestätigen'}
                              </button>
                              <button
                                onClick={() => setShowGraceExtension(false)}
                                className="bg-transparent border border-gray-600 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-700/30 transition-all"
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Subscription Events */}
                  <div className="bg-[#1a3a5c] rounded-lg p-4 border border-gray-600">
                    <h4 className="text-white font-semibold mb-3">Event-Historie</h4>
                    {subscriptionEvents.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {subscriptionEvents.map((event) => (
                          <div
                            key={event.id}
                            className="bg-[#0A1F3D] p-3 rounded-lg flex items-center justify-between"
                          >
                            <div>
                              <p className="text-white font-medium text-sm">{event.event_type}</p>
                              <p className="text-xs text-gray-400">{formatDate(event.created_at)}</p>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                event.stripe_subscription_id
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {event.stripe_subscription_id ? 'Stripe' : 'Manual'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Keine Events vorhanden</p>
                    )}
                  </div>
                </div>
              )}

              {/* Wedding Data Tab */}
              {activeTab === 'wedding' && (
                <div className="space-y-4">
                  {weddingData ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#1a3a5c] p-4 rounded-lg">
                          <p className="text-sm text-gray-400 mb-1">Hochzeitsdatum</p>
                          <p className="text-white font-medium">
                            {weddingData.wedding_date
                              ? formatDate(weddingData.wedding_date)
                              : 'Nicht gesetzt'}
                          </p>
                        </div>
                        <div className="bg-[#1a3a5c] p-4 rounded-lg">
                          <p className="text-sm text-gray-400 mb-1">Anzahl Gäste</p>
                          <p className="text-white font-medium text-2xl">
                            {weddingData.guests?.[0]?.count || 0}
                          </p>
                        </div>
                        <div className="bg-[#1a3a5c] p-4 rounded-lg">
                          <p className="text-sm text-gray-400 mb-1">Budget (Gesamt)</p>
                          <p className="text-white font-medium text-2xl">
                            {weddingData.budget_items?.reduce(
                              (sum: number, item: any) => sum + (item.amount || 0),
                              0
                            ) || 0}{' '}
                            €
                          </p>
                        </div>
                        <div className="bg-[#1a3a5c] p-4 rounded-lg">
                          <p className="text-sm text-gray-400 mb-1">Anzahl Tasks</p>
                          <p className="text-white font-medium text-2xl">
                            {weddingData.tasks?.[0]?.count || 0}
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#1a3a5c] p-4 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Zuletzt bearbeitet</p>
                        <p className="text-white font-medium">{formatDate(weddingData.updated_at)}</p>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-blue-400 text-sm">
                          <strong>Hinweis:</strong> Wedding-Daten können nur vom User selbst
                          bearbeitet werden. Admins haben nur Lese-Zugriff.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Keine Wedding-Daten vorhanden</p>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <h4 className="text-white font-semibold">Admin-Aktionen</h4>
                  {auditLogs.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="bg-[#1a3a5c] p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white font-medium">{log.action_type}</p>
                            <p className="text-xs text-gray-400">{formatDate(log.created_at)}</p>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">
                            von: {log.admin?.email || 'Unbekannt'}
                          </p>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="bg-[#0A1F3D] p-2 rounded mt-2">
                              <pre className="text-xs text-gray-400 overflow-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Keine Admin-Aktionen vorhanden</p>
                    </div>
                  )}
                </div>
              )}

              {/* Support Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {/* Add Note */}
                  <div className="bg-[#1a3a5c] p-4 rounded-lg">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Neue Notiz hinzufügen
                    </h4>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Support-Notiz eingeben..."
                      className="w-full bg-[#0A1F3D] border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[100px] mb-3"
                    />
                    <button
                      onClick={handleAddNote}
                      className="bg-[#F5B800] hover:bg-[#E0A800] text-gray-900 font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Notiz speichern
                    </button>
                  </div>

                  {/* Existing Notes */}
                  <div>
                    <h4 className="text-white font-semibold mb-3">Bisherige Notizen</h4>
                    {supportNotes.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {supportNotes.map((note) => (
                          <div key={note.id} className="bg-[#1a3a5c] p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm text-gray-400">
                                {note.admin?.email || 'Unbekannt'}
                              </p>
                              <p className="text-xs text-gray-500">{formatDate(note.created_at)}</p>
                            </div>
                            <p className="text-white whitespace-pre-wrap">{note.note}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Noch keine Notizen vorhanden</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-gray-300 border border-gray-600 hover:bg-gray-700/30 transition-all"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
