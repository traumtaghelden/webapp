import { Heart, CheckCircle, Calendar, Users, Sparkles, Zap, Sliders, RefreshCw, Star, ArrowRight, TrendingUp, Award, Trophy, Target, X, DollarSign, MinusCircle, PlusCircle, Check, Mail, FileText, Shield, LogIn, Crown, AlertTriangle, Clock, Timer, LayoutGrid, MapPin, Palette, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ModalRoot } from './Modals';
import { attachModalTriggers, openModal } from '../lib/modalManager';

interface LandingPageProps {
  onGetStarted: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [budget, setBudget] = useState(15000);
  const [demoTasks, setDemoTasks] = useState([
    { id: 1, text: 'Location suchen', completed: false },
    { id: 2, text: 'Save-the-Date versenden', completed: false },
    { id: 3, text: 'Catering anfragen', completed: false },
  ]);
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState(0);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    // Optimize video playback
    const video = document.querySelector('video');
    if (video) {
      // Reduce buffering and prioritize smooth playback
      video.setAttribute('x-webkit-airplay', 'deny');
      video.setAttribute('disablePictureInPicture', 'true');

      // Force lower playback rate for smoother performance if needed
      const handleCanPlay = () => {
        video.playbackRate = 1.0;
        // Remove will-change after initial load
        setTimeout(() => {
          video.style.willChange = 'auto';
        }, 3000);
      };

      video.addEventListener('canplay', handleCanPlay);

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, []);

  const demoTimelineEvents = [
    { id: 1, time: '14:00', title: 'Trauung', duration: '45 Min', guests: 80, color: '#d4af37' },
    { id: 2, time: '15:00', title: 'Sektempfang', duration: '60 Min', guests: 80, color: '#c19a2e' },
    { id: 3, time: '17:00', title: 'Fotoshooting', duration: '90 Min', guests: 2, color: '#a88529' },
    { id: 4, time: '18:30', title: 'Abendessen', duration: '120 Min', guests: 80, color: '#d4af37' },
  ];

  const faqs: FAQItem[] = [
    {
      question: "Was ist die Heldenreise?",
      answer: "Die Heldenreise ist unser 10-Schritte-System, das euch strukturiert von der ersten Vision bis zum perfekten Hochzeitstag führt. Jeder Schritt baut auf dem vorherigen auf und hilft euch, die richtigen Entscheidungen zu treffen. Mit Progress-Tracking und Achievements bleibst du motiviert."
    },
    {
      question: "Was kann ich alles planen?",
      answer: "Bei uns findet ihr alles für eure Hochzeit: Ein Dashboard für den Überblick, eine geführte Heldenreise in 10 Schritten, Aufgaben-Management, Budget-Planung, Gäste-Verwaltung, Dienstleister-Organisation, Location-Suche und einen detaillierten Tagesablauf für euren Hochzeitstag."
    },
    {
      question: "Was ist Block-Planung?",
      answer: "Block-Planung ist unser Kern-Feature für den Hochzeitstag. Jedes Event (Trauung, Empfang, Dinner) wird ein eigener Block mit Sub-Timelines, Checklisten, zugeordneten Gästen, Dienstleistern, Locations und eigenem Budget-Tracking. So habt ihr für jeden Moment alle Details griffbereit."
    },
    {
      question: "Kostet die Plattform etwas?",
      answer: "Startet mit 14 Tagen kostenlos - ohne Kreditkarte! Testet alle Premium-Features in Ruhe. Danach könnt ihr im kostenlosen Read-Only-Modus eure Daten einsehen oder Premium für 29,99€/Monat weiternutzen. Keine versteckten Kosten, jederzeit kündbar."
    },
    {
      question: "Wie sicher sind meine Daten?",
      answer: "Eure Daten werden verschlüsselt und sicher in Deutschland (Supabase/EU) gespeichert. Wir halten uns streng an die DSGVO und geben keine Daten an Dritte weiter. Ihr habt jederzeit volle Kontrolle über eure Informationen."
    },
    {
      question: "Kann ich Dienstleister und Locations verwalten?",
      answer: "Ja! Ihr könnt Dienstleister und Locations sammeln, vergleichen und eure Favoriten markieren. Verträge verwalten, Kosten im Blick behalten und alles direkt mit eurem Budget und Tagesablauf verknüpfen. So bleibt alles übersichtlich."
    },
    {
      question: "Was sind Pufferzeiten?",
      answer: "Pufferzeiten sind flexible Zeitblöcke zwischen euren Events in der Wedding Day Timeline. Sie geben euch Raum zum Durchatmen, für spontane Momente und fangen Verzögerungen ab, damit euer Tag entspannt bleibt."
    },
    {
      question: "Funktioniert es auch auf dem Smartphone?",
      answer: "Absolut! Die Plattform funktioniert perfekt auf Smartphones, Tablets und Desktop. Plant unterwegs weiter, checkt eure To-Dos oder aktualisiert euer Budget – alles läuft flüssig auf allen Geräten."
    },
    {
      question: "Was ist der Unterschied zu Excel oder anderen Tools?",
      answer: "Im Gegensatz zu Excel bieten wir: Geführte Planung in 10 Schritten, alles an einem Ort (Gäste, Budget, Aufgaben), Block-Planung für euren Hochzeitstag, automatische Verknüpfungen, visuelles Fortschritts-Tracking und eine moderne, intuitive Oberfläche. Keine Formeln, kein Chaos."
    },
    {
      question: "Kann ich meine Daten exportieren?",
      answer: "Ja, ihr könnt alle eure Daten jederzeit als PDF oder CSV exportieren. Eure Daten gehören euch und ihr habt volle Kontrolle darüber. Export funktioniert mit einem Klick."
    },
    {
      question: "Wie detailliert kann ich meinen Tagesablauf planen?",
      answer: "Extrem detailliert! Jeder Event-Block in der Wedding Day Timeline hat eigene Sub-Timelines, Checklisten, Aufgaben-Verknüpfungen, Gäste-Zuordnung, Dienstleister-Zuordnung, Location-Zuordnung und Budget-Tracking. Plus Pufferblöcke für Flexibilität."
    },
    {
      question: "Was passiert nach den 14 Tagen?",
      answer: "Nach dem Trial könnt ihr im Read-Only-Modus alle eure Daten einsehen und exportieren - komplett kostenlos! Zum Bearbeiten braucht ihr Premium (29,99€/Monat). Keine Daten gehen verloren und ihr habt unbegrenzt Zeit zu entscheiden. Kein Stress, keine Überraschungen."
    }
  ];

  const toggleDemoTask = (id: number) => {
    setDemoTasks(tasks =>
      tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const getBudgetRecommendation = (amount: number) => {
    if (amount < 5000) return { text: 'Intime Feier (20-30 Gäste)', icon: '🌸' };
    if (amount < 15000) return { text: 'Klassische Hochzeit (50-80 Gäste)', icon: '💒' };
    if (amount < 30000) return { text: 'Große Feier (100-150 Gäste)', icon: '✨' };
    return { text: 'Luxus-Hochzeit (150+ Gäste)', icon: '👑' };
  };

  useEffect(() => {
    attachModalTriggers();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f2eb]">
      <ModalRoot />
      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a253c]/95 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-[#d4af37] fill-current" />
              <span className="text-lg sm:text-xl font-bold text-white">Heldenreise</span>
              <span className="bg-orange-500 text-white text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full animate-pulse">BETA</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[#f7f2eb]/80 hover:text-[#d4af37] transition-colors text-sm font-medium">
                Features
              </a>
              <a href="#pricing" className="text-[#f7f2eb]/80 hover:text-[#d4af37] transition-colors text-sm font-medium">
                Preise
              </a>
              <a href="#faq" className="text-[#f7f2eb]/80 hover:text-[#d4af37] transition-colors text-sm font-medium">
                FAQ
              </a>
              <button
                onClick={() => openModal('login')}
                className="flex items-center gap-2 text-[#d4af37] hover:text-[#f4d03f] transition-colors text-sm font-semibold"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
              <button
                onClick={() => openModal('login')}
                className="bg-[#d4af37] hover:bg-[#f4d03f] text-[#0a253c] px-6 py-2 rounded-full text-sm font-bold transition-all"
              >
                Kostenlos starten
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:text-[#d4af37] transition-colors touch-manipulation"
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <LayoutGrid className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4 space-y-3">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-4 text-[#f7f2eb] hover:bg-white/10 rounded-lg transition-colors text-base font-medium touch-manipulation"
              >
                Features
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-4 text-[#f7f2eb] hover:bg-white/10 rounded-lg transition-colors text-base font-medium touch-manipulation"
              >
                Preise
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-4 text-[#f7f2eb] hover:bg-white/10 rounded-lg transition-colors text-base font-medium touch-manipulation"
              >
                FAQ
              </a>
              <button
                onClick={() => {
                  openModal('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-[#d4af37] hover:bg-white/10 rounded-lg transition-colors text-base font-semibold touch-manipulation"
              >
                <LogIn className="w-5 h-5" />
                Login
              </button>
              <button
                onClick={() => {
                  openModal('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] py-3 px-4 rounded-lg text-base font-bold transition-all shadow-lg touch-manipulation"
              >
                Kostenlos starten
              </button>
            </nav>
          )}
        </div>
      </header>

      <div className="relative pt-14 sm:pt-16">
        <div className="relative overflow-hidden text-white">
          <div className="absolute inset-0 z-0">
            {/* Fallback gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] z-0"></div>

            {/* Video overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a253c]/80 via-[#0a253c]/60 to-[#0a253c]/95 z-10"></div>

            {/* Hero video with optimizations */}
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%230a253c' width='1920' height='1080'/%3E%3C/svg%3E"
              onLoadedData={() => setVideoLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{
                transform: 'translate3d(0, 0, 0)',
                willChange: 'auto',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                perspective: 1000,
                WebkitPerspective: 1000
              }}
            >
              <source
                src="https://res.cloudinary.com/dvaha0i6v/video/upload/q_auto:low,w_768,c_limit/v1761865110/Background_hero_5_1_iwxwaf.mp4"
                type="video/mp4"
                media="(max-width: 768px)"
              />
              <source
                src="https://res.cloudinary.com/dvaha0i6v/video/upload/q_auto:good,w_1920,c_limit/v1761865110/Background_hero_5_1_iwxwaf.mp4"
                type="video/mp4"
              />
            </video>
          </div>
          <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 relative z-20">
          <div className="text-center mb-10 sm:mb-14">
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative">
                <Heart className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-[#d4af37] animate-float fill-current" />
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#f4d03f] absolute -top-1 -right-1 md:-top-2 md:-right-2 animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-5 sm:mb-7 leading-tight animate-hero-title px-4">
              <span className="animate-hero-word" style={{ animationDelay: '0.1s' }}>Eure</span>{' '}
              <span className="text-gradient-gold animate-hero-word" style={{ animationDelay: '0.3s' }}>Heldenreise</span>
              <br />
              <span className="animate-hero-word" style={{ animationDelay: '0.5s' }}>beginnt</span>{' '}
              <span className="animate-hero-word" style={{ animationDelay: '0.7s' }}>hier</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-[#f7f2eb] mb-4 sm:mb-5 max-w-3xl mx-auto leading-relaxed px-4" style={{ lineHeight: '1.6' }}>
              Eure Hochzeit verdient mehr als Excel-Listen. Plant strukturiert, entspannt und mit allem was zählt.
            </p>
            <p className="text-sm sm:text-base text-[#f4d03f] mb-8 sm:mb-10 px-4">
              ✨ Jetzt 14 Tage kostenlos testen • Keine Kreditkarte nötig • Voller Zugriff auf alle Premium-Features
            </p>
            <div className="relative px-4">
              <button
                onClick={() => openModal('login')}
                className="button-modern bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#f4d03f] hover:to-[#d4af37] text-[#0a253c] w-full sm:w-auto px-10 sm:px-12 md:px-14 py-5 sm:py-5.5 rounded-full text-lg sm:text-xl font-bold shadow-gold-lg hover:shadow-gold animate-pulse-glow relative touch-manipulation"
                style={{ maxWidth: '400px', margin: '0 auto', display: 'block' }}
              >
                Jetzt 14 Tage kostenlos testen
              </button>
            </div>
          </div>

          {/* Mobile: Horizontal Swiper, Desktop: Grid - 4 Features */}
          <div className="mt-12 sm:mt-16 md:mt-20 max-w-7xl mx-auto">
            <div className="mobile-swiper md:grid md:grid-cols-4 md:gap-6 md:px-6">
              <div className="mobile-swiper-item glassmorphism-dark rounded-2xl p-6 sm:p-8 card-hover hover-lift" style={{ minHeight: '280px' }}>
                <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-gold">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 gradient-text-gold">Die Heldenreise</h3>
                <p className="text-sm sm:text-base text-[#f7f2eb] leading-relaxed">
                  Folgt eurem persönlichen 10-Schritte-Pfad zur perfekten Hochzeit. Schritt für Schritt zum Ziel.
                </p>
              </div>

              <div className="mobile-swiper-item glassmorphism-dark rounded-2xl p-6 sm:p-8 card-hover hover-lift" style={{ minHeight: '280px' }}>
                <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-gold">
                  <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 gradient-text-gold">Alles zentral organisiert</h3>
                <p className="text-sm sm:text-base text-[#f7f2eb] leading-relaxed">
                  Dashboard, Aufgaben, Budget, Gäste, Dienstleister, Locations & Timeline - alles an einem Ort.
                </p>
              </div>

              <div className="mobile-swiper-item glassmorphism-dark rounded-2xl p-6 sm:p-8 card-hover hover-lift" style={{ minHeight: '280px' }}>
                <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-gold">
                  <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 gradient-text-gold">Block-Planung</h3>
                <p className="text-sm sm:text-base text-[#f7f2eb] leading-relaxed">
                  Plant jeden Event-Block eures Hochzeitstags mit Sub-Timelines, Checklisten und Budget.
                </p>
              </div>

              <div className="mobile-swiper-item glassmorphism-dark rounded-2xl p-6 sm:p-8 card-hover hover-lift" style={{ minHeight: '280px' }}>
                <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-gold">
                  <LayoutGrid className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 gradient-text-gold">Alles vernetzt</h3>
                <p className="text-sm sm:text-base text-[#f7f2eb] leading-relaxed">
                  Verknüpft Gäste, Dienstleister, Locations und Kosten direkt mit euren Events.
                </p>
              </div>
            </div>

            {/* Swiper Indicator Dots - Only on mobile */}
            <div className="swiper-pagination md:hidden">
              <div className="swiper-dot active"></div>
              <div className="swiper-dot"></div>
              <div className="swiper-dot"></div>
              <div className="swiper-dot"></div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a253c]/60 via-[#0a253c]/20 to-[#f7f2eb] z-10"></div>
          <img
            src="/u8897456249_httpss.mj.runYRcXMjrT75I_httpss.mj.runlU60IeIG40k_7a5311e0-f1b2-48ea-8d12-af642ba22d00_2.png"
            alt="Hero couple"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-top"
            style={{ contentVisibility: 'auto' }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 md:py-32 relative z-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 drop-shadow-lg px-4" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
              Warum unsere Plattform?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white leading-relaxed mb-8 sm:mb-12 drop-shadow-lg px-4" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              Wir verstehen, dass eure Hochzeit einzigartig ist. Deshalb haben wir eine Plattform geschaffen, die sich euren Träumen anpasst – verspielt, intuitiv und voller Magie.
            </p>

            {/* Mobile: Horizontal Swiper, Desktop: Grid - 6 Module highlights */}
            <div className="mobile-swiper sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 md:gap-8 sm:px-4">
              <div className="mobile-swiper-item glassmorphism rounded-2xl p-6 sm:p-8 shadow-gold-lg card-hover hover-lift border-gradient" style={{ minHeight: '220px' }}>
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">✨</div>
                <h3 className="text-xl sm:text-2xl font-bold gradient-text-gold mb-2 sm:mb-3">Heldenreise-System</h3>
                <p className="text-sm sm:text-base text-[#333333] leading-relaxed">
                  10 durchdachte Schritte führen euch von der Vision bis zum perfekten Hochzeitstag.
                </p>
              </div>

              <div className="mobile-swiper-item glassmorphism rounded-2xl p-6 sm:p-8 shadow-gold-lg card-hover hover-lift border-gradient" style={{ minHeight: '220px' }}>
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📊</div>
                <h3 className="text-xl sm:text-2xl font-bold gradient-text-gold mb-2 sm:mb-3">Dashboard für den Überblick</h3>
                <p className="text-sm sm:text-base text-[#333333] leading-relaxed">
                  Übersicht, Aufgaben, Budget, Gäste und Timeline - alles auf einen Blick.
                </p>
              </div>

              <div className="mobile-swiper-item glassmorphism rounded-2xl p-6 sm:p-8 shadow-gold-lg card-hover hover-lift border-gradient" style={{ minHeight: '220px' }}>
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">👥</div>
                <h3 className="text-xl sm:text-2xl font-bold gradient-text-gold mb-2 sm:mb-3">Gäste-Management</h3>
                <p className="text-sm sm:text-base text-[#333333] leading-relaxed">
                  Verwaltet Gäste, Familien, Gruppen, RSVP, Ernährung und Kontakte - alles übersichtlich strukturiert.
                </p>
              </div>

              <div className="mobile-swiper-item glassmorphism rounded-2xl p-6 sm:p-8 shadow-gold-lg card-hover hover-lift border-gradient" style={{ minHeight: '220px' }}>
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">💼</div>
                <h3 className="text-xl sm:text-2xl font-bold gradient-text-gold mb-2 sm:mb-3">Dienstleister & Locations</h3>
                <p className="text-sm sm:text-base text-[#333333] leading-relaxed">
                  Verwaltet eure Helden und Locations mit Pool-System, Kategorien und Verträgen.
                </p>
              </div>

              <div className="mobile-swiper-item glassmorphism rounded-2xl p-6 sm:p-8 shadow-gold-lg card-hover hover-lift border-gradient" style={{ minHeight: '220px' }}>
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">⏰</div>
                <h3 className="text-xl sm:text-2xl font-bold gradient-text-gold mb-2 sm:mb-3">Block-Planung</h3>
                <p className="text-sm sm:text-base text-[#333333] leading-relaxed">
                  Jeder Event-Block hat eigene Sub-Timelines, Checklisten, Gäste und Budget-Tracking.
                </p>
              </div>

              <div className="mobile-swiper-item glassmorphism rounded-2xl p-6 sm:p-8 shadow-gold-lg card-hover hover-lift border-gradient" style={{ minHeight: '220px' }}>
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📱</div>
                <h3 className="text-xl sm:text-2xl font-bold gradient-text-gold mb-2 sm:mb-3">Überall dabei</h3>
                <p className="text-sm sm:text-base text-[#333333] leading-relaxed">
                  Vollständig responsive Design - plant von Desktop, Tablet oder Smartphone.
                </p>
              </div>
            </div>

            {/* Swiper Indicator Dots - Only on mobile */}
            <div className="swiper-pagination sm:hidden lg:hidden">
              <div className="swiper-dot active"></div>
              <div className="swiper-dot"></div>
              <div className="swiper-dot"></div>
              <div className="swiper-dot"></div>
              <div className="swiper-dot"></div>
              <div className="swiper-dot"></div>
            </div>

            <div className="mt-12 sm:mt-16 px-4">
              <button
                onClick={() => openModal('login')}
                className="button-modern bg-[#0a253c] hover:bg-[#1a3a5c] text-[#d4af37] px-8 sm:px-10 md:px-12 py-4 sm:py-5 rounded-full text-base sm:text-lg md:text-xl font-bold shadow-gold-lg hover:shadow-gold touch-manipulation"
              >
                Eure Reise beginnt jetzt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Interactive Demo Elements */}
      <div className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#0a253c] mb-4">
              Probiert es <span className="text-gradient-gold">selbst aus</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Spielt mit unseren interaktiven Tools und erlebt, wie einfach Hochzeitsplanung sein kann
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Budget Slider Demo */}
            <div className="bg-gradient-to-br from-[#f7f2eb] to-white rounded-3xl p-8 shadow-xl border-2 border-[#d4af37]/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#d4af37] p-3 rounded-xl">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#0a253c]">Budget-Rechner</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Seht sofort, was mit eurem Budget möglich ist
              </p>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-700 font-semibold">Euer Budget:</span>
                    <span className="text-3xl font-bold text-[#d4af37]">
                      {budget.toLocaleString('de-DE')} €
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="50000"
                    step="1000"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-gold"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>2.000 €</span>
                    <span>50.000 €</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border-2 border-[#d4af37]/30">
                  <div className="text-5xl mb-3 text-center">
                    {getBudgetRecommendation(budget).icon}
                  </div>
                  <p className="text-center text-lg font-semibold text-[#0a253c]">
                    {getBudgetRecommendation(budget).text}
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                      <span>Location & Catering</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                      <span>Fotografie & Video</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                      <span>Dekoration & Blumen</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Checklist Demo */}
            <div className="bg-gradient-to-br from-[#f7f2eb] to-white rounded-3xl p-8 shadow-xl border-2 border-[#d4af37]/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#d4af37] p-3 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#0a253c]">Task-Manager</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Hakt Aufgaben ab und fühlt den Fortschritt
              </p>

              <div className="space-y-3">
                {demoTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleDemoTask(task.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      task.completed
                        ? 'bg-[#d4af37]/10 border-[#d4af37] shadow-md'
                        : 'bg-white border-gray-200 hover:border-[#d4af37]/50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        task.completed
                          ? 'bg-[#d4af37] border-[#d4af37]'
                          : 'border-gray-300'
                      }`}
                    >
                      {task.completed && (
                        <CheckCircle className="w-4 h-4 text-white fill-current" />
                      )}
                    </div>
                    <span
                      className={`flex-1 font-medium transition-all ${
                        task.completed
                          ? 'line-through text-gray-400'
                          : 'text-[#0a253c]'
                      }`}
                    >
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-white rounded-2xl p-4 border-2 border-[#d4af37]/30">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-semibold">Fortschritt:</span>
                  <span className="text-2xl font-bold text-[#d4af37]">
                    {Math.round((demoTasks.filter(t => t.completed).length / demoTasks.length) * 100)}%
                  </span>
                </div>
                <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] transition-all duration-500"
                    style={{
                      width: `${(demoTasks.filter(t => t.completed).length / demoTasks.length) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Interactive Timeline Demo */}
            <div className="bg-gradient-to-br from-[#f7f2eb] to-white rounded-3xl p-8 shadow-xl border-2 border-[#d4af37]/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#d4af37] p-3 rounded-xl">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#0a253c]">Timeline-Planer</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Plant euren Tagesablauf minutengenau
              </p>

              <div className="space-y-2">
                {demoTimelineEvents.map((event, index) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedTimelineEvent(index)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedTimelineEvent === index
                        ? 'border-[#d4af37] shadow-md'
                        : 'bg-white border-gray-200 hover:border-[#d4af37]/50'
                    }`}
                    style={{
                      backgroundColor: selectedTimelineEvent === index ? `${event.color}15` : 'white'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="px-3 py-1 rounded-lg text-white text-sm font-bold min-w-[60px] text-center"
                        style={{ backgroundColor: event.color }}
                      >
                        {event.time}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-[#0a253c]">{event.title}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {event.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.guests}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-white rounded-2xl p-4 border-2 border-[#d4af37]/30">
                <div className="text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-[#d4af37]">{demoTimelineEvents.length} Events</span> geplant
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Von 14:00 bis 20:30 Uhr
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => openModal('features')}
              className="bg-[#0a253c] hover:bg-[#1a3a5c] text-[#d4af37] px-10 py-4 rounded-full text-lg font-bold transition-all transform hover:scale-105 shadow-lg inline-flex items-center gap-2"
            >
              Mehr Funktionen entdecken
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* NEW SECTION: Hero Journey Feature - 10 Steps */}
      <div className="py-24 bg-gradient-to-b from-white to-[#f7f2eb]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#d4af37]/10 border-2 border-[#d4af37]/30 px-4 py-2 rounded-full text-sm font-bold mb-4 text-[#0a253c]">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              Kern-Feature
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0a253c] mb-4">
              Die <span className="text-gradient-gold">Heldenreise</span> – Euer Weg zur perfekten Hochzeit
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              10 durchdachte Schritte führen euch von der ersten Vision bis zum perfekten Hochzeitstag. Schritt für Schritt, ohne Stress.
            </p>
          </div>

          <div className="max-w-6xl mx-auto mb-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#d4af37]/20 hover:border-[#d4af37] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-400">Schritt 1</span>
                </div>
                <h3 className="font-bold text-[#0a253c] mb-1">Eure Vision</h3>
                <p className="text-xs text-gray-600">Definiert das Gefühl eurer Traumhochzeit</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#d4af37]/20 hover:border-[#d4af37] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-400">Schritt 2</span>
                </div>
                <h3 className="font-bold text-[#0a253c] mb-1">Budget</h3>
                <p className="text-xs text-gray-600">Legt eure Obergrenze fest</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#d4af37]/20 hover:border-[#d4af37] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-400">Schritt 3</span>
                </div>
                <h3 className="font-bold text-[#0a253c] mb-1">Gästezahl</h3>
                <p className="text-xs text-gray-600">Wie viele Personen sollen dabei sein?</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#d4af37]/20 hover:border-[#d4af37] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-400">Schritt 4</span>
                </div>
                <h3 className="font-bold text-[#0a253c] mb-1">Location</h3>
                <p className="text-xs text-gray-600">Wo soll gefeiert werden?</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#d4af37]/20 hover:border-[#d4af37] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-400">Schritt 5</span>
                </div>
                <h3 className="font-bold text-[#0a253c] mb-1">Zeremonie</h3>
                <p className="text-xs text-gray-600">Standesamt, Kirche oder freie Trauung?</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#d4af37]/20 hover:border-[#d4af37] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-400">Schritt 6</span>
                </div>
                <h3 className="font-bold text-[#0a253c] mb-1">Datum</h3>
                <p className="text-xs text-gray-600">Wann soll der große Tag sein?</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#d4af37]/20 hover:border-[#d4af37] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-400">Schritt 7</span>
                </div>
                <h3 className="font-bold text-[#0a253c] mb-1">Persönlichkeit</h3>
                <p className="text-xs text-gray-600">Stil, Farben und Deko-Thema</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#d4af37]/20 hover:border-[#d4af37] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-400">Schritt 8</span>
                </div>
                <h3 className="font-bold text-[#0a253c] mb-1">Timeline</h3>
                <p className="text-xs text-gray-600">Grobe Zeitplanung für den Tag</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#d4af37]/20 hover:border-[#d4af37] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-400">Schritt 9</span>
                </div>
                <h3 className="font-bold text-[#0a253c] mb-1">Persönliches</h3>
                <p className="text-xs text-gray-600">Outfits, Ringe und besondere Wünsche</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#d4af37]/20 hover:border-[#d4af37] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-400">Schritt 10</span>
                </div>
                <h3 className="font-bold text-[#0a253c] mb-1">Gäste-Planung</h3>
                <p className="text-xs text-gray-600">Einladungen und Gästeliste</p>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-3xl p-8 shadow-xl border-2 border-[#d4af37]/20 mb-12">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-[#0a253c] mb-4">
                  <Trophy className="w-8 h-8 inline-block text-[#d4af37] mr-2" />
                  Progress-Tracking inklusive
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Seht jederzeit, wie weit ihr auf eurer Heldenreise gekommen seid. Jeder abgeschlossene Schritt wird mit einem Achievement belohnt und motiviert euch weiterzumachen.
                </p>
                <div className="bg-white rounded-xl p-4 border-2 border-[#d4af37]/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Beispiel-Fortschritt</span>
                    <span className="text-sm font-bold text-[#d4af37]">6/10 Schritte</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] rounded-full transition-all duration-500" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Du bist auf einem super Weg! 💫</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => openModal('login')}
              className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#f4d03f] hover:to-[#d4af37] text-[#0a253c] px-12 py-5 rounded-full text-xl font-bold transition-all transform hover:scale-105 shadow-lg inline-flex items-center gap-2"
            >
              14 Tage kostenlos starten
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Funktioniert für jede Hochzeit */}
      <div className="py-24 bg-gradient-to-b from-[#f7f2eb] to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#0a253c] mb-4">
              Funktioniert für <span className="text-gradient-gold">jede Hochzeit</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Egal ob spontan oder geplant, klein oder groß – unser System passt sich euren Träumen an
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 card-hover border-2 border-transparent hover:border-[#d4af37]/30">
              <div className="text-6xl mb-4 text-center">💍</div>
              <h3 className="text-xl font-bold text-[#0a253c] mb-3 text-center">Standesamt nächsten Monat</h3>
              <p className="text-gray-600 text-center leading-relaxed mb-4">
                Spontane Entscheidung? Kein Problem! Fokus auf das Wesentliche.
              </p>
              <div className="flex items-center justify-center text-sm text-[#d4af37] font-semibold">
                <TrendingUp className="w-4 h-4 mr-1" />
                Express-Planung
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 card-hover border-2 border-transparent hover:border-[#d4af37]/30">
              <div className="text-6xl mb-4 text-center">🌸</div>
              <h3 className="text-xl font-bold text-[#0a253c] mb-3 text-center">Intimes Fest im Garten</h3>
              <p className="text-gray-600 text-center leading-relaxed mb-4">
                Kleine, persönliche Feier mit euren Liebsten. DIY-Charme inklusive.
              </p>
              <div className="flex items-center justify-center text-sm text-[#d4af37] font-semibold">
                <Heart className="w-4 h-4 mr-1" />
                20-50 Gäste
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 card-hover border-2 border-transparent hover:border-[#d4af37]/30">
              <div className="text-6xl mb-4 text-center">✨</div>
              <h3 className="text-xl font-bold text-[#0a253c] mb-3 text-center">Große Feier in 18 Monaten</h3>
              <p className="text-gray-600 text-center leading-relaxed mb-4">
                Zeit für jedes Detail. Entspannt planen und genießen.
              </p>
              <div className="flex items-center justify-center text-sm text-[#d4af37] font-semibold">
                <Calendar className="w-4 h-4 mr-1" />
                Volle Flexibilität
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 card-hover border-2 border-transparent hover:border-[#d4af37]/30">
              <div className="text-6xl mb-4 text-center">🌴</div>
              <h3 className="text-xl font-bold text-[#0a253c] mb-3 text-center">Destination Wedding</h3>
              <p className="text-gray-600 text-center leading-relaxed mb-4">
                Traumhochzeit am Strand oder in den Bergen. Abenteuer pur!
              </p>
              <div className="flex items-center justify-center text-sm text-[#d4af37] font-semibold">
                <Star className="w-4 h-4 mr-1" />
                Weltweit
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={onGetStarted}
              className="bg-[#d4af37] hover:bg-[#c19a2e] text-[#0a253c] px-10 py-4 rounded-full text-lg font-bold transition-all transform hover:scale-105 shadow-lg inline-flex items-center gap-2"
            >
              Starte deine individuelle Planung
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: Timeline & Block-Planung Feature */}
      <div className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#d4af37]/10 border-2 border-[#d4af37]/30 px-4 py-2 rounded-full text-sm font-bold mb-4 text-[#0a253c]">
              <Clock className="w-4 h-4 text-[#d4af37]" />
              Kernfunktion
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0a253c] mb-4">
              Euer Tagesablauf – <span className="text-gradient-gold">Perfekt durchdacht</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Mit unserer Timeline-Funktion plant ihr euren Hochzeitstag minutengenau. Jedes Event wird zu einem planbaren Block mit allen Details.
            </p>
          </div>

          {/* Feature Benefits - Moved above the panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto mb-12 px-4">
            <div className="text-center">
              <div className="bg-[#d4af37] w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg hover-scale">
                <Timer className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#0a253c] mb-2 sm:mb-3">Pufferzeiten</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
                Plant Puffer zwischen Events ein, damit ihr entspannt von einem Moment zum nächsten gleiten könnt.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[#d4af37] w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg hover-scale">
                <LayoutGrid className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#0a253c] mb-2 sm:mb-3">Sub-Timelines</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
                Erstellt innerhalb jedes Blocks eigene Mini-Timelines für noch detailliertere Planung.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[#d4af37] w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg hover-scale">
                <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#0a253c] mb-2 sm:mb-3">Alles verknüpft</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
                Verbindet Aufgaben, Dienstleister und Budget-Positionen direkt mit eurem Tagesablauf.
              </p>
            </div>
          </div>

          {/* Visual Timeline Flow Panel */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="bg-gradient-to-br from-[#f7f2eb] to-white rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl border-2 border-[#d4af37]/20">
              <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#0a253c] mb-3 sm:mb-4">
                    Von Chaos zu Klarheit
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4 sm:mb-6">
                    Organisiert euren Hochzeitstag in übersichtliche Blöcke. Jedes Event – ob Trauung, Empfang oder Dinner – bekommt seine eigene Detailplanung.
                  </p>
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="bg-[#d4af37] p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-sm sm:text-base text-[#0a253c]">Minutengenaue Planung</div>
                        <div className="text-xs sm:text-sm text-gray-600">Start, Ende und Pufferzeiten für jedes Event</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="bg-[#d4af37] p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                        <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-sm sm:text-base text-[#0a253c]">Block-Planung</div>
                        <div className="text-xs sm:text-sm text-gray-600">Checklisten, Aufgaben und Notizen pro Event</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="bg-[#d4af37] p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-sm sm:text-base text-[#0a253c]">Gäste & Dienstleister</div>
                        <div className="text-xs sm:text-sm text-gray-600">Zuordnung von Teilnehmern und Vendors pro Block</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="bg-[#d4af37] p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                        <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-sm sm:text-base text-[#0a253c]">Budget-Tracking</div>
                        <div className="text-xs sm:text-sm text-gray-600">Kosten pro Event im Blick behalten</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl border-2 border-[#d4af37]/30">
                  <div className="text-xs sm:text-sm font-bold text-[#d4af37] mb-3 sm:mb-4 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Beispiel-Tagesablauf
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-[#d4af37]/5 rounded-lg border-l-4 border-[#d4af37]">
                      <div className="text-base sm:text-lg font-bold text-[#d4af37] min-w-[45px] sm:min-w-[50px]">13:00</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm sm:text-base text-[#0a253c]">Getting Ready</div>
                        <div className="text-[10px] sm:text-xs text-gray-500">120 Min • 8 Personen</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-[#d4af37]/5 rounded-lg border-l-4 border-[#d4af37]">
                      <div className="text-base sm:text-lg font-bold text-[#d4af37] min-w-[45px] sm:min-w-[50px]">15:00</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm sm:text-base text-[#0a253c]">Trauung</div>
                        <div className="text-[10px] sm:text-xs text-gray-500">45 Min • 80 Personen</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-100 rounded-lg border-l-4 border-gray-400">
                      <div className="text-base sm:text-lg font-bold text-gray-500 min-w-[45px] sm:min-w-[50px]">16:00</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm sm:text-base text-gray-600">Puffer</div>
                        <div className="text-[10px] sm:text-xs text-gray-500">30 Min</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-[#d4af37]/5 rounded-lg border-l-4 border-[#d4af37]">
                      <div className="text-base sm:text-lg font-bold text-[#d4af37] min-w-[45px] sm:min-w-[50px]">16:30</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm sm:text-base text-[#0a253c]">Sektempfang</div>
                        <div className="text-[10px] sm:text-xs text-gray-500">90 Min • 80 Personen</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-[#d4af37]/5 rounded-lg border-l-4 border-[#d4af37]">
                      <div className="text-base sm:text-lg font-bold text-[#d4af37] min-w-[45px] sm:min-w-[50px]">18:30</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm sm:text-base text-[#0a253c]">Abendessen</div>
                        <div className="text-[10px] sm:text-xs text-gray-500">120 Min • 80 Personen</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={onGetStarted}
              className="bg-[#d4af37] hover:bg-[#f4d03f] text-[#0a253c] px-8 sm:px-12 py-4 sm:py-5 rounded-full text-lg sm:text-xl font-bold transition-all transform hover:scale-105 shadow-lg inline-flex items-center gap-2 touch-manipulation"
            >
              Timeline jetzt erstellen
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Section 5: Passt sich euch an */}
      <div className="py-24 bg-gradient-to-b from-white to-[#f7f2eb]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#0a253c] mb-4">
              Passt sich <span className="text-gradient-gold">euch an</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Keine starren Vorgaben. Euer System wächst mit euren Bedürfnissen.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                <Sliders className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#0a253c] mb-3">Flexible Prioritäten</h3>
              <p className="text-gray-600 leading-relaxed">
                Ihr entscheidet, was wichtig ist. Keine erzwungenen Schritte.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                <RefreshCw className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#0a253c] mb-3">Wächst mit euch</h3>
              <p className="text-gray-600 leading-relaxed">
                Pläne ändern sich? Perfekt. Das System passt sich an.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#0a253c] mb-3">Kein Druck</h3>
              <p className="text-gray-600 leading-relaxed">
                Keine festen Deadlines. Plant in eurem Tempo.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                <Star className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#0a253c] mb-3">Eure Kategorien</h3>
              <p className="text-gray-600 leading-relaxed">
                Erstellt eigene Aufgabenbereiche. Ganz nach eurem Stil.
              </p>
            </div>
          </div>

          <div className="mt-16 max-w-4xl mx-auto bg-white rounded-3xl p-10 shadow-2xl border-2 border-[#d4af37]/20">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-to-br from-[#0a253c] to-[#1a3a5c] rounded-full flex items-center justify-center">
                  <Heart className="w-12 h-12 text-[#d4af37] fill-current" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-[#0a253c] mb-3">
                  Eure Hochzeit, eure Regeln
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Wir glauben daran, dass jede Liebe einzigartig ist. Deshalb gibt es bei uns keine Schablonen – nur pure Freiheit, eure Traumhochzeit genau so zu planen, wie ihr es wollt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 6: Comparison - Excel vs App / With vs Without */}
      <div className="py-24 bg-gradient-to-b from-[#f7f2eb] to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#0a253c] mb-4">
              Der <span className="text-gradient-gold">Unterschied</span> ist spürbar
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Warum unsere Plattform eure Planung revolutioniert
            </p>
          </div>

          {/* Excel vs App Comparison */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Excel/Traditional */}
              <div className="bg-gray-100 rounded-3xl p-8 border-2 border-gray-300 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-gray-400 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Alt
                </div>
                <div className="text-6xl mb-4 text-center opacity-60">📊</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-6 text-center">Excel & Notizzettel</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-gray-600">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>Unübersichtliche Tabellen</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-600">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>Keine Echtzeit-Updates</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-600">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>Chaos bei Änderungen</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-600">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>Stundenlange Formatierung</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-600">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>Keine Timeline-Visualisierung</span>
                  </div>
                </div>
              </div>

              {/* Our App */}
              <div className="bg-gradient-to-br from-[#d4af37]/10 to-[#f4d03f]/10 rounded-3xl p-8 border-2 border-[#d4af37] relative overflow-hidden shadow-xl">
                <div className="absolute top-4 right-4 bg-[#d4af37] text-[#0a253c] px-4 py-1 rounded-full text-sm font-semibold">
                  Neu ✨
                </div>
                <div className="text-6xl mb-4 text-center">🚀</div>
                <h3 className="text-2xl font-bold text-[#0a253c] mb-6 text-center">Unsere Plattform</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-[#0a253c]">
                    <CheckCircle className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
                    <span className="font-medium">Geführte Planung: Schritt für Schritt zum großen Tag</span>
                  </div>
                  <div className="flex items-start gap-3 text-[#0a253c]">
                    <CheckCircle className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
                    <span className="font-medium">Alles an einem Ort: Gäste, Budget, Aufgaben</span>
                  </div>
                  <div className="flex items-start gap-3 text-[#0a253c]">
                    <CheckCircle className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
                    <span className="font-medium">Euren Hochzeitstag minutengenau durchplanen</span>
                  </div>
                  <div className="flex items-start gap-3 text-[#0a253c]">
                    <CheckCircle className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
                    <span className="font-medium">Dienstleister & Locations im Überblick</span>
                  </div>
                  <div className="flex items-start gap-3 text-[#0a253c]">
                    <CheckCircle className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
                    <span className="font-medium">Alles vernetzt: Änderungen überall sichtbar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* With vs Without Stress Level */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-[#0a253c] mb-8 text-center">
              Stress-Level im Vergleich
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Without */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
                <h4 className="text-xl font-bold text-gray-700 mb-4 text-center">
                  Ohne Heldenreise 😰
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-600">Stress</span>
                      <span className="font-bold text-red-500">85%</span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-600">Vorfreude</span>
                      <span className="font-bold text-gray-400">30%</span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-400 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-600">Zeitersparnis</span>
                      <span className="font-bold text-gray-400">0h</span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-400 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* With */}
              <div className="bg-gradient-to-br from-[#d4af37]/10 to-[#f4d03f]/10 rounded-2xl p-8 shadow-xl border-2 border-[#d4af37]">
                <h4 className="text-xl font-bold text-[#0a253c] mb-4 text-center">
                  Mit Heldenreise 🎉
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-700">Stress</span>
                      <span className="font-bold text-[#d4af37]">15%</span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-700">Vorfreude</span>
                      <span className="font-bold text-[#d4af37]">95%</span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] rounded-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-700">Zeitersparnis</span>
                      <span className="font-bold text-[#d4af37]">47h</span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 12: Your Way Visual Story */}
      <div className="py-24 bg-[#0a253c] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-[#d4af37] rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#f4d03f] rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Startet <span className="text-[#d4af37]">genau dort</span>, wo es sich richtig anfühlt
            </h2>
            <p className="text-xl text-[#f7f2eb] max-w-2xl mx-auto">
              Es gibt keinen "richtigen" ersten Schritt. Jede Reise ist anders.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 card-hover border-2 border-[#d4af37]/30 cursor-pointer">
                <div className="text-5xl mb-4 text-center">💰</div>
                <h3 className="text-2xl font-bold text-[#d4af37] mb-3 text-center">Budget zuerst</h3>
                <p className="text-[#f7f2eb] leading-relaxed text-center mb-4">
                  Klärt euer Budget und lasst alles andere drum herum wachsen.
                </p>
                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-[#d4af37] animate-pulse" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 card-hover border-2 border-[#d4af37]/30 cursor-pointer">
                <div className="text-5xl mb-4 text-center">👥</div>
                <h3 className="text-2xl font-bold text-[#d4af37] mb-3 text-center">Gästeliste zuerst</h3>
                <p className="text-[#f7f2eb] leading-relaxed text-center mb-4">
                  Wer soll dabei sein? Beginnt mit den Menschen, die zählen.
                </p>
                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-[#d4af37] animate-pulse" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 card-hover border-2 border-[#d4af37]/30 cursor-pointer">
                <div className="text-5xl mb-4 text-center">📍</div>
                <h3 className="text-2xl font-bold text-[#d4af37] mb-3 text-center">Location zuerst</h3>
                <p className="text-[#f7f2eb] leading-relaxed text-center mb-4">
                  Der perfekte Ort ist gefunden? Super! Plant von dort aus weiter.
                </p>
                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-[#d4af37] animate-pulse" />
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-[#f4d03f]/40">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🤔</div>
                <h3 className="text-2xl font-bold text-white mb-3">Keine Ahnung wo anfangen?</h3>
                <p className="text-[#f7f2eb] leading-relaxed mb-6 max-w-xl mx-auto">
                  Perfekt! Wir führen euch durch einen kurzen Onboarding-Prozess und helfen euch, den besten Startpunkt für eure persönliche Planung zu finden.
                </p>
                <button
                  onClick={() => openModal('login')}
                  className="bg-[#d4af37] hover:bg-[#f4d03f] text-[#0a253c] px-10 py-4 rounded-full text-lg font-bold transition-all transform hover:scale-105 shadow-lg inline-flex items-center gap-2"
                >
                  Jetzt starten
                  <Sparkles className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-[#f7f2eb]/80 text-sm max-w-2xl mx-auto italic">
              "Die beste Hochzeitsplanung ist die, die zu euch passt – nicht zu einem Lehrbuch."
            </p>
          </div>
        </div>
      </div>

      {/* Section: How It Works */}
      <div className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#0a253c] mb-4">
              So <span className="text-gradient-gold">einfach</span> geht's
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              In nur 3 Schritten zu eurer perfekt organisierten Hochzeitsplanung
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              {/* Step 1 */}
              <div className="text-center relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#d4af37] text-[#0a253c] w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                  1
                </div>
                <div className="bg-gradient-to-br from-[#f7f2eb] to-white rounded-2xl p-8 pt-12 shadow-xl border-2 border-[#d4af37]/20 h-full card-hover">
                  <div className="bg-[#d4af37] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#0a253c] mb-4">Kostenlos registrieren</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Erstellt euren Account in unter einer Minute. Keine Kreditkarte erforderlich, keine versteckten Kosten.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="text-center relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#d4af37] text-[#0a253c] w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                  2
                </div>
                <div className="bg-gradient-to-br from-[#f7f2eb] to-white rounded-2xl p-8 pt-12 shadow-xl border-2 border-[#d4af37]/20 h-full card-hover">
                  <div className="bg-[#d4af37] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#0a253c] mb-4">Hochzeit anlegen</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Beantwortet ein paar einfache Fragen und wir erstellen eure personalisierte Planungsumgebung.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="text-center relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#d4af37] text-[#0a253c] w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                  3
                </div>
                <div className="bg-gradient-to-br from-[#f7f2eb] to-white rounded-2xl p-8 pt-12 shadow-xl border-2 border-[#d4af37]/20 h-full card-hover">
                  <div className="bg-[#d4af37] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#0a253c] mb-4">Loslegen & Feiern</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Plant entspannt, nutzt alle Features und genießt den Weg zu eurem großen Tag.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <button
                onClick={() => openModal('login')}
                className="bg-[#d4af37] hover:bg-[#f4d03f] text-[#0a253c] px-12 py-5 rounded-full text-xl font-bold transition-all transform hover:scale-105 shadow-lg inline-flex items-center gap-2"
              >
                Jetzt kostenlos starten
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Pricing */}
      <div id="pricing" className="py-24 bg-gradient-to-b from-[#f7f2eb] to-white">
        <div className="container mx-auto px-6">

          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#0a253c] mb-4">
              Transparent & <span className="text-gradient-gold">Fair</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              14 Tage kostenlos testen, dann entscheidet ihr
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Single Premium Plan with 14-Day Trial */}
            <div className="bg-gradient-to-br from-[#0a253c] to-[#1a3a5c] rounded-3xl p-12 shadow-2xl border-2 border-[#d4af37] relative overflow-hidden">
              <div className="absolute top-6 right-6 bg-[#d4af37] text-[#0a253c] px-6 py-2 rounded-full text-base font-bold">
                Beliebteste Wahl
              </div>

              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Crown className="w-8 h-8 text-[#d4af37]" />
                  <h3 className="text-4xl font-bold text-white">Heldenreise Premium</h3>
                </div>
                <div className="text-6xl font-bold text-[#d4af37] mb-3">29,99€</div>
                <p className="text-xl text-[#f7f2eb] mb-2">pro Monat - Monatlich kündbar</p>
                <div className="inline-block bg-[#d4af37]/20 border border-[#d4af37] rounded-full px-6 py-2 mt-4">
                  <p className="text-[#d4af37] font-bold text-lg">✨ 14 Tage kostenlos testen</p>
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-0.5" />
                  <span className="text-white font-semibold">Unbegrenzte Gäste</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-0.5" />
                  <span className="text-[#f7f2eb]">Unbegrenzte Budget-Einträge</span>
                </li>
                <li className="flex items-start gap-3 bg-[#d4af37]/10 -mx-2 px-2 py-3 rounded-lg">
                  <Clock className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-bold block">Unbegrenzte Timeline-Events & Puffer</span>
                    <span className="text-sm text-[#f7f2eb]/80">Detaillierte Tagesablauf-Planung ohne Limits</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 bg-[#d4af37]/10 -mx-2 px-2 py-3 rounded-lg">
                  <LayoutGrid className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-bold block">Block-Planung für Timeline</span>
                    <span className="text-sm text-[#f7f2eb]/80">Checklisten, Aufgaben & Notizen pro Event</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-0.5" />
                  <span className="text-[#f7f2eb]">Unbegrenzte Dienstleister & Locations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-0.5" />
                  <span className="text-[#f7f2eb]">Erweiterte Budget-Analysen & Charts</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-0.5" />
                  <span className="text-[#f7f2eb]">Automatische Budget-Synchronisation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-0.5" />
                  <span className="text-[#f7f2eb]">PDF & CSV Export</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-0.5" />
                  <span className="text-[#f7f2eb]">Kein Wasserzeichen</span>
                </li>
              </ul>

              <button
                onClick={() => openModal('login')}
                className="w-full bg-[#d4af37] hover:bg-[#f4d03f] text-[#0a253c] py-5 rounded-full text-xl font-bold transition-all transform hover:scale-105 shadow-lg"
              >
                Jetzt Premium werden
              </button>

              <p className="text-sm text-center text-[#f7f2eb] mt-6 leading-relaxed">
                Monatlich kündbar, keine versteckten Kosten
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 text-sm max-w-2xl mx-auto">
              Sichere Zahlung über Stripe • DSGVO-konform • Made in Germany • Monatlich kündbar
            </p>
          </div>
        </div>
      </div>

      {/* Section: FAQ */}
      <div className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#0a253c] mb-4">
              Häufig gestellte <span className="text-gradient-gold">Fragen</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hier findet ihr Antworten auf die wichtigsten Fragen
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-[#f7f2eb] rounded-2xl overflow-hidden border-2 border-transparent hover:border-[#d4af37]/30 transition-all"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full text-left p-6 flex items-center justify-between gap-4"
                >
                  <span className="text-lg font-bold text-[#0a253c]">{faq.question}</span>
                  <div className={`transform transition-transform ${openFAQ === index ? 'rotate-180' : ''}`}>
                    <ArrowRight className="w-6 h-6 text-[#d4af37] rotate-90" />
                  </div>
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Noch Fragen?</p>
            <button
              onClick={() => window.location.href = 'mailto:sven@traumtaghelden.de'}
              className="inline-flex items-center gap-2 text-[#d4af37] hover:text-[#f4d03f] font-semibold transition-colors"
            >
              <Mail className="w-5 h-5" />
              Schreibt uns eine E-Mail
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0a253c] text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-8 h-8 text-[#d4af37] fill-current" />
                <span className="text-xl font-bold">Heldenreise</span>
              </div>
              <p className="text-[#f7f2eb]/80 text-sm leading-relaxed">
                Eure Hochzeit verdient mehr als Excel-Tabellen und Notizzettel. Plant mit Herz, Verstand und der besten Plattform.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-[#d4af37]">Produkt</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-[#f7f2eb]/80 hover:text-[#d4af37] transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-[#f7f2eb]/80 hover:text-[#d4af37] transition-colors">Preise</a></li>
                <li><a href="#how-it-works" className="text-[#f7f2eb]/80 hover:text-[#d4af37] transition-colors">So funktioniert's</a></li>
                <li><a href="#faq" className="text-[#f7f2eb]/80 hover:text-[#d4af37] transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-[#d4af37]">Rechtliches</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#impressum" className="text-[#f7f2eb]/80 hover:text-[#d4af37] transition-colors flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Impressum
                  </a>
                </li>
                <li>
                  <a href="#datenschutz" className="text-[#f7f2eb]/80 hover:text-[#d4af37] transition-colors flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Datenschutz
                  </a>
                </li>
                <li>
                  <a href="#agb" className="text-[#f7f2eb]/80 hover:text-[#d4af37] transition-colors">
                    AGB
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact & Social */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-[#d4af37]">Kontakt</h4>
              <ul className="space-y-2 text-sm mb-6">
                <li>
                  <a href="mailto:sven@traumtaghelden.de" className="text-[#f7f2eb]/80 hover:text-[#d4af37] transition-colors flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    sven@traumtaghelden.de
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[#f7f2eb]/60 text-sm">
                © 2024 Traumtaghelden. Made with ❤️ für euren großen Tag.
              </p>
              <button
                onClick={() => openModal('login')}
                className="text-[#d4af37] hover:text-[#f4d03f] font-semibold text-sm flex items-center gap-2 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
