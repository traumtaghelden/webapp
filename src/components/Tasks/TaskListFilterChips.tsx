import { Calendar, AlertTriangle, Flame, User, List } from 'lucide-react';
import { type Task } from '../../lib/supabase';
import type { FilterType } from './TaskListViewEnhanced';

interface TaskListFilterChipsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  tasks: Task[];
}

export default function TaskListFilterChips({
  activeFilter,
  onFilterChange,
  tasks,
}: TaskListFilterChipsProps) {
  const today = new Date();
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const todayCount = tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    return dueDate.toDateString() === today.toDateString();
  }).length;

  const weekCount = tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    return dueDate >= today && dueDate <= weekFromNow;
  }).length;

  const overdueCount = tasks.filter(task => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < today;
  }).length;

  const highPriorityCount = tasks.filter(task => task.priority === 'high').length;

  const filters = [
    {
      id: 'all' as FilterType,
      label: 'Alle',
      icon: <List className="w-3.5 h-3.5" />,
      count: tasks.length,
      color: 'gray',
    },
    {
      id: 'today' as FilterType,
      label: 'Heute',
      icon: <Calendar className="w-3.5 h-3.5" />,
      count: todayCount,
      color: 'blue',
    },
    {
      id: 'week' as FilterType,
      label: 'Diese Woche',
      icon: <Calendar className="w-3.5 h-3.5" />,
      count: weekCount,
      color: 'indigo',
    },
    {
      id: 'overdue' as FilterType,
      label: 'Überfällig',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      count: overdueCount,
      color: 'red',
    },
    {
      id: 'high_priority' as FilterType,
      label: 'Hohe Priorität',
      icon: <Flame className="w-3.5 h-3.5" />,
      count: highPriorityCount,
      color: 'orange',
    },
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    if (isActive) {
      switch (color) {
        case 'gray':
          return 'bg-gray-600 text-white border-gray-700';
        case 'blue':
          return 'bg-blue-600 text-white border-blue-700';
        case 'indigo':
          return 'bg-indigo-600 text-white border-indigo-700';
        case 'red':
          return 'bg-red-600 text-white border-red-700';
        case 'orange':
          return 'bg-orange-600 text-white border-orange-700';
        default:
          return 'bg-[#d4af37] text-white border-[#c4a137]';
      }
    } else {
      switch (color) {
        case 'gray':
          return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
        case 'blue':
          return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
        case 'indigo':
          return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
        case 'red':
          return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
        case 'orange':
          return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
        default:
          return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all text-sm md:text-xs font-semibold min-h-[40px] md:min-h-0
            ${getColorClasses(filter.color, activeFilter === filter.id)}
            ${activeFilter === filter.id ? 'shadow-lg scale-105' : 'shadow-sm hover:scale-105'}
          `}
        >
          {filter.icon}
          <span className="hidden sm:inline">{filter.label}</span>
          <span className="sm:hidden">
            {filter.id === 'all' && 'Alle'}
            {filter.id === 'today' && 'Heute'}
            {filter.id === 'week' && 'Woche'}
            {filter.id === 'overdue' && 'Überfällig'}
            {filter.id === 'high_priority' && 'Priorität'}
          </span>
          <span className={`
            px-1.5 py-0.5 rounded-md text-xs font-bold
            ${activeFilter === filter.id ? 'bg-white/20' : 'bg-black/10'}
          `}>
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  );
}
