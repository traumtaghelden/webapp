import { Trophy, Star, Sparkles, Award, Heart, Zap, Target, Crown, Gift, Rocket } from 'lucide-react';

interface MilestoneBadgeProps {
  milestoneType: string;
  achievedAt: string;
  animate?: boolean;
}

const MILESTONE_CONFIG: { [key: string]: { icon: React.ElementType; label: string; description: string; color: string } } = {
  first_step: {
    icon: Rocket,
    label: 'Erster Schritt',
    description: 'Du hast deinen ersten Schritt abgeschlossen!',
    color: 'from-blue-500 to-blue-600'
  },
  three_steps: {
    icon: Zap,
    label: 'Gut begonnen',
    description: 'Drei Schritte geschafft - du bist auf dem richtigen Weg!',
    color: 'from-green-500 to-green-600'
  },
  basics_complete: {
    icon: Target,
    label: 'Grundlagen gelegt',
    description: 'Vision, Budget und Gästezahl sind definiert!',
    color: 'from-pink-500 to-pink-600'
  },
  foundation_complete: {
    icon: Crown,
    label: 'Fundament steht',
    description: 'Alle Grundlagen-Schritte abgeschlossen!',
    color: 'from-[#d4af37] to-[#c19a2e]'
  },
  all_steps_complete: {
    icon: Trophy,
    label: 'Heldenreise vollendet',
    description: 'Alle 10 Schritte erfolgreich abgeschlossen!',
    color: 'from-purple-500 to-purple-600'
  },
  // Additional milestones with distinct icons
  half_complete: {
    icon: Star,
    label: 'Halbzeit',
    description: '5 Schritte geschafft - die Hälfte ist vorbei!',
    color: 'from-amber-500 to-amber-600'
  },
  vision_set: {
    icon: Sparkles,
    label: 'Vision definiert',
    description: 'Eure Traumhochzeit nimmt Gestalt an!',
    color: 'from-indigo-500 to-indigo-600'
  },
  budget_complete: {
    icon: Award,
    label: 'Budget festgelegt',
    description: 'Finanzielle Planung abgeschlossen!',
    color: 'from-emerald-500 to-emerald-600'
  },
  guests_confirmed: {
    icon: Heart,
    label: 'Gäste bestätigt',
    description: 'Ihr wisst, wer mitfeiert!',
    color: 'from-rose-500 to-rose-600'
  },
  location_booked: {
    icon: Gift,
    label: 'Location gebucht',
    description: 'Der perfekte Ort ist gesichert!',
    color: 'from-teal-500 to-teal-600'
  }
};

export default function MilestoneBadge({ milestoneType, achievedAt, animate = true }: MilestoneBadgeProps) {
  const config = MILESTONE_CONFIG[milestoneType];

  if (!config) return null;

  const Icon = config.icon;
  const date = new Date(achievedAt);
  const formattedDate = date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div
      className={`
        relative group cursor-pointer
        ${animate ? 'animate-bounce-in' : ''}
      `}
      title={config.description}
    >
      {/* Badge Container */}
      <div
        className={`
          relative w-20 h-20 rounded-full
          bg-gradient-to-br ${config.color}
          shadow-xl shadow-${config.color.split('-')[1]}-500/50
          flex items-center justify-center
          transition-transform duration-300
          group-hover:scale-110 group-hover:rotate-6
        `}
      >
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.color} opacity-50 blur-xl group-hover:opacity-75 transition-opacity`}></div>

        {/* Icon */}
        <Icon className="w-10 h-10 text-white relative z-10" />

        {/* Shine animation */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
        <div className="bg-gradient-to-br from-[#0A1F3D] to-[#1a3a5c] rounded-xl px-4 py-3 shadow-2xl border border-[#d4af37]/30 whitespace-nowrap">
          <div className="text-white font-bold text-sm mb-1">{config.label}</div>
          <div className="text-gray-300 text-xs mb-2">{config.description}</div>
          <div className="text-gray-400 text-xs">Erreicht am {formattedDate}</div>

          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-[#1a3a5c]"></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
      `}</style>
    </div>
  );
}
