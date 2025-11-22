import { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { type Task } from '../../lib/supabase';
import TaskDetailModal from '../TaskDetailModal';

interface TaskCalendarTabProps {
  weddingId: string;
  tasks: Task[];
  onUpdate: () => void;
}

export default function TaskCalendarTab({ weddingId, tasks, onUpdate }: TaskCalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTasksWithoutDate, setShowTasksWithoutDate] = useState(false);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthName = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      if (task.due_date) {
        const dateKey = new Date(task.due_date).toDateString();
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(task);
      }
    });
    return map;
  }, [tasks]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getDayTasks = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return tasksByDate.get(date.toDateString()) || [];
  };

  const getSelectedDateTasks = () => {
    if (!selectedDate) return [];
    return tasksByDate.get(selectedDate.toDateString()) || [];
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-[#0a253c] flex items-center gap-3">
            <Calendar className="w-6 h-6 text-[#d4af37]" />
            {monthName}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={previousMonth}
              className="p-2 rounded-lg hover:bg-[#f7f2eb] transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-[#0a253c]" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-[#f7f2eb] transition-all"
            >
              <ChevronRight className="w-5 h-5 text-[#0a253c]" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
            <div key={day} className="text-center font-bold text-[#666666] py-2">
              {day}
            </div>
          ))}

          {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayTasks = getDayTasks(day);
            const isToday =
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear();

            const isSelected = selectedDate?.getDate() === day &&
              selectedDate?.getMonth() === currentDate.getMonth() &&
              selectedDate?.getFullYear() === currentDate.getFullYear();

            return (
              <div
                key={day}
                onClick={() => handleDateClick(day)}
                className={`aspect-square p-2 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#d4af37] bg-[#d4af37]/20'
                    : isToday
                    ? 'border-[#d4af37] bg-[#d4af37]/10'
                    : 'border-gray-200 hover:border-[#d4af37]/50 hover:bg-[#f7f2eb]'
                }`}
              >
                <div className="flex flex-col h-full">
                  <div className={`text-sm font-bold mb-1 ${isSelected || isToday ? 'text-[#d4af37]' : 'text-[#0a253c]'}`}>
                    {day}
                  </div>
                  <div className="flex-1 space-y-1">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                        }}
                        className={`text-xs p-1 rounded cursor-pointer truncate ${
                          task.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : task.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-[#999999] text-center">
                        +{dayTasks.length - 3} mehr
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Aufgaben des ausgewählten Datums */}
      {selectedDate && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-[#0a253c] text-xl flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#d4af37]" />
              Aufgaben am {formatSelectedDate()}
            </h4>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-sm text-[#666666] hover:text-[#d4af37] transition-all"
            >
              Schließen
            </button>
          </div>

          {getSelectedDateTasks().length > 0 ? (
            <div className="space-y-3">
              {getSelectedDateTasks().map(task => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="p-4 bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl hover:shadow-xl hover:shadow-[#d4af37]/10 transition-all duration-300 border border-[#d4af37]/10 hover:border-[#d4af37]/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[#0a253c] text-lg">{task.title}</span>
                    <div className="flex items-center gap-2">
                      {task.priority === 'high' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : task.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {task.status === 'completed' ? 'Erledigt' : task.status === 'in_progress' ? 'In Bearbeitung' : 'Offen'}
                      </span>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-[#666666] line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-[#999999]">
                    {task.category && (
                      <span className="bg-[#d4af37]/10 px-2 py-1 rounded">
                        {task.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-[#d4af37]/30 mx-auto mb-4" />
              <p className="text-[#666666] text-lg font-medium mb-2">
                Keine Aufgaben an diesem Tag
              </p>
              <p className="text-[#999999] text-sm">
                An diesem Datum sind keine Aufgaben geplant.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => setShowTasksWithoutDate(!showTasksWithoutDate)}
          className="w-full p-6 flex items-center justify-between hover:bg-[#f7f2eb]/30 transition-all"
        >
          <div className="flex items-center gap-3">
            <h4 className="font-bold text-[#0a253c] text-lg">Aufgaben ohne Datum</h4>
            <span className="bg-[#d4af37]/20 text-[#0a253c] px-3 py-1 rounded-full text-sm font-medium">
              {tasks.filter(t => !t.due_date).length}
            </span>
          </div>
          {showTasksWithoutDate ? (
            <ChevronUp className="w-5 h-5 text-[#d4af37]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#d4af37]" />
          )}
        </button>

        {showTasksWithoutDate && (
          <div className="px-6 pb-6 space-y-2 border-t border-gray-100">
            <div className="pt-4 space-y-2">
              {tasks.filter(t => !t.due_date).length > 0 ? (
                tasks.filter(t => !t.due_date).map(task => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-3 bg-[#f7f2eb] rounded-lg cursor-pointer hover:bg-[#d4af37]/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0a253c]">{task.title}</span>
                      {task.priority === 'high' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-[#d4af37]/30 mx-auto mb-3" />
                  <p className="text-[#999999] text-sm">
                    Alle Aufgaben haben ein Datum zugewiesen
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          taskId={selectedTask.id}
          weddingId={weddingId}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}
