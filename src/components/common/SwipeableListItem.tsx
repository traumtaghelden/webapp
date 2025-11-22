import { useState, useRef } from 'react';
import { Trash2, Archive, Edit } from 'lucide-react';
import { haptics } from '../../utils/hapticFeedback';

interface SwipeAction {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
  onAction: () => void;
}

interface SwipeableListItemProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  customActions?: SwipeAction[];
  disabled?: boolean;
}

export default function SwipeableListItem({
  children,
  onDelete,
  onEdit,
  onArchive,
  customActions,
  disabled = false,
}: SwipeableListItemProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const startTimeRef = useRef(0);

  const swipeThreshold = 80; // px to trigger action
  const maxSwipeDistance = 120; // px maximum swipe

  // Build actions array
  const leftActions: SwipeAction[] = customActions?.filter((_, i) => i % 2 === 0) || [];
  const rightActions: SwipeAction[] = [];

  if (onEdit) {
    rightActions.push({
      icon: Edit,
      label: 'Bearbeiten',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      onAction: onEdit,
    });
  }

  if (onArchive) {
    rightActions.push({
      icon: Archive,
      label: 'Archivieren',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500',
      onAction: onArchive,
    });
  }

  if (onDelete) {
    rightActions.push({
      icon: Trash2,
      label: 'Löschen',
      color: 'text-red-600',
      bgColor: 'bg-red-500',
      onAction: onDelete,
    });
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    startTimeRef.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;

    // Apply resistance at the edges
    let newOffset = diff;
    if (Math.abs(diff) > maxSwipeDistance) {
      const excess = Math.abs(diff) - maxSwipeDistance;
      newOffset = diff > 0
        ? maxSwipeDistance + excess * 0.2
        : -(maxSwipeDistance + excess * 0.2);
    }

    setOffsetX(newOffset);
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;

    const swipeTime = Date.now() - startTimeRef.current;
    const isFastSwipe = swipeTime < 300;

    // Determine action based on swipe direction and distance
    if (Math.abs(offsetX) > swipeThreshold || isFastSwipe) {
      if (offsetX < -swipeThreshold && rightActions.length > 0) {
        // Swipe left - trigger first right action
        haptics.medium();
        const actionIndex = Math.min(
          Math.floor(Math.abs(offsetX) / swipeThreshold) - 1,
          rightActions.length - 1
        );
        rightActions[actionIndex].onAction();
      } else if (offsetX > swipeThreshold && leftActions.length > 0) {
        // Swipe right - trigger first left action
        haptics.medium();
        const actionIndex = Math.min(
          Math.floor(offsetX / swipeThreshold) - 1,
          leftActions.length - 1
        );
        leftActions[actionIndex].onAction();
      }
    } else {
      haptics.selection();
    }

    // Reset
    setOffsetX(0);
    setIsDragging(false);
    setStartX(0);
  };

  const progress = Math.min(Math.abs(offsetX) / swipeThreshold, 1);
  const isThresholdReached = Math.abs(offsetX) > swipeThreshold;

  return (
    <div className="relative overflow-hidden">
      {/* Left Actions (Swipe Right) */}
      {leftActions.length > 0 && (
        <div
          className="absolute top-0 left-0 bottom-0 flex items-center"
          style={{
            width: `${Math.abs(offsetX)}px`,
            opacity: progress,
          }}
        >
          {leftActions.map((action, index) => {
            const Icon = action.icon;
            const isVisible = offsetX > swipeThreshold * (index + 1);
            return (
              <div
                key={index}
                className={`flex-1 h-full flex flex-col items-center justify-center ${action.bgColor} transition-all duration-200 ${
                  isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-50'
                }`}
              >
                <Icon className="w-6 h-6 text-white mb-1" />
                <span className="text-xs text-white font-semibold">{action.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Right Actions (Swipe Left) */}
      {rightActions.length > 0 && (
        <div
          className="absolute top-0 right-0 bottom-0 flex items-center"
          style={{
            width: `${Math.abs(offsetX)}px`,
            opacity: progress,
          }}
        >
          {rightActions.map((action, index) => {
            const Icon = action.icon;
            const isVisible = Math.abs(offsetX) > swipeThreshold * (index + 1);
            return (
              <div
                key={index}
                className={`flex-1 h-full flex flex-col items-center justify-center ${action.bgColor} transition-all duration-200 ${
                  isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-50'
                }`}
              >
                <Icon className="w-6 h-6 text-white mb-1" />
                <span className="text-xs text-white font-semibold">{action.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <div
        className={`relative bg-white transition-shadow duration-200 ${
          isThresholdReached ? 'shadow-lg' : ''
        }`}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
