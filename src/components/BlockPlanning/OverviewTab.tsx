import { useState, useEffect } from 'react';
import {
  Clock,
  CheckSquare,
  Briefcase,
  ClipboardList,
  Package,
  ArrowRight,
  AlertTriangle,
  Phone,
  Mail,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TimelineEvent, TimelineBlockSubtask, Vendor } from '../../lib/supabase';

interface OverviewTabProps {
  event: TimelineEvent;
  weddingId: string;
  onTabChange: (tab: string) => void;
}

interface Stats {
  subtasks: number;
  tasks: { total: number; completed: number };
  vendors: number;
  checklist: { total: number; completed: number };
  items: { total: number; packed: number };
  budget: { total: number; cost: number };
  totalCost: number;
}

export default function OverviewTab({ event, weddingId, onTabChange }: OverviewTabProps) {
  const [stats, setStats] = useState<Stats>({
    subtasks: 0,
    tasks: { total: 0, completed: 0 },
    vendors: 0,
    checklist: { total: 0, completed: 0 },
    items: { total: 0, packed: 0 },
    budget: { total: 0, cost: 0 },
    totalCost: 0,
  });
  const [subtasks, setSubtasks] = useState<TimelineBlockSubtask[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [event.id]);

  const loadStats = async () => {
    setLoading(true);

    const [subtasksRes, tasksRes, vendorsRes, checklistRes, itemsRes, budgetRes, vendorAssignmentsRes] = await Promise.all([
      supabase
        .from('timeline_block_subtasks')
        .select('*')
        .eq('timeline_event_id', event.id)
        .order('order_index', { ascending: true })
        .limit(5),
      supabase
        .from('tasks')
        .select('id, status', { count: 'exact' })
        .eq('timeline_event_id', event.id),
      supabase
        .from('vendors')
        .select('*')
        .eq('timeline_event_id', event.id)
        .limit(5),
      supabase
        .from('timeline_block_checklist')
        .select('id, is_completed', { count: 'exact' })
        .eq('timeline_event_id', event.id),
      supabase
        .from('timeline_block_items')
        .select('id, is_packed', { count: 'exact' })
        .eq('timeline_event_id', event.id),
      supabase
        .from('budget_items')
        .select('actual_cost', { count: 'exact' })
        .eq('timeline_event_id', event.id),
      supabase
        .from('vendor_event_assignments')
        .select('allocated_cost')
        .eq('timeline_event_id', event.id),
    ]);

    const completedTasks = tasksRes.data?.filter((t) => t.status === 'completed').length || 0;
    const completedChecklist =
      checklistRes.data?.filter((c) => c.is_completed).length || 0;
    const packedItems = itemsRes.data?.filter((i) => i.is_packed).length || 0;

    const budgetCost = budgetRes.data?.reduce((sum, item) => sum + (item.actual_cost || 0), 0) || 0;
    const vendorCost = vendorAssignmentsRes.data?.reduce((sum, item) => sum + (item.allocated_cost || 0), 0) || 0;
    const totalCost = budgetCost + vendorCost;

    setStats({
      subtasks: subtasksRes.data?.length || 0,
      tasks: { total: tasksRes.count || 0, completed: completedTasks },
      vendors: vendorsRes.data?.length || 0,
      checklist: { total: checklistRes.count || 0, completed: completedChecklist },
      items: { total: itemsRes.count || 0, packed: packedItems },
      budget: { total: budgetRes.count || 0, cost: budgetCost },
      totalCost,
    });

    setSubtasks(subtasksRes.data || []);
    setVendors(vendorsRes.data || []);

    setLoading(false);
  };

  const calculateOverallProgress = () => {
    const total =
      stats.tasks.total + stats.checklist.total + stats.items.total;
    const completed =
      stats.tasks.completed + stats.checklist.completed + stats.items.packed;

    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'text-red-600 bg-red-100';
    if (progress < 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-orange-100 text-orange-700',
      negotiating: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-blue-100 text-blue-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  const calculateAbsoluteTime = (offsetMinutes: number) => {
    const [hours, minutes] = event.time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + offsetMinutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  };

  const overallProgress = calculateOverallProgress();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <button
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200 text-center"
        >
          <div className="text-2xl font-bold text-blue-600">{overallProgress}%</div>
          <p className="text-xs text-gray-700 mt-1">Gesamt</p>
          <div className="w-full bg-white rounded-full h-1.5 overflow-hidden mt-2">
            <div
              className="bg-blue-600 h-full transition-all"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </button>

        <button
          onClick={() => onTabChange('subtimeline')}
          className="bg-white p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow transition-all text-center group"
        >
          <Clock className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-gray-900">{stats.subtasks}</div>
          <p className="text-xs text-gray-600 mt-1">Sub-Timeline</p>
        </button>

        <button
          onClick={() => onTabChange('tasks')}
          className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow transition-all text-center group"
        >
          <CheckSquare className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-gray-900">
            {stats.tasks.completed}/{stats.tasks.total}
          </div>
          <p className="text-xs text-gray-600 mt-1">Aufgaben</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mt-2">
            <div
              className="bg-blue-600 h-full transition-all"
              style={{
                width: `${
                  stats.tasks.total > 0
                    ? (stats.tasks.completed / stats.tasks.total) * 100
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </button>

        <button
          onClick={() => onTabChange('vendors')}
          className="bg-white p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow transition-all text-center group"
        >
          <Briefcase className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-gray-900">{stats.vendors}</div>
          <p className="text-xs text-gray-600 mt-1">Dienstleister</p>
        </button>

        <button
          onClick={() => onTabChange('checklist')}
          className="bg-white p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow transition-all text-center group"
        >
          <ClipboardList className="w-5 h-5 text-orange-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-gray-900">
            {stats.checklist.completed}/{stats.checklist.total}
          </div>
          <p className="text-xs text-gray-600 mt-1">Checkliste</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mt-2">
            <div
              className="bg-orange-600 h-full transition-all"
              style={{
                width: `${
                  stats.checklist.total > 0
                    ? (stats.checklist.completed / stats.checklist.total) * 100
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </button>

        <button
          onClick={() => onTabChange('items')}
          className="bg-white p-3 rounded-lg border border-gray-200 hover:border-pink-300 hover:shadow transition-all text-center group"
        >
          <Package className="w-5 h-5 text-pink-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-gray-900">
            {stats.items.packed}/{stats.items.total}
          </div>
          <p className="text-xs text-gray-600 mt-1">Utensilien</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mt-2">
            <div
              className="bg-pink-600 h-full transition-all"
              style={{
                width: `${
                  stats.items.total > 0 ? (stats.items.packed / stats.items.total) * 100 : 0
                }%`,
              }}
            ></div>
          </div>
        </button>

        <button
          onClick={() => onTabChange('budget')}
          className="bg-white p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow transition-all text-center group"
        >
          <Receipt className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-gray-900">
            {stats.totalCost.toLocaleString('de-DE')} €
          </div>
          <p className="text-xs text-gray-600 mt-1">Gesamtkosten</p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3 flex items-center justify-between border-b border-purple-200">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Sub-Timeline</h3>
            </div>
            {subtasks.length > 0 && (
              <button
                onClick={() => onTabChange('subtimeline')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                Alle anzeigen
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="p-4">
            {subtasks.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">Noch keine Sub-Events</p>
                <button
                  onClick={() => onTabChange('subtimeline')}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Jetzt erstellen
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {subtask.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <span className="font-medium">
                            {calculateAbsoluteTime(subtask.start_offset_minutes)}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span>{subtask.duration_minutes} Min</span>
                          {subtask.assigned_to && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="truncate">{subtask.assigned_to}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 flex items-center justify-between border-b border-green-200">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Dienstleister</h3>
            </div>
            {vendors.length > 0 && (
              <button
                onClick={() => onTabChange('vendors')}
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
              >
                Alle anzeigen
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="p-4">
            {vendors.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">Noch keine Dienstleister</p>
                <button
                  onClick={() => onTabChange('vendors')}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Jetzt zuweisen
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {vendor.name}
                        </h4>
                        <p className="text-xs text-gray-600">{vendor.category}</p>
                      </div>
                      {getStatusBadge(vendor.contract_status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      {vendor.phone && (
                        <a
                          href={`tel:${vendor.phone}`}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-3 h-3" />
                          {vendor.phone}
                        </a>
                      )}
                      {vendor.email && (
                        <a
                          href={`mailto:${vendor.email}`}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="w-3 h-3" />
                          {vendor.email}
                        </a>
                      )}
                      {vendor.total_cost && (
                        <span className="flex items-center gap-1 font-medium text-gray-900">
                          <DollarSign className="w-3 h-3" />
                          {vendor.total_cost.toLocaleString('de-DE', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {event.description && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">Event-Beschreibung</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{event.description}</p>
        </div>
      )}

      {(stats.tasks.total - stats.tasks.completed > 0 ||
        stats.checklist.total - stats.checklist.completed > 0 ||
        stats.items.total - stats.items.packed > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Offene Punkte</h3>
              <ul className="space-y-1 text-xs text-gray-700">
                {stats.tasks.total - stats.tasks.completed > 0 && (
                  <li>
                    {stats.tasks.total - stats.tasks.completed} offene Aufgabe
                    {stats.tasks.total - stats.tasks.completed !== 1 ? 'n' : ''}
                  </li>
                )}
                {stats.checklist.total - stats.checklist.completed > 0 && (
                  <li>
                    {stats.checklist.total - stats.checklist.completed} offene
                    Checklisten-Punkte
                  </li>
                )}
                {stats.items.total - stats.items.packed > 0 && (
                  <li>
                    {stats.items.total - stats.items.packed} ungepackte{' '}
                    {stats.items.total - stats.items.packed !== 1 ? 'Items' : 'Item'}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
