import { DollarSign, CheckCircle, Briefcase } from 'lucide-react';
import { type Vendor } from '../lib/supabase';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';
import VendorAvatar from './common/VendorAvatar';

interface VendorBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  weddingId: string;
  onConfirm: () => void;
}

export default function VendorBookingDialog({
  isOpen,
  onClose,
  vendor,
  onConfirm
}: VendorBookingDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${vendor.name} buchen`}
      subtitle="Möchtest du diesen Dienstleister wirklich buchen?"
      icon={Briefcase}
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
            Dienstleister buchen
          </ModalButton>
        </ModalFooter>
      }
    >
      <div className="space-y-4">
        {/* Vendor Info Card */}
        <div className="bg-gradient-to-br from-[#d4af37]/20 to-[#f4d03f]/20 rounded-xl p-5 border-2 border-[#d4af37]/30 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <VendorAvatar
                name={vendor.name}
                category={vendor.category}
                size="lg"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">{vendor.name}</h3>
              <p className="text-sm text-white/70 mb-2">{vendor.category}</p>
              {vendor.company && (
                <p className="text-sm text-white/70 mb-2">{vendor.company}</p>
              )}
              {vendor.total_cost && vendor.total_cost > 0 && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-lg font-bold text-green-400">
                    {Number(vendor.total_cost).toLocaleString('de-DE')} €
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-white/70 text-sm text-center">
          Der Dienstleister wird als "Gebucht" markiert und in deiner gebuchten Liste angezeigt.
        </p>
      </div>
    </StandardModal>
  );
}
