import { useState, useEffect } from 'react';
import { User, Mail, Phone, Tag, MapPin, UserPlus, Heart, UserCheck, Utensils, FileText, Save, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DietaryRestrictionsSelector from './DietaryRestrictionsSelector';
import MobileTabNavigation from './common/MobileTabNavigation';
import { GUEST, COMMON } from '../constants/terminology';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'planned': return GUEST.RSVP_STATUS.PLANNED;
    case 'invited': return GUEST.RSVP_STATUS.INVITED;
    case 'accepted': return GUEST.RSVP_STATUS.ACCEPTED;
    case 'declined': return GUEST.RSVP_STATUS.DECLINED;
    default: return status;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'planned': return 'bg-gray-100 text-gray-700';
    case 'invited': return 'bg-blue-100 text-blue-700';
    case 'accepted': return 'bg-green-100 text-green-700';
    case 'declined': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  rsvp_status: 'planned' | 'invited' | 'accepted' | 'declined';
  plus_one: boolean;
  plus_one_name: string | null;
  dietary_restrictions: string;
  table_number: number | null;
  group_id: string | null;
  age_group: 'adult' | 'child' | 'infant';
  relationship: string | null;
  invitation_status: 'not_sent' | 'save_the_date_sent' | 'invitation_sent' | 'reminder_sent';
  invitation_sent_date: string | null;
  rsvp_date: string | null;
  is_vip: boolean;
  special_needs: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  notes: string | null;
  gift_received: boolean;
  gift_description: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
}

interface GuestTag {
  id: string;
  name: string;
  color: string;
}

interface GuestDetailModalProps {
  guestId: string;
  weddingId: string;
  onClose: () => void;
  onUpdate: () => void;
}

type TabType = 'basics' | 'relationship' | 'dietary' | 'address' | 'notes';

export default function GuestDetailModal({ guestId, weddingId, onClose, onUpdate }: GuestDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basics');
  const [guest, setGuest] = useState<Guest | null>(null);
  const [availableTags, setAvailableTags] = useState<GuestTag[]>([]);
  const [assignedTags, setAssignedTags] = useState<string[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedGuest, setEditedGuest] = useState<Partial<Guest>>({});

  useEffect(() => {
    loadGuestData();
    loadTags();
    loadGroups();
  }, [guestId]);

  const loadGuestData = async () => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('id', guestId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setGuest(data);
        setEditedGuest(data);
      }
    } catch (error) {
      console.error('Error loading guest:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const [tagsData, assignmentsData] = await Promise.all([
        supabase.from('guest_tags').select('*').eq('wedding_id', weddingId),
        supabase.from('guest_tag_assignments').select('tag_id').eq('guest_id', guestId)
      ]);

      if (tagsData.data) setAvailableTags(tagsData.data);
      if (assignmentsData.data) setAssignedTags(assignmentsData.data.map(a => a.tag_id));
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const { data } = await supabase
        .from('guest_groups')
        .select('*')
        .eq('wedding_id', weddingId);

      if (data) setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('guests')
        .update(editedGuest)
        .eq('id', guestId);

      if (error) throw error;

      setGuest({ ...guest!, ...editedGuest });
      setEditMode(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating guest:', error);
      alert('Fehler beim Speichern');
    }
  };

  const handleToggleTag = async (tagId: string) => {
    try {
      if (assignedTags.includes(tagId)) {
        await supabase
          .from('guest_tag_assignments')
          .delete()
          .eq('guest_id', guestId)
          .eq('tag_id', tagId);
        setAssignedTags(assignedTags.filter(id => id !== tagId));
      } else {
        await supabase
          .from('guest_tag_assignments')
          .insert({ guest_id: guestId, tag_id: tagId });
        setAssignedTags([...assignedTags, tagId]);
      }
    } catch (error) {
      console.error('Error toggling tag:', error);
    }
  };

  const handleCheckIn = async () => {
    try {
      const { error } = await supabase
        .from('guests')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', guestId);

      if (error) throw error;
      loadGuestData();
      onUpdate();
    } catch (error) {
      console.error('Error checking in guest:', error);
    }
  };

  if (loading || !guest) {
    return (
      <StandardModal
        isOpen={true}
        onClose={onClose}
        title="Lädt Gast-Details..."
        icon={User}
        maxWidth="4xl"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-white/70">Lädt...</div>
        </div>
      </StandardModal>
    );
  }

  const currentGroup = groups.find(g => g.id === guest.group_id);

  const tabs = [
    { id: 'basics' as TabType, label: 'Grunddaten', shortLabel: 'Basis', icon: <UserPlus className="w-3.5 h-3.5" /> },
    { id: 'relationship' as TabType, label: 'Beziehung', shortLabel: 'Relation', icon: <Heart className="w-3.5 h-3.5" /> },
    { id: 'dietary' as TabType, label: 'Ernährung', shortLabel: 'Diät', icon: <Utensils className="w-3.5 h-3.5" /> },
    { id: 'address' as TabType, label: 'Adresse', shortLabel: 'Adresse', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'notes' as TabType, label: 'Notizen', shortLabel: 'Info', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  const getPartnerSideColor = (side: string) => {
    if (side === 'partner_1') return 'from-pink-500 to-pink-600';
    if (side === 'partner_2') return 'from-blue-500 to-blue-600';
    return 'from-[#d4af37] to-[#f4d03f]';
  };

  return (
    <StandardModal
      isOpen={true}
      onClose={onClose}
      title={guest.name}
      subtitle={`${guest.age_group === 'adult' ? 'Erwachsener' : guest.age_group === 'child' ? 'Kind' : 'Kleinkind'}`}
      icon={User}
      maxWidth="4xl"
      footer={
        <ModalFooter>
          {editMode ? (
            <>
              <ModalButton variant="secondary" onClick={() => setEditMode(false)}>
                Abbrechen
              </ModalButton>
              <ModalButton variant="primary" onClick={handleSave} icon={Save}>
                Änderungen speichern
              </ModalButton>
            </>
          ) : (
            <ModalButton variant="primary" onClick={() => setEditMode(true)} icon={UserCheck}>
              Bearbeiten
            </ModalButton>
          )}
        </ModalFooter>
      }
    >
      {/* Status Badges in Header Area */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(guest.rsvp_status)}`}>
          {getStatusLabel(guest.rsvp_status)}
        </span>
        {guest.is_vip && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white">
            VIP
          </span>
        )}
        {guest.checked_in && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
            Eingecheckt
          </span>
        )}
        {currentGroup && (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: `${currentGroup.color}40`, color: currentGroup.color, borderColor: currentGroup.color }}
          >
            {currentGroup.name}
          </span>
        )}
      </div>

      {/* Tab Navigation - Mobile Optimiert */}
      <div className="mb-4">
        <MobileTabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="pills"
        />
      </div>

      {/* Tab Content */}
      <div className="min-h-[280px]" role="tabpanel" id={`tabpanel-${activeTab}`}>
        {activeTab === 'basics' && (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-white/90 mb-1">Name*</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedGuest.name || ''}
                    onChange={(e) => setEditedGuest({ ...editedGuest, name: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                  />
                ) : (
                  <p className="text-white font-medium py-2 text-sm">{guest.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/90 mb-1">E-Mail</label>
                {editMode ? (
                  <input
                    type="email"
                    value={editedGuest.email || ''}
                    onChange={(e) => setEditedGuest({ ...editedGuest, email: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                  />
                ) : (
                  <p className="text-white font-medium py-2 text-sm flex items-center gap-2">
                    {guest.email ? (
                      <>
                        <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
                        <a href={`mailto:${guest.email}`} className="hover:text-[#d4af37] transition-colors">{guest.email}</a>
                      </>
                    ) : <span className="text-white/50">-</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/90 mb-1">Telefon</label>
                {editMode ? (
                  <input
                    type="tel"
                    value={editedGuest.phone || ''}
                    onChange={(e) => setEditedGuest({ ...editedGuest, phone: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                  />
                ) : (
                  <p className="text-white font-medium py-2 text-sm flex items-center gap-2">
                    {guest.phone ? (
                      <>
                        <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
                        <a href={`tel:${guest.phone}`} className="hover:text-[#d4af37] transition-colors">{guest.phone}</a>
                      </>
                    ) : <span className="text-white/50">-</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/90 mb-1">Altersgruppe</label>
                {editMode ? (
                  <select
                    value={editedGuest.age_group || 'adult'}
                    onChange={(e) => setEditedGuest({ ...editedGuest, age_group: e.target.value as any })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                  >
                    <option value="adult" className="bg-[#0a253c] text-white">Erwachsener</option>
                    <option value="child" className="bg-[#0a253c] text-white">Kind</option>
                    <option value="infant" className="bg-[#0a253c] text-white">Kleinkind</option>
                  </select>
                ) : (
                  <p className="text-white font-medium py-2 text-sm">
                    {guest.age_group === 'adult' ? 'Erwachsener' :
                     guest.age_group === 'child' ? 'Kind' : 'Kleinkind'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/90 mb-1">RSVP-Status</label>
                {editMode ? (
                  <select
                    value={editedGuest.rsvp_status || 'planned'}
                    onChange={(e) => setEditedGuest({ ...editedGuest, rsvp_status: e.target.value as any })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                  >
                    <option value="planned" className="bg-[#0a253c] text-white">Geplant</option>
                    <option value="invited" className="bg-[#0a253c] text-white">Eingeladen</option>
                    <option value="accepted" className="bg-[#0a253c] text-white">Zugesagt</option>
                    <option value="declined" className="bg-[#0a253c] text-white">Abgesagt</option>
                  </select>
                ) : (
                  <p className="text-white font-medium py-2 text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(guest.rsvp_status)}`}>
                      {getStatusLabel(guest.rsvp_status)}
                    </span>
                  </p>
                )}
              </div>

              {guest.invitation_sent_date && (
                <div>
                  <label className="block text-xs font-semibold text-white/90 mb-1">Einladung versendet am</label>
                  <p className="text-white font-medium py-2 text-sm flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                    {new Date(guest.invitation_sent_date).toLocaleDateString('de-DE')}
                  </p>
                </div>
              )}

              {guest.rsvp_date && (
                <div>
                  <label className="block text-xs font-semibold text-white/90 mb-1">RSVP-Datum</label>
                  <p className="text-white font-medium py-2 text-sm flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                    {new Date(guest.rsvp_date).toLocaleDateString('de-DE')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'relationship' && (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-white/90 mb-1">Beziehung zum Brautpaar</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedGuest.relationship || ''}
                    onChange={(e) => setEditedGuest({ ...editedGuest, relationship: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="z.B. Freund, Familie, Arbeitskollege"
                  />
                ) : (
                  <p className="text-white font-medium py-2 text-sm">{guest.relationship || <span className="text-white/50">-</span>}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/90 mb-1">Gruppe (optional)</label>
                {editMode ? (
                  <select
                    value={editedGuest.group_id || ''}
                    onChange={(e) => setEditedGuest({ ...editedGuest, group_id: e.target.value || null })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                  >
                    <option value="" className="bg-[#0a253c] text-white">Keine Gruppe</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id} className="bg-[#0a253c] text-white">{group.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-white font-medium py-2 text-sm">
                    {currentGroup ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: `${currentGroup.color}40`, color: currentGroup.color }}
                      >
                        {currentGroup.name}
                      </span>
                    ) : <span className="text-white/50">-</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/90 mb-1">Tischnummer (optional)</label>
                {editMode ? (
                  <input
                    type="number"
                    value={editedGuest.table_number || ''}
                    onChange={(e) => setEditedGuest({ ...editedGuest, table_number: parseInt(e.target.value) || null })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="z.B. 5"
                  />
                ) : (
                  <p className="text-white font-medium py-2 text-sm">{guest.table_number || <span className="text-white/50">-</span>}</p>
                )}
              </div>
            </div>

          </div>
        )}


        {activeTab === 'dietary' && (
          <div className="space-y-2">
            {editMode ? (
              <DietaryRestrictionsSelector
                value={editedGuest.dietary_restrictions || ''}
                onChange={(value) => setEditedGuest({ ...editedGuest, dietary_restrictions: value })}
              />
            ) : (
              <div>
                <label className="block text-xs font-semibold text-white/90 mb-2">Diätwünsche / Allergien</label>
                {guest.dietary_restrictions ? (
                  <div className="flex flex-wrap gap-1">
                    {guest.dietary_restrictions.split(',').map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-[#d4af37]/20 text-[#d4af37] rounded-full text-xs font-semibold border border-[#d4af37]/30"
                      >
                        {item.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/50 text-sm">Keine Diätwünsche angegeben</p>
                )}
              </div>
            )}

            {guest.special_needs && (
              <div className="border-t border-[#d4af37]/30 pt-3 mt-3">
                <label className="block text-xs font-semibold text-white/90 mb-1">Besondere Bedürfnisse</label>
                {editMode ? (
                  <textarea
                    value={editedGuest.special_needs || ''}
                    onChange={(e) => setEditedGuest({ ...editedGuest, special_needs: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    rows={3}
                    placeholder="z.B. Rollstuhlzugang, Hochstuhl für Kind..."
                  />
                ) : (
                  <p className="text-white py-2 text-sm">{guest.special_needs}</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'address' && (
          <div className="space-y-2">
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-white/90 mb-1">Straße & Hausnummer</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedGuest.address || ''}
                    onChange={(e) => setEditedGuest({ ...editedGuest, address: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="Musterstraße 123"
                  />
                ) : (
                  <p className="text-white font-medium py-2 text-sm flex items-center gap-2">
                    {guest.address ? (
                      <>
                        <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                        {guest.address}
                      </>
                    ) : <span className="text-white/50">-</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/90 mb-1">PLZ</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedGuest.postal_code || ''}
                    onChange={(e) => setEditedGuest({ ...editedGuest, postal_code: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="12345"
                  />
                ) : (
                  <p className="text-white font-medium py-2 text-sm">{guest.postal_code || <span className="text-white/50">-</span>}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/90 mb-1">Stadt</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedGuest.city || ''}
                    onChange={(e) => setEditedGuest({ ...editedGuest, city: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="Musterstadt"
                  />
                ) : (
                  <p className="text-white font-medium py-2 text-sm">{guest.city || <span className="text-white/50">-</span>}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-white/90 mb-1">Land</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedGuest.country || ''}
                    onChange={(e) => setEditedGuest({ ...editedGuest, country: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="Deutschland"
                  />
                ) : (
                  <p className="text-white font-medium py-2 text-sm">{guest.country || <span className="text-white/50">-</span>}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-semibold text-white/90 mb-1">Interne Notizen</label>
              <textarea
                value={editedGuest.notes !== undefined ? editedGuest.notes : (guest.notes || '')}
                onChange={(e) => setEditedGuest({ ...editedGuest, notes: e.target.value })}
                onBlur={handleSave}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm"
                rows={8}
                placeholder="Interne Notizen zu diesem Gast (nur für das Organisationsteam sichtbar)..."
              />
            </div>
            <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-2 backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-200">
                  Diese Notizen sind nur für das Organisationsteam sichtbar.
                </p>
              </div>
            </div>

            {/* Gift Section */}
            {(guest.gift_received || editMode) && (
              <div className="border-t border-[#d4af37]/30 pt-3 mt-3">
                <label className="block text-xs font-semibold text-white/90 mb-2">Geschenk</label>
                <div className="space-y-2">
                  {editMode && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editedGuest.gift_received !== undefined ? editedGuest.gift_received : guest.gift_received}
                        onChange={(e) => setEditedGuest({ ...editedGuest, gift_received: e.target.checked })}
                        className="w-4 h-4 rounded border border-[#d4af37]/30 bg-white/10 checked:bg-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/50"
                      />
                      <span className="text-white text-sm">Geschenk erhalten</span>
                    </label>
                  )}
                  {(editedGuest.gift_received || guest.gift_received) && (
                    <div>
                      <label className="block text-xs font-semibold text-white/90 mb-1">Geschenkbeschreibung</label>
                      {editMode ? (
                        <textarea
                          value={editedGuest.gift_description !== undefined ? editedGuest.gift_description || '' : (guest.gift_description || '')}
                          onChange={(e) => setEditedGuest({ ...editedGuest, gift_description: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                          rows={3}
                          placeholder="Beschreibung des erhaltenen Geschenks..."
                        />
                      ) : (
                        <p className="text-white py-2 text-sm">{guest.gift_description || <span className="text-white/50">Keine Beschreibung</span>}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </StandardModal>
  );
}
