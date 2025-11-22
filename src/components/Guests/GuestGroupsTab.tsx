import { useState, useEffect } from 'react';
import { Plus, Users, Edit2, Trash2, ChevronDown, ChevronRight, Mail, Phone, User, Utensils, UserCircle, Save } from 'lucide-react';
import { supabase, type Guest, type GuestGroup } from '../../lib/supabase';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useToast } from '../../contexts/ToastContext';
import StandardModal, { ModalFooter, ModalButton } from '../StandardModal';

interface GuestGroupsTabProps {
  weddingId: string;
  onUpdate: () => void;
  onAddGroup?: () => void;
}

export default function GuestGroupsTab({ weddingId, onUpdate, onAddGroup }: GuestGroupsTabProps) {
  const { showToast } = useToast();
  const { confirmDelete } = useConfirmDialog();
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [groupMembers, setGroupMembers] = useState<Record<string, Guest[]>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadGroups();
  }, [weddingId]);

  const loadGroups = async () => {
    try {
      const { data: groupsData } = await supabase
        .from('guest_groups')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('name');

      if (groupsData) {
        setGroups(groupsData);

        const membersMap: Record<string, Guest[]> = {};
        for (const group of groupsData) {
          const { data: guestsData } = await supabase
            .from('guests')
            .select('*')
            .eq('group_id', group.id)
            .order('name');

          membersMap[group.id] = guestsData || [];
        }
        setGroupMembers(membersMap);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleEditGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroupId(groupId);
  };

  const handleDeleteGroup = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const memberCount = groupMembers[groupId]?.length || 0;

    let message = 'Möchtest du diese Gruppe wirklich löschen?';
    if (memberCount > 0) {
      message = `Diese Gruppe hat ${memberCount} Mitglied${memberCount > 1 ? 'er' : ''}. Möchtest du die Gruppe löschen? Die Gäste werden nicht gelöscht, aber aus der Gruppe entfernt.`;
    }

    const confirmed = await confirmDelete(message);
    if (!confirmed) return;

    try {
      await supabase
        .from('guests')
        .update({ group_id: null })
        .eq('group_id', groupId);

      const { error } = await supabase
        .from('guest_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      showToast('Gruppe erfolgreich gelöscht', 'success');
      loadGroups();
      onUpdate();
    } catch (error) {
      console.error('Error deleting group:', error);
      showToast('Fehler beim Löschen der Gruppe', 'error');
    }
  };

  const getAgeGroupLabel = (ageGroup: string) => {
    switch (ageGroup) {
      case 'adult':
        return 'Erwachsener';
      case 'child':
        return 'Kind';
      case 'infant':
        return 'Kleinkind';
      default:
        return ageGroup;
    }
  };

  const getRSVPStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'declined':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'invited':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'planned':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getRSVPStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Zugesagt';
      case 'declined':
        return 'Abgesagt';
      case 'invited':
        return 'Eingeladen';
      case 'planned':
        return 'Geplant';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-[#0a253c]">Gästegruppen</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all min-h-[40px]"
        >
          <Plus className="w-4 h-4" />
          Gruppe hinzufügen
        </button>
      </div>

      <div className="space-y-4">
        {groups.map((group) => {
          const members = groupMembers[group.id] || [];
          const isExpanded = expandedGroups.has(group.id);

          return (
            <div
              key={group.id}
              className="bg-white rounded-xl shadow-lg border-2 border-[#d4af37]/30 hover:border-[#d4af37] transition-all overflow-hidden"
            >
              <div
                onClick={() => toggleGroup(group.id)}
                className="p-6 cursor-pointer hover:bg-[#f7f2eb]/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${group.color || '#d4af37'}20` }}
                    >
                      <Users className="w-6 h-6" style={{ color: group.color || '#d4af37' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-[#0a253c] text-lg">{group.name}</h4>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-[#d4af37] flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-[#d4af37] flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#666666]">
                        <p>{members.length} Mitglied{members.length !== 1 ? 'er' : ''}</p>
                        {group.description && (
                          <>
                            <span>•</span>
                            <p className="truncate">{group.description}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => handleEditGroup(group.id, e)}
                      className="p-2 hover:bg-[#f7f2eb] rounded-lg transition-all"
                      title="Gruppe bearbeiten"
                    >
                      <Edit2 className="w-4 h-4 text-[#d4af37]" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteGroup(group.id, e)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-all"
                      title="Gruppe löschen"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && members.length > 0 && (
                <div className="border-t-2 border-[#d4af37]/20 bg-[#f7f2eb]/30 p-6">
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="bg-white rounded-lg p-4 border border-[#d4af37]/20 hover:border-[#d4af37]/40 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-[#d4af37]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-[#0a253c] truncate">{member.name}</h5>
                                <div className="flex items-center gap-2 text-sm text-[#666666]">
                                  <span>{getAgeGroupLabel(member.age_group)}</span>
                                  {member.relationship && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">{member.relationship}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-2 text-sm">
                              {member.email && (
                                <div className="flex items-center gap-2 text-[#333333]">
                                  <Mail className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                                  <span className="truncate">{member.email}</span>
                                </div>
                              )}
                              {member.phone && (
                                <div className="flex items-center gap-2 text-[#333333]">
                                  <Phone className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                                  <span className="truncate">{member.phone}</span>
                                </div>
                              )}
                              {member.dietary_restrictions && (
                                <div className="flex items-center gap-2 text-[#333333] sm:col-span-2">
                                  <Utensils className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                                  <span className="truncate">{member.dietary_restrictions}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div
                            className={`px-3 py-1.5 rounded-lg font-semibold text-sm border ${getRSVPStatusColor(
                              member.rsvp_status
                            )} flex-shrink-0 self-start`}
                          >
                            {getRSVPStatusLabel(member.rsvp_status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isExpanded && members.length === 0 && (
                <div className="border-t-2 border-[#d4af37]/20 bg-[#f7f2eb]/30 p-6">
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-[#d4af37] mx-auto mb-3 opacity-50" />
                    <p className="text-[#666666]">Keine Mitglieder in dieser Gruppe</p>
                    <button
                      onClick={(e) => handleEditGroup(group.id, e)}
                      className="mt-4 text-[#d4af37] hover:text-[#c19a2e] font-semibold text-sm"
                    >
                      Gruppe bearbeiten um Mitglieder hinzuzufügen
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {groups.length === 0 && (
          <div className="text-center py-12 bg-[#f7f2eb] rounded-2xl">
            <Users className="w-16 h-16 text-[#d4af37] mx-auto mb-4 opacity-50" />
            <p className="text-[#666666] text-lg mb-2">Keine Gästegruppen vorhanden</p>
            <p className="text-sm text-[#999999]">Erstelle Gruppen um Gäste zu organisieren</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <GuestGroupAddModal
          weddingId={weddingId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadGroups();
            onUpdate();
          }}
        />
      )}

      {editingGroupId && (
        <GuestGroupEditModal
          groupId={editingGroupId}
          weddingId={weddingId}
          onClose={() => setEditingGroupId(null)}
          onSuccess={() => {
            setEditingGroupId(null);
            loadGroups();
            onUpdate();
          }}
        />
      )}
    </div>
  );
}

interface GuestGroupAddModalProps {
  weddingId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function GuestGroupAddModal({ weddingId, onClose, onSuccess }: GuestGroupAddModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#d4af37');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast('Bitte gib einen Gruppennamen ein', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('guest_groups')
        .insert({
          wedding_id: weddingId,
          name: name.trim(),
          color,
          description: description.trim() || null,
        });

      if (error) throw error;

      showToast('Gruppe erfolgreich erstellt', 'success');
      onSuccess();
    } catch (error) {
      console.error('Error creating group:', error);
      showToast('Fehler beim Erstellen der Gruppe', 'error');
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = [
    { value: '#d4af37', label: 'Gold' },
    { value: '#3b82f6', label: 'Blau' },
    { value: '#10b981', label: 'Grün' },
    { value: '#f59e0b', label: 'Orange' },
    { value: '#ef4444', label: 'Rot' },
    { value: '#8b5cf6', label: 'Lila' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#06b6d4', label: 'Cyan' },
  ];

  return (
    <StandardModal
      isOpen={true}
      onClose={onClose}
      title="Neue Gruppe erstellen"
      subtitle="Organisiere deine Gäste in Gruppen"
      icon={UserCircle}
      maxWidth="md"
      footer={
        <ModalFooter>
          <ModalButton onClick={onClose} variant="secondary" disabled={loading}>
            Abbrechen
          </ModalButton>
          <ModalButton onClick={handleSubmit} variant="primary" disabled={loading} icon={Save}>
            {loading ? 'Erstelle...' : 'Erstellen'}
          </ModalButton>
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Gruppenname *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-[#d4af37]/30 focus:border-[#d4af37] focus:outline-none text-white placeholder-white/50"
            placeholder="z.B. Arbeitskollegen, Sportverein..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Farbe
          </label>
          <div className="grid grid-cols-4 gap-3">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setColor(option.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  color === option.value
                    ? 'border-[#d4af37] ring-2 ring-[#d4af37]/50'
                    : 'border-white/20 hover:border-white/40'
                }`}
                title={option.label}
              >
                <div
                  className="w-full h-8 rounded-md shadow-lg"
                  style={{ backgroundColor: option.value }}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Beschreibung (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-[#d4af37]/30 focus:border-[#d4af37] focus:outline-none text-white placeholder-white/50"
            placeholder="Beschreibe die Gruppe..."
            rows={3}
          />
        </div>
      </div>
    </StandardModal>
  );
}

interface GuestGroupEditModalProps {
  groupId: string;
  weddingId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function GuestGroupEditModal({ groupId, weddingId, onClose, onSuccess }: GuestGroupEditModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#d4af37');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGroupData();
    loadAllGuests();
  }, [groupId, weddingId]);

  const loadGroupData = async () => {
    try {
      const { data: groupData } = await supabase
        .from('guest_groups')
        .select('*')
        .eq('id', groupId)
        .maybeSingle();

      if (groupData) {
        setName(groupData.name);
        setColor(groupData.color || '#d4af37');
        setDescription(groupData.description || '');
      }

      const { data: membersData } = await supabase
        .from('guests')
        .select('id')
        .eq('group_id', groupId);

      if (membersData) {
        setSelectedGuestIds(new Set(membersData.map(g => g.id)));
      }
    } catch (error) {
      console.error('Error loading group:', error);
    }
  };

  const loadAllGuests = async () => {
    try {
      const { data } = await supabase
        .from('guests')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('name');

      if (data) setAllGuests(data);
    } catch (error) {
      console.error('Error loading guests:', error);
    }
  };

  const toggleGuest = (guestId: string) => {
    setSelectedGuestIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(guestId)) {
        newSet.delete(guestId);
      } else {
        newSet.add(guestId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast('Bitte gib einen Gruppennamen ein', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('guest_groups')
        .update({
          name: name.trim(),
          color,
          description: description.trim() || null,
        })
        .eq('id', groupId);

      if (updateError) throw updateError;

      await supabase
        .from('guests')
        .update({ group_id: null })
        .eq('group_id', groupId);

      if (selectedGuestIds.size > 0) {
        await supabase
          .from('guests')
          .update({ group_id: groupId })
          .in('id', Array.from(selectedGuestIds));
      }

      showToast('Gruppe erfolgreich aktualisiert', 'success');
      onSuccess();
    } catch (error) {
      console.error('Error updating group:', error);
      showToast('Fehler beim Aktualisieren der Gruppe', 'error');
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = [
    { value: '#d4af37', label: 'Gold' },
    { value: '#3b82f6', label: 'Blau' },
    { value: '#10b981', label: 'Grün' },
    { value: '#f59e0b', label: 'Orange' },
    { value: '#ef4444', label: 'Rot' },
    { value: '#8b5cf6', label: 'Lila' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#06b6d4', label: 'Cyan' },
  ];

  return (
    <StandardModal
      isOpen={true}
      onClose={onClose}
      title="Gruppe bearbeiten"
      subtitle={`Passe ${name} an`}
      icon={Edit2}
      maxWidth="2xl"
      footer={
        <ModalFooter>
          <ModalButton onClick={onClose} variant="secondary" disabled={loading}>
            Abbrechen
          </ModalButton>
          <ModalButton onClick={handleSubmit} variant="primary" disabled={loading} icon={Save}>
            {loading ? 'Speichere...' : 'Speichern'}
          </ModalButton>
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Gruppenname *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-[#d4af37]/30 focus:border-[#d4af37] focus:outline-none text-white placeholder-white/50"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Farbe
          </label>
          <div className="grid grid-cols-4 gap-3">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setColor(option.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  color === option.value
                    ? 'border-[#d4af37] ring-2 ring-[#d4af37]/50'
                    : 'border-white/20 hover:border-white/40'
                }`}
                title={option.label}
              >
                <div
                  className="w-full h-8 rounded-md shadow-lg"
                  style={{ backgroundColor: option.value }}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Beschreibung (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-[#d4af37]/30 focus:border-[#d4af37] focus:outline-none text-white placeholder-white/50"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Mitglieder auswählen
          </label>
          <div className="border-2 border-[#d4af37]/30 rounded-xl p-4 max-h-64 overflow-y-auto space-y-2 bg-white/5">
            {allGuests.map(guest => (
              <label
                key={guest.id}
                className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedGuestIds.has(guest.id)}
                  onChange={() => toggleGuest(guest.id)}
                  className="w-5 h-5 text-[#d4af37] border-2 border-[#d4af37]/30 rounded focus:ring-[#d4af37]"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{guest.name}</p>
                  {guest.email && (
                    <p className="text-sm text-white/70 truncate">{guest.email}</p>
                  )}
                </div>
              </label>
            ))}
            {allGuests.length === 0 && (
              <p className="text-center text-white/60 py-4">Keine Gäste vorhanden</p>
            )}
          </div>
          <p className="text-sm text-white/70 mt-2">
            {selectedGuestIds.size} Gast{selectedGuestIds.size !== 1 ? 'e' : ''} ausgewählt
          </p>
        </div>
      </div>
    </StandardModal>
  );
}
