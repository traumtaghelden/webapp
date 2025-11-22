import { useState, useEffect } from 'react';
import { MapPin, DollarSign, Building2, FileCheck, Star, Users, Plus, Sparkles, Grid3x3 } from 'lucide-react';
import { supabase, type Location } from '../lib/supabase';
import TabContainer, { type Tab } from './common/TabContainer';
import PageHeaderWithStats, { type StatCard } from './common/PageHeaderWithStats';
import LocationAllTab from './Location/LocationAllTab';
import LocationCategoryOverview from './Location/LocationCategoryOverview';
import LocationCostsTab from './Location/LocationCostsTab';
import LocationAddModal from './LocationAddModal';
import LocationDetailModal from './LocationDetailModal';
import FAB from './common/FAB';
import { LOCATION } from '../constants/terminology';
import { useToast } from '../contexts/ToastContext';

interface LocationManagerProps {
  weddingId: string;
}

export default function LocationManager({ weddingId }: LocationManagerProps) {
  const { showToast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    loadLocations();
  }, [weddingId]);

  const loadLocations = async () => {
    try {
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: false });

      if (data) setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadLocations();
      showToast('Locations aktualisiert', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
      showToast('Fehler beim Aktualisieren', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalLocations = locations.length;
  const bookedLocations = locations.filter(l => l.booking_status === 'booked').length;
  const favorites = locations.filter(l => l.is_favorite).length;
  const poolLocations = locations.filter(l => l.booking_status !== 'booked').length;
  const bookingRate = totalLocations > 0 ? Math.round((bookedLocations / totalLocations) * 100) : 0;

  const stats: StatCard[] = [
    {
      icon: <Building2 className="w-6 h-6 text-white" />,
      label: `Gesamt ${LOCATION.PLURAL}`,
      value: totalLocations,
      subtitle: `${bookingRate}% gebucht`,
      color: 'yellow'
    },
    {
      icon: <FileCheck className="w-6 h-6 text-white" />,
      label: 'Gebucht',
      value: bookedLocations,
      subtitle: totalLocations > 0 ? `${bookingRate}% der ${LOCATION.PLURAL}` : 'Noch keine',
      color: 'green'
    },
    {
      icon: <Star className="w-6 h-6 text-white" />,
      label: 'Favoriten',
      value: favorites,
      subtitle: favorites > 0 ? 'Markiert' : 'Keine markiert',
      color: 'orange'
    },
    {
      icon: <Users className="w-6 h-6 text-white" />,
      label: 'Im Pool',
      value: poolLocations,
      subtitle: poolLocations > 0 ? 'Verfügbar' : 'Keine verfügbar',
      color: 'blue'
    }
  ];

  const handleCategoryClick = (categoryId: string) => {
    setCategoryFilter(categoryId);
    setActiveTab('pool');
  };

  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Deine Locations',
      icon: <Grid3x3 className="w-4 h-4" />,
      content: (
        <LocationCategoryOverview
          weddingId={weddingId}
          locations={locations}
          onCategoryClick={handleCategoryClick}
        />
      ),
    },
    {
      id: 'pool',
      label: 'Location-Auswahl',
      icon: <Users className="w-4 h-4" />,
      badge: locations.length,
      content: (
        <LocationAllTab
          weddingId={weddingId}
          locations={locations}
          onUpdate={loadLocations}
          onAddLocation={() => setShowAddModal(true)}
          initialCategoryFilter={categoryFilter}
        />
      ),
    },
    {
      id: 'costs',
      label: 'Kosten',
      icon: <DollarSign className="w-4 h-4" />,
      content: (
        <LocationCostsTab
          weddingId={weddingId}
          locations={locations}
        />
      ),
    },
  ];

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
        title={LOCATION.MODULE_NAME}
        subtitle="Verwalte deine Hochzeitslocations"
        stats={stats}
      />

      <TabContainer
        tabs={tabs}
        defaultTab="overview"
        storageKey={`location-tab-${weddingId}`}
        urlParam="locationTab"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {showAddModal && (
        <LocationAddModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadLocations();
            showToast(`${LOCATION.SINGULAR} erfolgreich hinzugefügt`, 'success');
          }}
          weddingId={weddingId}
        />
      )}

      {selectedLocationId && (
        <LocationDetailModal
          locationId={selectedLocationId}
          onClose={() => setSelectedLocationId(null)}
          onUpdate={loadLocations}
        />
      )}

      <FAB
        onClick={() => setShowAddModal(true)}
        icon={Plus}
        label="Location hinzufügen"
        position="bottom-right"
        variant="primary"
        showOnMobile={true}
        showOnDesktop={false}
      />
      </div>
    </div>
  );
}
