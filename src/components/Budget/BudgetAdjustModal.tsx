import { useState, useEffect } from 'react';
import { DollarSign, Save, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import StandardModal, { ModalFooter, ModalButton } from '../StandardModal';

interface BudgetAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  weddingId: string;
  currentBudget: number;
  onSuccess: () => void;
}

export default function BudgetAdjustModal({
  isOpen,
  onClose,
  weddingId,
  currentBudget,
  onSuccess,
}: BudgetAdjustModalProps) {
  const [newBudget, setNewBudget] = useState(currentBudget.toString());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewBudget(currentBudget.toString());
    }
  }, [isOpen, currentBudget]);

  const handleSave = async () => {
    const budgetValue = parseFloat(newBudget);

    if (isNaN(budgetValue) || budgetValue < 0) {
      alert('Bitte gib einen gültigen Betrag ein');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('weddings')
        .update({ budget: budgetValue })
        .eq('id', weddingId);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('Fehler beim Speichern des Budgets');
    } finally {
      setIsSaving(false);
    }
  };

  const budgetValue = parseFloat(newBudget) || 0;
  const difference = budgetValue - currentBudget;
  const percentageChange = currentBudget > 0 ? (difference / currentBudget) * 100 : 0;

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Budget anpassen"
      subtitle="Trage dein Gesamtbudget ein"
      icon={DollarSign}
      maxWidth="lg"
      footer={
        <ModalFooter>
          <ModalButton variant="secondary" onClick={onClose} disabled={isSaving}>
            Abbrechen
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || isNaN(budgetValue) || budgetValue < 0}
            icon={Save}
          >
            {isSaving ? 'Wird gespeichert...' : 'Budget speichern'}
          </ModalButton>
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        {/* Aktuelles Budget */}
        <div className="bg-white/10 rounded-xl p-5 border-2 border-[#d4af37]/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white/70">Aktuelles Budget</span>
            <span className="text-2xl font-bold text-white">
              {currentBudget.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
            </span>
          </div>
        </div>

        {/* Neues Budget Input */}
        <div>
          <label className="block text-sm font-bold text-white/90 mb-3">
            Neues Gesamtbudget*
          </label>
          <div className="relative">
            <input
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              className="w-full px-5 py-4 pr-14 text-3xl font-bold text-white rounded-xl border-2 border-[#d4af37]/30 bg-white/10 placeholder-white/30 focus:border-[#d4af37] focus:outline-none transition-all backdrop-blur-sm"
              placeholder="0.00"
              step="0.01"
              min="0"
              autoFocus
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-white/60">
              €
            </span>
          </div>
        </div>

        {/* Änderungsvorschau */}
        {difference !== 0 && !isNaN(budgetValue) && (
          <div className={`p-5 rounded-xl border-2 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
            difference > 0
              ? 'bg-green-500/20 border-green-400/50'
              : 'bg-red-500/20 border-red-400/50'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {difference > 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-400" />
                )}
                <span className="text-sm font-semibold text-white/70">Änderung</span>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${
                  difference > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {difference > 0 ? '+' : ''}{difference.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                </span>
                <p className={`text-sm font-semibold ${
                  difference > 0 ? 'text-green-400/70' : 'text-red-400/70'
                }`}>
                  {difference > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  difference > 0 ? 'bg-green-400' : 'bg-red-400'
                }`}
                style={{ width: `${Math.min(Math.abs(percentageChange), 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Tipp */}
        <div className="bg-blue-500/20 border-2 border-blue-400/50 rounded-xl p-4 backdrop-blur-sm">
          <p className="text-sm text-blue-200">
            <span className="font-bold text-white">💡 Tipp:</span> Dein Gesamtbudget sollte alle geplanten Ausgaben
            für deine Hochzeit umfassen. Du kannst es jederzeit anpassen.
          </p>
        </div>

        {/* Validierungs-Fehler */}
        {(isNaN(budgetValue) || budgetValue < 0) && newBudget !== '' && (
          <div className="bg-red-500/20 border-2 border-red-400/50 rounded-xl p-4 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
            <p className="text-sm text-red-200">
              <span className="font-bold text-white">⚠️ Fehler:</span> Bitte gib einen gültigen positiven Betrag ein.
            </p>
          </div>
        )}
      </div>
    </StandardModal>
  );
}
