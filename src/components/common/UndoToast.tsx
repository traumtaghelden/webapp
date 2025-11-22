import { useEffect, useState } from 'react';
import { Undo2, Check } from 'lucide-react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  duration?: number;
  onComplete?: () => void;
}

export default function UndoToast({ message, onUndo, duration = 5000, onComplete }: UndoToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 50));
        if (newProgress <= 0) {
          clearInterval(interval);
          handleComplete();
          return 0;
        }
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  const handleUndo = () => {
    setIsVisible(false);
    onUndo();
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete?.();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom duration-300">
      <div className="bg-[#0a253c] text-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-4 min-w-[300px] max-w-[90vw]">
        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
        <span className="text-sm font-medium flex-1">{message}</span>
        <button
          onClick={handleUndo}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#d4af37] hover:bg-[#c19a2e] text-[#0a253c] rounded-full font-semibold text-sm transition-colors whitespace-nowrap"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Rückgängig
        </button>
      </div>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#d4af37] transition-all ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
