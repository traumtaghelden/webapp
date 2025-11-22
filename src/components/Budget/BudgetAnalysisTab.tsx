import { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { type BudgetItem } from '../../lib/supabase';
import BudgetCharts from '../BudgetCharts';

interface BudgetAnalysisTabProps {
  weddingId: string;
  budgetItems: BudgetItem[];
  totalBudget: number;
}

export default function BudgetAnalysisTab({ weddingId, budgetItems, totalBudget }: BudgetAnalysisTabProps) {
  const [showCharts, setShowCharts] = useState(false);

  const calculateStats = () => {
    // Alle Budget-Posten summieren (egal ob bezahlt oder offen)
    const totalAllocated = budgetItems.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);

    // Nur bezahlte Posten summieren
    const totalPaid = budgetItems.reduce((sum, item) => {
      if (item.payment_status === 'paid') {
        return sum + (item.estimated_cost || 0);
      }
      return sum;
    }, 0);

    // Offene Beträge
    const totalOpen = totalAllocated - totalPaid;

    const remaining = totalBudget - totalAllocated;
    const percentUsed = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;
    const percentPaid = totalAllocated > 0 ? (totalPaid / totalAllocated) * 100 : 0;

    const categoryBreakdown: Record<string, {
      allocated: number;
      paid: number;
      open: number;
      count: number;
    }> = {};

    budgetItems.forEach(item => {
      const category = item.category || 'Sonstiges';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { allocated: 0, paid: 0, open: 0, count: 0 };
      }

      const amount = item.estimated_cost || 0;
      categoryBreakdown[category].allocated += amount;
      categoryBreakdown[category].count += 1;

      if (item.payment_status === 'paid') {
        categoryBreakdown[category].paid += amount;
      } else {
        categoryBreakdown[category].open += amount;
      }
    });

    return {
      totalAllocated,
      totalPaid,
      totalOpen,
      remaining,
      percentUsed,
      percentPaid,
      categoryBreakdown,
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl p-3 shadow-lg border border-[#d4af37]/10">
        <div>
          <h3 className="text-base font-bold text-[#0a253c] tracking-tight">Budget-Analyse</h3>
          <p className="text-xs text-[#666666] mt-0.5">Detaillierte Übersicht deiner Ausgaben und Zahlungen</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-[#0a253c] to-[#1a3a5c] rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#d4af37]" />
            </div>
            <span className="text-xs font-semibold opacity-90">Verplant</span>
          </div>
          <p className="text-xl font-bold mb-1">{stats.totalAllocated.toLocaleString('de-DE')} €</p>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex-1 bg-white/10 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] h-full rounded-full"
                style={{ width: `${Math.min(stats.percentUsed, 100)}%` }}
              />
            </div>
            <span className="font-semibold">{stats.percentUsed.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold opacity-90">Bezahlt</span>
          </div>
          <p className="text-xl font-bold mb-1">{stats.totalPaid.toLocaleString('de-DE')} €</p>
          <p className="text-xs opacity-90">{stats.percentPaid.toFixed(1)}% der verplanten Summe</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold opacity-90">Offen</span>
          </div>
          <p className="text-xl font-bold mb-1">{stats.totalOpen.toLocaleString('de-DE')} €</p>
          <p className="text-xs opacity-90">noch zu bezahlen</p>
        </div>

        <div className={`bg-gradient-to-br ${stats.remaining >= 0 ? 'from-blue-500 to-blue-600' : 'from-red-500 to-red-600'} rounded-xl p-4 text-white shadow-lg`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              {stats.remaining >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </div>
            <span className="text-xs font-semibold opacity-90">
              {stats.remaining >= 0 ? 'Verfügbar' : 'Überzogen'}
            </span>
          </div>
          <p className="text-xl font-bold mb-1">{Math.abs(stats.remaining).toLocaleString('de-DE')} €</p>
          <p className="text-xs opacity-90">
            {stats.remaining >= 0 ? 'noch im Budget' : 'über Budget'}
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl p-4 shadow-lg border border-[#d4af37]/10">
        <h4 className="text-sm font-bold text-[#0a253c] mb-3 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[#d4af37]" />
          Ausgaben nach Kategorie
        </h4>
        <button
          onClick={() => setShowCharts(true)}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
        >
          <PieChart className="w-4 h-4" />
          Detaillierte Visualisierung öffnen
        </button>
      </div>

      {showCharts && (
        <BudgetCharts
          budgetItems={budgetItems}
          totalBudget={totalBudget}
          onClose={() => setShowCharts(false)}
        />
      )}

      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl p-4 shadow-lg border border-[#d4af37]/10">
        <h4 className="text-sm font-bold text-[#0a253c] mb-4">Kategorie-Details</h4>
        <div className="space-y-3">
          {Object.entries(stats.categoryBreakdown)
            .sort((a, b) => b[1].allocated - a[1].allocated)
            .map(([category, data]) => {
              const percentage = stats.totalAllocated > 0 ? (data.allocated / stats.totalAllocated) * 100 : 0;
              const paidPercentage = data.allocated > 0 ? (data.paid / data.allocated) * 100 : 0;

              return (
                <div key={category} className="p-3 bg-white rounded-lg border border-[#d4af37]/10">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-[#0a253c]">{category}</p>
                      <p className="text-xs text-[#666666]">{data.count} Einträge</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#0a253c]">
                        {data.allocated.toLocaleString('de-DE')} €
                      </p>
                      <p className="text-xs text-[#666666]">
                        {percentage.toFixed(1)}% vom Gesamt
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#666666]">Bezahlt:</span>
                      <span className="font-semibold text-green-600">
                        {data.paid.toLocaleString('de-DE')} €
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#666666]">Offen:</span>
                      <span className="font-semibold text-orange-600">
                        {data.open.toLocaleString('de-DE')} €
                      </span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-[#666666]">Zahlungsfortschritt</span>
                      <span className="text-[10px] font-bold text-green-600">
                        {paidPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(paidPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          {Object.keys(stats.categoryBreakdown).length === 0 && (
            <div className="text-center py-12 text-[#666666]">
              <PieChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Noch keine Daten für Analyse verfügbar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
