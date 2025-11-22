import { useState, useEffect } from 'react';
import { Heart, Sparkles } from 'lucide-react';

interface OnboardingIntroProps {
  onComplete: () => void;
}

export default function OnboardingIntro({ onComplete }: OnboardingIntroProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const phases = [0, 1];
    if (currentPhase < phases.length - 1) {
      const timer = setTimeout(() => {
        setCurrentPhase(currentPhase + 1);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      const finalTimer = setTimeout(() => {
        onComplete();
      }, 2500);
      return () => clearTimeout(finalTimer);
    }
  }, [currentPhase, onComplete]);

  const narrativeTexts = [
    {
      title: "Eure Hochzeit, einfach geplant",
      subtitle: "Gemeinsam auf der Heldenreise zur Traumhochzeit"
    },
    {
      title: "Lasst uns beginnen",
      subtitle: "In 3 schnellen Schritten zu eurem Hochzeitsplaner"
    }
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        onError={(e) => {
          // Hide video on error and use gradient background instead
          e.currentTarget.style.display = 'none';
        }}
      >
        <source src="https://res.cloudinary.com/dvaha0i6v/video/upload/v1761904441/background_loading_screen_ugj7se.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/50"></div>

      <div className="relative z-10 text-center px-6 sm:px-8 max-w-4xl">
        <div className="mb-8 opacity-100">
          <Heart className="w-20 h-20 sm:w-24 sm:h-24 text-[#d4af37] mx-auto fill-current drop-shadow-2xl" />
        </div>

        <div className="space-y-4 opacity-100">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-3 leading-tight">
            {narrativeTexts[currentPhase].title}
          </h1>
          <p className="text-xl sm:text-2xl text-[#f7f2eb] font-light leading-relaxed">
            {narrativeTexts[currentPhase].subtitle}
          </p>
        </div>

        <div className="mt-12 flex justify-center gap-3 opacity-100">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-500 ${
                i <= currentPhase
                  ? 'bg-[#d4af37] scale-125 shadow-lg shadow-[#d4af37]/50'
                  : 'bg-[#d4af37]/30'
              }`}
            />
          ))}
        </div>

        {showSkip && (
          <button
            onClick={onComplete}
            className="mt-10 px-8 py-3 text-base text-[#f7f2eb] hover:text-white transition-all duration-300 border-2 border-[#d4af37]/50 hover:border-[#d4af37] rounded-full backdrop-blur-sm hover:bg-[#d4af37]/10 flex items-center gap-2 mx-auto opacity-100"
          >
            <Sparkles className="w-4 h-4" />
            Überspringen
          </button>
        )}
      </div>
    </div>
  );
}
