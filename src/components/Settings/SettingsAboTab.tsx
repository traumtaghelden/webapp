import { useState, useEffect } from 'react';
import { CreditCard, Calendar, AlertCircle, CheckCircle, Loader2, Crown, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface TrialStatus {
  accountStatus: 'trial_active' | 'paid_active' | 'trial_ended' | 'subscription_cancelled' | 'payment_failed';
  hasAccess: boolean;
  isReadOnly: boolean;
  daysRemaining: number;
  trialEndsAt: string | null;
  deletionScheduledAt: string | null;
  premiumSince: string | null;
  nextPaymentDate: string | null;
  subscriptionStatus: string | null;
}

export default function SettingsAboTab() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    loadTrialStatus();
  }, []);

  const loadTrialStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('check_trial_status');

      if (error) throw error;

      setStatus(data as TrialStatus);
    } catch (error) {
      console.error('Error loading trial status:', error);
      showToast('Fehler beim Laden des Account-Status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setCheckingOut(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        showToast('Bitte melden Sie sich an', 'error');
        return;
      }

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { userId: user.id }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      showToast('Fehler beim Starten des Upgrade-Prozesses', 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setOpeningPortal(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        showToast('Bitte melden Sie sich an', 'error');
        return;
      }

      // Get current URL for return path
      const returnUrl = window.location.origin + '/dashboard?tab=settings&subtab=abo';

      const { data, error } = await supabase.functions.invoke('stripe-customer-portal', {
        body: { return_url: returnUrl }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening Customer Portal:', error);
      showToast('Fehler beim Öffnen der Abo-Verwaltung', 'error');
    } finally {
      setOpeningPortal(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusConfig = (accountStatus: string) => {
    switch (accountStatus) {
      case 'trial_active':
        return {
          label: 'Testphase aktiv',
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          icon: <Zap className="w-5 h-5" />
        };
      case 'paid_active':
        return {
          label: 'Premium aktiv',
          color: 'bg-green-100 text-green-700 border-green-300',
          icon: <CheckCircle className="w-5 h-5" />
        };
      case 'trial_ended':
        return {
          label: 'Testphase abgelaufen',
          color: 'bg-orange-100 text-orange-700 border-orange-300',
          icon: <AlertCircle className="w-5 h-5" />
        };
      case 'subscription_cancelled':
        return {
          label: 'Abo gekündigt',
          color: 'bg-gray-100 text-gray-700 border-gray-300',
          icon: <AlertCircle className="w-5 h-5" />
        };
      case 'payment_failed':
        return {
          label: 'Zahlung fehlgeschlagen',
          color: 'bg-red-100 text-red-700 border-red-300',
          icon: <AlertCircle className="w-5 h-5" />
        };
      default:
        return {
          label: 'Unbekannt',
          color: 'bg-gray-100 text-gray-700 border-gray-300',
          icon: <AlertCircle className="w-5 h-5" />
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="text-center p-12">
        <p className="text-[#666666]">Status konnte nicht geladen werden</p>
      </div>
    );
  }

  const statusConfig = getStatusConfig(status.accountStatus);
  const isPaid = status.accountStatus === 'paid_active';
  const isTrialActive = status.accountStatus === 'trial_active';
  const needsUpgrade = !isPaid;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Abonnement verwalten</h3>
        <p className="text-gray-300">Verwalten Sie Ihr Premium-Abonnement und Zahlungsinformationen</p>
      </div>

      {/* Current Status Card */}
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-2xl p-6 md:p-8 shadow-lg border border-[#d4af37]/10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Aktueller Status</h4>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${statusConfig.color} font-semibold`}>
              {statusConfig.icon}
              {statusConfig.label}
            </div>
          </div>
          {isPaid && (
            <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-3 rounded-xl shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#d4af37]/20">
          {isTrialActive && (
            <>
              <div className="bg-[#f7f2eb]/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-[#666666] mb-1">
                  <Calendar className="w-4 h-4" />
                  Verbleibende Tage
                </div>
                <div className="text-2xl font-bold text-[#0a253c]">
                  {status.daysRemaining} Tage
                </div>
              </div>
              <div className="bg-[#f7f2eb]/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-[#666666] mb-1">
                  <Calendar className="w-4 h-4" />
                  Testphase endet am
                </div>
                <div className="text-xl font-bold text-[#0a253c]">
                  {formatDate(status.trialEndsAt)}
                </div>
              </div>
            </>
          )}

          {isPaid && (
            <div className="bg-green-50 rounded-xl p-4 col-span-2">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <div className="font-semibold text-green-900">Premium-Zugang aktiv</div>
                  <div className="text-sm text-green-700">Sie haben vollen Zugriff auf alle Features</div>
                </div>
              </div>
            </div>
          )}

          {status.isReadOnly && (
            <div className="bg-orange-50 rounded-xl p-4 col-span-2">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                <div>
                  <div className="font-semibold text-orange-900">Read-Only Modus</div>
                  <div className="text-sm text-orange-700">
                    Ihr Account ist im Read-Only Modus. Upgraden Sie, um wieder vollen Zugriff zu erhalten.
                  </div>
                </div>
              </div>
            </div>
          )}

          {status.deletionScheduledAt && (
            <div className="bg-red-50 rounded-xl p-4 col-span-2">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <div className="font-semibold text-red-900">Datenlöschung geplant</div>
                  <div className="text-sm text-red-700">
                    Ihre Daten werden am {formatDate(status.deletionScheduledAt)} gelöscht, sofern Sie nicht upgraden.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Premium Features */}
      {needsUpgrade && (
        <div className="bg-gradient-to-br from-[#0a253c] to-[#1a3a5c] rounded-2xl p-8 shadow-2xl border border-[#d4af37]/30">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Crown className="w-12 h-12 text-white" />
            </div>
            <h4 className="text-3xl font-bold text-white mb-3">Premium-Zugang</h4>
            <p className="text-white/80 text-lg mb-2">
              Unbegrenzter Zugriff auf alle Features
            </p>
            <div className="text-4xl font-bold text-[#d4af37] mb-2">29,99 €</div>
            <div className="text-white/60 text-sm">pro Monat</div>
          </div>

          <div className="space-y-3 mb-8">
            {[
              'Unbegrenzte Gäste, Aufgaben & Dienstleister',
              'Erweiterte Budget-Analysen & Zahlungspläne',
              'Detaillierte Timeline & Hochzeitstag-Planung',
              'Export aller Daten als PDF & Excel',
              'Priority Support',
              'Keine Datenlöschung'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-white">
                <CheckCircle className="w-5 h-5 text-[#d4af37] flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpgrade}
            disabled={checkingOut}
            className="w-full px-8 py-4 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white rounded-xl font-bold hover:shadow-2xl hover:scale-[1.02] active:scale-98 transition-all min-h-[56px] text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {checkingOut ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Weiterleitung...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Jetzt upgraden
              </>
            )}
          </button>

          {isTrialActive && (
            <p className="text-center text-white/60 text-sm mt-4">
              Nach der Testphase wird Ihr Account für 30 Tage in den Read-Only Modus versetzt, danach erfolgt die Datenlöschung.
            </p>
          )}
        </div>
      )}

      {/* Paid Account Info */}
      {isPaid && (
        <div className="bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-2xl p-6 shadow-lg border border-[#d4af37]/10">
          <h4 className="text-lg font-bold text-gray-900 mb-4">Zahlungsinformationen</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#666666]">Preis:</span>
              <span className="font-semibold text-[#0a253c]">29,99 € / Monat</span>
            </div>
            {status.premiumSince && (
              <div className="flex justify-between">
                <span className="text-[#666666]">Premium seit:</span>
                <span className="font-semibold text-[#0a253c]">{formatDate(status.premiumSince)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#666666]">Nächste Zahlung:</span>
              <span className="font-semibold text-[#0a253c]">
                {status.nextPaymentDate ? formatDate(status.nextPaymentDate) : 'Automatisch über Stripe'}
              </span>
            </div>
            {status.subscriptionStatus && (
              <div className="flex justify-between">
                <span className="text-[#666666]">Abo-Status:</span>
                <span className="font-semibold text-[#0a253c] capitalize">
                  {status.subscriptionStatus === 'active' ? 'Aktiv' : status.subscriptionStatus}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#d4af37]/20">
            <p className="text-sm text-[#666666] mb-3">
              Verwalten Sie Ihre Zahlungsmethoden, Rechnungen oder kündigen Sie Ihr Abonnement
            </p>
            <button
              onClick={handleManageSubscription}
              disabled={openingPortal}
              className="px-4 py-2 bg-gradient-to-br from-white to-[#f7f2eb]/30 border border-[#d4af37]/30 text-[#0a253c] rounded-lg font-medium hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[40px]"
            >
              {openingPortal ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird geöffnet...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Abo verwalten
                </>
              )}
            </button>
            <p className="text-xs text-[#999999] mt-2">
              Sie werden zu Stripe weitergeleitet, um Ihr Abonnement sicher zu verwalten
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <div className="font-semibold mb-1">Hinweis zum Abonnement</div>
            <div className="text-blue-800">
              Nach Ablauf der Testphase wird Ihr Account für 30 Tage in den Read-Only Modus versetzt.
              Sie können Ihre Daten weiterhin ansehen, aber keine Änderungen vornehmen.
              Danach werden Ihre Daten automatisch gelöscht, sofern Sie nicht auf Premium upgraden.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
