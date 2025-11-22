import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Mail, Lock, AlertCircle, FileText, Shield } from 'lucide-react';
import { openModal } from '../lib/modalManager';
import { useToast } from '../contexts/ToastContext';

interface AuthProps {
  onAuthSuccess: () => void;
}

/**
 * Helper function to track successful registration conversion in Google Ads
 * Only fires if window.gtag is available
 */
const trackRegistrationConversion = () => {
  try {
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'conversion', {
        send_to: 'AW-17664977877/lqNFCMnX38MbENXXq0dB'
      });
    }
  } catch (error) {
    // Silently fail if gtag is not available or throws an error
    console.debug('Google Ads conversion tracking not available:', error);
  }
};

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const { showEmailConfirmationToast, showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthSuccess();
      } else {
        // Validate consent checkboxes for registration
        if (!acceptedTerms || !acceptedPrivacy) {
          setError('Bitte akzeptieren Sie die AGB und Datenschutzerklärung.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // Create consent records after successful registration
        if (data.user) {
          // Wait a bit for the session to be established
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check if session was created
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            await createConsentRecords(data.user.id);

            // Track successful registration for Google Ads
            trackRegistrationConversion();

            onAuthSuccess();
          } else {
            // Email confirmation required - show toast instead of error
            showEmailConfirmationToast(email, handleResendConfirmation);
            setLoading(false);
            // Clear form
            setPassword('');
            return;
          }
        } else {
          throw new Error('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
        }
      }
    } catch (err: any) {
      // Translate common error messages to German
      let errorMessage = 'Ein Fehler ist aufgetreten';

      if (err.message?.includes('User already registered') || err.message?.includes('user_already_exists')) {
        errorMessage = 'Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an.';
        setIsLogin(true); // Switch to login mode
      } else if (err.message?.includes('Invalid login credentials') || err.message?.includes('invalid_credentials')) {
        errorMessage = 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'Bitte bestätigen Sie zunächst Ihre E-Mail-Adresse.';
      } else if (err.message?.includes('Password should be at least')) {
        errorMessage = 'Das Passwort muss mindestens 6 Zeichen lang sein.';
      } else if (err.message?.includes('rate_limit') ||
                 err.message?.includes('you can only request this after') ||
                 err.message?.includes('email rate limit exceeded') ||
                 err.message?.includes('over_email_send_rate_limit')) {
        const match = err.message.match(/(\d+)\s+seconds?/);
        const seconds = match ? match[1] : '60';
        errorMessage = `Email-Limit erreicht. Bitte warten Sie ${seconds} Sekunden oder verwenden Sie eine andere Email-Adresse.`;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const createConsentRecords = async (userId: string) => {
    try {
      const now = new Date().toISOString();
      const consents = [
        {
          user_id: userId,
          consent_type: 'terms_of_service',
          consent_given: true,
          consent_version: 'v1.0',
          consented_at: now,
        },
        {
          user_id: userId,
          consent_type: 'privacy_policy',
          consent_given: true,
          consent_version: 'v1.0',
          consented_at: now,
        },
      ];

      const { error } = await supabase.from('user_consent').insert(consents);

      if (error) {
        console.error('Error creating consent records:', error);
      }
    } catch (error) {
      console.error('Error in createConsentRecords:', error);
    }
  };

  const handleOpenTerms = (e: React.MouseEvent) => {
    e.preventDefault();
    openModal('terms');
  };

  const handleOpenPrivacy = (e: React.MouseEvent) => {
    e.preventDefault();
    openModal('privacy');
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      showToast('error', 'Fehler', 'Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      showToast('success', 'E-Mail gesendet', `Bestätigungs-E-Mail wurde an ${email} gesendet. Bitte überprüfen Sie Ihr Postfach.`);
    } catch (err: any) {
      if (err.message?.includes('rate_limit') ||
          err.message?.includes('you can only request this after') ||
          err.message?.includes('email rate limit exceeded') ||
          err.message?.includes('over_email_send_rate_limit')) {
        const match = err.message.match(/(\d+)\s+seconds?/);
        const seconds = match ? match[1] : '60';
        showToast('error', 'Zu viele Versuche', `Email-Limit erreicht. Bitte warten Sie ${seconds} Sekunden.`);
      } else {
        showToast('error', 'Fehler', 'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Willkommen zurück' : 'Konto erstellen'}
            </h1>
            <p className="text-slate-300">
              {isLogin
                ? 'Melden Sie sich an, um fortzufahren'
                : 'Erstellen Sie ein Konto, um zu beginnen'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                E-Mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="ihre@email.de"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                Passwort
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-slate-300 leading-relaxed cursor-pointer">
                    Ich akzeptiere die{' '}
                    <button
                      type="button"
                      onClick={handleOpenTerms}
                      className="text-blue-400 hover:text-blue-300 underline font-medium inline-flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      AGB
                    </button>
                    <span className="text-red-400">*</span>
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptPrivacy"
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="acceptPrivacy" className="text-sm text-slate-300 leading-relaxed cursor-pointer">
                    Ich akzeptiere die{' '}
                    <button
                      type="button"
                      onClick={handleOpenPrivacy}
                      className="text-blue-400 hover:text-blue-300 underline font-medium inline-flex items-center gap-1"
                    >
                      <Shield className="w-3 h-3" />
                      Datenschutzerklärung
                    </button>
                    <span className="text-red-400">*</span>
                  </label>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Laden...</span>
              ) : (
                <>
                  {isLogin ? (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Anmelden</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span>Registrieren</span>
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setAcceptedTerms(false);
                setAcceptedPrivacy(false);
              }}
              className="text-slate-300 hover:text-white transition text-sm"
            >
              {isLogin ? (
                <>
                  Noch kein Konto?{' '}
                  <span className="text-blue-400 font-medium">Jetzt registrieren</span>
                </>
              ) : (
                <>
                  Bereits ein Konto?{' '}
                  <span className="text-blue-400 font-medium">Anmelden</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
