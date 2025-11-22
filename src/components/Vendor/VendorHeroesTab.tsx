import { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, Star, Zap, Plus, Link as LinkIcon } from 'lucide-react';
import { supabase, type Vendor, type VendorEventAssignment, type TimelineEvent } from '../../lib/supabase';
import VendorHeroCard from './VendorHeroCard';
import { VENDOR } from '../../constants/terminology';
import { useToast } from '../../contexts/ToastContext';

interface VendorHeroesTabProps {
  weddingId: string;
  vendors: Vendor[];
  onUpdate: () => void;
  onAddVendor: () => void;
  onEditVendor: (vendorId: string) => void;
}

interface VendorWithAssignments extends Vendor {
  eventAssignments?: VendorEventAssignment[];
  events?: TimelineEvent[];
}

export default function VendorHeroesTab({
  weddingId,
  vendors,
  onUpdate,
  onAddVendor,
  onEditVendor
}: VendorHeroesTabProps) {
  const { showToast } = useToast();
  const [vendorsWithData, setVendorsWithData] = useState<VendorWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);

  const bookedVendors = vendors.filter(v =>
    v.contract_status === 'signed' || v.contract_status === 'completed'
  );

  useEffect(() => {
    loadVendorData();
  }, [vendors]);

  const loadVendorData = async () => {
    try {
      setLoading(true);

      const vendorIds = bookedVendors.map(v => v.id);
      if (vendorIds.length === 0) {
        setVendorsWithData([]);
        setLoading(false);
        return;
      }

      const { data: assignments } = await supabase
        .from('vendor_event_assignments')
        .select('*, wedding_day_blocks(*)')
        .in('vendor_id', vendorIds);

      const enrichedVendors = bookedVendors.map(vendor => {
        const vendorAssignments = assignments?.filter(a => a.vendor_id === vendor.id) || [];
        const vendorEvents = vendorAssignments
          .map(a => a.wedding_day_blocks)
          .filter(Boolean);

        return {
          ...vendor,
          eventAssignments: vendorAssignments,
          events: vendorEvents
        };
      });

      setVendorsWithData(enrichedVendors);
    } catch (error) {
      console.error('Error loading vendor data:', error);
      showToast('Fehler beim Laden der Daten', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = bookedVendors.reduce((sum, v) => sum + (v.total_cost || 0), 0);
  const totalPaid = bookedVendors.reduce((sum, v) => sum + (v.paid_amount || 0), 0);
  const totalOpen = totalCost - totalPaid;
  const paymentProgress = totalCost > 0 ? Math.round((totalPaid / totalCost) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-3xl p-8 shadow-2xl border-2 border-[#d4af37]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl"></div>

        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Zap className="w-10 h-10 text-[#d4af37] animate-pulse" />
                Deine Helden
              </h2>
              <p className="text-white/70 text-lg">
                Dein Dream-Team für den großen Tag
              </p>
            </div>
            <button
              onClick={onAddVendor}
              className="flex items-center gap-2 px-6 py-4 bg-[#d4af37] text-[#0a253c] rounded-xl font-bold hover:bg-[#c19a2e] transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-6 h-6" />
              {VENDOR.ADD}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 hover:border-[#d4af37] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{bookedVendors.length}</div>
                  <div className="text-white/70 text-sm">Gebuchte Helden</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 hover:border-[#d4af37] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {totalCost.toLocaleString('de-DE')} €
                  </div>
                  <div className="text-white/70 text-sm">Gesamtkosten</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 hover:border-[#d4af37] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {totalPaid.toLocaleString('de-DE')} €
                  </div>
                  <div className="text-white/70 text-sm">Bereits bezahlt</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 hover:border-[#d4af37] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Star className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{paymentProgress}%</div>
                  <div className="text-white/70 text-sm">Zahlungsfortschritt</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#d4af37]"></div>
        </div>
      ) : bookedVendors.length === 0 ? (
        <div className="bg-gradient-to-br from-[#f7f2eb] to-white rounded-3xl p-16 text-center border-2 border-dashed border-[#d4af37] shadow-xl">
          <Users className="w-24 h-24 text-[#d4af37] mx-auto mb-6 opacity-50" />
          <h3 className="text-3xl font-bold text-[#0a253c] mb-4">
            Noch keine Helden im Team
          </h3>
          <p className="text-[#666666] text-lg mb-8 max-w-md mx-auto">
            Beginne damit, dein Dream-Team zusammenzustellen. Wähle aus dem Pool oder füge neue {VENDOR.PLURAL} hinzu.
          </p>
          <button
            onClick={onAddVendor}
            className="px-8 py-4 bg-[#d4af37] text-[#0a253c] rounded-xl font-bold text-lg hover:bg-[#c19a2e] transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-6 h-6 inline mr-2" />
            Ersten Helden hinzufügen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vendorsWithData.map((vendor) => (
            <div key={vendor.id} className="group relative">
              <VendorHeroCard
                vendor={vendor}
                onUpdate={onUpdate}
                onEdit={() => onEditVendor(vendor.id)}
                size="normal"
              />

              {vendor.events && vendor.events.length > 0 && (
                <div className="mt-3 bg-white rounded-xl p-3 shadow-md border-2 border-[#d4af37]/20">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#0a253c] mb-2">
                    <LinkIcon className="w-4 h-4 text-[#d4af37]" />
                    Zugeordnete Events
                  </div>
                  <div className="space-y-1">
                    {vendor.events.slice(0, 3).map((event: any) => (
                      <div
                        key={event.id}
                        className="text-xs px-2 py-1 bg-[#d4af37]/10 text-[#0a253c] rounded-lg truncate"
                      >
                        {event.title}
                      </div>
                    ))}
                    {vendor.events.length > 3 && (
                      <div className="text-xs text-[#666666] text-center pt-1">
                        +{vendor.events.length - 3} weitere
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
