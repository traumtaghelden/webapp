import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import { supabase, type Location, type LocationCategory, type LocationCategoryAssignment } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import StandardModal, { ModalFooter, ModalButton } from '../StandardModal';

interface LocationCategoryManagerTabProps {
  weddingId: string;
  locations: Location[];
}

export default function LocationCategoryManagerTab({ weddingId, locations }: LocationCategoryManagerTabProps) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<LocationCategory[]>([]);
  const [categoryAssignments, setCategoryAssignments] = useState<LocationCategoryAssignment[]>([]);
  const [editingCategory, setEditingCategory] = useState<LocationCategory | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('MapPin');
  const [categoryColor, setCategoryColor] = useState('#d4af37');

  useEffect(() => {
    fetchCategories();
    fetchCategoryAssignments();
  }, [weddingId]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('location_categories')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCategoryAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('location_category_assignments')
        .select('*')
        .eq('wedding_id', weddingId);

      if (error) throw error;
      setCategoryAssignments(data || []);
    } catch (error) {
      console.error('Error fetching category assignments:', error);
    }
  };

  const getCategoryCount = (categoryId: string) => {
    return categoryAssignments.filter(a => a.category_id === categoryId).length;
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      showToast('Bitte einen Namen eingeben', 'error');
      return;
    }

    try {
      const maxOrder = Math.max(...categories.map(c => c.order_index || 0), 0);

      const { error } = await supabase
        .from('location_categories')
        .insert([{
          wedding_id: weddingId,
          name: categoryName.trim(),
          icon: categoryIcon,
          color: categoryColor,
          is_default: false,
          order_index: maxOrder + 1,
        }]);

      if (error) throw error;

      showToast('Kategorie erfolgreich erstellt', 'success');
      setIsAddModalOpen(false);
      setCategoryName('');
      setCategoryIcon('MapPin');
      setCategoryColor('#d4af37');
      await fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      showToast('Fehler beim Erstellen der Kategorie', 'error');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryName.trim()) {
      showToast('Bitte einen Namen eingeben', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('location_categories')
        .update({
          name: categoryName.trim(),
          icon: categoryIcon,
          color: categoryColor,
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      showToast('Kategorie erfolgreich aktualisiert', 'success');
      setEditingCategory(null);
      setCategoryName('');
      setCategoryIcon('MapPin');
      setCategoryColor('#d4af37');
      await fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      showToast('Fehler beim Aktualisieren der Kategorie', 'error');
    }
  };

  const handleDeleteCategory = async (category: LocationCategory) => {
    const count = getCategoryCount(category.id);

    if (count > 0) {
      if (!confirm(`Diese Kategorie wird von ${count} Location(s) verwendet. Wirklich löschen?`)) {
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('location_categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      showToast('Kategorie erfolgreich gelöscht', 'success');
      await fetchCategories();
      await fetchCategoryAssignments();
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Fehler beim Löschen der Kategorie', 'error');
    }
  };

  const openEditModal = (category: LocationCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryIcon(category.icon);
    setCategoryColor(category.color);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setCategoryIcon('MapPin');
    setCategoryColor('#d4af37');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl p-6 shadow-lg border border-[#d4af37]/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-[#0a253c]">Nutzungskategorien</h3>
            <p className="text-[#666666] mt-1">Verwalte die Verwendungszwecke für deine Locations</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 active:scale-95 min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>Neue Kategorie</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => {
            const count = getCategoryCount(category.id);
            return (
              <div
                key={category.id}
                className="bg-white rounded-xl p-4 shadow-md border-2 border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <MapPin className="w-5 h-5" style={{ color: category.color }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#0a253c]">{category.name}</h4>
                      <p className="text-sm text-[#666666]">{count} Location(s)</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => openEditModal(category)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-[#d4af37]/10 text-[#d4af37] rounded-lg text-sm font-medium hover:bg-[#d4af37]/20 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Bearbeiten
                  </button>
                  {!category.is_default && (
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-[#d4af37] mx-auto mb-4 opacity-50" />
            <p className="text-[#666666] text-lg font-semibold">Noch keine Kategorien</p>
            <p className="text-sm text-[#999999] mt-2">
              Erstelle deine erste Kategorie, um Locations zu organisieren
            </p>
          </div>
        )}
      </div>

      {(isAddModalOpen || editingCategory) && (
        <StandardModal
          isOpen={true}
          onClose={closeModal}
          title={editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
          icon={MapPin}
          maxWidth="lg"
          footer={
            <ModalFooter>
              <ModalButton variant="secondary" onClick={closeModal}>
                Abbrechen
              </ModalButton>
              <ModalButton
                variant="primary"
                onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                disabled={!categoryName.trim()}
              >
                {editingCategory ? 'Aktualisieren' : 'Erstellen'}
              </ModalButton>
            </ModalFooter>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-2.5 min-h-[44px] bg-white/10 border-2 border-[#d4af37]/30 rounded-lg text-white placeholder-white/50 focus:border-[#d4af37] focus:bg-white/15 focus:outline-none transition-all"
                placeholder="z.B. Brunch am Sonntag"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Farbe
              </label>
              <div className="flex gap-2">
                {['#d4af37', '#c19a2e', '#b8860b', '#daa520', '#999999', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCategoryColor(color)}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      categoryColor === color
                        ? 'ring-4 ring-white/50 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-white/70">
                Diese Kategorie wird als Nutzungszweck für Locations verwendet.
                Eine Location kann mehrere Kategorien haben.
              </p>
            </div>
          </div>
        </StandardModal>
      )}
    </div>
  );
}
