import { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, Loader2, Camera, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export default function SettingsProfilTab() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        showToast('Fehler beim Laden des Profils', 'error');
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
        });
      } else {
        setProfile({
          id: user.id,
          email: user.email || '',
          full_name: null,
          phone: null,
          avatar_url: null,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast('Fehler beim Laden des Profils', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: profile.id,
          email: profile.email,
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      showToast('Profil erfolgreich gespeichert', 'success');
      await loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Fehler beim Speichern des Profils', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!profile?.email) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      showToast('Password-Reset-Link wurde an Ihre E-Mail gesendet', 'success');
    } catch (error) {
      console.error('Error sending password reset:', error);
      showToast('Fehler beim Senden des Password-Reset-Links', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-12">
        <p className="text-[#666666]">Profil konnte nicht geladen werden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-[#0a253c] mb-2">Profil & Account</h3>
        <p className="text-[#666666]">Verwalten Sie Ihre persönlichen Daten und Account-Einstellungen</p>
      </div>

      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-2xl p-6 md:p-8 shadow-lg border border-[#d4af37]/10">
        <div className="space-y-8">
          {/* Avatar Section */}
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#d4af37] to-[#c19a2e] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : <User className="w-12 h-12" />}
              </div>
              <button
                className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-[#d4af37]/30 hover:bg-[#f7f2eb] transition-colors"
                title="Profilbild ändern (Coming Soon)"
              >
                <Camera className="w-4 h-4 text-[#d4af37]" />
              </button>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-[#0a253c] mb-1">Profilbild</h4>
              <p className="text-sm text-[#666666] mb-3">
                Laden Sie ein Profilbild hoch, um Ihr Profil zu personalisieren
              </p>
              <button
                disabled
                className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
              >
                Bild hochladen (Coming Soon)
              </button>
            </div>
          </div>

          <div className="border-t border-[#d4af37]/20 pt-6">
            <h4 className="text-lg font-bold text-[#0a253c] mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#d4af37]" />
              Persönliche Daten
            </h4>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-[#0a253c] mb-2">
                  Vollständiger Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-[#0a253c] placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all"
                  placeholder="z.B. Max Mustermann"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-[#0a253c] mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#d4af37]" />
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-600 cursor-not-allowed"
                  />
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-[#666666] mt-1">
                  Ihre E-Mail-Adresse ist verifiziert und kann nicht geändert werden
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-[#0a253c] mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#d4af37]" />
                  Telefonnummer
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-[#0a253c] placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all"
                  placeholder="z.B. +49 123 456789"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#d4af37]/20 pt-6">
            <h4 className="text-lg font-bold text-[#0a253c] mb-4">Sicherheit</h4>
            <div className="bg-[#f7f2eb]/50 rounded-xl p-4 border border-[#d4af37]/10">
              <p className="text-sm text-[#0a253c] mb-3">
                Möchten Sie Ihr Passwort ändern? Wir senden Ihnen einen Link zum Zurücksetzen per E-Mail.
              </p>
              <button
                onClick={handlePasswordReset}
                className="px-4 py-2 bg-gradient-to-br from-white to-[#f7f2eb]/30 border border-[#d4af37]/30 text-[#0a253c] rounded-lg font-medium hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-sm"
              >
                Passwort zurücksetzen
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#d4af37]/20">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white rounded-lg font-semibold hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Änderungen speichern
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-gradient-to-br from-[#0a253c] to-[#1a3a5c] rounded-2xl p-6 text-white shadow-lg border border-[#d4af37]/20">
        <h4 className="text-lg font-bold mb-3">Account-Informationen</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/70">Account-ID:</span>
            <span className="font-mono text-xs">{profile.id.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Erstellt am:</span>
            <span>Bei Registrierung</span>
          </div>
        </div>
      </div>
    </div>
  );
}
