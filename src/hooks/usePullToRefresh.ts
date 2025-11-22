import { useState, useCallback, useRef, useEffect } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPullDistance?: number;
  resistance?: number;
  enabled?: boolean; // NEW: Allow disabling completely
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  isThresholdReached: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 120,
  maxPullDistance = 180,
  resistance = 3.5,
  enabled = false, // DISABLED BY DEFAULT to prevent accidental triggers
}: UsePullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    isThresholdReached: false,
  });

  const touchStartY = useRef<number | null>(null);
  const scrollableElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Detect the scrollable element (usually body or a container)
    scrollableElement.current = document.getElementById('main-content') || document.body;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start pull if we're at the top of the page AND scrolling down
    const element = scrollableElement.current;
    const scrollTop = element ? element.scrollTop : window.pageYOffset || document.documentElement.scrollTop;

    // Must be exactly at top (with small tolerance)
    if (scrollTop <= 1) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (touchStartY.current === null || state.isRefreshing) return;

    const element = scrollableElement.current;
    const scrollTop = element ? element.scrollTop : window.pageYOffset || document.documentElement.scrollTop;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    // CRITICAL: Only activate if:
    // 1. Pulling DOWN (diff > 0)
    // 2. At the EXACT top (scrollTop <= 1)
    // 3. Pull distance is significant (> 10px to avoid accidental triggers)
    if (diff > 10 && scrollTop <= 1) {
      // Apply resistance to the pull
      const resistedDistance = Math.min(diff / resistance, maxPullDistance);

      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance: resistedDistance,
        isThresholdReached: resistedDistance >= threshold,
      }));

      // Prevent default scrolling behavior when pulling
      if (resistedDistance > 10) {
        e.preventDefault();
      }
    } else if (diff < 0 || scrollTop > 1) {
      // Scrolling up or not at top - cancel pull
      if (state.isPulling) {
        setState(prev => ({
          ...prev,
          isPulling: false,
          pullDistance: 0,
          isThresholdReached: false,
        }));
      }
    }
  }, [state.isRefreshing, state.isPulling, threshold, maxPullDistance, resistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!state.isPulling || state.isRefreshing) {
      touchStartY.current = null;
      return;
    }

    const shouldRefresh = state.isThresholdReached;

    if (shouldRefresh) {
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        isPulling: false,
      }));

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0,
          isThresholdReached: false,
        });
      }
    } else {
      setState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
        isThresholdReached: false,
      });
    }

    touchStartY.current = null;
  }, [state.isPulling, state.isThresholdReached, state.isRefreshing, onRefresh]);

  // Attach and detach event listeners
  useEffect(() => {
    // Don't attach listeners if disabled
    if (!enabled) return;

    const element = scrollableElement.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const getProgress = useCallback(() => {
    return Math.min(state.pullDistance / threshold, 1);
  }, [state.pullDistance, threshold]);

  return {
    ...state,
    progress: getProgress(),
  };
}
