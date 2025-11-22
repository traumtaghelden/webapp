import { useCallback, useRef, useState } from 'react';
import { haptics } from '../utils/hapticFeedback';

interface UseLongPressOptions {
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void;
  onClick?: (e: React.TouchEvent | React.MouseEvent) => void;
  delay?: number; // milliseconds
  shouldPreventDefault?: boolean;
  enableHaptic?: boolean;
}

interface LongPressHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  // Note: isLongPressing should not be spread on DOM elements
  // Extract it separately when using this hook
}

interface UseLongPressReturn extends LongPressHandlers {
  isLongPressing: boolean;
}

export function useLongPress({
  onLongPress,
  onClick,
  delay = 500,
  shouldPreventDefault = true,
  enableHaptic = true,
}: UseLongPressOptions): UseLongPressReturn {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const isLongPressRef = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (shouldPreventDefault) {
      e.preventDefault();
    }

    // Store start position
    if ('touches' in e) {
      startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      startPos.current = { x: e.clientX, y: e.clientY };
    }

    isLongPressRef.current = false;
    setIsLongPressing(true);

    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (enableHaptic) {
        haptics.medium();
      }
      onLongPress(e);
    }, delay);
  }, [onLongPress, delay, shouldPreventDefault, enableHaptic]);

  const clear = useCallback((e: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsLongPressing(false);

    // Trigger onClick only if it wasn't a long press and onClick is defined
    if (shouldTriggerClick && !isLongPressRef.current && onClick) {
      onClick(e);
      if (enableHaptic) {
        haptics.light();
      }
    }

    isLongPressRef.current = false;
    startPos.current = null;
  }, [onClick, enableHaptic]);

  const move = useCallback((e: React.TouchEvent) => {
    // Cancel long press if finger moves too much
    if (startPos.current && timerRef.current) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = Math.abs(currentX - startPos.current.x);
      const diffY = Math.abs(currentY - startPos.current.y);

      // Cancel if moved more than 10px
      if (diffX > 10 || diffY > 10) {
        clearTimeout(timerRef.current);
        setIsLongPressing(false);
        startPos.current = null;
      }
    }
  }, []);

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
    onTouchMove: (e: React.TouchEvent) => move(e),
    isLongPressing,
  };
}
