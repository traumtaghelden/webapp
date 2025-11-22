import { Star, Mail, Phone, DollarSign, MapPin, ExternalLink, CheckCircle, ArrowRight, GitCompare } from 'lucide-react';
import { type Vendor } from '../lib/supabase';
import { VENDOR } from '../constants/terminology';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';

interface VendorComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor1: Vendor;
  vendor2: Vendor;
  onBook: (vendorId: string) => void;
}

export default function VendorComparisonModal({
  isOpen,
  onClose,
  vendor1,
  vendor2,
  onBook
}: VendorComparisonModalProps) {
  const ComparisonRow = ({ label, value1, value2, icon }: {
    label: string;
    value1: React.ReactNode;
    value2: React.ReactNode;
    icon?: React.ReactNode;
  }) => (
    <div className="grid grid-cols-3 gap-6 py-4 border-b border-[#d4af37]/20 last:border-0">
      <div className="flex items-center gap-2 text-sm font-bold text-[#d4af37]">
        {icon}
        {label}
      </div>
      <div className="text-sm text-white font-medium">{value1}</div>
      <div className="text-sm text-white font-medium">{value2}</div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
      case 'completed':
        return 'bg-green-500/30 text-green-300 border-green-500/50';
      case 'pending':
        return 'bg-[#d4af37]/30 text-[#d4af37] border-[#d4af37]/50';
      case 'cancelled':
        return 'bg-red-500/30 text-red-300 border-red-500/50';
      default:
        return 'bg-gray-500/30 text-gray-300 border-gray-500/50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'signed':
        return 'Gebucht';
      case 'completed':
        return 'Abgeschlossen';
      case 'pending':
        return 'In Verhandlung';
      case 'cancelled':
        return 'Storniert';
      default:
        return 'Anfrage';
    }
  };

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Dienstleister-Vergleich"
      subtitle={`Vergleiche beide ${VENDOR.PLURAL} direkt nebeneinander`}
      icon={GitCompare}
      maxWidth="4xl"
      footer={
        <ModalFooter>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <button
              onClick={() => {
                onBook(vendor1.id);
                onClose();
              }}
              disabled={vendor1.contract_status === 'signed' || vendor1.contract_status === 'completed'}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-gray-900 rounded-xl font-bold hover:shadow-lg hover:shadow-[#d4af37]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="truncate">{vendor1.name}</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold border-2 border-white/20 hover:border-white/30 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
              Zurück
            </button>
            <button
              onClick={() => {
                onBook(vendor2.id);
                onClose();
              }}
              disabled={vendor2.contract_status === 'signed' || vendor2.contract_status === 'completed'}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-gray-900 rounded-xl font-bold hover:shadow-lg hover:shadow-[#d4af37]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="truncate">{vendor2.name}</span>
            </button>
          </div>
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        {/* Vendor Headers */}
        <div className="grid grid-cols-3 gap-4">
          <div></div>
          <div className="bg-gradient-to-br from-[#1a3a5c] to-[#0a253c] rounded-2xl p-5 text-center border-2 border-[#d4af37]/30 backdrop-blur-sm shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-3">
                <h3 className="text-xl font-bold text-white truncate">{vendor1.name}</h3>
                {vendor1.is_favorite && (
                  <Star className="w-5 h-5 text-[#d4af37] flex-shrink-0" fill="currentColor" />
                )}
              </div>
              <span className="inline-block px-3 py-1.5 bg-[#d4af37] text-gray-900 rounded-lg text-xs font-bold shadow-md">
                {vendor1.category}
              </span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#1a3a5c] to-[#0a253c] rounded-2xl p-5 text-center border-2 border-[#d4af37]/30 backdrop-blur-sm shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-3">
                <h3 className="text-xl font-bold text-white truncate">{vendor2.name}</h3>
                {vendor2.is_favorite && (
                  <Star className="w-5 h-5 text-[#d4af37] flex-shrink-0" fill="currentColor" />
                )}
              </div>
              <span className="inline-block px-3 py-1.5 bg-[#d4af37] text-gray-900 rounded-lg text-xs font-bold shadow-md">
                {vendor2.category}
              </span>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-gradient-to-br from-[#0a253c]/80 to-[#1a3a5c]/80 rounded-2xl p-6 border-2 border-[#d4af37]/20 backdrop-blur-sm shadow-xl">
          <ComparisonRow
            label="Preis"
            icon={<DollarSign className="w-4 h-4 text-green-400" />}
            value1={
              vendor1.total_cost && vendor1.total_cost > 0
                ? `${Number(vendor1.total_cost).toLocaleString('de-DE')} €`
                : <span className="text-white/50">Auf Anfrage</span>
            }
            value2={
              vendor2.total_cost && vendor2.total_cost > 0
                ? `${Number(vendor2.total_cost).toLocaleString('de-DE')} €`
                : <span className="text-white/50">Auf Anfrage</span>
            }
          />

          <ComparisonRow
            label="E-Mail"
            icon={<Mail className="w-4 h-4 text-[#d4af37]" />}
            value1={
              vendor1.email ? (
                <a href={`mailto:${vendor1.email}`} className="text-[#d4af37] hover:text-[#f4d03f] underline transition-colors">
                  {vendor1.email}
                </a>
              ) : (
                <span className="text-white/50">Nicht angegeben</span>
              )
            }
            value2={
              vendor2.email ? (
                <a href={`mailto:${vendor2.email}`} className="text-[#d4af37] hover:text-[#f4d03f] underline transition-colors">
                  {vendor2.email}
                </a>
              ) : (
                <span className="text-white/50">Nicht angegeben</span>
              )
            }
          />

          <ComparisonRow
            label="Telefon"
            icon={<Phone className="w-4 h-4 text-[#d4af37]" />}
            value1={
              vendor1.phone ? (
                <a href={`tel:${vendor1.phone}`} className="text-[#d4af37] hover:text-[#f4d03f] underline transition-colors">
                  {vendor1.phone}
                </a>
              ) : (
                <span className="text-white/50">Nicht angegeben</span>
              )
            }
            value2={
              vendor2.phone ? (
                <a href={`tel:${vendor2.phone}`} className="text-[#d4af37] hover:text-[#f4d03f] underline transition-colors">
                  {vendor2.phone}
                </a>
              ) : (
                <span className="text-white/50">Nicht angegeben</span>
              )
            }
          />

          <ComparisonRow
            label="Standort"
            icon={<MapPin className="w-4 h-4 text-[#d4af37]" />}
            value1={vendor1.location || <span className="text-white/50">Nicht angegeben</span>}
            value2={vendor2.location || <span className="text-white/50">Nicht angegeben</span>}
          />

          <ComparisonRow
            label="Website"
            icon={<ExternalLink className="w-4 h-4 text-[#d4af37]" />}
            value1={
              vendor1.website ? (
                <a
                  href={vendor1.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4af37] hover:text-[#f4d03f] underline transition-colors inline-flex items-center gap-1"
                >
                  Zur Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-white/50">Nicht vorhanden</span>
              )
            }
            value2={
              vendor2.website ? (
                <a
                  href={vendor2.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4af37] hover:text-[#f4d03f] underline transition-colors inline-flex items-center gap-1"
                >
                  Zur Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-white/50">Nicht vorhanden</span>
              )
            }
          />

          <ComparisonRow
            label="Status"
            icon={<CheckCircle className="w-4 h-4 text-green-400" />}
            value1={
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(vendor1.contract_status)}`}>
                {getStatusLabel(vendor1.contract_status)}
              </span>
            }
            value2={
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(vendor2.contract_status)}`}>
                {getStatusLabel(vendor2.contract_status)}
              </span>
            }
          />

          {(vendor1.description || vendor2.description) && (
            <div className="grid grid-cols-3 gap-6 py-4">
              <div className="text-sm font-bold text-[#d4af37]">Beschreibung</div>
              <div className="text-sm text-white/90">
                {vendor1.description || <span className="text-white/50">Keine Beschreibung</span>}
              </div>
              <div className="text-sm text-white/90">
                {vendor2.description || <span className="text-white/50">Keine Beschreibung</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </StandardModal>
  );
}
