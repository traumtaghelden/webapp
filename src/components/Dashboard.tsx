import { useState, useEffect } from 'react';
import { supabase, type Wedding, type Task, type BudgetItem, type Guest, type TimelineEvent } from '../lib/supabase';
import TaskManagerNew from './TaskManagerNew';
import BudgetManager from './BudgetManager';
import GuestManagerNew from './GuestManagerNew';
import WeddingSettingsNew from './WeddingSettingsNew';
import VendorManagerNew from './VendorManagerNew';
import LocationManagerNew from './LocationManagerNew';
import GuestCalculatorModal from './GuestCalculatorModal';
import PrivacySettings from './PrivacySettings';
import SupportPage from './SupportPage';
import BetaWatermark from './BetaWatermark';
import VerticalSidebar from './VerticalSidebar';
import WeddingDayTimeline from './WeddingDayTimeline';
import HeroJourneyPage from './HeroJourney/HeroJourneyPage';
import PremiumPage from './PremiumPage';
import CinematicOverview from './Dashboard/CinematicOverview';
import TrialBanner from './TrialBanner';
import ReadOnlyBanner from './ReadOnlyBanner';
import DeletionWarningModal from './DeletionWarningModal';
import { useToast } from '../contexts/ToastContext';
import { LayoutGrid, ListTodo, DollarSign, Users, Clock, Heart, Sparkles } from 'lucide-react';
import { logger } from '../utils/logger';

interface DashboardProps {
  weddingId: string;
}

type MainTab = 'overview' | 'journey' | 'tasks' | 'budget' | 'guests' | 'vendors' | 'locations' | 'timeline' | 'settings' | 'privacy' | 'support' | 'premium';

function DashboardContent({ weddingId }: DashboardProps) {
  const { showUpgradeSuccessToast } = useToast();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [loading, setLoading] = useState(true);
  const [showGuestCalculator, setShowGuestCalculator] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const upgradeStatus = urlParams.get('upgrade');

    if (upgradeStatus === 'success') {
      showUpgradeSuccessToast();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (upgradeStatus === 'canceled') {
      setActiveTab('premium');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [showUpgradeSuccessToast]);

  useEffect(() => {
    loadData();
  }, [weddingId]);

  const loadData = async () => {
    if (!weddingId) {
      logger.error('No weddingId provided to loadData', 'Dashboard.loadData');
      setLoading(false);
      return;
    }

    try {
      const [weddingData, tasksData, budgetData, guestsData, timelineData] = await Promise.all([
        supabase.from('weddings').select('*').eq('id', weddingId).maybeSingle(),
        supabase.from('tasks').select('*').eq('wedding_id', weddingId),
        supabase.from('budget_items').select('*').eq('wedding_id', weddingId),
        supabase.from('guests').select('*').eq('wedding_id', weddingId),
        supabase.from('wedding_day_blocks').select('*').eq('wedding_id', weddingId).order('sort_order', { ascending: true }),
      ]);

      if (weddingData.error) {
        logger.error('Error loading wedding data', 'Dashboard.loadData', weddingData.error);
      } else if (weddingData.data) {
        setWedding(weddingData.data);
      }

      if (tasksData.error) {
        logger.error('Error loading tasks', 'Dashboard.loadData', tasksData.error);
      } else if (tasksData.data) {
        setTasks(tasksData.data);
      }

      if (budgetData.error) {
        logger.error('Error loading budget items', 'Dashboard.loadData', budgetData.error);
      } else if (budgetData.data) {
        setBudgetItems(budgetData.data);
      }

      if (guestsData.error) {
        logger.error('Error loading guests', 'Dashboard.loadData', guestsData.error);
      } else if (guestsData.data) {
        setGuests(guestsData.data);
      }

      if (timelineData.error) {
        logger.error('Error loading timeline', 'Dashboard.loadData', timelineData.error);
      } else if (timelineData.data) {
        setTimelineEvents(timelineData.data);
      }
    } catch (error) {
      logger.error('Unexpected error loading dashboard data', 'Dashboard.loadData', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilWedding = () => {
    if (!wedding) return 0;
    const today = new Date();
    const weddingDate = new Date(wedding.wedding_date);
    const diffTime = weddingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getCompletionPercentage = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const getSpentBudget = () => {
    return budgetItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
  };

  const getRSVPCount = () => {
    return guests.filter((g) => g.rsvp_status === 'accepted').length;
  };

  const handlePremiumFeatureClick = () => {
    showToast('Diese Funktion ist nur für Premium-Mitglieder verfügbar!', 'premium');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    const handleNavigateToPremium = () => {
      setActiveTab('premium');
    };

    window.addEventListener('navigate:premium', handleNavigateToPremium);

    return () => {
      window.removeEventListener('navigate:premium', handleNavigateToPremium);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a253c] via-[#1a3a5c] to-[#f7f2eb]">
        <div className="text-center cinematic-fade-up">
          <div className="relative mb-8">
            <Heart className="w-20 h-20 text-[#d4af37] animate-float mx-auto fill-current" />
            <Sparkles className="w-8 h-8 text-[#f4d03f] absolute top-0 right-1/3 animate-sparkle" />
          </div>
          <p className="text-white text-2xl font-bold mb-2">Lädt eure Hochzeitsplanung...</p>
          <p className="text-[#d4af37] text-sm">Gleich geht's los!</p>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f2eb]">
        <div className="text-center">
          <p className="text-[#0a253c] text-xl mb-6">Hochzeit nicht gefunden</p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all min-h-[40px]"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] relative flex overflow-x-hidden">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="bg-floating-orb" style={{ top: '10%', left: '5%' }} />
        <div className="bg-floating-orb" style={{ top: '60%', right: '10%', animationDelay: '4s' }} />
        <div className="bg-floating-orb" style={{ bottom: '20%', left: '15%', animationDelay: '8s' }} />

        <div className="bg-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="bg-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                '--tx': `${(Math.random() - 0.5) * 100}px`,
                '--ty': `${-Math.random() * 150}px`
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      <VerticalSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        partner1Name={wedding.partner_1_name}
        partner2Name={wedding.partner_2_name}
        weddingDate={wedding.wedding_date}
        completionPercentage={getCompletionPercentage()}
        onCollapsedChange={setIsSidebarCollapsed}
      />

      <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'} overflow-x-hidden pb-16`}>
        <DeletionWarningModal />

        {/* Timeline gets full-screen treatment without padding/background */}
        {activeTab === 'timeline' ? (
          <WeddingDayTimeline />
        ) : (
          <main className="px-3 md:px-6 py-6 md:py-10 relative z-0 max-w-full overflow-x-hidden">
          {activeTab === 'overview' && (
            <CinematicOverview
              wedding={wedding}
              tasks={tasks}
              budgetItems={budgetItems}
              guests={guests}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'journey' && <HeroJourneyPage weddingId={weddingId} onNavigate={setActiveTab} />}
          {activeTab === 'tasks' && <TaskManagerNew weddingId={weddingId} tasks={tasks} onUpdate={loadData} />}
          {activeTab === 'budget' && <BudgetManager weddingId={weddingId} budgetItems={budgetItems} totalBudget={wedding.total_budget} onUpdate={loadData} />}
          {activeTab === 'guests' && <GuestManagerNew weddingId={weddingId} guests={guests} onUpdate={loadData} />}
          {activeTab === 'vendors' && <VendorManagerNew weddingId={weddingId} />}
          {activeTab === 'locations' && <LocationManagerNew weddingId={weddingId} />}
          {activeTab === 'settings' && <WeddingSettingsNew weddingId={weddingId} onUpdate={loadData} />}
          {activeTab === 'privacy' && <PrivacySettings />}
          {activeTab === 'support' && <SupportPage />}
          {activeTab === 'premium' && <PremiumPage onBack={() => setActiveTab('overview')} />}
          </main>
        )}

        <BetaWatermark />
        <TrialBanner />
        <ReadOnlyBanner />

        {showGuestCalculator && (
          <GuestCalculatorModal
            weddingId={weddingId}
            plannedGuestCount={wedding.guest_count}
            confirmedGuestCount={getRSVPCount()}
            onClose={() => setShowGuestCalculator(false)}
          />
        )}
      </div>
    </div>
  );
}

export default function Dashboard({ weddingId }: DashboardProps) {
  return (
    <DashboardContent weddingId={weddingId} />
    
  );
}
