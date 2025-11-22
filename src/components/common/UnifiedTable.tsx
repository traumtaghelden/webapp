import { useState, ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2 } from 'lucide-react';
import SwipeableListItem from './SwipeableListItem';

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render: (item: T, index: number) => ReactNode;
}

interface UnifiedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowKey: (item: T) => string;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (item: T) => void;
  emptyState?: ReactNode;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
  mobileCardRender?: (item: T, index: number) => ReactNode;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  enableMobileSwipe?: boolean;
}

export default function UnifiedTable<T>({
  data,
  columns,
  getRowKey,
  onSort,
  onRowClick,
  emptyState,
  striped = true,
  hoverable = true,
  className = '',
  mobileCardRender,
  onEdit,
  onDelete,
  enableMobileSwipe = true,
}: UnifiedTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const safeData = data || [];

  const handleSort = (column: string) => {
    let newDirection: 'asc' | 'desc' = 'asc';

    if (sortColumn === column) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }

    setSortColumn(column);
    setSortDirection(newDirection);

    if (onSort) {
      onSort(column, newDirection);
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 opacity-40" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-[#d4af37]" />
    ) : (
      <ArrowDown className="w-4 h-4 text-[#d4af37]" />
    );
  };

  // Sort data internally if no external onSort handler is provided
  const sortedData = (() => {
    if (!sortColumn || onSort) {
      return safeData;
    }

    return [...safeData].sort((a: any, b: any) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

      // Handle numeric values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle string values
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  })();

  if (!sortedData || sortedData.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>;
    }
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-gray-500">Keine Daten verfügbar</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-xs font-bold text-[#666666] uppercase tracking-wider ${
                    column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-2 font-bold text-[#666666] hover:text-[#d4af37] transition-colors uppercase"
                    >
                      {column.label}
                      {getSortIcon(column.key)}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.map((item, index) => {
              const rowKey = getRowKey(item);
              const isHovered = hoveredRow === rowKey;

              return (
                <tr
                  key={rowKey}
                  onMouseEnter={() => setHoveredRow(rowKey)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onRowClick?.(item)}
                  className={`
                    transition-all duration-200
                    ${hoverable ? 'hover:bg-[#f7f2eb]/50 hover:shadow-sm' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${striped && index % 2 === 0 ? '' : 'bg-gray-50/50'}
                  `}
                  style={{
                    animation: `fadeInRow 0.3s ease-out ${index * 0.05}s backwards`,
                  }}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 ${
                        column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {column.render(item, index)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3 p-4">
        {sortedData.map((item, index) => {
          const rowKey = getRowKey(item);
          const hasSwipeActions = enableMobileSwipe && (onEdit || onDelete);

          const cardContent = (
            <div
              onClick={() => onRowClick?.(item)}
              className={`
                bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl p-3 shadow-lg border border-[#d4af37]/10
                transition-all duration-300
                ${hoverable ? 'hover:shadow-xl hover:shadow-[#d4af37]/10 hover:border-[#d4af37]/40 hover:scale-[1.02]' : ''}
                ${onRowClick ? 'cursor-pointer active:scale-[0.98]' : ''}
                min-h-[44px]
              `}
              style={{
                animation: `fadeInRow 0.3s ease-out ${index * 0.05}s backwards`,
              }}
            >
              {mobileCardRender ? (
                mobileCardRender(item, index)
              ) : (
                <div className="space-y-2">
                  {columns.filter(col => col.key !== 'checkbox').slice(0, 4).map((column) => (
                    <div key={column.key} className="flex justify-between items-center gap-2">
                      <span className="text-xs text-[#666666] font-medium uppercase">{column.label}</span>
                      <div className="text-sm text-[#0a253c] font-semibold">{column.render(item, index)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );

          if (hasSwipeActions) {
            const leftActions = [];
            const rightActions = [];

            if (onEdit) {
              leftActions.push({
                icon: Edit2,
                label: 'Bearbeiten',
                color: '#3B82F6',
                onAction: () => onEdit(item),
              });
            }

            if (onDelete) {
              rightActions.push({
                icon: Trash2,
                label: 'Löschen',
                color: '#EF4444',
                onAction: () => onDelete(item),
              });
            }

            return (
              <SwipeableListItem
                key={rowKey}
                leftActions={leftActions}
                rightActions={rightActions}
              >
                {cardContent}
              </SwipeableListItem>
            );
          }

          return <div key={rowKey}>{cardContent}</div>;
        })}
      </div>

      <style>{`
        @keyframes fadeInRow {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
