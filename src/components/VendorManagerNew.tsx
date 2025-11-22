import { useState, useEffect } from 'react';
import { Building2, Briefcase, FileCheck, Star, Users, Plus, DollarSign, Grid3x3 } from 'lucide-react';
import { supabase, type Vendor } from '../lib/supabase';
import TabContainer, { type Tab } from './common/TabContainer';
import PageHeaderWithStats, { type StatCard } from './common/PageHeaderWithStats';
import VendorAllTab from './Vendor/VendorAllTab';
import VendorCategoryOverview from './Vendor/VendorCategoryOverview';
import VendorCostsTab from './Vendor/VendorCostsTab';
import VendorAddModal from './VendorAddModal';
import VendorDetailModal from './VendorDetailModal';
import FAB from './common/FAB';
import { VENDOR } from '../constants/terminology';
import { useToast } from '../contexts/ToastContext';

interface VendorManagerProps {
  weddingId: string;
}

export default function VendorManager({ weddingId }: VendorManagerProps) {
  const { showToast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    loadVendors();
  }, [weddingId]);

  const loadVendors = async () => {
    try {
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: false });

      if (data) setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadVendors();
      showToast('Dienstleister aktualisiert', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
      showToast('Fehler beim Aktualisieren', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };


  const totalVendors = vendors.length;
  const bookedVendors = vendors.filter(v => v.contract_status === 'signed' || v.contract_status === 'completed').length;
  const favorites = vendors.filter(v => v.is_favorite).length;
  const poolVendors = vendors.filter(v => v.contract_status !== 'signed' && v.contract_status !== 'completed').length;
  const bookingRate = totalVendors > 0 ? Math.round((bookedVendors / totalVendors) * 100) : 0;

  const stats: StatCard[] = [
    {
      icon: <Briefcase className="w-6 h-6 text-white" />,
      label: `Gesamt ${VENDOR.PLURAL}`,
      value: totalVendors,
      subtitle: `${bookingRate}% gebucht`,
      color: 'yellow'
    },
    {
      icon: <FileCheck className="w-6 h-6 text-white" />,
      label: 'Gebucht',
      value: bookedVendors,
      subtitle: totalVendors > 0 ? `${bookingRate}% der ${VENDOR.PLURAL}` : 'Noch keine',
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
      value: poolVendors,
      subtitle: poolVendors > 0 ? 'Verfügbar' : 'Keine verfügbar',
      color: 'blue'
    }
  ];

  const handleCategoryClick = (categoryName: string) => {
    setCategoryFilter(categoryName);
    setActiveTab('pool');
  };

  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Deine Helden',
      icon: <Grid3x3 className="w-4 h-4" />,
      content: (
        <VendorCategoryOverview
          weddingId={weddingId}
          vendors={vendors}
          onCategoryClick={handleCategoryClick}
        />
      ),
    },
    {
      id: 'pool',
      label: 'Helden-Auswahl',
      icon: <Users className="w-4 h-4" />,
      badge: vendors.length,
      content: (
        <VendorAllTab
          weddingId={weddingId}
          vendors={vendors}
          onUpdate={loadVendors}
          onAddVendor={() => setShowAddModal(true)}
          initialCategoryFilter={categoryFilter}
        />
      ),
    },
    {
      id: 'costs',
      label: 'Kosten',
      icon: <DollarSign className="w-4 h-4" />,
      content: (
        <VendorCostsTab
          weddingId={weddingId}
          vendors={vendors}
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
        title={VENDOR.MODULE_NAME}
        subtitle="Verwalte deine Dienstleister"
        stats={stats}
      />

      <TabContainer
        tabs={tabs}
        defaultTab="overview"
        storageKey={`vendor-tab-${weddingId}`}
        urlParam="vendorTab"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {showAddModal && (
        <VendorAddModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadVendors();
            showToast('Dienstleister erfolgreich hinzugefügt', 'success');
          }}
          weddingId={weddingId}
        />
      )}

      {selectedVendorId && (
        <VendorDetailModal
          vendorId={selectedVendorId}
          weddingId={weddingId}
          onClose={() => setSelectedVendorId(null)}
          onUpdate={loadVendors}
        />
      )}

      <FAB
        onClick={() => setShowAddModal(true)}
        icon={Plus}
        label="Dienstleister hinzufügen"
        position="bottom-right"
        variant="primary"
        showOnMobile={true}
        showOnDesktop={false}
      />
      </div>
    </div>
  );
}
