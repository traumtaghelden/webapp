class ImageCache {
  private cache: Map<string, string> = new Map();
  private loadingPromises: Map<string, Promise<string>> = new Map();
  private maxCacheSize = 50;

  async loadImage(url: string): Promise<string> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const promise = this.fetchAndCacheImage(url);
    this.loadingPromises.set(url, promise);

    try {
      const cachedUrl = await promise;
      this.loadingPromises.delete(url);
      return cachedUrl;
    } catch (error) {
      this.loadingPromises.delete(url);
      throw error;
    }
  }

  private async fetchAndCacheImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.addToCache(url, url);
        resolve(url);
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });
  }

  private addToCache(key: string, value: string) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  preloadImages(urls: string[]): Promise<string[]> {
    return Promise.all(urls.map((url) => this.loadImage(url)));
  }

  clear() {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  remove(url: string) {
    this.cache.delete(url);
    this.loadingPromises.delete(url);
  }

  has(url: string): boolean {
    return this.cache.has(url);
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const imageCache = new ImageCache();

export function useImagePreload(urls: string[]) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    imageCache
      .preloadImages(urls)
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [urls]);

  return { isLoading, error };
}

export function optimizeImageUrl(url: string, width?: number, quality = 80): string {
  if (!url) return url;

  if (url.includes('supabase')) {
    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    params.append('quality', quality.toString());
    return `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
  }

  return url;
}

export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
}
