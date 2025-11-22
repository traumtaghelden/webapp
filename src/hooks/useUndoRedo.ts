import { useState, useCallback } from 'react';

export interface UndoableAction<T = any> {
  type: string;
  undo: () => Promise<void> | void;
  redo: () => Promise<void> | void;
  description: string;
  data?: T;
}

interface UseUndoRedoReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  addAction: (action: UndoableAction) => void;
  clear: () => void;
  history: UndoableAction[];
}

export function useUndoRedo(maxHistory = 20): UseUndoRedoReturn {
  const [history, setHistory] = useState<UndoableAction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  const addAction = useCallback((action: UndoableAction) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(action);

      if (newHistory.length > maxHistory) {
        newHistory.shift();
        return newHistory;
      }

      return newHistory;
    });

    setCurrentIndex((prev) => {
      const newIndex = prev + 1;
      return newIndex >= maxHistory ? maxHistory - 1 : newIndex;
    });
  }, [currentIndex, maxHistory]);

  const undo = useCallback(async () => {
    if (!canUndo) return;

    const action = history[currentIndex];
    await action.undo();
    setCurrentIndex((prev) => prev - 1);
  }, [canUndo, currentIndex, history]);

  const redo = useCallback(async () => {
    if (!canRedo) return;

    const action = history[currentIndex + 1];
    await action.redo();
    setCurrentIndex((prev) => prev + 1);
  }, [canRedo, currentIndex, history]);

  const clear = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    addAction,
    clear,
    history: history.slice(0, currentIndex + 1),
  };
}
