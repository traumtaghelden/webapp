import { useState, useEffect } from 'react';
import { Lightbulb, ArrowRight, TrendingUp, Star, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

interface Recommendation {
  stepId: string;
  stepTitle: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  icon: React.ElementType;
}

interface StepRecommendationsProps {
  weddingId: string;
  completedSteps: string[];
  weddingDate: string | null;
  onStepClick: (stepId: string) => void;
}

export default function StepRecommendations({
  weddingId,
  completedSteps,
  weddingDate,
  onStepClick
}: StepRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateRecommendations();
  }, [completedSteps, weddingDate]);

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      const recs: Recommendation[] = [];

      // Calculate days until wedding
      const daysUntilWedding = weddingDate
        ? Math.ceil((new Date(weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 999;

      // Load wedding data for context including vision priorities
      const { data: weddingData } = await supabase
        .from('weddings')
        .select('total_budget, partner_1_name, partner_2_name, vision_priorities, vision_details')
        .eq('id', weddingId)
        .maybeSingle();

      // Parse vision data
      const priorities = (weddingData?.vision_priorities as any) || {};
      const visionDetails = (weddingData?.vision_details as any) || {};

      // Load counts for various entities
      const [budgetCount, guestCount, taskCount, locationCount] = await Promise.all([
        supabase.from('budget_items').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingId),
        supabase.from('guests').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingId),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingId),
        supabase.from('locations').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingId),
      ]);

      // Vision - Always first if not completed
      if (!completedSteps.includes('vision')) {
        recs.push({
          stepId: 'vision',
          stepTitle: 'Eure Vision',
          reason: 'Der perfekte Start! Definiert den Grundton für alles Weitere.',
          priority: 'high',
          estimatedTime: '30-60 Min',
          icon: Star
        });
      }

      // Budget - High priority if vision is done but budget not
      if (completedSteps.includes('vision') && !completedSteps.includes('budget')) {
        let budgetReason = 'Jetzt Budget festlegen, um realistische Entscheidungen treffen zu können.';

        // Personalize based on priorities
        if (priorities.food_drinks >= 4) {
          budgetReason = 'Budget festlegen - plant 40-50% für Catering und Getränke ein, das ist euch wichtig!';
        } else if (priorities.photography_video >= 4) {
          budgetReason = 'Budget definieren - professionelle Fotografen kosten 1.500-3.000€. Plant entsprechend!';
        } else if (priorities.location >= 4) {
          budgetReason = 'Budget klären - die perfekte Location ist euch wichtig, dafür solltet ihr 20-30% einplanen.';
        }

        recs.push({
          stepId: 'budget',
          stepTitle: 'Euer Budget',
          reason: budgetReason,
          priority: 'high',
          estimatedTime: '1-2 Std',
          icon: TrendingUp
        });
      }

      // Guest count - After budget
      if (completedSteps.includes('budget') && !completedSteps.includes('guest_count')) {
        const hasBudget = (weddingData?.total_budget || 0) > 0;
        let guestReason = hasBudget
          ? `Mit eurem Budget von €${weddingData?.total_budget.toLocaleString()} könnt ihr ca. ${Math.floor((weddingData?.total_budget || 0) / 100)}-${Math.floor((weddingData?.total_budget || 0) / 80)} Gäste einladen.`
          : 'Legt die Gästezahl passend zu eurem Budget fest.';

        // Add note if intimate atmosphere was chosen
        if (visionDetails.size === 'intim') {
          guestReason += ' Kleine Hochzeiten ermöglichen intensive, persönliche Momente mit jedem Gast.';
        } else if (visionDetails.size === 'gross') {
          guestReason += ' Plant bei großen Hochzeiten mehr Zeit für Organisation und Koordination ein.';
        }

        recs.push({
          stepId: 'guest_count',
          stepTitle: 'Eure Gästezahl',
          reason: guestReason,
          priority: 'high',
          estimatedTime: '2-3 Std',
          icon: TrendingUp
        });
      }

      // Location - After guest count
      if (completedSteps.includes('guest_count') && !completedSteps.includes('location')) {
        const guests = guestCount.count || 0;
        let locationReason = guests > 0
          ? `Sucht eine Location für ${guests} Gäste. Je früher, desto besser!`
          : 'Zeit, die perfekte Location zu finden.';

        // Personalize based on priorities
        if (priorities.location >= 4) {
          locationReason = `Die Location ist euch sehr wichtig - beliebte Locations sind schnell ausgebucht. Startet jetzt!`;
        } else if (visionDetails.location_type === 'outdoor' && visionDetails.season_preference === 'winter') {
          locationReason += ' Bedenkt bei Outdoor im Winter: Heizung und Überdachung sind essentiell!';
        } else if (visionDetails.location_type === 'outdoor') {
          locationReason += ' Outdoor-Locations haben oft Wetterschutz-Optionen - fragt danach!';
        }

        recs.push({
          stepId: 'location',
          stepTitle: 'Eure Location',
          reason: locationReason,
          priority: (priorities.location >= 4 || daysUntilWedding < 270) ? 'high' : 'medium',
          estimatedTime: '2-4 Wochen',
          icon: AlertCircle
        });
      }

      // Ceremony - After location
      if (completedSteps.includes('location') && !completedSteps.includes('ceremony')) {
        let ceremonyReason = 'Koordiniert Trauort und Location zeitlich.';

        if (visionDetails.atmosphere_traditional >= 4) {
          ceremonyReason = 'Plant genug Zeit für traditionelle Elemente in eurer Trauung ein.';
        } else if (visionDetails.atmosphere_traditional <= 2) {
          ceremonyReason = 'Überlegt euch kreative, moderne Elemente für eure persönliche Trauung.';
        }

        recs.push({
          stepId: 'ceremony',
          stepTitle: 'Trauung & Timing',
          reason: ceremonyReason,
          priority: daysUntilWedding < 180 ? 'high' : 'medium',
          estimatedTime: '1-2 Wochen',
          icon: Clock
        });
      }

      // Date - After ceremony
      if (completedSteps.includes('ceremony') && !completedSteps.includes('date')) {
        recs.push({
          stepId: 'date',
          stepTitle: 'Euer Hochzeitsdatum',
          reason: 'Legt das Datum fest, damit ihr alles weitere planen könnt.',
          priority: 'high',
          estimatedTime: '1 Woche',
          icon: AlertCircle
        });
      }

      // Personality/Style - Can be done after vision
      if (completedSteps.includes('vision') && !completedSteps.includes('personality')) {
        recs.push({
          stepId: 'personality',
          stepTitle: 'Euer Stil',
          reason: 'Definiert Farben und Design-Elemente passend zu eurer Vision.',
          priority: 'medium',
          estimatedTime: '1-2 Std',
          icon: Lightbulb
        });
      }

      // Timeline - After date is set
      if (completedSteps.includes('date') && !completedSteps.includes('timeline')) {
        const hasTasks = (taskCount.count || 0) > 0;
        let timelineReason = hasTasks
          ? `Ihr habt bereits ${taskCount.count} Aufgaben. Zeit für eine Timeline!`
          : 'Plant den Ablauf des Hochzeitstags.';

        if (priorities.music_entertainment >= 4) {
          timelineReason += ' Vergesst nicht: Koordiniert Band/DJ-Zeiten und Programmpunkte frühzeitig!';
        } else if (priorities.timeline >= 4) {
          timelineReason = 'Der Ablauf ist euch wichtig - plant jeden Moment sorgfältig und mit Puffern!';
        }

        recs.push({
          stepId: 'timeline',
          stepTitle: 'Timeline erstellen',
          reason: timelineReason,
          priority: daysUntilWedding < 90 ? 'high' : 'medium',
          estimatedTime: '2-3 Std',
          icon: Clock
        });
      }

      // Personal Planning - Can be done anytime after style
      if (completedSteps.includes('personality') && !completedSteps.includes('personal_planning')) {
        let personalReason = 'Outfits, Ringe und Gelübde wollen gut geplant sein.';

        if (priorities.personal_details >= 4) {
          personalReason = 'Persönliche Details sind euch wichtig - nehmt euch Zeit für Outfit, Ringe und eure Gelübde!';
        } else if (priorities.decoration <= 2 && priorities.personal_details >= 3) {
          personalReason = 'Fokus auf persönliche Details statt aufwendige Deko - passt perfekt zu eurer Vision!';
        }

        recs.push({
          stepId: 'personal_planning',
          stepTitle: 'Persönliche Planung',
          reason: personalReason,
          priority: daysUntilWedding < 120 ? 'high' : 'low',
          estimatedTime: '3-4 Wochen',
          icon: Lightbulb
        });
      }

      // Guest Planning - After guest count
      if (completedSteps.includes('guest_count') && !completedSteps.includes('guest_planning')) {
        const hasGuests = (guestCount.count || 0) > 0;
        recs.push({
          stepId: 'guest_planning',
          stepTitle: 'Gäste-Planung',
          reason: hasGuests
            ? `${guestCount.count} Gäste warten auf Einladungen!`
            : 'Save-the-Dates und Einladungen koordinieren.',
          priority: daysUntilWedding < 150 ? 'high' : 'low',
          estimatedTime: '3-4 Wochen',
          icon: TrendingUp
        });
      }

      // Time-based urgent recommendations
      if (daysUntilWedding < 60 && daysUntilWedding > 0) {
        const urgentSteps = [
          'timeline',
          'personal_planning',
          'guest_planning'
        ].filter(step => !completedSteps.includes(step));

        urgentSteps.forEach(stepId => {
          const existing = recs.find(r => r.stepId === stepId);
          if (existing) {
            existing.priority = 'high';
            existing.reason = `⚠️ DRINGEND (${daysUntilWedding} Tage): ` + existing.reason;
          }
        });
      }

      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      // Limit to top 5 recommendations
      setRecommendations(recs.slice(0, 5));

    } catch (error) {
      logger.error('Error generating recommendations', 'StepRecommendations', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'from-red-500 to-red-600';
      case 'medium':
        return 'from-orange-500 to-orange-600';
      case 'low':
        return 'from-blue-500 to-blue-600';
    }
  };

  const getPriorityBg = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-50';
      case 'medium':
        return 'bg-orange-50';
      case 'low':
        return 'bg-blue-50';
    }
  };

  const getPriorityBorder = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'border-red-200';
      case 'medium':
        return 'border-orange-200';
      case 'low':
        return 'border-blue-200';
    }
  };

  const getPriorityLabel = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'Hohe Priorität';
      case 'medium':
        return 'Mittlere Priorität';
      case 'low':
        return 'Niedrige Priorität';
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl p-6 border border-[#d4af37]/20">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-lg">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-900">Fantastisch!</h3>
            <p className="text-sm text-green-700">
              Ihr habt alle Hero Journey Schritte abgeschlossen. Weiter so!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl p-3 sm:p-4 md:p-6 border border-[#d4af37]/20">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
        <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-2 sm:p-2.5 md:p-3 rounded-lg">
          <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base md:text-xl font-bold text-gray-900 truncate">
            Empfohlene nächste Schritte
          </h3>
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 hidden sm:block">
            Basierend auf eurem Fortschritt und Hochzeitsdatum
          </p>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
        {recommendations.map((rec, idx) => {
          const Icon = rec.icon;

          return (
            <button
              key={rec.stepId}
              onClick={() => onStepClick(rec.stepId)}
              className={`w-full text-left p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border transition-all ${getPriorityBorder(rec.priority)} ${getPriorityBg(rec.priority)} hover:shadow-lg hover:scale-[1.01] sm:hover:scale-[1.02] active:scale-[0.98] cursor-pointer`}
            >
              <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3">
                <div className={`bg-gradient-to-br ${getPriorityColor(rec.priority)} p-1.5 sm:p-2 md:p-2.5 rounded-lg flex-shrink-0`}>
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between gap-2 mb-1 sm:mb-1.5 md:mb-2">
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-tight break-words flex-1">{rec.stepTitle}</h4>
                    <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                      rec.priority === 'high'
                        ? 'bg-red-200 text-red-800'
                        : rec.priority === 'medium'
                        ? 'bg-orange-200 text-orange-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}>
                      <span className="hidden sm:inline">{getPriorityLabel(rec.priority)}</span>
                      <span className="sm:hidden">
                        {rec.priority === 'high' ? 'Hoch' : rec.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                      </span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 mb-1.5 sm:mb-2 leading-snug break-words overflow-wrap-anywhere line-clamp-3 sm:line-clamp-none">
                    {rec.reason}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-gray-600 flex-shrink-0">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                      <span className="whitespace-nowrap">{rec.estimatedTime}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0 ml-2" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {recommendations.length >= 5 && (
        <div className="mt-3 sm:mt-4 p-2 sm:p-2.5 md:p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-[10px] sm:text-xs text-blue-700 text-center leading-snug">
            <span className="hidden sm:inline">💡 Tipp: Konzentriert euch auf die Top-Prioritäten für den größten Fortschritt!</span>
            <span className="sm:hidden">💡 Fokus auf Top-Prioritäten!</span>
          </p>
        </div>
      )}
    </div>
  );
}
