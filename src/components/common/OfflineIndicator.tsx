import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useEffect, useState } from 'react';

export default function OfflineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top duration-300 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Verbindung wiederhergestellt</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Keine Internetverbindung</span>
        </>
      )}
    </div>
  );
}
