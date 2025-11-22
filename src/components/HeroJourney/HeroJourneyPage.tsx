import { useState, useEffect, useRef } from 'react';
import { supabase, type Wedding, type Guest, type BudgetItem, type Task, type TimelineEvent } from '../../lib/supabase';
import JourneyStepCard from './JourneyStepCard';
import JourneyProgressBar from './JourneyProgressBar';
import StepDetailModal from './StepDetailModal';
import CeremonyModal from './CeremonyModal';
import WeddingDateModal from './WeddingDateModal';
import VisionModal from './VisionModal';
import StyleSettingsModal from './StyleSettingsModal';
import BudgetDefinitionModal from './BudgetDefinitionModal';
import GuestCountModal from './GuestCountModal';
import LocationModal from './LocationModal';
import TimelineChecklistModal from './TimelineChecklistModal';
import PersonalPlanningModal from './PersonalPlanningModal';
import GuestPlanningModal from './GuestPlanningModal';
import MilestoneBadge from './MilestoneBadge';
import JourneyAnalytics from './JourneyAnalytics';
import StepRecommendations from './StepRecommendations';
import MobileOptimizedProgress from './MobileOptimizedProgress';
// QualityScoreCard removed - demotivating for users
import { Sparkles, DollarSign, Users, MapPin, Heart, Calendar, Palette, Clock, Star, Gift, Trophy, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { logger } from '../../utils/logger';
import { performanceMonitor, measureAsync } from '../../utils/performanceMonitor';
import { heroJourneyCache } from '../../utils/heroJourneyCache';

interface HeroJourneyPageProps {
  weddingId: string;
  onNavigate: (tab: string) => void;
}

interface StepStatus {
  vision: boolean;
  budget: boolean;
  guest_count: boolean;
  location: boolean;
  ceremony: boolean;
  date: boolean;
  personality: boolean;
  timeline: boolean;
  personal_planning: boolean;
  guest_planning: boolean;
}

interface StepDetails {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  whyImportant: string;
  whatToDo: string[];
  estimatedTime: string;
  dependencies: string[];
  color: string;
}

const STEP_DEFINITIONS: { [key: string]: StepDetails } = {
  vision: {
    id: 'vision',
    title: 'Eure Vision',
    description: 'Wie soll eure Hochzeit sich anfühlen? Definiert den Grundton für alles Weitere.',
    icon: Sparkles,
    whyImportant: 'Die Vision ist euer Nordstern für alle weiteren Entscheidungen. Sie hilft euch, konsistente Entscheidungen bei Location, Dekoration und Stil zu treffen. Ohne klare Vision werdet ihr von den vielen Optionen überwältigt.',
    whatToDo: [
      'Setzt euch zusammen und träumt: Wie soll sich der Tag anfühlen?',
      'Sammelt Inspiration (Pinterest, Instagram, Magazine)',
      'Wählt 3-5 Schlüsselwörter, die eure Hochzeit beschreiben',
      'Schreibt einen kurzen Text über eure Traumhochzeit'
    ],
    estimatedTime: '30-60 Minuten',
    dependencies: [],
    color: 'from-[#d4af37] to-[#f4d03f]'
  },
  budget: {
    id: 'budget',
    title: 'Budget definieren',
    description: 'Legt eure absolute Budget-Obergrenze fest - die finanzielle Basis für alle Entscheidungen.',
    icon: DollarSign,
    whyImportant: 'Die Budget-Zahl ist eure finanzielle Realitätsprüfung. Sie bestimmt, wie viele Gäste ihr einladen könnt, welche Location möglich ist und welche Dienstleister ihr buchen könnt. Diese eine Zahl gibt allen weiteren Entscheidungen einen klaren Rahmen.',
    whatToDo: [
      'Berechnet euer verfügbares Gesamtbudget (Erspartes + finanzielle Unterstützung)',
      'Legt eine realistische oder auch utopische Obergrenze fest',
      'Berücksichtigt dabei mental einen Puffer von 10-15%',
      'Die detaillierte Budget-Planung erfolgt später im Budget-Tab'
    ],
    estimatedTime: '15-30 Minuten',
    dependencies: ['Vision definiert'],
    color: 'from-[#f4d03f] to-[#d4af37]'
  },
  guest_count: {
    id: 'guest_count',
    title: 'Gästezahl festlegen',
    description: 'Legt eure Ziel-Gästezahl fest - basierend auf eurem Budget.',
    icon: Users,
    whyImportant: 'Die Ziel-Gästezahl ist der größte Kostenfaktor. Sie bestimmt die Größe der Location und die Catering-Kosten. Pro Person müsst ihr ca. 100-120 Euro einplanen. Eine realistische Gästezahl verhindert, dass ihr euer Budget sprengt.',
    whatToDo: [
      'Überlegt: Wie viele Personen möchtet ihr dabei haben?',
      'Rechnet: Budget geteilt durch 100-120 Euro = realistische Gästezahl',
      'Berücksichtigt mögliche Location-Kapazitäten',
      'Die detaillierte Gästeliste pflegt ihr später im Gäste-Tab'
    ],
    estimatedTime: '15-30 Minuten',
    dependencies: ['Budget definiert'],
    color: 'from-blue-500 to-blue-600'
  },
  location: {
    id: 'location',
    title: 'Location buchen',
    description: 'Findet und bucht eure Location - passend zu Gästezahl, Budget und Vision.',
    icon: MapPin,
    whyImportant: 'Die Location gibt den Rahmen für eure gesamte Hochzeit vor. Sie muss Platz für eure Gästezahl bieten, im Budget liegen und eure Vision widerspiegeln. Beliebte Locations sind oft ein Jahr im Voraus ausgebucht.',
    whatToDo: [
      'Recherchiert Locations mit Kapazität für eure Gästezahl',
      'Filtert nach eurem Budget-Rahmen',
      'Besichtigt eure Top 3-5 Favoriten',
      'Prüft: Passt die Location zu eurer Vision?',
      'Bucht eure Wunsch-Location und markiert sie als "gebucht"'
    ],
    estimatedTime: '2-4 Wochen',
    dependencies: ['Gästezahl festgelegt', 'Budget definiert'],
    color: 'from-green-500 to-green-600'
  },
  ceremony: {
    id: 'ceremony',
    title: 'Trauung & Timing',
    description: 'Koordiniert Trauort und Location zeitlich - beide müssen zusammenpassen.',
    icon: Heart,
    whyImportant: 'Die Trauung ist der emotionale Höhepunkt. Zeit und Ort müssen mit der Location koordiniert werden. Zwischen Trauung und Feier sollten max. 30-60 Minuten liegen, sonst verlieren Gäste die Geduld.',
    whatToDo: [
      'Wählt eure Trauungsart (Standesamt, Kirche, Freie Trauung)',
      'Bucht den Termin beim Standesamt/Kirche/Freien Redner',
      'Plant den Zeitablauf: Wann Trauung, wann Ankunft an Location?',
      'Koordiniert Transport zwischen Trauort und Location'
    ],
    estimatedTime: '1-2 Wochen',
    dependencies: ['Location gebucht'],
    color: 'from-pink-500 to-pink-600'
  },
  date: {
    id: 'date',
    title: 'Euer Hochzeitsdatum',
    description: 'Das Datum ergibt sich aus Location-Verfügbarkeit und Trautermin.',
    icon: Calendar,
    whyImportant: 'Das Datum bestimmt alles: Verfügbarkeit von Locations, Dienstleistern und Gästen. Sommer-Samstage sind am beliebtesten (und teuersten). Ein gutes Datum gibt euch Zeit für alle Vorbereitungen.',
    whatToDo: [
      'Prüft verfügbare Termine bei eurer Wunsch-Location',
      'Checkt wichtige Geburtstage/Termine eurer engsten Gäste',
      'Berücksichtigt Saison und Jahreszeit',
      'Bucht mindestens 12 Monate im Voraus'
    ],
    estimatedTime: '1 Woche',
    dependencies: ['Location gebucht', 'Trauung geplant'],
    color: 'from-orange-500 to-orange-600'
  },
  personality: {
    id: 'personality',
    title: 'Euer Stil',
    description: 'Farben, Schriften und Design-Elemente passend zur Location festlegen.',
    icon: Palette,
    whyImportant: 'Der Stil vereint alle visuellen Elemente: Einladungen, Dekoration, Blumen. Ein konsistenter Stil macht eure Hochzeit zu einem stimmigen Gesamterlebnis und erleichtert alle Design-Entscheidungen.',
    whatToDo: [
      'Wählt eine Farbpalette (2-3 Hauptfarben)',
      'Bestimmt euren Stil (rustikal, elegant, modern, boho...)',
      'Sammelt Inspirationen für Dekoration',
      'Achtet darauf, dass Stil und Location harmonieren'
    ],
    estimatedTime: '2-3 Stunden',
    dependencies: ['Location festgelegt', 'Vision definiert'],
    color: 'from-purple-500 to-purple-600'
  },
  timeline: {
    id: 'timeline',
    title: 'Euer Tagesplan',
    description: 'Strukturiert den Ablauf: Getting Ready, Trauung, Feier bis Party-Ende.',
    icon: Clock,
    whyImportant: 'Der Tagesplan gibt allen Beteiligten Orientierung. Gäste, Dienstleister und ihr selbst wissen, wann was passiert. Ein guter Zeitplan verhindert Stress und sorgt für einen flüssigen Ablauf.',
    whatToDo: [
      'Wählt eine passende Vorlage (kompakt, standard oder ausgedehnt)',
      'Plant Pufferzeiten für Fotos und Überraschungen ein',
      'Koordiniert mit allen Dienstleistern (Fotograf, Band, Caterer)',
      'Teilt den Zeitplan rechtzeitig mit allen Beteiligten'
    ],
    estimatedTime: '3-4 Stunden',
    dependencies: ['Datum festgelegt', 'Trauung geplant'],
    color: 'from-teal-500 to-teal-600'
  },
  personal_planning: {
    id: 'personal_planning',
    title: 'Persönliche Details',
    description: 'Look, Outfit, Emotionen, Rituale und Erinnerungen - macht es zu eurer Hochzeit.',
    icon: Star,
    whyImportant: 'Die persönlichen Details machen eure Hochzeit einzigartig. Outfit, Ringe, Gelübde, besondere Rituale - das sind die Momente, die ihr ewig in Erinnerung behaltet.',
    whatToDo: [
      'Plant euer Outfit (Kleid, Anzug, Accessoires)',
      'Wählt Ringe aus',
      'Schreibt Gelübde (falls gewünscht)',
      'Plant besondere Rituale oder Überraschungen',
      'Organisiert Haare & Make-up'
    ],
    estimatedTime: '4-6 Wochen',
    dependencies: ['Stil festgelegt', 'Datum fixiert'],
    color: 'from-rose-500 to-rose-600'
  },
  guest_planning: {
    id: 'guest_planning',
    title: 'Gästeerlebnis',
    description: 'Einladungen, Sitzplan, Kommunikation und Betreuung für eure Gäste.',
    icon: Gift,
    whyImportant: 'Eure Gäste sind Teil eurer Feier. Gute Kommunikation, durchdachter Sitzplan und Betreuung sorgen dafür, dass sich alle wohl fühlen und ihr einen stressfreien Tag habt.',
    whatToDo: [
      'Gestaltet und versendet Save-the-Dates (6-9 Monate vorher)',
      'Verschickt die Einladungen (3-4 Monate vorher)',
      'Sammelt RSVPs und Diät-Wünsche',
      'Plant den Sitzplan',
      'Organisiert Gastgeschenke und Unterkünfte'
    ],
    estimatedTime: '3-4 Wochen',
    dependencies: ['Gästeliste erstellt', 'Stil definiert'],
    color: 'from-cyan-500 to-cyan-600'
  }
};

interface Milestone {
  id: string;
  milestone_type: string;
  achieved_at: string;
}

export default function HeroJourneyPage({ weddingId, onNavigate }: HeroJourneyPageProps) {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [stepStatus, setStepStatus] = useState<StepStatus>({
    vision: false,
    budget: false,
    guest_count: false,
    location: false,
    ceremony: false,
    date: false,
    personality: false,
    timeline: false,
    personal_planning: false,
    guest_planning: false,
  });
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showStepDetail, setShowStepDetail] = useState<string | null>(null);
  const [showCeremonyModal, setShowCeremonyModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGuestCountModal, setShowGuestCountModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showPersonalPlanningModal, setShowPersonalPlanningModal] = useState(false);
  const [showGuestPlanningModal, setShowGuestPlanningModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animationVariant, setAnimationVariant] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');
  const [isVisionExpanded, setIsVisionExpanded] = useState(false);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);
  const [isVisionCardCollapsed, setIsVisionCardCollapsed] = useState(false);
  const [isFundamentExpanded, setIsFundamentExpanded] = useState(false);
  const [isPlanningExpanded, setIsPlanningExpanded] = useState(false);
  const visionTextRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // Determine animation variant based on time of day
    const hour = new Date().getHours();
    if (hour < 12) {
      setAnimationVariant('morning');
    } else if (hour < 18) {
      setAnimationVariant('afternoon');
    } else {
      setAnimationVariant('evening');
    }

    loadWeddingData();
    loadMilestones();
    trackVisit();
  }, [weddingId]);

  useEffect(() => {
    // Check if vision text is longer than 2 lines
    if (visionTextRef.current && wedding?.vision_text) {
      const element = visionTextRef.current;
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * 2; // 2 lines
      setShouldShowToggle(element.scrollHeight > maxHeight + 2); // +2px tolerance
    }
  }, [wedding?.vision_text]);

  const toggleVisionExpansion = () => {
    setIsVisionExpanded(!isVisionExpanded);
  };

  const toggleVisionCard = () => {
    setIsVisionCardCollapsed(!isVisionCardCollapsed);
  };

  const loadMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_journey_milestones')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('achieved_at', { ascending: false });

      if (error) {
        logger.error('Error loading milestones', 'HeroJourneyPage', error);
      } else {
        setMilestones(data || []);
      }
    } catch (error) {
      logger.error('Error in loadMilestones', 'HeroJourneyPage', error);
    }
  };

  const trackVisit = async () => {
    try {
      await supabase.from('hero_journey_visits').insert({
        wedding_id: weddingId,
        visited_at: new Date().toISOString(),
        progress_snapshot: stepStatus
      });

      const nextStep = getNextRecommendedStep();
      await supabase.from('weddings').update({
        last_heldenplan_visit: new Date().toISOString(),
        current_recommended_step: nextStep
      }).eq('id', weddingId);
    } catch (error) {
      logger.error('Error tracking visit', 'HeroJourneyPage', error);
    }
  };

  const getNextRecommendedStep = (): string => {
    const stepOrder = [
      'vision', 'budget', 'guest_count', 'location', 'ceremony',
      'date', 'personality', 'timeline', 'personal_planning', 'guest_planning'
    ];

    for (const step of stepOrder) {
      if (!stepStatus[step as keyof StepStatus]) {
        return step;
      }
    }
    return 'completed';
  };

  const loadWeddingData = async () => {
    await measureAsync('herojourney:loadWeddingData', async () => {
      try {
        // Check cache first
        const cachedStatus = heroJourneyCache.getStepStatus(weddingId);

        const [weddingData, guestsData, budgetData, tasksData, timelineData, locationsData, progressData] = await Promise.all([
          supabase.from('weddings').select('*').eq('id', weddingId).maybeSingle(),
          supabase.from('guests').select('id').eq('wedding_id', weddingId),
          supabase.from('budget_items').select('id, estimated_cost, actual_cost').eq('wedding_id', weddingId),
          supabase.from('tasks').select('id, category').eq('wedding_id', weddingId),
          supabase.from('wedding_day_blocks').select('id').eq('wedding_id', weddingId),
          supabase.from('locations').select('id').eq('wedding_id', weddingId),
          supabase.from('hero_journey_progress').select('phase_id, status').eq('wedding_id', weddingId),
        ]);

        if (weddingData.error) {
          logger.error('Error loading wedding', 'HeroJourneyPageNew', weddingData.error);
        } else if (weddingData.data) {
          setWedding(weddingData.data);

          if (cachedStatus) {
            // Use cached status if available
            setStepStatus(cachedStatus);
          } else {
            // Calculate and cache
            calculateStepStatus(
              weddingData.data,
              guestsData.data || [],
              budgetData.data || [],
              tasksData.data || [],
              timelineData.data || [],
              locationsData.data || [],
              progressData.data || []
            );
          }
        }
      } catch (error) {
        logger.error('Error in loadWeddingData', 'HeroJourneyPageNew', error);
      } finally {
        setLoading(false);
      }
    }, { weddingId });
  };

  const calculateStepStatus = (
    wedding: Wedding,
    guests: any[],
    budgetItems: any[],
    tasks: any[],
    timelineEvents: any[],
    locations: any[],
    progressData: any[]
  ) => {
    const totalBudget = budgetItems.reduce((sum, item) => sum + (item.actual_cost || item.estimated_cost || 0), 0);
    const confirmedGuests = guests.filter(g => g.rsvp_status === 'accepted').length;

    // Check hero_journey_progress for manual completions
    const progressMap = progressData.reduce((acc: any, p: any) => {
      if (p.status === 'completed') {
        acc[p.phase_id] = true;
      }
      return acc;
    }, {});

    const newStatus: StepStatus = {
      vision: !!(wedding.vision_text && wedding.vision_text.length > 50 && wedding.vision_keywords && (wedding.vision_keywords as any[]).length >= 3),
      budget: wedding.total_budget > 0,
      guest_count: wedding.guest_count > 0,
      location: progressMap.location || (locations.length > 0 && locations.some((l: any) => l.status === 'confirmed' || l.status === 'booked')),
      ceremony: progressMap.ceremony || !!(wedding.ceremony_type && wedding.ceremony_location && wedding.ceremony_time),
      date: progressMap.date || !!(wedding.wedding_date && wedding.wedding_date.length > 0 && new Date(wedding.wedding_date) > new Date()),
      personality: !!(wedding.style_theme && wedding.style_colors && Object.keys(wedding.style_colors as any).length >= 2),
      timeline: timelineEvents.length >= 5,
      personal_planning: tasks.filter((t: any) => ['dress', 'rings', 'personal'].includes(t.category)).length >= 2,
      guest_planning: guests.length >= 10 && confirmedGuests >= guests.length * 0.3,
    };

    setStepStatus(newStatus);

    // Cache the status
    heroJourneyCache.setStepStatus(weddingId, newStatus);

    saveProgressToDatabase(newStatus);
  };

  const saveProgressToDatabase = async (status: StepStatus) => {
    try {
      const completedSteps = Object.entries(status)
        .filter(([_, completed]) => completed)
        .map(([stepId]) => stepId);

      for (const stepId of completedSteps) {
        await supabase.from('hero_journey_progress')
          .upsert({
            wedding_id: weddingId,
            phase_id: stepId,
            status: 'completed',
            progress_percentage: 100,
            completed_at: new Date().toISOString(),
            data: { auto_detected: true }
          }, {
            onConflict: 'wedding_id,phase_id'
          });
      }

      checkAndAwardMilestones(status);
    } catch (error) {
      logger.error('Error saving progress', 'HeroJourneyPage', error);
    }
  };

  const checkAndAwardMilestones = async (status: StepStatus) => {
    try {
      const completedCount = Object.values(status).filter(Boolean).length;
      const milestones = [];

      if (completedCount === 1) milestones.push('first_step');
      if (completedCount === 3) milestones.push('three_steps');
      if (completedCount === 5) milestones.push('half_complete');
      if (completedCount === 7) milestones.push('foundation_complete');
      if (completedCount === 10) milestones.push('all_steps_complete');
      if (status.vision && status.budget && status.guest_count) milestones.push('basics_complete');

      for (const milestone of milestones) {
        // Use upsert to handle race conditions and duplicate key violations
        await supabase
          .from('hero_journey_milestones')
          .upsert(
            {
              wedding_id: weddingId,
              milestone_type: milestone,
              achieved_at: new Date().toISOString()
            },
            { onConflict: 'wedding_id,milestone_type', ignoreDuplicates: true }
          );
      }
    } catch (error) {
      logger.error('Error checking milestones', 'HeroJourneyPage', error);
    }
  };

  const handleStepClick = (stepId: string) => {
    logger.info(`Step clicked: ${stepId}`, 'HeroJourneyPage');

    // Force state updates by using functional setState
    if (stepId === 'vision') {
      setShowVisionModal(prev => {
        console.log('Vision modal state changing from', prev, 'to true');
        return true;
      });
    } else if (stepId === 'budget') {
      setShowBudgetModal(prev => {
        console.log('Budget modal state changing from', prev, 'to true');
        return true;
      });
    } else if (stepId === 'guest_count') {
      setShowGuestCountModal(prev => {
        console.log('Guest count modal state changing from', prev, 'to true');
        return true;
      });
    } else if (stepId === 'ceremony') {
      setShowCeremonyModal(prev => {
        console.log('Ceremony modal state changing from', prev, 'to true');
        return true;
      });
    } else if (stepId === 'date') {
      setShowDateModal(prev => {
        console.log('Date modal state changing from', prev, 'to true');
        return true;
      });
    } else if (stepId === 'personality') {
      setShowStyleModal(prev => {
        console.log('Style modal state changing from', prev, 'to true');
        return true;
      });
    } else if (stepId === 'location') {
      setShowLocationModal(prev => {
        console.log('Location modal state changing from', prev, 'to true');
        return true;
      });
    } else if (stepId === 'timeline') {
      setShowTimelineModal(prev => {
        console.log('Timeline modal state changing from', prev, 'to true');
        return true;
      });
    } else if (stepId === 'personal_planning') {
      setShowPersonalPlanningModal(prev => {
        console.log('Personal planning modal state changing from', prev, 'to true');
        return true;
      });
    } else if (stepId === 'guest_planning') {
      setShowGuestPlanningModal(prev => {
        console.log('Guest planning modal state changing from', prev, 'to true');
        return true;
      });
    } else {
      setShowStepDetail(prev => {
        console.log('Step detail modal changing from', prev, 'to', stepId);
        return stepId;
      });
    }
  };

  const handleNavigateFromDetail = (stepId: string) => {
    setShowStepDetail(null);

    const navigationMap: { [key: string]: { tab: string; action?: string } } = {
      budget: { tab: 'budget', action: 'open-add' },
      guest_count: { tab: 'guests', action: 'open-calculator' },
      location: { tab: 'locations', action: 'open-add' },
      timeline: { tab: 'timeline' },
      personal_planning: { tab: 'tasks', action: 'filter-personal' },
      guest_planning: { tab: 'guests', action: 'show-rsvp' }
    };

    const target = navigationMap[stepId];
    if (target) {
      if (target.action) {
        sessionStorage.setItem('hero_journey_action', target.action);
      }
      onNavigate(target.tab);
    }
  };

  const getStepStatusType = (isCompleted: boolean): 'completed' | 'pending' => {
    return isCompleted ? 'completed' : 'pending';
  };

  const countCompletedSteps = () => {
    return Object.values(stepStatus).filter(Boolean).length;
  };

  const countFundamentSteps = () => {
    return [
      stepStatus.vision,
      stepStatus.budget,
      stepStatus.guest_count,
      stepStatus.location,
      stepStatus.ceremony,
      stepStatus.date,
      stepStatus.personality,
    ].filter(Boolean).length;
  };

  const countPlanningSteps = () => {
    return [stepStatus.timeline, stepStatus.personal_planning, stepStatus.guest_planning].filter(Boolean).length;
  };

  const getAnimationColors = () => {
    if (animationVariant === 'morning') {
      return { primary: '#f4d03f', secondary: '#ff9800', tertiary: '#ffeb3b' };
    } else if (animationVariant === 'evening') {
      return { primary: '#d4af37', secondary: '#9c27b0', tertiary: '#3f51b5' };
    } else {
      return { primary: '#d4af37', secondary: '#f4d03f', tertiary: '#ffd700' };
    }
  };

  const colors = getAnimationColors();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#d4af37] mx-auto mb-4"></div>
          <p className="text-gray-300">Lade deinen Heldenplan...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] relative">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-30"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              backgroundColor: i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.tertiary,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header with fade-in animation */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12 pt-8 sm:pt-12 md:pt-16 animate-fade-in-down">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 px-2">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#d4af37] inline-block mr-2 sm:mr-3 md:mr-4 animate-pulse" />
            <span className="inline-block">Eure</span>{' '}
            <span className="inline-block">Hochzeitsreise</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto px-4">
            <span className="hidden sm:inline">Eure persönliche Reise zur Traumhochzeit - Schritt für Schritt zum perfekten Tag</span>
            <span className="sm:hidden">Schritt für Schritt zur Traumhochzeit</span>
          </p>
        </div>

        {/* Milestone Badges */}
        {milestones.length > 0 && (
          <div className="mb-8 animate-slide-in-up">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-[#d4af37]" />
              <h3 className="text-2xl font-bold text-white">Deine Erfolge</h3>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} style={{ animationDelay: `${index * 100}ms` }}>
                  <MilestoneBadge
                    milestoneType={milestone.milestone_type}
                    achievedAt={milestone.achieved_at}
                    animate={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vision Summary Card */}
        {wedding && stepStatus.vision && (wedding.vision_text || (wedding.vision_keywords && wedding.vision_keywords.length > 0)) && (
          <div className="mb-8 animate-slide-in-up max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#d4af37]/20 to-[#f4d03f]/10 rounded-2xl border-2 border-[#d4af37]/30 shadow-2xl overflow-hidden">
              {/* Header - Always Visible */}
              <div className="flex items-start justify-between p-6 pb-4">
                <button
                  onClick={toggleVisionCard}
                  className="flex items-center gap-3 flex-1 text-left group"
                >
                  <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-3 rounded-xl group-hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white group-hover:text-[#f4d03f] transition-colors">Eure Vision</h3>
                    <p className="text-sm text-gray-300">So soll eure Hochzeit werden</p>
                  </div>
                  <ChevronDown
                    className={`w-6 h-6 text-[#d4af37] transition-transform duration-300 ${
                      isVisionCardCollapsed ? '' : 'rotate-180'
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleStepClick('vision')}
                  className="text-[#d4af37] hover:text-[#f4d03f] transition-colors text-sm font-medium ml-2 flex-shrink-0"
                >
                  Bearbeiten
                </button>
              </div>

              {/* Collapsible Content */}
              <div
                className={`transition-all duration-300 ease-in-out ${
                  isVisionCardCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
                }`}
                style={{ overflow: isVisionCardCollapsed ? 'hidden' : 'visible' }}
              >
                <div className="px-6 pb-6">

              {wedding.vision_text && (
                <div className="mb-4">
                  <p
                    ref={visionTextRef}
                    className={`text-gray-200 leading-relaxed italic break-words transition-all duration-300 ease-in-out ${
                      isVisionExpanded ? '' : 'line-clamp-2'
                    }`}
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      WebkitLineClamp: isVisionExpanded ? 'unset' : 2,
                    }}
                  >
                    "{wedding.vision_text}"
                  </p>
                  {shouldShowToggle && (
                    <button
                      onClick={toggleVisionExpansion}
                      className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[#d4af37] hover:text-[#f4d03f] transition-colors focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 rounded-lg px-2 py-1 -ml-2"
                      aria-expanded={isVisionExpanded}
                      aria-label={isVisionExpanded ? 'Vision Text einklappen' : 'Vision Text erweitern'}
                    >
                      <span>{isVisionExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}</span>
                      {isVisionExpanded ? (
                        <ChevronUp className="w-4 h-4 transition-transform duration-300" />
                      ) : (
                        <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                      )}
                    </button>
                  )}
                </div>
              )}

              {wedding.vision_keywords && wedding.vision_keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {wedding.vision_keywords.map((keyword: string) => (
                    <span
                      key={keyword}
                      className="px-3 py-1 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-gray-900 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}

              {(wedding as any).vision_priorities && Object.keys((wedding as any).vision_priorities || {}).length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#d4af37]/30">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#d4af37]" />
                    Eure Top-Prioritäten
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries((wedding as any).vision_priorities || {})
                      .filter(([key]) => key !== 'custom_aspects')
                      .map(([key, value]) => ({ key, value: value as number }))
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 3)
                      .map((item, idx) => (
                        <div
                          key={item.key}
                          className="flex items-center gap-2 bg-[#0A1F3D]/50 rounded-lg p-3"
                        >
                          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#c19a2e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {item.key === 'location' && 'Location'}
                              {item.key === 'food_drinks' && 'Essen & Getränke'}
                              {item.key === 'decoration' && 'Dekoration'}
                              {item.key === 'music_entertainment' && 'Musik'}
                              {item.key === 'photography_video' && 'Fotografie'}
                              {item.key === 'atmosphere' && 'Atmosphäre'}
                              {item.key === 'guest_count' && 'Gästezahl'}
                              {item.key === 'timeline' && 'Ablauf'}
                              {item.key === 'budget_control' && 'Budget'}
                              {item.key === 'personal_details' && 'Details'}
                            </p>
                            <div className="flex gap-0.5 mt-1">
                              {[...Array(item.value)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-[#d4af37] text-[#d4af37]" />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Progress Bar */}
        <div className="hidden lg:block">
          <JourneyProgressBar
            completedSteps={countCompletedSteps()}
            totalSteps={10}
            fundamentCompleted={countFundamentSteps()}
            planningCompleted={countPlanningSteps()}
          />
        </div>

        {/* Mobile Optimized Progress */}
        <MobileOptimizedProgress
          steps={Object.keys(STEP_DEFINITIONS).map(key => {
            const step = STEP_DEFINITIONS[key];
            const completed = stepStatus[key as keyof StepStatus];
            const dependenciesMet = step.dependencies.every(depTitle => {
              return Object.keys(STEP_DEFINITIONS).some(k =>
                STEP_DEFINITIONS[k].title === depTitle && stepStatus[k as keyof StepStatus]
              );
            });
            return {
              id: step.id,
              title: step.title,
              completed,
              available: completed || dependenciesMet
            };
          })}
          onStepClick={handleStepClick}
        />

        {/* Tab Navigation for Analytics */}
        <div className="mb-8 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex gap-2 bg-[#0A1F3D]/50 backdrop-blur-sm p-2 rounded-xl border border-[#d4af37]/20">
            <button
              onClick={() => setShowAnalytics(false)}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                !showAnalytics
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-gray-900'
                  : 'text-gray-300 hover:bg-[#1a3a5c]'
              }`}
            >
              <Star className="w-4 h-4 inline-block mr-2" />
              Journey Steps
            </button>
            <button
              onClick={() => setShowAnalytics(true)}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                showAnalytics
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-gray-900'
                  : 'text-gray-300 hover:bg-[#1a3a5c]'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline-block mr-2" />
              Analytics & Insights
            </button>
          </div>
        </div>

        {/* Analytics View */}
        {showAnalytics ? (
          <div className="space-y-8 animate-fade-in">
            <StepRecommendations
              weddingId={weddingId}
              completedSteps={Object.keys(stepStatus).filter(key => stepStatus[key as keyof StepStatus])}
              weddingDate={wedding?.wedding_date || null}
              onStepClick={handleStepClick}
            />

            <JourneyAnalytics
              weddingId={weddingId}
              completedSteps={Object.keys(stepStatus).filter(key => stepStatus[key as keyof StepStatus])}
              totalSteps={10}
            />
          </div>
        ) : (
          <>
        {/* Phase 1: Das Fundament */}
        <div className="mb-8 sm:mb-12 animate-slide-in-up" style={{ animationDelay: '200ms' }}>
          <button
            onClick={() => setIsFundamentExpanded(!isFundamentExpanded)}
            className="w-full flex items-center justify-between gap-3 mb-4 sm:mb-6 group hover:bg-white/5 rounded-xl p-3 sm:p-4 transition-all lg:pointer-events-none lg:hover:bg-transparent lg:p-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#d4af37] to-[#c19a2e] flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-xl sm:shadow-2xl shadow-[#d4af37]/50 animate-pulse">
                1
              </div>
              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Das Fundament</h2>
                <p className="text-xs sm:text-sm text-gray-300 hidden sm:block">Sammelt eure Grunddaten, bevor die eigentliche Planung beginnt</p>
                <p className="text-xs text-gray-300 sm:hidden">Grunddaten sammeln</p>
              </div>
            </div>
            <div className="lg:hidden">
              {isFundamentExpanded ? (
                <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4af37] group-hover:text-[#f4d03f] transition-colors" />
              ) : (
                <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4af37] group-hover:text-[#f4d03f] transition-colors" />
              )}
            </div>
          </button>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 transition-all duration-300 overflow-hidden ${
            isFundamentExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-[9999px] lg:opacity-100'
          }`}>
            {['vision', 'budget', 'guest_count', 'location', 'ceremony', 'date', 'personality'].map((stepId, index) => {
              const step = STEP_DEFINITIONS[stepId];
              return (
                <div key={stepId} style={{ animationDelay: `${300 + index * 100}ms` }} className="animate-slide-in-up">
                  <JourneyStepCard
                    icon={step.icon}
                    title={step.title}
                    description={step.description}
                    status={getStepStatusType(stepStatus[stepId as keyof StepStatus])}
                    color={step.color}
                    onClick={() => handleStepClick(stepId)}
                    stepNumber={index + 1}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase 2: Die Planung */}
        <div className="mb-8 sm:mb-12 animate-slide-in-up" style={{ animationDelay: '1000ms' }}>
          <button
            onClick={() => setIsPlanningExpanded(!isPlanningExpanded)}
            className="w-full flex items-center justify-between gap-3 mb-4 sm:mb-6 group hover:bg-white/5 rounded-xl p-3 sm:p-4 transition-all lg:pointer-events-none lg:hover:bg-transparent lg:p-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-xl sm:shadow-2xl shadow-blue-500/50 animate-pulse">
                2
              </div>
              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Die Planung</h2>
                <p className="text-xs sm:text-sm text-gray-300 hidden sm:block">Jetzt wird es konkret - plant die Details eurer Hochzeit</p>
                <p className="text-xs text-gray-300 sm:hidden">Details planen</p>
              </div>
            </div>
            <div className="lg:hidden">
              {isPlanningExpanded ? (
                <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
              ) : (
                <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
              )}
            </div>
          </button>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 transition-all duration-300 overflow-hidden ${
            isPlanningExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-[9999px] lg:opacity-100'
          }`}>
            {['timeline', 'personal_planning', 'guest_planning'].map((stepId, index) => {
              const step = STEP_DEFINITIONS[stepId];
              return (
                <div key={stepId} style={{ animationDelay: `${1100 + index * 100}ms` }} className="animate-slide-in-up">
                  <JourneyStepCard
                    icon={step.icon}
                    title={step.title}
                    description={step.description}
                    status={getStepStatusType(stepStatus[stepId as keyof StepStatus])}
                    color={step.color}
                    onClick={() => handleStepClick(stepId)}
                    stepNumber={8 + index}
                  />
                </div>
              );
            })}
          </div>
        </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(-10px); }
          75% { transform: translateY(-20px) translateX(10px); }
        }

        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
        }

        .animate-slide-in-up {
          animation: slide-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>

    {/* Modals - Rendered outside main container to avoid overflow issues */}
    {showStepDetail && STEP_DEFINITIONS[showStepDetail] && (
      <StepDetailModal
        stepId={showStepDetail}
        stepTitle={STEP_DEFINITIONS[showStepDetail].title}
        stepDescription={STEP_DEFINITIONS[showStepDetail].description}
        stepIcon={STEP_DEFINITIONS[showStepDetail].icon}
        whyImportant={STEP_DEFINITIONS[showStepDetail].whyImportant}
        whatToDo={STEP_DEFINITIONS[showStepDetail].whatToDo}
        estimatedTime={STEP_DEFINITIONS[showStepDetail].estimatedTime}
        dependencies={STEP_DEFINITIONS[showStepDetail].dependencies}
        isCompleted={stepStatus[showStepDetail as keyof StepStatus]}
        onClose={() => setShowStepDetail(null)}
        onNavigate={() => handleNavigateFromDetail(showStepDetail)}
      />
    )}

    {showVisionModal && wedding && (
      <VisionModal
        weddingId={weddingId}
        currentVision={wedding.vision_text || ''}
        currentKeywords={(wedding.vision_keywords as string[]) || []}
        onClose={() => setShowVisionModal(false)}
        onSave={loadWeddingData}
      />
    )}

    {showStyleModal && wedding && (
      <StyleSettingsModal
        weddingId={weddingId}
        currentTheme={wedding.style_theme || ''}
        currentColors={(wedding.style_colors as any) || {}}
        currentFonts={(wedding.style_fonts as any) || {}}
        onClose={() => setShowStyleModal(false)}
        onSave={loadWeddingData}
      />
    )}

    {showCeremonyModal && wedding && (
      <CeremonyModal
        weddingId={weddingId}
        currentCeremonyType={wedding.ceremony_type}
        currentCeremonyLocation={wedding.ceremony_location}
        currentCeremonyTime={wedding.ceremony_time}
        currentWeddingDate={wedding.wedding_date}
        onClose={() => setShowCeremonyModal(false)}
        onSave={loadWeddingData}
      />
    )}

    {showDateModal && wedding && (
      <WeddingDateModal
        weddingId={weddingId}
        currentDate={wedding.wedding_date}
        onClose={() => setShowDateModal(false)}
        onSave={loadWeddingData}
      />
    )}

    {showBudgetModal && wedding && (
      <BudgetDefinitionModal
        weddingId={weddingId}
        currentBudget={wedding.total_budget || 0}
        currentGuestCount={wedding.guest_count || 0}
        onClose={() => setShowBudgetModal(false)}
        onSave={loadWeddingData}
      />
    )}

    {showGuestCountModal && wedding && (
      <GuestCountModal
        weddingId={weddingId}
        currentGuestCount={wedding.guest_count || 0}
        currentBudget={wedding.total_budget || 0}
        onClose={() => setShowGuestCountModal(false)}
        onSave={loadWeddingData}
      />
    )}

    {showLocationModal && (
      <LocationModal
        weddingId={weddingId}
        onClose={() => setShowLocationModal(false)}
        onSave={loadWeddingData}
      />
    )}

    {showTimelineModal && (
      <TimelineChecklistModal
        weddingId={weddingId}
        onClose={() => setShowTimelineModal(false)}
        onNavigate={() => {
          setShowTimelineModal(false);
          onNavigate('timeline');
        }}
        onComplete={() => {
          loadWeddingData();
          setShowTimelineModal(false);
        }}
      />
    )}

    {showPersonalPlanningModal && (
      <PersonalPlanningModal
        weddingId={weddingId}
        onClose={() => setShowPersonalPlanningModal(false)}
        onNavigate={() => {
          setShowPersonalPlanningModal(false);
          onNavigate('tasks');
        }}
        onComplete={() => {
          loadWeddingData();
          setShowPersonalPlanningModal(false);
        }}
      />
    )}

    {showGuestPlanningModal && (
      <GuestPlanningModal
        weddingId={weddingId}
        onClose={() => setShowGuestPlanningModal(false)}
        onNavigate={() => {
          setShowGuestPlanningModal(false);
          onNavigate('guests');
        }}
        onComplete={() => {
          loadWeddingData();
          setShowGuestPlanningModal(false);
        }}
      />
    )}

    </>
  );
}
