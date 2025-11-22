import { RefreshCw } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  isThresholdReached: boolean;
  progress: number;
}

export default function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  isThresholdReached,
  progress,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const rotation = progress * 360;
  const scale = Math.min(progress * 1.2, 1);
  const opacity = Math.min(progress * 1.5, 1);

  return (
    <div
      className="fixed top-0 left-0 right-0 flex justify-center z-50 pointer-events-none transition-transform duration-200"
      style={{
        transform: `translateY(${pullDistance}px)`,
      }}
    >
      <div
        className={`mt-4 p-4 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] shadow-gold transition-all duration-200 ${
          isThresholdReached ? 'scale-110' : ''
        }`}
        style={{
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        <RefreshCw
          className={`w-6 h-6 text-white ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          style={{
            transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
            transition: isRefreshing ? undefined : 'transform 0.2s',
          }}
        />
      </div>

      {isThresholdReached && !isRefreshing && (
        <div className="absolute top-20 text-center animate-fade-in">
          <p className="text-sm font-semibold text-[#d4af37] drop-shadow-md">
            Loslassen zum Aktualisieren
          </p>
        </div>
      )}
    </div>
  );
}
