import { useState, useEffect, lazy, Suspense, memo, useCallback, useMemo, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { DollarSign, Calendar, FileText, Upload, Download, Trash2, Plus, Edit2, Check, Users, Building2, CheckCircle, Clock, Save, History, X } from 'lucide-react';
import { supabase, type BudgetItem, type BudgetPayment, type BudgetAttachment, type Vendor } from '../lib/supabase';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';
import ModalConfirm from './ModalConfirm';
import BudgetItemProKopfForm from './BudgetItemProKopfForm';
import ManualPaymentToggle from './ManualPaymentToggle';
import { BUDGET, COMMON } from '../constants/terminology';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useToast } from '../contexts/ToastContext';
import { scrollLockManager } from '../utils/scrollLockManager';

interface BudgetDetailModalProps {
  isOpen: boolean;
  budgetItemId: string;
  weddingId: string;
  onClose: () => void;
  onUpdate: () => void;
}

type TabType = 'overview' | 'attachments' | 'history';

const getCategoryTranslation = (category: string): string => {
  const translations: Record<string, string> = {
    venue: 'Location',
    catering: 'Catering',
    decoration: 'Dekoration',
    music: 'Musik',
    photography: 'Fotografie',
    flowers: 'Blumen',
    dress: 'Kleid',
    rings: 'Ringe',
    invitations: 'Einladungen',
    other: 'Sonstiges',
  };
  return translations[category.toLowerCase()] || category;
};

interface TimelineEvent {
  id: string;
  title: string;
  start_time: string;
  event_type: string;
}

export default function BudgetDetailModal({ isOpen, budgetItemId, weddingId, onClose, onUpdate }: BudgetDetailModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [budgetItem, setBudgetItem] = useState<BudgetItem | null>(null);
  const [payments, setPayments] = useState<BudgetPayment[]>([]);
  const [attachments, setAttachments] = useState<BudgetAttachment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editedItem, setEditedItem] = useState<Partial<BudgetItem>>({});

  // Performance: Debounce expensive inputs - always provide fallback values
  const debouncedItemName = useDebouncedValue(editedItem.item_name || '', 300);
  const debouncedActualCost = useDebouncedValue(editedItem.actual_cost || 0, 300);
  const debouncedEstimatedCost = useDebouncedValue(editedItem.estimated_cost || 0, 300);
  const [showDeleteAttachmentConfirm, setShowDeleteAttachmentConfirm] = useState<{ id: string; url: string } | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      scrollLockManager.lock();
      return () => {
        scrollLockManager.unlock();
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Performance: Load data but don't block UI
      startTransition(() => {
        loadData();
      });
    }
  }, [isOpen, budgetItemId]);

  const updateBudgetItemPaymentStatus = async () => {
    try {
      const { data: paymentsData } = await supabase
        .from('budget_payments')
        .select('*')
        .eq('budget_item_id', budgetItemId);

      if (paymentsData && budgetItem) {
        const totalPaid = paymentsData
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0);

        // Simplified: only 'open' or 'paid'
        let newPaymentStatus: 'open' | 'paid' = 'open';

        if (totalPaid >= budgetItem.actual_cost) {
          newPaymentStatus = 'paid';
        } else {
          newPaymentStatus = 'open';
        }

        await supabase
          .from('budget_items')
          .update({
            payment_status: newPaymentStatus,
            paid: newPaymentStatus === 'paid'
          })
          .eq('id', budgetItemId);
      }
    } catch (error) {
      console.error('Error updating budget item payment status:', error);
    }
  };

  const loadData = async () => {
    try {
      const [itemData, paymentsData, attachmentsData, vendorsData, locationsData, timelineData, historyData] = await Promise.all([
        supabase.from('budget_items').select('*').eq('id', budgetItemId).maybeSingle(),
        supabase.from('budget_payments').select('*').eq('budget_item_id', budgetItemId).order('due_date', { ascending: true }),
        supabase.from('budget_attachments').select('*').eq('budget_item_id', budgetItemId).order('created_at', { ascending: false }),
        supabase.from('vendors').select('*').eq('wedding_id', weddingId),
        supabase.from('locations').select('*').eq('wedding_id', weddingId),
        supabase.from('wedding_day_blocks').select('id, title, start_time, event_type').eq('wedding_id', weddingId).order('start_time', { ascending: true }),
        supabase.from('budget_history').select('*').eq('budget_item_id', budgetItemId).order('created_at', { ascending: false }).limit(50),
      ]);

      if (itemData.data) {
        setBudgetItem(itemData.data);
        setEditedItem(itemData.data);
      }
      if (paymentsData.data) setPayments(paymentsData.data);
      if (attachmentsData.data) setAttachments(attachmentsData.data);
      if (vendorsData.data) setVendors(vendorsData.data);
      if (locationsData.data) setLocations(locationsData.data);
      if (timelineData.data) setTimelineEvents(timelineData.data);
      if (historyData.data) setHistoryEntries(historyData.data);
    } catch (error) {
      console.error('Error loading budget details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProKopfChange = (data: {
    is_per_person: boolean;
    cost_per_person: number | null;
    use_confirmed_guests_only: boolean;
    guest_count_override: number | null;
  }) => {
    setEditedItem({
      ...editedItem,
      is_per_person: data.is_per_person,
      cost_per_person: data.cost_per_person,
      use_confirmed_guests_only: data.use_confirmed_guests_only,
      guest_count_override: data.guest_count_override,
    });
  };

  const handleSave = useCallback(async () => {
    if (!budgetItem) return;

    try {
      await supabase
        .from('budget_items')
        .update(editedItem)
        .eq('id', budgetItemId);

      setBudgetItem({ ...budgetItem, ...editedItem });
      setEditMode(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating budget item:', error);
    }
  }, [budgetItem, editedItem, budgetItemId, onUpdate]);

  // Performance: Memoize expensive calculations - MUST be before any returns
  const financialMetrics = useMemo(() => {
    if (!budgetItem) {
      return {
        totalPaid: 0,
        totalPlanned: 0,
        remainingBalance: 0,
        baseCost: 0,
        taxAmount: 0,
        totalWithTax: 0,
        netCost: 0,
        grossCost: 0
      };
    }

    const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const totalOpen = payments.filter(p => p.status === 'open').reduce((sum, p) => sum + p.amount, 0);
    const baseCost = budgetItem.actual_cost || budgetItem.estimated_cost;
    const taxAmount = baseCost * (budgetItem.tax_rate / 100);
    const totalWithTax = baseCost + taxAmount;

    return {
      totalPaid,
      totalOpen,
      baseCost,
      taxAmount,
      totalWithTax,
      netCost: baseCost,
      grossCost: totalWithTax
    };
  }, [payments, budgetItem]);

  const selectedVendor = useMemo(
    () => budgetItem ? vendors.find(v => v.id === budgetItem.vendor_id) : undefined,
    [vendors, budgetItem]
  );

  const selectedLocation = useMemo(
    () => budgetItem ? locations.find(l => l.id === budgetItem.location_id) : undefined,
    [locations, budgetItem]
  );

  const calculateFinancials = (item: BudgetItem) => {
    const baseCost = item.actual_cost || item.estimated_cost;
    const taxAmount = baseCost * (item.tax_rate / 100);
    const totalWithTax = baseCost + taxAmount;

    return {
      baseCost,
      taxAmount,
      totalWithTax,
      netCost: baseCost,
      grossCost: totalWithTax
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${budgetItemId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('budget-attachments')
        .upload(fileName, file);

      if (uploadError) {
        if (uploadError.message?.includes('Bucket not found')) {
          showToast('Der Datei-Upload ist noch nicht konfiguriert. Bitte erstellen Sie den Storage-Bucket "budget-attachments" in Ihrem Supabase Dashboard.', 'error');
          return;
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('budget-attachments')
        .getPublicUrl(fileName);

      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('budget_attachments').insert([{
        budget_item_id: budgetItemId,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        attachment_type: 'other',
        uploaded_by: user?.id,
      }]);

      showToast('Datei erfolgreich hochgeladen', 'success');
      loadData();
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Fehler beim Hochladen der Datei', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async () => {
    if (!showDeleteAttachmentConfirm) return;

    try {
      const fileName = showDeleteAttachmentConfirm.url.split('/').slice(-2).join('/');
      await supabase.storage.from('budget-attachments').remove([fileName]);
      await supabase.from('budget_attachments').delete().eq('id', showDeleteAttachmentConfirm.id);
      loadData();
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-3xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!budgetItem) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-3xl p-8">
          <p className="text-white">Budget-Posten nicht gefunden</p>
        </div>
      </div>
    );
  }

  // Early return if no budget item loaded yet
  if (!budgetItem) {
    return (
      <StandardModal
        isOpen={isOpen}
        onClose={onClose}
        title="Lädt..."
        icon={DollarSign}
        maxWidth="6xl"
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]"></div>
        </div>
      </StandardModal>
    );
  }

  const financials = calculateFinancials(budgetItem);

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-gradient-to-b from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-2xl sm:rounded-3xl shadow-gold-lg border-2 border-[#d4af37]/30 max-w-4xl w-full max-h-[95vh] sm:max-h-[85vh] flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMTIsIDE3NSwgNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
        <div className="relative z-10 p-3 sm:p-4 border-b border-[#d4af37]/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2 pr-8 sm:pr-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] rounded-xl blur-md opacity-60 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-[#d4af37] to-[#f4d03f] w-10 h-10 rounded-xl flex items-center justify-center shadow-gold flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white">{budgetItem.item_name}</h2>
                <p className="text-xs text-white/70">Kategorie: {getCategoryTranslation(budgetItem.category)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d4af37] text-white rounded-lg font-semibold hover:bg-[#c19a2e] transition-all shadow-lg text-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Bearbeiten
                </button>
              )}
              {editMode && (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all text-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Speichern
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setEditedItem(budgetItem);
                    }}
                    className="px-3 py-1.5 border border-[#d4af37] text-[#d4af37] rounded-lg font-semibold hover:bg-[#d4af37]/10 transition-all text-sm"
                  >
                    Abbrechen
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full transition-all hover:scale-110 absolute top-3 right-3 sm:static"
              >
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>
          </div>

          <div className="flex gap-1 sm:gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {[
              { id: 'overview', label: 'Übersicht', icon: FileText },
              { id: 'attachments', label: 'Anhänge', icon: Upload },
              { id: 'history', label: 'Verlauf', icon: History },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap text-xs ${
                  activeTab === tab.id
                    ? 'bg-[#d4af37] text-white shadow-lg'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto p-3 sm:p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-br from-[#1a3a5c] to-[#0a253c] rounded-xl p-4 border border-[#d4af37]/20 hover:border-[#d4af37]/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#d4af37]/20 rounded-lg">
                      <DollarSign className="w-5 h-5 text-[#d4af37]" />
                    </div>
                    <span className="text-sm font-semibold text-white/70 uppercase tracking-wide">Kosten</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    budgetItem.payment_status === 'paid'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  }`}>
                    {budgetItem.payment_status === 'paid' ? 'Bezahlt' : 'Offen'}
                  </span>
                </div>
                {editMode ? (
                  <input
                    type="number"
                    value={editedItem.actual_cost || 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setEditedItem({ ...editedItem, actual_cost: value, estimated_cost: value });
                    }}
                    className="w-full px-3 py-2 text-2xl font-bold text-white bg-white/10 rounded-lg border border-[#d4af37]/50 focus:border-[#d4af37] focus:outline-none transition-all"
                    step="0.01"
                    min="0"
                  />
                ) : (
                  <p className="text-3xl font-bold text-white">
                    {budgetItem.actual_cost.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {budgetItem.currency}
                  </p>
                )}
              </div>

              <ManualPaymentToggle
                budgetItemId={budgetItem.id}
                isManuallyPaid={budgetItem.is_manually_paid || false}
                actualCost={budgetItem.actual_cost || 0}
                estimatedCost={budgetItem.estimated_cost || 0}
                onUpdate={async (isManuallyPaid) => {
                  await loadData();
                  onUpdate();
                }}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Bezeichnung</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedItem.item_name || ''}
                      onChange={(e) => setEditedItem({ ...editedItem, item_name: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[#d4af37]/30 focus:border-[#d4af37] focus:outline-none bg-white/10 text-white"
                    />
                  ) : (
                    <p className="text-white font-semibold">{budgetItem.item_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Dienstleister</label>
                  {editMode ? (
                    <select
                      value={editedItem.vendor_id || ''}
                      onChange={(e) => setEditedItem({ ...editedItem, vendor_id: e.target.value || null })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[#d4af37]/30 focus:border-[#d4af37] focus:outline-none bg-white/10 text-white"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" style={{ backgroundColor: '#0a253c', color: '#ffffff', padding: '8px' }}>Kein Dienstleister</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id} style={{ backgroundColor: '#0a253c', color: '#ffffff', padding: '8px' }}>{v.name} - {v.category}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-white">
                      {selectedVendor ? (
                        <span className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#d4af37]" />
                          {selectedVendor.name}
                        </span>
                      ) : (
                        'Nicht zugewiesen'
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Location</label>
                  {editMode ? (
                    <select
                      value={editedItem.location_id || ''}
                      onChange={(e) => setEditedItem({ ...editedItem, location_id: e.target.value || null })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[#d4af37]/30 focus:border-[#d4af37] focus:outline-none bg-white/10 text-white"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" style={{ backgroundColor: '#0a253c', color: '#ffffff', padding: '8px' }}>Keine Location</option>
                      {locations.map(l => (
                        <option key={l.id} value={l.id} style={{ backgroundColor: '#0a253c', color: '#ffffff', padding: '8px' }}>{l.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-white">
                      {selectedLocation ? (
                        <span className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#d4af37]" />
                          {selectedLocation.name}
                        </span>
                      ) : (
                        'Nicht zugewiesen'
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                    Timeline-Event
                  </label>
                  {editMode ? (
                    <select
                      value={editedItem.timeline_event_id || ''}
                      onChange={(e) => setEditedItem({ ...editedItem, timeline_event_id: e.target.value || null })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[#d4af37]/30 focus:border-[#d4af37] focus:outline-none bg-white/10 text-white"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" style={{ backgroundColor: '#0a253c', color: '#ffffff', padding: '8px' }}>Kein Event</option>
                      {timelineEvents.map(event => (
                        <option key={event.id} value={event.id} style={{ backgroundColor: '#0a253c', color: '#ffffff', padding: '8px' }}>
                          {event.start_time} - {event.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-white">
                      {budgetItem?.timeline_event_id ? (
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#d4af37]" />
                          {timelineEvents.find(e => e.id === budgetItem.timeline_event_id)?.title || 'Event nicht gefunden'}
                        </span>
                      ) : (
                        'Nicht verknüpft'
                      )}
                    </p>
                  )}
                </div>

                <div>
                  {(() => {
                    const nextPayment = payments
                      .filter(p => p.status !== 'paid')
                      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

                    const allPaid = payments.length > 0 && payments.every(p => p.status === 'paid');

                    return (
                      <>
                        <label className="block text-xs font-semibold text-white/70 mb-1.5">
                          {allPaid ? 'Zahlungsstatus' : 'Nächste Zahlung'}
                        </label>
                        {allPaid ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="text-green-600 font-bold">Vollständig bezahlt</p>
                          </div>
                        ) : nextPayment ? (
                          <div className="space-y-1">
                            <p className="text-white font-bold">
                              {nextPayment.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {budgetItem.currency}
                            </p>
                            <p className="text-sm text-white/60 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Fällig am: {new Date(nextPayment.due_date).toLocaleDateString('de-DE')}
                            </p>
                            {nextPayment.notes && (
                              <p className="text-xs text-white/60">{nextPayment.notes}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-white/60">Keine offenen Zahlungen</p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Notizen</label>
                {editMode ? (
                  <textarea
                    value={editedItem.notes || ''}
                    onChange={(e) => setEditedItem({ ...editedItem, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#d4af37]/30 focus:border-[#d4af37] focus:outline-none"
                    rows={4}
                    placeholder="Zusätzliche Informationen..."
                  />
                ) : (
                  <p className="text-white whitespace-pre-wrap">{budgetItem.notes || 'Keine Notizen'}</p>
                )}
              </div>

              {editMode && (
                <div className="relative">
                  <label className="block text-sm font-semibold text-white/70 mb-2">Pro-Kopf-Kalkulation</label>
                  <BudgetItemProKopfForm
                    weddingId={weddingId}
                    isPerPerson={editedItem.is_per_person || false}
                    costPerPerson={editedItem.cost_per_person || null}
                    useConfirmedGuestsOnly={editedItem.use_confirmed_guests_only || false}
                    guestCountOverride={editedItem.guest_count_override || null}
                    onChange={handleProKopfChange}
                  />
                </div>
              )}

              {!editMode && budgetItem.is_per_person && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-white">Pro-Kopf-Kalkulation aktiv</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Kosten pro Gast:</p>
                      <p className="font-bold text-white">{budgetItem.cost_per_person?.toFixed(2) || '0.00'}€</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Gästeanzahl-Basis:</p>
                      <p className="font-bold text-white">
                        {budgetItem.guest_count_override
                          ? `${budgetItem.guest_count_override} (überschrieben)`
                          : budgetItem.use_confirmed_guests_only
                          ? 'Bestätigte Gäste'
                          : 'Geplante Gäste'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}


          {activeTab === 'attachments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Dokumente & Anhänge</h3>
                <label className="flex items-center gap-2 px-4 py-2 bg-[#d4af37] text-white rounded-xl font-bold hover:bg-[#c19a2e] transition-all cursor-pointer">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Wird hochgeladen...' : 'Datei hochladen'}
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={uploading}
                  />
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="p-4 rounded-xl bg-white/10 border-2 border-[#d4af37]/30 hover:border-[#d4af37] transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-[#d4af37] flex-shrink-0" />
                          <p className="font-semibold text-white truncate">{attachment.file_name}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/60">
                          <span>{(attachment.file_size / 1024).toFixed(0)} KB</span>
                          <span>{attachment.attachment_type}</span>
                          <span>{new Date(attachment.created_at).toLocaleDateString('de-DE')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-[#d4af37]/20 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4 text-[#d4af37]" />
                        </a>
                        <button
                          onClick={() => setShowDeleteAttachmentConfirm({ id: attachment.id, url: attachment.file_url })}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {attachments.length === 0 && (
                <div className="text-center py-12">
                  <Upload className="w-16 h-16 text-[#d4af37] mx-auto mb-4 opacity-50" />
                  <p className="text-white/70">Noch keine Dateien hochgeladen</p>
                </div>
              )}
            </div>
          )}



          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Änderungsverlauf</h3>
                  <p className="text-sm text-white/60 mt-1">Alle Änderungen an diesem Budget-Posten</p>
                </div>
              </div>

              {historyEntries.length > 0 ? (
                <div className="space-y-3">
                  {historyEntries.map((entry, index) => {
                    const changes = entry.changes ? JSON.parse(entry.changes) : {};
                    const isFirst = index === 0;

                    return (
                      <div
                        key={entry.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isFirst ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${isFirst ? 'bg-blue-200' : 'bg-gray-200'}`}>
                            <History className={`w-4 h-4 ${isFirst ? 'text-blue-700' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-bold text-white">
                                {entry.operation === 'INSERT' ? 'Erstellt' :
                                 entry.operation === 'UPDATE' ? 'Bearbeitet' :
                                 entry.operation === 'DELETE' ? 'Gelöscht' : entry.operation}
                              </p>
                              <span className="text-xs text-white/60">
                                {new Date(entry.changed_at).toLocaleString('de-DE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>

                            {entry.operation === 'UPDATE' && Object.keys(changes).length > 0 && (
                              <div className="space-y-2 text-sm">
                                {Object.entries(changes).map(([field, change]: [string, any]) => {
                                  const fieldNames: Record<string, string> = {
                                    item_name: 'Bezeichnung',
                                    actual_cost: 'Kosten',
                                    estimated_cost: 'Geschätzte Kosten',
                                    notes: 'Notizen',
                                    category: 'Kategorie',
                                    payment_status: 'Zahlungsstatus',
                                    paid: 'Bezahlt',
                                    vendor_id: 'Dienstleister'
                                  };

                                  return (
                                    <div key={field} className="flex items-start gap-2 p-2 bg-white/50 rounded-lg">
                                      <span className="text-white/60 font-semibold min-w-[120px]">
                                        {fieldNames[field] || field}:
                                      </span>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-red-600 line-through">
                                            {typeof change.old === 'number' && field.includes('cost')
                                              ? `${change.old.toFixed(2)} €`
                                              : String(change.old || '-')}
                                          </span>
                                          <span className="text-white/60">→</span>
                                          <span className="text-green-600 font-semibold">
                                            {typeof change.new === 'number' && field.includes('cost')
                                              ? `${change.new.toFixed(2)} €`
                                              : String(change.new || '-')}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {entry.operation === 'INSERT' && (
                              <p className="text-sm text-white/60">
                                Budget-Posten wurde erstellt mit {entry.actual_cost?.toFixed(2) || '0.00'} €
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-[#d4af37] mx-auto mb-4 opacity-50" />
                  <p className="text-white/70">Noch keine Änderungen protokolliert</p>
                  <p className="text-sm text-white/60 mt-2">Der Verlauf wird automatisch erfasst</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ModalConfirm
        isOpen={showDeleteAttachmentConfirm !== null}
        onClose={() => setShowDeleteAttachmentConfirm(null)}
        onConfirm={handleDeleteAttachment}
        title="Anhang löschen"
        message="Möchtest du diesen Anhang wirklich löschen? Die Datei wird dauerhaft entfernt."
        confirmText={COMMON.DELETE}
        type="danger"
      />

    </div>
  );

  return createPortal(modalContent, document.body);
}
