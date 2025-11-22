import { useState, useEffect } from 'react';
import { Plus, Trash2, Package, MapPin, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TimelineBlockItem } from '../../lib/supabase';

interface ItemsTabProps {
  eventId: string;
  weddingId: string;
  onUpdate: () => void;
}

export default function ItemsTab({ eventId, weddingId, onUpdate }: ItemsTabProps) {
  const [items, setItems] = useState<TimelineBlockItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['Dokumente', 'Dekoration', 'Technik', 'Verpflegung', 'Kleidung', 'Sonstiges']);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemCategory, setNewItemCategory] = useState('Sonstiges');
  const [newItemLocation, setNewItemLocation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
    loadCategories();
  }, [eventId]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('timeline_block_item_categories')
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
      .from('timeline_block_items')
      .select('*')
      .eq('timeline_event_id', eventId)
      .order('order_index');

    if (data) setItems(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newItemName.trim()) return;

    await supabase.from('timeline_block_items').insert({
      timeline_event_id: eventId,
      item_name: newItemName.trim(),
      quantity: newItemQuantity,
      category: newItemCategory,
      location: newItemLocation,
      order_index: items.length,
    });

    setNewItemName('');
    setNewItemQuantity(1);
    setNewItemLocation('');
    loadItems();
    onUpdate();
  };

  const handleTogglePacked = async (item: TimelineBlockItem) => {
    await supabase
      .from('timeline_block_items')
      .update({
        is_packed: !item.is_packed,
        packed_at: !item.is_packed ? new Date().toISOString() : null,
      })
      .eq('id', item.id);

    loadItems();
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('timeline_block_items').delete().eq('id', id);
    loadItems();
    onUpdate();
  };

  const getItemsByCategory = (category: string) => {
    return items.filter((item) => item.category === category);
  };

  const getCategoryProgress = (category: string) => {
    const categoryItems = getItemsByCategory(category);
    if (categoryItems.length === 0) return 0;
    const packed = categoryItems.filter((i) => i.is_packed).length;
    return Math.round((packed / categoryItems.length) * 100);
  };

  const overallPacked = items.filter((i) => i.is_packed).length;
  const overallProgress = items.length > 0 ? Math.round((overallPacked / items.length) * 100) : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl p-6">
        <div className="text-center mb-3">
          <div className="text-4xl font-bold text-pink-600">{overallProgress}%</div>
          <p className="text-gray-700">
            {overallPacked} von {items.length} eingepackt
          </p>
        </div>
        <div className="w-full bg-white rounded-full h-2">
          <div className="bg-pink-600 h-full rounded-full transition-all" style={{ width: `${overallProgress}%` }}></div>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Item-Name..."
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
          />
          <div className="flex gap-3">
            <input
              type="number"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
              min="1"
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            />
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={newItemLocation}
            onChange={(e) => setNewItemLocation(e.target.value)}
            placeholder="Aufbewahrungsort (optional)..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
          />
          <button onClick={handleAdd} className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex items-center gap-2 whitespace-nowrap min-h-[40px]">
            <Plus className="w-4 h-4" /> Hinzufügen
          </button>
        </div>
      </div>

      {categories.map((category) => {
        const categoryItems = getItemsByCategory(category);
        const progress = getCategoryProgress(category);

        if (categoryItems.length === 0) return null;

        return (
          <div key={category} className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-pink-600" />
                <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
              </div>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-pink-600 h-full rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryItems.map((item) => (
                <div key={item.id} className={`p-4 rounded-lg border-2 ${item.is_packed ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <button onClick={() => handleTogglePacked(item)} className={`w-5 h-5 rounded border-2 flex items-center justify-center ${item.is_packed ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}>
                          {item.is_packed && <Check className="w-4 h-4 text-white" />}
                        </button>
                        <h4 className={`font-semibold ${item.is_packed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {item.item_name}
                        </h4>
                      </div>
                      {item.quantity > 1 && (
                        <p className="text-sm text-gray-600 ml-7">Anzahl: {item.quantity}</p>
                      )}
                      {item.location && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 ml-7">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
