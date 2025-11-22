import React, { useState, useEffect, useCallback } from 'react';
import { Save, UserPlus, Users, MapPin, Utensils, FileText, Heart, UsersRound } from 'lucide-react';
import { supabase, type Guest } from '../lib/supabase';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';
import DietaryRestrictionsSelector from './DietaryRestrictionsSelector';
import GuestAddModalFamilyForm from './GuestAddModalFamilyForm';
import MobileTabNavigation from './common/MobileTabNavigation';
import { logger } from '../utils/logger';
import { useToast } from '../contexts/ToastContext';

interface GuestAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  weddingId: string;
  groups: any[];
  partnerNames: {
    partner_1: string;
    partner_2: string;
  };
  initialGuestType?: GuestType;
}

type GuestType = 'single' | 'family' | null;
type SingleGuestTab = 'basics' | 'relationship' | 'dietary' | 'address' | 'notes';

export default function GuestAddModal({
  isOpen,
  onClose,
  onSuccess,
  weddingId,
  groups,
  partnerNames,
  initialGuestType,
}: GuestAddModalProps) {
  const [step, setStep] = useState<'type' | 'form'>('type');
  const [guestType, setGuestType] = useState<GuestType>(null);
  const [activeTab, setActiveTab] = useState<SingleGuestTab>('basics');
  const [loading, setLoading] = useState(false);

  const [singleGuest, setSingleGuest] = useState({
    name: '',
    partner_side: 'both' as 'partner_1' | 'partner_2' | 'both',
    email: '',
    phone: '',
    age_group: 'adult' as 'adult' | 'child' | 'infant',
    relationship: '',
    group_id: '',
    table_number: '',
    rsvp_status: 'planned' as string,
    invitation_status: 'not_sent' as string,
    dietary_restrictions: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Deutschland',
    notes: '',
  });

  // CRITICAL: Use ref to track if we've initialized to prevent double-reset in React StrictMode
  const hasInitializedRef = React.useRef(false);
  const isOpenRef = React.useRef(isOpen);

  useEffect(() => {
    // Track isOpen changes
    const wasOpen = isOpenRef.current;
    isOpenRef.current = isOpen;

    if (isOpen && !wasOpen) {
      // Modal just opened
      console.log('🟢 GuestAddModal: Modal opened - isOpen changed from false to true');
      logger.info('GuestAddModal opened', 'GuestAddModal.useEffect', { isOpen, initialGuestType });
      if (!hasInitializedRef.current) {
        resetForm();

        // If initialGuestType is provided, skip type selection and go directly to form
        if (initialGuestType) {
          console.log('🎯 GuestAddModal: Setting initial guest type to:', initialGuestType);
          setGuestType(initialGuestType);
          setStep('form');
        } else {
          setStep('type');
        }

        setActiveTab('basics');
        hasInitializedRef.current = true;
      }
    } else if (!isOpen && wasOpen) {
      // Modal just closed
      console.log('🔴 GuestAddModal: Modal closed - isOpen changed from true to false');
      hasInitializedRef.current = false;
    }
  }, [isOpen, initialGuestType]);

  const resetForm = () => {
    console.log('🔄 GuestAddModal: Resetting form');
    setSingleGuest({
      name: '',
      partner_side: 'both',
      email: '',
      phone: '',
      age_group: 'adult',
      relationship: '',
      group_id: '',
      table_number: '',
      rsvp_status: 'planned',
      invitation_status: 'not_sent',
      dietary_restrictions: '',
      address: '',
      city: '',
      postal_code: '',
      country: 'Deutschland',
      notes: '',
    });
    setGuestType(null);
    console.log('🔄 GuestAddModal: Form reset complete, guestType set to null');
  };

  const handleSelectType = (type: GuestType) => {
    setGuestType(type);
    setStep('form');
  };

  const handleBackToTypeSelection = () => {
    setStep('type');
    setGuestType(null);
    setActiveTab('basics');
  };

  const { showToast } = useToast();

  const handleSubmitSingle = async () => {
    if (!singleGuest.name.trim()) {
      showToast('Bitte geben Sie einen Namen ein', 'error');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('guests').insert({
        wedding_id: weddingId,
        name: singleGuest.name,
        partner_side: singleGuest.partner_side,
        email: singleGuest.email || null,
        phone: singleGuest.phone || null,
        age_group: singleGuest.age_group,
        relationship: singleGuest.relationship || null,
        group_id: singleGuest.group_id || null,
        table_number: singleGuest.table_number ? parseInt(singleGuest.table_number) : null,
        rsvp_status: singleGuest.rsvp_status,
        invitation_status: singleGuest.invitation_status,
        dietary_restrictions: singleGuest.dietary_restrictions || null,
        address: singleGuest.address || null,
        city: singleGuest.city || null,
        postal_code: singleGuest.postal_code || null,
        country: singleGuest.country,
        notes: singleGuest.notes || null,
        is_family_head: false,
        family_group_id: null,
        family_role: null,
        gift_received: false,
      });

      if (error) throw error;

      showToast('Gast erfolgreich hinzugefügt', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating guest:', error);
      showToast('Fehler beim Erstellen des Gastes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = singleGuest.name.trim().length > 0;

  const handleClose = () => {
    console.log('🔴 GuestAddModal: handleClose called - closing modal');
    logger.info('GuestAddModal closing', 'GuestAddModal.handleClose');
    onClose();
  };

  if (guestType === 'family') {
    return (
      <GuestAddModalFamilyForm
        isOpen={isOpen}
        onClose={handleClose}
        onSuccess={onSuccess}
        onBack={handleBackToTypeSelection}
        weddingId={weddingId}
        groups={groups}
        partnerNames={partnerNames}
      />
    );
  }

  const singleGuestTabs = [
    { id: 'basics' as SingleGuestTab, label: 'Grunddaten', shortLabel: 'Basis', icon: <UserPlus className="w-3.5 h-3.5" /> },
    { id: 'relationship' as SingleGuestTab, label: 'Beziehung', shortLabel: 'Relation', icon: <Heart className="w-3.5 h-3.5" /> },
    { id: 'dietary' as SingleGuestTab, label: 'Ernährung', shortLabel: 'Diät', icon: <Utensils className="w-3.5 h-3.5" /> },
    { id: 'address' as SingleGuestTab, label: 'Adresse', shortLabel: 'Adresse', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'notes' as SingleGuestTab, label: 'Notizen', shortLabel: 'Info', icon: <FileText className="w-3.5 h-3.5" /> },
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

  console.log('🎨 GuestAddModal: Rendering with state:', { isOpen, step, guestType, activeTab });

  if (!isOpen) {
    console.log('❌ GuestAddModal: NOT RENDERING - isOpen is false');
    return null;
  }

  console.log('✅ GuestAddModal: RENDERING StandardModal now');

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'type' ? 'Gast hinzufügen' : 'Einzelperson hinzufügen'}
      subtitle={step === 'type' ? 'Wähle den Typ aus' : 'Erfasse die Informationen für den neuen Gast'}
      icon={UserPlus}
      maxWidth="4xl"
      footer={
        step === 'form' && guestType === 'single' ? (
          <ModalFooter>
            <ModalButton variant="secondary" onClick={handleBackToTypeSelection}>
              Zurück
            </ModalButton>
            <ModalButton
              variant="primary"
              onClick={handleSubmitSingle}
              disabled={!isFormValid || loading}
              icon={Save}
            >
              {loading ? 'Wird gespeichert...' : 'Gast hinzufügen'}
            </ModalButton>
          </ModalFooter>
        ) : undefined
      }
    >
      {step === 'type' && (
        <div className="grid md:grid-cols-2 gap-3">
          <button
            onClick={() => handleSelectType('single')}
            className="group relative bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 border border-[#d4af37]/30 hover:border-[#d4af37] transition-all hover:shadow-lg hover:scale-105"
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] flex items-center justify-center group-hover:scale-110 transition-transform shadow-gold">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Einzelperson</h4>
                <p className="text-xs text-white/70">
                  Eine einzelne Person hinzufügen
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleSelectType('family')}
            className="group relative bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 border border-[#d4af37]/30 hover:border-[#d4af37] transition-all hover:shadow-lg hover:scale-105"
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] flex items-center justify-center group-hover:scale-110 transition-transform shadow-gold">
                <UsersRound className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Familie</h4>
                <p className="text-xs text-white/70">
                  Mehrere Personen als Familie hinzufügen
                </p>
              </div>
            </div>
          </button>
        </div>
      )}

      {step === 'form' && guestType === 'single' && (
        <div className="space-y-4">
          {/* Tab Navigation - Mobile Optimiert */}
          <MobileTabNavigation
            tabs={singleGuestTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="pills"
          />

          {/* Tab Content */}
          <div className="min-h-[280px]" role="tabpanel" id={`tabpanel-${activeTab}`}>
            {activeTab === 'basics' && (
              <div className="space-y-3">
                {/* Partner Side Selection */}
                <div>
                  <label className="block text-xs font-semibold text-white/90 mb-2">Von welcher Seite?*</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'partner_1', icon: Heart },
                      { value: 'partner_2', icon: Heart },
                      { value: 'both', icon: Users },
                    ].map(({ value, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSingleGuest({ ...singleGuest, partner_side: value as any })}
                        className={`p-2 rounded-lg border font-semibold transition-all ${
                          singleGuest.partner_side === value
                            ? `bg-gradient-to-r ${getPartnerSideColor(value)} border-transparent text-white shadow-lg scale-105`
                            : 'bg-white/5 border-white/20 text-white hover:border-[#d4af37]/50 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Icon className="w-4 h-4" />
                          <span className="text-xs">{getPartnerSideLabel(value)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-white/90 mb-1">Name*</label>
                    <input
                      type="text"
                      value={singleGuest.name}
                      onChange={(e) => setSingleGuest({ ...singleGuest, name: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                      placeholder="z.B. Maria Schmidt"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/90 mb-1">E-Mail</label>
                    <input
                      type="email"
                      value={singleGuest.email}
                      onChange={(e) => setSingleGuest({ ...singleGuest, email: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                      placeholder="maria@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/90 mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={singleGuest.phone}
                      onChange={(e) => setSingleGuest({ ...singleGuest, phone: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                      placeholder="+49 123 456789"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/90 mb-1">Altersgruppe</label>
                    <select
                      value={singleGuest.age_group}
                      onChange={(e) => setSingleGuest({ ...singleGuest, age_group: e.target.value as any })}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px] [&>option]:bg-[#0a253c] [&>option]:text-white [&>option]:py-2"
                    >
                      <option value="adult" className="bg-[#0a253c] text-white">Erwachsener</option>
                      <option value="child" className="bg-[#0a253c] text-white">Kind</option>
                      <option value="infant" className="bg-[#0a253c] text-white">Kleinkind</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'relationship' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-white/90 mb-1">Beziehung zum Brautpaar</label>
                  <input
                    type="text"
                    value={singleGuest.relationship}
                    onChange={(e) => setSingleGuest({ ...singleGuest, relationship: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="z.B. Freund, Arbeitskollege, Verwandter"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/90 mb-1">Gruppe (optional)</label>
                  <select
                    value={singleGuest.group_id}
                    onChange={(e) => setSingleGuest({ ...singleGuest, group_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white focus:border-[#d4af37] focus:outline-none backdrop-blur-sm [&>option]:bg-[#0a253c] [&>option]:text-white [&>option]:py-2"
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
                  <label className="block text-xs font-semibold text-white/90 mb-1">Tischnummer (optional)</label>
                  <input
                    type="number"
                    value={singleGuest.table_number}
                    onChange={(e) => setSingleGuest({ ...singleGuest, table_number: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="z.B. 5"
                  />
                </div>
              </div>
            )}

            {activeTab === 'dietary' && (
              <div>
                <DietaryRestrictionsSelector
                  value={singleGuest.dietary_restrictions}
                  onChange={(value) => setSingleGuest({ ...singleGuest, dietary_restrictions: value })}
                />
              </div>
            )}

            {activeTab === 'address' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-white/90 mb-1">Straße & Hausnummer</label>
                  <input
                    type="text"
                    value={singleGuest.address}
                    onChange={(e) => setSingleGuest({ ...singleGuest, address: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="Musterstraße 123"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-white/90 mb-1">PLZ</label>
                    <input
                      type="text"
                      value={singleGuest.postal_code}
                      onChange={(e) => setSingleGuest({ ...singleGuest, postal_code: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                      placeholder="12345"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/90 mb-1">Stadt</label>
                    <input
                      type="text"
                      value={singleGuest.city}
                      onChange={(e) => setSingleGuest({ ...singleGuest, city: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                      placeholder="Musterstadt"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/90 mb-1">Land</label>
                  <input
                    type="text"
                    value={singleGuest.country}
                    onChange={(e) => setSingleGuest({ ...singleGuest, country: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    placeholder="Deutschland"
                  />
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-white/90 mb-1">Interne Notizen</label>
                  <textarea
                    value={singleGuest.notes}
                    onChange={(e) => setSingleGuest({ ...singleGuest, notes: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm min-h-[44px]"
                    rows={6}
                    placeholder="Besondere Anforderungen, Hinweise, etc..."
                  />
                </div>

                <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-2 backdrop-blur-sm">
                  <p className="text-xs text-blue-200">
                    <span className="font-bold text-white">Tipp:</span> Nutze die Notizen für besondere Anforderungen wie Mobilitätseinschränkungen oder andere Details.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </StandardModal>
  );
}
