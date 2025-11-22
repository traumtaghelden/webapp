import { useState, useEffect } from 'react';
import { Crown, Sparkles, ChevronDown, ChevronUp, Star, Gift, X } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useUpgrade } from '../hooks/useUpgrade';

export default function TrialBanner() {
  const { accountStatus, daysRemaining, isLoading } = useSubscription();
  const { showUpgrade } = useUpgrade();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    const savedExpanded = localStorage.getItem('trialBannerExpanded');
    if (savedExpanded !== null) {
      setIsExpanded(savedExpanded === 'true');
    }
    // Banner ist beim App-Start immer sichtbar (nicht geschlossen)
  }, []);

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('trialBannerExpanded', String(newState));
  };

  const closeBanner = () => {
    setIsClosed(true);
    // Banner nur für diese Session schließen (kein LocalStorage)
  };

  if (isLoading || isClosed) return null;

  if (accountStatus !== 'trial_active') return null;

  const isLastWeek = daysRemaining <= 7;
  const bgColor = 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f]';
  const textColor = 'text-[#0a253c]';

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${bgColor} ${textColor} px-3 sm:px-6 py-2 sm:py-3 lg:py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.3)] relative overflow-hidden transition-all duration-300`}>
      <div className="absolute inset-0 bg-white/10"></div>
      <div className="absolute inset-0 hidden sm:block">
        <Sparkles className="absolute top-2 left-4 w-4 h-4 text-white/30 animate-pulse" />
        <Star className="absolute bottom-2 right-8 w-5 h-5 text-white/20 animate-pulse" style={{ animationDelay: '1s' }} />
        <Sparkles className="absolute top-1/2 right-1/4 w-3 h-3 text-white/25 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {isExpanded ? (
          /* Desktop: Volle Ansicht */
          <div className="hidden lg:flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm flex-shrink-0">
                <Gift className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span>{isLastWeek ? 'Profitiere noch von allen Premium-Features!' : 'Premium-Testphase aktiv'}</span>
                  <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap">
                    {daysRemaining} {daysRemaining === 1 ? 'Tag' : 'Tage'} verbleibend
                  </span>
                </h3>
                <p className="text-sm opacity-90 mt-1">
                  {isLastWeek
                    ? `Du nutzt aktuell alle Premium-Features. Sichere dir weiterhin vollen Zugriff auf deine Hochzeitsplanung!`
                    : `Entdecke noch ${daysRemaining} Tage lang alle Premium-Features – von Budget-Tracking bis zur Timeline-Planung.`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={showUpgrade}
                className="bg-[#0a253c] hover:bg-[#1a3a5c] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <Crown className="w-5 h-5" />
                Premium entdecken
              </button>
              <button
                onClick={toggleExpanded}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
                aria-label="Banner einklappen"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <button
                onClick={closeBanner}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
                aria-label="Banner schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : null}

        {/* Mobile/Tablet: Immer kompakte Ansicht (unabhängig von isExpanded) */}
        <div className="flex lg:hidden items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="bg-[#0a253c] p-1.5 rounded backdrop-blur-sm flex-shrink-0">
              <Crown className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm block truncate">
                Premium Trial: {daysRemaining} {daysRemaining === 1 ? 'Tag' : 'Tage'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={showUpgrade}
              className="bg-[#0a253c] hover:bg-[#1a3a5c] text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-all shadow-lg"
            >
              <Crown className="w-3 h-3" />
              Upgrade
            </button>
            <button
              onClick={closeBanner}
              className="bg-[#0a253c]/80 hover:bg-[#0a253c] text-white p-1 rounded transition-all"
              aria-label="Banner schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop: Eingeklappte Ansicht */}
        {!isExpanded && (
          <div className="hidden lg:flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm flex-shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm truncate">
                Premium-Testphase • {daysRemaining} {daysRemaining === 1 ? 'Tag' : 'Tage'}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={showUpgrade}
                className="bg-[#0a253c] hover:bg-[#1a3a5c] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm"
              >
                <Crown className="w-4 h-4" />
                Premium
              </button>
              <button
                onClick={toggleExpanded}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
                aria-label="Banner ausklappen"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <button
                onClick={closeBanner}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
                aria-label="Banner schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
