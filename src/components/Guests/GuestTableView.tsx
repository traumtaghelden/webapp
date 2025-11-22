import { ArrowUp, ArrowDown, Baby, Utensils } from 'lucide-react';
import { type Guest, type GuestGroup } from '../../lib/supabase';
import { GUEST } from '../../constants/terminology';

type SortColumn = 'name' | 'email' | 'phone' | 'rsvp_status' | 'partner_side' | 'age_group' | 'table_number';
type SortDirection = 'asc' | 'desc';

interface GuestTableViewProps {
  guests: Guest[];
  groups: GuestGroup[];
  partnerNames: { partner_1: string; partner_2: string };
  onGuestClick: (guest: Guest) => void;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  selectedGuests?: Set<string>;
  onSelectChange?: (guestId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  showCheckbox?: boolean;
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'planned': return GUEST.RSVP_STATUS.PLANNED;
    case 'invited': return GUEST.RSVP_STATUS.INVITED;
    case 'accepted': return GUEST.RSVP_STATUS.ACCEPTED;
    case 'declined': return GUEST.RSVP_STATUS.DECLINED;
    default: return status;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'planned': return 'bg-gray-100 text-gray-700';
    case 'invited': return 'bg-blue-100 text-blue-700';
    case 'accepted': return 'bg-green-100 text-green-700';
    case 'declined': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default function GuestTableView({
  guests,
  groups,
  partnerNames,
  onGuestClick,
  sortColumn,
  sortDirection,
  onSort,
  selectedGuests,
  onSelectChange,
  onSelectAll,
  showCheckbox
}: GuestTableViewProps) {
  const getPartnerLabel = (side: 'partner_1' | 'partner_2' | 'both' | null) => {
    if (side === 'partner_1') return partnerNames.partner_1;
    if (side === 'partner_2') return partnerNames.partner_2;
    if (side === 'both') return 'Beide';
    return '-';
  };

  const getAgeGroupLabel = (age: 'adult' | 'child' | 'infant') => {
    if (age === 'adult') return 'Erwachsener';
    if (age === 'child') return 'Kind';
    return 'Baby';
  };

  const allSelected = guests.length > 0 && guests.every(g => selectedGuests?.has(g.id));
  const someSelected = guests.some(g => selectedGuests?.has(g.id)) && !allSelected;

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-[#d4af37]/30">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#f7f2eb] border-b-2 border-[#d4af37]/30">
            <tr>
              {showCheckbox && onSelectAll && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-[#d4af37]/30 bg-white checked:bg-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/50 cursor-pointer"
                  />
                </th>
              )}

              <th
                onClick={() => onSort('name')}
                className="px-4 py-3 text-left font-bold text-[#0a253c] cursor-pointer hover:bg-[#d4af37]/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  Name
                  {renderSortIcon('name')}
                </div>
              </th>

              <th
                onClick={() => onSort('email')}
                className="px-4 py-3 text-left font-bold text-[#0a253c] cursor-pointer hover:bg-[#d4af37]/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  E-Mail
                  {renderSortIcon('email')}
                </div>
              </th>

              <th
                onClick={() => onSort('phone')}
                className="px-4 py-3 text-left font-bold text-[#0a253c] cursor-pointer hover:bg-[#d4af37]/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  Telefon
                  {renderSortIcon('phone')}
                </div>
              </th>

              <th
                onClick={() => onSort('rsvp_status')}
                className="px-4 py-3 text-left font-bold text-[#0a253c] cursor-pointer hover:bg-[#d4af37]/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  RSVP
                  {renderSortIcon('rsvp_status')}
                </div>
              </th>

              <th
                onClick={() => onSort('partner_side')}
                className="px-4 py-3 text-left font-bold text-[#0a253c] cursor-pointer hover:bg-[#d4af37]/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  Partner
                  {renderSortIcon('partner_side')}
                </div>
              </th>

              <th className="px-4 py-3 text-left font-bold text-[#0a253c]">Gruppe</th>

              <th
                onClick={() => onSort('age_group')}
                className="px-4 py-3 text-left font-bold text-[#0a253c] cursor-pointer hover:bg-[#d4af37]/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  Alter
                  {renderSortIcon('age_group')}
                </div>
              </th>

              <th
                onClick={() => onSort('table_number')}
                className="px-4 py-3 text-left font-bold text-[#0a253c] cursor-pointer hover:bg-[#d4af37]/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  Tisch
                  {renderSortIcon('table_number')}
                </div>
              </th>

              <th className="px-4 py-3 text-left font-bold text-[#0a253c]">Info</th>
            </tr>
          </thead>

          <tbody>
            {guests.map((guest) => {
              const currentGroup = groups.find(g => g.id === guest.group_id);
              const isSelected = selectedGuests?.has(guest.id);

              return (
                <tr
                  key={guest.id}
                  onClick={() => onGuestClick(guest)}
                  className="border-b border-[#d4af37]/10 hover:bg-[#f7f2eb] cursor-pointer transition-all"
                >
                  {showCheckbox && onSelectChange && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          onSelectChange(guest.id, e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded border-2 border-[#d4af37]/30 bg-white checked:bg-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/50 cursor-pointer"
                      />
                    </td>
                  )}

                  <td className="px-4 py-3 font-semibold text-[#0a253c]">
                    <div className="max-w-[200px] truncate">{guest.name}</div>
                  </td>

                  <td className="px-4 py-3 text-[#666666]">
                    <div className="max-w-[200px] truncate">{guest.email || '-'}</div>
                  </td>

                  <td className="px-4 py-3 text-[#666666]">
                    <div className="max-w-[150px] truncate">{guest.phone || '-'}</div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(guest.rsvp_status)}`}>
                      {getStatusLabel(guest.rsvp_status)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-[#666666] text-sm">
                    {getPartnerLabel(guest.partner_side)}
                  </td>

                  <td className="px-4 py-3">
                    {currentGroup ? (
                      <span
                        className="px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                        style={{
                          backgroundColor: `${currentGroup.color}20`,
                          color: currentGroup.color,
                        }}
                      >
                        {currentGroup.name}
                      </span>
                    ) : (
                      <span className="text-[#666666] text-sm">-</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-[#666666] text-sm">
                    {getAgeGroupLabel(guest.age_group)}
                  </td>

                  <td className="px-4 py-3 text-[#666666] text-sm">
                    {guest.table_number || '-'}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {guest.age_group !== 'adult' && (
                        <Baby className="w-4 h-4 text-blue-600" title={getAgeGroupLabel(guest.age_group)} />
                      )}
                      {guest.dietary_restrictions && guest.dietary_restrictions.trim() && (
                        <Utensils className="w-4 h-4 text-orange-600" title="Hat Ernährungseinschränkungen" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {guests.length === 0 && (
              <tr>
                <td colSpan={showCheckbox ? 10 : 9} className="px-4 py-12 text-center text-[#666666]">
                  Keine {GUEST.PLURAL} gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
