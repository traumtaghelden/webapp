import { useState, useEffect } from 'react';
import { Clock, Edit2, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HistoryEntry {
  id: string;
  budget_item_id: string | null;
  change_type: string;
  old_value: number | null;
  new_value: number | null;
  changed_by: string;
  created_at: string;
  budget_item?: {
    name: string;
    category: string;
  };
}

interface BudgetHistoryTabProps {
  weddingId: string;
}

export default function BudgetHistoryTab({ weddingId }: BudgetHistoryTabProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadHistory();
  }, [weddingId]);

  const loadHistory = async () => {
    try {
      const { data: budgetItems } = await supabase
        .from('budget_items')
        .select('id, item_name, category')
        .eq('wedding_id', weddingId);

      const { data: historyData } = await supabase
        .from('budget_history')
        .select('*')
        .in('budget_item_id', budgetItems?.map(item => item.id) || [])
        .order('created_at', { ascending: false });

      const enrichedHistory = historyData?.map(entry => ({
        ...entry,
        budget_item: budgetItems?.find(item => item.id === entry.budget_item_id),
      })) || [];

      setHistory(enrichedHistory);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'created': 'Erstellt',
      'estimated_cost_changed': 'Geplante Kosten geändert',
      'actual_cost_changed': 'Tatsächliche Kosten geändert',
      'status_changed': 'Status geändert',
      'deleted': 'Gelöscht',
    };
    return labels[type] || type;
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <Calendar className="w-3.5 h-3.5 text-green-600" />;
      case 'estimated_cost_changed':
      case 'actual_cost_changed':
        return <DollarSign className="w-3.5 h-3.5 text-blue-600" />;
      case 'deleted':
        return <TrendingDown className="w-3.5 h-3.5 text-red-600" />;
      default:
        return <Edit2 className="w-3.5 h-3.5 text-gray-600" />;
    }
  };

  const filteredHistory = filterType === 'all'
    ? history
    : history.filter(entry => entry.change_type === filterType);

  const groupedHistory: Record<string, HistoryEntry[]> = {};
  filteredHistory.forEach(entry => {
    const date = new Date(entry.created_at).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groupedHistory[date]) {
      groupedHistory[date] = [];
    }
    groupedHistory[date].push(entry);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Lade Änderungsverlauf...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl p-3 shadow-lg border border-[#d4af37]/10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#0a253c] tracking-tight">Änderungsverlauf</h3>
            <p className="text-xs text-[#666666] mt-0.5">Alle Änderungen im Überblick</p>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-xs border border-[#d4af37]/20 rounded-lg font-semibold bg-white focus:border-[#d4af37] focus:shadow-md focus:shadow-[#d4af37]/10 focus:outline-none transition-all duration-300"
          >
          <option value="all">Alle Änderungen</option>
          <option value="created">Neu erstellt</option>
          <option value="estimated_cost_changed">Geplante Kosten</option>
          <option value="actual_cost_changed">Tatsächliche Kosten</option>
          <option value="deleted">Gelöscht</option>
        </select>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(groupedHistory).map(([date, entries]) => (
          <div key={date} className="p-3 bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl shadow-lg border border-[#d4af37]/10">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#d4af37]/10">
              <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
              <h4 className="text-sm font-bold text-[#0a253c]">{date}</h4>
              <span className="ml-auto px-3 py-1 bg-[#f7f2eb] text-[#d4af37] rounded-full text-sm font-bold">
                {entries.length} {entries.length === 1 ? 'Änderung' : 'Änderungen'}
              </span>
            </div>

            <div className="space-y-3">
              {entries.map(entry => (
                <div key={entry.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex-shrink-0 mt-1">
                    {getChangeIcon(entry.change_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0a253c] mb-1">
                      {entry.budget_item?.item_name || 'Unbekannter Eintrag'}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {getChangeTypeLabel(entry.change_type)}
                    </p>
                    {entry.old_value !== null && entry.new_value !== null && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-500">{entry.old_value.toLocaleString('de-DE')} €</span>
                        <TrendingUp className={`w-4 h-4 ${entry.new_value > entry.old_value ? 'text-red-500' : 'text-green-600'}`} />
                        <span className={`font-bold ${entry.new_value > entry.old_value ? 'text-red-500' : 'text-green-600'}`}>
                          {entry.new_value.toLocaleString('de-DE')} €
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {new Date(entry.created_at).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredHistory.length === 0 && (
          <div className="text-center py-16 bg-[#f7f2eb] rounded-2xl">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Clock className="w-10 h-10 text-[#d4af37]" />
            </div>
            <p className="text-gray-600 text-lg mb-2 font-semibold">Kein Änderungsverlauf</p>
            <p className="text-gray-500 text-sm">
              {filterType === 'all'
                ? 'Noch keine Änderungen vorgenommen'
                : 'Keine Änderungen dieses Typs gefunden'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
