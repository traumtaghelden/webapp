import { useEffect, useRef, useState, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  keyExtractor: (item: T, index: number) => string;
}

export default function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  keyExtractor,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length - 1, startIndex + visibleItemCount + overscan * 2);

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      className="virtual-list-container"
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <div
                key={keyExtractor(item, actualIndex)}
                style={{
                  height: itemHeight,
                  overflow: 'hidden',
                }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface DynamicVirtualListProps<T> {
  items: T[];
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  estimatedItemHeight?: number;
  overscan?: number;
  keyExtractor: (item: T, index: number) => string;
}

export function DynamicVirtualList<T>({
  items,
  containerHeight,
  renderItem,
  estimatedItemHeight = 80,
  overscan = 3,
  keyExtractor,
}: DynamicVirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const newHeights = new Map(itemHeights);
      let hasChanges = false;

      entries.forEach((entry) => {
        const index = parseInt(entry.target.getAttribute('data-index') || '-1');
        if (index >= 0) {
          const height = entry.contentRect.height;
          if (newHeights.get(index) !== height) {
            newHeights.set(index, height);
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        setItemHeights(newHeights);
      }
    });

    itemRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items.length]);

  const getItemOffset = useCallback(
    (index: number) => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += itemHeights.get(i) || estimatedItemHeight;
      }
      return offset;
    },
    [itemHeights, estimatedItemHeight]
  );

  const getTotalHeight = useCallback(() => {
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += itemHeights.get(i) || estimatedItemHeight;
    }
    return height;
  }, [items.length, itemHeights, estimatedItemHeight]);

  const findStartIndex = useCallback(() => {
    let index = 0;
    let offset = 0;

    while (index < items.length && offset < scrollTop) {
      offset += itemHeights.get(index) || estimatedItemHeight;
      index++;
    }

    return Math.max(0, index - overscan);
  }, [scrollTop, items.length, itemHeights, estimatedItemHeight, overscan]);

  const startIndex = findStartIndex();
  let endIndex = startIndex;
  let currentOffset = getItemOffset(startIndex);

  while (endIndex < items.length && currentOffset < scrollTop + containerHeight + (estimatedItemHeight * overscan)) {
    currentOffset += itemHeights.get(endIndex) || estimatedItemHeight;
    endIndex++;
  }

  endIndex = Math.min(items.length - 1, endIndex);

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = getItemOffset(startIndex);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      className="dynamic-virtual-list-container"
    >
      <div
        style={{
          height: getTotalHeight(),
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <div
                key={keyExtractor(item, actualIndex)}
                data-index={actualIndex}
                ref={(el) => {
                  if (el) {
                    itemRefs.current.set(actualIndex, el);
                  } else {
                    itemRefs.current.delete(actualIndex);
                  }
                }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
