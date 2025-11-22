import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import type { BudgetItem, Wedding } from '../../lib/supabase';
import MonthlyPaymentsWidget from '../MonthlyPaymentsWidget';

interface DashboardBudgetTabProps {
  weddingId: string;
  wedding: Wedding;
  budgetItems: BudgetItem[];
  onNavigate: (tab: string) => void;
}

export default function DashboardBudgetTab({
  weddingId,
  wedding,
  budgetItems,
  onNavigate
}: DashboardBudgetTabProps) {
  const totalSpent = budgetItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
  const totalEstimated = budgetItems.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
  const remaining = wedding.total_budget - totalSpent;
  const percentageUsed = Math.round((totalSpent / wedding.total_budget) * 100);

  const unpaidItems = budgetItems.filter(item => item.payment_status !== 'paid');
  const totalUnpaid = unpaidItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0);

  const overBudgetItems = budgetItems.filter(
    item => item.actual_cost && item.estimated_cost && item.actual_cost > item.estimated_cost
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Budget-Übersicht</h3>
        <p className="text-sm sm:text-base text-gray-300 mt-1">Deine Finanzen auf einen Blick</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-green-50 to-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-md sm:shadow-lg border border-green-200 sm:border-2">
          <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
            <div className="bg-green-100 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
            </div>
          </div>
          <div className="mb-1 sm:mb-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">
              {totalSpent.toLocaleString('de-DE')} €
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">Ausgegeben</h3>
          <p className="text-xs sm:text-sm text-gray-700">
            von {wedding.total_budget.toLocaleString('de-DE')} € Budget
          </p>
          <div className="mt-2 sm:mt-3 md:mt-4 w-full bg-gray-200 rounded-full h-2 sm:h-2.5 md:h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-md sm:shadow-lg border border-blue-200 sm:border-2">
          <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
            <div className="bg-blue-100 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
          </div>
          <div className="mb-1 sm:mb-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
              {remaining.toLocaleString('de-DE')} €
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">Verbleibend</h3>
          <p className="text-xs sm:text-sm text-gray-700">
            {100 - percentageUsed}% des Budgets übrig
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-md sm:shadow-lg border border-orange-200 sm:border-2">
          <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
            <div className="bg-orange-100 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-600" />
            </div>
          </div>
          <div className="mb-1 sm:mb-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">
              {totalUnpaid.toLocaleString('de-DE')} €
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">Unbezahlt</h3>
          <p className="text-xs sm:text-sm text-gray-700">
            {unpaidItems.length} offene Posten
          </p>
        </div>
      </div>

      <MonthlyPaymentsWidget
        weddingId={weddingId}
        onShowAll={() => onNavigate('budget')}
      />

      {overBudgetItems.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-md sm:shadow-lg border border-red-200 sm:border-2">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="bg-red-100 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Budget-Überschreitungen</h3>
              <p className="text-xs sm:text-sm text-gray-700">{overBudgetItems.length} Posten über dem geplanten Budget</p>
            </div>
          </div>
          <div className="space-y-3">
            {overBudgetItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-red-200">
                <div>
                  <p className="font-medium text-gray-900">{item.item_name}</p>
                  <p className="text-sm text-gray-700">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">
                    +{((item.actual_cost || 0) - (item.estimated_cost || 0)).toLocaleString('de-DE')} €
                  </p>
                  <p className="text-xs text-gray-700">über Budget</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate('budget')}
            className="mt-4 w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl font-bold shadow-lg transition-all"
          >
            Alle Budget-Posten anzeigen
          </button>
        </div>
      )}

      <button
        onClick={() => onNavigate('budget')}
        className="w-full bg-gradient-to-r from-[#0a253c] to-[#1a3a5c] hover:shadow-xl text-white py-4 rounded-2xl font-bold shadow-lg transition-all"
      >
        Zum vollständigen Budget
      </button>
    </div>
  );
}
