import { Calendar, Target } from 'lucide-react';
import type { Task } from '../../lib/supabase';

interface DashboardTasksTabProps {
  tasks: Task[];
  onNavigate: (tab: string) => void;
}

export default function DashboardTasksTab({ tasks, onNavigate }: DashboardTasksTabProps) {
  const getTasksThisWeek = () => {
    return tasks.filter((t) => {
      if (t.status === 'completed' || !t.due_date) return false;
      const dueDate = new Date(t.due_date);
      const today = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    });
  };

  const getTasksThisMonth = () => {
    return tasks.filter((t) => {
      if (t.status === 'completed' || !t.due_date) return false;
      const dueDate = new Date(t.due_date);
      const today = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 7 && diffDays <= 30;
    });
  };

  const getHighPriorityTasks = () => {
    return tasks.filter((t) => t.status !== 'completed' && t.priority === 'high');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white">Aufgaben-Übersicht</h3>
        <p className="text-[#666666] mt-1">Behalte deine wichtigsten Aufgaben im Blick</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="relative bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-3xl p-6 shadow-2xl border-2 border-orange-500/50 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-orange-400 to-orange-500 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Diese Woche</h2>
              </div>
              <span className="bg-gradient-to-r from-orange-400 to-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                {getTasksThisWeek().length}
              </span>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {getTasksThisWeek().slice(0, 5).map((task) => (
                <div key={task.id} className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all border border-white/10 hover:border-orange-500/50 cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium group-hover:text-orange-300 transition-colors text-sm truncate">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-orange-400 font-semibold mt-1">
                        {new Date(task.due_date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {getTasksThisWeek().length === 0 && (
                <div className="text-center py-8 bg-white/5 rounded-xl">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-white/70 text-sm">Keine dringenden Aufgaben</p>
                </div>
              )}
            </div>
            {getTasksThisWeek().length > 0 && (
              <button
                onClick={() => onNavigate('tasks')}
                className="mt-4 w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-3 rounded-xl font-bold shadow-lg transition-all"
              >
                Alle anzeigen
              </button>
            )}
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-3xl p-6 shadow-2xl border-2 border-blue-500/50 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-400 to-blue-500 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Diesen Monat</h2>
              </div>
              <span className="bg-gradient-to-r from-blue-400 to-blue-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                {getTasksThisMonth().length}
              </span>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {getTasksThisMonth().slice(0, 5).map((task) => (
                <div key={task.id} className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all border border-white/10 hover:border-blue-500/50 cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium group-hover:text-blue-300 transition-colors text-sm truncate">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-blue-400 font-semibold mt-1">
                        {new Date(task.due_date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {getTasksThisMonth().length === 0 && (
                <div className="text-center py-8 bg-white/5 rounded-xl">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="text-white/70 text-sm">Keine Aufgaben diesen Monat</p>
                </div>
              )}
            </div>
            {getTasksThisMonth().length > 0 && (
              <button
                onClick={() => onNavigate('tasks')}
                className="mt-4 w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-xl font-bold shadow-lg transition-all"
              >
                Alle anzeigen
              </button>
            )}
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-3xl p-6 shadow-2xl border-2 border-[#d4af37]/50 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#d4af37]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] w-11 h-11 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Priorität Hoch</h2>
              </div>
              <span className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                {getHighPriorityTasks().length}
              </span>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {getHighPriorityTasks().slice(0, 5).map((task) => (
                <div key={task.id} className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all border border-white/10 hover:border-[#d4af37]/50 cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium group-hover:text-[#f4d03f] transition-colors text-sm truncate">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-[#d4af37] font-semibold mt-1">
                        {new Date(task.due_date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {getHighPriorityTasks().length === 0 && (
                <div className="text-center py-8 bg-white/5 rounded-xl">
                  <div className="text-4xl mb-2">⭐</div>
                  <p className="text-white/70 text-sm">Keine hohen Prioritäten</p>
                </div>
              )}
            </div>
            {getHighPriorityTasks().length > 0 && (
              <button
                onClick={() => onNavigate('tasks')}
                className="mt-4 w-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#f4d03f] hover:to-[#d4af37] text-white py-3 rounded-xl font-bold shadow-lg transition-all"
              >
                Alle anzeigen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
