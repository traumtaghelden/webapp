import { useState } from 'react';
import { Check, X, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ManualPaymentToggleProps {
  budgetItemId: string;
  isManuallyPaid: boolean;
  actualCost: number;
  estimatedCost: number;
  onUpdate: (isManuallyPaid: boolean) => void;
  compact?: boolean;
}

export default function ManualPaymentToggle({
  budgetItemId,
  isManuallyPaid,
  actualCost,
  estimatedCost,
  onUpdate,
  compact = false
}: ManualPaymentToggleProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const hasActualCost = actualCost > 0;
  const canToggle = hasActualCost;

  const handleToggle = async () => {
    if (!canToggle || isToggling) return;

    setIsToggling(true);
    const newValue = !isManuallyPaid;

    try {
      const { error } = await supabase
        .from('budget_items')
        .update({
          is_manually_paid: newValue,
          paid: newValue,
          payment_status: newValue ? 'paid' : 'planned'
        })
        .eq('id', budgetItemId);

      if (error) throw error;

      onUpdate(newValue);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Zahlungsstatus:', error);
      alert('Fehler beim Aktualisieren des Zahlungsstatus. Bitte versuche es erneut.');
    } finally {
      setIsToggling(false);
    }
  };

  

  const getTooltipText = () => {
    if (!hasActualCost) {
      return 'Tatsächliche Kosten müssen eingetragen sein, um diese Zahlung als bezahlt zu markieren.';
    }
    return isManuallyPaid
      ? 'Als geplant markieren'
      : 'Als bezahlt markieren';
  };

  if (compact) {
    return (
      <div className="relative inline-block">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          disabled={!canToggle || isToggling}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
            transition-all duration-200 ease-in-out
            ${isManuallyPaid
              ? 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100'
              : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100'
            }
            ${!canToggle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
            ${isToggling ? 'opacity-60' : ''}
          `}
          title={getTooltipText()}
        >
          {!hasActualCost ? (
            <Lock className="w-3.5 h-3.5" />
          ) : isManuallyPaid ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          <span>{isManuallyPaid ? 'Bezahlt' : 'Geplant'}</span>
        </button>

        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0a253c] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
            {getTooltipText()}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-[#0a253c]"></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl border-2 border-[#d4af37]/20">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">
              Zahlungsstatus
            </span>
            {!hasActualCost && (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <p className="text-xs text-gray-300">
            {!hasActualCost
              ? 'Trage zuerst die tatsächlichen Kosten ein'
              : isManuallyPaid
                ? 'Dieser Posten wurde als bezahlt markiert'
                : 'Markiere diesen Posten als bezahlt, sobald die Zahlung erfolgt ist'
            }
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={!canToggle || isToggling}
          className={`
            relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm
            transition-all duration-200 ease-in-out
            ${isManuallyPaid
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl hover:from-green-600 hover:to-green-700'
              : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400'
            }
            ${!canToggle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${isToggling ? 'opacity-60 scale-95' : 'hover:scale-105'}
          `}
        >
          {isManuallyPaid ? (
            <>
              <Check className="w-4 h-4" />
              <span>Bezahlt</span>
            </>
          ) : (
            <>
              <X className="w-4 h-4" />
              <span>Als bezahlt markieren</span>
            </>
          )}
        </button>
      </div>

      {!hasActualCost && (
        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg">
          <div className="w-5 h-5 flex items-center justify-center bg-yellow-400 rounded-full flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-yellow-300 mb-1">
              Tatsächliche Kosten erforderlich
            </p>
            <p className="text-xs text-yellow-200/80">
              Bitte trage zuerst die tatsächlichen Kosten für diesen Posten ein,
              bevor du ihn als bezahlt markieren kannst. Das hilft dir, den Überblick
              über deine Ausgaben zu behalten.
            </p>
          </div>
        </div>
      )}

      {isManuallyPaid && hasActualCost && (
        <div className="flex items-start gap-2 p-3 bg-green-500/10 border-2 border-green-500/30 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-5 h-5 flex items-center justify-center bg-green-500 rounded-full flex-shrink-0 mt-0.5">
            <Check className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-green-300 mb-1">
              Zahlung erfolgreich markiert
            </p>
            <p className="text-xs text-green-200/80">
              Dieser Posten wurde als bezahlt markiert.
              Du kannst den Status jederzeit wieder ändern.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
