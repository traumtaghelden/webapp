import { useState, useEffect } from 'react';
import { Plus, Users, Edit2, Trash2, ChevronDown, ChevronRight, Mail, Phone, User, Utensils, MapPin } from 'lucide-react';
import { supabase, type Guest } from '../../lib/supabase';
import FamilyEditModal from '../FamilyEditModal';
import FamilyDetailModal from '../FamilyDetailModal';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useToast } from '../../contexts/ToastContext';

interface FamilyGroup {
  id: string;
  wedding_id: string;
  family_name: string;
  partner_side?: 'partner_1' | 'partner_2' | 'both' | null;
  notes?: string;
  created_at: string;
}

interface GuestFamiliesTabProps {
  weddingId: string;
  onUpdate: () => void;
  onAddFamily?: () => void;
}

export default function GuestFamiliesTab({ weddingId, onUpdate, onAddFamily }: GuestFamiliesTabProps) {
  const { showToast } = useToast();
  const { confirmDelete } = useConfirmDialog();
  const [families, setFamilies] = useState<FamilyGroup[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Record<string, Guest[]>>({});
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null);
  const [viewingFamilyId, setViewingFamilyId] = useState<string | null>(null);
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    loadFamilies();
    loadGroups();
  }, [weddingId]);

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

  const loadFamilies = async () => {
    try {
      const { data: familiesData } = await supabase
        .from('family_groups')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('family_name');

      if (familiesData) {
        setFamilies(familiesData);

        // Load members for all families
        const membersMap: Record<string, Guest[]> = {};
        for (const family of familiesData) {
          const { data: guestsData } = await supabase
            .from('guests')
            .select('*')
            .eq('family_group_id', family.id)
            .order('age_group', { ascending: false });

          membersMap[family.id] = guestsData || [];
        }
        setFamilyMembers(membersMap);
      }
    } catch (error) {
      console.error('Error loading families:', error);
    }
  };

  const toggleFamily = (familyId: string) => {
    setExpandedFamilies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(familyId)) {
        newSet.delete(familyId);
      } else {
        newSet.add(familyId);
      }
      return newSet;
    });
  };

  const handleEditFamily = (familyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFamilyId(familyId);
  };

  const handleDeleteFamily = async (familyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const memberCount = familyMembers[familyId]?.length || 0;

    let message = 'Möchtest du diese Familie wirklich löschen?';
    if (memberCount > 0) {
      message = `Diese Familie hat ${memberCount} Mitglied${memberCount > 1 ? 'er' : ''}. Möchtest du die Familie löschen? Die Gäste werden nicht gelöscht, aber aus der Familie entfernt.`;
    }

    const confirmed = await confirmDelete(message);
    if (!confirmed) return;

    try {
      // Remove family_group_id from all guests in this family
      await supabase
        .from('guests')
        .update({ family_group_id: null, is_family_head: false, family_role: null })
        .eq('family_group_id', familyId);

      // Delete the family group
      const { error } = await supabase
        .from('family_groups')
        .delete()
        .eq('id', familyId);

      if (error) throw error;

      showToast('Familie erfolgreich gelöscht', 'success');
      loadFamilies();
      onUpdate();
    } catch (error) {
      console.error('Error deleting family:', error);
      showToast('Fehler beim Löschen der Familie', 'error');
    }
  };

  const handleFamilyUpdated = () => {
    setEditingFamilyId(null);
    loadFamilies();
    onUpdate();
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
        <h3 className="text-xl font-bold text-white">Familiengruppen</h3>
        <button
          onClick={onAddFamily}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white rounded-lg font-bold text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Familie hinzufügen
        </button>
      </div>

      <div className="space-y-4">
        {families.map((family) => {
          const members = familyMembers[family.id] || [];
          const isExpanded = expandedFamilies.has(family.id);

          return (
            <div
              key={family.id}
              className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl shadow-lg border-2 border-[#d4af37]/30 hover:border-[#d4af37] hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Family Header - Clickable */}
              <div
                onClick={() => toggleFamily(family.id)}
                className="p-5 cursor-pointer hover:bg-[#f7f2eb]/50 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-[#d4af37]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <h4 className="font-bold text-gray-900 text-base">{family.family_name}</h4>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#d4af37] flex-shrink-0 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#d4af37] flex-shrink-0 transition-transform duration-200" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-600">
                        {members.length} Mitglied{members.length !== 1 ? 'er' : ''}
                        {members.length > 0 && (
                          <>
                            {' • '}
                            {members.filter(m => m.age_group === 'adult').length} Erwachsene
                            {members.filter(m => m.age_group !== 'adult').length > 0 &&
                              `, ${members.filter(m => m.age_group !== 'adult').length} Kinder`
                            }
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => handleEditFamily(family.id, e)}
                      className="p-1.5 hover:bg-white/80 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                      title="Familie bearbeiten"
                    >
                      <Edit2 className="w-4 h-4 text-[#d4af37]" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteFamily(family.id, e)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                      title="Familie löschen"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Members List */}
              {isExpanded && members.length > 0 && (
                <div className="border-t-2 border-[#d4af37]/20 bg-white/50 p-5">
                  <div className="space-y-2.5">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="bg-white rounded-lg p-3.5 border border-[#d4af37]/20 hover:border-[#d4af37]/40 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Member Name & Info */}
                            <div className="flex items-center gap-2.5 mb-2.5">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4af37] to-[#c19a2e] flex items-center justify-center flex-shrink-0 shadow-sm">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-gray-900 truncate text-sm">{member.name}</h5>
                                <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold">
                                  <span>{getAgeGroupLabel(member.age_group)}</span>
                                  {member.family_role && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">{member.family_role}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Contact Information */}
                            <div className="grid sm:grid-cols-2 gap-1.5 text-xs">
                              {member.email && (
                                <div className="flex items-center gap-1.5 text-[#333333]">
                                  <Mail className="w-3.5 h-3.5 text-[#d4af37] flex-shrink-0" />
                                  <span className="truncate font-medium">{member.email}</span>
                                </div>
                              )}
                              {member.phone && (
                                <div className="flex items-center gap-1.5 text-[#333333]">
                                  <Phone className="w-3.5 h-3.5 text-[#d4af37] flex-shrink-0" />
                                  <span className="truncate font-medium">{member.phone}</span>
                                </div>
                              )}
                              {member.dietary_restrictions && (
                                <div className="flex items-center gap-1.5 text-[#333333] sm:col-span-2">
                                  <Utensils className="w-3.5 h-3.5 text-[#d4af37] flex-shrink-0" />
                                  <span className="truncate font-medium">{member.dietary_restrictions}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* RSVP Status Badge */}
                          <div
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs border ${getRSVPStatusColor(
                              member.rsvp_status
                            )} flex-shrink-0 self-start shadow-sm`}
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
                <div className="border-t-2 border-[#d4af37]/20 bg-white/50 p-6">
                  <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f7f2eb] flex items-center justify-center">
                      <Users className="w-8 h-8 text-[#d4af37] opacity-50" />
                    </div>
                    <p className="text-[#666666] font-semibold mb-3">Keine Mitglieder in dieser Familie</p>
                    <button
                      onClick={(e) => handleEditFamily(family.id, e)}
                      className="mt-2 px-4 py-2 bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white rounded-lg font-bold text-xs shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 active:scale-95"
                    >
                      Familie bearbeiten
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {families.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-[#f7f2eb]/50 to-white rounded-2xl border-2 border-[#d4af37]/20">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-white flex items-center justify-center shadow-md">
              <Users className="w-10 h-10 text-[#d4af37] opacity-50" />
            </div>
            <p className="text-[#666666] text-base font-bold mb-2">Keine Familiengruppen vorhanden</p>
            <p className="text-xs text-[#999999] font-semibold">Erstelle Gruppen um Gäste zu organisieren</p>
          </div>
        )}
      </div>

      {editingFamilyId && (
        <FamilyEditModal
          familyGroupId={editingFamilyId}
          weddingId={weddingId}
          groups={groups}
          onClose={() => setEditingFamilyId(null)}
          onSuccess={handleFamilyUpdated}
        />
      )}

      {viewingFamilyId && (
        <FamilyDetailModal
          familyGroupId={viewingFamilyId}
          weddingId={weddingId}
          onClose={() => setViewingFamilyId(null)}
          onEdit={() => {
            setViewingFamilyId(null);
            setEditingFamilyId(viewingFamilyId);
          }}
          onDelete={() => {
            setViewingFamilyId(null);
            handleDeleteFamily(viewingFamilyId, {} as React.MouseEvent);
          }}
        />
      )}
    </div>
  );
}
