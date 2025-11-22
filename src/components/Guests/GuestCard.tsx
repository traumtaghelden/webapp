import { Mail, Phone, Baby, Utensils, MoreVertical, User, Edit, Trash2 } from 'lucide-react';
import { type Guest, type GuestGroup } from '../../lib/supabase';
import { GUEST } from '../../constants/terminology';
import { useState, useRef, useEffect } from 'react';
import { useLongPress } from '../../hooks/useLongPress';
import ContextMenu, { type ContextMenuItem } from '../common/ContextMenu';

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

interface GuestCardProps {
  guest: Guest;
  groups: GuestGroup[];
  partnerNames: { partner_1: string; partner_2: string };
  onPartnerChange: (guestId: string, partnerSide: 'partner_1' | 'partner_2' | 'both' | null) => Promise<void>;
  onGroupChange: (guestId: string, groupId: string | null) => Promise<void>;
  onClick: () => void;
  onDeleteClick?: () => void;
  onEditClick?: () => void;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  showCheckbox?: boolean;
  enableSwipe?: boolean;
  enableLongPress?: boolean;
}

export default function GuestCard({
  guest,
  groups,
  partnerNames,
  onPartnerChange,
  onGroupChange,
  onClick,
  onDeleteClick,
  onEditClick,
  isSelected,
  onSelectChange,
  showCheckbox,
  enableSwipe = false,
  enableLongPress = true,
}: GuestCardProps) {
  const [showPartnerMenu, setShowPartnerMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isUpdating, setIsUpdating] = useState(false);

  const partnerMenuRef = useRef<HTMLDivElement>(null);
  const groupMenuRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (partnerMenuRef.current && !partnerMenuRef.current.contains(event.target as Node)) {
        setShowPartnerMenu(false);
      }
      if (groupMenuRef.current && !groupMenuRef.current.contains(event.target as Node)) {
        setShowGroupMenu(false);
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePartnerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPartnerMenu(!showPartnerMenu);
    setShowGroupMenu(false);
    setShowActionsMenu(false);
  };

  const handleGroupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowGroupMenu(!showGroupMenu);
    setShowPartnerMenu(false);
    setShowActionsMenu(false);
  };

  const handleActionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActionsMenu(!showActionsMenu);
    setShowPartnerMenu(false);
    setShowGroupMenu(false);
  };

  const handlePartnerSelect = async (side: 'partner_1' | 'partner_2' | 'both' | null) => {
    setIsUpdating(true);
    try {
      await onPartnerChange(guest.id, side);
      setShowPartnerMenu(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGroupSelect = async (groupId: string | null) => {
    setIsUpdating(true);
    try {
      await onGroupChange(guest.id, groupId);
      setShowGroupMenu(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const getPartnerLabel = (side: 'partner_1' | 'partner_2' | 'both' | null) => {
    if (side === 'partner_1') return partnerNames.partner_1;
    if (side === 'partner_2') return partnerNames.partner_2;
    if (side === 'both') return 'Beide';
    return 'Nicht zugeordnet';
  };

  const currentGroup = groups.find(g => g.id === guest.group_id);

  // Long-press context menu
  const longPress = useLongPress({
    onLongPress: (e) => {
      if (!enableLongPress) return;
      const touch = 'touches' in e ? e.touches[0] : e as React.MouseEvent;
      setContextMenuPos({ x: touch.clientX, y: touch.clientY });
      setShowContextMenu(true);
    },
    onClick: () => onClick(),
    delay: 500,
    enableHaptic: true,
  });

  // Context menu items
  const contextMenuItems: ContextMenuItem[] = [
    {
      icon: User,
      label: 'Details anzeigen',
      onClick: () => onClick(),
    },
    ...(onEditClick ? [{
      icon: Edit,
      label: 'Bearbeiten',
      onClick: () => onEditClick(),
    }] : []),
    ...(onDeleteClick ? [{
      icon: Trash2,
      label: 'Löschen',
      onClick: () => onDeleteClick(),
      destructive: true,
    }] : []),
  ];

  // Extract isLongPressing to avoid spreading it on DOM element
  const { isLongPressing: _isLongPressing, ...longPressHandlers } = longPress;

  return (
    <>
      <div
        {...(enableLongPress ? longPressHandlers : {})}
        className="group relative p-3 bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl hover:shadow-xl hover:shadow-[#d4af37]/10 transition-all duration-300 border border-[#d4af37]/10 hover:border-[#d4af37]/40 hover:scale-[1.02] active:scale-[0.98]"
      >
      <div className="flex items-center gap-2">
        {showCheckbox && onSelectChange && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelectChange(e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border border-[#d4af37]/30 bg-white checked:bg-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/50 cursor-pointer"
          />
        )}

        <div
          onClick={onClick}
          className="flex items-center gap-2 flex-1 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37] to-[#c19a2e] flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-lg ring-2 ring-[#d4af37]/10 group-hover:ring-[#d4af37]/30 transition-all duration-300 group-hover:scale-110">
            {guest.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[#0a253c] text-sm truncate group-hover:text-[#d4af37] transition-colors duration-200">{guest.name}</h4>
            <div className="flex flex-wrap gap-1.5 mt-0.5 text-xs text-[#666666]">
              {guest.email && (
                <div className="flex items-center gap-0.5">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{guest.email}</span>
                </div>
              )}
              {guest.phone && (
                <div className="flex items-center gap-0.5">
                  <Phone className="w-3 h-3" />
                  <span>{guest.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleActionsClick}
            className="p-1.5 hover:bg-white rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-md"
          >
            <MoreVertical className="w-4 h-4 text-[#666666] group-hover:text-[#d4af37]" />
          </button>

          {showActionsMenu && (
            <div
              ref={actionsMenuRef}
              className="absolute right-2 top-12 z-20 bg-white rounded-lg shadow-2xl border border-[#d4af37]/30 py-1 min-w-[140px] backdrop-blur-sm animate-slideDown"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionsMenu(false);
                  onClick();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-gradient-to-r hover:from-[#f7f2eb] hover:to-[#d4af37]/10 transition-all duration-200 text-[#0a253c] font-semibold text-xs rounded-lg mx-1"
              >
                Details öffnen
              </button>
              {onDeleteClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActionsMenu(false);
                    onDeleteClick();
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-red-50 transition-all duration-200 text-red-600 font-semibold text-xs rounded-lg mx-1"
                >
                  Löschen
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 mt-2 flex-wrap">
        <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 ${getStatusColor(guest.rsvp_status)}`}>
          {getStatusLabel(guest.rsvp_status)}
        </span>

        <div className="relative" ref={partnerMenuRef}>
          <button
            onClick={handlePartnerClick}
            disabled={isUpdating}
            className="px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 border border-gray-300 disabled:opacity-50 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
          >
            {isUpdating ? '...' : getPartnerLabel(guest.partner_side)}
          </button>

          {showPartnerMenu && (
            <div className="absolute left-0 top-full mt-1 z-10 bg-white rounded-lg shadow-2xl border border-[#d4af37]/30 py-1 min-w-[140px] backdrop-blur-sm animate-slideDown">
              <button
                onClick={() => handlePartnerSelect('partner_1')}
                className="w-full px-3 py-1.5 text-left hover:bg-gradient-to-r hover:from-[#f7f2eb] hover:to-[#d4af37]/10 transition-all duration-200 text-[#0a253c] font-semibold text-xs rounded-lg mx-1"
              >
                {partnerNames.partner_1}
              </button>
              <button
                onClick={() => handlePartnerSelect('partner_2')}
                className="w-full px-3 py-1.5 text-left hover:bg-[#f7f2eb] transition-all text-[#0a253c] text-xs"
              >
                {partnerNames.partner_2}
              </button>
              <button
                onClick={() => handlePartnerSelect('both')}
                className="w-full px-3 py-1.5 text-left hover:bg-[#f7f2eb] transition-all text-[#0a253c] text-xs"
              >
                Beide
              </button>
              <button
                onClick={() => handlePartnerSelect(null)}
                className="w-full px-3 py-1.5 text-left hover:bg-red-50 transition-all duration-200 text-red-600 font-semibold text-xs rounded-lg mx-1"
              >
                Entfernen
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={groupMenuRef}>
          <button
            onClick={handleGroupClick}
            disabled={isUpdating}
            className="px-2 py-1 rounded-full text-xs font-semibold transition-all duration-200 border disabled:opacity-50 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
            style={
              currentGroup
                ? {
                    backgroundColor: `${currentGroup.color}20`,
                    color: currentGroup.color,
                    borderColor: currentGroup.color,
                  }
                : {
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    borderColor: '#d1d5db',
                  }
            }
          >
            {isUpdating ? '...' : currentGroup?.name || 'Keine Gruppe'}
          </button>

          {showGroupMenu && (
            <div className="absolute left-0 top-full mt-1 z-10 bg-white rounded-lg shadow-2xl border border-[#d4af37]/30 py-1 min-w-[140px] max-h-[180px] overflow-y-auto backdrop-blur-sm animate-slideDown">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => handleGroupSelect(group.id)}
                  className="w-full px-3 py-1.5 text-left hover:bg-gradient-to-r hover:from-[#f7f2eb] hover:to-[#d4af37]/10 transition-all duration-200 text-[#0a253c] font-semibold text-xs flex items-center gap-1.5 rounded-lg mx-1"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                </button>
              ))}
              <button
                onClick={() => handleGroupSelect(null)}
                className="w-full px-3 py-1.5 text-left hover:bg-red-50 transition-all duration-200 text-red-600 font-semibold text-xs rounded-lg mx-1"
              >
                Entfernen
              </button>
            </div>
          )}
        </div>

        {guest.age_group !== 'adult' && (
          <span
            className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 rounded-full text-[10px] font-bold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 border border-blue-200"
            title={guest.age_group === 'child' ? 'Kind' : 'Kleinkind'}
          >
            <Baby className="w-2.5 h-2.5" />
            {guest.age_group === 'child' ? 'Kind' : 'Baby'}
          </span>
        )}

        {guest.dietary_restrictions && guest.dietary_restrictions.trim() && (
          <span
            className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700 rounded-full text-[10px] font-bold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 border border-orange-200"
            title="Hat Ernährungseinschränkungen"
          >
            <Utensils className="w-2.5 h-2.5" />
            Dietary
          </span>
        )}
      </div>
    </div>

    {/* Context Menu */}
    <ContextMenu
      isOpen={showContextMenu}
      onClose={() => setShowContextMenu(false)}
      position={contextMenuPos}
      title={guest.name}
      items={contextMenuItems}
    />
  </>
  );
}
