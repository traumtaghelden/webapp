import { useState, useEffect } from 'react';
import { Heart, Sparkles, Star, Users, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';
import { supabase, type Wedding, type WeddingTeamRole, type Task, type BudgetItem, type Guest } from '../lib/supabase';

interface PostLoginLoaderProps {
  weddingId: string;
  userId: string;
  onComplete: () => void;
}

const loadingMessages = [
  "Willkommen zurück...",
  "Eure Daten werden geladen...",
  "Fortschritt wird berechnet...",
  "Aufgaben werden aktualisiert...",
  "Budget-Übersicht wird vorbereitet...",
  "Gästeliste wird geladen...",
  "Meilensteine werden überprüft...",
  "Timeline wird synchronisiert...",
  "Dashboard wird vorbereitet...",
  "Fast fertig...",
  "Bereit für eure Hochzeitsplanung!",
];

export default function PostLoginLoader({
  weddingId,
  userId,
  onComplete,
}: PostLoginLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showRing, setShowRing] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [teamMembers, setTeamMembers] = useState<WeddingTeamRole[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);

  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const ceremonyTypeText: Record<string, string> = {
    traditional: 'Traditionelle Hochzeit',
    civil: 'Standesamtliche Hochzeit',
    religious: 'Kirchliche Hochzeit',
    outdoor: 'Hochzeit im Freien',
    destination: 'Destination Wedding',
  };

  useEffect(() => {
    loadAllData();
  }, [weddingId]);

  const loadAllData = async () => {
    try {
      const [weddingData, teamData, tasksData, budgetData, guestsData] = await Promise.all([
        supabase.from('weddings').select('*').eq('id', weddingId).maybeSingle(),
        supabase.from('wedding_team_roles').select('*').eq('wedding_id', weddingId),
        supabase.from('tasks').select('*').eq('wedding_id', weddingId),
        supabase.from('budget_items').select('*').eq('wedding_id', weddingId),
        supabase.from('guests').select('*').eq('wedding_id', weddingId),
      ]);

      if (weddingData.data) setWedding(weddingData.data);
      if (teamData.data) setTeamMembers(teamData.data);
      if (tasksData.data) setTasks(tasksData.data);
      if (budgetData.data) setBudgetItems(budgetData.data);
      if (guestsData.data) setGuests(guestsData.data);
    } catch (error) {
      console.error('Error loading wedding data:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 60);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    if (progress >= 15 && !showRing) {
      setShowRing(true);
      createParticles();
    }
    if (progress >= 40 && !showStats) {
      setShowStats(true);
      createParticles();
    }
    if (progress >= 65 && !showTeam) {
      setShowTeam(true);
      createParticles();
    }
    if (progress >= 100 && !showCelebration) {
      setShowCelebration(true);
      createMassiveParticles();
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  }, [progress, showRing, showStats, showTeam, showCelebration, onComplete]);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, []);

  const createParticles = () => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 150 - 75,
      y: Math.random() * 150 - 75,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1500);
  };

  const createMassiveParticles = () => {
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 300 - 150,
      y: Math.random() * 300 - 150,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2500);
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

  const getBudgetPercentage = () => {
    if (!wedding || wedding.total_budget === 0) return 0;
    const spent = budgetItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
    return Math.round((spent / wedding.total_budget) * 100);
  };

  const getConfirmedGuestsCount = () => {
    return guests.filter((g) => g.rsvp_status === 'accepted').length;
  };

  const getHeroImage = (heroType: string) => {
    return heroType === 'hero1' ? '/Design ohne Titel (10).png' : '/Design ohne Titel (11).png';
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!wedding) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-[#0a253c] via-[#1a3a5c] to-[#0a253c]">
        <div className="text-center cinematic-fade-up">
          <Heart className="w-20 h-20 text-[#d4af37] animate-float mx-auto fill-current mb-4" />
          <p className="text-white text-xl">Laden...</p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(wedding.wedding_date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url(https://res.cloudinary.com/dvaha0i6v/image/upload/v1761905970/Background_onboarding_1_jcn71r.png)',
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>

      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: '50%',
            top: '50%',
            // @ts-ignore
            '--tx': `${particle.x}px`,
            '--ty': `${particle.y}px`,
          }}
        />
      ))}

      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center">
          <div className="celebrate-screen-flash"></div>
        </div>
      )}

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl w-full flex flex-col justify-center min-h-screen py-safe">
        <div className="mb-6 sm:mb-8 cinematic-fade-up">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 shine-effect px-2 leading-tight">
            Willkommen zurück
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#d4af37] mb-2 break-words px-2 leading-tight">
            {wedding.partner_1_name} & {wedding.partner_2_name}
          </h2>
          <p className="text-sm sm:text-base text-[#f7f2eb] mt-2 font-semibold px-2">
            {ceremonyTypeText[wedding.ceremony_type] || wedding.ceremony_type}
          </p>
        </div>

        <div className="relative mb-6 sm:mb-8 flex items-center justify-center gap-3 sm:gap-6 md:gap-12 min-h-[160px] sm:min-h-[200px]">
          <div className="cinematic-zoom-in" style={{ animationDelay: '0.2s' }}>
            <div className="hero-card-large selected p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#f7f2eb]/20 to-transparent backdrop-blur-sm">
              <img
                src={getHeroImage(wedding.partner_1_hero_type || 'hero1')}
                alt={wedding.partner_1_name}
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 object-contain animate-float"
              />
            </div>
            <p className="text-white font-bold text-xs sm:text-sm md:text-base mt-1.5 sm:mt-2 break-words">{wedding.partner_1_name}</p>
          </div>

          {showRing && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cinematic-zoom-in">
              <div className="relative">
                <Heart className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 text-[#d4af37] animate-float fill-current ring-glow" />
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#f4d03f] absolute -top-1 -right-1 animate-sparkle" />
              </div>
            </div>
          )}

          <div className="cinematic-zoom-in" style={{ animationDelay: '0.4s' }}>
            <div className="hero-card-large selected p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#f7f2eb]/20 to-transparent backdrop-blur-sm">
              <img
                src={getHeroImage(wedding.partner_2_hero_type || 'hero1')}
                alt={wedding.partner_2_name}
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 object-contain animate-float-delayed"
              />
            </div>
            <p className="text-white font-bold text-xs sm:text-sm md:text-base mt-1.5 sm:mt-2 break-words">{wedding.partner_2_name}</p>
          </div>
        </div>

        <div className="mb-5 sm:mb-6 cinematic-fade-up">
          <div className="inline-block bg-[#d4af37]/20 backdrop-blur-sm rounded-xl sm:rounded-2xl px-5 sm:px-6 py-3 sm:py-4 border-2 border-[#d4af37]/50">
            <p className="text-[#f7f2eb] text-xs sm:text-sm font-semibold mb-1">Der große Tag</p>
            <p className="text-white text-lg sm:text-xl md:text-2xl font-bold">{formattedDate}</p>
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[#d4af37]/30">
              <p className="text-[#f7f2eb] text-xs font-semibold mb-0.5 sm:mb-1">Noch</p>
              <p className="text-[#d4af37] text-base sm:text-lg md:text-xl font-bold">{getDaysUntilWedding()} Tage</p>
            </div>
          </div>
        </div>

        {showStats && (
          <div className="mb-5 sm:mb-6 cinematic-fade-up">
            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4af37]" />
              <h3 className="text-lg sm:text-xl font-bold text-white">Euer Fortschritt</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
              <div className="cinematic-zoom-in bg-gradient-to-b from-[#f7f2eb]/20 to-transparent backdrop-blur-sm p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-[#d4af37]/30">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-8 h-8 text-[#d4af37]" />
                </div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">{getCompletionPercentage()}%</p>
                <p className="text-[#f7f2eb] text-sm font-semibold">Aufgaben erledigt</p>
                <p className="text-[#d4af37] text-xs mt-1">
                  {tasks.filter(t => t.status === 'completed').length} / {tasks.length}
                </p>
              </div>

              <div className="cinematic-zoom-in bg-gradient-to-b from-[#f7f2eb]/20 to-transparent backdrop-blur-sm p-5 rounded-2xl border-2 border-[#d4af37]/30" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="w-8 h-8 text-[#d4af37]" />
                </div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">{getBudgetPercentage()}%</p>
                <p className="text-[#f7f2eb] text-sm font-semibold">Budget genutzt</p>
                <p className="text-[#d4af37] text-xs mt-1">
                  {budgetItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0).toLocaleString('de-DE')} € von {wedding.total_budget.toLocaleString('de-DE')} €
                </p>
              </div>

              <div className="cinematic-zoom-in bg-gradient-to-b from-[#f7f2eb]/20 to-transparent backdrop-blur-sm p-5 rounded-2xl border-2 border-[#d4af37]/30" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-8 h-8 text-[#d4af37]" />
                </div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">{getConfirmedGuestsCount()}</p>
                <p className="text-[#f7f2eb] text-sm font-semibold">Bestätigte Gäste</p>
                <p className="text-[#d4af37] text-xs mt-1">
                  von {wedding.guest_count} eingeladen
                </p>
              </div>
            </div>
          </div>
        )}

        {showTeam && teamMembers.length > 0 && (
          <div className="mb-8 cinematic-fade-up">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Users className="w-6 h-6 text-[#d4af37]" />
              <h3 className="text-xl md:text-2xl font-bold text-white">Euer Team</h3>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {teamMembers.slice(0, 6).map((member, idx) => (
                <div key={member.id} className="cinematic-zoom-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="bg-gradient-to-b from-[#f7f2eb]/20 to-transparent backdrop-blur-sm p-4 rounded-2xl border-2 border-[#d4af37]/30">
                    {member.avatar_url && (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-16 h-16 md:w-20 md:h-20 object-contain animate-float mx-auto"
                      />
                    )}
                    <p className="text-white font-semibold text-sm mt-2 text-center">{member.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto mb-4 sm:mb-5">
          <div className="bg-white/10 backdrop-blur-sm rounded-full h-6 overflow-hidden border-2 border-[#d4af37]/30">
            <div
              className={`bg-gradient-to-r from-[#d4af37] to-[#f4d03f] h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden ${
                progress >= 50 ? 'progress-milestone' : ''
              }`}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 shine-effect"></div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[#f7f2eb] text-sm font-semibold">
              {loadingMessages[currentMessageIndex]}
            </span>
            <span className="text-[#d4af37] text-lg font-bold">{progress}%</span>
          </div>
        </div>

        {showCelebration && (
          <div className="cinematic-zoom-in">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Star className="w-8 h-8 text-[#d4af37] animate-spin-slow fill-current" />
              <h2 className="text-3xl md:text-4xl font-bold text-white shine-effect">
                LOS GEHT'S!
              </h2>
              <Star className="w-8 h-8 text-[#d4af37] animate-spin-slow fill-current" />
            </div>
            <p className="text-xl text-[#f7f2eb]">Euer Dashboard wird geladen...</p>
          </div>
        )}

        {showSkip && !showCelebration && (
          <button
            onClick={handleSkip}
            className="cinematic-fade-up px-8 py-3 text-[#f7f2eb] hover:text-white transition-all duration-300 border-2 border-[#d4af37]/50 hover:border-[#d4af37] rounded-full backdrop-blur-sm"
          >
            Überspringen
          </button>
        )}

        {progress >= 75 && !showCelebration && (
          <div className="flex justify-center gap-4 cinematic-fade-up mt-4">
            <div className="w-3 h-3 rounded-full bg-[#d4af37] animate-pulse"></div>
            <div className="w-3 h-3 rounded-full bg-[#d4af37] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 rounded-full bg-[#d4af37] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}
