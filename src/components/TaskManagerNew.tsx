import { useState } from 'react';
import { Kanban, List, Calendar, FileText, Users, TrendingUp, ClipboardList, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
import { type Task } from '../lib/supabase';
import TabContainer, { type Tab } from './common/TabContainer';
import PageHeaderWithStats, { type StatCard } from './common/PageHeaderWithStats';
import TaskKanbanTab from './Tasks/TaskKanbanTab';
import TaskListViewEnhanced from './Tasks/TaskListViewEnhanced';
import TaskCalendarTab from './Tasks/TaskCalendarTab';
import TaskTemplatesTab from './Tasks/TaskTemplatesTab';
import TaskTeamTab from './Tasks/TaskTeamTab';
import TaskProgressTab from './Tasks/TaskProgressTab';
import TaskAddModalDirect from './TaskAddModalDirect';
import FAB from './common/FAB';
import { TASK } from '../constants/terminology';
import { useToast } from '../contexts/ToastContext';

interface TaskManagerProps {
  weddingId: string;
  tasks: Task[];
  onUpdate: () => void;
}

export default function TaskManager({ weddingId, tasks, onUpdate }: TaskManagerProps) {
  const { showToast } = useToast();
  const [showAddTask, setShowAddTask] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onUpdate();
      showToast('Aufgaben aktualisiert', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
      showToast('Fehler beim Aktualisieren', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };


  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    return new Date(t.due_date) < new Date();
  }).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats: StatCard[] = [
    {
      icon: <ClipboardList className="w-6 h-6 text-white" />,
      label: `Gesamt ${TASK.PLURAL}`,
      value: totalTasks,
      subtitle: `${completionRate}% abgeschlossen`,
      color: 'yellow'
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-white" />,
      label: 'Erledigt',
      value: completedTasks,
      subtitle: totalTasks > 0 ? `${completionRate}% der ${TASK.PLURAL}` : '0%',
      color: 'green'
    },
    {
      icon: <Clock className="w-6 h-6 text-white" />,
      label: 'Offen',
      value: pendingTasks,
      subtitle: totalTasks > 0 ? `${Math.round((pendingTasks/totalTasks)*100)}% verbleibend` : '0%',
      color: 'blue'
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-white" />,
      label: 'Überfällig',
      value: overdueTasks,
      subtitle: overdueTasks > 0 ? 'Benötigt Aufmerksamkeit' : 'Keine überfälligen',
      color: 'red'
    }
  ];

  const tabs: Tab[] = [
    {
      id: 'kanban',
      label: 'Kanban',
      icon: <Kanban className="w-4 h-4" />,
      content: (
        <TaskKanbanTab
          weddingId={weddingId}
          tasks={tasks}
          onUpdate={onUpdate}
          onAddTask={() => setShowAddTask(true)}
        />
      ),
    },
    {
      id: 'list',
      label: 'Liste',
      icon: <List className="w-4 h-4" />,
      badge: tasks.length,
      content: (
        <TaskListViewEnhanced
          tasks={tasks}
          weddingId={weddingId}
          onUpdate={onUpdate}
          onAddTask={() => setShowAddTask(true)}
        />
      ),
    },
    {
      id: 'calendar',
      label: 'Kalender',
      icon: <Calendar className="w-4 h-4" />,
      content: (
        <TaskCalendarTab
          weddingId={weddingId}
          tasks={tasks}
          onUpdate={onUpdate}
        />
      ),
    },
    {
      id: 'templates',
      label: 'Vorlagen',
      icon: <FileText className="w-4 h-4" />,
      content: (
        <TaskTemplatesTab
          weddingId={weddingId}
          onUpdate={onUpdate}
        />
      ),
    },
    {
      id: 'team',
      label: 'Team',
      icon: <Users className="w-4 h-4" />,
      content: (
        <TaskTeamTab
          weddingId={weddingId}
          tasks={tasks}
          onUpdate={onUpdate}
          onAddTask={() => setShowAddTask(true)}
        />
      ),
    },
    {
      id: 'progress',
      label: 'Fortschritt',
      icon: <TrendingUp className="w-4 h-4" />,
      badge: completedTasks > 0 ? `${Math.round((completedTasks / tasks.length) * 100)}%` : undefined,
      content: <TaskProgressTab tasks={tasks} />,
    },
  ];

  return (
    <div className="space-y-6 relative min-h-screen">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="bg-floating-orb" style={{ top: '10%', left: '5%' }} />
        <div className="bg-floating-orb" style={{ top: '60%', right: '10%', animationDelay: '4s' }} />
        <div className="bg-floating-orb" style={{ bottom: '20%', left: '15%', animationDelay: '8s' }} />

        <div className="bg-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="bg-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                '--tx': `${(Math.random() - 0.5) * 100}px`,
                '--ty': `${-Math.random() * 150}px`
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10">

      <PageHeaderWithStats
        title={TASK.MODULE_NAME}
        subtitle="Organisiere deine Hochzeitsplanung"
        stats={stats}
      />

      <TabContainer
        tabs={tabs}
        defaultTab="kanban"
        storageKey={`task-tab-${weddingId}`}
        urlParam="taskTab"
      />

      <TaskAddModalDirect
        isOpen={showAddTask}
        onClose={() => {
          setShowAddTask(false);
        }}
        weddingId={weddingId}
        onSuccess={() => {
          onUpdate();
        }}
      />

      <FAB
        onClick={() => setShowAddTask(true)}
        icon={Plus}
        label="Aufgabe hinzufügen"
        position="bottom-right"
        variant="primary"
        showOnMobile={true}
        showOnDesktop={false}
      />
      </div>
    </div>
  );
}
