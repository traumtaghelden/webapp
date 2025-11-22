import { useState, useEffect } from 'react';
import { Users, Mail, Phone, MapPin, Edit2, Trash2, User, Heart, Cake, Utensils } from 'lucide-react';
import { supabase, type FamilyGroup, type Guest } from '../lib/supabase';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';

interface FamilyDetailModalProps {
  familyGroupId: string;
  weddingId: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function FamilyDetailModal({
  familyGroupId,
  weddingId,
  onClose,
  onEdit,
  onDelete,
}: FamilyDetailModalProps) {
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
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
        .eq('family_group_id', familyGroupId)
        .order('age_group', { ascending: false });

      if (guestsError) throw guestsError;
      setMembers(guestData || []);
    } catch (error) {
      console.error('Error loading family:', error);
    } finally {
      setLoading(false);
    }
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

  const getRSVPStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'declined':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'invited':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'planned':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
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

  if (loading || !familyGroup) {
    return null;
  }

  const adults = members.filter((m) => m.age_group === 'adult').length;
  const children = members.filter((m) => m.age_group === 'child').length;
  const infants = members.filter((m) => m.age_group === 'infant').length;
  const accepted = members.filter((m) => m.rsvp_status === 'accepted').length;

  return (
    <StandardModal
      isOpen={true}
      onClose={onClose}
      title={familyGroup.family_name}
      subtitle={`${members.length} Mitglied${members.length !== 1 ? 'er' : ''}`}
      icon={Users}
      maxWidth="4xl"
      footer={
        <ModalFooter>
          <ModalButton variant="danger" onClick={onDelete} icon={Trash2}>
            Löschen
          </ModalButton>
          <ModalButton variant="secondary" onClick={onClose}>
            Schließen
          </ModalButton>
          <ModalButton variant="primary" onClick={onEdit} icon={Edit2}>
            Bearbeiten
          </ModalButton>
        </ModalFooter>
      }
    >
      <div className="space-y-4">
        {/* Family Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-white/10 rounded-lg p-3 border border-[#d4af37]/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <User className="w-4 h-4 text-[#d4af37]" />
              <span className="text-xs text-white/70 font-semibold">Erwachsene</span>
            </div>
            <p className="text-xl font-bold text-white">{adults}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 border border-[#d4af37]/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Cake className="w-4 h-4 text-[#d4af37]" />
              <span className="text-xs text-white/70 font-semibold">Kinder</span>
            </div>
            <p className="text-xl font-bold text-white">{children + infants}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 border border-[#d4af37]/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Heart className="w-4 h-4 text-green-400" />
              <span className="text-xs text-white/70 font-semibold">Zugesagt</span>
            </div>
            <p className="text-xl font-bold text-white">{accepted}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 border border-[#d4af37]/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Users className="w-4 h-4 text-[#d4af37]" />
              <span className="text-xs text-white/70 font-semibold">Gesamt</span>
            </div>
            <p className="text-xl font-bold text-white">{members.length}</p>
          </div>
        </div>

        {/* Partner Side Badge */}
        {familyGroup.partner_side && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70 font-semibold">Seite:</span>
            <div
              className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${getPartnerSideColor(
                familyGroup.partner_side
              )} text-white font-bold text-xs shadow-md`}
            >
              {getPartnerSideLabel(familyGroup.partner_side)}
            </div>
          </div>
        )}

        {/* Notes */}
        {familyGroup.notes && (
          <div className="bg-white/10 rounded-lg p-3 border border-[#d4af37]/30">
            <h3 className="text-sm font-bold text-white mb-2">Notizen</h3>
            <p className="text-white/80 whitespace-pre-wrap text-xs">{familyGroup.notes}</p>
          </div>
        )}

        {/* Address */}
        {((familyGroup as any).address || (familyGroup as any).city) && (
          <div className="bg-white/10 rounded-lg p-3 border border-[#d4af37]/30">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="w-4 h-4 text-[#d4af37]" />
              <h3 className="text-sm font-bold text-white">Adresse</h3>
            </div>
            <div className="space-y-0.5 text-white/80 text-xs">
              {(familyGroup as any).address && <p>{(familyGroup as any).address}</p>}
              {((familyGroup as any).postal_code || (familyGroup as any).city) && (
                <p>
                  {(familyGroup as any).postal_code} {(familyGroup as any).city}
                </p>
              )}
              {(familyGroup as any).country && <p>{(familyGroup as any).country}</p>}
            </div>
          </div>
        )}

        {/* Family Members List */}
        <div>
          <h3 className="text-sm font-bold text-white mb-3">Familienmitglieder</h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-white/10 rounded-lg p-3 border border-[#d4af37]/30 hover:border-[#d4af37] transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] flex items-center justify-center shadow-sm">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{member.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-white/60 font-semibold">
                          <span>{getAgeGroupLabel(member.age_group)}</span>
                          {member.family_role && (
                            <>
                              <span>•</span>
                              <span>{member.family_role}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-3 text-xs text-white/70">
                      {member.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span className="font-medium">{member.email}</span>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span className="font-medium">{member.phone}</span>
                        </div>
                      )}
                      {member.dietary_restrictions && (
                        <div className="flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span className="font-medium">{member.dietary_restrictions}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RSVP Status Badge */}
                  <div
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs border ${getRSVPStatusColor(
                      member.rsvp_status
                    )} shadow-sm`}
                  >
                    {getRSVPStatusLabel(member.rsvp_status)}
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
                <p className="text-xs text-white/50">Diese Familie hat noch keine Mitglieder</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </StandardModal>
  );
}
