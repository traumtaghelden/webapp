import React, { useState, useEffect } from 'react';
import { Webhook, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function WebhooksTab() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error('Error loading webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusBadge = (hasStripeId: boolean) => {
    if (hasStripeId) {
      return (
        <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
          <CheckCircle className="w-3 h-3" />
          Success
        </span>
      );
    }
    return (
      <span className="bg-gray-500/20 text-gray-400 border border-gray-500/30 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
          <AlertCircle className="w-3 h-3" />
          Manual
        </span>
    );
  };

  const filteredWebhooks = webhooks.filter((webhook) => {
    if (filter === 'success') return webhook.stripe_subscription_id;
    if (filter === 'failed') return !webhook.stripe_subscription_id;
    return true;
  });

  const successCount = webhooks.filter((w) => w.stripe_subscription_id).length;
  const failedCount = webhooks.filter((w) => !w.stripe_subscription_id).length;
  const successRate =
    webhooks.length > 0 ? ((successCount / webhooks.length) * 100).toFixed(1) : 0;

  if (loading) {
    return <div className="text-white text-center py-12">Lade Webhooks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#0A1F3D]/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Webhook className="w-6 h-6 text-[#F5B800]" />
          Webhook-Logs
        </h2>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a3a5c] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Total Events</p>
            <p className="text-3xl font-bold text-white">{webhooks.length}</p>
          </div>

          <div className="bg-[#1a3a5c] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Success</p>
            <p className="text-3xl font-bold text-green-400">{successCount}</p>
          </div>

          <div className="bg-[#1a3a5c] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Manual</p>
            <p className="text-3xl font-bold text-gray-400">{failedCount}</p>
          </div>

          <div className="bg-[#1a3a5c] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Success Rate</p>
            <p className="text-3xl font-bold text-[#F5B800]">{successRate}%</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-[#F5B800] text-gray-900'
                : 'bg-transparent text-gray-400 border border-gray-600 hover:bg-gray-700/30'
            }`}
          >
            Alle Events
          </button>

          <button
            onClick={() => setFilter('success')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'success'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-transparent text-gray-400 border border-gray-600 hover:bg-gray-700/30'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Success
          </button>

          <button
            onClick={() => setFilter('failed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'failed'
                ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                : 'bg-transparent text-gray-400 border border-gray-600 hover:bg-gray-700/30'
            }`}
          >
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Manual
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a3a5c]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Event Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Stripe Subscription ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredWebhooks.map((webhook) => (
                <tr key={webhook.id} className="hover:bg-[#1a3a5c]/50 transition-all">
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {formatDate(webhook.created_at)}
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{webhook.event_type}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm font-mono">
                    {webhook.stripe_subscription_id || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(!!webhook.stripe_subscription_id)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredWebhooks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Webhook className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Keine Webhook-Events vorhanden</p>
          </div>
        )}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-blue-400 text-sm">
          <strong>Hinweis:</strong> Diese Tabelle zeigt die letzten 100 Subscription-Events. Stripe-Webhooks werden automatisch verarbeitet und hier protokolliert. Manuelle Admin-Aktionen werden ebenfalls erfasst.
        </p>
      </div>
    </div>
  );
}
