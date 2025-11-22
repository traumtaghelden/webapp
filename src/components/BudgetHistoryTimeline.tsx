import { useState, useEffect } from 'react';
import { X, History, TrendingUp, TrendingDown, Plus, Trash, Edit, DollarSign, Download } from 'lucide-react';
import { supabase, type BudgetHistory } from '../lib/supabase';

interface BudgetHistoryTimelineProps {
  weddingId: string;
  onClose: () => void;
}

export default function BudgetHistoryTimeline({ weddingId, onClose }: BudgetHistoryTimelineProps) {
  const [history, setHistory] = useState<BudgetHistory[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Body scroll lock
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  useEffect(() => {
    loadHistory();
  }, [weddingId]);

  const loadHistory = async () => {
    try {
      const { data } = await supabase
        .from('budget_history')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: false });

      if (data) setHistory(data);
    } catch (error) {
      console.error('Error loading budget history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (filterAction && item.action !== filterAction) return false;
    return true;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="w-5 h-5 text-green-500" />;
      case 'deleted':
        return <Trash className="w-5 h-5 text-red-500" />;
      case 'updated':
        return <Edit className="w-5 h-5 text-blue-500" />;
      case 'payment_status_changed':
        return <DollarSign className="w-5 h-5 text-[#d4af37]" />;
      default:
        return <History className="w-5 h-5 text-[#333333]" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 border-green-300';
      case 'deleted':
        return 'bg-red-100 border-red-300';
      case 'updated':
        return 'bg-blue-100 border-blue-300';
      case 'payment_status_changed':
        return 'bg-[#d4af37]/10 border-[#d4af37]/30';
      default:
        return 'bg-[#f7f2eb] border-[#d4af37]/30';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created':
        return 'Erstellt';
      case 'deleted':
        return 'Gelöscht';
      case 'updated':
        return 'Aktualisiert';
      case 'payment_status_changed':
        return 'Bezahlstatus geändert';
      default:
        return action;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportToCSV = () => {
    const headers = ['Datum', 'Aktion', 'Feld', 'Alter Wert', 'Neuer Wert'];
    const rows = filteredHistory.map((item) => [
      formatDate(item.created_at),
      getActionLabel(item.action),
      item.field_changed || '',
      item.old_value || '',
      item.new_value || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `budget-historie-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[#d4af37]/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#0a253c]">Budget-Historie</h2>
                <p className="text-sm text-[#333333]">Chronologische Übersicht aller Budget-Änderungen</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="p-2 hover:bg-[#f7f2eb] rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-[#333333]" />
            </button>
          </div>

          <div className="flex gap-3 flex-wrap">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 border-[#d4af37]/30 focus:border-[#d4af37] focus:outline-none text-sm"
            >
              <option value="">Alle Aktionen</option>
              <option value="created">Erstellt</option>
              <option value="updated">Aktualisiert</option>
              <option value="deleted">Gelöscht</option>
              <option value="payment_status_changed">Bezahlstatus geändert</option>
            </select>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#d4af37] text-[#0a253c] rounded-xl font-bold hover:bg-[#c19a2e] transition-all"
            >
              <Download className="w-4 h-4" />
              CSV Export
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-[#d4af37] mx-auto mb-4 animate-pulse" />
              <p className="text-[#333333]">Lade Historie...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-[#d4af37] mx-auto mb-4 opacity-50" />
              <p className="text-[#333333]">Keine Historie-Einträge vorhanden</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#d4af37] via-[#f4d03f] to-[#d4af37]/30"></div>

              <div className="space-y-6">
                {filteredHistory.map((item, index) => (
                  <div key={item.id} className="relative pl-20">
                    <div className="absolute left-5 top-2 w-6 h-6 rounded-full bg-white border-4 flex items-center justify-center shadow-lg">
                      {getActionIcon(item.action)}
                    </div>

                    <div
                      className={`p-4 rounded-xl border-2 ${getActionColor(
                        item.action
                      )} hover:shadow-md transition-all`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-[#0a253c]">{getActionLabel(item.action)}</span>
                            {item.field_changed && (
                              <span className="text-xs px-2 py-0.5 bg-white rounded-full text-[#333333]">
                                {item.field_changed}
                              </span>
                            )}
                          </div>
                          {item.new_value && (
                            <p className="text-sm text-[#333333]">
                              {item.action === 'created' && `Neuer Posten: ${item.new_value}`}
                              {item.action === 'deleted' && `Gelöschter Posten: ${item.old_value}`}
                              {item.action === 'updated' && item.field_changed === 'actual_cost' && (
                                <>
                                  {item.old_value && `${parseFloat(item.old_value).toLocaleString('de-DE')} €`}
                                  {item.old_value && (
                                    <span className="mx-2">
                                      {parseFloat(item.new_value) > parseFloat(item.old_value || '0') ? (
                                        <TrendingUp className="w-4 h-4 inline text-red-500" />
                                      ) : (
                                        <TrendingDown className="w-4 h-4 inline text-green-500" />
                                      )}
                                    </span>
                                  )}
                                  {parseFloat(item.new_value).toLocaleString('de-DE')} €
                                </>
                              )}
                              {item.action === 'payment_status_changed' && (
                                <>
                                  {item.old_value === 'false' && item.new_value === 'true' && '✓ Als bezahlt markiert'}
                                  {item.old_value === 'true' && item.new_value === 'false' && '✗ Als unbezahlt markiert'}
                                </>
                              )}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-[#333333] whitespace-nowrap">{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
