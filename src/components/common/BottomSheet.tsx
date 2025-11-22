import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { disableBodyScroll, enableBodyScroll } from '../../utils/scrollLockManager';
import { haptics } from '../../utils/hapticFeedback';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[]; // Array of percentages [25, 50, 90]
  defaultSnap?: number; // Default snap point index
  showHandle?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [90],
  defaultSnap = 0,
  showHandle = true,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      disableBodyScroll();
      setCurrentSnap(defaultSnap);
    } else {
      enableBodyScroll();
    }

    return () => {
      if (isOpen) {
        enableBodyScroll();
      }
    };
  }, [isOpen, defaultSnap]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    const diff = currentY - startY;
    const threshold = 100; // px

    if (diff > threshold) {
      // Swipe down
      if (currentSnap < snapPoints.length - 1) {
        // Go to next lower snap point
        setCurrentSnap(currentSnap + 1);
        haptics.light();
      } else {
        // Close sheet
        haptics.light();
        onClose();
      }
    } else if (diff < -threshold) {
      // Swipe up
      if (currentSnap > 0) {
        // Go to next higher snap point
        setCurrentSnap(currentSnap - 1);
        haptics.light();
      }
    }

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  if (!isOpen) return null;

  const currentHeight = snapPoints[currentSnap];
  const dragOffset = isDragging ? Math.max(0, currentY - startY) : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] animate-fade-in lg:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-[#0a253c] to-[#1a3a5c] rounded-t-3xl shadow-2xl z-[100] lg:hidden"
        style={{
          height: `${currentHeight}vh`,
          transform: isDragging ? `translateY(${dragOffset}px)` : undefined,
          transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Handle */}
        {showHandle && (
          <div
            className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-12 h-1.5 bg-white/30 rounded-full" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pt-8 pb-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Schließen"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto h-full px-6 py-4" style={{ maxHeight: `calc(${currentHeight}vh - 100px)` }}>
          {children}
        </div>
      </div>
    </>
  );
}
