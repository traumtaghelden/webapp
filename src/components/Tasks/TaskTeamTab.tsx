import { useState, useEffect, useMemo } from 'react';
import {
  Users, User, CheckCircle, Clock, Circle, ChevronDown, ChevronUp,
  Plus, Download, Mail, Phone, Edit, Eye, Trash2, AlertCircle,
  Filter, SortAsc, SortDesc, Trophy, Award, Medal, GripVertical,
  ArrowRight, FileText
} from 'lucide-react';
import { type Task, type WeddingTeamRole } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskDetailModal from '../TaskDetailModal';
import TaskAddModalDirect from '../TaskAddModalDirect';
import { useToast } from '../../contexts/ToastContext';

interface TaskTeamTabProps {
  weddingId: string;
  tasks: Task[];
  onUpdate: () => void;
  onAddTask?: () => void;
}

type SortOption = 'status' | 'priority' | 'due_date' | 'created_at';
type FilterOption = 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue' | 'high_priority';

interface DroppablePersonCardProps {
  id: string;
  children: React.ReactNode;
}

function DroppablePersonCard({ id, children }: DroppablePersonCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `person-${id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all ${isOver ? 'ring-4 ring-[#d4af37] ring-opacity-50' : ''}`}
    >
      {children}
    </div>
  );
}

function SortableDraggableTask({ task, onView }: { task: Task; onView: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg flex items-start gap-2 ${
        isOverdue ? 'bg-red-50 border-2 border-red-300' : 'bg-[#f7f2eb] hover:bg-[#d4af37]/10'
      } transition-all group`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing mt-1 touch-none"
      >
        <GripVertical className="w-4 h-4 text-[#666666] group-hover:text-[#d4af37]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className="font-semibold text-[#0a253c] text-sm leading-tight line-clamp-2"
              title={task.title}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word'
              }}
            >
              {task.title}
            </p>
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-[#666666] mt-1">
                <Clock className="w-3 h-3" />
                {new Date(task.due_date).toLocaleDateString('de-DE')}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {task.priority === 'high' && (
              <AlertCircle className="w-4 h-4 text-red-500" title="Hohe Priorität" />
            )}
            <button
              onClick={onView}
              className="p-1 hover:bg-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Details anzeigen"
            >
              <Eye className="w-4 h-4 text-[#666666] hover:text-[#d4af37]" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            task.status === 'completed' ? 'bg-green-100 text-green-700' :
            task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {task.status === 'completed' ? 'Fertig' :
             task.status === 'in_progress' ? 'Aktiv' : 'Offen'}
          </span>
          {task.priority && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              task.priority === 'high' ? 'bg-red-100 text-red-700' :
              task.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {task.priority === 'high' ? 'Hoch' :
               task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaskTeamTab({ weddingId, tasks, onUpdate, onAddTask }: TaskTeamTabProps) {
  const { showToast } = useToast();
  const [teamRoles, setTeamRoles] = useState<WeddingTeamRole[]>([]);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [preassignedPerson, setPreassignedPerson] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('due_date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    loadTeamRoles();
  }, [weddingId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        setExpandedPerson(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (onAddTask) onAddTask();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        setShowLeaderboard(!showLeaderboard);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAddTask, showLeaderboard]);

  const loadTeamRoles = async () => {
    try {
      const { data } = await supabase
        .from('wedding_team_roles')
        .select('*')
        .eq('wedding_id', weddingId);

      if (data) {
        setTeamRoles(data);
      }
    } catch (error) {
      console.error('Error loading team roles:', error);
    }
  };

  const getTasksForPerson = (personName: string) => {
    let personTasks = tasks.filter(t => t.assigned_to === personName);

    if (filterBy !== 'all') {
      personTasks = personTasks.filter(task => {
        switch (filterBy) {
          case 'pending':
            return task.status === 'pending';
          case 'in_progress':
            return task.status === 'in_progress';
          case 'completed':
            return task.status === 'completed';
          case 'overdue':
            return task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
          case 'high_priority':
            return task.priority === 'high';
          default:
            return true;
        }
      });
    }

    personTasks.sort((a, b) => {
      switch (sortBy) {
        case 'status': {
          const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        }
        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return personTasks;
  };

  const getPersonStats = (personName: string) => {
    const personTasks = tasks.filter(t => t.assigned_to === personName);
    const now = new Date();
    return {
      total: personTasks.length,
      completed: personTasks.filter(t => t.status === 'completed').length,
      inProgress: personTasks.filter(t => t.status === 'in_progress').length,
      pending: personTasks.filter(t => t.status === 'pending').length,
      overdue: personTasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed').length,
    };
  };

  const unassignedTasks = useMemo(() => {
    let filtered = tasks.filter(t => !t.assigned_to);

    if (filterBy !== 'all') {
      filtered = filtered.filter(task => {
        switch (filterBy) {
          case 'pending':
            return task.status === 'pending';
          case 'in_progress':
            return task.status === 'in_progress';
          case 'completed':
            return task.status === 'completed';
          case 'overdue':
            return task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
          case 'high_priority':
            return task.priority === 'high';
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [tasks, filterBy]);

  const leaderboardData = useMemo(() => {
    return teamRoles.map(role => {
      const stats = getPersonStats(role.name);
      const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
      return {
        ...role,
        stats,
        completionRate,
        score: stats.completed * 10 + completionRate,
      };
    }).sort((a, b) => b.score - a.score);
  }, [teamRoles, tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id.toString();
    const overId = over.id.toString();

    if (overId.startsWith('person-')) {
      const personId = overId.replace('person-', '');
      const person = teamRoles.find(r => r.id === personId);

      if (person) {
        try {
          const { error } = await supabase
            .from('tasks')
            .update({ assigned_to: person.name })
            .eq('id', taskId);

          if (error) throw error;

          showToast('success', 'Aufgabe zugewiesen', `Aufgabe wurde ${person.name} zugewiesen.`);
          onUpdate();
        } catch (error) {
          console.error('Error assigning task:', error);
          showToast('error', 'Fehler', 'Aufgabe konnte nicht zugewiesen werden.');
        }
      }
    } else if (overId === 'unassigned') {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ assigned_to: null })
          .eq('id', taskId);

        if (error) throw error;

        showToast('success', 'Zuweisung entfernt', 'Aufgabe wurde zurück zu "Nicht zugewiesen" verschoben.');
        onUpdate();
      } catch (error) {
        console.error('Error unassigning task:', error);
        showToast('error', 'Fehler', 'Zuweisung konnte nicht entfernt werden.');
      }
    }
  };

  const handleAddTaskForPerson = (personName: string) => {
    setPreassignedPerson(personName);
    setShowAddTaskModal(true);
  };

  const handleBatchAssign = async (personName: string) => {
    if (selectedTasks.size === 0) return;

    try {
      const taskIds = Array.from(selectedTasks);
      const { error } = await supabase
        .from('tasks')
        .update({ assigned_to: personName })
        .in('id', taskIds);

      if (error) throw error;

      showToast('success', 'Aufgaben zugewiesen', `${selectedTasks.size} Aufgaben wurden ${personName} zugewiesen.`);
      setSelectedTasks(new Set());
      setShowBatchActions(false);
      onUpdate();
    } catch (error) {
      console.error('Error batch assigning:', error);
      showToast('error', 'Fehler', 'Aufgaben konnten nicht zugewiesen werden.');
    }
  };

  const exportPersonTasksToPDF = (personName: string) => {
    const personTasks = getTasksForPerson(personName);
    const stats = getPersonStats(personName);

    const content = `
AUFGABENLISTE - ${personName}
${'='.repeat(50)}

STATISTIKEN:
- Gesamt: ${stats.total}
- Abgeschlossen: ${stats.completed}
- In Bearbeitung: ${stats.inProgress}
- Ausstehend: ${stats.pending}
- Überfällig: ${stats.overdue}

AUFGABEN:
${'='.repeat(50)}

${personTasks.map((task, idx) => `
${idx + 1}. ${task.title}
   Status: ${task.status === 'completed' ? 'Abgeschlossen' : task.status === 'in_progress' ? 'In Bearbeitung' : 'Ausstehend'}
   Priorität: ${task.priority === 'high' ? 'Hoch' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
   Kategorie: ${task.category}
   ${task.due_date ? `Fällig: ${new Date(task.due_date).toLocaleDateString('de-DE')}` : 'Kein Fälligkeitsdatum'}
   ${task.notes ? `Notizen: ${task.notes}` : ''}
`).join('\n')}

${'='.repeat(50)}
Erstellt am: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aufgaben-${personName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('success', 'Export erfolgreich', `Aufgabenliste für ${personName} wurde exportiert.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white">Team-Übersicht</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
              showLeaderboard
                ? 'bg-[#d4af37] text-white'
                : 'bg-gray-100 text-[#666666] hover:bg-gray-200'
            }`}
            title="Leaderboard anzeigen (Strg+L)"
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>
        </div>
      </div>

      {showLeaderboard && (
        <div className="bg-gradient-to-br from-[#0a253c] to-[#1a3a5c] rounded-2xl p-6 shadow-xl">
          <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#d4af37]" />
            Team Leaderboard
          </h4>
          <div className="space-y-3">
            {leaderboardData.map((member, index) => (
              <div
                key={member.id}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#d4af37]/20">
                  {index === 0 && <Trophy className="w-6 h-6 text-yellow-400" />}
                  {index === 1 && <Award className="w-6 h-6 text-gray-300" />}
                  {index === 2 && <Medal className="w-6 h-6 text-orange-400" />}
                  {index > 2 && <span className="text-white font-bold">{index + 1}</span>}
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-white">{member.name}</h5>
                  <p className="text-sm text-white/70">{member.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#d4af37]">{member.stats.completed}</p>
                  <p className="text-xs text-white/70">Abgeschlossen</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{Math.round(member.completionRate)}%</p>
                  <p className="text-xs text-white/70">Fortschritt</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-lg space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#666666]" />
            <span className="text-sm font-semibold text-[#666666]">Filter:</span>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="px-3 py-1 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#d4af37]"
            >
              <option value="all">Alle</option>
              <option value="pending">Ausstehend</option>
              <option value="in_progress">In Bearbeitung</option>
              <option value="completed">Abgeschlossen</option>
              <option value="overdue">Überfällig</option>
              <option value="high_priority">Hohe Priorität</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-[#666666]" />
            <span className="text-sm font-semibold text-[#666666]">Sortierung:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#d4af37]"
            >
              <option value="due_date">Fälligkeit</option>
              <option value="priority">Priorität</option>
              <option value="status">Status</option>
              <option value="created_at">Erstellt am</option>
            </select>
          </div>
          {selectedTasks.size > 0 && (
            <button
              onClick={() => setShowBatchActions(!showBatchActions)}
              className="ml-auto px-4 py-2 bg-[#d4af37] text-white rounded-lg font-semibold hover:bg-[#c19a2e] transition-all"
            >
              {selectedTasks.size} ausgewählt - Zuweisen
            </button>
          )}
        </div>
      </div>

      {showBatchActions && selectedTasks.size > 0 && (
        <div className="bg-[#d4af37]/10 border-2 border-[#d4af37] rounded-xl p-4">
          <h4 className="font-bold text-[#0a253c] mb-3">
            {selectedTasks.size} Aufgabe(n) zuweisen an:
          </h4>
          <div className="flex flex-wrap gap-2">
            {teamRoles.map(role => (
              <button
                key={role.id}
                onClick={() => handleBatchAssign(role.name)}
                className="px-4 py-2 bg-white border-2 border-[#d4af37] text-[#0a253c] rounded-lg font-semibold hover:bg-[#d4af37] hover:text-white transition-all"
              >
                {role.name}
              </button>
            ))}
            <button
              onClick={() => {
                setSelectedTasks(new Set());
                setShowBatchActions(false);
              }}
              className="px-4 py-2 bg-gray-100 text-[#666666] rounded-lg font-semibold hover:bg-gray-200 transition-all"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamRoles.map(role => {
            const stats = getPersonStats(role.name);
            const completionRate = stats.total > 0
              ? Math.round((stats.completed / stats.total) * 100)
              : 0;
            const personTasks = getTasksForPerson(role.name);
            const isExpanded = expandedPerson === role.id;

            return (
              <DroppablePersonCard key={role.id} id={role.id}>
                <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-[#d4af37]/30 hover:border-[#d4af37] transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-[#d4af37]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#0a253c] truncate" title={role.name}>
                        {role.name}
                      </h4>
                      <p className="text-sm text-[#666666]">{role.role}</p>
                    </div>
                  </div>

                  {role.email && (
                    <a
                      href={`mailto:${role.email}`}
                      className="flex items-center gap-2 text-sm text-[#666666] hover:text-[#d4af37] mb-2 transition-colors"
                      title="E-Mail senden"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{role.email}</span>
                    </a>
                  )}

                  {role.phone && (
                    <a
                      href={`tel:${role.phone}`}
                      className="flex items-center gap-2 text-sm text-[#666666] hover:text-[#d4af37] mb-3 transition-colors"
                      title="Anrufen"
                    >
                      <Phone className="w-4 h-4" />
                      {role.phone}
                    </a>
                  )}

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#666666]">Fortschritt</span>
                      <span className="font-bold text-[#d4af37]">{completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] h-2 rounded-full transition-all"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-green-50 rounded-lg" title="Abgeschlossene Aufgaben">
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto mb-1" />
                      <div className="text-sm font-bold text-green-600">{stats.completed}</div>
                      <div className="text-xs text-[#666666]">Fertig</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded-lg" title="Aufgaben in Bearbeitung">
                      <Clock className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <div className="text-sm font-bold text-blue-600">{stats.inProgress}</div>
                      <div className="text-xs text-[#666666]">Aktiv</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg" title="Ausstehende Aufgaben">
                      <Circle className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                      <div className="text-sm font-bold text-gray-600">{stats.pending}</div>
                      <div className="text-xs text-[#666666]">Offen</div>
                    </div>
                  </div>

                  {stats.overdue > 0 && (
                    <div className="mb-4 p-2 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-semibold text-red-600">
                        {stats.overdue} überfällige Aufgabe{stats.overdue !== 1 ? 'n' : ''}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setExpandedPerson(isExpanded ? null : role.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#f7f2eb] hover:bg-[#d4af37]/20 rounded-lg transition-all font-semibold text-sm"
                      title={isExpanded ? 'Weniger anzeigen' : 'Alle Aufgaben anzeigen'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isExpanded ? 'Weniger' : `Alle ${personTasks.length}`}
                    </button>
                    <button
                      onClick={() => handleAddTaskForPerson(role.name)}
                      className="p-2 bg-[#d4af37] hover:bg-[#c19a2e] text-white rounded-lg transition-all"
                      title="Neue Aufgabe für diese Person erstellen"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => exportPersonTasksToPDF(role.name)}
                      className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
                      title="Aufgabenliste exportieren"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pt-4 border-t-2 border-[#f7f2eb] max-h-[400px] overflow-y-auto">
                      <div className="space-y-2">
                        <SortableContext items={personTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                          {personTasks.length > 0 ? (
                            personTasks.map(task => (
                              <SortableDraggableTask
                                key={task.id}
                                task={task}
                                onView={() => setSelectedTask(task)}
                              />
                            ))
                          ) : (
                            <div className="text-center py-6 text-[#999999]">
                              Keine Aufgaben mit aktuellen Filtern
                            </div>
                          )}
                        </SortableContext>
                      </div>
                    </div>
                  )}
                </div>
              </DroppablePersonCard>
            );
          })}

          <DroppablePersonCard id="unassigned">
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-300 hover:border-[#d4af37] transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0a253c]">Nicht zugewiesen</h4>
                  <p className="text-sm text-[#666666]">Ohne Verantwortlichen</p>
                </div>
              </div>

              <div className="text-center py-4 mb-4">
                <div className="text-4xl font-bold text-gray-500 mb-2">
                  {unassignedTasks.length}
                </div>
                <p className="text-sm text-[#666666]">Aufgaben</p>
              </div>

              {unassignedTasks.length > 0 && (
                <div>
                  <button
                    onClick={() => setExpandedPerson(expandedPerson === 'unassigned' ? null : 'unassigned')}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#f7f2eb] hover:bg-gray-200 rounded-lg transition-all font-semibold text-sm mb-3"
                  >
                    {expandedPerson === 'unassigned' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {expandedPerson === 'unassigned' ? 'Weniger' : 'Alle anzeigen'}
                  </button>

                  {expandedPerson === 'unassigned' && (
                    <div className="max-h-[400px] overflow-y-auto">
                      <div className="space-y-2">
                        <SortableContext items={unassignedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                          {unassignedTasks.map(task => {
                            const isSelected = selectedTasks.has(task.id);
                            return (
                              <div key={task.id} className="relative">
                                <label className="flex items-start gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      const newSelected = new Set(selectedTasks);
                                      if (isSelected) {
                                        newSelected.delete(task.id);
                                      } else {
                                        newSelected.add(task.id);
                                      }
                                      setSelectedTasks(newSelected);
                                    }}
                                    className="mt-3 w-4 h-4 text-[#d4af37] border-gray-300 rounded focus:ring-[#d4af37]"
                                  />
                                  <div className="flex-1">
                                    <SortableDraggableTask
                                      task={task}
                                      onView={() => setSelectedTask(task)}
                                    />
                                  </div>
                                </label>
                              </div>
                            );
                          })}
                        </SortableContext>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DroppablePersonCard>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="p-3 rounded-lg bg-white shadow-2xl border-2 border-[#d4af37] opacity-90 rotate-3">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-[#d4af37]" />
                <p className="font-semibold text-[#0a253c]">
                  {tasks.find(t => t.id === activeId)?.title || 'Aufgabe'}
                </p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {teamRoles.length === 0 && (
        <div className="bg-[#f7f2eb] rounded-2xl p-8 text-center">
          <Users className="w-16 h-16 text-[#d4af37] mx-auto mb-4 opacity-50" />
          <p className="text-[#666666] text-lg mb-2">Noch keine Team-Mitglieder</p>
          <p className="text-sm text-[#999999] mb-4">
            Füge Trauzeugen, Helfer und andere Team-Mitglieder in den Einstellungen hinzu
          </p>
          <button
            onClick={() => window.location.hash = '#settings'}
            className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all inline-flex items-center gap-2 min-h-[40px]"
          >
            <ArrowRight className="w-4 h-4" />
            Zu den Einstellungen
          </button>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          taskId={selectedTask.id}
          weddingId={weddingId}
          onUpdate={onUpdate}
        />
      )}

      {showAddTaskModal && (
        <TaskAddModalDirect
          isOpen={showAddTaskModal}
          onClose={() => {
            setShowAddTaskModal(false);
            setPreassignedPerson(null);
          }}
          weddingId={weddingId}
          onSuccess={() => {
            onUpdate();
            setShowAddTaskModal(false);
            setPreassignedPerson(null);
          }}
          prefilledData={preassignedPerson ? { assigned_to: preassignedPerson } : undefined}
        />
      )}
    </div>
  );
}
