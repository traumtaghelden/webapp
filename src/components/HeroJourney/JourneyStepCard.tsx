import { LucideIcon } from 'lucide-react';

interface JourneyStepCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  color: string;
  onClick: () => void;
  stepNumber?: number;
}

export default function JourneyStepCard({
  icon: Icon,
  title,
  description,
  status,
  color,
  onClick,
  stepNumber,
}: JourneyStepCardProps) {
  const statusConfig = {
    completed: {
      badge: 'Erledigt',
      badgeColor: 'bg-green-100 text-green-700',
      borderColor: 'border-green-500',
    },
    in_progress: {
      badge: 'In Arbeit',
      badgeColor: 'bg-amber-100 text-amber-700',
      borderColor: 'border-amber-500',
    },
    pending: {
      badge: 'Offen',
      badgeColor: 'bg-gray-100 text-gray-600',
      borderColor: 'border-gray-300',
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div
      onClick={onClick}
      className={`
        relative p-6 rounded-2xl cursor-pointer
        transition-all duration-500
        border-2 ${currentStatus.borderColor}
        bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm
        hover:shadow-2xl hover:shadow-[#F5B800]/20 hover:scale-[1.05] active:scale-[0.95]
        hover:border-[#F5B800]/50
        group
        overflow-hidden
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5B800]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      {status === 'completed' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
        </div>
      )}

      {stepNumber && (
        <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-gradient-to-br from-[#F5B800] to-[#E0A800] flex items-center justify-center text-gray-900 font-bold text-base shadow-xl shadow-[#F5B800]/30 group-hover:scale-110 transition-transform pointer-events-none">
          {stepNumber}
        </div>
      )}

      <div className="absolute top-4 right-4 pointer-events-none">
        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-md ${currentStatus.badgeColor}`}>
          {currentStatus.badge}
        </span>
      </div>

      <div className={`relative inline-flex p-4 rounded-xl bg-gradient-to-br from-[#F5B800] to-[#E0A800] text-gray-900 mb-4 mt-6 shadow-xl shadow-[#F5B800]/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 pointer-events-none`}>
        <Icon className="w-8 h-8" />
        {status === 'completed' && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#F5B800] transition-colors pointer-events-none">{title}</h3>
      <p className="text-sm text-gray-300 leading-relaxed mb-6 pointer-events-none">{description}</p>

      <button className="relative w-full bg-gradient-to-r from-[#F5B800] to-[#E0A800] hover:from-[#E0A800] hover:to-[#F5B800] text-gray-900 font-semibold px-6 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#F5B800]/50 overflow-hidden group/btn text-center active:scale-95">
        <span className="relative z-10">
          {status === 'completed' ? '✓ Bearbeiten' : status === 'in_progress' ? '→ Fortfahren' : '★ Jetzt starten'}
        </span>
        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
      </button>
    </div>
  );
}
