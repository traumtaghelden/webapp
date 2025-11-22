import { supabase } from '../lib/supabase';

export interface BatchOperation<T = any> {
  type: 'insert' | 'update' | 'delete';
  table: string;
  data?: T;
  id?: string;
  conditions?: Record<string, any>;
}

export class BatchProcessor {
  private queue: BatchOperation[] = [];
  private isProcessing = false;
  private batchSize = 50;
  private flushInterval = 2000;
  private timer: NodeJS.Timeout | null = null;

  constructor(batchSize = 50, flushInterval = 2000) {
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
  }

  add(operation: BatchOperation) {
    this.queue.push(operation);

    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  private scheduleFlush() {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.flush();
    }, this.flushInterval);
  }

  async flush() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.isProcessing = true;
    const operations = [...this.queue];
    this.queue = [];

    try {
      await this.processOperations(operations);
    } catch (error) {
      console.error('Batch processing failed:', error);
      this.queue.unshift(...operations);
    } finally {
      this.isProcessing = false;

      if (this.queue.length > 0) {
        this.scheduleFlush();
      }
    }
  }

  private async processOperations(operations: BatchOperation[]) {
    const groupedByTable = this.groupByTable(operations);

    for (const [table, ops] of Object.entries(groupedByTable)) {
      await this.processTableOperations(table, ops);
    }
  }

  private groupByTable(operations: BatchOperation[]): Record<string, BatchOperation[]> {
    return operations.reduce((acc, op) => {
      if (!acc[op.table]) {
        acc[op.table] = [];
      }
      acc[op.table].push(op);
      return acc;
    }, {} as Record<string, BatchOperation[]>);
  }

  private async processTableOperations(table: string, operations: BatchOperation[]) {
    const inserts = operations.filter((op) => op.type === 'insert');
    const updates = operations.filter((op) => op.type === 'update');
    const deletes = operations.filter((op) => op.type === 'delete');

    if (inserts.length > 0) {
      const data = inserts.map((op) => op.data);
      await supabase.from(table).insert(data);
    }

    if (updates.length > 0) {
      for (const update of updates) {
        if (update.id && update.data) {
          await supabase
            .from(table)
            .update(update.data)
            .eq('id', update.id);
        }
      }
    }

    if (deletes.length > 0) {
      const ids = deletes.map((op) => op.id).filter(Boolean) as string[];
      if (ids.length > 0) {
        await supabase.from(table).delete().in('id', ids);
      }
    }
  }

  clear() {
    this.queue = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

export const globalBatchProcessor = new BatchProcessor();

export async function batchUpdate<T>(
  table: string,
  items: Array<{ id: string; data: Partial<T> }>
): Promise<void> {
  const chunks = [];
  for (let i = 0; i < items.length; i += 50) {
    chunks.push(items.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map((item) =>
        supabase
          .from(table)
          .update(item.data)
          .eq('id', item.id)
      )
    );
  }
}

export async function batchInsert<T>(
  table: string,
  items: T[]
): Promise<void> {
  const chunks = [];
  for (let i = 0; i < items.length; i += 50) {
    chunks.push(items.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    await supabase.from(table).insert(chunk);
  }
}

export async function batchDelete(
  table: string,
  ids: string[]
): Promise<void> {
  const chunks = [];
  for (let i = 0; i < ids.length; i += 50) {
    chunks.push(ids.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    await supabase.from(table).delete().in('id', chunk);
  }
}

export class QueryBatcher {
  private pendingQueries: Map<string, Promise<any>> = new Map();
  private batchTimeout = 10;

  async query<T>(
    key: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    if (this.pendingQueries.has(key)) {
      return this.pendingQueries.get(key);
    }

    const promise = new Promise<T>((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await queryFn();
          resolve(result);
          this.pendingQueries.delete(key);
        } catch (error) {
          reject(error);
          this.pendingQueries.delete(key);
        }
      }, this.batchTimeout);
    });

    this.pendingQueries.set(key, promise);
    return promise;
  }

  clear() {
    this.pendingQueries.clear();
  }
}

export const globalQueryBatcher = new QueryBatcher();
