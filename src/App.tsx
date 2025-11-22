/* CAROUSEL_UPDATE_V2 */
import { useState, useEffect, lazy, Suspense } from 'react';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import OfflineIndicator from './components/common/OfflineIndicator';
import PWAUpdatePrompt from './components/common/PWAUpdatePrompt';
import { supabase } from './lib/supabase';
import { ModalProvider } from './contexts/ModalContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { closeModal } from './lib/modalManager';
import { logger } from './utils/logger';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SkeletonPageHeader } from './components/common/SkeletonLoader';

const OnboardingFlow = lazy(() => import('./components/OnboardingFlow'));
const PostOnboardingLoader = lazy(() => import('./components/PostOnboardingLoader'));
const PostLoginLoader = lazy(() => import('./components/PostLoginLoader'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AdminToggleButton = lazy(() => import('./components/AdminToggleButton'));

type Screen = 'landing' | 'auth' | 'onboarding' | 'postOnboardingLoading' | 'postLoginLoading' | 'dashboard' | 'admin';

interface OnboardingData {
  weddingId: string;
  partner1Name: string;
  partner2Name: string;
  weddingDate: string;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminViewingAsUser, setAdminViewingAsUser] = useState(false);
  const [justSignedIn, setJustSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        setUserId(session.user.id);
        checkUserProfile(session.user.id, true, false);
      } else {
        setCurrentScreen('landing');
      }
      setHasInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      logger.debug('Auth state change', 'App', { event, hasSession: !!session });

      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setCurrentScreen('landing');
        setWeddingId(null);
        setUserId(null);
        setOnboardingData(null);
        setJustSignedIn(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        return;
      }

      if (session) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
        if (event === 'SIGNED_IN') {
          setJustSignedIn(true);
          checkUserProfile(session.user.id, true, true);
          // Reset flag after a short delay
          setTimeout(() => setJustSignedIn(false), 1000);
        } else if (event === 'INITIAL_SESSION' && !justSignedIn) {
          // Only process INITIAL_SESSION if we didn't just sign in
          checkUserProfile(session.user.id, true, false);
        }
      } else {
        setIsAuthenticated(false);
        if (hasInitialized) {
          setCurrentScreen('landing');
        }
        setWeddingId(null);
        setUserId(null);
      }
    });

    const handleAuthLogin = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { email, password } = customEvent.detail;
      try {
        await handleLogin(email, password);
        window.dispatchEvent(new CustomEvent('auth:response', { detail: { success: true } }));
      } catch (error) {
        window.dispatchEvent(new CustomEvent('auth:response', {
          detail: {
            success: false,
            error: error instanceof Error ? error.message : 'Anmeldung fehlgeschlagen'
          }
        }));
      }
    };

    const handleAuthRegister = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { email, password } = customEvent.detail;
      try {
        await handleRegister(email, password);
        window.dispatchEvent(new CustomEvent('auth:response', { detail: { success: true } }));
      } catch (error) {
        window.dispatchEvent(new CustomEvent('auth:response', {
          detail: {
            success: false,
            error: error instanceof Error ? error.message : 'Registrierung fehlgeschlagen'
          }
        }));
      }
    };

    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:register', handleAuthRegister);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:register', handleAuthRegister);
    };
  }, []);

  const checkUserProfile = async (userId: string, shouldRedirect: boolean = true, showLoginLoader: boolean = false) => {
    try {
      // Check if user is admin first
      const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin');

      if (!adminError && isAdminData === true) {
        logger.debug('User is admin, redirecting to admin dashboard', 'App.checkUserProfile');
        setIsAdmin(true);
        if (shouldRedirect && !adminViewingAsUser) {
          setCurrentScreen('admin');
          return;
        }
      }

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('event_name, onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        logger.error('Error fetching profile', 'App.checkUserProfile', profileError);
        if (shouldRedirect) {
          setCurrentScreen('onboarding');
        }
        return;
      }

      if (!profileData) {
        logger.debug('No profile found, redirecting to onboarding', 'App.checkUserProfile');
        if (shouldRedirect) {
          setCurrentScreen('onboarding');
        }
        return;
      }

      if (profileData.onboarding_completed) {
        const { data: weddingData, error: weddingError } = await supabase
          .from('weddings')
          .select('id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (weddingError) {
          logger.error('Error fetching wedding', 'App.checkUserProfile', weddingError);
          if (shouldRedirect) {
            setCurrentScreen('onboarding');
          }
          return;
        }

        if (weddingData && weddingData.id) {
          logger.debug('User has completed onboarding and has wedding data', 'App.checkUserProfile');
          setWeddingId(weddingData.id);
          if (shouldRedirect) {
            if (showLoginLoader) {
              logger.debug('Showing login loader for returning user', 'App.checkUserProfile');
              setCurrentScreen('postLoginLoading');
            } else {
              logger.debug('Going directly to dashboard', 'App.checkUserProfile');
              // Use setTimeout to ensure weddingId state is updated before navigating
              setTimeout(() => setCurrentScreen('dashboard'), 0);
            }
          }
        } else {
          logger.warn('User marked as completed but no wedding data found', 'App.checkUserProfile');
          if (shouldRedirect) {
            setCurrentScreen('onboarding');
          }
        }
      } else {
        logger.debug('User has not completed onboarding', 'App.checkUserProfile');
        if (shouldRedirect) {
          setCurrentScreen('onboarding');
        }
      }
    } catch (error) {
      logger.error('Unexpected error in checkUserProfile', 'App.checkUserProfile', error);
      if (shouldRedirect) {
        setCurrentScreen('landing');
        setIsAuthenticated(false);
      }
    }
  };

  const handleStartOnboarding = () => {
    setCurrentScreen('auth');
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle rate limiting errors with user-friendly message
        if (error.message?.includes('rate_limit') || error.message?.includes('you can only request this after')) {
          const match = error.message.match(/(\d+)\s+seconds?/);
          const seconds = match ? match[1] : '60';
          throw new Error(`Zu viele Login-Versuche. Bitte warten Sie ${seconds} Sekunden und versuchen Sie es erneut.`);
        }
        // Handle invalid credentials
        if (error.message?.includes('Invalid login credentials')) {
          throw new Error('Ungültige E-Mail-Adresse oder Passwort.');
        }
        throw error;
      }

      if (data.session) {
        setIsAuthenticated(true);
        setUserId(data.session.user.id);
        closeModal();
      }
    } catch (error) {
      logger.error('Login error', 'App.handleLogin', error);
      throw error;
    }
  };

  const handleRegister = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        // Handle rate limiting errors with user-friendly message
        if (error.message?.includes('rate_limit') ||
            error.message?.includes('you can only request this after') ||
            error.message?.includes('email rate limit exceeded') ||
            error.message?.includes('over_email_send_rate_limit')) {
          const match = error.message.match(/(\d+)\s+seconds?/);
          const seconds = match ? match[1] : '60';
          throw new Error(`Email-Limit erreicht. Bitte warten Sie ${seconds} Sekunden oder verwenden Sie eine andere Email-Adresse.`);
        }
        throw error;
      }

      // Check if we have a session (instant login) or need email confirmation
      if (data.session) {
        setIsAuthenticated(true);
        setUserId(data.session.user.id);

        // Create consent records after session is established
        await createConsentRecords(data.session.user.id);

        closeModal();
      } else if (data.user) {
        // Email confirmation required - this will be handled in Auth component with toast
        throw new Error('EMAIL_CONFIRMATION_REQUIRED');
      } else {
        throw new Error('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      logger.error('Register error', 'App.handleRegister', error);
      throw error;
    }
  };

  const createConsentRecords = async (userId: string) => {
    try {
      // Verify session is available
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        logger.error('No session available for consent records', 'App.createConsentRecords');
        return;
      }

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
        logger.error('Error creating consent records', 'App.createConsentRecords', error);
      }
    } catch (error) {
      logger.error('Error in createConsentRecords', 'App.createConsentRecords', error);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleOnboardingComplete = (data: OnboardingData) => {
    setOnboardingData(data);
    setWeddingId(data.weddingId);
    setCurrentScreen('postOnboardingLoading');
  };

  const handlePostLoadingComplete = async () => {
    if (!weddingId) return;

    try {
      // Create only essential starter tasks - most data will be added via hero journey
      const starterTasks = [
        {
          title: 'Heldenplan erkunden',
          description: 'Macht euch mit eurem persönlichen Heldenplan vertraut und erfasst erste Details',
          priority: 'high',
          category: 'planning',
          wedding_id: weddingId,
        },
      ];

      await supabase.from('tasks').insert(starterTasks);
    } catch (error) {
      logger.error('Error initializing data', 'App.handlePostLoadingComplete', error);
    }

    setCurrentScreen('dashboard');
  };

  const handleSwitchToUserView = async () => {
    setAdminViewingAsUser(true);

    if (!weddingId && userId) {
      const { data } = await supabase
        .from('weddings')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (data) {
        setWeddingId(data.id);
      }
    }

    setCurrentScreen('dashboard');
  };

  const handleSwitchToAdminView = () => {
    setAdminViewingAsUser(false);
    setCurrentScreen('admin');
  };

  return (
    <ErrorBoundary>
      <ToastProvider>
        <ModalProvider>
          <OfflineIndicator />
          <PWAUpdatePrompt />
          <div className="min-h-screen bg-[#f7f2eb]">
          {currentScreen === 'landing' && (
            <ErrorBoundary>
              <LandingPage onGetStarted={handleStartOnboarding} />
            </ErrorBoundary>
          )}
          {currentScreen === 'auth' && (
            <ErrorBoundary>
              <Auth onAuthSuccess={handleAuthSuccess} />
            </ErrorBoundary>
          )}
          {currentScreen === 'onboarding' && isAuthenticated && (
            <ErrorBoundary>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]"></div></div>}>
                <OnboardingFlow onComplete={handleOnboardingComplete} />
              </Suspense>
            </ErrorBoundary>
          )}
          {currentScreen === 'postOnboardingLoading' && onboardingData && (
            <ErrorBoundary>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]"></div></div>}>
                <PostOnboardingLoader
                  weddingId={onboardingData.weddingId}
                  partner1Name={onboardingData.partner1Name}
                  partner2Name={onboardingData.partner2Name}
                  weddingDate={onboardingData.weddingDate}
                  onComplete={handlePostLoadingComplete}
                />
              </Suspense>
            </ErrorBoundary>
          )}
          {currentScreen === 'postLoginLoading' && weddingId && userId && isAuthenticated && (
            <ErrorBoundary>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]"></div></div>}>
                <PostLoginLoader
                  weddingId={weddingId}
                  userId={userId}
                  onComplete={() => setCurrentScreen('dashboard')}
                />
              </Suspense>
            </ErrorBoundary>
          )}
          {currentScreen === 'dashboard' && weddingId && isAuthenticated && (
            <ErrorBoundary>
              <Suspense fallback={
                <div className="min-h-screen p-4 sm:p-6 lg:p-8">
                  <SkeletonPageHeader />
                </div>
              }>
                <Dashboard weddingId={weddingId} />
                {isAdmin && (
                  <AdminToggleButton
                    onToggle={handleSwitchToAdminView}
                    isMinimized={true}
                  />
                )}
              </Suspense>
            </ErrorBoundary>
          )}
          {currentScreen === 'admin' && isAuthenticated && (
            <ErrorBoundary>
              <Suspense fallback={
                <div className="min-h-screen p-4 sm:p-6 lg:p-8">
                  <SkeletonPageHeader />
                </div>
              }>
                <AdminDashboard onSwitchToUserView={handleSwitchToUserView} />
              </Suspense>
            </ErrorBoundary>
          )}
          </div>
        </ModalProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
