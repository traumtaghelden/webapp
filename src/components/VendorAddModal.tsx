import { useState, useEffect, useMemo } from 'react';
import { Save, Building2, Mail, Phone, FileText, DollarSign, Calendar, Globe, MapPin, User, Disc3, Cake, MoreHorizontal, Heart } from 'lucide-react';
import { supabase, type VendorCategory } from '../lib/supabase';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';
import MobileTabNavigation from './common/MobileTabNavigation';
import { VENDOR } from '../constants/terminology';
import { Camera, Music, Flower2, Car, Sparkles, Video, Utensils } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface VendorAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  weddingId: string;
  initialCategory?: string;
  initialTab?: VendorTab;
}

interface TimelineEvent {
  id: string;
  title: string;
  time: string;
  event_type: string;
}

type VendorTab = 'basics' | 'contact' | 'details';

const ICON_MAP: Record<string, any> = {
  MapPin,
  Utensils,
  Camera,
  Video,
  Music,
  Flower2,
  Disc3,
  Sparkles,
  Car,
  Cake,
  MoreHorizontal,
  Heart,
  Calendar,
};

export default function VendorAddModal({
  isOpen,
  onClose,
  onSuccess,
  weddingId,
  initialCategory,
  initialTab = 'basics',
}: VendorAddModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<VendorTab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [vendorData, setVendorData] = useState({
    name: '',
    category: initialCategory || 'Location',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    contract_status: 'open',
    total_cost: '',
    payment_due_date: '',
    description: '',
    notes: '',
    timeline_event_id: '',
    rating: 0,
  });

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setActiveTab(initialTab);
      loadCategories();
    }
  }, [isOpen, initialTab]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('vendor_categories')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast('Fehler beim Laden der Kategorien', 'error');
    } finally {
      setLoadingCategories(false);
    }
  };

  const resetForm = () => {
    const defaultCategory = categories.length > 0 ? categories[0].name : (initialCategory || '');
    setVendorData({
      name: '',
      category: initialCategory || defaultCategory,
      contact_name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      contract_status: 'open',
      total_cost: '',
      payment_due_date: '',
      description: '',
      notes: '',
      timeline_event_id: '',
      rating: 0,
    });
    setTimelineEvents([]);
  };

  const loadTimelineEvents = async () => {
    if (loadingTimeline || timelineEvents.length > 0) return;
    setLoadingTimeline(true);
    try {
      const { data, error } = await supabase
        .from('wedding_day_blocks')
        .select('id, title, start_time, event_type')
        .eq('wedding_id', weddingId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setTimelineEvents(data || []);
    } catch (error) {
      console.error('Error loading timeline events:', error);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleSubmit = async () => {
    if (!vendorData.name.trim() || !vendorData.category) {
      showToast('Bitte füllen Sie mindestens Name und Kategorie aus', 'error');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('vendors').insert({
        wedding_id: weddingId,
        name: vendorData.name.trim(),
        category: vendorData.category,
        contact_name: vendorData.contact_name || null,
        email: vendorData.email || null,
        phone: vendorData.phone || null,
        website: vendorData.website || null,
        address: vendorData.address || null,
        contract_status: vendorData.contract_status,
        total_cost: vendorData.total_cost ? parseFloat(vendorData.total_cost) : null,
        payment_due_date: vendorData.payment_due_date || null,
        description: vendorData.description || null,
        notes: vendorData.notes || null,
        timeline_event_id: vendorData.timeline_event_id || null,
        rating: vendorData.rating || null,
        paid_amount: 0,
      });

      if (error) throw error;

      showToast('Dienstleister erfolgreich hinzugefügt', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating vendor:', error);
      showToast('Fehler beim Hinzufügen des Dienstleisters', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = vendorData.name.trim().length > 0 && vendorData.category;

  const selectedCategory = categories.find(c => c.name === vendorData.category);
  const CategoryIcon = selectedCategory?.icon ? ICON_MAP[selectedCategory.icon] || Building2 : Building2;

  const totalCost = vendorData.total_cost ? parseFloat(vendorData.total_cost) : 0;

  const tabs = [
    { id: 'basics' as VendorTab, label: 'Grunddaten', shortLabel: 'Basis', icon: <Building2 className="w-4 h-4" /> },
    { id: 'contact' as VendorTab, label: 'Kontakt', shortLabel: 'Kontakt', icon: <Phone className="w-4 h-4" /> },
    { id: 'details' as VendorTab, label: 'Details', shortLabel: 'Details', icon: <DollarSign className="w-4 h-4" /> },
  ];

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${VENDOR.SINGULAR} hinzufügen`}
      subtitle="Erfasse einen neuen Dienstleister für deine Hochzeit"
      icon={Building2}
      maxWidth="2xl"
      footer={
        <ModalFooter>
          <ModalButton variant="secondary" onClick={onClose}>
            Abbrechen
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            icon={Save}
          >
            {loading ? 'Wird gespeichert...' : `${VENDOR.SINGULAR} hinzufügen`}
          </ModalButton>
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        {/* Kostenvorschau - kompakter */}
        {totalCost > 0 && (
          <div className="bg-gradient-to-r from-[#d4af37]/20 to-[#f4d03f]/20 rounded-lg p-3 border border-[#d4af37]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] flex items-center justify-center">
                  <CategoryIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/70">Geschätzte Kosten</p>
                  <p className="text-lg font-bold text-white">
                    {totalCost.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </p>
                </div>
              </div>
              {vendorData.category && (
                <div className="text-right">
                  <p className="text-xs text-white/70">Kategorie</p>
                  <p className="text-sm font-semibold text-white">{vendorData.category}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation - Mobile Optimiert */}
        <MobileTabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="pills"
        />

        {/* Tab Content */}
        <div className="py-2">
          {activeTab === 'basics' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-white/90 mb-1.5">Name*</label>
                  <input
                    type="text"
                    value={vendorData.name}
                    onChange={(e) => setVendorData({ ...vendorData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none"
                    placeholder="z.B. Schloss Belvedere"
                    autoFocus
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-white/90 mb-2">Kategorie*</label>
                  {loadingCategories ? (
                    <div className="text-center py-8 text-white/50">Kategorien werden geladen...</div>
                  ) : categories.length === 0 ? (
                    <div className="text-center py-8 text-white/50">Keine Kategorien verfügbar</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {categories.map((cat) => {
                        const Icon = ICON_MAP[cat.icon] || Building2;
                        const isSelected = vendorData.category === cat.name;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setVendorData({ ...vendorData, category: cat.name })}
                            className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] border-transparent text-[#0a253c]'
                                : 'bg-white/5 border-white/20 text-white hover:border-[#d4af37]/50 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <Icon className="w-4 h-4" />
                              <span>{cat.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-white/90 mb-1.5">Ansprechpartner</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                      type="text"
                      value={vendorData.contact_name}
                      onChange={(e) => setVendorData({ ...vendorData, contact_name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none"
                      placeholder="z.B. Herr Müller"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1.5">E-Mail</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                      type="email"
                      value={vendorData.email}
                      onChange={(e) => setVendorData({ ...vendorData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none"
                      placeholder="info@dienstleister.de"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1.5">Telefon</label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                      type="tel"
                      value={vendorData.phone}
                      onChange={(e) => setVendorData({ ...vendorData, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none"
                      placeholder="+49 123 456789"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-white/90 mb-1.5">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                      type="url"
                      value={vendorData.website}
                      onChange={(e) => setVendorData({ ...vendorData, website: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none"
                      placeholder="https://www.dienstleister.de"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-white/90 mb-1.5">Adresse</label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                      type="text"
                      value={vendorData.address}
                      onChange={(e) => setVendorData({ ...vendorData, address: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none"
                      placeholder="Musterstraße 123, 12345 Musterstadt"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1.5">Beschreibung</label>
                <textarea
                  value={vendorData.description}
                  onChange={(e) => setVendorData({ ...vendorData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none"
                  rows={3}
                  placeholder="Was bietet dieser Dienstleister an?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-1.5">Interne Notizen</label>
                <textarea
                  value={vendorData.notes}
                  onChange={(e) => setVendorData({ ...vendorData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none"
                  rows={4}
                  placeholder="Besonderheiten, Vertragsdetails, Erinnerungen..."
                />
              </div>

              <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-3">
                <p className="text-xs text-blue-200">
                  <span className="font-semibold text-white">Tipp:</span> Nutze die Notizen für wichtige Details wie spezielle Vereinbarungen, Liefertermine oder Kontaktpräferenzen.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </StandardModal>
  );
}
