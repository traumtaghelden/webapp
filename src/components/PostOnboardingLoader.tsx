import { useState, useEffect } from 'react';
import { Heart, Sparkles, Star, Map } from 'lucide-react';

interface PostOnboardingLoaderProps {
  weddingId: string;
  partner1Name: string;
  partner2Name: string;
  weddingDate: string;
  onComplete: () => void;
}

const loadingMessages = [
  "Eure Hochzeit wird gespeichert...",
  "Heldenplan wird erstellt...",
  "Eure Reise wird vorbereitet...",
  "Dashboard wird initialisiert...",
  "Meilensteine werden markiert...",
  "Bereit für den perfekten Tag!",
];

const inspiringQuotes = [
  "Die schönste Reise beginnt mit einem einzigen Schritt",
  "Eure Liebe ist der Beginn eines großen Abenteuers",
  "Jeder Tag bringt euch eurem Traumtag näher",
  "Gemeinsam ist alles möglich",
  "Die besten Dinge im Leben sind es wert, darauf hinzuarbeiten",
  "Eure Geschichte verdient die perfekte Feier",
];

export default function PostOnboardingLoader({
  weddingId,
  partner1Name,
  partner2Name,
  weddingDate,
  onComplete,
}: PostOnboardingLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    if (progress >= 40 && !showCalendar) {
      setShowCalendar(true);
      createParticles();
    }
    if (progress >= 100 && !showCelebration) {
      setShowCelebration(true);
      createMassiveParticles();
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
  }, [progress, showCalendar, showCelebration, onComplete]);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => clearInterval(messageInterval);
  }, []);

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % inspiringQuotes.length);
    }, 3500);

    return () => clearInterval(quoteInterval);
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

  const weddingDateObj = new Date(weddingDate);
  const formattedDate = weddingDateObj.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const getDaysUntilWedding = () => {
    const today = new Date();
    const wedding = new Date(weddingDate);
    const diffTime = wedding.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage:
            'url(https://res.cloudinary.com/dvaha0i6v/image/upload/v1761905970/Background_onboarding_1_jcn71r.png)',
        }}
      ></div>
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>

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

      <div className="relative z-10 text-center px-6 max-w-3xl w-full">
        <div className="mb-6 opacity-100">
          <div className="flex justify-center mb-6">
            <Heart className="w-20 h-20 text-[#d4af37] animate-pulse fill-current drop-shadow-2xl" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
            {partner1Name} & {partner2Name}
          </h1>
          <p className="text-xl text-[#f7f2eb]/90 drop-shadow-md">
            Eure Heldenreise beginnt
          </p>
        </div>

        {/* Inspiring Quote */}
        <div className="mb-6 min-h-[60px] flex items-center justify-center opacity-100">
          <div className="bg-[#d4af37]/10 backdrop-blur-md rounded-xl px-6 py-4 border border-[#d4af37]/30 max-w-lg">
            <Sparkles className="w-5 h-5 text-[#d4af37] mx-auto mb-2" />
            <p className="text-[#f7f2eb] text-base italic font-light leading-relaxed">
              &quot;{inspiringQuotes[currentQuoteIndex]}&quot;
            </p>
          </div>
        </div>

        {showCalendar && (
          <div className="mb-8 opacity-100">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-6 border-2 border-[#d4af37]/50">
              <p className="text-[#f7f2eb] text-sm font-semibold mb-2">Der große Tag</p>
              <p className="text-white text-2xl font-bold mb-4">{formattedDate}</p>
              <div className="pt-3 border-t border-[#d4af37]/30">
                <p className="text-[#f7f2eb] text-sm font-semibold mb-1">Noch</p>
                <p className="text-[#d4af37] text-3xl font-bold">{getDaysUntilWedding()}</p>
                <p className="text-[#f7f2eb] text-sm">Tage</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 opacity-100">
          {/* Progress Bar */}
          <div className="bg-white/20 backdrop-blur-md rounded-full h-5 overflow-hidden border-2 border-[#d4af37]/50 max-w-xl mx-auto shadow-lg">
            <div
              className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 shine-effect"></div>
            </div>
          </div>
          {/* Loading Message and Progress */}
          <div className="flex items-center justify-between mt-4 max-w-xl mx-auto px-2">
            <span className="text-white text-sm sm:text-base font-semibold drop-shadow-lg flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#d4af37] animate-pulse"></span>
              {loadingMessages[currentMessageIndex]}
            </span>
            <span className="text-[#d4af37] text-2xl font-bold drop-shadow-lg">{progress}%</span>
          </div>
        </div>

        {progress >= 50 && !showCelebration && (
          <div className="mb-8 opacity-100">
            <div className="bg-[#d4af37]/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-[#d4af37]/50 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Map className="w-6 h-6 text-[#d4af37]" />
                <h3 className="text-lg font-bold text-white">Heldenplan wird geladen</h3>
              </div>
              <p className="text-[#f7f2eb] text-sm">
                Dort erfasst ihr alle Details wie Budget, Gäste und euer Hochzeitsteam!
              </p>
            </div>
          </div>
        )}

        {showCelebration && (
          <div className="opacity-100">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Star className="w-10 h-10 text-[#d4af37] animate-spin-slow fill-current" />
              <h2 className="text-4xl font-bold text-white shine-effect">
                BEREIT!
              </h2>
              <Star className="w-10 h-10 text-[#d4af37] animate-spin-slow fill-current" />
            </div>
            <p className="text-xl text-[#f7f2eb] flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
              Los geht&apos;s mit der Planung!
            </p>
          </div>
        )}

        {progress >= 75 && !showCelebration && (
          <div className="flex justify-center gap-4 opacity-100">
            <div className="w-3 h-3 rounded-full bg-[#d4af37] animate-pulse"></div>
            <div className="w-3 h-3 rounded-full bg-[#d4af37] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 rounded-full bg-[#d4af37] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}
