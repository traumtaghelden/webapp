/**
 * Haptic Feedback Utility
 *
 * Provides haptic feedback for supported devices (iOS and some Android devices).
 * Falls back gracefully on unsupported devices.
 */

type HapticImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type HapticNotificationType = 'success' | 'warning' | 'error';

/**
 * Check if the device supports haptic feedback
 */
export function isHapticSupported(): boolean {
  // Check for iOS Haptic Engine
  if ('vibrate' in navigator) {
    return true;
  }

  // Check for modern Web Vibration API
  if ('vibrate' in navigator || 'mozVibrate' in navigator || 'webkitVibrate' in navigator) {
    return true;
  }

  return false;
}

/**
 * Trigger a simple vibration pattern
 * @param duration - Duration in milliseconds
 */
export function vibrate(duration: number | number[]): void {
  if (!isHapticSupported()) return;

  try {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  } catch (error) {
    console.warn('Vibration API not supported', error);
  }
}

/**
 * Trigger impact haptic feedback
 * @param style - Impact style (light, medium, heavy, rigid, soft)
 */
export function impactHaptic(style: HapticImpactStyle = 'medium'): void {
  if (!isHapticSupported()) return;

  const patterns: Record<HapticImpactStyle, number> = {
    light: 10,
    medium: 20,
    heavy: 30,
    rigid: 15,
    soft: 8,
  };

  vibrate(patterns[style]);
}

/**
 * Trigger notification haptic feedback
 * @param type - Notification type (success, warning, error)
 */
export function notificationHaptic(type: HapticNotificationType): void {
  if (!isHapticSupported()) return;

  const patterns: Record<HapticNotificationType, number[]> = {
    success: [10, 50, 10],      // Short-pause-short
    warning: [20, 100, 20],     // Medium-pause-medium
    error: [30, 50, 30, 50, 30] // Heavy pattern
  };

  vibrate(patterns[type]);
}

/**
 * Trigger selection haptic feedback (for UI interactions)
 */
export function selectionHaptic(): void {
  if (!isHapticSupported()) return;
  vibrate(5);
}

/**
 * Trigger a custom haptic pattern
 * @param pattern - Array of durations in milliseconds [vibrate, pause, vibrate, pause, ...]
 */
export function customHaptic(pattern: number[]): void {
  if (!isHapticSupported()) return;
  vibrate(pattern);
}

/**
 * React hook-friendly haptic trigger
 */
export const haptics = {
  light: () => impactHaptic('light'),
  medium: () => impactHaptic('medium'),
  heavy: () => impactHaptic('heavy'),
  rigid: () => impactHaptic('rigid'),
  soft: () => impactHaptic('soft'),
  success: () => notificationHaptic('success'),
  warning: () => notificationHaptic('warning'),
  error: () => notificationHaptic('error'),
  selection: () => selectionHaptic(),
};
