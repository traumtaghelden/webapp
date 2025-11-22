import { useState, useEffect } from 'react';
import { Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Payment {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  payment_method?: string;
  budget_item_id: string;
  budget_item?: {
    name: string;
    category: string;
  };
}

interface BudgetPaymentsTabProps {
  weddingId: string;
}

export default function BudgetPaymentsTab({ weddingId }: BudgetPaymentsTabProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>('all');

  useEffect(() => {
    loadPayments();
  }, [weddingId]);

  const loadPayments = async () => {
    try {
      const { data: budgetItems } = await supabase
        .from('budget_items')
        .select('id, item_name, category')
        .eq('wedding_id', weddingId);

      const { data: paymentsData } = await supabase
        .from('budget_payments')
        .select('*')
        .in('budget_item_id', budgetItems?.map(item => item.id) || [])
        .order('due_date', { ascending: true });

      const enrichedPayments = paymentsData?.map(payment => ({
        ...payment,
        budget_item: budgetItems?.find(item => item.id === payment.budget_item_id),
      })) || [];

      setPayments(enrichedPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyPayments = () => {
    const grouped: Record<string, Payment[]> = {};

    payments.forEach(payment => {
      const date = new Date(payment.due_date);
      const monthKey = date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long' });

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(payment);
    });

    return grouped;
  };

  const getPaymentStats = () => {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const paid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const planned = payments.filter(p => p.status === 'planned').reduce((sum, p) => sum + p.amount, 0);

    return { total, paid, planned };
  };

  const getStatusIcon = (payment: Payment) => {
    if (payment.status === 'paid') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return <Clock className="w-5 h-5 text-orange-500" />;
  };

  const getStatusBadge = (payment: Payment) => {
    if (payment.status === 'paid') {
      return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Bezahlt</span>;
    }
    return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">Geplant</span>;
  };

  const monthlyPayments = getMonthlyPayments();
  const stats = getPaymentStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Lade Zahlungen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-[#0a253c]">Zahlungsplan</h3>
        <p className="text-gray-600 mt-1">Übersicht aller geplanten und bezahlten Rechnungen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8" />
            <span className="text-sm font-semibold opacity-90">Gesamt</span>
          </div>
          <p className="text-3xl font-bold">{stats.total.toLocaleString('de-DE')} €</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8" />
            <span className="text-sm font-semibold opacity-90">Geplant</span>
          </div>
          <p className="text-3xl font-bold">{stats.planned.toLocaleString('de-DE')} €</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-8 h-8" />
            <span className="text-sm font-semibold opacity-90">Bezahlt</span>
          </div>
          <p className="text-3xl font-bold">{stats.paid.toLocaleString('de-DE')} €</p>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(monthlyPayments).map(([month, monthPayments]) => (
          <div key={month} className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <Calendar className="w-6 h-6 text-[#d4af37]" />
              <h4 className="text-xl font-bold text-[#0a253c]">{month}</h4>
              <span className="ml-auto px-3 py-1 bg-[#f7f2eb] text-[#d4af37] rounded-full text-sm font-bold">
                {monthPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('de-DE')} €
              </span>
            </div>

            <div className="space-y-3">
              {monthPayments.map(payment => (
                <div
                  key={payment.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(payment)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0a253c] mb-1">{payment.budget_item?.item_name || 'Unbekannt'}</p>
                    <p className="text-sm text-gray-600">
                      Fällig am: {new Date(payment.due_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-[#0a253c]">{payment.amount.toLocaleString('de-DE')} €</p>
                    {getStatusBadge(payment)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {payments.length === 0 && (
          <div className="text-center py-16 bg-[#f7f2eb] rounded-2xl">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Calendar className="w-10 h-10 text-[#d4af37]" />
            </div>
            <p className="text-gray-600 text-lg mb-2 font-semibold">Keine Zahlungen geplant</p>
            <p className="text-gray-500 text-sm">Füge Budget-Einträge mit Zahlungsplänen hinzu</p>
          </div>
        )}
      </div>
    </div>
  );
}
