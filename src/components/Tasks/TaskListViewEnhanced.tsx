import { useState, useEffect, useCallback, useMemo } from 'react';
import { Filter, X, ChevronDown, Plus } from 'lucide-react';
import { supabase, type Task, type TaskSubtask, type BudgetItem, type Vendor, type WeddingTeamRole } from '../../lib/supabase';
import { TASK } from '../../constants/terminology';
import { logger } from '../../utils/logger';
import TaskListTable from './TaskListTable';
import TaskListFilterChips from './TaskListFilterChips';
import TaskListBulkActions from './TaskListBulkActions';
import TaskDetailModal from '../TaskDetailModal';

interface TaskListViewEnhancedProps {
  tasks: Task[];
  weddingId: string;
  onUpdate: () => void;
  subtasks?: TaskSubtask[];
  budgetItems?: BudgetItem[];
  vendors?: Vendor[];
  teamRoles?: WeddingTeamRole[];
  onTaskClick?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => void;
  onAddTask?: () => void;
}

export type FilterType = 'all' | 'today' | 'week' | 'overdue' | 'high_priority' | 'my_tasks';
export type GroupByType = 'none' | 'status' | 'category' | 'priority' | 'due_date' | 'assigned_to';

export interface TaskListPreferences {
  visibleColumns: string[];
  columnOrder: string[];
  columnWidths: Record<string, number>;
  sortConfig: {
    primary: string;
    direction: 'asc' | 'desc';
  };
  savedViews: any[];
  defaultView: string;
  compactMode: boolean;
}

const defaultPreferences: TaskListPreferences = {
  visibleColumns: ['checkbox', 'title', 'category', 'priority', 'due_date', 'assigned_to', 'status', 'actions'],
  columnOrder: ['checkbox', 'title', 'category', 'priority', 'due_date', 'assigned_to', 'status', 'actions'],
  columnWidths: {},
  sortConfig: {
    primary: 'smart_priority',
    direction: 'asc',
  },
  savedViews: [],
  defaultView: 'all',
  compactMode: false,
};

export default function TaskListViewEnhanced({
  tasks,
  weddingId,
  onUpdate,
  subtasks: providedSubtasks,
  budgetItems: providedBudgetItems,
  vendors: providedVendors,
  teamRoles: providedTeamRoles,
  onTaskClick,
  onDeleteTask,
  onStatusChange,
  onAddTask,
}: TaskListViewEnhancedProps) {
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>(providedSubtasks || []);
  const [teamRoles, setTeamRoles] = useState<WeddingTeamRole[]>(providedTeamRoles || []);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<TaskListPreferences>(defaultPreferences);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<GroupByType>('none');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (onAddTask) onAddTask();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAddTask]);

  useEffect(() => {
    loadPreferences();
  }, [weddingId]);

  useEffect(() => {
    if (!providedSubtasks || !providedTeamRoles) {
      loadAdditionalData();
    }
  }, [weddingId]);

  const loadPreferences = async () => {
    setPreferencesLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_task_list_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('wedding_id', weddingId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error loading preferences', 'TaskListViewEnhanced', error);
        return;
      }

      if (data) {
        setPreferences({
          visibleColumns: data.visible_columns || defaultPreferences.visibleColumns,
          columnOrder: data.column_order || defaultPreferences.columnOrder,
          columnWidths: data.column_widths || defaultPreferences.columnWidths,
          sortConfig: data.sort_config || defaultPreferences.sortConfig,
          savedViews: data.saved_views || defaultPreferences.savedViews,
          defaultView: data.default_view || defaultPreferences.defaultView,
          compactMode: data.compact_mode || defaultPreferences.compactMode,
        });
      }
    } catch (error) {
      logger.error('Error in loadPreferences', 'TaskListViewEnhanced', error);
    } finally {
      setPreferencesLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Partial<TaskListPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedPreferences = { ...preferences, ...newPreferences };
      setPreferences(updatedPreferences);

      const { error } = await supabase
        .from('user_task_list_preferences')
        .upsert(
          {
            user_id: user.id,
            wedding_id: weddingId,
            visible_columns: updatedPreferences.visibleColumns,
            column_order: updatedPreferences.columnOrder,
            column_widths: updatedPreferences.columnWidths,
            sort_config: updatedPreferences.sortConfig,
            saved_views: updatedPreferences.savedViews,
            default_view: updatedPreferences.defaultView,
            compact_mode: updatedPreferences.compactMode,
          },
          {
            onConflict: 'user_id,wedding_id',
          }
        );

      if (error) {
        logger.error('Error saving preferences', 'TaskListViewEnhanced', error);
      }
    } catch (error) {
      logger.error('Error in savePreferences', 'TaskListViewEnhanced', error);
    }
  };

  const loadAdditionalData = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const promises = [];

      if (!providedSubtasks) {
        promises.push(
          supabase
            .from('task_subtasks')
            .select('*')
            .in('task_id', tasks.map(t => t.id))
        );
      }

      if (!providedTeamRoles) {
        promises.push(
          supabase
            .from('wedding_team_roles')
            .select('*')
            .eq('wedding_id', weddingId)
        );
      }

      const results = await Promise.all(promises);

      let resultIndex = 0;
      if (!providedSubtasks && results[resultIndex]) {
        const { data, error } = results[resultIndex];
        if (error) {
          logger.error('Error loading subtasks', 'TaskListViewEnhanced', error);
        } else if (data) {
          setSubtasks(data);
        }
        resultIndex++;
      }

      if (!providedTeamRoles && results[resultIndex]) {
        const { data, error } = results[resultIndex];
        if (error) {
          logger.error('Error loading team roles', 'TaskListViewEnhanced', error);
        } else if (data) {
          setTeamRoles(data);
        }
      }
    } catch (error) {
      logger.error('Error in loadAdditionalData', 'TaskListViewEnhanced', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.category.toLowerCase().includes(query)
      );
    }

    switch (activeFilter) {
      case 'today':
        filtered = filtered.filter(task => {
          if (!task.due_date) return false;
          const today = new Date();
          const dueDate = new Date(task.due_date);
          return dueDate.toDateString() === today.toDateString();
        });
        break;
      case 'week':
        filtered = filtered.filter(task => {
          if (!task.due_date) return false;
          const today = new Date();
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          const dueDate = new Date(task.due_date);
          return dueDate >= today && dueDate <= weekFromNow;
        });
        break;
      case 'overdue':
        filtered = filtered.filter(task => {
          if (!task.due_date || task.status === 'completed') return false;
          return new Date(task.due_date) < new Date();
        });
        break;
      case 'high_priority':
        filtered = filtered.filter(task => task.priority === 'high');
        break;
      case 'my_tasks':
        filtered = filtered.filter(task => {
          return true;
        });
        break;
    }

    filtered.sort((a, b) => {
      const sortCol = preferences.sortConfig.primary;
      const sortDir = preferences.sortConfig.direction;
      const multiplier = sortDir === 'asc' ? 1 : -1;

      if (sortCol === 'smart_priority') {
        const aOverdue = a.due_date && new Date(a.due_date) < new Date() && a.status !== 'completed';
        const bOverdue = b.due_date && new Date(b.due_date) < new Date() && b.status !== 'completed';

        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        if (a.due_date && b.due_date) {
          const dateCompare = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          if (dateCompare !== 0) return dateCompare;
        } else if (a.due_date) {
          return -1;
        } else if (b.due_date) {
          return 1;
        }

        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityCompare = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityCompare !== 0) return priorityCompare;

        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      if (sortCol === 'title') {
        return multiplier * a.title.localeCompare(b.title);
      }

      if (sortCol === 'category') {
        return multiplier * a.category.localeCompare(b.category);
      }

      if (sortCol === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return multiplier * (priorityOrder[a.priority] - priorityOrder[b.priority]);
      }

      if (sortCol === 'due_date') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return multiplier * (new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      }

      if (sortCol === 'assigned_to') {
        const aAssigned = a.assigned_to || '';
        const bAssigned = b.assigned_to || '';
        return multiplier * aAssigned.localeCompare(bAssigned);
      }

      if (sortCol === 'status') {
        const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
        return multiplier * (statusOrder[a.status] - statusOrder[b.status]);
      }

      return 0;
    });

    return filtered;
  }, [tasks, activeFilter, searchQuery, preferences.sortConfig]);

  const handleBulkStatusChange = async (newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      const taskIds = Array.from(selectedTasks);
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .in('id', taskIds);

      if (error) throw error;
      setSelectedTasks(new Set());
      onUpdate();
    } catch (error) {
      logger.error('Error in bulk status change', 'TaskListViewEnhanced', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`${selectedTasks.size} ${TASK.PLURAL} wirklich löschen?`)) return;

    try {
      const taskIds = Array.from(selectedTasks);
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', taskIds);

      if (error) throw error;
      setSelectedTasks(new Set());
      onUpdate();
    } catch (error) {
      logger.error('Error in bulk delete', 'TaskListViewEnhanced', error);
    }
  };

  const handleToggleSelect = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === filteredAndSortedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredAndSortedTasks.map(t => t.id)));
    }
  };

  const handleSortChange = (column: string, direction: 'asc' | 'desc') => {
    savePreferences({
      sortConfig: {
        primary: column,
        direction,
      },
    });
  };

  const handleTaskClick = (task: Task) => {
    if (onTaskClick) {
      onTaskClick(task);
    } else {
      setSelectedTaskForDetail(task);
    }
  };

  if (preferencesLoading || (loading && tasks.length === 0)) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-gray-500">Lade Aufgaben...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl p-3 md:p-4 shadow-lg border border-[#d4af37]/10">
        {/* Header - optimiert für mobile */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-lg md:text-xl font-bold text-[#0a253c]">Alle {TASK.PLURAL}</h3>

          {/* Nur Neu-Button auf Mobile */}
          <button
            onClick={onAddTask}
            className="flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2 bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all active:scale-95 min-h-[40px]"
            title="Neue Aufgabe hinzufügen (Strg+N)"
          >
            <Plus className="w-4 h-4" />
            <span>Neu</span>
          </button>
        </div>


        {/* Suchfeld - optimiert für mobile */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder={`${TASK.PLURAL} durchsuchen...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 md:py-2 text-base md:text-sm rounded-lg border border-[#d4af37]/20 bg-white focus:border-[#d4af37] focus:shadow-md focus:shadow-[#d4af37]/10 focus:outline-none transition-all placeholder:text-[#999999] min-h-[44px]"
          />
        </div>

        <TaskListFilterChips
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          tasks={tasks}
        />
      </div>

      {selectedTasks.size > 0 && (
        <TaskListBulkActions
          selectedCount={selectedTasks.size}
          onStatusChange={handleBulkStatusChange}
          onDelete={handleBulkDelete}
          onClear={() => setSelectedTasks(new Set())}
        />
      )}

      <TaskListTable
        tasks={filteredAndSortedTasks}
        weddingId={weddingId}
        subtasks={subtasks}
        teamRoles={teamRoles}
        budgetItems={providedBudgetItems}
        vendors={providedVendors}
        selectedTasks={selectedTasks}
        preferences={preferences}
        onUpdate={onUpdate}
        onTaskClick={handleTaskClick}
        onDeleteTask={onDeleteTask}
        onStatusChange={onStatusChange}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onAddTask={onAddTask}
        onSortChange={handleSortChange}
        sortColumn={preferences.sortConfig.primary}
        sortDirection={preferences.sortConfig.direction}
      />

      {selectedTaskForDetail && (
        <TaskDetailModal
          taskId={selectedTaskForDetail.id}
          taskTitle={selectedTaskForDetail.title}
          weddingId={weddingId}
          onClose={() => setSelectedTaskForDetail(null)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}
