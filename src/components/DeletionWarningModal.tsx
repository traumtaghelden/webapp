import { useState, useEffect } from 'react';
import { AlertTriangle, Crown, X, Calendar, Trash2 } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useUpgrade } from '../hooks/useUpgrade';

export default function DeletionWarningModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { accountStatus, deletionScheduledAt, isLoading } = useSubscription();
  const { showUpgrade } = useUpgrade();

  useEffect(() => {
    if (isLoading) return;

    if (accountStatus !== 'trial_expired' && accountStatus !== 'premium_cancelled') {
      setIsOpen(false);
      return;
    }

    if (!deletionScheduledAt) return;

    const deletionDate = new Date(deletionScheduledAt);
    const daysUntilDeletion = Math.ceil((deletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (daysUntilDeletion <= 7 && daysUntilDeletion > 0) {
      const hasSeenWarning = localStorage.getItem('deletion_warning_seen');
      const lastSeenDate = hasSeenWarning ? new Date(hasSeenWarning) : null;
      const daysSinceLastSeen = lastSeenDate
        ? Math.floor((Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceLastSeen >= 1) {
        setIsOpen(true);
      }
    }
  }, [accountStatus, deletionScheduledAt, isLoading]);

  const handleClose = () => {
    localStorage.setItem('deletion_warning_seen', new Date().toISOString());
    setIsOpen(false);
  };

  const handleUpgrade = () => {
    handleClose();
    showUpgrade();
  };

  if (!isOpen || isLoading) return null;

  const deletionDate = deletionScheduledAt ? new Date(deletionScheduledAt) : null;
  const daysUntilDeletion = deletionDate
    ? Math.max(0, Math.ceil((deletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 text-white">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Deine Daten werden bald gelöscht!</h2>
              <p className="text-sm opacity-90 mt-1">Handle jetzt, um deine Hochzeitsplanung zu retten</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-red-100 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-bold text-red-900">
                Automatische Löschung in {daysUntilDeletion} {daysUntilDeletion === 1 ? 'Tag' : 'Tagen'}
              </h3>
            </div>

            <div className="space-y-3 text-sm text-red-800">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  <span className="font-semibold">Löschtermin:</span>{' '}
                  {deletionDate?.toLocaleDateString('de-DE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="bg-red-200/50 rounded-lg p-3 mt-3">
                <p className="font-semibold mb-2">Folgende Daten werden unwiderruflich gelöscht:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Alle Gäste und Gästelisten</li>
                  <li>Komplettes Budget und alle Ausgaben</li>
                  <li>Alle Aufgaben und To-Dos</li>
                  <li>Timeline und Zeitpläne</li>
                  <li>Dienstleister-Informationen</li>
                  <li>Locations und Veranstaltungsorte</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
            <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Rette deine Daten mit Premium
            </h3>

            <div className="space-y-2 text-sm text-green-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Sofortiger Zugriff auf alle deine Daten</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Keine Limits für Gäste, Budget, Aufgaben & mehr</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Alle Premium-Features inklusive</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Jederzeit kündbar</span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-green-900">29,99€</span>
                <span className="text-gray-600">/ Monat</span>
              </div>
              <p className="text-xs text-gray-600">Keine versteckten Kosten. Jederzeit kündbar.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              Später erinnern
            </button>
            <button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#f4d03f] hover:to-[#d4af37] text-gray-900 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              <Crown className="w-5 h-5" />
              Jetzt Premium holen
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Diese Warnung wird täglich angezeigt, bis du upgradest oder die Daten gelöscht werden.
          </p>
        </div>
      </div>
    </div>
  );
}
