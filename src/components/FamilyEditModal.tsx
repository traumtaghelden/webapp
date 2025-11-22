import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Users, ChevronDown, ChevronRight, Heart, MapPin } from 'lucide-react';
import { supabase, type FamilyGroup, type Guest } from '../lib/supabase';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import DietaryRestrictionsSelector from './DietaryRestrictionsSelector';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';

interface FamilyEditModalProps {
  familyGroupId: string;
  weddingId: string;
  groups: any[];
  onClose: () => void;
  onSuccess: () => void;
}

interface FamilyMember extends Guest {
  isNew?: boolean;
}

type TabId = 'info' | 'members' | 'address';

export default function FamilyEditModal({ familyGroupId, weddingId, groups, onClose, onSuccess }: FamilyEditModalProps) {
  const { confirmDelete } = useConfirmDialog();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [expandedDietaryMembers, setExpandedDietaryMembers] = useState<Set<string>>(new Set());
  const [partnerNames, setPartnerNames] = useState({ partner_1: '', partner_2: '' });

  useEffect(() => {
    loadFamilyData();
    loadPartnerNames();
  }, [familyGroupId]);

  const loadPartnerNames = async () => {
    const { data } = await supabase
      .from('weddings')
      .select('partner_1_name, partner_2_name')
      .eq('id', weddingId)
      .maybeSingle();

    if (data) {
      setPartnerNames({
        partner_1: data.partner_1_name || 'Partner 1',
        partner_2: data.partner_2_name || 'Partner 2',
      });
    }
  };

  const loadFamilyData = async () => {
    try {
      const { data: family, error: familyError } = await supabase
        .from('family_groups')
        .select('*')
        .eq('id', familyGroupId)
        .single();

      if (familyError) throw familyError;
      setFamilyGroup(family);

      const { data: guestData, error: guestsError } = await supabase
        .from('guests')
        .select('*')
        .eq('family_group_id', familyGroupId);

      if (guestsError) throw guestsError;
      setMembers(guestData || []);
    } catch (error) {
      console.error('Error loading family:', error);
    }
  };

  const handleSave = async () => {
    if (!familyGroup) return;

    setLoading(true);
    try {
      const { error: familyError } = await supabase
        .from('family_groups')
        .update({
          family_name: familyGroup.family_name,
          notes: familyGroup.notes,
          partner_side: familyGroup.partner_side,
        })
        .eq('id', familyGroupId);

      if (familyError) throw familyError;

      for (const member of members) {
        if (member.isNew) {
          const { error } = await supabase.from('guests').insert({
            wedding_id: weddingId,
            family_group_id: familyGroupId,
            name: member.name,
            age_group: member.age_group,
            dietary_restrictions: member.dietary_restrictions || null,
            family_role: member.family_role || member.relationship || null,
            email: member.email || null,
            phone: member.phone || null,
            rsvp_status: member.rsvp_status || 'planned',
            group_id: member.group_id || null,
            invitation_status: 'not_sent',
            gift_received: false,
            partner_side: familyGroup.partner_side || 'both',
          });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('guests')
            .update({
              name: member.name,
              age_group: member.age_group,
              dietary_restrictions: member.dietary_restrictions || null,
              family_role: member.family_role || null,
              email: member.email || null,
              phone: member.phone || null,
              rsvp_status: member.rsvp_status,
              group_id: member.group_id || null,
            })
            .eq('id', member.id);
          if (error) throw error;
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving family:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    setMembers([
      ...members,
      {
        id: crypto.randomUUID(),
        wedding_id: weddingId,
        family_group_id: familyGroupId,
        name: '',
        age_group: 'adult',
        dietary_restrictions: '',
        relationship: '',
        email: '',
        phone: '',
        rsvp_status: 'planned',
        group_id: null,
        partner_side: familyGroup?.partner_side || 'both',
        isNew: true,
      } as FamilyMember,
    ]);
  };

  const handleRemoveMember = async (memberId: string, isNew: boolean) => {
    if (!isNew) {
      const confirmed = await confirmDelete('Möchtest du dieses Familienmitglied wirklich entfernen?');
      if (!confirmed) return;

      try {
        await supabase.from('guests').delete().eq('id', memberId);
      } catch (error) {
        console.error('Error deleting member:', error);
        return;
      }
    }
    setMembers(members.filter((m) => m.id !== memberId));
  };

  const updateMember = (id: string, field: keyof FamilyMember, value: any) => {
    setMembers(members.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const toggleDietaryMember = (id: string) => {
    setExpandedDietaryMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getPartnerSideColor = (side: string | null) => {
    if (side === 'partner_1') return 'from-pink-500 to-pink-600';
    if (side === 'partner_2') return 'from-blue-500 to-blue-600';
    return 'from-[#d4af37] to-[#f4d03f]';
  };

  const getPartnerSideLabel = (side: string | null) => {
    if (side === 'partner_1') return partnerNames.partner_1;
    if (side === 'partner_2') return partnerNames.partner_2;
    return 'Beide / Gemeinsam';
  };

  if (!familyGroup) {
    return null;
  }

  const tabs = [
    { id: 'info' as TabId, label: 'Informationen', icon: Users },
    { id: 'members' as TabId, label: `Mitglieder (${members.length})`, icon: Users },
    { id: 'address' as TabId, label: 'Adresse', icon: MapPin },
  ];

  const isFormValid = familyGroup.family_name.trim().length > 0;

  return (
    <StandardModal
      isOpen={true}
      onClose={onClose}
      title="Familie bearbeiten"
      subtitle={`${familyGroup.family_name} - ${members.length} Mitglied${members.length !== 1 ? 'er' : ''}`}
      icon={Users}
      maxWidth="4xl"
      footer={
        <ModalFooter>
          <ModalButton variant="secondary" onClick={onClose}>
            Abbrechen
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleSave}
            disabled={!isFormValid || loading}
            icon={Save}
          >
            {loading ? 'Wird gespeichert...' : 'Speichern'}
          </ModalButton>
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] shadow-gold'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-[#d4af37]/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Partner Side Selection */}
              <div>
                <label className="block text-xs font-bold text-white/90 mb-2">Von welcher Seite?</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'partner_1', icon: Heart },
                    { value: 'partner_2', icon: Heart },
                    { value: 'both', icon: Users },
                  ].map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFamilyGroup({ ...familyGroup, partner_side: value as any })}
                      className={`p-3 rounded-lg border font-bold text-xs transition-all ${
                        familyGroup.partner_side === value
                          ? `bg-gradient-to-r ${getPartnerSideColor(value)} border-transparent text-white shadow-md scale-105`
                          : 'bg-white/5 border-white/20 text-white hover:border-[#d4af37]/50 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{getPartnerSideLabel(value)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-white/90 mb-1.5">Familienname*</label>
                  <input
                    type="text"
                    value={familyGroup.family_name}
                    onChange={(e) => setFamilyGroup({ ...familyGroup, family_name: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="z.B. Familie Schmidt"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-white/90 mb-1.5">Notizen</label>
                  <textarea
                    value={familyGroup.notes || ''}
                    onChange={(e) => setFamilyGroup({ ...familyGroup, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm resize-none"
                    placeholder="Optionale Notizen zur Familie"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Familienmitglieder</h3>
                <button
                  onClick={handleAddMember}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-lg text-xs font-bold hover:shadow-gold transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Mitglied hinzufügen
                </button>
              </div>

              <div className="space-y-2.5">
                {members.map((member, index) => (
                  <div key={member.id} className="bg-white/10 border border-[#d4af37]/30 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-white text-sm">
                        {member.isNew ? 'Neues Mitglied' : member.name || `Mitglied ${index + 1}`}
                      </h4>
                      <button
                        onClick={() => handleRemoveMember(member.id, member.isNew || false)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-all hover:scale-110 active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-xs font-bold text-white/90 mb-1.5">Name*</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm"
                          placeholder="Name eingeben"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/90 mb-1.5">Altersgruppe</label>
                        <select
                          value={member.age_group}
                          onChange={(e) => updateMember(member.id, 'age_group', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white focus:border-[#d4af37] focus:outline-none backdrop-blur-sm [&>option]:bg-[#0a253c] [&>option]:text-white [&>option]:py-2"
                        >
                          <option value="adult" className="bg-[#0a253c] text-white">Erwachsene/r</option>
                          <option value="child" className="bg-[#0a253c] text-white">Kind</option>
                          <option value="infant" className="bg-[#0a253c] text-white">Kleinkind</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/90 mb-1.5">Beziehung</label>
                        <input
                          type="text"
                          value={member.family_role || member.relationship || ''}
                          onChange={(e) => updateMember(member.id, 'family_role', e.target.value)}
                          placeholder="z.B. Mutter, Vater"
                          className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/90 mb-1.5">E-Mail</label>
                        <input
                          type="email"
                          value={member.email || ''}
                          onChange={(e) => updateMember(member.id, 'email', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm"
                          placeholder="email@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/90 mb-1.5">Telefon</label>
                        <input
                          type="tel"
                          value={member.phone || ''}
                          onChange={(e) => updateMember(member.id, 'phone', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm"
                          placeholder="+49 123 456789"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/90 mb-1.5">Status</label>
                        <select
                          value={member.rsvp_status}
                          onChange={(e) => updateMember(member.id, 'rsvp_status', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white focus:border-[#d4af37] focus:outline-none backdrop-blur-sm [&>option]:bg-[#0a253c] [&>option]:text-white [&>option]:py-2"
                        >
                          <option value="planned" className="bg-[#0a253c] text-white">Geplant</option>
                          <option value="invited" className="bg-[#0a253c] text-white">Eingeladen</option>
                          <option value="accepted" className="bg-[#0a253c] text-white">Zugesagt</option>
                          <option value="declined" className="bg-[#0a253c] text-white">Abgesagt</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <button
                          type="button"
                          onClick={() => toggleDietaryMember(member.id)}
                          className="w-full flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-[#d4af37]/20"
                        >
                          <span className="text-xs font-bold text-white">Ernährungseinschränkungen</span>
                          {expandedDietaryMembers.has(member.id) ? (
                            <ChevronDown className="w-3.5 h-3.5 text-[#d4af37]" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-[#d4af37]" />
                          )}
                        </button>
                        {expandedDietaryMembers.has(member.id) && (
                          <div className="mt-2 p-3 bg-white/5 rounded-lg border border-[#d4af37]/20">
                            <DietaryRestrictionsSelector
                              value={member.dietary_restrictions || ''}
                              onChange={(value) => updateMember(member.id, 'dietary_restrictions', value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {members.length === 0 && (
                  <div className="text-center py-10 bg-white/5 rounded-lg border border-[#d4af37]/20">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                      <Users className="w-7 h-7 text-[#d4af37] opacity-50" />
                    </div>
                    <p className="text-white/70 text-sm font-semibold mb-1">Keine Familienmitglieder vorhanden</p>
                    <p className="text-xs text-white/50">Füge mindestens ein Mitglied hinzu</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">Straße & Hausnummer</label>
                <input
                  type="text"
                  value={(familyGroup as any).address || ''}
                  onChange={(e) => setFamilyGroup({ ...familyGroup, address: e.target.value } as any)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                  placeholder="Musterstraße 123"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-white/90 mb-1.5">PLZ</label>
                  <input
                    type="text"
                    value={(familyGroup as any).postal_code || ''}
                    onChange={(e) => setFamilyGroup({ ...familyGroup, postal_code: e.target.value } as any)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="12345"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/90 mb-1.5">Stadt</label>
                  <input
                    type="text"
                    value={(familyGroup as any).city || ''}
                    onChange={(e) => setFamilyGroup({ ...familyGroup, city: e.target.value } as any)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="Musterstadt"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">Land</label>
                <input
                  type="text"
                  value={(familyGroup as any).country || ''}
                  onChange={(e) => setFamilyGroup({ ...familyGroup, country: e.target.value } as any)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                  placeholder="Deutschland"
                />
              </div>

              <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs text-blue-200">
                  <span className="font-bold text-white">💡 Tipp:</span> Die Adressdaten werden für alle Familienmitglieder gemeinsam gespeichert. Perfekt für Einladungen und Danksagungen!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </StandardModal>
  );
}
