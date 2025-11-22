import { ReactNode, useRef, useEffect, useState } from 'react';

export interface MobileTab {
  id: string;
  label: string;
  icon?: ReactNode;
  shortLabel?: string;
  badge?: number | string;
  disabled?: boolean;
}

interface MobileTabNavigationProps {
  tabs: MobileTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: 'pills' | 'underline';
}

export default function MobileTabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  variant = 'pills'
}: MobileTabNavigationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateScrollIndicators = () => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftFade(scrollLeft > 5);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 5);
  };

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
      setTimeout(updateScrollIndicators, 50);

      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [activeTab, tabs]);

  const isPills = variant === 'pills';

  return (
    <div className={`relative ${className}`}>
      {/* Linker Fade-Indikator für dunklen Hintergrund */}
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#0A1F3D] to-transparent z-10 pointer-events-none" />
      )}

      {/* Rechter Fade-Indikator für dunklen Hintergrund */}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#0A1F3D] to-transparent z-10 pointer-events-none" />
      )}

      {/* Tab Navigation */}
      <nav
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-px-2 pb-1 px-1"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;
          const displayLabel = tab.shortLabel || tab.label;

          if (isPills) {
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
                  group relative flex items-center gap-1.5
                  px-3 py-2.5
                  font-semibold text-xs whitespace-nowrap
                  rounded-lg transition-all duration-200
                  min-h-[44px] min-w-[44px]
                  snap-center flex-shrink-0
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] shadow-gold scale-105'
                      : isDisabled
                      ? 'bg-white/5 text-white/40 cursor-not-allowed'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-[#d4af37]/30 hover:border-[#d4af37]/50 active:scale-95'
                  }
                `}
              >
                {tab.icon && (
                  <span className={`
                    flex-shrink-0 w-3.5 h-3.5
                    ${isActive ? 'animate-in zoom-in-50 duration-200' : ''}
                  `}>
                    {tab.icon}
                  </span>
                )}
                <span className="hidden xs:inline">{displayLabel}</span>
                <span className="xs:hidden" aria-hidden="true">{tab.shortLabel || displayLabel.split(' ')[0]}</span>
                {tab.badge !== undefined && (
                  <span className={`
                    px-1.5 py-0.5 rounded-full text-xs font-bold
                    min-w-[18px] text-center
                    ${
                      isActive
                        ? 'bg-white/20 text-[#0a253c]'
                        : 'bg-white/20 text-white/90'
                    }
                  `}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          }

          // Underline variant
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
                group relative flex items-center gap-1.5
                px-3 py-2.5
                font-semibold text-xs whitespace-nowrap
                transition-all duration-200
                min-h-[44px] min-w-[44px]
                snap-center flex-shrink-0
                border-b-3
                ${
                  isActive
                    ? 'border-[#d4af37] text-[#d4af37] scale-105'
                    : isDisabled
                    ? 'border-transparent text-white/40 cursor-not-allowed'
                    : 'border-transparent text-white/70 hover:text-white hover:border-[#d4af37]/50 active:scale-95'
                }
              `}
            >
              {tab.icon && (
                <span className={`
                  flex-shrink-0 w-3.5 h-3.5
                  ${isActive ? 'animate-in zoom-in-50 duration-200' : ''}
                `}>
                  {tab.icon}
                </span>
              )}
              <span className="hidden xs:inline">{displayLabel}</span>
              <span className="xs:hidden" aria-hidden="true">{tab.shortLabel || displayLabel.split(' ')[0]}</span>
              {tab.badge !== undefined && (
                <span className={`
                  px-1.5 py-0.5 rounded-full text-xs font-bold
                  min-w-[18px] text-center
                  ${
                    isActive
                      ? 'bg-[#d4af37] text-white'
                      : 'bg-white/20 text-white/90'
                  }
                `}>
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] rounded-t-full animate-in slide-in-from-bottom-2 duration-200" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
