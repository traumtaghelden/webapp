import { X, PieChart, BarChart3, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type BudgetItem } from '../lib/supabase';

interface BudgetChartsProps {
  budgetItems: BudgetItem[];
  totalBudget: number;
  onClose: () => void;
}

export default function BudgetCharts({ budgetItems, totalBudget, onClose }: BudgetChartsProps) {
  // Body scroll lock beim Öffnen des Modals
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const safeBudgetItems = budgetItems || [];

  const groupedByCategory = safeBudgetItems.reduce((acc, item) => {
    const category = item?.category || 'Unkategorisiert';
    const cost = item?.actual_cost || item?.estimated_cost || 0;
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0, paid: 0, open: 0 };
    }
    acc[category].total += cost;
    if (item?.paid || item?.payment_status === 'paid') {
      acc[category].paid += cost;
    } else {
      acc[category].open += cost;
    }
    acc[category].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number; paid: number; open: number }>);

  const categories = Object.entries(groupedByCategory);
  const totalAmount = safeBudgetItems.reduce((sum, item) => sum + (item?.actual_cost || item?.estimated_cost || 0), 0);
  const totalPaid = safeBudgetItems.reduce((sum, item) => {
    const cost = item?.actual_cost || item?.estimated_cost || 0;
    return sum + (item?.paid || item?.payment_status === 'paid' ? cost : 0);
  }, 0);
  const totalOpen = totalAmount - totalPaid;

  const categoryColors = [
    '#d4af37', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#ef4444', '#06b6d4',
  ];

  const pieChartData = categories.map(([category, data], index) => ({
    category,
    value: data.total,
    percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
    color: categoryColors[index % categoryColors.length],
  }));

  const totalPercentage = pieChartData.reduce((sum, d) => sum + d.percentage, 0);
  const maxValue = Math.max(...categories.map(([, data]) => data.total), 1);
  let currentAngle = 0;

  if (safeBudgetItems.length === 0) {
    const emptyContent = (
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden transition-opacity duration-300"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, opacity: 1 }}
      >
        <div className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-2xl max-w-lg w-full p-8 relative border border-[#F5B800]/30">
          <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-[#d4af37]/5 pointer-events-none rounded-2xl"></div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-[#1a3a5c] rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative z-10 text-center">
            <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-[#d4af37]/50">
              <PieChart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Keine Budget-Daten</h2>
            <p className="text-gray-300 mb-6">
              Fügen Sie Budget-Posten hinzu, um die Visualisierung zu sehen.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all min-h-[40px]"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    );
    return createPortal(emptyContent, document.body);
  }

  const svgPaths = pieChartData.map((data) => {
    const startAngle = currentAngle;
    const angle = (data.percentage / 100) * 360;
    currentAngle += angle;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (currentAngle - 90) * (Math.PI / 180);

    const x1 = 50 + 45 * Math.cos(startRad);
    const y1 = 50 + 45 * Math.sin(startRad);
    const x2 = 50 + 45 * Math.cos(endRad);
    const y2 = 50 + 45 * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M 50 50`,
      `L ${x1} ${y1}`,
      `A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`,
    ].join(' ');

    return {
      path: pathData,
      color: data.color,
      category: data.category,
      percentage: data.percentage,
      value: data.value,
    };
  });

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden transition-opacity duration-300"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, opacity: 1 }}
    >
      <div
        className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-2xl w-full shadow-2xl border border-[#F5B800]/30 transition-transform duration-500 relative mx-auto flex flex-col"
        style={{
          transform: 'scale(1)',
          maxWidth: 'min(1200px, calc(100vw - 2rem))',
          maxHeight: 'calc(100vh - 2rem)'
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-[#d4af37]/5 pointer-events-none rounded-2xl"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>

        {/* Header */}
        <div className="relative z-10 flex items-start gap-3 p-4 border-b border-gray-700/50 flex-shrink-0">
          <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-4 rounded-xl shadow-2xl shadow-[#d4af37]/50">
            <PieChart className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-bold text-white mb-1">Budget-Visualisierung</h2>
            <p className="text-sm text-gray-300">Detaillierte Übersicht & Diagramme</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all hover:rotate-90 duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Pie Chart */}
              <div className="bg-[#1a3a5c]/50 backdrop-blur-sm rounded-xl p-5 border border-[#d4af37]/20">
                <div className="flex items-center gap-2 mb-6">
                  <PieChart className="w-6 h-6 text-[#d4af37]" />
                  <h3 className="text-xl font-bold text-white">Budget-Verteilung</h3>
                </div>

                <div className="flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-64 h-64">
                    {svgPaths.map((segment, index) => (
                      <g key={index}>
                        <path
                          d={segment.path}
                          fill={segment.color}
                          className="transition-all duration-300 hover:opacity-80"
                        />
                        <title>
                          {segment.category}: {(segment?.value || 0).toLocaleString('de-DE')} € ({(segment?.percentage || 0).toFixed(1)}%)
                        </title>
                      </g>
                    ))}
                    <circle cx="50" cy="50" r="20" fill="#0A1F3D" />
                    <text
                      x="50"
                      y="48"
                      textAnchor="middle"
                      className="text-xs font-bold fill-white"
                    >
                      {(totalAmount || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                    </text>
                    <text
                      x="50"
                      y="56"
                      textAnchor="middle"
                      className="text-[0.5rem] fill-gray-300"
                    >
                      Euro
                    </text>
                  </svg>
                </div>

                <div className="space-y-2 mt-6">
                  {pieChartData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-[#0A1F3D]/50 hover:bg-[#0A1F3D]/70 border border-[#d4af37]/10 hover:border-[#d4af37]/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full shadow-lg"
                          style={{ backgroundColor: data.color }}
                        />
                        <span className="text-sm font-semibold text-gray-200 capitalize">{data.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">
                          {(data?.value || 0).toLocaleString('de-DE')} €
                        </p>
                        <p className="text-xs text-gray-400">{(data?.percentage || 0).toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget Statistics */}
              <div className="bg-[#1a3a5c]/50 backdrop-blur-sm rounded-xl p-5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">Budget-Statistiken</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#0A1F3D]/50 rounded-xl border border-[#d4af37]/10">
                    <span className="text-sm text-gray-300">Gesamtbudget</span>
                    <span className="text-lg font-bold text-white">{(totalBudget || 0).toLocaleString('de-DE')} €</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#0A1F3D]/50 rounded-xl border border-[#d4af37]/10">
                    <span className="text-sm text-gray-300">Gesamtkosten</span>
                    <span className="text-lg font-bold text-blue-400">{(totalAmount || 0).toLocaleString('de-DE')} €</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#0A1F3D]/50 rounded-xl border border-green-500/30">
                    <span className="text-sm text-gray-300">Bereits bezahlt</span>
                    <span className="text-lg font-bold text-green-400">{(totalPaid || 0).toLocaleString('de-DE')} €</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#0A1F3D]/50 rounded-xl border border-orange-500/30">
                    <span className="text-sm text-gray-300">Noch offen</span>
                    <span className="text-lg font-bold text-orange-400">{(totalOpen || 0).toLocaleString('de-DE')} €</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#0A1F3D]/50 rounded-xl border border-[#d4af37]/10">
                    <span className="text-sm text-gray-300">Verbleibend (Budget)</span>
                    <span className={`text-lg font-bold ${(totalBudget || 0) - (totalAmount || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {((totalBudget || 0) - (totalAmount || 0)).toLocaleString('de-DE')} €
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#0A1F3D]/50 rounded-xl border border-[#d4af37]/10">
                    <span className="text-sm text-gray-300">Anzahl Posten</span>
                    <span className="text-lg font-bold text-white">{safeBudgetItems.length}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#0A1F3D]/50 rounded-xl border border-[#d4af37]/10">
                    <span className="text-sm text-gray-300">Durchschn. Kosten pro Posten</span>
                    <span className="text-lg font-bold text-white">
                      {safeBudgetItems.length > 0 ? ((totalAmount || 0) / safeBudgetItems.length).toLocaleString('de-DE', { maximumFractionDigits: 0 }) : 0} €
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#0A1F3D]/50 rounded-xl border border-[#d4af37]/10">
                    <span className="text-sm text-gray-300">Budget-Ausschöpfung</span>
                    <span className={`text-lg font-bold ${(totalBudget || 0) > 0 && ((totalAmount || 0) / (totalBudget || 1)) * 100 > 90 ? 'text-red-400' : 'text-green-400'}`}>
                      {(totalBudget || 0) > 0 ? Math.round(((totalAmount || 0) / (totalBudget || 1)) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Category Breakdown */}
              <div className="bg-[#1a3a5c]/50 backdrop-blur-sm rounded-xl p-5 border border-[#d4af37]/20">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-6 h-6 text-[#d4af37]" />
                  <h3 className="text-xl font-bold text-white">Kosten nach Kategorie</h3>
                </div>

                <div className="space-y-6">
                  {categories.map(([category, data], index) => {
                    const totalWidth = ((data?.total || 0) / maxValue) * 100;
                    const paidWidth = data?.total ? ((data?.paid || 0) / data.total) * 100 : 0;

                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-200 capitalize">{category}</span>
                          <span className="text-xs text-gray-400">{data.count} Posten</span>
                        </div>

                        <div className="space-y-2">
                          <div className="relative">
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                              <span>Gesamt</span>
                              <span className="font-semibold text-white">
                                {(data?.total || 0).toLocaleString('de-DE')} €
                              </span>
                            </div>
                            <div className="w-full bg-[#0A1F3D]/50 rounded-full h-3 overflow-hidden border border-[#d4af37]/10">
                              <div
                                className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] h-full rounded-full transition-all duration-500"
                                style={{ width: `${totalWidth}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[0.65rem] text-gray-500">
                            <span>Bezahlt: {(data?.paid || 0).toLocaleString('de-DE')} € ({paidWidth.toFixed(0)}%)</span>
                            <span>Offen: {(data?.open || 0).toLocaleString('de-DE')} €</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top 5 Expenses */}
              <div className="bg-[#1a3a5c]/50 backdrop-blur-sm rounded-xl p-5 border border-green-500/20">
                <h3 className="text-xl font-bold text-white mb-4">Top 5 Ausgaben</h3>
                <div className="space-y-3">
                  {[...safeBudgetItems]
                    .sort((a, b) => {
                      const costA = a.actual_cost || a.estimated_cost || 0;
                      const costB = b.actual_cost || b.estimated_cost || 0;
                      return costB - costA;
                    })
                    .slice(0, 5)
                    .map((item, index) => {
                      const cost = item.actual_cost || item.estimated_cost || 0;
                      const isPaid = item.paid || item.payment_status === 'paid';
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-[#0A1F3D]/50 rounded-xl border border-[#d4af37]/10 hover:border-[#d4af37]/30 hover:bg-[#0A1F3D]/70 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                              <span className="text-sm font-bold text-[#d4af37]">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-200">{item.item_name}</p>
                              <p className="text-xs text-gray-400 capitalize">{item.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${isPaid ? 'text-green-400' : 'text-orange-400'}`}>
                              {cost.toLocaleString('de-DE')} €
                            </p>
                            <p className="text-xs text-gray-500">{isPaid ? 'Bezahlt' : 'Offen'}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Payment Status Overview */}
              <div className="bg-[#1a3a5c]/50 backdrop-blur-sm rounded-xl p-5 border border-yellow-500/20">
                <h3 className="text-xl font-bold text-white mb-4">Zahlungsstatus</h3>
                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span>Fortschritt</span>
                      <span className="font-semibold text-white">
                        {totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0}% bezahlt
                      </span>
                    </div>
                    <div className="w-full bg-[#0A1F3D]/50 rounded-full h-4 overflow-hidden border border-[#d4af37]/10">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget Status */}
                  <div className={`p-4 rounded-xl border ${
                    (totalBudget || 0) >= totalAmount
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className={`w-5 h-5 ${
                        (totalBudget || 0) >= totalAmount ? 'text-green-400' : 'text-red-400'
                      }`} />
                      <span className={`font-semibold ${
                        (totalBudget || 0) >= totalAmount ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(totalBudget || 0) >= totalAmount ? 'Budget eingehalten' : 'Budget überschritten'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">
                      {(totalBudget || 0) >= totalAmount
                        ? `Noch ${((totalBudget || 0) - totalAmount).toLocaleString('de-DE')} € verfügbar`
                        : `Budget um ${(totalAmount - (totalBudget || 0)).toLocaleString('de-DE')} € überschritten`
                      }
                    </p>
                  </div>

                  {/* Open Items Warning */}
                  {totalOpen > 0 && (
                    <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-orange-400" />
                        <span className="font-semibold text-orange-400">Offene Zahlungen</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        {safeBudgetItems.filter(item => !item.paid && item.payment_status !== 'paid').length} Posten mit {totalOpen.toLocaleString('de-DE')} € noch offen
                      </p>
                    </div>
                  )}

                  {totalOpen === 0 && safeBudgetItems.length > 0 && (
                    <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30 text-center">
                      <p className="text-green-400 font-semibold">Alle Rechnungen bezahlt! 🎉</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
