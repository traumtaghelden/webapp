import { useState } from 'react';
import {
  CheckSquare, Square, Circle, CheckCircle, Calendar, MessageSquare,
  Trash2, User, DollarSign, Building2, Clock, Pencil, Check, X, ChevronRight, Plus, ClipboardList, Eye, ChevronUp, ChevronDown, Edit
} from 'lucide-react';
import ConfirmDeleteDialog from '../ConfirmDeleteDialog';
import SwipeableListItem from '../common/SwipeableListItem';
import { supabase, type Task, type TaskSubtask, type BudgetItem, type Vendor, type WeddingTeamRole } from '../../lib/supabase';
import { TASK } from '../../constants/terminology';
import { logger } from '../../utils/logger';
import type { TaskListPreferences } from './TaskListViewEnhanced';

interface TaskListTableProps {
  tasks: Task[];
  weddingId: string;
  subtasks: TaskSubtask[];
  teamRoles: WeddingTeamRole[];
  budgetItems?: BudgetItem[];
  vendors?: Vendor[];
  selectedTasks: Set<string>;
  preferences: TaskListPreferences;
  onUpdate: () => void;
  onTaskClick?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => void;
  onToggleSelect: (taskId: string) => void;
  onSelectAll: () => void;
  onAddTask?: () => void;
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

const categories = [
  { value: 'general', label: 'Allgemein' },
  { value: 'venue', label: 'Location' },
  { value: 'catering', label: 'Catering' },
  { value: 'decoration', label: 'Dekoration' },
  { value: 'music', label: 'Musik' },
  { value: 'photography', label: 'Fotografie' },
  { value: 'invitations', label: 'Einladungen' },
  { value: 'flowers', label: 'Blumen' },
  { value: 'dress', label: 'Kleidung' },
  { value: 'other', label: 'Sonstiges' },
];

const getCategoryLabel = (categoryValue: string) => {
  const category = categories.find(cat => cat.value === categoryValue);
  return category ? category.label : categoryValue;
};

export default function TaskListTable({
  tasks,
  weddingId,
  subtasks,
  teamRoles,
  budgetItems,
  vendors,
  selectedTasks,
  preferences,
  onUpdate,
  onTaskClick,
  onDeleteTask,
  onStatusChange,
  onToggleSelect,
  onSelectAll,
  onAddTask,
  onSortChange,
  sortColumn,
  sortDirection,
}: TaskListTableProps) {
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleQuickComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    } else {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ status: newStatus })
          .eq('id', task.id);

        if (error) throw error;
        onUpdate();
      } catch (error) {
        logger.error('Error quick completing task', 'TaskListTable', error);
      }
    }
  };

  const handleStartEdit = (task: Task) => {
    setEditingTask(task.id);
    setEditingTitle(task.title);
  };

  const handleSaveEdit = async (taskId: string) => {
    if (!editingTitle.trim()) {
      setEditingTask(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ title: editingTitle.trim() })
        .eq('id', taskId);

      if (error) throw error;
      setEditingTask(null);
      onUpdate();
    } catch (error) {
      logger.error('Error updating task title', 'TaskListTable', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditingTitle('');
  };

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete({ id: task.id, title: task.title });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      if (onDeleteTask) {
        onDeleteTask(taskToDelete.id);
      } else {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskToDelete.id);

        if (error) throw error;
        onUpdate();
      }
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      logger.error('Error deleting task', 'TaskListTable', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    if (!isDeleting) {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    if (onStatusChange) {
      onStatusChange(taskId, newStatus);
    } else {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ status: newStatus })
          .eq('id', taskId);

        if (error) throw error;
        onUpdate();
      } catch (error) {
        logger.error('Error updating task status', 'TaskListTable', error);
      }
    }
  };

  const isOverdue = (task: Task) => {
    return task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  };

  const isToday = (task: Task) => {
    if (!task.due_date) return false;
    const today = new Date();
    const dueDate = new Date(task.due_date);
    return dueDate.toDateString() === today.toDateString() && task.status !== 'completed';
  };

  const getRowClassName = (task: Task) => {
    const baseClass = 'transition-all duration-200 border-b border-gray-100';
    const hoverClass = 'hover:bg-gray-50';
    const heightClass = preferences.compactMode ? 'h-12' : 'h-16';

    if (isOverdue(task)) {
      return `${baseClass} ${hoverClass} ${heightClass} bg-red-50/50`;
    }
    if (isToday(task)) {
      return `${baseClass} ${hoverClass} ${heightClass} bg-yellow-50/50`;
    }
    return `${baseClass} ${hoverClass} ${heightClass}`;
  };

  const allSelected = tasks.length > 0 && selectedTasks.size === tasks.length;
  const someSelected = selectedTasks.size > 0 && selectedTasks.size < tasks.length;

  const handleSort = (column: string) => {
    if (!onSortChange) return;

    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(column, newDirection);
  };

  const SortableHeader = ({ column, children, className = '' }: { column: string; children: React.ReactNode; className?: string }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-bold text-[#666666] uppercase cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortColumn === column && (
          sortDirection === 'asc' ?
            <ChevronUp className="w-4 h-4 text-[#d4af37]" /> :
            <ChevronDown className="w-4 h-4 text-[#d4af37]" />
        )}
      </div>
    </th>
  );

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 bg-[#d4af37]/10 rounded-full flex items-center justify-center mx-auto">
            <ClipboardList className="w-10 h-10 text-[#d4af37]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#0a253c] mb-2">Keine {TASK.PLURAL} gefunden</h3>
            <p className="text-gray-500">Legen Sie los und erstellen Sie Ihre erste Aufgabe!</p>
          </div>
          {onAddTask && (
            <button
              onClick={onAddTask}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              Erste Aufgabe erstellen
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-left w-12">
                <button
                  onClick={onSelectAll}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {allSelected ? (
                    <CheckSquare className="w-5 h-5 text-[#d4af37]" />
                  ) : someSelected ? (
                    <Square className="w-5 h-5 text-[#d4af37] opacity-50" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left w-12"></th>
              <SortableHeader column="title">Aufgabe</SortableHeader>
              <SortableHeader column="category">Kategorie</SortableHeader>
              <SortableHeader column="priority">Priorität</SortableHeader>
              <SortableHeader column="due_date">Fällig am</SortableHeader>
              <SortableHeader column="assigned_to">Zugewiesen</SortableHeader>
              <SortableHeader column="status">Status</SortableHeader>
              <th className="px-4 py-3 text-right text-xs font-bold text-[#666666] uppercase">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const taskSubtasks = subtasks.filter(s => s.task_id === task.id);
              const completedSubtasks = taskSubtasks.filter(s => s.is_completed).length;
              const assignedRole = task.assigned_to ? teamRoles.find(r => r.name === task.assigned_to) : null;
              const isSelected = selectedTasks.has(task.id);
              const isEditing = editingTask === task.id;

              return (
                <tr key={task.id} className={getRowClassName(task)}>
                  <td className="px-4 py-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(task.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-[#d4af37]" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickComplete(task);
                      }}
                      className="p-1 hover:bg-green-100 rounded-full transition-colors"
                      title={task.status === 'completed' ? 'Als offen markieren' : 'Als erledigt markieren'}
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(task.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          className="flex-1 px-2 py-1 border-2 border-[#d4af37] rounded focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(task.id)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="group flex items-center gap-2">
                        <div className="flex-1">
                          <p
                            className={`font-semibold text-[#0a253c] cursor-pointer group-hover:text-[#d4af37] ${
                              task.status === 'completed' ? 'line-through opacity-60' : ''
                            }`}
                            onClick={() => handleStartEdit(task)}
                          >
                            {task.title}
                          </p>
                          {taskSubtasks.length > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-[#d4af37] h-1.5 rounded-full transition-all"
                                  style={{
                                    width: `${(completedSubtasks / taskSubtasks.length) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-[#d4af37]">
                                {completedSubtasks}/{taskSubtasks.length}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleStartEdit(task)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                        >
                          <Pencil className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-3 py-1 bg-[#d4af37]/20 text-[#0a253c] rounded-full text-sm whitespace-nowrap">
                      {getCategoryLabel(task.category)}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${
                        task.priority === 'high'
                          ? 'bg-red-100 text-red-600'
                          : task.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {task.priority === 'high' ? 'Hoch' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {task.due_date ? (
                      <span
                        className={`whitespace-nowrap ${
                          isOverdue(task) ? 'text-red-600 font-semibold' : isToday(task) ? 'text-yellow-600 font-semibold' : 'text-[#333333]'
                        }`}
                      >
                        {new Date(task.due_date).toLocaleDateString('de-DE')}
                      </span>
                    ) : (
                      <span className="text-[#999999]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {assignedRole ? (
                      <div className="flex items-center gap-2">
                        {assignedRole.character_image ? (
                          <img
                            src={assignedRole.character_image}
                            alt={assignedRole.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-blue-600" />
                        )}
                        <span className="text-[#333333] whitespace-nowrap">{assignedRole.name}</span>
                      </div>
                    ) : (
                      <span className="text-[#999999]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={task.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(task.id, e.target.value as 'pending' | 'in_progress' | 'completed');
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`px-3 py-1 rounded-full text-sm font-semibold border-2 focus:outline-none focus:ring-2 focus:ring-[#d4af37] transition-all cursor-pointer ${
                        task.status === 'completed'
                          ? 'bg-green-100 text-green-600 border-green-200'
                          : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-600 border-blue-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      <option value="pending">Offen</option>
                      <option value="in_progress">In Bearbeitung</option>
                      <option value="completed">Erledigt</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick?.(task);
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                        title="Übersicht/Bearbeiten"
                      >
                        <Eye className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2 p-3">
        {tasks.map((task) => {
          const taskSubtasks = subtasks.filter(s => s.task_id === task.id);
          const completedSubtasks = taskSubtasks.filter(s => s.is_completed).length;
          const isSelected = selectedTasks.has(task.id);

          return (
            <SwipeableListItem
              key={task.id}
              leftActions={[
                {
                  icon: Edit,
                  label: 'Bearbeiten',
                  color: '#3B82F6',
                  onAction: () => onTaskClick?.(task),
                },
              ]}
              rightActions={[
                {
                  icon: Trash2,
                  label: 'Löschen',
                  color: '#EF4444',
                  onAction: () => handleDeleteTask(task),
                },
              ]}
            >
              <div
                className={`
                  border-2 rounded-xl p-3 transition-all hover:shadow-md active:scale-[0.98]
                  ${isSelected ? 'border-[#d4af37] bg-[#d4af37]/5' : 'border-gray-200 bg-white'}
                  ${isOverdue(task) ? 'bg-red-50/50' : isToday(task) ? 'bg-yellow-50/50' : ''}
                `}
              >
                {/* Header mit Checkboxen und Titel */}
                <div className="flex items-start gap-2 mb-2">
                <button
                  onClick={() => onToggleSelect(task.id)}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#d4af37]" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => handleQuickComplete(task)}
                  className="flex-shrink-0 p-1 hover:bg-green-50 rounded-full transition-colors"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {/* Titel - kompakt */}
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onTaskClick?.(task)}
                >
                  <p
                    className={`text-sm font-semibold text-[#0a253c] leading-tight ${
                      task.status === 'completed' ? 'line-through opacity-60' : ''
                    }`}
                  >
                    {task.title}
                  </p>
                </div>

                {/* Status Badge - rechts oben */}
                <button
                  onClick={() => onTaskClick?.(task)}
                  className="flex-shrink-0"
                >
                  <Eye className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                </button>
                </div>

                {/* Subtasks Progress - wenn vorhanden */}
                {taskSubtasks.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-[#d4af37] h-1 rounded-full transition-all"
                        style={{
                          width: `${(completedSubtasks / taskSubtasks.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[#d4af37] font-semibold">
                      {completedSubtasks}/{taskSubtasks.length}
                    </span>
                  </div>
                )}

                {/* Badges - kompakt in einer Zeile */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {task.priority === 'high' && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-md text-[10px] font-bold">
                      Hoch
                    </span>
                  )}
                  {task.due_date && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        isOverdue(task)
                          ? 'bg-red-100 text-red-700'
                          : isToday(task)
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {new Date(task.due_date).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </span>
                  )}
                </div>

                {/* Status Dropdown - kompakt */}
                <div className="flex items-center gap-2">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(task.id, e.target.value as 'pending' | 'in_progress' | 'completed')
                    }
                    onClick={(e) => e.stopPropagation()}
                    className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer min-h-[36px] ${
                      task.status === 'completed'
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : task.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    }`}
                  >
                    <option value="pending">Offen</option>
                    <option value="in_progress">In Bearbeitung</option>
                    <option value="completed">Erledigt</option>
                  </select>
                </div>
              </div>
            </SwipeableListItem>
          );
        })}
      </div>

      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        title="Aufgabe löschen?"
        message="Möchtest du diese Aufgabe wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        itemName={taskToDelete?.title}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
