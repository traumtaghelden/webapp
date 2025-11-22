import { ReactNode, useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number | string;
  disabled?: boolean;
  shortLabel?: string; // Kurzes Label für mobile Ansicht
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: 'page' | 'modal'; // Variante für unterschiedliche Kontexte
}

export default function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  variant = 'page'
}: TabNavigationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Scroll-Indikatoren aktualisieren
  const updateScrollIndicators = () => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const canScrollL = scrollLeft > 10;
    const canScrollR = scrollLeft < scrollWidth - clientWidth - 10;

    setShowLeftFade(canScrollL);
    setShowRightFade(canScrollR);
    setCanScrollLeft(canScrollL);
    setCanScrollRight(canScrollR);
  };

  // Aktiven Tab in Sicht scrollen
  const scrollToActiveTab = () => {
    if (!scrollRef.current) return;

    const activeButton = scrollRef.current.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement;
    if (activeButton) {
      activeButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

  useEffect(() => {
    updateScrollIndicators();
    scrollToActiveTab();

    const handleScroll = () => updateScrollIndicators();
    const scrollElement = scrollRef.current;

    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      // Initiale Prüfung nach kurzer Verzögerung für korrekte Maße
      setTimeout(updateScrollIndicators, 100);

      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [activeTab, tabs]);

  // Scroll-Navigation
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;

    const scrollAmount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const isModal = variant === 'modal';

  return (
    <div className={`relative border-b border-white/20 ${className}`}>
      {/* Linker Fade-Indikator */}
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0A1F3D] to-transparent z-10 pointer-events-none" />
      )}

      {/* Rechter Fade-Indikator */}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0A1F3D] to-transparent z-10 pointer-events-none" />
      )}

      {/* Linker Scroll-Button (Desktop) */}
      {canScrollLeft && !isModal && (
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center bg-white/10 backdrop-blur-sm rounded-full shadow-lg border border-white/20 hover:bg-white/20 active:scale-95 transition-all"
          aria-label="Nach links scrollen"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Rechter Scroll-Button (Desktop) */}
      {canScrollRight && !isModal && (
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center bg-white/10 backdrop-blur-sm rounded-full shadow-lg border border-white/20 hover:bg-white/20 active:scale-95 transition-all"
          aria-label="Nach rechts scrollen"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Tab Navigation */}
      <nav
        ref={scrollRef}
        className="flex gap-1 sm:gap-2 -mb-px overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-px-4 pb-1 px-1"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;
          const displayLabel = isModal && tab.shortLabel ? tab.shortLabel : tab.label;

          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              aria-label={tab.label}
              className={`
                group relative flex items-center gap-1.5 sm:gap-2
                ${isModal ? 'px-3 py-2.5' : 'px-4 sm:px-6 py-3'}
                font-semibold text-xs sm:text-sm whitespace-nowrap
                border-b-3 transition-all duration-200
                min-h-[48px] min-w-[48px]
                snap-center flex-shrink-0
                ${
                  isActive
                    ? 'border-[#F5B800] text-[#F5B800] scale-105'
                    : isDisabled
                    ? 'border-transparent text-gray-500 cursor-not-allowed'
                    : 'border-transparent text-gray-300 hover:text-[#F5B800] hover:border-white/30 hover:bg-white/5 active:scale-95'
                }
              `}
            >
              {tab.icon && (
                <span className={`
                  flex-shrink-0
                  ${isModal ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-4 h-4 sm:w-5 sm:h-5'}
                  ${isActive ? 'text-[#F5B800]' : isDisabled ? 'text-gray-500' : 'text-gray-400 group-hover:text-[#F5B800]'}
                  ${isActive ? 'animate-in zoom-in-50 duration-200' : ''}
                `}>
                  {tab.icon}
                </span>
              )}
              <span className="hidden xs:inline">{displayLabel}</span>
              <span className="xs:hidden">{tab.shortLabel || displayLabel}</span>
              {tab.badge !== undefined && (
                <span className={`
                  px-1.5 py-0.5 rounded-full text-xs font-bold
                  min-w-[20px] text-center
                  ${
                    isActive
                      ? 'bg-[#F5B800] text-gray-900'
                      : 'bg-white/10 text-gray-300'
                  }
                `}>
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F5B800] to-[#f4d03f] rounded-t-full animate-in slide-in-from-bottom-2 duration-200" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
