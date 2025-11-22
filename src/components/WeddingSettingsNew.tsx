import { Heart, User, Shield, CreditCard, Database } from 'lucide-react';
import TabContainer, { type Tab } from './common/TabContainer';
import SettingsHochzeitTab from './Settings/SettingsHochzeitTab';
import SettingsProfilTab from './Settings/SettingsProfilTab';
import SettingsAboTab from './Settings/SettingsAboTab';
import PrivacySettings from './PrivacySettings';
import DataExport from './DataExport';

interface WeddingSettingsProps {
  weddingId: string;
  onUpdate: () => void;
}

export default function WeddingSettings({ weddingId, onUpdate }: WeddingSettingsProps) {
  const tabs: Tab[] = [
    {
      id: 'hochzeit',
      label: 'Hochzeit',
      icon: <Heart className="w-4 h-4" />,
      content: <SettingsHochzeitTab weddingId={weddingId} onUpdate={onUpdate} />,
    },
    {
      id: 'profil',
      label: 'Profil',
      icon: <User className="w-4 h-4" />,
      content: <SettingsProfilTab />,
    },
    {
      id: 'datenschutz',
      label: 'Datenschutz',
      icon: <Shield className="w-4 h-4" />,
      content: <PrivacySettings />,
    },
    {
      id: 'abo',
      label: 'Abonnement',
      icon: <CreditCard className="w-4 h-4" />,
      content: <SettingsAboTab />,
    },
    {
      id: 'daten',
      label: 'Daten',
      icon: <Database className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-[#0a253c]">Datenverwaltung</h3>
          <DataExport weddingId={weddingId} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[#0a253c]">Einstellungen</h2>
        <p className="text-[#666666] mt-1">Verwalte deine Hochzeitsplanung</p>
      </div>

      <TabContainer
        tabs={tabs}
        defaultTab="hochzeit"
        storageKey={`settings-tab-${weddingId}`}
        urlParam="settingsTab"
      />
    </div>
  );
}
