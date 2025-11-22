import { useState, useEffect } from 'react';
import { Heart, Sparkles, CheckCircle, DollarSign, Users, Building2, Clock, Settings, Shield, LogOut, ChevronLeft, ChevronRight, Menu, X, Calendar, MapPin, Map, HelpCircle, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { disableBodyScroll, enableBodyScroll } from '../utils/scrollLockManager';
import { FeedbackModal } from './Modals';
import { haptics } from '../utils/hapticFeedback';

type Tab = 'overview' | 'journey' | 'tasks' | 'budget' | 'guests' | 'vendors' | 'locations' | 'timeline' | 'settings' | 'privacy' | 'support';

interface VerticalSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  partner1Name: string;
  partner2Name: string;
  weddingDate: string;
  completionPercentage: number;
  onCollapsedChange?: (collapsed: boolean) => void;
}

interface NavItem {
  id: Tab;
  icon: React.ElementType;
  label: string;
  shortLabel?: string;
}

const mainNavItems: NavItem[] = [
  { id: 'overview', icon: Sparkles, label: 'Übersicht', shortLabel: 'Über.' },
  { id: 'journey', icon: Map, label: 'Heldenplan', shortLabel: 'Plan' },
  { id: 'tasks', icon: CheckCircle, label: 'Aufgaben', shortLabel: 'Tasks' },
  { id: 'budget', icon: DollarSign, label: 'Budget', shortLabel: 'Budget' },
  { id: 'guests', icon: Users, label: 'Gäste', shortLabel: 'Gäste' },
  { id: 'vendors', icon: Building2, label: 'Dienstleister', shortLabel: 'Vendor' },
  { id: 'locations', icon: MapPin, label: 'Locations', shortLabel: 'Locs' },
  { id: 'timeline', icon: Clock, label: 'Timeline', shortLabel: 'Zeit' },
];

const secondaryNavItems: NavItem[] = [
  { id: 'settings', icon: Settings, label: 'Einstellungen', shortLabel: 'Config' },
  { id: 'privacy', icon: Shield, label: 'Datenschutz', shortLabel: 'Privacy' },
  { id: 'support', icon: HelpCircle, label: 'Support', shortLabel: 'Hilfe' },
];

export default function VerticalSidebar({
  activeTab,
  onTabChange,
  partner1Name,
  partner2Name,
  weddingDate,
  completionPercentage,
  onCollapsedChange,
}: VerticalSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    return stored ? JSON.parse(stored) : false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Touch gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Minimum swipe distance (in px) to trigger close
  const minSwipeDistance = 50;

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
    onCollapsedChange?.(isCollapsed);
  }, [isCollapsed, onCollapsedChange]);

  useEffect(() => {
    if (isMobileOpen) {
      disableBodyScroll();
    } else {
      enableBodyScroll();
    }
    return () => {
      if (isMobileOpen) {
        enableBodyScroll();
      }
    };
  }, [isMobileOpen]);

  const getDaysUntilWedding = () => {
    const today = new Date();
    const wedding = new Date(weddingDate);
    const diffTime = wedding.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Hallo';
    return 'Guten Abend';
  };

  const getWeddingDateFormatted = () => {
    const date = new Date(weddingDate);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('de-DE', options);
  };

  const loveQuotes = [
    "Die Liebe ist das einzige, was wächst, wenn wir es verschwenden.",
    "In der Liebe gibt es nur einen Moment, und der dauert ewig.",
    "Liebe ist nicht das, was man erwartet zu bekommen, sondern das, was man bereit ist zu geben.",
    "Zwei Seelen mit einem einzigen Gedanken, zwei Herzen, die als eins schlagen.",
    "Die größte Kunst ist, den anderen so glücklich zu machen, wie man selbst ist.",
    "Liebe besteht nicht darin, dass man einander anschaut, sondern gemeinsam in dieselbe Richtung blickt.",
    "Ein erfülltes Leben ist wie ein gefülltes Glas - es wird erst schön, wenn man es teilt.",
    "Wo Liebe ist, da ist Leben.",
    "Die Liebe ist der Wunsch, etwas zu geben, nicht zu erhalten.",
    "In der Liebe und im Krieg ist alles erlaubt - bei der Hochzeit nur die Liebe.",
    "Geliebt zu werden macht uns stark. Lieben macht uns mutig.",
    "Die Ehe ist eine Brücke, die man täglich neu bauen muss, am besten von beiden Seiten.",
    "Glück ist Liebe, nichts anderes. Wer lieben kann, ist glücklich.",
    "Die schönsten Wunder beginnen immer mit einem 'Ja'.",
    "Liebe ist das einzige Märchen, das wahr werden kann."
  ];

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % loveQuotes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    haptics.medium();
    await supabase.auth.signOut();
  };

  const handleTabClick = (tab: Tab) => {
    haptics.light();
    onTabChange(tab);
    setIsMobileOpen(false);
  };

  // Touch gesture handlers for swipe-to-close
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);

    if (touchStart !== null) {
      const diff = touchStart - currentTouch;
      // Only allow left swipe (close) when sidebar is open
      if (diff > 0 && isMobileOpen) {
        setIsDragging(true);
        setDragOffset(Math.min(diff, 288)); // Max 288px (sidebar width)
      }
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;

    if (isLeftSwipe && isMobileOpen) {
      haptics.light();
      setIsMobileOpen(false);
    }

    // Reset states
    setTouchStart(null);
    setTouchEnd(null);
    setIsDragging(false);
    setDragOffset(0);
  };

  // Edge swipe to open sidebar (from left edge of screen)
  const onEdgeTouchStart = (e: React.TouchEvent) => {
    const touchX = e.targetTouches[0].clientX;
    // Only trigger if touch starts within 20px from left edge
    if (touchX < 20 && !isMobileOpen) {
      setTouchStart(touchX);
      setTouchEnd(null);
    }
  };

  const onEdgeTouchMove = (e: React.TouchEvent) => {
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);

    if (touchStart !== null && touchStart < 20) {
      const diff = currentTouch - touchStart;
      // Only allow right swipe (open)
      if (diff > 0 && !isMobileOpen) {
        setIsDragging(true);
        setDragOffset(Math.min(diff, 288)); // Max 288px
      }
    }
  };

  const onEdgeTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const distance = touchEnd - touchStart;
    const isRightSwipe = distance > minSwipeDistance;

    if (isRightSwipe && !isMobileOpen && touchStart < 20) {
      haptics.light();
      setIsMobileOpen(true);
    }

    // Reset states
    setTouchStart(null);
    setTouchEnd(null);
    setIsDragging(false);
    setDragOffset(0);
  };

  const toggleCollapse = () => {
    haptics.light();
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <button
        onClick={() => {
          haptics.light();
          setIsMobileOpen(!isMobileOpen);
        }}
        className="lg:hidden fixed top-4 left-4 z-[10000] p-3 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white rounded-xl shadow-gold hover:shadow-gold-lg transition-all active:scale-95"
        aria-label={isMobileOpen ? "Navigation schließen" : "Navigation öffnen"}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Edge swipe detector for opening sidebar */}
      <div
        className="lg:hidden fixed top-0 left-0 w-5 h-full z-[60]"
        onTouchStart={onEdgeTouchStart}
        onTouchMove={onEdgeTouchMove}
        onTouchEnd={onEdgeTouchEnd}
      />

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[9990] animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-[#0a253c] via-[#1a3a5c] to-[#0a253c] border-r-2 border-[#d4af37]/30 shadow-2xl z-[9999] ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isDragging ? '' : 'transition-all duration-300'
        }`}
        style={{
          transform: isDragging && isMobileOpen
            ? `translateX(-${dragOffset}px)`
            : isDragging && !isMobileOpen && dragOffset > 0
            ? `translateX(calc(-100% + ${dragOffset}px))`
            : undefined
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex flex-col h-full relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMTIsIDE3NSwgNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="p-4 border-b border-[#d4af37]/20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  haptics.light();
                  setIsMobileOpen(false);
                }}
                className="lg:hidden absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all z-10"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>

              {!isCollapsed ? (
                <div className="animate-slide-in-smooth space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 mb-2 px-4 py-1.5 bg-gradient-to-r from-[#d4af37]/20 to-[#f4d03f]/20 rounded-full border border-[#d4af37]/30">
                      <Sparkles className="w-4 h-4 text-[#f4d03f] animate-sparkle" />
                      <span className="text-white/90 text-sm font-medium">{getGreeting()}</span>
                    </div>
                    <div className="relative mb-3">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent h-px top-1/2"></div>
                      <h2 className="relative inline-block px-4 bg-[#0a253c] text-white font-bold text-lg">
                        <Heart className="inline-block w-5 h-5 text-[#d4af37] fill-current mr-2 animate-pulse" />
                        {partner1Name} & {partner2Name}
                      </h2>
                    </div>
                    <p className="text-white/60 text-xs italic">{getDaysUntilWedding()} Tage bis zur Hochzeit</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 animate-slide-in-smooth">
                  <div className="relative group">
                    <div className="relative bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-12 h-12 rounded-full flex items-center justify-center shadow-gold">
                      <Heart className="w-6 h-6 text-white fill-current drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="relative bg-gradient-to-br from-[#d4af37]/10 to-[#f4d03f]/10 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 border-[#d4af37]/40 shadow-gold">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] opacity-20 rounded-2xl animate-pulse"></div>
                    <div className="relative z-10 text-center">
                      <Calendar className="w-6 h-6 text-[#d4af37] mx-auto mb-1" />
                      <span className="text-xs font-bold text-white">{getDaysUntilWedding()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 scrollbar-hide">
              <div className="space-y-1">
                {mainNavItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                        isActive
                          ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white shadow-gold scale-105'
                          : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-102'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <Icon
                        className={`flex-shrink-0 transition-all duration-300 ${
                          isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
                        } ${isActive ? 'animate-pulse' : 'group-hover:scale-110'}`}
                      />
                      {!isCollapsed && (
                        <span className="font-semibold text-sm truncate">{item.label}</span>
                      )}
                      {isActive && !isCollapsed && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="my-4 border-t border-[#d4af37]/20" />

              <div className="space-y-1">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                        isActive
                          ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white shadow-gold'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon
                        className={`flex-shrink-0 transition-all duration-300 ${
                          isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
                        } ${isActive ? 'animate-pulse' : 'group-hover:scale-110'}`}
                      />
                      {!isCollapsed && (
                        <span className="font-semibold text-sm truncate">{item.label}</span>
                      )}
                    </button>
                  );
                })}

                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group bg-gradient-to-r from-[#F5B800]/20 to-[#E0A800]/20 border border-[#F5B800]/30 text-[#F5B800] hover:from-[#F5B800]/30 hover:to-[#E0A800]/30 hover:border-[#F5B800]/50 hover:scale-102"
                >
                  <MessageSquare
                    className={`flex-shrink-0 transition-all duration-300 ${
                      isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
                    } group-hover:scale-110`}
                  />
                  {!isCollapsed && (
                    <span className="font-semibold text-sm truncate">Feedback geben</span>
                  )}
                </button>
              </div>
            </nav>

            <div className="p-4 border-t border-[#d4af37]/20 space-y-2">
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-red-500/20 transition-all duration-300 group ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <LogOut className={`flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} group-hover:scale-110`} />
                {!isCollapsed && <span className="font-semibold text-sm">Abmelden</span>}
              </button>

              <button
                onClick={toggleCollapse}
                className="hidden lg:flex w-full items-center justify-center gap-2 px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300"
                aria-label={isCollapsed ? 'Sidebar erweitern' : 'Sidebar minimieren'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <>
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-xs font-semibold">Minimieren</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
    </>
  );
}
