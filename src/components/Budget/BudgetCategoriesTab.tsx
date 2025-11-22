import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { type BudgetCategory } from '../../lib/supabase';
import { BUDGET, COMMON } from '../../constants/terminology';

interface BudgetCategoriesTabProps {
  categories: BudgetCategory[];
  categorySpending: Record<string, { planned: number; actual: number; paid: number }>;
  onEditCategory: (category: BudgetCategory) => void;
  onAddCategory: () => void;
  onDeleteCategory: (categoryId: string) => void;
}

export default function BudgetCategoriesTab({
  categories,
  categorySpending,
  onEditCategory,
  onAddCategory,
  onDeleteCategory,
}: BudgetCategoriesTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl p-3 shadow-lg border border-[#d4af37]/10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#0a253c] tracking-tight">Kategorie-Verwaltung</h3>
            <p className="text-xs text-[#666666] mt-0.5">Verwalte deine Budget-Kategorien</p>
          </div>
          <button
            onClick={onAddCategory}
            className="flex items-center gap-1 px-3 py-1 bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kategorie erstellen</span>
            <span className="sm:hidden">Neu</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const spending = categorySpending[category.id] || { planned: 0, actual: 0, paid: 0 };
          const percentage = spending.planned > 0 ? (spending.actual / spending.planned) * 100 : 0;
          const isOverBudget = spending.actual > spending.planned && spending.planned > 0;

          return (
            <div
              key={category.id}
              className="p-3 bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl hover:shadow-xl hover:shadow-[#d4af37]/10 transition-all duration-300 border border-[#d4af37]/10 hover:border-[#d4af37]/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: category.color || '#d4af37' }}
                    />
                    <h4 className="text-sm font-bold text-[#0a253c]">{category.name}</h4>
                  </div>
                  {category.description && (
                    <p className="text-xs text-[#666666] line-clamp-2">{category.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => onEditCategory(category)}
                    className="p-1.5 text-gray-400 hover:text-[#d4af37] hover:bg-[#f7f2eb] rounded-lg transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteCategory(category.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#666666]">Geplant:</span>
                  <span className="font-bold text-[#0a253c]">
                    {spending.planned.toLocaleString('de-DE')} €
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#666666]">Ausgegeben:</span>
                  <span className={`font-bold ${isOverBudget ? 'text-red-500' : 'text-[#0a253c]'}`}>
                    {spending.actual.toLocaleString('de-DE')} €
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#666666]">Davon bezahlt:</span>
                  <span className="font-bold text-green-600">
                    {spending.paid.toLocaleString('de-DE')} €
                  </span>
                </div>

                <div className="pt-2 border-t border-[#d4af37]/10">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-[#666666]">Auslastung</span>
                    <span className={`text-[10px] font-bold ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
                      {percentage > 100 ? '>100' : percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverBudget ? 'bg-red-500' : 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f]'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  {isOverBudget && (
                    <div className="flex items-center gap-1 mt-1.5 text-red-500">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="text-[10px] font-semibold">Budget überschritten!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-16 bg-[#f7f2eb] rounded-2xl">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Plus className="w-10 h-10 text-[#d4af37]" />
            </div>
            <p className="text-gray-600 text-lg mb-2 font-semibold">Noch keine Kategorien</p>
            <p className="text-gray-500 text-sm mb-6">Erstelle deine erste Budget-Kategorie</p>
            <button
              onClick={onAddCategory}
              className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all min-h-[40px]"
            >
              Kategorie erstellen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
