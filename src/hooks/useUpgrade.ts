import { useState } from 'react';

export interface UseUpgradeReturn {
  showUpgrade: () => void;
  handleUpgrade: (priceId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useUpgrade(): UseUpgradeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const showUpgrade = () => {
    const event = new CustomEvent('navigate:premium');
    window.dispatchEvent(event);
  };

  const handleUpgrade = async (priceId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting upgrade with price ID:', priceId);
      showUpgrade();
    } catch (err) {
      console.error('Upgrade error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    showUpgrade,
    handleUpgrade,
    isLoading,
    error,
  };
}
