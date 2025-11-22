import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Package, Check, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface PackingItem {
  id: string;
  block_id: string;
  item_name: string;
  quantity: number;
  category: string;
  is_packed: boolean;
  assigned_to: string | null;
  notes: string | null;
  sort_order: number;
}

interface PackingListTabProps {
  blockId: string;
  onUpdate: () => void;
}

const categories = ['ceremony', 'deco', 'emergency', 'other'] as const;
const categoryLabels: Record<string, string> = {
  ceremony: 'Zeremonie',
  deco: 'Deko',
  emergency: 'Notfall',
  other: 'Sonstiges',
};

const categoryColors: Record<string, string> = {
  ceremony: 'bg-purple-100 text-purple-700',
  deco: 'bg-pink-100 text-pink-700',
  emergency: 'bg-red-100 text-red-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function PackingListTab({ blockId, onUpdate }: PackingListTabProps) {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showUnpackedOnly, setShowUnpackedOnly] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadItems();
  }, [blockId]);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_day_packing_list')
        .select('*')
        .eq('block_id', blockId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading packing items:', error);
      showToast('Fehler beim Laden der Packliste', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePacked = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('wedding_day_packing_list')
        .update({ is_packed: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.map(i =>
        i.id === itemId ? { ...i, is_packed: !currentStatus } : i
      ));
      onUpdate();
    } catch (error) {
      console.error('Error toggling packed status:', error);
      showToast('Fehler beim Aktualisieren', 'error');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Möchten Sie dieses Item wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('wedding_day_packing_list')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.filter(i => i.id !== itemId));
      showToast('Item gelöscht', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('Fehler beim Löschen', 'error');
    }
  };

  const filteredItems = items.filter(item => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (showUnpackedOnly && item.is_packed) return false;
    return true;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PackingItem[]>);

  const totalItems = items.length;
  const packedItems = items.filter(i => i.is_packed).length;
  const progressPercentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

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
          <h3 className="text-lg font-semibold text-[#0a253c]">Packliste</h3>
          <p className="text-sm text-gray-600">
            Was muss für diesen Event-Block eingepackt werden
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

      {/* Progress Bar */}
      {totalItems > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#0a253c]">Fortschritt</span>
            <span className="text-sm font-bold text-[#d4af37]">
              {packedItems} von {totalItems} ({progressPercentage}%)
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#d4af37] to-[#c19a2e] transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      {totalItems > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filterCategory === 'all'
                ? 'bg-[#d4af37] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Alle
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterCategory === cat
                  ? 'bg-[#d4af37] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
          <div className="ml-auto">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnpackedOnly}
                onChange={(e) => setShowUnpackedOnly(e.target.checked)}
                className="w-4 h-4 text-[#d4af37] border-gray-300 rounded focus:ring-[#d4af37]"
              />
              <span className="text-sm text-gray-700">Nur ungepackte</span>
            </label>
          </div>
        </div>
      )}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">
            {items.length === 0
              ? 'Noch keine Items in der Packliste'
              : 'Keine Items mit diesen Filtern gefunden'}
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
              Erstes Item hinzufügen
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-[#0a253c] mb-3 flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${categoryColors[category]}`}>
                  {categoryLabels[category]}
                </span>
                <span className="text-sm text-gray-500">
                  ({categoryItems.filter(i => i.is_packed).length}/{categoryItems.length})
                </span>
              </h4>

              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                      item.is_packed
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : 'bg-white border-gray-200 hover:border-[#d4af37]/50'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleTogglePacked(item.id, item.is_packed)}
                      className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                        item.is_packed
                          ? 'bg-[#d4af37] border-[#d4af37]'
                          : 'border-gray-300 hover:border-[#d4af37]'
                      }`}
                    >
                      {item.is_packed && <Check className="w-4 h-4 text-white" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className={`font-medium ${
                            item.is_packed ? 'line-through text-gray-500' : 'text-[#0a253c]'
                          }`}>
                            {item.item_name}
                            {item.quantity > 1 && (
                              <span className="ml-2 text-sm text-gray-500">
                                ({item.quantity}x)
                              </span>
                            )}
                          </h5>
                          {item.assigned_to && (
                            <p className="text-sm text-gray-600 mt-1">
                              Zuständig: {item.assigned_to}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                          )}
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
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && createPortal(
        <PackingItemModal
          blockId={blockId}
          item={editingItem}
          onSave={async (itemData) => {
            try {
              if (editingItem) {
                const { error } = await supabase
                  .from('wedding_day_packing_list')
                  .update(itemData)
                  .eq('id', editingItem.id);

                if (error) throw error;
                showToast('Item aktualisiert', 'success');
              } else {
                const { error } = await supabase
                  .from('wedding_day_packing_list')
                  .insert({
                    ...itemData,
                    block_id: blockId,
                    sort_order: items.length,
                  });

                if (error) throw error;
                showToast('Item hinzugefügt', 'success');
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

// Packing Item Modal Component
interface PackingItemModalProps {
  blockId: string;
  item: PackingItem | null;
  onSave: (itemData: Partial<PackingItem>) => void;
  onClose: () => void;
}

function PackingItemModal({ item, onSave, onClose }: PackingItemModalProps) {
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: 1,
    category: 'other',
    is_packed: false,
    assigned_to: '',
    notes: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        item_name: item.item_name,
        quantity: item.quantity,
        category: item.category,
        is_packed: item.is_packed,
        assigned_to: item.assigned_to || '',
        notes: item.notes || '',
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validierung
    if (!formData.item_name.trim()) {
      alert('Bitte geben Sie einen Item-Namen ein!');
      return;
    }

    if (formData.quantity < 1) {
      alert('Die Anzahl muss mindestens 1 sein!');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-xl max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">
            {item ? 'Item bearbeiten' : 'Neues Item'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Item-Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none"
              placeholder="z.B. Eheringe"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Anzahl <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Kategorie <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                ))}
              </select>
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
                checked={formData.is_packed}
                onChange={(e) => setFormData({ ...formData, is_packed: e.target.checked })}
                className="w-4 h-4 text-[#d4af37] border-gray-300 rounded focus:ring-[#d4af37]"
              />
              <span className="text-sm font-medium text-white">Bereits gepackt</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Notizen
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none resize-none"
              rows={2}
              placeholder="Zusätzliche Informationen"
            />
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
