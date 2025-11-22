import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, Clock, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TimelineEvent, TimelineBlockSubtask } from '../../lib/supabase';

interface SubTimelineTabProps {
  event: TimelineEvent;
  onUpdate: () => void;
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export default function SubTimelineTab({
  event,
  onUpdate,
  onUnsavedChanges,
}: SubTimelineTabProps) {
  const [subtasks, setSubtasks] = useState<TimelineBlockSubtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<TimelineBlockSubtask | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    start_offset_minutes: 0,
    duration_minutes: 15,
    description: '',
    assigned_to: '',
  });

  useEffect(() => {
    loadSubtasks();
  }, [event.id]);

  const loadSubtasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('timeline_block_subtasks')
      .select('*')
      .eq('block_id', event.id)
      .order('start_offset_minutes', { ascending: true });

    if (!error && data) {
      setSubtasks(data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.title.trim()) return;

    const newSubtask = {
      block_id: event.id,
      ...formData,
      order_index: subtasks.length,
    };

    const { error } = await supabase.from('timeline_block_subtasks').insert(newSubtask);

    if (!error) {
      setShowAddModal(false);
      resetForm();
      loadSubtasks();
      onUpdate();
    }
  };

  const handleUpdate = async () => {
    if (!editingSubtask || !formData.title.trim()) return;

    const { error } = await supabase
      .from('timeline_block_subtasks')
      .update(formData)
      .eq('id', editingSubtask.id);

    if (!error) {
      setShowAddModal(false);
      setEditingSubtask(null);
      resetForm();
      loadSubtasks();
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Diesen Sub-Event wirklich löschen?')) return;

    const { error } = await supabase.from('timeline_block_subtasks').delete().eq('id', id);

    if (!error) {
      loadSubtasks();
      onUpdate();
    }
  };

  const handleEdit = (subtask: TimelineBlockSubtask) => {
    setEditingSubtask(subtask);
    setFormData({
      title: subtask.title,
      start_offset_minutes: subtask.start_offset_minutes,
      duration_minutes: subtask.duration_minutes,
      description: subtask.description,
      assigned_to: subtask.assigned_to,
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    const lastSubtaskEndTime = subtasks.length > 0
      ? Math.max(...subtasks.map(s => s.start_offset_minutes + s.duration_minutes))
      : 0;

    setFormData({
      title: '',
      start_offset_minutes: lastSubtaskEndTime,
      duration_minutes: 15,
      description: '',
      assigned_to: '',
    });
  };

  const checkTimeConflict = () => {
    const endOffset = formData.start_offset_minutes + formData.duration_minutes;
    return endOffset > event.duration_minutes;
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let i = 0; i <= event.duration_minutes; i += 5) {
      options.push(i);
    }
    return options;
  };

  const calculateAbsoluteTime = (offsetMinutes: number) => {
    const [hours, minutes] = event.time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + offsetMinutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  };

  // Generate time markers every 15 minutes
  const generateTimeMarkers = () => {
    const markers = [];
    const totalMinutes = event.duration_minutes;
    const intervalMinutes = 15;
    const pixelsPerMinute = 600 / totalMinutes; // 600px total height

    for (let i = 0; i <= totalMinutes; i += intervalMinutes) {
      const absoluteTime = calculateAbsoluteTime(i);
      const topPosition = i * pixelsPerMinute;

      markers.push(
        <div
          key={i}
          className="absolute left-0 right-0 flex items-center"
          style={{ top: `${topPosition}px` }}
        >
          <div className="w-12 sm:w-20 text-[10px] sm:text-xs font-medium text-gray-700 pr-1 sm:pr-3 text-right bg-white">
            {absoluteTime}
          </div>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>
      );
    }

    return markers;
  };

  // Render subtasks positioned by their offset
  const renderSubtasks = () => {
    if (subtasks.length === 0) return null;

    const totalMinutes = event.duration_minutes;
    const pixelsPerMinute = 600 / totalMinutes; // 600px total height

    return subtasks.map((subtask) => {
      const topPosition = subtask.start_offset_minutes * pixelsPerMinute;
      const height = subtask.duration_minutes * pixelsPerMinute;
      const absoluteTime = calculateAbsoluteTime(subtask.start_offset_minutes);

      return (
        <div
          key={subtask.id}
          className="absolute left-12 sm:left-20 right-0 transition-all duration-300"
          style={{
            top: `${topPosition}px`,
            height: `${Math.max(height, 60)}px`, // Minimum 60px height for visibility
          }}
        >
          <div className="h-full bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl border-2 border-[#d4af37]/30 hover:border-[#d4af37]/60 hover:shadow-lg hover:shadow-[#d4af37]/10 transition-all p-2 sm:p-3 overflow-hidden flex flex-col">
            <div className="flex items-start justify-between gap-1 sm:gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <span className="inline-flex items-center justify-center h-5 sm:h-6 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white text-[10px] sm:text-xs font-semibold rounded-full px-2 sm:px-3">
                    {absoluteTime}
                  </span>
                  <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                    {subtask.title}
                  </h4>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>{subtask.duration_minutes} Min</span>
                  {subtask.assigned_to && (
                    <>
                      <span className="text-gray-400 hidden sm:inline">•</span>
                      <span className="truncate hidden sm:inline">{subtask.assigned_to}</span>
                    </>
                  )}
                </div>

                {subtask.description && height > 80 && (
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-1 line-clamp-2 hidden sm:block">
                    {subtask.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEdit(subtask)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Bearbeiten"
                >
                  <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(subtask.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Löschen"
                >
                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Minutengenaue Timeline</h3>
          <p className="text-sm text-gray-600 mt-1">
            Planen Sie den genauen Ablauf innerhalb dieses Event-Blocks
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSubtask(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#d4af37] hover:bg-[#c19a2e] text-gray-900 font-medium rounded-lg transition-all min-h-[40px]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Hinzufügen</span>
        </button>
      </div>

      {subtasks.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Noch keine Sub-Events erstellt</p>
          <button
            onClick={() => {
              setEditingSubtask(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="text-[#d4af37] hover:text-[#c19a2e] font-medium transition-colors"
          >
            Erstes Sub-Event hinzufügen
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-3 sm:p-6">
          <div className="relative" style={{ minHeight: '400px', maxHeight: '600px' }}>
            {/* Time markers */}
            {generateTimeMarkers()}

            {/* Subtasks */}
            {renderSubtasks()}
          </div>
        </div>
      )}

      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white">
                {editingSubtask ? 'Sub-Event bearbeiten' : 'Neues Sub-Event'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSubtask(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Titel <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="z.B. Einzug Braut"
                  className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all min-h-[44px]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-white mb-2">
                    Start (Min) <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.start_offset_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        start_offset_minutes: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 text-sm sm:text-base text-white focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all min-h-[44px]"
                  >
                    {generateTimeOptions().map((minutes) => (
                      <option key={minutes} value={minutes}>
                        +{minutes} Min → {calculateAbsoluteTime(minutes)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-white mb-2">
                    Dauer (Min) <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })
                    }
                    className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 text-sm sm:text-base text-white focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all min-h-[44px]"
                  >
                    {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} Min
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {checkTimeConflict() && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 sm:p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-red-200">
                    Warnung: Dieses Sub-Event würde über die Event-Endzeit hinausgehen!
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-white mb-2">
                  Verantwortliche Person
                </label>
                <input
                  type="text"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  placeholder="z.B. Trauzeuge"
                  className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 text-sm sm:text-base text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-white mb-2">
                  Notizen
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Zusätzliche Informationen"
                  rows={3}
                  className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 text-sm sm:text-base text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSubtask(null);
                    resetForm();
                  }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-lg text-gray-300 border border-gray-600 hover:bg-gray-700/30 transition-all min-h-[44px]"
                >
                  Abbrechen
                </button>
                <button
                  onClick={editingSubtask ? handleUpdate : handleAdd}
                  disabled={!formData.title.trim() || checkTimeConflict()}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-lg bg-[#d4af37] hover:bg-[#c19a2e] text-gray-900 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {editingSubtask ? 'Speichern' : 'Hinzufügen'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
