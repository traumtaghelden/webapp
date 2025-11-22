import { Star, Mail, Phone, DollarSign, MapPin, CheckCircle, ArrowRight, GitCompare, Users, Building2 } from 'lucide-react';
import { type Location } from '../lib/supabase';
import { LOCATION } from '../constants/terminology';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';

interface LocationComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  onBook: (locationId: string) => void;
}

export default function LocationComparisonModal({
  isOpen,
  onClose,
  locations,
  onBook
}: LocationComparisonModalProps) {
  const ComparisonRow = ({ label, values, icon }: {
    label: string;
    values: React.ReactNode[];
    icon?: React.ReactNode;
  }) => (
    <div className="border-b border-[#d4af37]/20 py-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white/70 mb-3">
        {icon}
        {label}
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${locations.length}, minmax(0, 1fr))` }}>
        {values.map((value, index) => (
          <div key={index} className="text-sm text-white font-medium break-words">
            {value}
          </div>
        ))}
      </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
      case 'confirmed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'booked':
        return 'Gebucht';
      case 'confirmed':
        return 'Bestätigt';
      case 'pending':
        return 'In Verhandlung';
      case 'cancelled':
        return 'Storniert';
      default:
        return 'Anfrage';
    }
  };

  const colorPalette = [
    'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    'from-green-500/20 to-green-600/20 border-green-500/30',
    'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    'from-pink-500/20 to-pink-600/20 border-pink-500/30',
    'from-teal-500/20 to-teal-600/20 border-teal-500/30',
  ];

  const buttonColors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-teal-500 to-teal-600',
  ];

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${LOCATION.PLURAL}-Vergleich`}
      subtitle={`Vergleiche ${locations.length} ${LOCATION.PLURAL} direkt nebeneinander`}
      icon={GitCompare}
      maxWidth="6xl"
      footer={
        <ModalFooter>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
            {locations.map((location, index) => (
              <button
                key={location.id}
                onClick={() => {
                  onBook(location.id);
                  onClose();
                }}
                disabled={location.booking_status === 'booked' || location.booking_status === 'confirmed'}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r ${buttonColors[index % buttonColors.length]} text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-1`}
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{location.name}</span>
              </button>
            ))}
            <ModalButton variant="secondary" onClick={onClose} className="sm:w-auto w-full">
              <ArrowRight className="w-4 h-4" />
              Zurück
            </ModalButton>
          </div>
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        {/* Location Headers */}
        <div className="grid gap-4 overflow-x-auto" style={{ gridTemplateColumns: `repeat(${locations.length}, minmax(250px, 1fr))` }}>
          {locations.map((location, index) => (
            <div
              key={location.id}
              className={`bg-gradient-to-br ${colorPalette[index % colorPalette.length]} rounded-xl p-4 text-center border-2 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-[#d4af37] flex-shrink-0" />
                {location.is_favorite && (
                  <Star className="w-5 h-5 text-[#d4af37] flex-shrink-0" fill="currentColor" />
                )}
              </div>
              <h3 className="text-lg font-bold text-white mb-2 truncate">{location.name}</h3>
              <span className="inline-block px-3 py-1 bg-[#d4af37]/20 text-[#d4af37] rounded-full text-xs font-semibold border border-[#d4af37]/30">
                {location.category}
              </span>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-[#d4af37]/20 backdrop-blur-sm overflow-x-auto">
          <ComparisonRow
            label="Preis"
            icon={<DollarSign className="w-4 h-4 text-green-400" />}
            values={locations.map(location =>
              location.total_cost && location.total_cost > 0
                ? `${Number(location.total_cost).toLocaleString('de-DE')} €`
                : <span className="text-white/50">Auf Anfrage</span>
            )}
          />

          <ComparisonRow
            label="Stadt"
            icon={<MapPin className="w-4 h-4 text-[#d4af37]" />}
            values={locations.map(location =>
              location.city || <span className="text-white/50">Nicht angegeben</span>
            )}
          />

          <ComparisonRow
            label="Adresse"
            icon={<Building2 className="w-4 h-4 text-[#d4af37]" />}
            values={locations.map(location =>
              location.address || <span className="text-white/50">Nicht angegeben</span>
            )}
          />

          <ComparisonRow
            label="Kapazität"
            icon={<Users className="w-4 h-4 text-[#d4af37]" />}
            values={locations.map(location =>
              location.max_capacity > 0
                ? `${location.max_capacity} Personen`
                : <span className="text-white/50">Nicht angegeben</span>
            )}
          />

          <ComparisonRow
            label="E-Mail"
            icon={<Mail className="w-4 h-4 text-[#d4af37]" />}
            values={locations.map(location =>
              location.contact_email ? (
                <a
                  href={`mailto:${location.contact_email}`}
                  className="text-[#d4af37] hover:text-[#f4d03f] underline transition-colors break-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  {location.contact_email}
                </a>
              ) : (
                <span className="text-white/50">Nicht angegeben</span>
              )
            )}
          />

          <ComparisonRow
            label="Telefon"
            icon={<Phone className="w-4 h-4 text-[#d4af37]" />}
            values={locations.map(location =>
              location.contact_phone ? (
                <a
                  href={`tel:${location.contact_phone}`}
                  className="text-[#d4af37] hover:text-[#f4d03f] underline transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {location.contact_phone}
                </a>
              ) : (
                <span className="text-white/50">Nicht angegeben</span>
              )
            )}
          />

          <ComparisonRow
            label="Status"
            icon={<CheckCircle className="w-4 h-4 text-green-400" />}
            values={locations.map(location => (
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(location.booking_status)}`}
              >
                {getStatusLabel(location.booking_status)}
              </span>
            ))}
          />

          <ComparisonRow
            label="Vertragsstatus"
            icon={<CheckCircle className="w-4 h-4 text-blue-400" />}
            values={locations.map(location => (
              <div className="space-y-1">
                {location.contract_sent ? (
                  <div className="flex items-center gap-1 text-xs text-blue-400">
                    <CheckCircle className="w-3 h-3" />
                    Versendet
                  </div>
                ) : (
                  <span className="text-white/50 text-xs">Nicht versendet</span>
                )}
                {location.deposit_paid ? (
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    Anzahlung erfolgt
                  </div>
                ) : (
                  <span className="text-white/50 text-xs">Keine Anzahlung</span>
                )}
              </div>
            ))}
          />

          <div className="border-b border-[#d4af37]/20 py-4">
            <div className="text-sm font-semibold text-white/70 mb-3">Beschreibung</div>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${locations.length}, minmax(0, 1fr))` }}>
              {locations.map((location, index) => (
                <div key={index} className="text-sm text-white/90">
                  {location.description || <span className="text-white/50">Keine Beschreibung</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-500/20 rounded-xl border-2 border-blue-500/30 backdrop-blur-sm">
          <p className="text-sm text-blue-200 text-center">
            <strong>Tipp:</strong> Klicke auf den Button der Location, die du buchen möchtest, um direkt zum Buchungsprozess zu gelangen.
          </p>
        </div>
      </div>
    </StandardModal>
  );
}
