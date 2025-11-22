import { Sparkles, ArrowRight, Trophy, Star } from 'lucide-react';

interface HeroJourneyWidgetProps {
  completedSteps: number;
  totalSteps: number;
  nextRecommendedStep: string;
  onNavigateToJourney: () => void;
}

const STEP_LABELS: { [key: string]: string } = {
  vision: 'Eure Vision definieren',
  budget: 'Euer Budget festlegen',
  guest_count: 'Eure Gästezahl planen',
  location: 'Eure Location finden',
  ceremony: 'Trauung & Timing koordinieren',
  date: 'Euer Hochzeitsdatum wählen',
  personality: 'Euren Stil bestimmen',
  timeline: 'Euren Tagesplan erstellen',
  personal_planning: 'Persönliche Details planen',
  guest_planning: 'Gästeerlebnis gestalten',
  completed: 'Alle Schritte abgeschlossen'
};

export default function HeroJourneyWidget({
  completedSteps,
  totalSteps,
  nextRecommendedStep,
  onNavigateToJourney
}: HeroJourneyWidgetProps) {
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);
  const isComplete = completedSteps === totalSteps;

  return (
    <div className="relative bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-3xl p-8 shadow-2xl overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all duration-300"
         onClick={onNavigateToJourney}>
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-[#f4d03f]/10 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#f4d03f]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {isComplete ? (
            <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] p-4 rounded-2xl shadow-xl shadow-[#d4af37]/50">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] p-4 rounded-2xl shadow-xl shadow-[#d4af37]/50 animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-2xl text-white flex items-center gap-2">
              Heldenplan
              <Sparkles className="w-5 h-5 text-[#f4d03f] animate-pulse" />
            </h3>
            <p className="text-sm text-gray-400 font-medium">Deine Hochzeitsreise</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToJourney();
          }}
          className="text-[#d4af37] hover:text-[#f4d03f] transition-all hover:scale-110 active:scale-95 bg-white/5 hover:bg-white/10 p-2 rounded-xl"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-bold text-white">
            {completedSteps} von {totalSteps} Schritten
          </span>
          <span className="text-lg font-bold text-[#0a253c] bg-gradient-to-r from-[#d4af37] to-[#f4d03f] px-4 py-1.5 rounded-full shadow-lg shadow-[#d4af37]/30">
            {progressPercentage}%
          </span>
        </div>
        <div className="w-full h-5 bg-gray-700/50 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-[#d4af37] via-[#f4d03f] to-[#d4af37] transition-all duration-700 ease-out rounded-full relative overflow-hidden shadow-lg"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            <div className="absolute inset-0 flex items-center justify-end pr-3">
              {progressPercentage > 10 && (
                <Star className="w-4 h-4 text-white fill-white animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Next Step or Completion Message */}
      <div className="relative z-10">
        {isComplete ? (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border-2 border-green-400/30 backdrop-blur-sm">
            <p className="text-white font-bold text-lg flex items-center gap-3">
              <Trophy className="w-7 h-7 text-[#f4d03f]" />
              Glückwunsch! Alle Schritte abgeschlossen!
            </p>
            <p className="text-gray-300 text-sm mt-2 font-medium">
              Du hast deine Hochzeitsreise erfolgreich gemeistert.
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border-2 border-[#d4af37]/30 backdrop-blur-sm">
            <p className="text-xs font-bold text-[#f4d03f] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 fill-current" />
              Nächster Schritt:
            </p>
            <p className="text-lg font-bold text-white">
              {STEP_LABELS[nextRecommendedStep] || 'Weiter planen'}
            </p>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToJourney();
          }}
          className="w-full mt-6 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#f4d03f] hover:to-[#d4af37] text-gray-900 font-bold text-lg py-4 px-6 rounded-2xl transition-all duration-300 shadow-2xl shadow-[#d4af37]/40 hover:shadow-[#d4af37]/60 hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group/button"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/button:translate-x-[100%] transition-transform duration-700"></div>
          <span className="relative z-10 flex items-center gap-3">
            Zur Heldenreise
            <Sparkles className="w-6 h-6 animate-pulse" />
          </span>
        </button>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite;
        }
      `}</style>
    </div>
  );
}
