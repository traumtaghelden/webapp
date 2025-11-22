/**
 * Hero Journey Cache System
 * Implements intelligent caching for Hero Journey data with TTL and invalidation
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface StepStatusCache {
  vision: boolean;
  budget: boolean;
  guest_count: boolean;
  location: boolean;
  ceremony: boolean;
  date: boolean;
  personality: boolean;
  timeline: boolean;
  personal_planning: boolean;
  guest_planning: boolean;
}

class HeroJourneyCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Set cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cache entry if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if cache has valid entry
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all entries matching pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Cache step status for wedding
   */
  setStepStatus(weddingId: string, status: StepStatusCache): void {
    this.set(`step_status:${weddingId}`, status, 2 * 60 * 1000); // 2 minutes
  }

  /**
   * Get cached step status
   */
  getStepStatus(weddingId: string): StepStatusCache | null {
    return this.get<StepStatusCache>(`step_status:${weddingId}`);
  }

  /**
   * Cache recommendations
   */
  setRecommendations(weddingId: string, recommendations: any[]): void {
    this.set(`recommendations:${weddingId}`, recommendations, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Get cached recommendations
   */
  getRecommendations(weddingId: string): any[] | null {
    return this.get<any[]>(`recommendations:${weddingId}`);
  }

  /**
   * Cache analytics data
   */
  setAnalytics(weddingId: string, analytics: any): void {
    this.set(`analytics:${weddingId}`, analytics, 3 * 60 * 1000); // 3 minutes
  }

  /**
   * Get cached analytics
   */
  getAnalytics(weddingId: string): any | null {
    return this.get<any>(`analytics:${weddingId}`);
  }

  /**
   * Cache template data
   */
  setTemplates(templates: any[]): void {
    this.set('templates:all', templates, 30 * 60 * 1000); // 30 minutes (rarely changes)
  }

  /**
   * Get cached templates
   */
  getTemplates(): any[] | null {
    return this.get<any[]>('templates:all');
  }

  /**
   * Invalidate all wedding-specific cache
   */
  invalidateWedding(weddingId: string): void {
    this.invalidatePattern(new RegExp(`^.*:${weddingId}$`));
  }

  /**
   * Prefetch and cache common data
   */
  async prefetch(weddingId: string, fetchFn: () => Promise<void>): Promise<void> {
    // Check if we have recent cache
    const hasRecentCache =
      this.has(`step_status:${weddingId}`) &&
      this.has(`recommendations:${weddingId}`);

    if (!hasRecentCache) {
      await fetchFn();
    }
  }
}

// Singleton instance
export const heroJourneyCache = new HeroJourneyCache();

/**
 * Cache decorator for async functions
 */
export function cacheResult<T>(
  getCacheKey: (...args: any[]) => string,
  ttl?: number
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = getCacheKey(...args);
      const cached = heroJourneyCache.get<T>(cacheKey);

      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      heroJourneyCache.set(cacheKey, result, ttl);
      return result;
    };

    return descriptor;
  };
}

/**
 * Smart cache invalidation based on mutations
 */
export function invalidateOnMutation(patterns: string[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Invalidate related caches
      patterns.forEach(pattern => {
        heroJourneyCache.invalidatePattern(new RegExp(pattern));
      });

      return result;
    };

    return descriptor;
  };
}

/**
 * Local storage persistence for long-term cache
 */
export const persistentCache = {
  set<T>(key: string, data: T, expiryHours: number = 24): void {
    try {
      const item = {
        data,
        expiry: Date.now() + (expiryHours * 60 * 60 * 1000)
      };
      localStorage.setItem(`hj_cache:${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  },

  get<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(`hj_cache:${key}`);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      if (Date.now() > item.expiry) {
        localStorage.removeItem(`hj_cache:${key}`);
        return null;
      }

      return item.data as T;
    } catch (error) {
      console.warn('Failed to read persistent cache:', error);
      return null;
    }
  },

  clear(pattern?: string): void {
    try {
      const keys = Object.keys(localStorage).filter(key =>
        key.startsWith('hj_cache:') && (!pattern || key.includes(pattern))
      );
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear persistent cache:', error);
    }
  }
};
