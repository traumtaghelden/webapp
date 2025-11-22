import { useState, useEffect } from 'react';
import { Shield, Download, Trash2, AlertTriangle, CheckCircle, Cookie, Bell, Mail, Eye, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { COMMON } from '../constants/terminology';
import { useToast } from '../contexts/ToastContext';

interface ConsentRecord {
  consent_type: string;
  consent_given: boolean;
  consent_version: string;
  consented_at: string;
}

interface CookiePrefs {
  functional_cookies: boolean;
  analytics_cookies: boolean;
  marketing_cookies: boolean;
}

export default function PrivacySettings() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [cookiePrefs, setCookiePrefs] = useState<CookiePrefs>({
    functional_cookies: false,
    analytics_cookies: false,
    marketing_cookies: false,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const loadPrivacyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: consentsData } = await supabase
        .from('user_consent')
        .select('consent_type, consent_given, consent_version, consented_at')
        .eq('user_id', user.id)
        .is('withdrawn_at', null)
        .order('consented_at', { ascending: false });

      if (consentsData) {
        setConsents(consentsData);
      }

      const { data: cookieData } = await supabase
        .from('cookie_preferences')
        .select('functional_cookies, analytics_cookies, marketing_cookies')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cookieData) {
        setCookiePrefs(cookieData);
      }
    } catch (error) {
      console.error('Error loading privacy data:', error);
    }
  };

  const handleExportData = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      const [
        { data: profile },
        { data: weddings },
        { data: guests },
        { data: tasks },
        { data: budgetItems },
        { data: vendors },
        { data: teamRoles },
        { data: consents },
        { data: cookiePrefs },
      ] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('weddings').select('*').eq('user_id', user.id),
        supabase.from('guests').select('*').eq('wedding_id', (await supabase.from('weddings').select('id').eq('user_id', user.id).maybeSingle()).data?.id),
        supabase.from('tasks').select('*').eq('wedding_id', (await supabase.from('weddings').select('id').eq('user_id', user.id).maybeSingle()).data?.id),
        supabase.from('budget_items').select('*').eq('wedding_id', (await supabase.from('weddings').select('id').eq('user_id', user.id).maybeSingle()).data?.id),
        supabase.from('vendors').select('*').eq('wedding_id', (await supabase.from('weddings').select('id').eq('user_id', user.id).maybeSingle()).data?.id),
        supabase.from('wedding_team_roles').select('*').eq('wedding_id', (await supabase.from('weddings').select('id').eq('user_id', user.id).maybeSingle()).data?.id),
        supabase.from('user_consent').select('*').eq('user_id', user.id),
        supabase.from('cookie_preferences').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        export_date: new Date().toISOString(),
        user_email: user.email,
        profile,
        weddings,
        guests,
        tasks,
        budget_items: budgetItems,
        vendors,
        team_roles: teamRoles,
        consents,
        cookie_preferences: cookiePrefs,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dsgvo-datenexport-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Datenexport erfolgreich erstellt!', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast('Fehler beim Exportieren der Daten', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCookies = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      await supabase.from('cookie_preferences').insert({
        user_id: user.id,
        essential_cookies: true,
        functional_cookies: cookiePrefs.functional_cookies,
        analytics_cookies: cookiePrefs.analytics_cookies,
        marketing_cookies: cookiePrefs.marketing_cookies,
        preferences_set_at: new Date().toISOString(),
      });

      showToast('Cookie-Einstellungen gespeichert!', 'success');
    } catch (error) {
      console.error('Error updating cookies:', error);
      showToast('Fehler beim Speichern der Cookie-Einstellungen', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'LÖSCHEN') {
      showToast('Bitte geben Sie "LÖSCHEN" ein, um fortzufahren', 'error');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 30);

      await supabase.from('data_deletion_requests').insert({
        user_id: user.id,
        requested_at: new Date().toISOString(),
        scheduled_deletion_date: scheduledDate.toISOString(),
        status: 'pending',
      });

      showToast('Löschantrag wurde erstellt. Ihr Account wird in 30 Tagen gelöscht.', 'success');
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    } catch (error) {
      console.error('Error requesting deletion:', error);
      showToast('Fehler beim Erstellen des Löschantrags', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawConsent = async (consentType: string) => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      await supabase
        .from('user_consent')
        .update({ withdrawn_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('consent_type', consentType)
        .is('withdrawn_at', null);

      await loadPrivacyData();
      showToast(`Einwilligung für ${getConsentLabel(consentType)} wurde widerrufen`, 'success');
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      showToast('Fehler beim Widerrufen der Einwilligung', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getConsentLabel = (type: string) => {
    const labels: Record<string, string> = {
      privacy_policy: 'Datenschutzerklärung',
      terms_of_service: 'AGB',
      email_verification: 'E-Mail-Bestätigung',
      cookies: 'Cookies',
      marketing: 'Marketing',
      newsletter: 'Newsletter',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-2xl shadow-lg border border-[#d4af37]/10 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] rounded-xl shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0a253c]">Datenschutz-Einstellungen</h1>
            <p className="text-sm text-[#666666]">Verwalten Sie Ihre Daten und Einwilligungen</p>
          </div>
        </div>


        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-[#0a253c] mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#d4af37]" />
              Ihre Einwilligungen
            </h2>
            <div className="space-y-3">
              {consents.length === 0 ? (
                <p className="text-[#666666] text-sm">Keine Einwilligungen vorhanden</p>
              ) : (
                consents.map((consent, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-[#d4af37]/20 hover:border-[#d4af37]/40 transition-all">
                    <div>
                      <p className="font-semibold text-[#0a253c]">{getConsentLabel(consent.consent_type)}</p>
                      <p className="text-sm text-[#666666]">
                        Erteilt am: {new Date(consent.consented_at).toLocaleDateString('de-DE')} | Version: {consent.consent_version}
                      </p>
                    </div>
                    {consent.consent_type !== 'email_verification' && consent.consent_type !== 'terms_of_service' && consent.consent_type !== 'privacy_policy' ? (
                      <button
                        onClick={() => handleWithdrawConsent(consent.consent_type)}
                        disabled={loading || !consent.consent_given}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border-2 border-red-200 hover:border-red-300 transition-all disabled:opacity-50 min-h-[40px]"
                      >
                        Widerrufen
                      </button>
                    ) : (
                      <div className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg border-2 border-green-200">
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Bestätigt
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0a253c] mb-4 flex items-center gap-2">
              <Cookie className="w-5 h-5 text-[#d4af37]" />
              Cookie-Einstellungen
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-[#d4af37]/20">
                <div className="flex-1">
                  <p className="font-semibold text-[#0a253c]">Notwendige Cookies</p>
                  <p className="text-sm text-[#666666]">Erforderlich für den Betrieb der Website</p>
                </div>
                <div className="w-12 h-6 bg-[#d4af37] rounded-full flex items-center px-1">
                  <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-[#d4af37]/20">
                <div className="flex-1">
                  <p className="font-semibold text-[#0a253c]">Funktionale Cookies</p>
                  <p className="text-sm text-[#666666]">Verbessern die Benutzererfahrung</p>
                </div>
                <button
                  onClick={() => setCookiePrefs({ ...cookiePrefs, functional_cookies: !cookiePrefs.functional_cookies })}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                    cookiePrefs.functional_cookies ? 'bg-[#d4af37]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                    cookiePrefs.functional_cookies ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-[#d4af37]/20">
                <div className="flex-1">
                  <p className="font-semibold text-[#0a253c]">Analyse Cookies</p>
                  <p className="text-sm text-[#666666]">Helfen uns die Website zu verbessern</p>
                </div>
                <button
                  onClick={() => setCookiePrefs({ ...cookiePrefs, analytics_cookies: !cookiePrefs.analytics_cookies })}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                    cookiePrefs.analytics_cookies ? 'bg-[#d4af37]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                    cookiePrefs.analytics_cookies ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-[#d4af37]/20">
                <div className="flex-1">
                  <p className="font-semibold text-[#0a253c]">Marketing Cookies</p>
                  <p className="text-sm text-[#666666]">Für personalisierte Werbung</p>
                </div>
                <button
                  onClick={() => setCookiePrefs({ ...cookiePrefs, marketing_cookies: !cookiePrefs.marketing_cookies })}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                    cookiePrefs.marketing_cookies ? 'bg-[#d4af37]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                    cookiePrefs.marketing_cookies ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

              <button
                onClick={handleUpdateCookies}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Save className="w-5 h-5" />
                Cookie-Einstellungen speichern
              </button>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0a253c] mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-[#d4af37]" />
              Datenexport (DSGVO Art. 20)
            </h2>
            <div className="p-4 bg-gradient-to-br from-[#d4af37]/10 to-[#f7f2eb] rounded-xl border border-[#d4af37]/30 mb-4">
              <p className="text-sm text-[#0a253c]">
                Sie haben das Recht, alle Ihre Daten in einem maschinenlesbaren Format zu erhalten.
                Der Export enthält alle personenbezogenen Daten, die wir über Sie gespeichert haben.
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Download className="w-5 h-5" />
              Alle Daten exportieren
            </button>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0a253c] mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Account löschen (DSGVO Art. 17)
            </h2>
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-300 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 mb-2">Wichtige Information zur Kontolöschung</p>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc pl-5">
                    <li>Die Löschung erfolgt nach einer Wartefrist von 30 Tagen</li>
                    <li>Alle Ihre Daten werden unwiderruflich gelöscht</li>
                    <li>Sie können die Löschung innerhalb der 30 Tage widerrufen</li>
                    <li>Nach der Löschung können die Daten nicht wiederhergestellt werden</li>
                  </ul>
                </div>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Trash2 className="w-5 h-5" />
                Account löschen beantragen
              </button>
            ) : (
              <div className="space-y-4 p-4 bg-red-50 rounded-xl border-2 border-red-300">
                <p className="font-medium text-red-900">
                  Geben Sie "LÖSCHEN" ein, um die Löschung zu bestätigen:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="LÖSCHEN"
                  className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white transition-all min-h-[44px]"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading || deleteConfirmText !== 'LÖSCHEN'}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 min-h-[44px]"
                  >
                    Bestätigen
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1 py-3 bg-white border-2 border-gray-300 text-[#0a253c] rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <X className="w-5 h-5" />
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}