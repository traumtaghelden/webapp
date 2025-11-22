import { Lock, Trash2, Crown, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useUpgrade } from '../hooks/useUpgrade';

export default function ReadOnlyBanner() {
  const { accountStatus, deletionScheduledAt, isLoading } = useSubscription();
  const { showUpgrade } = useUpgrade();
  const [isClosed, setIsClosed] = useState(false);

  // Banner ist beim App-Start immer sichtbar (kein LocalStorage-Check)

  const closeBanner = () => {
    setIsClosed(true);
    // Banner nur für diese Session schließen (kein LocalStorage)
  };

  if (isLoading || isClosed) return null;

  if (accountStatus !== 'trial_expired' && accountStatus !== 'premium_cancelled') return null;

  const deletionDate = deletionScheduledAt ? new Date(deletionScheduledAt) : null;
  const daysUntilDeletion = deletionDate
    ? Math.max(0, Math.ceil((deletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-[0_-4px_12px_rgba(0,0,0,0.3)] relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>

      <div className="relative max-w-7xl mx-auto">
        {/* Mobile: Ultra-kompakte Ansicht */}
        <div className="lg:hidden px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="bg-white/30 p-1.5 rounded backdrop-blur-sm flex-shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm block truncate">Read-Only Modus</span>
                {deletionDate && daysUntilDeletion > 0 && (
                  <span className="text-xs opacity-90 block truncate">
                    Löschung in {daysUntilDeletion} {daysUntilDeletion === 1 ? 'Tag' : 'Tagen'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={showUpgrade}
                className="bg-white hover:bg-gray-100 text-red-600 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-all shadow-lg"
              >
                <Crown className="w-3 h-3" />
                Upgrade
              </button>
              <button
                onClick={closeBanner}
                className="bg-white/30 hover:bg-white/40 text-white p-1 rounded transition-all"
                aria-label="Banner schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop: Volle Ansicht */}
        <div className="hidden lg:block px-6 py-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm flex-shrink-0">
              <Lock className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-lg">
                  Account im Read-Only Modus
                </h3>
                <button
                  onClick={closeBanner}
                  className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-all flex-shrink-0"
                  aria-label="Banner schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm opacity-90 mb-3">
                Deine Testphase ist abgelaufen. Du kannst deine Daten noch ansehen, aber keine Änderungen mehr vornehmen.
              </p>

              {deletionDate && daysUntilDeletion > 0 && (
                <div className="bg-red-800/50 rounded-lg p-3 mb-3 flex items-center gap-3">
                  <Trash2 className="w-5 h-5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-semibold">Achtung:</span> Deine Daten werden in{' '}
                    <span className="font-bold">{daysUntilDeletion} Tagen</span> automatisch gelöscht.
                    Upgrade jetzt, um deine gesamte Hochzeitsplanung zu behalten!
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-sm flex-1">
              <p className="font-semibold mb-2">Mit Premium behältst du:</p>
              <ul className="list-disc list-inside opacity-90 space-y-1">
                <li>Vollen Zugriff auf alle deine Daten</li>
                <li>Unbegrenzte Gäste, Budget-Einträge & mehr</li>
                <li>Alle Premium-Features</li>
              </ul>
            </div>

            <button
              onClick={showUpgrade}
              className="bg-white hover:bg-gray-100 text-red-600 px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Crown className="w-5 h-5" />
              Jetzt Premium holen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
