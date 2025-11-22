import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, UsersRound, CheckCircle, Utensils, Mail, User, UserCheck, UserX, Clock, UserCircle, UserPlus } from 'lucide-react';
import { supabase, type Guest, type FamilyGroup } from '../lib/supabase';
import TabContainer, { type Tab } from './common/TabContainer';
import PageHeaderWithStats, { type StatCard } from './common/PageHeaderWithStats';
import GuestOverviewTab from './Guests/GuestOverviewTab';
import GuestFamiliesTab from './Guests/GuestFamiliesTab';
import GuestGroupsTab from './Guests/GuestGroupsTab';
import GuestRSVPTab from './Guests/GuestRSVPTab';
import GuestDietaryTab from './Guests/GuestDietaryTab';
import GuestContactsTab from './Guests/GuestContactsTab';
import GuestAddModal from './GuestAddModal';
import FAB from './common/FAB';
import { GUEST } from '../constants/terminology';
import { useToast } from '../contexts/ToastContext';

interface GuestManagerProps {
  weddingId: string;
  guests: Guest[];
  onUpdate: () => void;
}

export default function GuestManager({ weddingId, guests, onUpdate }: GuestManagerProps) {
  const { showToast } = useToast();
  // CRITICAL: Use ref to track modal state independently of render cycles
  // This prevents tab re-renders from closing the modal
  const modalStateRef = React.useRef(false);
  const [showAddGuestForm, setShowAddGuestForm] = useState(false);
  const [initialGuestType, setInitialGuestType] = useState<'single' | 'family' | null>(null);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [guestGroups, setGuestGroups] = useState<any[]>([]);
  const [partnerNames, setPartnerNames] = useState({ partner_1: '', partner_2: '' });
  const [weddingDate, setWeddingDate] = useState<string | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track if we're in the middle of opening the modal to prevent race conditions
  const isOpeningModalRef = React.useRef(false);

  const loadFamilyGroups = useCallback(async () => {
    const { data } = await supabase
      .from('family_groups')
      .select('*')
      .eq('wedding_id', weddingId);

    if (data) {
      setFamilyGroups(data);
    }
  }, [weddingId]);

  const loadGuestGroups = useCallback(async () => {
    const { data } = await supabase
      .from('guest_groups')
      .select('*')
      .eq('wedding_id', weddingId);

    if (data) {
      setGuestGroups(data);
    }
  }, [weddingId]);

  const loadPartnerNames = useCallback(async () => {
    const { data } = await supabase
      .from('weddings')
      .select('partner_1_name, partner_2_name, wedding_date')
      .eq('id', weddingId)
      .maybeSingle();

    if (data) {
      setPartnerNames({
        partner_1: data.partner_1_name || 'Partner 1',
        partner_2: data.partner_2_name || 'Partner 2',
      });
      setWeddingDate(data.wedding_date);
    }
  }, [weddingId]);

  const handleOpenGuestModal = useCallback((guestType: 'single' | 'family' | null = null) => {
    // Prevent multiple rapid calls
    if (isOpeningModalRef.current || modalStateRef.current) {
      console.log('⚠️ GuestManager: Already opening/opened modal, ignoring duplicate call');
      return;
    }

    isOpeningModalRef.current = true;
    modalStateRef.current = true;
    console.log('🟢 GuestManager: Opening guest modal NOW with type:', guestType);

    setInitialGuestType(guestType);
    setShowAddGuestForm(true);

    // Reset the flag after a delay
    setTimeout(() => {
      isOpeningModalRef.current = false;
    }, 1000);
  }, []);

  const handleCloseGuestModal = useCallback(() => {
    console.log('🔴 GuestManager: Closing guest modal');
    modalStateRef.current = false;
    isOpeningModalRef.current = false;
    setShowAddGuestForm(false);
    setInitialGuestType(null);
  }, []);

  useEffect(() => {
    console.log('🔄 GuestManager: weddingId changed, loading data. showAddGuestForm:', showAddGuestForm);
    loadFamilyGroups();
    loadGuestGroups();
    loadPartnerNames();
    checkForHeroJourneyTemplate();
  }, [weddingId, loadFamilyGroups, loadGuestGroups, loadPartnerNames]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onUpdate();
      await loadFamilyGroups();
      await loadGuestGroups();
      await loadPartnerNames();
      showToast('Gästeliste aktualisiert', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
      showToast('Fehler beim Aktualisieren', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };


  const checkForHeroJourneyTemplate = () => {
    const templateData = sessionStorage.getItem('hero_journey_template_guest_count');
    if (templateData) {
      try {
        const template = JSON.parse(templateData);
        sessionStorage.removeItem('hero_journey_template_guest_count');

        const totalFromTemplate = template.sample_data?.total || 0;
        showToast(
          `Vorlage "${template.template_name}" geladen! Empfohlene Gästezahl: ${totalFromTemplate} Personen`,
          'success'
        );

        // Show breakdown if available
        if (template.sample_data?.breakdown) {
          const breakdown = Object.entries(template.sample_data.breakdown)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          console.log('Gäste-Aufschlüsselung:', breakdown);
        }
      } catch (error) {
        console.error('Error parsing template:', error);
      }
    }
  };

  useEffect(() => {
    console.log('📊 GuestManager: showAddGuestForm state changed to:', showAddGuestForm);
  }, [showAddGuestForm]);

  const totalGuests = guests.length;
  const acceptedGuests = guests.filter(g => g.rsvp_status === 'accepted').length;
  const pendingGuests = guests.filter(g => g.rsvp_status === 'invited' || g.rsvp_status === 'planned').length;
  const declinedGuests = guests.filter(g => g.rsvp_status === 'declined').length;
  const acceptanceRate = totalGuests > 0 ? Math.round((acceptedGuests / totalGuests) * 100) : 0;

  const stats: StatCard[] = [
    {
      icon: <User className="w-5 h-5 text-white" />,
      label: `Gesamt`,
      value: totalGuests,
      subtitle: `${acceptanceRate}% zugesagt`,
      color: 'yellow'
    },
    {
      icon: <UserCheck className="w-5 h-5 text-white" />,
      label: 'Zugesagt',
      value: acceptedGuests,
      subtitle: totalGuests > 0 ? `${acceptanceRate}%` : '0%',
      color: 'green'
    },
    {
      icon: <Clock className="w-5 h-5 text-white" />,
      label: 'Ausstehend',
      value: pendingGuests,
      subtitle: totalGuests > 0 ? `${Math.round((pendingGuests/totalGuests)*100)}%` : '0%',
      color: 'blue'
    },
    {
      icon: <UserX className="w-5 h-5 text-white" />,
      label: 'Abgesagt',
      value: declinedGuests,
      subtitle: declinedGuests > 0 ? 'Absagen' : 'Keine',
      color: 'red'
    }
  ];

  // CRITICAL: Memoize tabs to prevent re-creation on every render
  // This prevents the modal from being unmounted when badges update
  const tabs: Tab[] = useMemo(() => [
    {
      id: 'overview',
      label: 'Übersicht',
      icon: <Users className="w-4 h-4" />,
      badge: guests.length,
      content: (
        <GuestOverviewTab
          guests={guests}
          onUpdate={onUpdate}
          onAddGuest={handleOpenGuestModal}
        />
      ),
    },
    {
      id: 'families',
      label: 'Familien',
      icon: <UsersRound className="w-4 h-4" />,
      content: <GuestFamiliesTab weddingId={weddingId} onUpdate={() => { onUpdate(); loadFamilyGroups(); }} onAddFamily={() => handleOpenGuestModal('family')} />,
    },
    {
      id: 'groups',
      label: 'Gruppen',
      icon: <UserCircle className="w-4 h-4" />,
      badge: guestGroups.length || undefined,
      content: <GuestGroupsTab weddingId={weddingId} onUpdate={() => { onUpdate(); loadGuestGroups(); }} />,
    },
    {
      id: 'rsvp',
      label: 'RSVP',
      icon: <CheckCircle className="w-4 h-4" />,
      badge: guests.filter(g => g.rsvp_status === 'accepted').length,
      content: <GuestRSVPTab guests={guests} onUpdate={onUpdate} />,
    },
    {
      id: 'dietary',
      label: 'Ernährung',
      icon: <Utensils className="w-4 h-4" />,
      badge: guests.filter(g => g.dietary_restrictions && g.dietary_restrictions.length > 0).length || undefined,
      content: <GuestDietaryTab guests={guests} weddingDate={weddingDate} />,
    },
    {
      id: 'contacts',
      label: 'Kontakte',
      icon: <Mail className="w-4 h-4" />,
      content: <GuestContactsTab guests={guests} familyGroups={familyGroups} guestGroups={guestGroups} weddingDate={weddingDate} />,
    },
  ], [guests, weddingId, onUpdate, loadFamilyGroups, loadGuestGroups, handleOpenGuestModal, weddingDate, familyGroups, guestGroups]);

  return (
    <div className="space-y-6 relative min-h-screen">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="bg-floating-orb" style={{ top: '10%', left: '5%' }} />
        <div className="bg-floating-orb" style={{ top: '60%', right: '10%', animationDelay: '4s' }} />
        <div className="bg-floating-orb" style={{ bottom: '20%', left: '15%', animationDelay: '8s' }} />

        <div className="bg-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="bg-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                '--tx': `${(Math.random() - 0.5) * 100}px`,
                '--ty': `${-Math.random() * 150}px`
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10">

      <PageHeaderWithStats
        title={GUEST.MODULE_NAME}
        stats={stats}
      />

      <TabContainer
        tabs={tabs}
        defaultTab="overview"
        storageKey={`guest-tab-${weddingId}`}
        urlParam="guestTab"
      />

      {showAddGuestForm && (
        <GuestAddModal
          isOpen={showAddGuestForm}
          weddingId={weddingId}
          groups={guestGroups}
          partnerNames={partnerNames}
          initialGuestType={initialGuestType}
          onClose={handleCloseGuestModal}
          onSuccess={() => {
            console.log('✅ GuestManager: Guest created successfully');
            handleCloseGuestModal();
            onUpdate();
            loadGuestGroups();
          }}
        />
      )}

      <FAB
        onClick={() => handleOpenGuestModal(null)}
        icon={UserPlus}
        label="Gast hinzufügen"
        position="bottom-right"
        variant="primary"
        showOnMobile={true}
        showOnDesktop={false}
      />
      </div>
    </div>
  );
}
