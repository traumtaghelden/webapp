import { useState, useEffect } from 'react';
import { DollarSign, Link2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase, type BudgetItem, type BudgetPayment } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface LinkedBudgetItemsPanelProps {
  entityId: string;
  entityType: 'vendor' | 'location';
  entityName: string;
  weddingId: string;
  onLinkClick: () => void;
}

interface EnrichedBudgetItem extends BudgetItem {
  payments?: BudgetPayment[];
  totalPayments?: number;
  paidPayments?: number;
}

export default function LinkedBudgetItemsPanel({
  entityId,
  entityType,
  entityName,
  weddingId,
  onLinkClick,
}: LinkedBudgetItemsPanelProps) {
  const { showToast } = useToast();
  const [budgetItems, setBudgetItems] = useState<EnrichedBudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgetItems();
  }, [entityId, entityType]);

  const loadBudgetItems = async () => {
    try {
      setLoading(true);

      const filterColumn = entityType === 'vendor' ? 'vendor_id' : 'location_id';

      const { data: items } = await supabase
        .from('budget_items')
        .select('*')
        .eq('wedding_id', weddingId)
        .eq(filterColumn, entityId)
        .order('created_at', { ascending: false });

      if (items && items.length > 0) {
        const itemIds = items.map((item) => item.id);

        const { data: payments } = await supabase
          .from('budget_payments')
          .select('*')
          .in('budget_item_id', itemIds)
          .order('due_date', { ascending: true });

        const enrichedItems = items.map((item) => {
          const itemPayments = payments?.filter((p) => p.budget_item_id === item.id) || [];
          const totalPayments = itemPayments.length;
          const paidPayments = itemPayments.filter((p) => p.status === 'paid').length;

          return {
            ...item,
            payments: itemPayments,
            totalPayments,
            paidPayments,
          };
        });

        setBudgetItems(enrichedItems);
      } else {
        setBudgetItems([]);
      }
    } catch (error) {
      console.error('Error loading budget items:', error);
      showToast('Fehler beim Laden der Budget-Posten', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalCost = budgetItems.reduce(
      (sum, item) => sum + (Number(item.actual_cost) || Number(item.estimated_cost) || 0),
      0
    );

    const paidAmount = budgetItems.reduce((sum, item) => {
      const paidPayments = item.payments?.filter((p) => p.status === 'paid') || [];
      return sum + paidPayments.reduce((pSum, p) => pSum + Number(p.amount), 0);
    }, 0);

    const openAmount = totalCost - paidAmount;
    const isPaid = openAmount === 0 && totalCost > 0;

    return { totalCost, paidAmount, openAmount, isPaid };
  };

  const getPaymentStatusBadge = (item: EnrichedBudgetItem) => {
    if (!item.payments || item.payments.length === 0) {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Keine Zahlungen
        </span>
      );
    }

    if (item.paidPayments === item.totalPayments) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Vollständig bezahlt
        </span>
      );
    }

    if (item.paidPayments && item.paidPayments > 0) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {item.paidPayments} von {item.totalPayments} bezahlt
        </span>
      );
    }

    return (
      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Offen
      </span>
    );
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-[#f7f2eb]/30 rounded-xl p-4 border-2 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-[#0a253c] mb-1">Budget-Verwaltung</h4>
            <p className="text-sm text-[#666666]">
              Budget-Posten und Zahlungen werden im Budget-Modul verwaltet. Hier kannst du nur Verknüpfungen erstellen und die Übersicht sehen.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      {budgetItems.length > 0 && (
        <div className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl p-5 shadow-lg border-2 border-[#d4af37]/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold text-[#666666]">Gesamtkosten</span>
                <p className="text-3xl font-bold text-[#0a253c]">{totals.totalCost.toLocaleString('de-DE')} €</p>
              </div>
            </div>

            {totals.isPaid ? (
              <div className="bg-green-50 rounded-lg px-4 py-2 border-2 border-green-200 animate-pulse">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-bold text-green-700">Bezahlt</span>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 rounded-lg px-4 py-2 border-2 border-orange-200 animate-pulse">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-bold text-orange-700">Offen</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onLinkClick}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all min-h-[48px]"
        >
          <Link2 className="w-5 h-5" />
          <span>Budget-Posten verknüpfen</span>
        </button>
      </div>

      {/* Budget Items List */}
      {budgetItems.length === 0 ? (
        <div className="text-center py-16 bg-[#f7f2eb]/30 rounded-2xl border-2 border-dashed border-[#d4af37]/30">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <DollarSign className="w-10 h-10 text-[#d4af37]" />
          </div>
          <p className="text-[#0a253c] text-lg mb-2 font-semibold">Noch keine Budget-Posten verknüpft</p>
          <p className="text-[#666666] text-sm mb-6">
            Erstelle einen neuen Budget-Posten oder verknüpfe einen bestehenden
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgetItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-5 shadow-md border-2 border-gray-100 hover:border-[#d4af37]/40 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-[#0a253c] text-lg">{item.item_name}</h4>
                    {getPaymentStatusBadge(item)}
                  </div>

                  {item.category && (
                    <span className="inline-block px-2 py-1 bg-[#f7f2eb] text-[#0a253c] rounded-lg text-xs font-semibold mb-2">
                      {item.category}
                    </span>
                  )}

                  {item.payments && item.payments.length > 0 && (
                    <div className="mt-2 text-xs text-[#666666]">
                      {item.payments.length} {item.payments.length === 1 ? 'Zahlung' : 'Zahlungen'} erfasst
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-[#d4af37]">
                    {Number(item.actual_cost || item.estimated_cost || 0).toLocaleString('de-DE')} €
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
