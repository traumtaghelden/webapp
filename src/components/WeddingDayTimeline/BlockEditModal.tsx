import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, MapPin, Clock, Briefcase, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import VendorAvatar from '../common/VendorAvatar';

interface WeddingDayBlock {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_time: string;
  end_time: string;
  location_name: string | null;
  location_address: string | null;
  color: string;
  icon: string;
  notes: string | null;
  day_offset: number;
}

interface BlockEditModalProps {
  block: WeddingDayBlock | null;
  onSave: (blockData: Partial<WeddingDayBlock>) => void;
  onClose: () => void;
}

const eventTypeOptions = [
  { value: 'getting_ready', label: 'Getting Ready', color: '#E8B4F5', icon: 'Calendar' },
  { value: 'ceremony', label: 'Zeremonie/Kirche', color: '#A78BFA', icon: 'Calendar' },
  { value: 'cocktail', label: 'Sektempfang', color: '#F5B800', icon: 'Calendar' },
  { value: 'photoshoot', label: 'Fotoshooting', color: '#60A5FA', icon: 'Clock' },
  { value: 'dinner', label: 'Dinner', color: '#F87171', icon: 'Calendar' },
  { value: 'party', label: 'Party/Tanz', color: '#34D399', icon: 'Calendar' },
  { value: 'transfer', label: 'Transfer/Fahrt', color: '#94A3B8', icon: 'Clock' },
  { value: 'other', label: 'Sonstiges', color: '#FCD34D', icon: 'Calendar' },
];

interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  category: string | null;
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  contact_name: string | null;
}

export default function BlockEditModal({ block, onSave, onClose }: BlockEditModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'other',
    start_time: '10:00',
    end_time: '12:00',
    location_name: '',
    location_address: '',
    notes: '',
    day_offset: 0,
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [weddingId, setWeddingId] = useState<string>('');
  const [existingBlocks, setExistingBlocks] = useState<WeddingDayBlock[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (block) {
      setFormData({
        title: block.title,
        description: block.description || '',
        event_type: block.event_type,
        start_time: block.start_time,
        end_time: block.end_time,
        location_name: block.location_name || '',
        location_address: block.location_address || '',
        notes: block.notes || '',
        day_offset: block.day_offset || 0,
      });

      // Load existing assignments
      if (block.id) {
        loadExistingAssignments(block.id);
      }
    } else {
      // New block - set next available time
      setNextAvailableTime();
    }
  }, [block, existingBlocks]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: wedding } = await supabase
        .from('weddings')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!wedding) return;
      setWeddingId(wedding.id);

      // Load existing blocks for overlap checking
      const { data: blocksData } = await supabase
        .from('wedding_day_blocks')
        .select('id, start_time, end_time')
        .eq('wedding_id', wedding.id)
        .order('start_time', { ascending: true });

      setExistingBlocks(blocksData || []);

      // Load locations
      const { data: locationsData, error: locError } = await supabase
        .from('locations')
        .select('id, name, address, city, category')
        .eq('wedding_id', wedding.id)
        .order('name', { ascending: true });

      if (locError) throw locError;
      setLocations(locationsData || []);
      setLoadingLocations(false);

      // Load vendors
      const { data: vendorsData, error: vendError } = await supabase
        .from('vendors')
        .select('id, name, category, contact_name')
        .eq('wedding_id', wedding.id)
        .order('name', { ascending: true });

      if (vendError) {
        console.error('Error loading vendors:', vendError);
      } else {
        console.log('Loaded vendors:', vendorsData);
      }
      setVendors(vendorsData || []);
      setLoadingVendors(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoadingLocations(false);
      setLoadingVendors(false);
    }
  };

  const loadExistingAssignments = async (blockId: string) => {
    try {
      // Load vendor assignments
      const { data: vendorAssignments } = await supabase
        .from('vendor_event_assignments')
        .select('vendor_id')
        .eq('timeline_event_id', blockId);

      if (vendorAssignments) {
        setSelectedVendorIds(vendorAssignments.map(a => a.vendor_id));
      }

      // Load location assignment
      const { data: locationAssignment } = await supabase
        .from('location_event_assignments')
        .select('location_id')
        .eq('timeline_event_id', blockId)
        .maybeSingle();

      if (locationAssignment) {
        setSelectedLocationId(locationAssignment.location_id);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId);
    if (locationId === 'manual') {
      setFormData({
        ...formData,
        location_name: '',
        location_address: '',
      });
    } else if (locationId) {
      const location = locations.find(loc => loc.id === locationId);
      if (location) {
        const fullAddress = [location.address, location.city].filter(Boolean).join(', ');
        setFormData({
          ...formData,
          location_name: location.name,
          location_address: fullAddress || '',
        });
      }
    } else {
      // Clear selection
      setFormData({
        ...formData,
        location_name: '',
        location_address: '',
      });
    }
  };

  const toggleVendor = (vendorId: string) => {
    setSelectedVendorIds(prev => {
      if (prev.includes(vendorId)) {
        return prev.filter(id => id !== vendorId);
      }
      return [...prev, vendorId];
    });
  };

  const setNextAvailableTime = () => {
    if (existingBlocks.length === 0) {
      // No blocks exist, suggest 10:00 - 12:00
      setFormData(prev => ({
        ...prev,
        start_time: '10:00',
        end_time: '12:00',
      }));
      return;
    }

    // Find the latest end time
    const latestBlock = existingBlocks[existingBlocks.length - 1];
    const [endHour, endMin] = latestBlock.end_time.split(':').map(Number);

    // Suggest starting 30 minutes after the latest end time
    let suggestedStartMin = endHour * 60 + endMin + 30;
    let suggestedEndMin = suggestedStartMin + 120; // 2 hours duration

    // Cap at 23:30
    if (suggestedStartMin > 23 * 60 + 30) {
      suggestedStartMin = 23 * 60 + 30;
      suggestedEndMin = 24 * 60;
    }

    const suggestedStartHour = Math.floor(suggestedStartMin / 60);
    const suggestedStartMinute = suggestedStartMin % 60;
    const suggestedEndHour = Math.floor(suggestedEndMin / 60);
    const suggestedEndMinute = suggestedEndMin % 60;

    setFormData(prev => ({
      ...prev,
      start_time: `${suggestedStartHour.toString().padStart(2, '0')}:${suggestedStartMinute.toString().padStart(2, '0')}`,
      end_time: `${suggestedEndHour.toString().padStart(2, '0')}:${suggestedEndMinute.toString().padStart(2, '0')}`,
    }));
  };

  const checkOverlap = (startTime: string, endTime: string): boolean => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const newStart = startHour * 60 + startMin;
    const newEnd = endHour * 60 + endMin;

    for (const existingBlock of existingBlocks) {
      // Skip if editing the same block
      if (block?.id && existingBlock.id === block.id) {
        continue;
      }

      const [exStartHour, exStartMin] = existingBlock.start_time.split(':').map(Number);
      const [exEndHour, exEndMin] = existingBlock.end_time.split(':').map(Number);
      const exStart = exStartHour * 60 + exStartMin;
      const exEnd = exEndHour * 60 + exEndMin;

      // Check for overlap
      // Overlap occurs if: new starts before existing ends AND new ends after existing starts
      if (newStart < exEnd && newEnd > exStart) {
        return true;
      }
    }

    return false;
  };

  const handleSubmit = async () => {
    const [startHour, startMin] = formData.start_time.split(':').map(Number);
    const [endHour, endMin] = formData.end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      alert('Die Endzeit muss nach der Startzeit liegen!');
      return;
    }

    if (!formData.title.trim()) {
      alert('Bitte geben Sie einen Titel ein!');
      return;
    }

    // Check for overlap
    if (checkOverlap(formData.start_time, formData.end_time)) {
      alert('❌ Zeitüberschneidung!\n\nDiese Zeit überschneidet sich mit einem anderen Event. Bitte wählen Sie eine andere Zeit.\n\nTipp: Schauen Sie sich die Timeline an um freie Zeitfenster zu finden.');
      return;
    }

    const selectedType = eventTypeOptions.find(opt => opt.value === formData.event_type);

    // Save the block first
    onSave({
      ...formData,
      color: selectedType?.color || '#FCD34D',
      icon: selectedType?.icon || 'Calendar',
    });

    // Save vendor and location assignments if we have a block ID
    if (block?.id && weddingId) {
      await saveAssignments(block.id);
    }
  };

  const saveAssignments = async (blockId: string) => {
    try {
      // Save location assignment
      if (selectedLocationId && selectedLocationId !== 'manual') {
        // Delete existing
        await supabase
          .from('location_event_assignments')
          .delete()
          .eq('timeline_event_id', blockId);

        // Insert new
        await supabase
          .from('location_event_assignments')
          .insert({
            wedding_id: weddingId,
            location_id: selectedLocationId,
            timeline_event_id: blockId,
          });
      }

      // Save vendor assignments
      // Delete existing
      await supabase
        .from('vendor_event_assignments')
        .delete()
        .eq('timeline_event_id', blockId);

      // Insert new
      if (selectedVendorIds.length > 0) {
        const assignments = selectedVendorIds.map(vendorId => ({
          vendor_id: vendorId,
          timeline_event_id: blockId,
        }));

        await supabase
          .from('vendor_event_assignments')
          .insert(assignments);
      }
    } catch (error) {
      console.error('Error saving assignments:', error);
    }
  };

  const calculateDuration = () => {
    const [startHour, startMin] = formData.start_time.split(':').map(Number);
    const [endHour, endMin] = formData.end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = endMinutes - startMinutes;

    if (duration <= 0) return '';

    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000 }}
      onClick={onClose}
    >
      <div className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-700 flex-shrink-0">
          <div className="bg-[#d4af37] p-3 rounded-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">
              {block ? 'Event-Block bearbeiten' : 'Neuer Event-Block'}
            </h2>
            <p className="text-sm text-gray-300 mt-1">
              Erstellen Sie einen Event-Block und verknüpfen Sie Dienstleister & Locations
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form - Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Titel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all min-h-[44px]"
              placeholder="z.B. Kirchliche Trauung"
              required
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Event-Typ <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all min-h-[44px]"
              required
            >
              {eventTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Day Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Tag <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, day_offset: 0 })}
                className={`px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px] ${
                  formData.day_offset === 0
                    ? 'bg-[#d4af37] text-gray-900 shadow-md'
                    : 'bg-[#1a3a5c] border border-gray-600 text-white hover:border-[#d4af37]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Hochzeitstag
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, day_offset: 1 })}
                className={`px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px] ${
                  formData.day_offset === 1
                    ? 'bg-[#d4af37] text-gray-900 shadow-md'
                    : 'bg-[#1a3a5c] border border-gray-600 text-white hover:border-[#d4af37]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Folgetag (+1)
              </button>
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Startzeit <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all min-h-[44px]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Endzeit <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all min-h-[44px]"
                required
              />
            </div>
          </div>

          {/* Duration Display */}
          {calculateDuration() && (
            <div className="bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-[#d4af37]" />
                <span className="text-white font-medium">
                  Dauer: <span className="font-semibold">{calculateDuration()}</span>
                </span>
              </div>
            </div>
          )}

          {/* Location Selector */}
          {!loadingLocations && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location verknüpfen
              </label>
              {locations.length === 0 ? (
                <div className="bg-white/5 border border-gray-600 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm mb-2">Keine Locations vorhanden</p>
                  <p className="text-xs text-gray-500">Erstellen Sie zuerst Locations im Locations-Manager</p>
                </div>
              ) : (
                <select
                  value={selectedLocationId}
                  onChange={(e) => handleLocationSelect(e.target.value)}
                  className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all min-h-[44px]"
                >
                  <option value="">-- Location wählen (optional) --</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} {location.category ? `(${location.category})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Vendors Selector */}
          {loadingVendors ? (
            <div className="bg-white/5 border border-gray-600 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm">Lade Dienstleister...</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Briefcase className="w-4 h-4 inline mr-1" />
                Dienstleister verknüpfen
              </label>
              {vendors.length === 0 ? (
                <div className="bg-white/5 border border-gray-600 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm mb-2">Keine Dienstleister vorhanden</p>
                  <p className="text-xs text-gray-500">Erstellen Sie zuerst Dienstleister im Dienstleister-Manager</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto bg-white/5 border border-gray-600 rounded-lg p-3">
                  {vendors.map((vendor) => (
                    <label
                      key={vendor.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${selectedVendorIds.includes(vendor.id)
                          ? 'bg-[#d4af37]/20 border-[#d4af37]'
                          : 'bg-white/5 border-gray-600 hover:border-gray-500'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={selectedVendorIds.includes(vendor.id)}
                        onChange={() => toggleVendor(vendor.id)}
                        className="w-4 h-4 rounded border-2 border-[#d4af37] bg-white/10 text-[#d4af37] focus:ring-[#d4af37] focus:ring-offset-0 cursor-pointer"
                      />
                      <VendorAvatar
                        name={vendor.name}
                        category={vendor.category}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-white text-sm">{vendor.name}</div>
                        <div className="text-xs text-gray-400">
                          {vendor.category}
                          {vendor.contact_name && ` • ${vendor.contact_name}`}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {selectedVendorIds.length > 0 && (
                <div className="text-sm text-[#d4af37] font-semibold mt-2">
                  {selectedVendorIds.length} Dienstleister ausgewählt
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all resize-none"
              placeholder="Zusätzliche Informationen zu diesem Event-Block"
              rows={3}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Notizen
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all resize-none"
              placeholder="Interne Notizen"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0 bg-gradient-to-br from-[#0A1F3D] to-[#1a3a5c]">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-lg text-gray-300 border border-gray-600 hover:bg-gray-700/30 transition-all font-medium text-base min-h-[48px]"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-3 rounded-lg bg-[#d4af37] hover:bg-[#c19a2e] text-gray-900 transition-all font-semibold shadow-lg hover:shadow-xl text-base min-h-[48px]"
          >
            {block ? 'Aktualisieren' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
