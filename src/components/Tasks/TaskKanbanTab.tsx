import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Circle, Clock, AlertCircle, ChevronDown, ChevronRight, GripVertical, Eye } from 'lucide-react';
import { supabase, type Task, type TaskSubtask } from '../../lib/supabase';
import TaskDetailModal from '../TaskDetailModal';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '../../contexts/ToastContext';

interface TaskKanbanTabProps {
  weddingId: string;
  tasks: Task[];
  onUpdate: () => void;
  onAddTask: () => void;
}

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
}

function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[300px] transition-colors rounded-xl p-4 ${
        isOver ? 'bg-[#d4af37]/10 ring-2 ring-[#d4af37]' : 'bg-white'
      }`}
    >
      {children}
    </div>
  );
}

function SortableTaskCard({ task, onClick, isDragging, activeId }: { task: Task; onClick: () => void; isDragging: boolean; activeId: string | null }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`relative p-4 mb-3 rounded-xl bg-[#f7f2eb] hover:bg-[#d4af37]/10 transition-all group shadow-sm hover:shadow-md ${
        isDragging && activeId === task.id ? 'opacity-50 scale-95' : ''
      } ${
        isOverdue ? 'border-2 border-red-400' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-1 hover:text-[#d4af37] transition-all group-hover:scale-125 duration-200 touch-none"
          title="⬍⬍ Ziehen zum Verschieben ⬍⬍"
        >
          <GripVertical className="w-6 h-6 text-[#666666] group-hover:text-[#d4af37] transition-colors" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-bold text-[#0a253c] flex-1">{task.title}</h4>
            <div className="flex items-center gap-2">
              {task.priority === 'high' && (
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onClick();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white rounded-lg z-10"
                title="Details anzeigen"
              >
                <Eye className="w-4 h-4 text-[#666666] hover:text-[#d4af37]" />
              </button>
            </div>
          </div>
          {task.due_date && (
            <div className="flex items-center gap-2 text-sm text-[#666666] mb-2">
              <Clock className="w-4 h-4" />
              {new Date(task.due_date).toLocaleDateString('de-DE')}
            </div>
          )}
          {task.assigned_to && (
            <div className="text-xs bg-[#d4af37]/20 text-[#0a253c] px-2 py-1 rounded-full inline-block">
              {task.assigned_to}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaskKanbanTab({ weddingId, tasks, onUpdate, onAddTask }: TaskKanbanTabProps) {
  const { showToast } = useToast();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Collapsed state for mobile - default all collapsed
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({
    pending: true,
    in_progress: true,
    completed: true,
  });

  const toggleColumn = (columnId: string) => {
    setCollapsedColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  const statusColumns = [
    { id: 'pending', label: 'Ausstehend', icon: Circle, color: 'text-gray-300' },
    { id: 'in_progress', label: 'In Bearbeitung', icon: Clock, color: 'text-blue-400' },
    { id: 'completed', label: 'Abgeschlossen', icon: CheckCircle, color: 'text-green-400' },
  ];

  const groupedTasks: Record<string, Task[]> = {
    pending: tasks.filter(t => t.status === 'pending').sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    in_progress: tasks.filter(t => t.status === 'in_progress').sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    completed: tasks.filter(t => t.status === 'completed').sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);

    if (!over || active.id === over.id) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    const overId = over.id.toString();
    let newStatus: 'pending' | 'in_progress' | 'completed';
    let targetStatus: string;

    if (overId.startsWith('droppable-')) {
      targetStatus = overId.replace('droppable-', '');
      newStatus = targetStatus as 'pending' | 'in_progress' | 'completed';
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
        targetStatus = overTask.status;
      } else {
        return;
      }
    }

    const isSameColumn = activeTask.status === newStatus;

    try {
      if (isSameColumn) {
        const columnTasks = groupedTasks[activeTask.status] || [];
        const oldIndex = columnTasks.findIndex(t => t.id === active.id);
        const newIndex = columnTasks.findIndex(t => t.id === overId);

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        const reorderedTasks = arrayMove(columnTasks, oldIndex, newIndex);

        const updates = reorderedTasks.map((task, index) => ({
          id: task.id,
          order_index: index,
        }));

        const updatePromises = updates.map(update =>
          supabase.from('tasks').update({ order_index: update.order_index }).eq('id', update.id)
        );

        await Promise.all(updatePromises);
        showToast('success', 'Position gespeichert', 'Aufgabe wurde erfolgreich verschoben.');
      } else {
        const targetColumnTasks = groupedTasks[targetStatus] || [];
        const newOrderIndex = targetColumnTasks.length;

        await supabase
          .from('tasks')
          .update({ status: newStatus, order_index: newOrderIndex })
          .eq('id', active.id);

        showToast('success', 'Status aktualisiert', `Aufgabe wurde zu "${newStatus === 'pending' ? 'Ausstehend' : newStatus === 'in_progress' ? 'In Bearbeitung' : 'Abgeschlossen'}" verschoben.`);
      }

      onUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('error', 'Fehler', 'Aufgabe konnte nicht verschoben werden. Bitte versuche es erneut.');
      onUpdate();
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Kanban Board</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onAddTask();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F5B800] to-[#f4d03f] text-gray-900 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            Aufgabe hinzufügen
          </button>
        </div>

        <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid md:grid-cols-3 gap-6">
          {statusColumns.map(({ id, label, icon: Icon, color }) => {
            const columnTasks = groupedTasks[id] || [];
            const isCollapsed = collapsedColumns[id];

            return (
              <div key={id} className="space-y-3">
                {/* Header with collapse toggle (mobile only) */}
                <button
                  onClick={() => toggleColumn(id)}
                  className="w-full flex items-center gap-3 mb-4 md:cursor-default"
                >
                  {/* Chevron icon - only visible on mobile */}
                  <div className="md:hidden">
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5 text-white" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <Icon className={`w-5 h-5 ${color}`} />
                  <h4 className="font-bold text-white">{label}</h4>
                  <span className="px-2 py-1 bg-[#F5B800]/30 text-white rounded-full text-sm font-bold">
                    {columnTasks.length}
                  </span>
                </button>

                {/* Content - collapsible on mobile, always visible on desktop */}
                <div className={`${isCollapsed ? 'hidden md:block' : 'block'}`}>
                  <DroppableColumn id={id}>
                    <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      {columnTasks.map(task => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          onClick={() => setSelectedTask(task)}
                          isDragging={isDragging}
                          activeId={activeId}
                        />
                      ))}
                    </SortableContext>
                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      Keine Aufgaben
                    </div>
                  )}
                  </DroppableColumn>
                </div>
              </div>
            );
          })}
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="p-4 rounded-xl bg-[#f7f2eb] shadow-2xl border-2 border-[#d4af37] opacity-90 scale-105 rotate-3 cursor-grabbing">
              <div className="flex items-start gap-3">
                <GripVertical className="w-6 h-6 text-[#d4af37]" />
                <div className="flex-1">
                  <p className="font-semibold text-[#0a253c]">
                    {tasks.find(t => t.id === activeId)?.title || 'Aufgabe'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
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
    </>
  );
}
