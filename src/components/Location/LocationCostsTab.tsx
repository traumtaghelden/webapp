import { DollarSign } from 'lucide-react';
import { type Location } from '../../lib/supabase';

interface LocationCostsTabProps {
  weddingId: string;
  locations: Location[];
}

export default function LocationCostsTab({ locations }: LocationCostsTabProps) {
  const totalCost = locations.reduce((sum, l) => sum + l.total_cost, 0);
  const locationsWithCosts = locations.filter(l => l.total_cost > 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#0a253c] to-[#1a3a5c] rounded-xl p-8 shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-bold mb-2">{totalCost.toLocaleString('de-DE')} EUR</h3>
            <p className="text-white/70">Gesamtkosten für Locations</p>
          </div>
          <DollarSign className="w-16 h-16 text-[#d4af37]" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-2xl font-bold text-[#0a253c] mb-6">Kostenübersicht</h3>

        {locationsWithCosts.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="w-20 h-20 text-[#d4af37] mx-auto mb-4 opacity-50" />
            <p className="text-[#666666]">Noch keine Kosten erfasst</p>
          </div>
        ) : (
          <div className="space-y-4">
            {locationsWithCosts.map((location) => (
              <div
                key={location.id}
                className="bg-[#f7f2eb] rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-[#0a253c]">{location.name}</h4>
                  <p className="text-sm text-[#666666]">{location.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#d4af37] text-lg">
                    {location.total_cost.toLocaleString('de-DE')} {location.currency}
                  </p>
                  {location.deposit_amount > 0 && (
                    <p className="text-xs text-[#666666]">
                      Kaution: {location.deposit_amount.toLocaleString('de-DE')} {location.currency}
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
