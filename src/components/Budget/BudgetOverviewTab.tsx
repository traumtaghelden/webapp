import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Folder, X, Search, ChevronDown, ChevronUp, CheckSquare } from 'lucide-react';
import { supabase, type BudgetItem, type BudgetCategory } from '../../lib/supabase';
import { BUDGET, COMMON } from '../../constants/terminology';
import BudgetTable from './BudgetTable';
import { useToast } from '../../contexts/ToastContext';

interface BudgetOverviewTabProps {
  weddingId: string;
  budgetItems: BudgetItem[];
  enrichedItems: BudgetItem[];
  totalBudget: number;
  categories: BudgetCategory[];
  categorySpending: Record<string, { planned: number; actual: number }>;
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onEditCategory: (category: BudgetCategory) => void;
  onAddEntry: () => void;
  onAddCategory: () => void;
  onViewItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdate: () => void;
}

export default function BudgetOverviewTab({
  weddingId,
  budgetItems,
  enrichedItems,
  totalBudget,
  categories,
  categorySpending,
  selectedCategory,
  onSelectCategory,
  onEditCategory,
  onAddEntry,
  onAddCategory,
  onViewItem,
  onDeleteItem,
  onUpdate,
}: BudgetOverviewTabProps) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const search = localStorage.getItem(`budget-search-${weddingId}`);
    if (search) setSearchQuery(search);
  }, [weddingId]);

  useEffect(() => {
    localStorage.setItem(`budget-search-${weddingId}`, searchQuery);
  }, [searchQuery, weddingId]);

  useEffect(() => {
    setShowBulkActions(selectedItemIds.size > 0);
  }, [selectedItemIds]);

  const filteredItems = useMemo(() => {
    if (!debouncedSearch.trim()) return enrichedItems;

    const query = debouncedSearch.toLowerCase();
    return enrichedItems.filter(item =>
      item.item_name?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.notes?.toLowerCase().includes(query)
    );
  }, [enrichedItems, debouncedSearch]);

  const handleSelectItem = (itemId: string, selected: boolean) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItemIds(new Set(filteredItems.map(item => item.id)));
    } else {
      setSelectedItemIds(new Set());
    }
  };

  const handleBulkPaymentStatusChange = async (status: 'open' | 'paid') => {
    if (selectedItemIds.size === 0) return;

    try {
      const updates: { id: string; payment_status?: string; is_manually_paid?: boolean; paid?: boolean }[] = Array.from(selectedItemIds).map(id => {
        const update: any = { id, payment_status: status };

        if (status === 'paid') {
          update.is_manually_paid = true;
          update.paid = true;
        } else {
          update.is_manually_paid = false;
          update.paid = false;
        }

        return update;
      });

      for (const update of updates) {
        const { error } = await supabase
          .from('budget_items')
          .update({
            payment_status: update.payment_status,
            is_manually_paid: update.is_manually_paid,
            paid: update.paid
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      showToast(`${selectedItemIds.size} ${BUDGET.ITEM_PLURAL} aktualisiert`, 'success');
      setSelectedItemIds(new Set());
      setShowBulkActions(false);
      onUpdate();
    } catch (error) {
      console.error('Error bulk updating:', error);
      showToast('Fehler beim Aktualisieren', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl p-3 shadow-lg border border-[#d4af37]/10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 mb-2">
          <h3 className="text-base font-bold text-[#0a253c] tracking-tight">Alle {BUDGET.ITEM_PLURAL}</h3>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onAddEntry}
              className="flex items-center gap-1 px-3 py-1 bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{BUDGET.ADD_ITEM}</span>
              <span className="sm:hidden">Neu</span>
            </button>

            <button
              onClick={onAddCategory}
              className="flex items-center gap-1 px-3 py-1 border-2 border-[#d4af37] text-[#d4af37] rounded-lg text-xs font-bold hover:bg-[#f7f2eb] hover:scale-105 transition-all duration-300 active:scale-95"
            >
              <Folder className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{BUDGET.CATEGORY}</span>
              <span className="sm:hidden">Kategorie</span>
            </button>
          </div>
        </div>

        <div className="relative mb-2 group">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#666666] transition-all duration-300 group-focus-within:text-[#d4af37]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${BUDGET.ITEM_PLURAL} durchsuchen...`}
            className="w-full pl-8 pr-8 py-1.5 text-sm rounded-lg border border-[#d4af37]/20 bg-white focus:border-[#d4af37] focus:shadow-md focus:shadow-[#d4af37]/10 focus:outline-none transition-all duration-300 placeholder:text-[#999999]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-[#d4af37] transition-all duration-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowCategoryFilter(!showCategoryFilter)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#666666] hover:text-[#d4af37] hover:bg-[#f7f2eb] rounded-lg transition-all duration-200 w-full justify-center border border-[#d4af37]/20"
        >
          <Folder className="w-3.5 h-3.5" />
          Kategorien filtern
          {showCategoryFilter ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showCategoryFilter && (
          <div className="mt-2 p-2 bg-[#f7f2eb]/50 rounded-lg border border-[#d4af37]/20 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onSelectCategory(null)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-200 ${
                  !selectedCategory
                    ? 'bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white shadow-md'
                    : 'bg-white text-[#666666] hover:bg-[#f7f2eb] hover:text-[#d4af37] border border-[#d4af37]/20'
                }`}
              >
                Alle
              </button>
              {categories.map((category) => {
                const spending = categorySpending[category.id] || { planned: 0, actual: 0 };
                const itemCount = enrichedItems.filter(item => item.budget_category_id === category.id).length;

                return (
                  <button
                    key={category.id}
                    onClick={() => onSelectCategory(category.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white shadow-md'
                        : 'bg-white text-[#666666] hover:bg-[#f7f2eb] hover:text-[#d4af37] border border-[#d4af37]/20'
                    }`}
                  >
                    {category.name}
                    <span className={`ml-0.5 px-1 py-0.5 rounded text-[10px] font-bold ${
                      selectedCategory === category.id
                        ? 'bg-white/20 text-white'
                        : 'bg-[#d4af37]/10 text-[#d4af37]'
                    }`}>
                      {itemCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <BudgetTable
        items={filteredItems}
        onEdit={onViewItem}
        onDelete={onDeleteItem}
        onView={onViewItem}
        selectedCategory={selectedCategory}
        selectedItemIds={selectedItemIds}
        onSelectItem={handleSelectItem}
        onSelectAll={handleSelectAll}
      />

      {showBulkActions && createPortal(
        <div
          className="fixed bottom-0 left-0 right-0 bg-[#0a253c] text-white p-4 shadow-lg animate-in slide-in-from-bottom duration-300"
          style={{ zIndex: 10000 }}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-bold text-sm sm:text-base">{selectedItemIds.size} {BUDGET.ITEM_PLURAL} ausgewählt</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkPaymentStatusChange(e.target.value as any);
                    e.target.value = '';
                  }
                }}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg bg-white text-[#0a253c] font-semibold text-sm"
              >
                <option value="">Zahlstatus ändern...</option>
                <option value="paid">Bezahlt</option>
                <option value="open">Offen</option>
              </select>

              <button
                onClick={() => {
                  setSelectedItemIds(new Set());
                  setShowBulkActions(false);
                }}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all text-sm"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Abbrechen</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
