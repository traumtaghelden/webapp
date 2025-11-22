import { useState, useEffect } from 'react';
import { Users, TrendingDown, TrendingUp, Calculator, Info, AlertCircle } from 'lucide-react';
import { supabase, type BudgetItem } from '../lib/supabase';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';

interface GuestCalculatorModalProps {
  weddingId: string;
  plannedGuestCount: number;
  confirmedGuestCount: number;
  onClose: () => void;
}

export default function GuestCalculatorModal({
  weddingId,
  plannedGuestCount,
  confirmedGuestCount,
  onClose
}: GuestCalculatorModalProps) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatedGuestCount, setSimulatedGuestCount] = useState(plannedGuestCount);
  const [fixedCosts, setFixedCosts] = useState(0);

  useEffect(() => {
    loadBudgetItems();
    getFixedCosts().then(setFixedCosts);
  }, [weddingId]);

  const loadBudgetItems = async () => {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('wedding_id', weddingId)
        .eq('is_per_person', true);

      if (error) throw error;
      setBudgetItems(data || []);
    } catch (error) {
      console.error('Error loading budget items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFixedCosts = async () => {
    const { data } = await supabase
      .from('budget_items')
      .select('estimated_cost')
      .eq('wedding_id', weddingId)
      .eq('is_per_person', false);

    return data?.reduce((sum, item) => sum + (Number(item.estimated_cost) || 0), 0) || 0;
  };

  const calculateCosts = (guestCount: number) => {
    return budgetItems.reduce(
      (sum, item) => sum + (Number(item.cost_per_person) || 0) * guestCount,
      0
    );
  };

  const baseCosts = calculateCosts(plannedGuestCount);
  const simulatedCosts = calculateCosts(simulatedGuestCount);
  const difference = simulatedCosts - baseCosts;
  const percentChange = baseCosts > 0 ? (difference / baseCosts) * 100 : 0;

  const scenarios = [
    { label: 'Minimale Gästezahl', count: Math.max(30, Math.floor(plannedGuestCount * 0.6)) },
    { label: 'Reduzierte Gästezahl', count: Math.floor(plannedGuestCount * 0.85) },
    { label: 'Geplante Gästezahl', count: plannedGuestCount },
    { label: 'Erweiterte Gästezahl', count: Math.floor(plannedGuestCount * 1.15) },
    { label: 'Maximale Gästezahl', count: Math.floor(plannedGuestCount * 1.3) }
  ];

  const costPerGuest = budgetItems.reduce((sum, item) => sum + (Number(item.cost_per_person) || 0), 0);

  return (
    <StandardModal
      isOpen={true}
      onClose={onClose}
      title="Gästeanzahl-Kalkulator"
      subtitle="Was-wäre-wenn-Analyse für variable Kosten"
      icon={Calculator}
      maxWidth="4xl"
      footer={
        <ModalFooter>
          <ModalButton variant="primary" onClick={onClose}>
            Schließen
          </ModalButton>
        </ModalFooter>
      }
    >
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-500/20 rounded-xl border border-blue-500/50 backdrop-blur-sm">
              <p className="text-sm text-white/70 mb-1">Geplante Gäste</p>
              <p className="text-2xl font-bold text-white">{plannedGuestCount}</p>
            </div>
            <div className="p-4 bg-green-500/20 rounded-xl border border-green-500/50 backdrop-blur-sm">
              <p className="text-sm text-white/70 mb-1">Bestätigte Gäste</p>
              <p className="text-2xl font-bold text-white">{confirmedGuestCount}</p>
            </div>
            <div className="p-4 bg-[#d4af37]/20 rounded-xl border border-[#d4af37]/50 backdrop-blur-sm">
              <p className="text-sm text-white/70 mb-1">Pro-Kopf-Kosten</p>
              <p className="text-2xl font-bold text-white">{costPerGuest.toFixed(2)}€</p>
            </div>
          </div>

          <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-white/90">
              <p className="font-semibold mb-1">Wichtig: Nur Pro-Kopf-Kosten werden berechnet</p>
              <p>
                Diese Kalkulation zeigt nur die Änderung bei <strong>gästeabhängigen Kosten</strong> (z.B. Catering, Getränke, Gastgeschenke).
                Fixkosten wie Location, Dekoration oder Fotograf bleiben unverändert bei <strong>{fixedCosts.toFixed(2)}€</strong>.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-3">
              Simulierte Gästezahl: <span className="text-2xl font-bold text-[#d4af37]">{simulatedGuestCount}</span>
            </label>
            <input
              type="range"
              min="30"
              max={Math.floor(plannedGuestCount * 1.5)}
              value={simulatedGuestCount}
              onChange={(e) => setSimulatedGuestCount(Number(e.target.value))}
              className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
            />
            <div className="flex justify-between text-xs text-white/60 mt-2">
              <span>30</span>
              <span>{Math.floor(plannedGuestCount * 1.5)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-blue-500/20 rounded-xl border-2 border-blue-500/50 backdrop-blur-sm">
              <p className="text-sm text-white/70 mb-2">Basis (geplant)</p>
              <p className="text-4xl font-bold text-white mb-1">{baseCosts.toFixed(2)}€</p>
              <p className="text-sm text-white/70">{plannedGuestCount} Gäste × {costPerGuest.toFixed(2)}€</p>
            </div>

            <div className="p-6 bg-[#d4af37]/20 rounded-xl border-2 border-[#d4af37]/50 backdrop-blur-sm">
              <p className="text-sm text-white/70 mb-2">Simuliert</p>
              <p className="text-4xl font-bold text-white mb-1">{simulatedCosts.toFixed(2)}€</p>
              <p className="text-sm text-white/70">{simulatedGuestCount} Gäste × {costPerGuest.toFixed(2)}€</p>
            </div>
          </div>

          {Math.abs(difference) > 0.01 && (
            <div className={`p-6 rounded-xl flex items-center gap-4 backdrop-blur-sm ${
              difference < 0
                ? 'bg-green-500/20 border-2 border-green-500/50'
                : 'bg-red-500/20 border-2 border-red-500/50'
            }`}>
              {difference < 0 ? (
                <TrendingDown className="w-12 h-12 text-green-400" />
              ) : (
                <TrendingUp className="w-12 h-12 text-red-400" />
              )}
              <div>
                <p className={`text-2xl font-bold mb-1 ${difference < 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {difference < 0 ? '-' : '+'}{Math.abs(difference).toFixed(2)}€
                </p>
                <p className="text-sm text-white/80">
                  {Math.abs(percentChange).toFixed(1)}% {difference < 0 ? 'Einsparung' : 'Mehrkosten'} bei variablen Kosten
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Gesamtbudget würde bei <strong>{(fixedCosts + simulatedCosts).toFixed(2)}€</strong> liegen
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#d4af37]" />
              Szenarien-Vergleich
            </h3>
            <div className="space-y-3">
              {scenarios.map((scenario, idx) => {
                const scenarioCost = calculateCosts(scenario.count);
                const scenarioDiff = scenarioCost - baseCosts;
                const isSelected = scenario.count === simulatedGuestCount;

                return (
                  <button
                    key={idx}
                    onClick={() => setSimulatedGuestCount(scenario.count)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left backdrop-blur-sm ${
                      isSelected
                        ? 'bg-[#d4af37]/20 border-[#d4af37] shadow-gold'
                        : 'bg-white/5 border-white/20 hover:border-[#d4af37]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{scenario.label}</p>
                        <p className="text-sm text-white/70">{scenario.count} Gäste</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">{scenarioCost.toFixed(2)}€</p>
                        {Math.abs(scenarioDiff) > 0.01 && (
                          <p className={`text-sm font-medium ${scenarioDiff < 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {scenarioDiff > 0 ? '+' : ''}{scenarioDiff.toFixed(2)}€
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Betroffene Budget-Positionen</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {budgetItems.map((item) => {
                const itemCost = Number(item.cost_per_person) || 0;
                const itemDiff = itemCost * (simulatedGuestCount - plannedGuestCount);

                return (
                  <div key={item.id} className="p-3 bg-white/5 rounded-lg flex items-center justify-between backdrop-blur-sm">
                    <div>
                      <p className="font-medium text-white">{item.item_name}</p>
                      <p className="text-sm text-white/70">{itemCost.toFixed(2)}€ pro Gast</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">
                        {(itemCost * simulatedGuestCount).toFixed(2)}€
                      </p>
                      {Math.abs(itemDiff) > 0.01 && (
                        <p className={`text-sm ${itemDiff < 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {itemDiff > 0 ? '+' : ''}{itemDiff.toFixed(2)}€
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {budgetItems.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-white/40 mx-auto mb-3" />
              <p className="text-white/80">Keine Pro-Kopf-Positionen vorhanden</p>
              <p className="text-sm text-white/60 mt-1">
                Erstelle Budget-Items mit Pro-Kopf-Kalkulation um diesen Rechner zu nutzen
              </p>
            </div>
          )}
        </div>
      )}
    </StandardModal>
  );
}
