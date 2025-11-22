import { useState, useEffect, useRef } from 'react';
import { Save, UsersRound, MapPin, Users, FileText, Plus, Trash2, ChevronDown, ChevronRight, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';
import DietaryRestrictionsSelector from './DietaryRestrictionsSelector';
import { logger } from '../utils/logger';

interface FamilyMember {
  id: string;
  name: string;
  age_group: 'adult' | 'child' | 'infant';
  dietary_restrictions: string;
  relationship: string;
  email: string;
  phone: string;
}

interface GuestAddModalFamilyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onBack: () => void;
  weddingId: string;
  groups: any[];
  partnerNames: {
    partner_1: string;
    partner_2: string;
  };
}

type FamilyTab = 'basics' | 'address' | 'members' | 'notes';

export default function GuestAddModalFamilyForm({
  isOpen,
  onClose,
  onSuccess,
  onBack,
  weddingId,
  groups,
  partnerNames,
}: GuestAddModalFamilyFormProps) {
  const [activeTab, setActiveTab] = useState<FamilyTab>('basics');
  const [loading, setLoading] = useState(false);
  const [expandedDietaryMembers, setExpandedDietaryMembers] = useState<Set<string>>(new Set());
  const justOpenedRef = useRef(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [familyData, setFamilyData] = useState({
    family_name: '',
    partner_side: 'both' as 'partner_1' | 'partner_2' | 'both',
    group_id: '',
    table_number: '',
    notes: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Deutschland',
  });

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      id: crypto.randomUUID(),
      name: '',
      age_group: 'adult',
      dietary_restrictions: '',
      relationship: 'Elternteil',
      email: '',
      phone: '',
    },
  ]);

  const addFamilyMember = () => {
    setFamilyMembers([
      ...familyMembers,
      {
        id: crypto.randomUUID(),
        name: '',
        age_group: 'adult',
        dietary_restrictions: '',
        relationship: '',
        email: '',
        phone: '',
      },
    ]);
  };

  const removeFamilyMember = (id: string) => {
    if (familyMembers.length > 1) {
      setFamilyMembers(familyMembers.filter((m) => m.id !== id));
      // Also remove from expanded dietary members
      setExpandedDietaryMembers(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const updateFamilyMember = (id: string, field: string, value: any) => {
    setFamilyMembers(
      familyMembers.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  useEffect(() => {
    if (isOpen) {
      console.log('🟢 GuestAddModalFamilyForm: Modal opened');
      logger.info('GuestAddModalFamilyForm opened', 'GuestAddModalFamilyForm.useEffect');
      justOpenedRef.current = true;

      // Clear any existing timeout
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }

      // Set click guard for 500ms to prevent immediate closure (increased from 200ms)
      closeTimeoutRef.current = setTimeout(() => {
        justOpenedRef.current = false;
        console.log('🟡 GuestAddModalFamilyForm: Click guard released after 500ms');
        logger.info('GuestAddModalFamilyForm click guard released', 'GuestAddModalFamilyForm.useEffect');
      }, 500);
    } else {
      console.log('🔴 GuestAddModalFamilyForm: Modal closed');
      // Clear timeout when modal closes
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      justOpenedRef.current = false;
    }

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [isOpen]);

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

  const handleSubmitFamily = async () => {
    if (!familyData.family_name.trim()) {
      alert('Bitte geben Sie einen Familiennamen ein');
      return;
    }

    if (familyMembers.length === 0 || !familyMembers[0].name.trim()) {
      alert('Bitte fügen Sie mindestens eine Person hinzu');
      return;
    }

    setLoading(true);

    try {
      const { data: familyGroup, error: familyError } = await supabase
        .from('family_groups')
        .insert({
          wedding_id: weddingId,
          family_name: familyData.family_name,
          partner_side: familyData.partner_side,
          notes: familyData.notes || null,
        })
        .select()
        .single();

      if (familyError) throw familyError;

      const guestsToInsert = familyMembers
        .filter((member) => member.name.trim())
        .map((member, index) => ({
          wedding_id: weddingId,
          name: member.name,
          partner_side: familyData.partner_side,
          email: member.email || null,
          phone: member.phone || null,
          age_group: member.age_group,
          dietary_restrictions: member.dietary_restrictions || null,
          relationship: member.relationship || null,
          family_group_id: familyGroup.id,
          is_family_head: index === 0,
          family_role: member.relationship || (index === 0 ? 'Hauptperson' : null),
          group_id: familyData.group_id || null,
          address: familyData.address || null,
          city: familyData.city || null,
          postal_code: familyData.postal_code || null,
          country: familyData.country,
          table_number: familyData.table_number ? parseInt(familyData.table_number) : null,
          rsvp_status: 'planned',
          invitation_status: 'not_sent',
          gift_received: false,
        }));

      const { error: guestsError } = await supabase.from('guests').insert(guestsToInsert);

      if (guestsError) throw guestsError;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating family:', error);
      alert('Fehler beim Erstellen der Familie');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = familyData.family_name.trim().length > 0 && familyMembers[0]?.name.trim().length > 0;

  const handleClose = () => {
    // Prevent closing if modal just opened (click guard)
    if (justOpenedRef.current) {
      logger.warn('GuestAddModalFamilyForm close blocked - modal just opened', 'GuestAddModalFamilyForm.handleClose');
      return;
    }

    logger.info('GuestAddModalFamilyForm closing', 'GuestAddModalFamilyForm.handleClose');
    onClose();
  };

  const familyTabs = [
    { id: 'basics' as FamilyTab, label: 'Familiendaten', icon: UsersRound },
    { id: 'address' as FamilyTab, label: 'Adresse', icon: MapPin },
    { id: 'members' as FamilyTab, label: 'Mitglieder', icon: Users },
    { id: 'notes' as FamilyTab, label: 'Notizen', icon: FileText },
  ];

  const getPartnerSideColor = (side: string) => {
    if (side === 'partner_1') return 'from-pink-500 to-pink-600';
    if (side === 'partner_2') return 'from-blue-500 to-blue-600';
    return 'from-[#d4af37] to-[#f4d03f]';
  };

  const getPartnerSideLabel = (side: string) => {
    if (side === 'partner_1') return partnerNames.partner_1 || 'Partner 1';
    if (side === 'partner_2') return partnerNames.partner_2 || 'Partner 2';
    return 'Beide / Gemeinsam';
  };

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Familie hinzufügen"
      subtitle="Erfasse mehrere Personen als Familie"
      icon={UsersRound}
      maxWidth="4xl"
      footer={
        <ModalFooter>
          <ModalButton variant="secondary" onClick={onBack}>
            Zurück
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleSubmitFamily}
            disabled={!isFormValid || loading}
            icon={Save}
          >
            {loading ? 'Wird gespeichert...' : 'Familie hinzufügen'}
          </ModalButton>
        </ModalFooter>
      }
    >
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {familyTabs.map((tab) => (
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
              {tab.id === 'members' && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold">
                  {familyMembers.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === 'basics' && (
            <div className="space-y-4">
              {/* Partner Side Selection */}
              <div>
                <label className="block text-xs font-bold text-white/90 mb-2">Von welcher Seite?*</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'partner_1', icon: Heart },
                    { value: 'partner_2', icon: Heart },
                    { value: 'both', icon: Users },
                  ].map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFamilyData({ ...familyData, partner_side: value as any })}
                      className={`p-3 rounded-lg border font-bold text-xs transition-all ${
                        familyData.partner_side === value
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

              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">Familienname*</label>
                <input
                  type="text"
                  value={familyData.family_name}
                  onChange={(e) => setFamilyData({ ...familyData, family_name: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                  placeholder="z.B. Familie Schmidt"
                  autoFocus
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/90 mb-1.5">Gruppe (optional)</label>
                  <select
                    value={familyData.group_id}
                    onChange={(e) => setFamilyData({ ...familyData, group_id: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                  >
                    <option value="" className="bg-[#0a253c] text-white">Keine Gruppe</option>
                    {(groups || []).map((group) => (
                      <option key={group.id} value={group.id} className="bg-[#0a253c] text-white">
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/90 mb-1.5">Tischnummer (optional)</label>
                  <input
                    type="number"
                    value={familyData.table_number}
                    onChange={(e) => setFamilyData({ ...familyData, table_number: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="z.B. 5"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">Straße & Hausnummer</label>
                <input
                  type="text"
                  value={familyData.address}
                  onChange={(e) => setFamilyData({ ...familyData, address: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                  placeholder="Musterstraße 123"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-white/90 mb-1.5">PLZ</label>
                  <input
                    type="text"
                    value={familyData.postal_code}
                    onChange={(e) => setFamilyData({ ...familyData, postal_code: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="12345"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/90 mb-1.5">Stadt</label>
                  <input
                    type="text"
                    value={familyData.city}
                    onChange={(e) => setFamilyData({ ...familyData, city: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="Musterstadt"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">Land</label>
                <input
                  type="text"
                  value={familyData.country}
                  onChange={(e) => setFamilyData({ ...familyData, country: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                  placeholder="Deutschland"
                />
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/70 font-semibold">
                  {familyMembers.length} {familyMembers.length === 1 ? 'Person' : 'Personen'}
                </p>
                <button
                  onClick={addFamilyMember}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-lg text-xs font-bold hover:shadow-gold-lg transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Person hinzufügen
                </button>
              </div>

              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {familyMembers.map((member, index) => (
                  <div key={member.id} className="bg-white/10 rounded-lg p-3 border border-[#d4af37]/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        {index === 0 && (
                          <span className="px-2.5 py-1 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-full text-[10px] font-bold">
                            Hauptperson
                          </span>
                        )}
                        {index > 0 && (
                          <span className="text-xs font-bold text-white/70">
                            Person {index + 1}
                          </span>
                        )}
                      </div>
                      {index > 0 && (
                        <button
                          onClick={() => removeFamilyMember(member.id)}
                          className="p-1.5 hover:bg-red-500/20 rounded-lg transition-all hover:scale-110 active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-white/70 mb-1">Name*</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateFamilyMember(member.id, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/40 focus:border-[#d4af37] focus:outline-none text-sm"
                          placeholder="z.B. Maria Schmidt"
                        />
                      </div>

                      {index === 0 && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-white/70 mb-1">E-Mail</label>
                            <input
                              type="email"
                              value={member.email}
                              onChange={(e) => updateFamilyMember(member.id, 'email', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/40 focus:border-[#d4af37] focus:outline-none text-sm"
                              placeholder="maria@example.com"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-white/70 mb-1">Telefon</label>
                            <input
                              type="tel"
                              value={member.phone}
                              onChange={(e) => updateFamilyMember(member.id, 'phone', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/40 focus:border-[#d4af37] focus:outline-none text-sm"
                              placeholder="+49 123 456789"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-white/70 mb-1">Altersgruppe</label>
                        <select
                          value={member.age_group}
                          onChange={(e) => updateFamilyMember(member.id, 'age_group', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white focus:border-[#d4af37] focus:outline-none text-sm"
                        >
                          <option value="adult" className="bg-[#0a253c] text-white">Erwachsener</option>
                          <option value="child" className="bg-[#0a253c] text-white">Kind</option>
                          <option value="infant" className="bg-[#0a253c] text-white">Kleinkind</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/70 mb-1">Rolle in Familie</label>
                        <input
                          type="text"
                          value={member.relationship}
                          onChange={(e) => updateFamilyMember(member.id, 'relationship', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/40 focus:border-[#d4af37] focus:outline-none text-sm"
                          placeholder="z.B. Elternteil, Kind"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={() => toggleDietaryMember(member.id)}
                          className="w-full flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-[#d4af37]/20"
                        >
                          <span className="text-xs font-bold text-white">Diätwünsche / Allergien</span>
                          {expandedDietaryMembers.has(member.id) ? (
                            <ChevronDown className="w-3.5 h-3.5 text-[#d4af37]" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-[#d4af37]" />
                          )}
                        </button>
                        {expandedDietaryMembers.has(member.id) && (
                          <div className="mt-2 p-3 bg-white/5 rounded-lg border border-[#d4af37]/20">
                            <DietaryRestrictionsSelector
                              value={member.dietary_restrictions}
                              onChange={(value) => updateFamilyMember(member.id, 'dietary_restrictions', value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">Familiennotizen</label>
                <textarea
                  value={familyData.notes}
                  onChange={(e) => setFamilyData({ ...familyData, notes: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                  rows={6}
                  placeholder="Gemeinsame Notizen zur Familie..."
                />
              </div>

              <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs text-blue-200">
                  <span className="font-bold text-white">💡 Tipp:</span> Nutze die Familiennotizen für gemeinsame Informationen wie Anreise, Hotel-Buchung oder besondere Wünsche der gesamten Familie.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </StandardModal>
  );
}
