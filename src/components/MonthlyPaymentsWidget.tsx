import { useState, useEffect } from 'react';
import { Calendar, DollarSign, AlertCircle, CheckCircle, Clock, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BUDGET, COMMON } from '../constants/terminology';

interface Payment {
  payment_id: string;
  budget_item_id: string;
  item_name: string;
  vendor_name: string | null;
  amount: number;
  due_date: string;
  status: string;
  payment_type: string;
}

interface MonthlyPaymentsWidgetProps {
  weddingId: string;
  onShowAll?: () => void;
}

export default function MonthlyPaymentsWidget({ weddingId, onShowAll }: MonthlyPaymentsWidgetProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  useEffect(() => {
    loadPayments();
  }, [weddingId, selectedMonth]);

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase.rpc('get_monthly_payments', {
        p_wedding_id: weddingId,
        p_year: selectedMonth.year,
        p_month: selectedMonth.month
      });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading monthly payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentUrgency = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { level: 'overdue', color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/50', label: BUDGET.PAYMENT_STATUS.OVERDUE };
    if (diffDays <= 3) return { level: 'urgent', color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/50', label: `${diffDays} Tag(e)` };
    if (diffDays <= 7) return { level: 'warning', color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/50', label: `${diffDays} Tage` };
    return { level: 'ok', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/50', label: `${diffDays} Tage` };
  };

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingPayments = payments.filter(p => p.status !== 'paid');

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedMonth.year, selectedMonth.month - 1 + offset);
    setSelectedMonth({
      year: newDate.getFullYear(),
      month: newDate.getMonth() + 1
    });
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 shadow-lg sm:shadow-xl md:shadow-2xl border border-[#d4af37]/50 sm:border-2">
        <div className="animate-pulse space-y-2 sm:space-y-3 md:space-y-4">
          <div className="h-4 sm:h-5 md:h-6 bg-white/10 rounded w-1/2"></div>
          <div className="h-12 sm:h-16 md:h-20 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-lg sm:shadow-xl md:shadow-2xl border border-[#d4af37]/50 sm:border-2 overflow-hidden h-full flex flex-col">
      {/* Animated background effects */}
      <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-gradient-to-br from-[#d4af37]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 lg:w-80 lg:h-80 bg-gradient-to-tr from-[#f4d03f]/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMTIsIDE3NSwgNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 md:mb-5 lg:mb-6 gap-2 sm:gap-0">
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] w-8 h-8 sm:w-9 sm:h-9 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-md sm:shadow-lg shadow-[#d4af37]/50 animate-pulse">
              <Calendar className="w-4 h-4 sm:w-4 sm:h-4 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-white flex items-center gap-1 md:gap-2">
                <span className="hidden sm:inline">Fällige {BUDGET.PAYMENT_PLURAL}</span>
                <span className="sm:hidden">Zahlungen</span>
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#f4d03f] animate-sparkle" />
              </h3>
              <p className="text-[#d4af37] text-[10px] sm:text-xs md:text-sm font-medium">{COMMON.THIS_MONTH} zu zahlen</p>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 bg-white/5 backdrop-blur-sm rounded-md sm:rounded-lg md:rounded-xl px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 border border-white/10">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1 sm:p-1.5 md:p-2 hover:bg-white/10 rounded-md sm:rounded-lg transition-all hover:scale-110"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
            </button>
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-white min-w-[70px] sm:min-w-[90px] md:min-w-[120px] text-center">
              {monthNames[selectedMonth.month - 1]} {selectedMonth.year}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-1 sm:p-1.5 md:p-2 hover:bg-white/10 rounded-md sm:rounded-lg transition-all hover:scale-110"
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
            </button>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-6 sm:py-8 md:py-12 lg:py-16 bg-white/5 rounded-lg sm:rounded-xl md:rounded-2xl backdrop-blur-sm flex-grow flex items-center justify-center">
            <div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 shadow-md sm:shadow-lg shadow-green-500/30">
                <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-green-400" />
              </div>
              <p className="text-white/80 text-xs sm:text-sm md:text-base lg:text-lg font-semibold px-3 sm:px-4">Keine Zahlungen in diesem Monat fällig</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-grow">
            {/* Summary Stats */}
            <div className="mb-3 sm:mb-4 md:mb-5 lg:mb-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 lg:p-6 border border-[#d4af37]/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex-1">
                  <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-white/60 mb-0.5 sm:mb-1 font-medium">Gesamtsumme</p>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f4d03f] bg-clip-text text-transparent truncate">
                    {totalAmount.toFixed(2)}€
                  </p>
                </div>
                <div className="text-right flex-1">
                  <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-white/60 mb-0.5 sm:mb-1 font-medium">Offene</p>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-orange-400">{pendingPayments.length}</p>
                </div>
              </div>
            </div>

            {/* Payments List */}
            <div className="space-y-1.5 sm:space-y-2 md:space-y-3 overflow-y-auto flex-grow pr-0.5 sm:pr-1 md:pr-2 scrollbar-hide">
              {payments.map((payment) => {
                const urgency = getPaymentUrgency(payment.due_date);
                return (
                  <div
                    key={payment.payment_id}
                    className={`p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 rounded-md sm:rounded-lg md:rounded-xl border sm:border-2 transition-all hover:shadow-md sm:hover:shadow-lg backdrop-blur-sm ${
                      payment.status === 'paid'
                        ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
                        : `bg-white/5 ${urgency.borderColor} hover:bg-white/10`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1 md:mb-2">
                          <h4 className="font-bold text-white text-xs sm:text-sm md:text-base lg:text-lg truncate">{payment.item_name}</h4>
                          {payment.status === 'paid' && (
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
                          )}
                        </div>
                        {payment.vendor_name && (
                          <p className="text-[10px] sm:text-xs md:text-sm text-white/60 mb-0.5 sm:mb-1 md:mb-2 flex items-center gap-0.5 sm:gap-1 truncate">
                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 flex-shrink-0" />
                            <span className="truncate">{payment.vendor_name}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[9px] sm:text-[10px] md:text-xs lg:text-sm flex-wrap">
                          <span className={`font-semibold ${urgency.color} whitespace-nowrap`}>
                            {new Date(payment.due_date).toLocaleDateString('de-DE')}
                          </span>
                          {payment.status !== 'paid' && (
                            <span className={`px-1 sm:px-1.5 md:px-2 lg:px-3 py-0.5 md:py-1 rounded-full text-[9px] sm:text-[10px] md:text-xs font-bold ${urgency.color} ${urgency.bgColor} border ${urgency.borderColor} whitespace-nowrap`}>
                              {urgency.label}
                            </span>
                          )}
                          <span className="px-1 sm:px-1.5 md:px-2 lg:px-3 py-0.5 md:py-1 bg-white/10 backdrop-blur-sm rounded-full text-[9px] sm:text-[10px] md:text-xs font-bold text-white/80 capitalize border border-white/20 whitespace-nowrap">
                            {payment.payment_type === 'deposit' && 'Anzahlung'}
                            {payment.payment_type === 'milestone' && 'Teilzahlung'}
                            {payment.payment_type === 'final' && 'Restzahlung'}
                            {payment.payment_type === 'monthly' && 'Monatlich'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-1 sm:ml-2 md:ml-4 flex-shrink-0">
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f4d03f] bg-clip-text text-transparent">
                          {Number(payment.amount).toFixed(2)}€
                        </p>
                        {payment.status === 'paid' && (
                          <span className="text-[9px] sm:text-[10px] md:text-xs text-green-400 font-bold whitespace-nowrap">Bezahlt</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show All Button */}
            {onShowAll && (
              <button
                onClick={onShowAll}
                className="mt-3 sm:mt-4 md:mt-5 lg:mt-6 w-full bg-gradient-to-r from-[#d4af37] via-[#f4d03f] to-[#d4af37] hover:from-[#f4d03f] hover:via-[#d4af37] hover:to-[#f4d03f] text-[#0a253c] font-bold py-2 sm:py-2.5 md:py-3 lg:py-4 rounded-lg sm:rounded-xl md:rounded-2xl transition-all transform hover:scale-105 shadow-lg sm:shadow-xl md:shadow-2xl shadow-[#d4af37]/50 flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 group relative overflow-hidden text-xs sm:text-sm md:text-base lg:text-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:rotate-12 transition-transform" />
                <span className="truncate">Alle Zahlungen anzeigen</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
