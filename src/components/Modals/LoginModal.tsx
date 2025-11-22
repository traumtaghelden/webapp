import { useState, useEffect } from 'react';
import { Mail, Lock, User, LogIn, UserPlus, AlertCircle, Eye, EyeOff, Heart, Sparkles } from 'lucide-react';
import { openModal } from '../../lib/modalManager';

declare global {
  interface Window {
    auth?: {
      login?: (data: { email: string; password: string }) => Promise<void>;
      register?: (data: { email: string; password: string; name?: string }) => Promise<void>;
    };
  }
}

export default function LoginModal() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    acceptTerms: false,
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const loadingMessages = [
    'Anmeldung wird verarbeitet...',
    'Sitzung wird erstellt...',
    'Daten werden geladen...',
    'Dashboard wird vorbereitet...',
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingMessageIndex(0);
      setLoadingMessage(loadingMessages[0]);
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => {
          const next = (prev + 1) % loadingMessages.length;
          setLoadingMessage(loadingMessages[next]);
          return next;
        });
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'E-Mail ist erforderlich';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Bitte gültige E-Mail-Adresse eingeben';
    }

    if (!formData.password) {
      errors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 8) {
      errors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
    }

    if (activeTab === 'register' && !formData.acceptTerms) {
      errors.acceptTerms = 'Bitte akzeptiere die AGB und Datenschutzerklärung';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'login') {
        if (window.auth?.login) {
          await window.auth.login({
            email: formData.email,
            password: formData.password,
          });
        } else {
          // Create a promise that waits for the auth response
          const authPromise = new Promise<void>((resolve, reject) => {
            const handleAuthResponse = (event: Event) => {
              const customEvent = event as CustomEvent;
              window.removeEventListener('auth:response', handleAuthResponse);

              if (customEvent.detail.success) {
                resolve();
              } else {
                reject(new Error(customEvent.detail.error || 'Anmeldung fehlgeschlagen'));
              }
            };

            window.addEventListener('auth:response', handleAuthResponse);

            // Timeout after 10 seconds
            setTimeout(() => {
              window.removeEventListener('auth:response', handleAuthResponse);
              reject(new Error('Zeitüberschreitung bei der Anmeldung'));
            }, 10000);
          });

          window.dispatchEvent(
            new CustomEvent('auth:login', {
              detail: {
                email: formData.email,
                password: formData.password,
              },
            })
          );

          await authPromise;
        }
      } else {
        if (window.auth?.register) {
          await window.auth.register({
            email: formData.email,
            password: formData.password,
            name: formData.name || undefined,
          });
        } else {
          // Create a promise that waits for the auth response
          const authPromise = new Promise<void>((resolve, reject) => {
            const handleAuthResponse = (event: Event) => {
              const customEvent = event as CustomEvent;
              window.removeEventListener('auth:response', handleAuthResponse);

              if (customEvent.detail.success) {
                resolve();
              } else {
                reject(new Error(customEvent.detail.error || 'Registrierung fehlgeschlagen'));
              }
            };

            window.addEventListener('auth:response', handleAuthResponse);

            // Timeout after 10 seconds
            setTimeout(() => {
              window.removeEventListener('auth:response', handleAuthResponse);
              reject(new Error('Zeitüberschreitung bei der Registrierung'));
            }, 10000);
          });

          window.dispatchEvent(
            new CustomEvent('auth:register', {
              detail: {
                email: formData.email,
                password: formData.password,
                name: formData.name || undefined,
              },
            })
          );

          await authPromise;
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
      );
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex gap-1 sm:gap-2 p-1 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'login'}
          aria-controls="login-panel"
          onClick={() => {
            setActiveTab('login');
            setError('');
            setFieldErrors({});
          }}
          className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all touch-manipulation ${
            activeTab === 'login'
              ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] shadow-lg shadow-[#d4af37]/20'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <LogIn className="w-4 h-4 inline-block mr-2" />
          Anmelden
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'register'}
          aria-controls="register-panel"
          onClick={() => {
            setActiveTab('register');
            setError('');
            setFieldErrors({});
          }}
          className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all touch-manipulation ${
            activeTab === 'register'
              ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] shadow-lg shadow-[#d4af37]/20'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserPlus className="w-4 h-4 inline-block mr-2" />
          Registrieren
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 sm:space-y-4"
        role="tabpanel"
        id={activeTab === 'login' ? 'login-panel' : 'register-panel'}
        data-auth-form={activeTab}
      >
        {activeTab === 'register' && (
          <div>
            <label htmlFor="name" className="block text-sm sm:text-base font-semibold text-white mb-1.5 sm:mb-2">
              Name (optional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-auth-field="name"
                className="w-full pl-10 pr-4 py-3 sm:py-3.5 text-base rounded-xl bg-[#1a3a5c] border-2 border-gray-600 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 focus:outline-none transition-all touch-manipulation"
                placeholder="Euer Name"
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm sm:text-base font-semibold text-white mb-1.5 sm:mb-2">
            E-Mail <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (fieldErrors.email) {
                  setFieldErrors({ ...fieldErrors, email: '' });
                }
              }}
              data-auth-field="email"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              className={`w-full pl-10 pr-4 py-3 sm:py-3.5 text-base rounded-xl bg-[#1a3a5c] border-2 ${
                fieldErrors.email ? 'border-red-500' : 'border-gray-600'
              } text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 focus:outline-none transition-all touch-manipulation`}
              placeholder="eure@email.de"
              required
            />
          </div>
          {fieldErrors.email && (
            <p id="email-error" className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm sm:text-base font-semibold text-white mb-1.5 sm:mb-2">
            Passwort <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (fieldErrors.password) {
                  setFieldErrors({ ...fieldErrors, password: '' });
                }
              }}
              data-auth-field="password"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              className={`w-full pl-10 pr-12 py-3 sm:py-3.5 text-base rounded-xl bg-[#1a3a5c] border-2 ${
                fieldErrors.password ? 'border-red-500' : 'border-gray-600'
              } text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 focus:outline-none transition-all touch-manipulation`}
              placeholder="Mindestens 8 Zeichen"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors touch-manipulation p-1"
              aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-error" className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {fieldErrors.password}
            </p>
          )}
        </div>

        {activeTab === 'register' && (
          <div className="flex items-center gap-2 sm:gap-3">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={(e) => {
                setFormData({ ...formData, acceptTerms: e.target.checked });
                if (fieldErrors.acceptTerms) {
                  setFieldErrors({ ...fieldErrors, acceptTerms: '' });
                }
              }}
              data-auth-field="acceptTerms"
              aria-invalid={!!fieldErrors.acceptTerms}
              aria-describedby={fieldErrors.acceptTerms ? 'terms-error' : undefined}
              className="flex-shrink-0 w-5 h-5 sm:w-5 sm:h-5 rounded border-gray-500 bg-[#1a3a5c] text-[#d4af37] focus:ring-[#d4af37] focus:ring-offset-0 touch-manipulation"
              required
            />
            <div className="flex-1">
              <label htmlFor="acceptTerms" className="text-sm sm:text-base text-white/90 leading-relaxed block">
                Ich akzeptiere die{' '}
                <button
                  type="button"
                  className="text-[#d4af37] hover:text-[#f4d03f] underline touch-manipulation inline-block py-0.5"
                  onClick={(e) => {
                    e.preventDefault();
                    openModal('terms');
                  }}
                >
                  AGB
                </button>{' '}
                und{' '}
                <button
                  type="button"
                  className="text-[#d4af37] hover:text-[#f4d03f] underline touch-manipulation inline-block py-0.5"
                  onClick={(e) => {
                    e.preventDefault();
                    openModal('privacy');
                  }}
                >
                  Datenschutzerklärung
                </button>
              </label>
              {fieldErrors.acceptTerms && (
                <p id="terms-error" className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.acceptTerms}
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-xl backdrop-blur-sm" role="alert">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          data-auth-action={activeTab}
          aria-busy={loading}
          aria-live="polite"
          aria-label={loading ? loadingMessage || (activeTab === 'login' ? 'Wird eingeloggt' : 'Account wird erstellt') : (activeTab === 'login' ? 'Jetzt anmelden' : 'Account erstellen')}
          className="relative w-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#f4d03f] hover:to-[#d4af37] active:scale-98 text-[#0a253c] px-6 py-4 sm:py-4.5 rounded-xl text-base sm:text-lg font-bold transition-all shadow-lg shadow-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation overflow-hidden"
        >
          {loading && (
            <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] flex items-center justify-center" role="status" aria-live="polite">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" aria-hidden="true"></div>
              </div>
              <div className="relative flex items-center justify-center gap-3">
                <div className="relative" aria-hidden="true">
                  <Heart className="w-6 h-6 text-[#0a253c] login-heart-pulse fill-current" />
                  <Sparkles className="w-3 h-3 text-white absolute -top-1 -right-1 animate-sparkle" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[#0a253c] font-bold text-sm sm:text-base login-message-fade">
                    {loadingMessage || (activeTab === 'login' ? 'Wird eingeloggt...' : 'Wird erstellt...')}
                  </span>
                  <div className="flex gap-1 mt-1" aria-hidden="true">
                    <span className="w-1.5 h-1.5 bg-[#0a253c] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-[#0a253c] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-[#0a253c] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <span className={loading ? 'invisible' : 'flex items-center justify-center'}>
            {activeTab === 'login' ? (
              <>
                <LogIn className="w-5 h-5 inline-block mr-2" aria-hidden="true" />
                Jetzt anmelden
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 inline-block mr-2" aria-hidden="true" />
                Account erstellen
              </>
            )}
          </span>
        </button>
      </form>

      {activeTab === 'login' && (
        <div className="text-center">
          <button
            type="button"
            className="text-[#d4af37] hover:text-[#f4d03f] text-sm sm:text-base font-semibold transition-colors touch-manipulation py-2"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('auth:password-reset'));
            }}
          >
            Passwort vergessen?
          </button>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
        <p className="text-white/70 text-xs sm:text-sm text-center leading-relaxed">
          {activeTab === 'login'
            ? 'Noch kein Account? Wechsle zum Tab "Registrieren" oben.'
            : 'Deine Daten werden verschlüsselt und sicher in der EU gespeichert. DSGVO-konform.'}
        </p>
      </div>
    </div>
  );
}
