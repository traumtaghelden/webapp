import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, CheckSquare, Check, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface ChecklistItem {
  id: string;
  block_id: string;
  task_title: string;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  due_before_minutes: number;
  priority: 'high' | 'medium' | 'low';
  assigned_to: string | null;
  sort_order: number;
}

interface ChecklistTabProps {
  blockId: string;
  onUpdate: () => void;
}

const priorityColors = {
  high: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  medium: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  low: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
};

const priorityLabels = {
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
};

export default function ChecklistTab({ blockId, onUpdate }: ChecklistTabProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'completed'>('all');
  const { showToast } = useToast();

  useEffect(() => {
    loadItems();
  }, [blockId]);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_day_checklist')
        .select('*')
        .eq('block_id', blockId)
        .order('priority', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Sort by priority: high -> medium -> low
      const sortedData = (data || []).sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      setItems(sortedData);
    } catch (error) {
      console.error('Error loading checklist items:', error);
      showToast('Fehler beim Laden der Checkliste', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompleted = async (itemId: string, currentStatus: boolean) => {
    try {
      const updateData: any = {
        is_completed: !currentStatus,
      };

      if (!currentStatus) {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
        updateData.completed_by = null;
      }

      const { error } = await supabase
        .from('wedding_day_checklist')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.map(i =>
        i.id === itemId
          ? { ...i, ...updateData }
          : i
      ));
      onUpdate();
    } catch (error) {
      console.error('Error toggling completed status:', error);
      showToast('Fehler beim Aktualisieren', 'error');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Möchten Sie diese Aufgabe wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('wedding_day_checklist')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.filter(i => i.id !== itemId));
      showToast('Aufgabe gelöscht', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('Fehler beim Löschen', 'error');
    }
  };

  const filteredItems = items.filter(item => {
    if (filterStatus === 'open' && item.is_completed) return false;
    if (filterStatus === 'completed' && !item.is_completed) return false;
    return true;
  });

  const totalItems = items.length;
  const completedItems = items.filter(i => i.is_completed).length;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#0a253c]">Checkliste</h3>
          <p className="text-sm text-gray-600">
            Aufgaben, die vor diesem Event-Block erledigt werden müssen
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowAddModal(true);
          }}
          className="bg-[#d4af37] hover:bg-[#c19a2e] text-gray-900 font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Hinzufügen</span>
        </button>
      </div>

      {/* Progress */}
      {totalItems > 0 && (
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-4">
            {/* Compact Circle Progress */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16">
                <svg className="transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#d4af37"
                    strokeWidth="8"
                    strokeDasharray={`${progressPercentage * 2.51} 251`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#d4af37]">{progressPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Progress Info */}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-[#0a253c] block mb-1">Fortschritt</span>
              <span className="text-xs text-gray-600">
                {completedItems} von {totalItems} erledigt
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {totalItems > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-[#d4af37] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setFilterStatus('open')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'open'
                ? 'bg-[#d4af37] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Offen
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'completed'
                ? 'bg-[#d4af37] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Erledigt
          </button>
        </div>
      )}

      {/* Checklist Items */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">
            {items.length === 0
              ? 'Noch keine Aufgaben in der Checkliste'
              : 'Keine Aufgaben mit diesem Filter gefunden'}
          </p>
          {items.length === 0 && (
            <button
              onClick={() => {
                setEditingItem(null);
                setShowAddModal(true);
              }}
              className="bg-[#d4af37] hover:bg-[#c19a2e] text-gray-900 font-medium px-4 py-2 rounded-lg transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Erste Aufgabe hinzufügen
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg p-4 border-2 transition-all ${
                item.is_completed
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : `border-l-4 ${priorityColors[item.priority].border} border-t border-r border-b border-gray-700 hover:shadow-md`
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleCompleted(item.id, item.is_completed)}
                  className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    item.is_completed
                      ? 'bg-[#d4af37] border-[#d4af37]'
                      : 'border-gray-300 hover:border-[#d4af37]'
                  }`}
                >
                  {item.is_completed && <Check className="w-4 h-4 text-white" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className={`font-semibold ${
                          item.is_completed ? 'line-through text-gray-500' : 'text-[#0a253c]'
                        }`}>
                          {item.task_title}
                        </h5>
                        {!item.is_completed && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            priorityColors[item.priority].bg
                          } ${priorityColors[item.priority].text}`}>
                            {priorityLabels[item.priority]}
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        {item.due_before_minutes > 0 && (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {item.due_before_minutes} Min vor Event
                          </span>
                        )}
                        {item.assigned_to && (
                          <span>
                            Zuständig: {item.assigned_to}
                          </span>
                        )}
                        {item.is_completed && item.completed_at && (
                          <span className="text-green-600">
                            Erledigt am {new Date(item.completed_at).toLocaleDateString('de-DE')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 relative z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item);
                          setShowAddModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded transition-all"
                        title="Bearbeiten"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && createPortal(
        <ChecklistItemModal
          blockId={blockId}
          item={editingItem}
          onSave={async (itemData) => {
            try {
              if (editingItem) {
                const { error } = await supabase
                  .from('wedding_day_checklist')
                  .update(itemData)
                  .eq('id', editingItem.id);

                if (error) throw error;
                showToast('Aufgabe aktualisiert', 'success');
              } else {
                const { error } = await supabase
                  .from('wedding_day_checklist')
                  .insert({
                    ...itemData,
                    block_id: blockId,
                    sort_order: items.length,
                  });

                if (error) throw error;
                showToast('Aufgabe hinzugefügt', 'success');
              }

              await loadItems();
              onUpdate();
              setShowAddModal(false);
              setEditingItem(null);
            } catch (error) {
              console.error('Error saving item:', error);
              showToast('Fehler beim Speichern', 'error');
            }
          }}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
        />,
        document.body
      )}
    </div>
  );
}

// Checklist Item Modal Component
interface ChecklistItemModalProps {
  blockId: string;
  item: ChecklistItem | null;
  onSave: (itemData: Partial<ChecklistItem>) => void;
  onClose: () => void;
}

function ChecklistItemModal({ item, onSave, onClose }: ChecklistItemModalProps) {
  const [formData, setFormData] = useState({
    task_title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    due_before_minutes: 30,
    assigned_to: '',
    is_completed: false,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        task_title: item.task_title,
        description: item.description || '',
        priority: item.priority,
        due_before_minutes: item.due_before_minutes,
        assigned_to: item.assigned_to || '',
        is_completed: item.is_completed,
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validierung
    if (!formData.task_title.trim()) {
      alert('Bitte geben Sie einen Aufgaben-Titel ein!');
      return;
    }

    if (formData.due_before_minutes < 0) {
      alert('Die Minuten vor Event können nicht negativ sein!');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-xl max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">
            {item ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Aufgaben-Titel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.task_title}
              onChange={(e) => setFormData({ ...formData, task_title: e.target.value })}
              className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none"
              placeholder="z.B. Deko in Kirche aufbauen"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none resize-none"
              rows={2}
              placeholder="Zusätzliche Details zur Aufgabe"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Priorität <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none"
                required
              >
                <option value="high">Hoch</option>
                <option value="medium">Mittel</option>
                <option value="low">Niedrig</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Vor Event (Min)
              </label>
              <input
                type="number"
                value={formData.due_before_minutes}
                onChange={(e) => setFormData({ ...formData, due_before_minutes: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none"
                min="0"
                step="5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Zuständige Person
            </label>
            <input
              type="text"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none"
              placeholder="z.B. Trauzeuge"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_completed}
                onChange={(e) => setFormData({ ...formData, is_completed: e.target.checked })}
                className="w-4 h-4 text-[#d4af37] border-gray-300 rounded focus:ring-[#d4af37]"
              />
              <span className="text-sm font-medium text-white">Als erledigt markieren</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-300 border border-gray-600 hover:bg-gray-700/30 transition-all"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#d4af37] hover:bg-[#c19a2e] text-gray-900 transition-all"
            >
              {item ? 'Aktualisieren' : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
