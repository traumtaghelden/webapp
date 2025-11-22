import { DollarSign, CheckCircle, MapPin } from 'lucide-react';
import { type Location } from '../lib/supabase';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';

interface LocationBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location;
  weddingId: string;
  onConfirm: () => void;
}

export default function LocationBookingDialog({
  isOpen,
  onClose,
  location,
  onConfirm
}: LocationBookingDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${location.name} buchen`}
      subtitle="Möchtest du diese Location wirklich buchen?"
      icon={MapPin}
      maxWidth="lg"
      footer={
        <ModalFooter>
          <ModalButton variant="secondary" onClick={onClose}>
            Abbrechen
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleConfirm}
            icon={CheckCircle}
          >
            Location buchen
          </ModalButton>
        </ModalFooter>
      }
    >
      <div className="space-y-4">
        {/* Location Info Card */}
        <div className="bg-gradient-to-br from-[#d4af37]/20 to-[#f4d03f]/20 rounded-xl p-5 border-2 border-[#d4af37]/30 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] rounded-xl flex items-center justify-center shadow-gold">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">{location.name}</h3>
              <p className="text-sm text-white/70 mb-2">{location.category}</p>
              {location.city && (
                <p className="text-sm text-white/70 mb-2">{location.city}</p>
              )}
              {location.total_cost && location.total_cost > 0 && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-lg font-bold text-green-400">
                    {Number(location.total_cost).toLocaleString('de-DE')} €
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-white/70 text-sm text-center">
          Die Location wird als "Gebucht" markiert und in deiner gebuchten Liste angezeigt.
        </p>
      </div>
    </StandardModal>
  );
}
