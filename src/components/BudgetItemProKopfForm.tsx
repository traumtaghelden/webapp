import { useState, useEffect } from 'react';
import { Users, Info, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BudgetItemProKopfFormProps {
  weddingId: string;
  isPerPerson: boolean;
  costPerPerson: number | null;
  useConfirmedGuestsOnly: boolean;
  guestCountOverride: number | null;
  onChange: (data: {
    is_per_person: boolean;
    cost_per_person: number | null;
    use_confirmed_guests_only: boolean;
    guest_count_override: number | null;
  }) => void;
}

export default function BudgetItemProKopfForm({
  weddingId,
  isPerPerson,
  costPerPerson,
  useConfirmedGuestsOnly,
  guestCountOverride,
  onChange
}: BudgetItemProKopfFormProps) {
  const [plannedGuests, setPlannedGuests] = useState(0);
  const [confirmedGuests, setConfirmedGuests] = useState(0);
  const [localIsPerPerson, setLocalIsPerPerson] = useState(isPerPerson);
  const [localCostPerPerson, setLocalCostPerPerson] = useState(costPerPerson?.toString() || '');
  const [localUseConfirmed, setLocalUseConfirmed] = useState(useConfirmedGuestsOnly);
  const [localOverride, setLocalOverride] = useState(guestCountOverride?.toString() || '');

  useEffect(() => {
    loadGuestCounts();
  }, [weddingId]);

  useEffect(() => {
    const parsedCost = localCostPerPerson ? parseFloat(localCostPerPerson) : null;
    const parsedOverride = localOverride ? parseInt(localOverride) : null;

    onChange({
      is_per_person: localIsPerPerson,
      cost_per_person: parsedCost,
      use_confirmed_guests_only: localUseConfirmed,
      guest_count_override: parsedOverride
    });
  }, [localIsPerPerson, localCostPerPerson, localUseConfirmed, localOverride]);

  const loadGuestCounts = async () => {
    try {
      const { data: weddingData } = await supabase
        .from('weddings')
        .select('guest_count')
        .eq('id', weddingId)
        .maybeSingle();

      if (weddingData) setPlannedGuests(weddingData.guest_count || 0);

      const { data: guestsData } = await supabase
        .from('guests')
        .select('id')
        .eq('wedding_id', weddingId)
        .eq('rsvp_status', 'accepted');

      if (guestsData) setConfirmedGuests(guestsData.length);
    } catch (error) {
      console.error('Error loading guest counts:', error);
    }
  };

  const calculateEstimatedCost = () => {
    const cost = parseFloat(localCostPerPerson) || 0;
    return cost * plannedGuests;
  };

  const calculateActualCost = () => {
    const cost = parseFloat(localCostPerPerson) || 0;
    let guestCount = plannedGuests;

    if (localOverride) {
      guestCount = parseInt(localOverride);
    } else if (localUseConfirmed) {
      guestCount = confirmedGuests;
    }

    return cost * guestCount;
  };

  const getActiveGuestCount = () => {
    if (localOverride) return parseInt(localOverride);
    if (localUseConfirmed) return confirmedGuests;
    return plannedGuests;
  };

  if (!localIsPerPerson) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={localIsPerPerson}
            onChange={(e) => setLocalIsPerPerson(e.target.checked)}
            className="w-5 h-5 rounded text-blue-600"
          />
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-700">Pro-Kopf-Kalkulation aktivieren</span>
          </div>
        </label>
        <p className="text-sm text-gray-600 mt-2 ml-8">
          Kosten werden automatisch basierend auf der Gästezahl berechnet (z.B. für Catering, Getränke, Gastgeschenke)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localIsPerPerson}
              onChange={(e) => setLocalIsPerPerson(e.target.checked)}
              className="w-5 h-5 rounded text-purple-600"
            />
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-800">Pro-Kopf-Kalkulation</span>
            </div>
          </label>
          <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-bold">
            AKTIV
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kosten pro Gast (€)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={localCostPerPerson}
                onChange={(e) => setLocalCostPerPerson(e.target.value)}
                className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="z.B. 45.00"
              />
              <Calculator className="absolute right-3 top-2.5 w-5 h-5 text-purple-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gästezahl-Überschreibung (optional)
            </label>
            <input
              type="number"
              value={localOverride}
              onChange={(e) => setLocalOverride(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder={`Standard: ${localUseConfirmed ? confirmedGuests : plannedGuests}`}
            />
          </div>
        </div>

        <div className="p-3 bg-white rounded-lg border border-purple-200 mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localUseConfirmed}
              onChange={(e) => setLocalUseConfirmed(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Nur bestätigte Gäste für tatsächliche Kosten verwenden
            </span>
          </label>
          <p className="text-xs text-gray-500 ml-7">
            Geschätzte Kosten nutzen geplante Gästezahl ({plannedGuests}), tatsächliche Kosten nutzen bestätigte Gäste ({confirmedGuests})
          </p>
        </div>
      </div>

      {localCostPerPerson && parseFloat(localCostPerPerson) > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Geplante Gäste</p>
            <p className="text-2xl font-bold text-[#0a253c] mb-1">{plannedGuests}</p>
            <p className="text-sm text-blue-600 font-medium">
              = {calculateEstimatedCost().toFixed(2)}€
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Bestätigte Gäste</p>
            <p className="text-2xl font-bold text-[#0a253c] mb-1">{confirmedGuests}</p>
            <p className="text-sm text-green-600 font-medium">
              {localUseConfirmed && !localOverride && '✓ Wird verwendet'}
              {!localUseConfirmed && !localOverride && 'Nicht aktiv'}
            </p>
          </div>

          <div className={`border-2 rounded-xl p-4 ${
            localOverride
              ? 'bg-amber-50 border-amber-300'
              : 'bg-purple-50 border-purple-200'
          }`}>
            <p className="text-sm text-gray-600 mb-1">
              {localOverride ? 'Überschrieben' : 'Aktive Berechnung'}
            </p>
            <p className="text-2xl font-bold text-[#0a253c] mb-1">
              {getActiveGuestCount()}
            </p>
            <p className="text-sm font-bold text-purple-600">
              = {calculateActualCost().toFixed(2)}€
            </p>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700">
          <p className="font-semibold mb-1">Automatische Berechnung</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Geschätzte Kosten:</strong> Kosten × geplante Gästezahl ({plannedGuests})</li>
            <li>• <strong>Tatsächliche Kosten:</strong> Kosten × {localOverride ? 'überschriebene' : localUseConfirmed ? 'bestätigte' : 'geplante'} Gästezahl ({getActiveGuestCount()})</li>
            <li>• Die Berechnung erfolgt automatisch bei Änderung der Gästezahl</li>
          </ul>
        </div>
      </div>

      {localCostPerPerson && parseFloat(localCostPerPerson) > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Differenz zur Planung</p>
              <p className="text-xl font-bold text-[#0a253c]">
                {(calculateActualCost() - calculateEstimatedCost()).toFixed(2)}€
              </p>
            </div>
            {calculateActualCost() < calculateEstimatedCost() ? (
              <div className="flex items-center gap-2 text-green-600">
                <TrendingDown className="w-6 h-6" />
                <span className="font-semibold">Einsparung</span>
              </div>
            ) : calculateActualCost() > calculateEstimatedCost() ? (
              <div className="flex items-center gap-2 text-red-600">
                <TrendingUp className="w-6 h-6" />
                <span className="font-semibold">Mehrkosten</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-semibold">Wie geplant</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
