import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical, Building2, Tag } from 'lucide-react';
import { supabase, type VendorCategory, type Vendor } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { VENDOR } from '../../constants/terminology';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import StandardModal, { ModalFooter, ModalButton } from '../StandardModal';

interface VendorCategoryManagerTabProps {
  weddingId: string;
  vendors: Vendor[];
}

interface CategoryWithCount extends VendorCategory {
  vendorCount: number;
}

interface SortableCategoryItemProps {
  category: CategoryWithCount;
  onEdit: (category: VendorCategory) => void;
  onDelete: (category: VendorCategory) => void;
}

function SortableCategoryItem({ category, onEdit, onDelete }: SortableCategoryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const getLucideIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      'MapPin': '📍',
      'Utensils': '🍽️',
      'Camera': '📷',
      'Video': '🎥',
      'Music': '🎵',
      'Flower2': '💐',
      'Sparkles': '✨',
      'Car': '🚗',
      'Cake': '🍰',
      'MoreHorizontal': '➕'
    };
    return icons[iconName] || '📦';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl p-4 shadow-md border-2 border-[#d4af37]/30 hover:border-[#d4af37] transition-all"
    >
      <div className="flex items-center gap-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[#666666] hover:text-[#d4af37] transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${category.color}20` }}
        >
          {getLucideIcon(category.icon)}
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-[#0a253c] text-lg">{category.name}</h4>
          <p className="text-sm text-[#666666]">
            {category.vendorCount} {VENDOR.PLURAL}
            {category.is_default && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                Standard
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(category)}
            className="p-2 hover:bg-[#d4af37]/10 rounded-lg transition-colors"
          >
            <Edit2 className="w-5 h-5 text-[#d4af37]" />
          </button>
          {!category.is_default && (
            <button
              onClick={() => onDelete(category)}
              disabled={category.vendorCount > 0}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={category.vendorCount > 0 ? 'Kategorie hat zugewiesene Dienstleister' : ''}
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VendorCategoryManagerTab({ weddingId, vendors }: VendorCategoryManagerTabProps) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VendorCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: 'Building2', color: '#d4af37' });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadCategories();
  }, [weddingId, vendors]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('vendor_categories')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('order_index', { ascending: true });

      if (data) {
        const categoriesWithCount = data.map(cat => ({
          ...cat,
          vendorCount: vendors.filter(v => v.category === cat.name).length
        }));
        setCategories(categoriesWithCount);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast('Fehler beim Laden der Kategorien', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex(c => c.id === active.id);
    const newIndex = categories.findIndex(c => c.id === over.id);

    const newCategories = [...categories];
    const [movedItem] = newCategories.splice(oldIndex, 1);
    newCategories.splice(newIndex, 0, movedItem);

    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      order_index: index
    }));

    setCategories(updatedCategories);

    try {
      for (const cat of updatedCategories) {
        await supabase
          .from('vendor_categories')
          .update({ order_index: cat.order_index })
          .eq('id', cat.id);
      }
      showToast('Reihenfolge aktualisiert', 'success');
    } catch (error) {
      console.error('Error updating order:', error);
      showToast('Fehler beim Aktualisieren der Reihenfolge', 'error');
      loadCategories();
    }
  };

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      showToast('Bitte einen Namen eingeben', 'error');
      return;
    }

    try {
      if (editingCategory) {
        await supabase
          .from('vendor_categories')
          .update({
            name: formData.name,
            icon: formData.icon,
            color: formData.color
          })
          .eq('id', editingCategory.id);

        showToast('Kategorie aktualisiert', 'success');
      } else {
        const maxOrder = Math.max(...categories.map(c => c.order_index), -1);
        await supabase.from('vendor_categories').insert([{
          wedding_id: weddingId,
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          is_default: false,
          order_index: maxOrder + 1
        }]);

        showToast('Kategorie erstellt', 'success');
      }

      setShowAddModal(false);
      setEditingCategory(null);
      setFormData({ name: '', icon: 'Building2', color: '#d4af37' });
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      showToast('Fehler beim Speichern', 'error');
    }
  };

  const handleEdit = (category: VendorCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color
    });
    setShowAddModal(true);
  };

  const handleDelete = async (category: VendorCategory) => {
    if (category.vendorCount > 0) {
      showToast('Kategorie hat zugewiesene Dienstleister', 'error');
      return;
    }

    if (!confirm(`Kategorie "${category.name}" wirklich löschen?`)) return;

    try {
      await supabase.from('vendor_categories').delete().eq('id', category.id);
      showToast('Kategorie gelöscht', 'success');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Fehler beim Löschen', 'error');
    }
  };

  const iconOptions = [
    { value: 'Building2', label: '🏢 Building' },
    { value: 'MapPin', label: '📍 Location' },
    { value: 'Utensils', label: '🍽️ Catering' },
    { value: 'Camera', label: '📷 Fotografie' },
    { value: 'Video', label: '🎥 Video' },
    { value: 'Music', label: '🎵 Musik' },
    { value: 'Flower2', label: '💐 Blumen' },
    { value: 'Sparkles', label: '✨ Dekoration' },
    { value: 'Car', label: '🚗 Transport' },
    { value: 'Cake', label: '🍰 Torte' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-bold text-[#0a253c]">Kategorien verwalten</h3>
          <p className="text-[#666666] mt-1">
            Organisiere deine {VENDOR.PLURAL} mit benutzerdefinierten Kategorien
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '', icon: 'Building2', color: '#d4af37' });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all min-h-[40px]"
        >
          <Plus className="w-4 h-4" />
          Neue Kategorie
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {categories.map(category => (
              <SortableCategoryItem
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <StandardModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
        subtitle="Passe Icon, Name und Farbe an"
        icon={Tag}
        maxWidth="md"
        footer={
          <ModalFooter>
            <ModalButton variant="secondary" onClick={() => setShowAddModal(false)}>
              Abbrechen
            </ModalButton>
            <ModalButton
              variant="primary"
              onClick={handleSaveCategory}
              disabled={!formData.name.trim()}
              icon={Save}
            >
              Speichern
            </ModalButton>
          </ModalFooter>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">
              Kategoriename <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. DJ & Entertainment"
              className="w-full px-3 py-2 bg-white/10 border border-[#d4af37]/30 rounded-lg text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">
              Icon
            </label>
            <select
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-[#d4af37]/30 rounded-lg text-white text-sm focus:border-[#d4af37] focus:outline-none transition-all"
            >
              {iconOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-[#0a253c] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">
              Farbe
            </label>

            {/* Farbvorlagen */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {[
                '#d4af37', '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6',
                '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#06B6D4'
              ].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                    formData.color.toUpperCase() === color.toUpperCase()
                      ? 'border-white ring-2 ring-white/50'
                      : 'border-white/30'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Eigene Farbe */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-9 rounded-lg border border-[#d4af37]/30 cursor-pointer bg-white/10"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#d4af37"
                className="flex-1 px-3 py-2 bg-white/10 border border-[#d4af37]/30 rounded-lg text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white/5 border border-[#d4af37]/30 rounded-lg p-3 backdrop-blur-sm">
            <p className="text-xs text-white/70 mb-2">Vorschau</p>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: `${formData.color}20` }}
              >
                {formData.icon ? iconOptions.find(o => o.value === formData.icon)?.label.split(' ')[0] : '📦'}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">
                  {formData.name || 'Kategoriename'}
                </p>
                <p className="text-xs text-white/60">0 {VENDOR.PLURAL}</p>
              </div>
            </div>
          </div>
        </div>
      </StandardModal>
    </div>
  );
}
