import { useState, useEffect } from 'react';
import { MapPin, Save } from 'lucide-react';
import { supabase, LocationCategory } from '../lib/supabase';
import { LOCATION } from '../constants/terminology';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';

interface LocationAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  weddingId: string;
}

export default function LocationAddModal({ isOpen, onClose, onSuccess, weddingId }: LocationAddModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    postal_code: '',
    contact_name: '',
    email: '',
    phone: '',
    max_capacity: 0,
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<LocationCategory[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && weddingId) {
      fetchCategories();
    }
  }, [isOpen, weddingId]);

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

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.name || selectedCategories.length === 0) {
      alert('Bitte Name und mindestens eine Nutzungskategorie auswählen');
      return;
    }

    setSaving(true);

    try {
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .insert([{
          wedding_id: weddingId,
          ...formData,
          category: '', // Legacy field, keep empty
          rental_cost: 0,
          deposit_amount: 0,
          total_cost: 0,
        }])
        .select()
        .single();

      if (locationError) throw locationError;

      const assignments = selectedCategories.map(categoryId => ({
        wedding_id: weddingId,
        location_id: locationData.id,
        category_id: categoryId,
      }));

      const { error: assignmentError } = await supabase
        .from('location_category_assignments')
        .insert(assignments);

      if (assignmentError) throw assignmentError;

      onSuccess();
      onClose();

      setFormData({
        name: '',
        description: '',
        address: '',
        city: '',
        postal_code: '',
        contact_name: '',
        email: '',
        phone: '',
        max_capacity: 0,
      });
      setSelectedCategories([]);
    } catch (error) {
      console.error('Error adding location:', error);
      alert('Fehler beim Hinzufügen der Location');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={LOCATION.ADD}
      icon={MapPin}
      maxWidth="3xl"
      footer={
        <ModalFooter>
          <ModalButton variant="secondary" onClick={onClose}>
            Abbrechen
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={() => handleSubmit()}
            disabled={saving || !formData.name || selectedCategories.length === 0}
            icon={Save}
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </ModalButton>
        </ModalFooter>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-white/90 mb-2">
            {LOCATION.NAME} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 min-h-[44px] bg-white/10 border-2 border-[#d4af37]/30 rounded-lg text-white placeholder-white/50 focus:border-[#d4af37] focus:bg-white/15 focus:outline-none transition-all"
            placeholder="z.B. Schloss Liebenstein"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white/90 mb-3">
            Nutzungskategorien <span className="text-red-400">*</span>
          </label>
          <p className="text-sm text-white/60 mb-3">
            Wähle alle Verwendungszwecke für diese Location aus
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`
                    px-3 py-2.5 rounded-lg font-medium text-sm transition-all min-h-[44px]
                    border-2 flex items-center justify-center gap-2
                    ${isSelected
                      ? 'bg-[#d4af37] border-[#d4af37] text-[#0a253c]'
                      : 'bg-white/5 border-[#d4af37]/30 text-white/80 hover:bg-white/10 hover:border-[#d4af37]/50'
                    }
                  `}
                >
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white/90 mb-2">
            {LOCATION.DESCRIPTION}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 min-h-[44px] bg-white/10 border-2 border-[#d4af37]/30 rounded-lg text-white placeholder-white/50 focus:border-[#d4af37] focus:bg-white/15 focus:outline-none transition-all resize-none"
            placeholder="Beschreibe die Location..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              {LOCATION.ADDRESS}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 min-h-[44px] bg-white/10 border-2 border-[#d4af37]/30 rounded-lg text-white placeholder-white/50 focus:border-[#d4af37] focus:bg-white/15 focus:outline-none transition-all"
              placeholder="Straße und Hausnummer"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              {LOCATION.CITY}
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2.5 min-h-[44px] bg-white/10 border-2 border-[#d4af37]/30 rounded-lg text-white placeholder-white/50 focus:border-[#d4af37] focus:bg-white/15 focus:outline-none transition-all"
              placeholder="Stadt"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              {LOCATION.CONTACT_NAME}
            </label>
            <input
              type="text"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              className="w-full px-4 py-2.5 min-h-[44px] bg-white/10 border-2 border-[#d4af37]/30 rounded-lg text-white placeholder-white/50 focus:border-[#d4af37] focus:bg-white/15 focus:outline-none transition-all"
              placeholder="Ansprechpartner"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              {LOCATION.EMAIL}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 min-h-[44px] bg-white/10 border-2 border-[#d4af37]/30 rounded-lg text-white placeholder-white/50 focus:border-[#d4af37] focus:bg-white/15 focus:outline-none transition-all"
              placeholder="email@beispiel.de"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              {LOCATION.MAX_CAPACITY}
            </label>
            <input
              type="number"
              min="0"
              value={formData.max_capacity || ''}
              onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 min-h-[44px] bg-white/10 border-2 border-[#d4af37]/30 rounded-lg text-white placeholder-white/50 focus:border-[#d4af37] focus:bg-white/15 focus:outline-none transition-all"
              placeholder="Anzahl Personen"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              Telefon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 min-h-[44px] bg-white/10 border-2 border-[#d4af37]/30 rounded-lg text-white placeholder-white/50 focus:border-[#d4af37] focus:bg-white/15 focus:outline-none transition-all"
              placeholder="+49 123 456789"
            />
          </div>

        </div>
      </form>
    </StandardModal>
  );
}
