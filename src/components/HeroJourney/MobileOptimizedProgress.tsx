import { useState } from 'react';
import { CheckCircle, Circle, Lock, ChevronDown, ChevronUp } from 'lucide-react';

interface MobileOptimizedProgressProps {
  steps: Array<{
    id: string;
    title: string;
    completed: boolean;
    available: boolean;
  }>;
  onStepClick: (stepId: string) => void;
}

export default function MobileOptimizedProgress({ steps, onStepClick }: MobileOptimizedProgressProps) {
  const completedCount = steps.filter(s => s.completed).length;
  const percentage = Math.round((completedCount / steps.length) * 100);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="lg:hidden bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl p-3 sm:p-4 border border-[#d4af37]/20 shadow-md">
      {/* Compact Progress Bar - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full cursor-pointer hover:bg-[#d4af37]/10 active:bg-[#d4af37]/15 rounded-lg p-2 -m-2 transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-semibold text-gray-900">Fortschritt</span>
            <div className={`bg-[#d4af37]/20 rounded-full p-1 transition-all duration-300 ${
              isExpanded ? 'rotate-180' : 'rotate-0'
            }`}>
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37]" />
            </div>
          </div>
          <span className="text-lg sm:text-xl font-bold text-[#d4af37]">{percentage}%</span>
        </div>
        <div className="h-2.5 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#d4af37] to-[#c19a2e] transition-all duration-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] sm:text-xs text-gray-600">
            {completedCount} von {steps.length} Schritten
          </p>
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-[#d4af37] font-medium">
            <span>{isExpanded ? 'Weniger' : 'Mehr'}</span>
            <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : 'rotate-0'
            }`} />
          </div>
        </div>
      </button>

      {/* Visual separator when collapsed */}
      {!isExpanded && (
        <div className="mt-3 sm:mt-4 h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />
      )}

      {/* Collapsible Step List */}
      <div className={`space-y-2 transition-all duration-300 overflow-hidden ${
        isExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        {steps.map((step) => {
          const Icon = step.completed ? CheckCircle : step.available ? Circle : Lock;
          const color = step.completed
            ? 'text-green-600'
            : step.available
            ? 'text-[#d4af37]'
            : 'text-gray-400';
          const bgColor = step.completed
            ? 'bg-green-50'
            : step.available
            ? 'bg-[#d4af37]/10'
            : 'bg-gray-50';

          return (
            <button
              key={step.id}
              onClick={() => step.available && onStepClick(step.id)}
              disabled={!step.available && !step.completed}
              className={`w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all ${
                step.available
                  ? 'border-[#d4af37] hover:shadow-md active:scale-95 cursor-pointer'
                  : 'border-gray-200 opacity-60 cursor-not-allowed'
              } ${bgColor}`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${color}`} />
              <span className={`text-xs sm:text-sm font-medium ${
                step.completed ? 'text-green-900' : step.available ? 'text-gray-900' : 'text-gray-500'
              } truncate flex-1 text-left`}>
                {step.title}
              </span>
              {step.completed && (
                <span className="text-[10px] sm:text-xs bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 rounded-full font-medium">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Actions - Only show when expanded */}
      {isExpanded && steps.some(s => s.available && !s.completed) && (
        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-gradient-to-r from-[#d4af37]/10 to-[#c19a2e]/10 rounded-lg border border-[#d4af37]/30">
          <p className="text-[10px] sm:text-xs font-semibold text-gray-900 mb-0.5 sm:mb-1">Nächster Schritt</p>
          <p className="text-[10px] sm:text-xs text-gray-700 font-medium">
            {steps.find(s => s.available && !s.completed)?.title}
          </p>
        </div>
      )}
    </div>
  );
}
