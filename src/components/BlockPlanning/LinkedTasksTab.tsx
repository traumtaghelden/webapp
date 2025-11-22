import { useState, useEffect } from 'react';
import { Plus, X, CheckSquare, Calendar, User, Tag, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Task } from '../../lib/supabase';

interface LinkedTasksTabProps {
  eventId: string;
  weddingId: string;
  onUpdate: () => void;
}

export default function LinkedTasksTab({ eventId, weddingId, onUpdate }: LinkedTasksTabProps) {
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    loadTasks();
  }, [eventId, weddingId]);

  const loadTasks = async () => {
    setLoading(true);

    const [linkedRes, availableRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('timeline_event_id', eventId)
        .order('due_date', { ascending: true }),
      supabase
        .from('tasks')
        .select('*')
        .eq('wedding_id', weddingId)
        .is('timeline_event_id', null)
        .order('due_date', { ascending: true }),
    ]);

    if (!linkedRes.error) setLinkedTasks(linkedRes.data || []);
    if (!availableRes.error) setAvailableTasks(availableRes.data || []);

    setLoading(false);
  };

  const handleAssignTasks = async () => {
    if (selectedTaskIds.length === 0) return;

    const updates = selectedTaskIds.map((taskId) =>
      supabase.from('tasks').update({ timeline_event_id: eventId }).eq('id', taskId)
    );

    await Promise.all(updates);

    setShowAssignModal(false);
    setSelectedTaskIds([]);
    setSearchQuery('');
    loadTasks();
    onUpdate();
  };

  const handleUnassignTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ timeline_event_id: null })
      .eq('id', taskId);

    if (!error) {
      loadTasks();
      onUpdate();
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-orange-100 text-orange-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
    };
    const labels = {
      pending: 'Ausstehend',
      in_progress: 'In Bearbeit.',
      completed: 'Erledigt',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700',
    };
    const labels = {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[priority as keyof typeof styles]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

  const filteredLinkedTasks =
    filter === 'all' ? linkedTasks : linkedTasks.filter((t) => t.status === filter);

  const filteredAvailableTasks = availableTasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedCount = linkedTasks.filter((t) => t.status === 'completed').length;
  const progressPercentage = linkedTasks.length > 0 ? (completedCount / linkedTasks.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Verknüpfte Aufgaben</h3>
          <p className="text-sm text-gray-600 mt-1">
            {linkedTasks.length} Aufgaben diesem Event zugeordnet
          </p>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Aufgaben zuweisen
        </button>
      </div>

      {linkedTasks.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {completedCount} von {linkedTasks.length} erledigt
            </span>
            <span className="text-sm font-medium text-blue-600">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-white rounded-full h-2">
            <div
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' && 'Alle'}
            {status === 'pending' && 'Ausstehend'}
            {status === 'in_progress' && 'In Bearbeitung'}
            {status === 'completed' && 'Erledigt'}
          </button>
        ))}
      </div>

      {filteredLinkedTasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">
            {filter === 'all'
              ? 'Noch keine Aufgaben zugeordnet'
              : 'Keine Aufgaben mit diesem Status'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Erste Aufgabe zuweisen
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLinkedTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h4 className="font-semibold text-gray-900 text-lg flex-1">{task.title}</h4>
                <button
                  onClick={() => handleUnassignTask(task.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  title="Zuordnung entfernen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {getStatusBadge(task.status)}
                {getPriorityBadge(task.priority)}
                {task.category && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {task.category}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {task.due_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(task.due_date).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {task.assigned_to && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>{task.assigned_to}</span>
                  </div>
                )}
              </div>

              {task.notes && (
                <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200">
                  {task.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Aufgaben zuweisen</h3>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTaskIds([]);
                    setSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Aufgaben durchsuchen..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {filteredAvailableTasks.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    {searchQuery
                      ? 'Keine Aufgaben gefunden'
                      : 'Alle Aufgaben sind bereits zugeordnet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableTasks.map((task) => (
                    <label
                      key={task.id}
                      className="flex items-start gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTaskIds([...selectedTaskIds, task.id]);
                          } else {
                            setSelectedTaskIds(selectedTaskIds.filter((id) => id !== task.id));
                          }
                        }}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {getStatusBadge(task.status)}
                          {task.category && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              {task.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTaskIds([]);
                    setSearchQuery('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleAssignTasks}
                  disabled={selectedTaskIds.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedTaskIds.length} Aufgabe{selectedTaskIds.length !== 1 ? 'n' : ''}{' '}
                  zuweisen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
