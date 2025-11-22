import { useState, useEffect } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TimelineBlockChecklistItem } from '../../lib/supabase';

interface ChecklistTabProps {
  eventId: string;
  weddingId: string;
  onUpdate: () => void;
}

export default function ChecklistTab({ eventId, weddingId, onUpdate }: ChecklistTabProps) {
  const [items, setItems] = useState<TimelineBlockChecklistItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['Vorbereitung', 'Während des Events', 'Nachbereitung']);
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Vorbereitung');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
    loadCategories();
  }, [eventId]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('timeline_block_checklist_categories')
      .select('category_name')
      .eq('wedding_id', weddingId)
      .order('order_index');

    if (data && data.length > 0) {
      setCategories(data.map(c => c.category_name));
    }
  };

  const loadItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('timeline_block_checklist')
      .select('*')
      .eq('timeline_event_id', eventId)
      .order('order_index');

    if (data) setItems(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newItemText.trim()) return;

    await supabase.from('timeline_block_checklist').insert({
      timeline_event_id: eventId,
      item_text: newItemText.trim(),
      category: newItemCategory,
      order_index: items.length,
    });

    setNewItemText('');
    loadItems();
    onUpdate();
  };

  const handleToggle = async (item: TimelineBlockChecklistItem) => {
    await supabase
      .from('timeline_block_checklist')
      .update({
        is_completed: !item.is_completed,
        completed_at: !item.is_completed ? new Date().toISOString() : null,
      })
      .eq('id', item.id);

    loadItems();
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('timeline_block_checklist').delete().eq('id', id);
    loadItems();
    onUpdate();
  };

  const getItemsByCategory = (category: string) => {
    return items.filter((item) => item.category === category);
  };

  const getCategoryProgress = (category: string) => {
    const categoryItems = getItemsByCategory(category);
    if (categoryItems.length === 0) return 0;
    const completed = categoryItems.filter((i) => i.is_completed).length;
    return Math.round((completed / categoryItems.length) * 100);
  };

  const overallCompleted = items.filter((i) => i.is_completed).length;
  const overallProgress = items.length > 0 ? Math.round((overallCompleted / items.length) * 100) : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6">
        <div className="text-center mb-3">
          <div className="text-4xl font-bold text-orange-600">{overallProgress}%</div>
          <p className="text-gray-700">
            {overallCompleted} von {items.length} erledigt
          </p>
        </div>
        <div className="w-full bg-white rounded-full h-2">
          <div className="bg-orange-600 h-full rounded-full transition-all" style={{ width: `${overallProgress}%` }}></div>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Neues Checklisten-Item..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button onClick={handleAdd} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 min-h-[40px]">
            <Plus className="w-4 h-4" /> Hinzufügen
          </button>
        </div>
      </div>

      {categories.map((category) => {
        const categoryItems = getItemsByCategory(category);
        const progress = getCategoryProgress(category);

        return (
          <div key={category} className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-orange-600 h-full rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>

            {categoryItems.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Keine Items in dieser Kategorie</p>
            ) : (
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 ${item.is_completed ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}>
                    <button onClick={() => handleToggle(item)} className={`w-5 h-5 rounded border-2 flex items-center justify-center ${item.is_completed ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}>
                      {item.is_completed && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <span className={`flex-1 ${item.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>{item.item_text}</span>
                    <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
