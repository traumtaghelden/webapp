import { useState } from 'react';
import { Edit2, Trash2, Eye, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { type BudgetItem } from '../../lib/supabase';
import { BUDGET, COMMON } from '../../constants/terminology';
import UnifiedTable from '../common/UnifiedTable';

interface BudgetTableProps {
  items: BudgetItem[];
  onEdit: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  onView: (itemId: string) => void;
  selectedCategory: string | null;
  selectedItemIds?: Set<string>;
  onSelectItem?: (itemId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
}

export default function BudgetTable({
  items,
  onEdit,
  onDelete,
  onView,
  selectedCategory,
  selectedItemIds = new Set(),
  onSelectItem,
  onSelectAll
}: BudgetTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredItems = selectedCategory
    ? items.filter(item => item.budget_category_id === selectedCategory)
    : items;

  const allSelected = filteredItems.length > 0 && filteredItems.every(item => selectedItemIds.has(item.id));
  const someSelected = filteredItems.some(item => selectedItemIds.has(item.id)) && !allSelected;

  const getPaymentStatus = (item: BudgetItem) => {
    // Simplified: only 'open' or 'paid'
    if (item.paid || item.payment_status === 'paid') {
      return { label: 'Bezahlt', color: 'green', icon: CheckCircle };
    }
    return { label: 'Offen', color: 'orange', icon: Clock };
  };


  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const sortedItems = (() => {
    if (!sortColumn) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortColumn) {
        case 'item_name':
          aVal = a.item_name?.toLowerCase() || '';
          bVal = b.item_name?.toLowerCase() || '';
          break;
        case 'category':
          aVal = a.category?.toLowerCase() || '';
          bVal = b.category?.toLowerCase() || '';
          break;
        case 'cost':
          aVal = a.actual_cost || 0;
          bVal = b.actual_cost || 0;
          break;
        default:
          return 0;
      }

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

      // Compare values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  })();

  const emptyState = (
    <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <AlertCircle className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-[#0a253c] mb-2">Noch keine {BUDGET.ITEM_PLURAL}</h3>
      <p className="text-[#666666]">
        {selectedCategory
          ? `Keine ${BUDGET.ITEM_PLURAL} in dieser ${BUDGET.CATEGORY} gefunden.`
          : `Starte mit deinem ersten ${BUDGET.ITEM}.`}
      </p>
    </div>
  );

  const columnsWithCheckbox = onSelectItem ? [
    {
      key: 'checkbox',
      label: (
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={(e) => onSelectAll?.(e.target.checked)}
          className="w-4 h-4 rounded border-[#d4af37] text-[#d4af37] focus:ring-[#d4af37] cursor-pointer"
        />
      ),
      sortable: false,
      align: 'center' as const,
      render: (item: BudgetItem) => (
        <input
          type="checkbox"
          checked={selectedItemIds.has(item.id)}
          onChange={(e) => {
            e.stopPropagation();
            onSelectItem?.(item.id, e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-[#d4af37] text-[#d4af37] focus:ring-[#d4af37] cursor-pointer"
        />
      ),
    },
  ] : [];

  const columns = [
    ...columnsWithCheckbox,
    {
      key: 'item_name',
      label: BUDGET.ITEM,
      sortable: true,
      align: 'left' as const,
      render: (item: BudgetItem) => (
        <>
          <div className="font-bold text-[#0a253c]">{item.item_name}</div>
          {(item.vendor_id || item.location_id || item.timeline_event_id) && (
            <div className="text-xs text-[#999999] mt-1">
              {item.vendor_id && 'Verknüpft mit Dienstleister'}
              {item.vendor_id && (item.location_id || item.timeline_event_id) && ' • '}
              {item.location_id && 'Verknüpft mit Location'}
              {item.location_id && item.timeline_event_id && ' • '}
              {item.timeline_event_id && 'Verknüpft mit Timeline-Block'}
            </div>
          )}
        </>
      ),
    },
    {
      key: 'category',
      label: BUDGET.CATEGORY,
      sortable: true,
      align: 'left' as const,
      render: (item: BudgetItem) => (
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: item.budget_category?.color || '#d4af37' }}
        >
          {item.category}
        </span>
      ),
    },
    {
      key: 'cost',
      label: 'Kosten',
      sortable: true,
      align: 'right' as const,
      render: (item: BudgetItem) => (
        <div className="font-bold text-[#0a253c]">
          {(item.actual_cost || 0).toLocaleString('de-DE')} €
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'left' as const,
      render: (item: BudgetItem) => {
        const status = getPaymentStatus(item);
        const StatusIcon = status.icon;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                status.color === 'green'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Aktionen',
      align: 'center' as const,
      render: (item: BudgetItem) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(item.id);
            }}
            className="p-2 hover:bg-blue-100 rounded-lg transition-all group"
            title={COMMON.VIEW_DETAILS}
          >
            <Eye className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item.id);
            }}
            className="p-2 hover:bg-[#f7f2eb] rounded-lg transition-all group"
            title={COMMON.EDIT}
          >
            <Edit2 className="w-4 h-4 text-[#d4af37] group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-2 hover:bg-red-100 rounded-lg transition-all group"
            title={COMMON.DELETE}
          >
            <Trash2 className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      ),
    },
  ];

  const mobileCardRender = (item: BudgetItem) => {
    const status = getPaymentStatus(item);
    const StatusIcon = status.icon;

    return (
      <div className="space-y-3">
        {/* Header: Name and Category */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#0a253c] text-base truncate">{item.item_name}</h3>
            {(item.vendor_id || item.location_id || item.timeline_event_id) && (
              <p className="text-xs text-[#999999] mt-0.5">
                {item.vendor_id && 'Verknüpft mit Dienstleister'}
                {item.vendor_id && (item.location_id || item.timeline_event_id) && ' • '}
                {item.location_id && 'Verknüpft mit Location'}
                {item.location_id && item.timeline_event_id && ' • '}
                {item.timeline_event_id && 'Verknüpft mit Timeline-Block'}
              </p>
            )}
          </div>
          <span
            className="inline-block px-2 py-1 rounded-full text-xs font-semibold text-white flex-shrink-0"
            style={{ backgroundColor: item.budget_category?.color || '#d4af37' }}
          >
            {item.category}
          </span>
        </div>

        {/* Cost and Status */}
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-[#0a253c]">
            {(item.actual_cost || 0).toLocaleString('de-DE')} €
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              status.color === 'green'
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(item.id);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all font-medium text-sm min-h-[44px]"
          >
            <Eye className="w-4 h-4" />
            <span>Details</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item.id);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f7f2eb] hover:bg-[#f4d03f]/20 text-[#0a253c] rounded-lg transition-all font-medium text-sm min-h-[44px]"
          >
            <Edit2 className="w-4 h-4" />
            <span>Bearbeiten</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Löschen"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <UnifiedTable
      data={sortedItems}
      columns={columns}
      getRowKey={(item) => item.id}
      emptyState={emptyState}
      striped={true}
      hoverable={true}
      onSort={handleSort}
      mobileCardRender={mobileCardRender}
      onEdit={(item) => onEdit(item.id)}
      onDelete={(item) => onDelete(item.id)}
      enableMobileSwipe={true}
    />
  );
}
