import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Link2, Search, Check, AlertTriangle, DollarSign } from 'lucide-react';
import { supabase, type BudgetItem } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface BudgetItemLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityType: 'vendor' | 'location';
  entityName: string;
  weddingId: string;
  onLinksUpdated: () => void;
}

interface SelectableBudgetItem extends BudgetItem {
  isSelected: boolean;
  isCurrentlyLinked: boolean;
  conflictWith?: string;
}

export default function BudgetItemLinkingModal({
  isOpen,
  onClose,
  entityId,
  entityType,
  entityName,
  weddingId,
  onLinksUpdated,
}: BudgetItemLinkingModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'available' | 'linked'>('available');
  const [budgetItems, setBudgetItems] = useState<SelectableBudgetItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBudgetItems();
    }
  }, [isOpen, weddingId, entityId, entityType]);

  const loadBudgetItems = async () => {
    try {
      setLoading(true);

      const { data: allItems } = await supabase
        .from('budget_items')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: false });

      if (allItems) {
        const filterColumn = entityType === 'vendor' ? 'vendor_id' : 'location_id';
        const otherColumn = entityType === 'vendor' ? 'location_id' : 'vendor_id';

        // Load vendor/location names for conflict detection
        const vendorIds = allItems
          .filter((item) => item.vendor_id && item.vendor_id !== entityId)
          .map((item) => item.vendor_id);

        const locationIds = allItems
          .filter((item) => item.location_id && item.location_id !== entityId)
          .map((item) => item.location_id);

        let vendorNames: Record<string, string> = {};
        let locationNames: Record<string, string> = {};

        if (vendorIds.length > 0) {
          const { data: vendors } = await supabase
            .from('vendors')
            .select('id, name')
            .in('id', vendorIds);

          vendorNames = vendors?.reduce((acc, v) => ({ ...acc, [v.id]: v.name }), {}) || {};
        }

        if (locationIds.length > 0) {
          const { data: locations } = await supabase
            .from('locations')
            .select('id, name')
            .in('id', locationIds);

          locationNames = locations?.reduce((acc, l) => ({ ...acc, [l.id]: l.name }), {}) || {};
        }

        const selectableItems: SelectableBudgetItem[] = allItems.map((item) => {
          const isCurrentlyLinked = item[filterColumn] === entityId;
          const hasOtherLink = item[otherColumn] !== null && item[otherColumn] !== entityId;

          let conflictWith: string | undefined;
          if (entityType === 'vendor' && item.location_id) {
            conflictWith = locationNames[item.location_id] || 'Unbekannte Location';
          } else if (entityType === 'location' && item.vendor_id) {
            conflictWith = vendorNames[item.vendor_id] || 'Unbekannter Dienstleister';
          }

          return {
            ...item,
            isSelected: isCurrentlyLinked,
            isCurrentlyLinked,
            conflictWith,
          };
        });

        setBudgetItems(selectableItems);
      }
    } catch (error) {
      console.error('Error loading budget items:', error);
      showToast('Fehler beim Laden der Budget-Posten', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setBudgetItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isSelected: !item.isSelected } : item))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const filterColumn = entityType === 'vendor' ? 'vendor_id' : 'location_id';
      const selectedItems = budgetItems.filter((item) => item.isSelected);
      const deselectedItems = budgetItems.filter(
        (item) => !item.isSelected && item.isCurrentlyLinked
      );

      // Unlink deselected items
      for (const item of deselectedItems) {
        await supabase
          .from('budget_items')
          .update({ [filterColumn]: null })
          .eq('id', item.id);
      }

      // Link selected items
      for (const item of selectedItems) {
        if (!item.isCurrentlyLinked) {
          await supabase
            .from('budget_items')
            .update({ [filterColumn]: entityId })
            .eq('id', item.id);
        }
      }

      showToast(
        `${selectedItems.length} Budget-Posten verknüpft, ${deselectedItems.length} entknüpft`,
        'success'
      );
      onLinksUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving links:', error);
      showToast('Fehler beim Speichern der Verknüpfungen', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = budgetItems.filter((item) => {
    const matchesSearch =
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'available') {
      return matchesSearch;
    } else {
      return matchesSearch && item.isCurrentlyLinked;
    }
  });

  const selectedCount = budgetItems.filter((item) => item.isSelected).length;
  const totalValue = budgetItems
    .filter((item) => item.isSelected)
    .reduce((sum, item) => sum + (Number(item.actual_cost) || Number(item.estimated_cost) || 0), 0);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'auto',
        pointerEvents: 'auto'
      }}
    >
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-2xl max-w-4xl w-full max-h-[85vh] shadow-2xl border-2 border-[#d4af37]/30 flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b-2 border-[#d4af37]/20">
          <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] p-3 rounded-xl shadow-lg">
            <Link2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#0a253c]">
              Budget-Posten mit {entityName} verknüpfen
            </h2>
            <p className="text-sm text-[#666666] mt-1">
              Wähle Budget-Posten aus, die mit diesem {entityType === 'vendor' ? 'Dienstleister' : 'Location'}{' '}
              verknüpft werden sollen
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#666666] hover:text-[#0a253c] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 border-b-2 border-[#d4af37]/10">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-t-xl font-medium text-sm transition-all ${
              activeTab === 'available'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white shadow-md'
                : 'bg-white/50 text-[#666666] hover:bg-white'
            }`}
          >
            Alle Budget-Posten
          </button>
          <button
            onClick={() => setActiveTab('linked')}
            className={`px-4 py-2 rounded-t-xl font-medium text-sm transition-all ${
              activeTab === 'linked'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white shadow-md'
                : 'bg-white/50 text-[#666666] hover:bg-white'
            }`}
          >
            Aktuell verknüpft ({budgetItems.filter((item) => item.isCurrentlyLinked).length})
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#666666]" />
            <input
              type="text"
              placeholder="Budget-Posten suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#d4af37] focus:border-[#d4af37] outline-none transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-[#d4af37] mx-auto mb-4 opacity-50" />
              <p className="text-[#666666]">
                {activeTab === 'linked'
                  ? 'Keine Budget-Posten verknüpft'
                  : 'Keine Budget-Posten gefunden'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleItemSelection(item.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    item.isSelected
                      ? 'bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 border-[#d4af37] shadow-md'
                      : 'bg-white border-gray-200 hover:border-[#d4af37]/40 hover:shadow'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                        item.isSelected
                          ? 'bg-[#d4af37] border-[#d4af37]'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {item.isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-[#0a253c] mb-1">{item.item_name}</h4>
                          {item.category && (
                            <span className="inline-block px-2 py-1 bg-[#f7f2eb] text-[#0a253c] rounded-lg text-xs font-semibold">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-[#d4af37] whitespace-nowrap">
                          {Number(item.actual_cost || item.estimated_cost || 0).toLocaleString('de-DE')} €
                        </p>
                      </div>

                      {item.conflictWith && !item.isCurrentlyLinked && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Bereits verknüpft mit: {item.conflictWith}</span>
                        </div>
                      )}

                      {item.isCurrentlyLinked && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          <Check className="w-3 h-3" />
                          <span>Aktuell verknüpft</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t-2 border-[#d4af37]/20 bg-gradient-to-r from-[#f7f2eb]/50 to-white">
          <div className="mb-4">
            <div className="text-sm text-[#666666]">
              <p className="font-semibold text-[#0a253c]">
                {selectedCount} Budget-Posten ausgewählt
              </p>
              <p>Gesamtwert: {totalValue.toLocaleString('de-DE')} €</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-[#666666] border-2 border-gray-300 hover:bg-gray-50 transition-all font-medium disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white font-semibold hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2 min-h-[44px]"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Speichere...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Verknüpfungen speichern
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Create or get a dedicated modal container with highest z-index
  let budgetLinkingRoot = document.getElementById('budget-linking-modal-root');
  if (!budgetLinkingRoot) {
    budgetLinkingRoot = document.createElement('div');
    budgetLinkingRoot.id = 'budget-linking-modal-root';
    budgetLinkingRoot.style.position = 'fixed';
    budgetLinkingRoot.style.top = '0';
    budgetLinkingRoot.style.left = '0';
    budgetLinkingRoot.style.width = '100%';
    budgetLinkingRoot.style.height = '100%';
    budgetLinkingRoot.style.zIndex = '2147483647';
    budgetLinkingRoot.style.pointerEvents = 'none';
    document.body.appendChild(budgetLinkingRoot);
  }

  return createPortal(modalContent, budgetLinkingRoot);
}
