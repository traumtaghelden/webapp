import { TrendingUp, Target, Award, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { type Task } from '../../lib/supabase';

interface TaskProgressTabProps {
  tasks: Task[];
}

export default function TaskProgressTab({ tasks }: TaskProgressTabProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const overdueTasks = tasks.filter(t =>
    t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
  ).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
  const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium' && t.status !== 'completed');
  const lowPriorityTasks = tasks.filter(t => t.priority === 'low' && t.status !== 'completed');

  const categories = [...new Set(tasks.map(t => t.category))];
  const categoryProgress = categories.map(category => {
    const categoryTasks = tasks.filter(t => t.category === category);
    const categoryCompleted = categoryTasks.filter(t => t.status === 'completed').length;
    return {
      category,
      total: categoryTasks.length,
      completed: categoryCompleted,
      percentage: categoryTasks.length > 0 ? Math.round((categoryCompleted / categoryTasks.length) * 100) : 0,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white">Fortschritts-Übersicht</h3>
        <p className="text-gray-300 mt-1">Meilensteine und Statistiken</p>
      </div>

      <div className="bg-gradient-to-br from-[#0a253c] to-[#1a3a5c] rounded-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-[#d4af37]/20 rounded-full mb-4">
            <Target className="w-12 h-12 text-[#d4af37]" />
          </div>
          <h4 className="text-3xl font-bold text-white mb-2">Gesamtfortschritt</h4>
          <div className="text-6xl font-bold text-[#d4af37] mb-4">{completionRate}%</div>
          <p className="text-white/70">
            {completedTasks} von {totalTasks} Aufgaben abgeschlossen
          </p>
        </div>

        <div className="w-full bg-white/10 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] h-4 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-200">
          <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-3xl font-bold text-green-600 mb-1">{completedTasks}</div>
          <div className="text-sm text-[#666666]">Abgeschlossen</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-200">
          <Clock className="w-8 h-8 text-blue-600 mb-3" />
          <div className="text-3xl font-bold text-blue-600 mb-1">{inProgressTasks}</div>
          <div className="text-sm text-[#666666]">In Bearbeitung</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
          <TrendingUp className="w-8 h-8 text-gray-600 mb-3" />
          <div className="text-3xl font-bold text-gray-600 mb-1">{pendingTasks}</div>
          <div className="text-sm text-[#666666]">Ausstehend</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-red-200">
          <AlertTriangle className="w-8 h-8 text-red-600 mb-3" />
          <div className="text-3xl font-bold text-red-600 mb-1">{overdueTasks}</div>
          <div className="text-sm text-[#666666]">Überfällig</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h4 className="font-bold text-[#0a253c] text-lg mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-[#d4af37]" />
          Fortschritt nach Priorität
        </h4>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-red-600">Hohe Priorität</span>
              <span className="text-sm text-[#666666]">{highPriorityTasks.length} offen</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${highPriorityTasks.length > 0 ? 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-orange-600">Mittlere Priorität</span>
              <span className="text-sm text-[#666666]">{mediumPriorityTasks.length} offen</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: `${mediumPriorityTasks.length > 0 ? 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-blue-600">Niedrige Priorität</span>
              <span className="text-sm text-[#666666]">{lowPriorityTasks.length} offen</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${lowPriorityTasks.length > 0 ? 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h4 className="font-bold text-[#0a253c] text-lg mb-4">Fortschritt nach Kategorie</h4>
        <div className="space-y-4">
          {categoryProgress.map(({ category, total, completed, percentage }) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-[#0a253c]">{category}</span>
                <span className="text-sm text-[#666666]">
                  {completed}/{total} ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
