import { useState, useEffect } from 'react';
import { Edit2, Save, MapPin, Mail, Phone, Globe, Star, FileText, Users, Building2, Calendar, Link as LinkIcon, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LinkedBudgetItemsPanel from './LinkedBudgetItemsPanel';
import BudgetItemLinkingModal from './BudgetItemLinkingModal';
import { LOCATION } from '../constants/terminology';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';
import { useToast } from '../contexts/ToastContext';

interface Location {
  id: string;
  wedding_id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  max_capacity: number;
  total_cost: number | null;
  booking_status: string;
  contract_sent: boolean;
  deposit_paid: boolean;
  is_favorite: boolean;
  rating: number | null;
  notes: string | null;
  created_at: string;
}

interface LocationDetailModalProps {
  locationId: string;
  onClose: () => void;
  onUpdate: () => void;
}

type TabType = 'overview' | 'budget' | 'events' | 'notes';

const bookingStatuses = [
  { value: 'open', label: 'Offen', color: 'bg-orange-500/30 text-orange-100 border-orange-400/50' },
  { value: 'booked', label: 'Gebucht', color: 'bg-green-500/30 text-green-100 border-green-400/50' },
];

export default function LocationDetailModal({ locationId, onClose, onUpdate }: LocationDetailModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [location, setLocation] = useState<Location | null>(null);
  const [eventAssignments, setEventAssignments] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editedLocation, setEditedLocation] = useState<Partial<Location>>({});
  const [showLinkingModal, setShowLinkingModal] = useState(false);

  useEffect(() => {
    if (locationId) {
      loadData();
    }
  }, [locationId, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: locationData } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single();

      if (locationData) {
        setLocation(locationData);
        setEditedLocation(locationData);

        if (activeTab === 'events') {
          const { data: assignments } = await supabase
            .from('location_event_assignments')
            .select('*, wedding_day_blocks(*)')
            .eq('location_id', locationId);

          if (assignments) setEventAssignments(assignments);

          const { data: events } = await supabase
            .from('wedding_day_blocks')
            .select('*')
            .eq('wedding_id', locationData.wedding_id)
            .order('start_time', { ascending: true });

          if (events) setAvailableEvents(events);
        }
      }
    } catch (error) {
      console.error('Error loading location data:', error);
      showToast('Fehler beim Laden der Daten', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('locations')
        .update(editedLocation)
        .eq('id', locationId);

      if (error) throw error;

      setIsEditing(false);
      showToast('Änderungen erfolgreich gespeichert', 'success');
      onUpdate();
      loadData();
    } catch (error) {
      console.error('Error updating location:', error);
      showToast('Fehler beim Speichern der Änderungen', 'error');
    }
  };

  const handleRatingChange = async (newRating: number) => {
    try {
      await supabase
        .from('locations')
        .update({ rating: newRating })
        .eq('id', locationId);
      loadData();
      onUpdate();
      showToast('Bewertung aktualisiert', 'success');
    } catch (error) {
      console.error('Error updating rating:', error);
      showToast('Fehler beim Aktualisieren der Bewertung', 'error');
    }
  };


  const handleAddEventAssignment = async (eventId: string) => {
    if (!location) return;

    try {
      const { error } = await supabase
        .from('location_event_assignments')
        .insert({
          wedding_id: location.wedding_id,
          location_id: locationId,
          event_id: eventId
        });

      if (error) throw error;

      showToast('Event erfolgreich zugeordnet', 'success');
      loadData();
    } catch (error: any) {
      if (error.code === '23505') {
        showToast('Event ist bereits zugeordnet', 'warning');
      } else {
        console.error('Error adding event assignment:', error);
        showToast('Fehler beim Zuordnen des Events', 'error');
      }
    }
  };

  const handleRemoveEventAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('location_event_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      showToast('Event-Zuordnung entfernt', 'success');
      loadData();
    } catch (error) {
      console.error('Error removing event assignment:', error);
      showToast('Fehler beim Entfernen der Zuordnung', 'error');
    }
  };

  if (!location || loading) {
    return (
      <StandardModal
        isOpen={true}
        onClose={onClose}
        title="Lädt..."
        icon={MapPin}
        maxWidth="6xl"
      >
        <div className="animate-pulse space-y-4 py-8">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          <div className="h-64 bg-white/10 rounded"></div>
        </div>
      </StandardModal>
    );
  }

  const statusInfo = bookingStatuses.find(s => s.value === location.booking_status);

  const tabs = [
    { id: 'overview' as TabType, label: 'Übersicht', icon: Building2 },
    { id: 'budget' as TabType, label: 'Budget', icon: DollarSign },
    { id: 'events' as TabType, label: 'Events', icon: Calendar },
    { id: 'notes' as TabType, label: 'Notizen', icon: FileText },
  ];

  const assignedEventIds = eventAssignments.map(a => a.event_id);
  const unassignedEvents = availableEvents.filter(e => !assignedEventIds.includes(e.id));

  return (
    <StandardModal
      isOpen={true}
      onClose={onClose}
      title={location.name}
      subtitle={location.category}
      icon={MapPin}
      maxWidth="6xl"
      footer={
        <ModalFooter>
          {isEditing ? (
            <>
              <ModalButton
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setEditedLocation(location);
                }}
              >
                Abbrechen
              </ModalButton>
              <ModalButton
                variant="primary"
                onClick={handleSave}
                icon={Save}
              >
                Änderungen speichern
              </ModalButton>
            </>
          ) : (
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
        {/* Kapazitäts-Banner */}
        {location.max_capacity > 0 && (
          <div className="bg-gradient-to-r from-[#d4af37]/20 to-[#f4d03f]/20 rounded-lg p-4 border border-[#d4af37]/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/70">Kapazität</p>
                <p className="text-2xl font-bold text-white">
                  {location.max_capacity} Personen
                </p>
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
                  <label className="block text-sm font-medium text-white/90 mb-1.5">Buchungsstatus</label>
                  {isEditing ? (
                    <select
                      value={editedLocation.booking_status || location.booking_status}
                      onChange={(e) => setEditedLocation({ ...editedLocation, booking_status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm focus:border-[#d4af37] focus:outline-none"
                    >
                      {bookingStatuses.map((status) => (
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
                            location.rating && location.rating >= star
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
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#d4af37]" />
                  Kontaktinformationen
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/70 mb-1">Ansprechpartner</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedLocation.contact_name || ''}
                        onChange={(e) => setEditedLocation({ ...editedLocation, contact_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm focus:border-[#d4af37] focus:outline-none"
                        placeholder="Name"
                      />
                    ) : (
                      <p className="text-sm text-white">{location.contact_name || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-white/70 mb-1">E-Mail</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedLocation.contact_email || ''}
                        onChange={(e) => setEditedLocation({ ...editedLocation, contact_email: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm focus:border-[#d4af37] focus:outline-none"
                        placeholder="email@beispiel.de"
                      />
                    ) : (
                      <p className="text-sm text-white">{location.contact_email || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-white/70 mb-1">Telefon</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedLocation.contact_phone || ''}
                        onChange={(e) => setEditedLocation({ ...editedLocation, contact_phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm focus:border-[#d4af37] focus:outline-none"
                        placeholder="+49 123 456789"
                      />
                    ) : (
                      <p className="text-sm text-white">{location.contact_phone || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-white/70 mb-1">Website</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editedLocation.website || ''}
                        onChange={(e) => setEditedLocation({ ...editedLocation, website: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm focus:border-[#d4af37] focus:outline-none"
                        placeholder="https://..."
                      />
                    ) : (
                      location.website ? (
                        <a
                          href={location.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#d4af37] hover:text-[#f4d03f] flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3" />
                          Website besuchen
                        </a>
                      ) : (
                        <p className="text-sm text-white">-</p>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Adressinformationen */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#d4af37]" />
                  Adresse
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-white/70 mb-1">Straße und Hausnummer</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedLocation.address || ''}
                        onChange={(e) => setEditedLocation({ ...editedLocation, address: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm focus:border-[#d4af37] focus:outline-none"
                        placeholder="Musterstraße 123"
                      />
                    ) : (
                      <p className="text-sm text-white">{location.address || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-white/70 mb-1">Stadt</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedLocation.city || ''}
                        onChange={(e) => setEditedLocation({ ...editedLocation, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm focus:border-[#d4af37] focus:outline-none"
                        placeholder="Berlin"
                      />
                    ) : (
                      <p className="text-sm text-white">{location.city || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-white/70 mb-1">PLZ</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedLocation.postal_code || ''}
                        onChange={(e) => setEditedLocation({ ...editedLocation, postal_code: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm focus:border-[#d4af37] focus:outline-none"
                        placeholder="10115"
                      />
                    ) : (
                      <p className="text-sm text-white">{location.postal_code || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Kapazität und Kosten */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <label className="block text-xs text-white/70 mb-1">Maximale Kapazität</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedLocation.max_capacity || 0}
                      onChange={(e) => setEditedLocation({ ...editedLocation, max_capacity: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm focus:border-[#d4af37] focus:outline-none"
                      placeholder="150"
                    />
                  ) : (
                    <p className="text-lg font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#d4af37]" />
                      {location.max_capacity || 0} Personen
                    </p>
                  )}
                </div>

              </div>

              {/* Beschreibung */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1.5">Beschreibung</label>
                {isEditing ? (
                  <textarea
                    value={editedLocation.description || ''}
                    onChange={(e) => setEditedLocation({ ...editedLocation, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white text-sm focus:border-[#d4af37] focus:outline-none resize-none"
                    placeholder="Beschreibung der Location..."
                  />
                ) : (
                  <p className="text-sm text-white/90 bg-white/5 rounded-lg p-3 border border-white/10">
                    {location.description || 'Keine Beschreibung vorhanden'}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'budget' && location && (
            <LinkedBudgetItemsPanel
              entityId={locationId}
              entityType="location"
              entityName={location.name}
              weddingId={location.wedding_id}
              onLinkClick={() => setShowLinkingModal(true)}
            />
          )}

          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-[#d4af37]" />
                  Zugeordnete Events ({eventAssignments.length})
                </h3>
                {eventAssignments.length === 0 ? (
                  <p className="text-sm text-white/60 text-center py-4">
                    Noch keine Events zugeordnet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {eventAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-[#d4af37]/20"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {assignment.wedding_day_blocks?.title}
                          </p>
                          <p className="text-xs text-white/60">
                            {assignment.wedding_day_blocks?.start_time}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveEventAssignment(assignment.id)}
                          className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {unassignedEvents.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Verfügbare Events hinzufügen
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {unassignedEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleAddEventAssignment(event.id)}
                        className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-[#d4af37]/20 hover:border-[#d4af37] transition-all text-left"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{event.title}</p>
                          <p className="text-xs text-white/60">{event.time}</p>
                        </div>
                        <div className="px-3 py-1 bg-[#d4af37] text-[#0a253c] rounded-lg text-xs font-bold">
                          Hinzufügen
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Notizen zu dieser Location
              </label>
              <textarea
                value={editedLocation.notes || location.notes || ''}
                onChange={(e) => setEditedLocation({ ...editedLocation, notes: e.target.value })}
                rows={10}
                className="w-full px-4 py-3 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white focus:border-[#d4af37] focus:outline-none resize-none"
                placeholder="Notizen, Besonderheiten, wichtige Informationen..."
              />
            </div>
          )}
        </div>
      </div>

      {location && showLinkingModal && (
        <BudgetItemLinkingModal
          isOpen={showLinkingModal}
          onClose={() => setShowLinkingModal(false)}
          entityId={locationId}
          entityType="location"
          entityName={location.name}
          weddingId={location.wedding_id}
          onLinksUpdated={() => {
            loadData();
            onUpdate();
          }}
        />
      )}
    </StandardModal>
  );
}
