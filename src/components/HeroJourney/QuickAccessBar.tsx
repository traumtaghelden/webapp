import { useState } from 'react';
import { ChevronRight, Zap, TrendingUp, AlertCircle } from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  priority: 'high' | 'medium' | 'low';
  onClick: () => void;
}

interface QuickAccessBarProps {
  actions: QuickAction[];
}

export default function QuickAccessBar({ actions }: QuickAccessBarProps) {
  const [expanded, setExpanded] = useState(false);

  if (actions.length === 0) return null;

  const topAction = actions[0];
  const remainingActions = actions.slice(1);

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return AlertCircle;
      case 'medium':
        return TrendingUp;
      case 'low':
        return Zap;
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'from-red-500 to-red-600';
      case 'medium':
        return 'from-orange-500 to-orange-600';
      case 'low':
        return 'from-blue-500 to-blue-600';
    }
  };

  const TopIcon = getPriorityIcon(topAction.priority);

  return (
    <div className="lg:hidden fixed bottom-20 left-0 right-0 z-40 px-4 pb-4">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-[#d4af37] overflow-hidden">
        {/* Main Action */}
        <button
          onClick={topAction.onClick}
          className="w-full p-4 flex items-center gap-3 bg-gradient-to-r from-[#d4af37]/10 to-[#c19a2e]/10 hover:from-[#d4af37]/20 hover:to-[#c19a2e]/20 transition-all active:scale-95"
        >
          <div className={`bg-gradient-to-br ${getPriorityColor(topAction.priority)} p-2.5 rounded-lg flex-shrink-0`}>
            <TopIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{topAction.title}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#d4af37] flex-shrink-0" />
        </button>

        {/* More Actions Toggle */}
        {remainingActions.length > 0 && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors border-t border-gray-200 flex items-center justify-center gap-1"
            >
              <span>{expanded ? 'Weniger' : `${remainingActions.length} weitere`}</span>
              <ChevronRight
                className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              />
            </button>

            {/* Expanded Actions */}
            {expanded && (
              <div className="border-t border-gray-200 max-h-48 overflow-y-auto">
                {remainingActions.map((action) => {
                  const Icon = getPriorityIcon(action.priority);
                  return (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 active:scale-95"
                    >
                      <div className={`bg-gradient-to-br ${getPriorityColor(action.priority)} p-2 rounded-lg flex-shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{action.title}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
