import { CheckCircle } from 'lucide-react';

interface JourneyProgressBarProps {
  completedSteps: number;
  totalSteps: number;
  fundamentCompleted: number;
  planningCompleted: number;
}

export default function JourneyProgressBar({
  completedSteps,
  totalSteps,
  fundamentCompleted,
  planningCompleted,
}: JourneyProgressBarProps) {
  const percentage = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-[#F5B800]/30 mb-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5B800]/5 to-transparent"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="relative">
                <CheckCircle className="w-8 h-8 text-[#F5B800] animate-pulse" />
                {percentage === 100 && (
                  <div className="absolute inset-0 animate-ping">
                    <CheckCircle className="w-8 h-8 text-[#F5B800]" />
                  </div>
                )}
              </div>
              Eure Reise-Fortschritt
            </h2>
            <p className="text-sm text-gray-300 mt-2">
              Ihr habt {completedSteps} von {totalSteps} Schritten gemeistert
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-[#F5B800] animate-in">{percentage}%</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Vollendet</div>
          </div>
        </div>

        <div className="relative w-full bg-gray-700/50 rounded-full h-6 overflow-hidden mb-6 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#F5B800] via-[#FFD700] to-[#F5B800] transition-all duration-1000 ease-out rounded-full relative overflow-hidden"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>
          {percentage === 100 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-xs font-bold animate-bounce">🎉 PERFEKT! 🎉</div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30 hover:border-purple-400/60 transition-all duration-300 hover:scale-105 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">Fundament</p>
              <p className="text-3xl font-bold text-white mt-2 group-hover:text-purple-200 transition-colors">{fundamentCompleted}/7</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-purple-300 group-hover:scale-110 transition-transform">{Math.round((fundamentCompleted / 7) * 100)}%</div>
              <div className="w-16 h-2 bg-purple-900/50 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-300 transition-all duration-500"
                  style={{ width: `${(fundamentCompleted / 7) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/30 hover:border-blue-400/60 transition-all duration-300 hover:scale-105 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">Planung</p>
              <p className="text-3xl font-bold text-white mt-2 group-hover:text-blue-200 transition-colors">{planningCompleted}/3</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-300 group-hover:scale-110 transition-transform">{Math.round((planningCompleted / 3) * 100)}%</div>
              <div className="w-16 h-2 bg-blue-900/50 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-300 transition-all duration-500"
                  style={{ width: `${(planningCompleted / 3) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
