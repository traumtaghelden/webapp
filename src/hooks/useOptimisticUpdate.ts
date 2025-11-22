import { useState, useCallback } from 'react';

export interface OptimisticUpdate<T> {
  optimisticData: T;
  rollback: () => void;
  commit: () => void;
}

export function useOptimisticUpdate<T>(
  initialData: T,
  onUpdate: (data: T) => Promise<void>
) {
  const [data, setData] = useState<T>(initialData);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [previousData, setPreviousData] = useState<T | null>(null);

  const applyOptimisticUpdate = useCallback(
    async (newData: T, updateFn?: () => Promise<void>) => {
      setPreviousData(data);
      setData(newData);
      setIsOptimistic(true);

      try {
        if (updateFn) {
          await updateFn();
        } else {
          await onUpdate(newData);
        }
        setIsOptimistic(false);
        setPreviousData(null);
      } catch (error) {
        console.error('Optimistic update failed, rolling back:', error);
        if (previousData !== null) {
          setData(previousData);
        }
        setIsOptimistic(false);
        setPreviousData(null);
        throw error;
      }
    },
    [data, onUpdate, previousData]
  );

  const rollback = useCallback(() => {
    if (previousData !== null) {
      setData(previousData);
      setIsOptimistic(false);
      setPreviousData(null);
    }
  }, [previousData]);

  const commit = useCallback(() => {
    setIsOptimistic(false);
    setPreviousData(null);
  }, []);

  return {
    data,
    isOptimistic,
    applyOptimisticUpdate,
    rollback,
    commit,
    setData,
  };
}

export function useOptimisticList<T extends { id: string }>(initialList: T[]) {
  const [list, setList] = useState<T[]>(initialList);
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set());

  const addOptimistic = useCallback(
    (item: T, updateFn: () => Promise<void>) => {
      setList((prev) => [item, ...prev]);
      setOptimisticIds((prev) => new Set(prev).add(item.id));

      updateFn()
        .then(() => {
          setOptimisticIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
        })
        .catch(() => {
          setList((prev) => prev.filter((i) => i.id !== item.id));
          setOptimisticIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
        });
    },
    []
  );

  const updateOptimistic = useCallback(
    (id: string, updates: Partial<T>, updateFn: () => Promise<void>) => {
      const previousItem = list.find((item) => item.id === id);
      if (!previousItem) return;

      setList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      setOptimisticIds((prev) => new Set(prev).add(id));

      updateFn()
        .then(() => {
          setOptimisticIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        })
        .catch(() => {
          setList((prev) =>
            prev.map((item) => (item.id === id ? previousItem : item))
          );
          setOptimisticIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        });
    },
    [list]
  );

  const deleteOptimistic = useCallback(
    (id: string, deleteFn: () => Promise<void>) => {
      const previousItem = list.find((item) => item.id === id);
      if (!previousItem) return;

      setList((prev) => prev.filter((item) => item.id !== id));
      setOptimisticIds((prev) => new Set(prev).add(id));

      deleteFn()
        .then(() => {
          setOptimisticIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        })
        .catch(() => {
          setList((prev) => [previousItem, ...prev]);
          setOptimisticIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        });
    },
    [list]
  );

  return {
    list,
    setList,
    optimisticIds,
    addOptimistic,
    updateOptimistic,
    deleteOptimistic,
  };
}
