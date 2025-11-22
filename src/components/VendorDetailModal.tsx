import { useState, useEffect } from 'react';
import { Edit2, Save, Building2, Mail, Phone, Globe, MapPin, Star, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LinkedBudgetItemsPanel from './LinkedBudgetItemsPanel';
import BudgetItemLinkingModal from './BudgetItemLinkingModal';
import { VENDOR } from '../constants/terminology';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';
import { Camera, Music, Flower2, Car, Sparkles, Video, Utensils } from 'lucide-react';

interface Vendor {
  id: string;
  wedding_id: string;
  name: string;
  category: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  contract_status: string;
  total_cost: number | null;
  paid_amount: number;
  payment_due_date: string | null;
  rating: number | null;
  notes: string | null;
  description: string | null;
  created_at: string;
}

interface VendorAttachment {
  id: string;
  vendor_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  category: string;
  created_at: string;
}

interface VendorDetailModalProps {
  vendorId: string;
  onClose: () => void;
  onUpdate: () => void;
}

type TabType = 'overview' | 'budget';

const CATEGORIES = [
  { id: 'Location', label: 'Location', icon: MapPin },
  { id: 'Catering', label: 'Catering', icon: Utensils },
  { id: 'Fotografie', label: 'Fotografie', icon: Camera },
  { id: 'Musik', label: 'Musik', icon: Music },
  { id: 'Floristik', label: 'Floristik', icon: Flower2 },
  { id: 'Video', label: 'Video', icon: Video },
  { id: 'Transport', label: 'Transport', icon: Car },
  { id: 'Dekoration', label: 'Dekoration', icon: Sparkles },
];

const contractStatuses = [
  { value: 'open', label: 'Offen', color: 'bg-white/20 text-white border-white/30' },
  { value: 'inquiry', label: 'Angefragt', color: 'bg-yellow-500/30 text-yellow-100 border-yellow-400/50' },
  { value: 'signed', label: 'Gebucht', color: 'bg-green-500/30 text-green-100 border-green-400/50' },
];

export default function VendorDetailModal({ vendorId, onClose, onUpdate }: VendorDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [attachments, setAttachments] = useState<VendorAttachment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editedVendor, setEditedVendor] = useState<Partial<Vendor>>({});
  const [showLinkingModal, setShowLinkingModal] = useState(false);

  useEffect(() => {
    if (vendorId) {
      loadData();
    }
  }, [vendorId, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (vendorData) {
        setVendor(vendorData);
        setEditedVendor(vendorData);
      }
    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update(editedVendor)
        .eq('id', vendorId);

      if (error) throw error;

      setIsEditing(false);
      onUpdate();
      loadData();
    } catch (error) {
      console.error('Error updating vendor:', error);
      alert('Fehler beim Speichern der Änderungen');
    }
  };

  const handleRatingChange = async (newRating: number) => {
    try {
      await supabase
        .from('vendors')
        .update({ rating: newRating })
        .eq('id', vendorId);
      loadData();
      onUpdate();
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  if (!vendor || loading) {
    return (
      <StandardModal
        isOpen={true}
        onClose={onClose}
        title="Lädt..."
        icon={Building2}
        maxWidth="2xl"
      >
        <div className="animate-pulse space-y-4 py-8">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          <div className="h-64 bg-white/10 rounded"></div>
        </div>
      </StandardModal>
    );
  }

  const category = CATEGORIES.find(c => c.id === vendor.category);
  const CategoryIcon = category?.icon || Building2;
  const statusInfo = contractStatuses.find(s => s.value === vendor.contract_status);
  const paymentProgress = vendor.total_cost ? (vendor.paid_amount / vendor.total_cost) * 100 : 0;
  const isFullyPaid = vendor.total_cost && vendor.paid_amount >= vendor.total_cost;

  const tabs = [
    { id: 'overview' as TabType, label: 'Übersicht', icon: Building2 },
    { id: 'budget' as TabType, label: 'Budget', icon: DollarSign },
  ];

  return (
    <StandardModal
      isOpen={true}
      onClose={onClose}
      title={vendor.name}
      subtitle={category?.label || vendor.category}
      icon={CategoryIcon}
      maxWidth="6xl"
      footer={
        <ModalFooter>
          {isEditing && (
            <ModalButton
              variant="primary"
              onClick={handleSave}
              icon={Save}
            >
              Änderungen speichern
            </ModalButton>
          )}
          {!isEditing && (
            <ModalButton
              variant="secondary"
              onClick={() => setIsEditing(true)}
              icon={Edit2}
            >
              Bearbeiten
            </ModalButton>
          )}
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        {/* Name bearbeiten im Edit-Modus */}
        {isEditing && (
          <div className="bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 rounded-lg p-4 border border-[#d4af37]/30">
            <label className="block text-sm font-medium text-white/90 mb-2">
              {VENDOR.singular_name} Name
            </label>
            <input
              type="text"
              value={editedVendor.name ?? vendor.name}
              onChange={(e) => setEditedVendor({ ...editedVendor, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-lg font-semibold placeholder-white/40 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
              placeholder="z.B. Blumen Schmidt"
            />
          </div>
        )}
        {/* Kostenvorschau Banner */}
        {vendor.total_cost && (
          <div className="bg-gradient-to-r from-[#d4af37]/20 to-[#f4d03f]/20 rounded-lg p-3 border border-[#d4af37]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/70">Gesamtkosten</p>
                  <p className="text-lg font-bold text-white">
                    {vendor.total_cost.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/70 mb-1">Zahlungsstatus</p>
                {isFullyPaid ? (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/30 text-green-100 border border-green-400/50">
                    Bezahlt
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-500/30 text-yellow-100 border border-yellow-400/50">
                    Offen
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c]'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-[#d4af37]/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-2">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Status und Bewertung */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1.5">Vertragsstatus</label>
                  {isEditing ? (
                    <select
                      value={editedVendor.contract_status || vendor.contract_status}
                      onChange={(e) => setEditedVendor({ ...editedVendor, contract_status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm focus:border-[#d4af37] focus:outline-none"
                    >
                      {contractStatuses.map((status) => (
                        <option key={status.value} value={status.value} className="bg-[#0a253c] text-white">
                          {status.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusInfo?.color}`}>
                      {statusInfo?.label}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1.5">Bewertung</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => !isEditing && handleRatingChange(star)}
                        disabled={isEditing}
                        className={`transition-all ${isEditing ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'}`}
                      >
                        <Star
                          className={`w-5 h-5 ${
                            vendor.rating && vendor.rating >= star
                              ? 'text-[#d4af37] fill-current'
                              : 'text-white/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Kontaktinformationen */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#d4af37]" />
                  Kontaktinformationen
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1.5">Ansprechpartner</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedVendor.contact_name || ''}
                        onChange={(e) => setEditedVendor({ ...editedVendor, contact_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none"
                        placeholder="Ansprechpartner"
                      />
                    ) : (
                      <p className="text-white/80 text-sm">{vendor.contact_name || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      E-Mail
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedVendor.email || ''}
                        onChange={(e) => setEditedVendor({ ...editedVendor, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none"
                        placeholder="email@example.com"
                      />
                    ) : (
                      <a href={`mailto:${vendor.email}`} className="text-[#d4af37] hover:underline text-sm block">
                        {vendor.email || '-'}
                      </a>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      Telefon
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedVendor.phone || ''}
                        onChange={(e) => setEditedVendor({ ...editedVendor, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none"
                        placeholder="+49 123 456789"
                      />
                    ) : (
                      <a href={`tel:${vendor.phone}`} className="text-[#d4af37] hover:underline text-sm block">
                        {vendor.phone || '-'}
                      </a>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      Website
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editedVendor.website || ''}
                        onChange={(e) => setEditedVendor({ ...editedVendor, website: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none"
                        placeholder="https://www.example.com"
                      />
                    ) : vendor.website ? (
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-[#d4af37] hover:underline text-sm block truncate">
                        {vendor.website}
                      </a>
                    ) : (
                      <p className="text-white/50 text-sm">-</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-white/90 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Adresse
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedVendor.address || ''}
                        onChange={(e) => setEditedVendor({ ...editedVendor, address: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none"
                        placeholder="Straße, PLZ Stadt"
                      />
                    ) : (
                      <p className="text-white/80 text-sm">{vendor.address || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Beschreibung */}
              {vendor.description && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-base font-semibold text-white mb-2">Beschreibung</h3>
                  <p className="text-white/80 text-sm whitespace-pre-wrap">{vendor.description}</p>
                </div>
              )}

              {/* Notizen */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-base font-semibold text-white mb-2">Notizen</h3>
                {isEditing ? (
                  <textarea
                    value={editedVendor.notes || ''}
                    onChange={(e) => setEditedVendor({ ...editedVendor, notes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm placeholder-white/50 focus:border-[#d4af37] focus:outline-none"
                    placeholder="Notizen zum Dienstleister..."
                  />
                ) : (
                  <p className="text-white/80 text-sm whitespace-pre-wrap">{vendor.notes || 'Keine Notizen vorhanden'}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'budget' && vendor && (
            <LinkedBudgetItemsPanel
              entityId={vendorId}
              entityType="vendor"
              entityName={vendor.name}
              weddingId={vendor.wedding_id}
              onLinkClick={() => setShowLinkingModal(true)}
            />
          )}
        </div>
      </div>

      {vendor && showLinkingModal && (
        <BudgetItemLinkingModal
          isOpen={showLinkingModal}
          onClose={() => setShowLinkingModal(false)}
          entityId={vendorId}
          entityType="vendor"
          entityName={vendor.name}
          weddingId={vendor.wedding_id}
          onLinksUpdated={() => {
            loadData();
            onUpdate();
          }}
        />
      )}
    </StandardModal>
  );
}
