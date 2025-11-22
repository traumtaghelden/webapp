import { DollarSign } from 'lucide-react';
import { type Vendor } from '../../lib/supabase';

interface VendorCostsTabProps {
  weddingId: string;
  vendors: Vendor[];
}

export default function VendorCostsTab({ vendors }: VendorCostsTabProps) {
  const totalCost = vendors.reduce((sum, v) => sum + v.total_cost, 0);
  const vendorsWithCosts = vendors.filter(v => v.total_cost > 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-gradient-to-br from-[#0a253c] to-[#1a3a5c] rounded-lg sm:rounded-xl p-5 sm:p-6 lg:p-8 shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2">{totalCost.toLocaleString('de-DE')} EUR</h3>
            <p className="text-white/70 text-sm sm:text-base">Gesamtkosten für Dienstleister</p>
          </div>
          <DollarSign className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-[#d4af37] flex-shrink-0" />
        </div>
      </div>

      <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 shadow-lg">
        <h3 className="text-xl sm:text-2xl font-bold text-[#0a253c] mb-4 sm:mb-5 lg:mb-6">Kostenübersicht</h3>

        {vendorsWithCosts.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <DollarSign className="w-16 h-16 sm:w-20 sm:h-20 text-[#d4af37] mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-[#666666] text-sm sm:text-base">Noch keine Kosten erfasst</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {vendorsWithCosts.map((vendor) => (
              <div
                key={vendor.id}
                className="bg-[#f7f2eb] rounded-lg sm:rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#0a253c] text-sm sm:text-base truncate">{vendor.name}</h4>
                  <p className="text-xs sm:text-sm text-[#666666] truncate">{vendor.category}</p>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <p className="font-bold text-[#d4af37] text-base sm:text-lg">
                    {vendor.total_cost.toLocaleString('de-DE')} {vendor.currency}
                  </p>
                  {vendor.deposit_amount > 0 && (
                    <p className="text-[10px] sm:text-xs text-[#666666]">
                      Kaution: {vendor.deposit_amount.toLocaleString('de-DE')} {vendor.currency}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
