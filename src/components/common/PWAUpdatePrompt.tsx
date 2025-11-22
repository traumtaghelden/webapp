import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { subscribeToUpdates, skipWaiting } from '../../utils/serviceWorker';

export default function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToUpdates(() => {
      setShowPrompt(true);
    });

    return unsubscribe;
  }, []);

  const handleUpdate = () => {
    skipWaiting();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-[#0a253c] to-[#1a3a5c] text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 min-w-[320px] max-w-[90vw]">
        <div className="p-2 bg-[#d4af37] rounded-lg">
          <RefreshCw className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Update verfügbar!</p>
          <p className="text-xs text-gray-300 mt-0.5">
            Eine neue Version ist bereit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-[#d4af37] hover:bg-[#c19a2e] text-[#0a253c] rounded-lg font-semibold text-sm transition-colors"
          >
            Aktualisieren
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
