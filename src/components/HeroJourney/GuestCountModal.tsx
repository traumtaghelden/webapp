import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { X, Users, Info, Calculator } from 'lucide-react';
import { logger } from '../../utils/logger';

interface GuestCountModalProps {
  weddingId: string;
  currentGuestCount: number;
  currentBudget: number;
  onClose: () => void;
  onSave: () => void;
}

export default function GuestCountModal({
  weddingId,
  currentGuestCount,
  currentBudget,
  onClose,
  onSave
}: GuestCountModalProps) {
  const [guestCount, setGuestCount] = useState(currentGuestCount || 0);
  const [saving, setSaving] = useState(false);

  // Body scroll lock beim Öffnen des Modals
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const calculateBudgetPerPerson = () => {
    if (guestCount > 0 && currentBudget > 0) {
      return Math.round(currentBudget / guestCount);
    }
    return 0;
  };

  const calculateRealisticGuests = () => {
    if (currentBudget > 0) {
      const lower = Math.floor(currentBudget / 120);
      const upper = Math.floor(currentBudget / 100);
      return { lower, upper };
    }
    return { lower: 0, upper: 0 };
  };

  const calculateTotalCost = () => {
    if (guestCount > 0) {
      const lower = guestCount * 100;
      const upper = guestCount * 120;
      return { lower, upper };
    }
    return { lower: 0, upper: 0 };
  };

  const handleSave = async () => {
    if (guestCount <= 0) {
      alert('Bitte gib eine Gästezahl größer als 0 ein.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('weddings')
        .update({ guest_count: guestCount })
        .eq('id', weddingId);

      if (error) {
        logger.error('Error saving guest count', 'GuestCountModal', error);
        alert('Fehler beim Speichern der Gästezahl. Bitte versuche es erneut.');
      } else {
        logger.info(`Guest count saved: ${guestCount}`, 'GuestCountModal');
        onSave();
        onClose();
      }
    } catch (error) {
      logger.error('Error in handleSave', 'GuestCountModal', error);
      alert('Ein Fehler ist aufgetreten.');
    } finally {
      setSaving(false);
    }
  };

  const realisticGuests = calculateRealisticGuests();
  const perPerson = calculateBudgetPerPerson();
  const totalCost = calculateTotalCost();
  const isBudgetExceeded = currentBudget > 0 && guestCount > 0 && perPerson < 100;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden transition-opacity duration-300"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, opacity: 1 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-2xl w-full shadow-2xl border border-[#F5B800]/30 relative max-h-[90vh] flex flex-col"
        style={{
          maxWidth: 'min(900px, calc(100vw - 2rem))'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-[#f4d03f]/10 pointer-events-none rounded-2xl"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#d4af37]/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#f4d03f]/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse pointer-events-none"></div>
        {/* Header */}
        <div className="relative z-10 flex items-start gap-3 p-4 border-b border-gray-700/50 flex-shrink-0">
          <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-2.5 rounded-lg shadow-xl shadow-[#d4af37]/40">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">Gästezahl festlegen</h2>
            <p className="text-xs text-gray-400">
              Legt eure Ziel-Gästezahl basierend auf eurem Budget fest
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all hover:rotate-90 duration-300 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-100">
              <p className="font-medium mb-1">Dies ist eure Ziel-Gästezahl</p>
              <p>
                Sie bestimmt die Location-Größe und ist euer größter Kostenfaktor. Pro
                Person solltet ihr ca. 100-120 Euro einplanen. Die detaillierte Gästeliste
                pflegt ihr später im Gäste-Tab.
              </p>
            </div>
          </div>

          {/* Guest Count Input */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Ziel-Gästezahl<span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={guestCount || ''}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold placeholder-gray-400 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 outline-none transition-all"
                placeholder="z.B. 80"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium">
                Gäste
              </div>
            </div>
          </div>

          {/* Budget Calculator Helper */}
          {currentBudget > 0 && (
            <div className="bg-gradient-to-br from-[#d4af37]/10 to-[#c19a2e]/10 border border-[#d4af37]/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-[#d4af37]" />
                <h3 className="text-white font-semibold">Budget-basierter Rechner</h3>
              </div>

              <div className="space-y-3">
                {/* Realistic Guest Count based on Budget */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">
                    Bei <span className="text-white font-medium">{currentBudget.toLocaleString('de-DE')} €</span> Budget:
                  </span>
                  <span className="text-[#d4af37] font-semibold">
                    {realisticGuests.lower} - {realisticGuests.upper} Gäste realistisch
                  </span>
                </div>

                {guestCount > 0 && (
                  <>
                    <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
                      Rechnung: Pro Person ca. 100-120 € (Catering, Location, etc.)
                    </div>

                    {/* Cost per Person */}
                    <div className="flex items-center justify-between text-sm pt-3">
                      <span className="text-gray-300">
                        Bei <span className="text-white font-medium">{guestCount} Gästen</span>:
                      </span>
                      <span className={`font-semibold ${isBudgetExceeded ? 'text-orange-400' : 'text-[#d4af37]'}`}>
                        {perPerson > 0 ? `${perPerson} € pro Person` : 'Budget nicht festgelegt'}
                      </span>
                    </div>

                    {/* Total Cost Estimate */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">Geschätzte Gesamtkosten:</span>
                      <span className="text-white font-medium">
                        {totalCost.lower.toLocaleString('de-DE')} - {totalCost.upper.toLocaleString('de-DE')} €
                      </span>
                    </div>

                    {/* Warning if budget exceeded */}
                    {isBudgetExceeded && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mt-3">
                        <p className="text-xs text-orange-200">
                          ⚠️ Mit dieser Gästezahl könnte euer Budget knapp werden. Reduziert die
                          Gästezahl oder erhöht euer Budget.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* No Budget Warning */}
          {currentBudget === 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
              <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-100">
                <p className="font-medium mb-1">Budget noch nicht festgelegt</p>
                <p>
                  Legt zuerst euer Budget fest, um eine realistische Gästezahl zu berechnen.
                  Ihr könnt aber trotzdem eine Zielzahl festlegen.
                </p>
              </div>
            </div>
          )}

          {/* Quick Guest Count Suggestions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Schnellauswahl:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[30, 50, 80, 100, 120, 150, 200, 250].map((count) => (
                <button
                  key={count}
                  onClick={() => setGuestCount(count)}
                  className={`px-4 py-2.5 rounded-lg border transition-all ${
                    guestCount === count
                      ? 'bg-[#F5B800] border-[#F5B800] text-gray-900 font-medium'
                      : 'bg-[#1a3a5c]/50 border-gray-600 text-gray-300 hover:border-[#F5B800]/50 hover:bg-[#1a3a5c]'
                  }`}
                >
                  {count} Gäste
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-end gap-2 p-4 border-t border-gray-700/50 bg-[#0A1F3D]/50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-300 border border-gray-600/50 hover:bg-gray-700/30 transition-all duration-300"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || guestCount <= 0}
            className="px-5 py-2 rounded-lg text-sm bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#c19a2e] hover:to-[#d4af37] text-gray-900 font-semibold transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Speichern...</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Gästezahl festlegen</span>
                <span className="sm:hidden">Speichern</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
