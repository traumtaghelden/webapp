import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { X, DollarSign, Info, Calculator } from 'lucide-react';
import { logger } from '../../utils/logger';

interface BudgetDefinitionModalProps {
  weddingId: string;
  currentBudget: number;
  currentGuestCount: number;
  onClose: () => void;
  onSave: () => void;
}

export default function BudgetDefinitionModal({
  weddingId,
  currentBudget,
  currentGuestCount,
  onClose,
  onSave
}: BudgetDefinitionModalProps) {
  const [budget, setBudget] = useState(currentBudget || 0);
  const [saving, setSaving] = useState(false);

  // Body scroll lock beim Öffnen des Modals
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const calculatePerPerson = () => {
    if (budget > 0 && currentGuestCount > 0) {
      return Math.round(budget / currentGuestCount);
    }
    return 0;
  };

  const calculateGuestEstimate = () => {
    if (budget > 0) {
      const lower = Math.floor(budget / 120);
      const upper = Math.floor(budget / 100);
      return { lower, upper };
    }
    return { lower: 0, upper: 0 };
  };

  const handleSave = async () => {
    if (budget <= 0) {
      alert('Bitte gib ein Budget größer als 0 Euro ein.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('weddings')
        .update({ total_budget: budget })
        .eq('id', weddingId);

      if (error) {
        logger.error('Error saving budget', 'BudgetDefinitionModal', error);
        alert('Fehler beim Speichern des Budgets. Bitte versuche es erneut.');
      } else {
        logger.info(`Budget saved: ${budget}`, 'BudgetDefinitionModal');
        onSave();
        onClose();
      }
    } catch (error) {
      logger.error('Error in handleSave', 'BudgetDefinitionModal', error);
      alert('Ein Fehler ist aufgetreten.');
    } finally {
      setSaving(false);
    }
  };

  const guestEstimate = calculateGuestEstimate();
  const perPerson = calculatePerPerson();

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
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">Budget definieren</h2>
            <p className="text-xs text-gray-400">
              Legt eure absolute Budget-Obergrenze fest
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
              <p className="font-medium mb-1">Diese Zahl ist eure finanzielle Basis</p>
              <p>
                Sie hilft euch bei allen weiteren Entscheidungen: Gästezahl, Location,
                Dienstleister. Die detaillierte Budget-Planung erfolgt später im Budget-Tab.
              </p>
            </div>
          </div>

          {/* Budget Input */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Gesamtbudget<span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="100"
                value={budget || ''}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold placeholder-gray-400 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 outline-none transition-all"
                placeholder="z.B. 15000"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium">
                €
              </div>
            </div>
          </div>

          {/* Budget Calculator Helper */}
          {budget > 0 && (
            <div className="bg-gradient-to-br from-[#d4af37]/10 to-[#c19a2e]/10 border border-[#d4af37]/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-[#d4af37]" />
                <h3 className="text-white font-semibold">Budget-Kalkulation</h3>
              </div>

              <div className="space-y-3">
                {/* Guest Estimate */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">
                    Bei <span className="text-white font-medium">{budget.toLocaleString('de-DE')} €</span> sind möglich:
                  </span>
                  <span className="text-[#d4af37] font-semibold">
                    {guestEstimate.lower} - {guestEstimate.upper} Gäste
                  </span>
                </div>

                <div className="text-xs text-gray-400">
                  Rechnung: Pro Person ca. 100-120 € (Catering, Location, etc.)
                </div>

                {/* Per Person Cost if guest count is set */}
                {currentGuestCount > 0 && (
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-700">
                    <span className="text-gray-300">
                      Bei <span className="text-white font-medium">{currentGuestCount} Gästen</span>:
                    </span>
                    <span className="text-[#d4af37] font-semibold">
                      {perPerson} € pro Person
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Budget Suggestions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Schnellauswahl:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBudget(amount)}
                  className={`px-4 py-2.5 rounded-lg border transition-all ${
                    budget === amount
                      ? 'bg-[#F5B800] border-[#F5B800] text-gray-900 font-medium'
                      : 'bg-[#1a3a5c]/50 border-gray-600 text-gray-300 hover:border-[#F5B800]/50 hover:bg-[#1a3a5c]'
                  }`}
                >
                  {amount.toLocaleString('de-DE')} €
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
            disabled={saving || budget <= 0}
            className="px-5 py-2 rounded-lg text-sm bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#c19a2e] hover:to-[#d4af37] text-gray-900 font-semibold transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Speichern...</span>
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Budget festlegen</span>
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
