import { useState, useEffect } from 'react';
import { X, Users, Search, CheckCircle2, XCircle, Home, User, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { supabase, type Guest, type FamilyGroup, type TimelineEventGuestAttendance } from '../lib/supabase';

interface EventGuestManagementModalProps {
  eventId: string;
  eventTitle: string;
  weddingId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

interface GuestWithAttendance extends Guest {
  attendance?: TimelineEventGuestAttendance;
}

export default function EventGuestManagementModal({
  eventId,
  eventTitle,
  weddingId,
  onClose,
  onUpdate
}: EventGuestManagementModalProps) {
  const [guests, setGuests] = useState<GuestWithAttendance[]>([]);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
  const [changes, setChanges] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    loadData();
  }, [eventId, weddingId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [guestsRes, familiesRes, attendanceRes] = await Promise.all([
        supabase
          .from('guests')
          .select('*')
          .eq('wedding_id', weddingId)
          .order('name'),
        supabase
          .from('family_groups')
          .select('*')
          .eq('wedding_id', weddingId)
          .order('family_name'),
        supabase
          .from('timeline_event_guest_attendance')
          .select('*')
          .eq('timeline_event_id', eventId)
      ]);

      if (guestsRes.data) {
        const guestsWithAttendance = guestsRes.data.map(guest => ({
          ...guest,
          attendance: attendanceRes.data?.find(a => a.guest_id === guest.id)
        }));
        setGuests(guestsWithAttendance);
      }

      if (familiesRes.data) {
        setFamilyGroups(familiesRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isGuestAttending = (guest: GuestWithAttendance): boolean => {
    const guestId = guest.id;
    if (changes.has(guestId)) {
      return changes.get(guestId)!;
    }
    return guest.attendance?.is_attending ?? true;
  };

  const toggleGuest = (guestId: string) => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;

    const currentState = isGuestAttending(guest);
    const newChanges = new Map(changes);
    newChanges.set(guestId, !currentState);
    setChanges(newChanges);
  };

  const toggleFamily = (familyId: string) => {
    const familyMembers = guests.filter(g => g.family_group_id === familyId);
    if (familyMembers.length === 0) return;

    const allAttending = familyMembers.every(g => isGuestAttending(g));
    const newState = !allAttending;

    const newChanges = new Map(changes);
    familyMembers.forEach(member => {
      newChanges.set(member.id, newState);
    });
    setChanges(newChanges);
  };

  const toggleFamilyExpanded = (familyId: string) => {
    const newExpanded = new Set(expandedFamilies);
    if (newExpanded.has(familyId)) {
      newExpanded.delete(familyId);
    } else {
      newExpanded.add(familyId);
    }
    setExpandedFamilies(newExpanded);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      for (const [guestId, isAttending] of changes.entries()) {
        const guest = guests.find(g => g.id === guestId);
        if (!guest) continue;

        if (guest.attendance) {
          await supabase
            .from('timeline_event_guest_attendance')
            .update({ is_attending: isAttending })
            .eq('id', guest.attendance.id);
        } else {
          await supabase
            .from('timeline_event_guest_attendance')
            .insert({
              timeline_event_id: eventId,
              guest_id: guestId,
              is_attending: isAttending
            });
        }
      }

      setChanges(new Map());
      await loadData();
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Fehler beim Speichern der Gästeauswahl');
    } finally {
      setSaving(false);
    }
  };

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const guestsWithoutFamily = filteredGuests.filter(g => !g.family_group_id);
  const guestsInFamilies = filteredGuests.filter(g => g.family_group_id);

  const attendingCount = guests.filter(g => isGuestAttending(g)).length;
  const totalCount = guests.length;

  const getFamilyStatus = (familyId: string): 'all' | 'partial' | 'none' => {
    const familyMembers = guests.filter(g => g.family_group_id === familyId);
    if (familyMembers.length === 0) return 'none';

    const attendingMembers = familyMembers.filter(g => isGuestAttending(g));
    if (attendingMembers.length === 0) return 'none';
    if (attendingMembers.length === familyMembers.length) return 'all';
    return 'partial';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
            <p className="mt-4 text-[#333333]">Lade Gästeliste...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="bg-[#d4af37] text-[#0a253c] p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-7 h-7" />
            <div>
              <h2 className="text-2xl font-bold">{eventTitle}</h2>
              <p className="text-sm opacity-90">Gästeverwaltung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#d4af37]">{attendingCount}</div>
                <div className="text-sm text-[#333333]">Teilnehmend</div>
              </div>
              <div className="text-2xl text-gray-300">/</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#0a253c]">{totalCount}</div>
                <div className="text-sm text-[#333333]">Gesamt</div>
              </div>
            </div>
            {changes.size > 0 && (
              <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">{changes.size} ungespeicherte Änderungen</span>
              </div>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Gast suchen..."
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#d4af37] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {familyGroups.map(family => {
              const familyMembers = guestsInFamilies.filter(g => g.family_group_id === family.id);
              if (familyMembers.length === 0) return null;

              const familyStatus = getFamilyStatus(family.id);
              const isExpanded = expandedFamilies.has(family.id);

              return (
                <div key={family.id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                  <div
                    className="bg-gray-50 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleFamilyExpanded(family.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <Home className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h3 className="font-bold text-[#0a253c]">{family.family_name}</h3>
                        <p className="text-sm text-gray-600">{familyMembers.length} Personen</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFamily(family.id);
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        familyStatus === 'all'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : familyStatus === 'partial'
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {familyStatus === 'all' ? 'Alle dabei' : familyStatus === 'partial' ? 'Teilweise' : 'Nicht dabei'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="p-2 space-y-1">
                      {familyMembers.map(guest => {
                        const attending = isGuestAttending(guest);
                        return (
                          <div
                            key={guest.id}
                            onClick={() => toggleGuest(guest.id)}
                            className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                              attending
                                ? 'bg-green-50 hover:bg-green-100'
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className={`font-medium ${attending ? 'text-[#0a253c]' : 'text-gray-500'}`}>
                                  {guest.name}
                                </span>
                                {guest.family_role && (
                                  <span className="ml-2 text-sm text-gray-500">({guest.family_role})</span>
                                )}
                              </div>
                            </div>
                            <div>
                              {attending ? (
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                              ) : (
                                <XCircle className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {guestsWithoutFamily.length > 0 && (
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-500" />
                    <h3 className="font-bold text-[#0a253c]">Einzelne Gäste</h3>
                    <span className="text-sm text-gray-600">({guestsWithoutFamily.length})</span>
                  </div>
                </div>
                <div className="p-2 space-y-1">
                  {guestsWithoutFamily.map(guest => {
                    const attending = isGuestAttending(guest);
                    return (
                      <div
                        key={guest.id}
                        onClick={() => toggleGuest(guest.id)}
                        className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                          attending
                            ? 'bg-green-50 hover:bg-green-100'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className={`font-medium ${attending ? 'text-[#0a253c]' : 'text-gray-500'}`}>
                            {guest.name}
                          </span>
                        </div>
                        <div>
                          {attending ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredGuests.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Keine Gäste gefunden</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || changes.size === 0}
            className="px-8 py-3 bg-[#d4af37] text-[#0a253c] rounded-xl font-bold hover:bg-[#c19a2e] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0a253c]"></div>
                Speichere...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Änderungen speichern
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
