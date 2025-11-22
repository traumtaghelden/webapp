import { useState, useEffect } from 'react';
import { Filter, X, Users, UserCheck, UserX, Clock, Baby, User, Utensils, Grid } from 'lucide-react';
import { type GuestGroup } from '../../lib/supabase';
import { haptics } from '../../utils/hapticFeedback';

export interface GuestFilters {
  rsvpStatus: ('accepted' | 'declined' | 'pending')[];
  partnerSide: ('partner_1' | 'partner_2' | 'both' | 'unassigned')[];
  ageGroup: ('adult' | 'child' | 'infant')[];
  groups: string[];
  tableAssigned: 'all' | 'assigned' | 'unassigned';
  hasDietary: 'all' | 'yes' | 'no';
}

interface GuestFilterBarProps {
  filters: GuestFilters;
  onFiltersChange: (filters: GuestFilters) => void;
  availableGroups: GuestGroup[];
  partnerNames: { partner_1: string; partner_2: string };
}

export default function GuestFilterBar({
  filters,
  onFiltersChange,
  availableGroups,
  partnerNames
}: GuestFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleRsvpStatus = (status: 'accepted' | 'declined' | 'pending') => {
    haptics.selection();
    const newStatuses = filters.rsvpStatus.includes(status)
      ? filters.rsvpStatus.filter(s => s !== status)
      : [...filters.rsvpStatus, status];
    onFiltersChange({ ...filters, rsvpStatus: newStatuses });
  };

  const togglePartnerSide = (side: 'partner_1' | 'partner_2' | 'both' | 'unassigned') => {
    const newSides = filters.partnerSide.includes(side)
      ? filters.partnerSide.filter(s => s !== side)
      : [...filters.partnerSide, side];
    onFiltersChange({ ...filters, partnerSide: newSides });
  };

  const toggleAgeGroup = (age: 'adult' | 'child' | 'infant') => {
    const newAges = filters.ageGroup.includes(age)
      ? filters.ageGroup.filter(a => a !== age)
      : [...filters.ageGroup, age];
    onFiltersChange({ ...filters, ageGroup: newAges });
  };

  const toggleGroup = (groupId: string) => {
    const newGroups = filters.groups.includes(groupId)
      ? filters.groups.filter(g => g !== groupId)
      : [...filters.groups, groupId];
    onFiltersChange({ ...filters, groups: newGroups });
  };

  const clearAllFilters = () => {
    haptics.light();
    onFiltersChange({
      rsvpStatus: [],
      partnerSide: [],
      ageGroup: [],
      groups: [],
      tableAssigned: 'all',
      hasDietary: 'all',
    });
    setShowFilters(false);
  };

  const hasActiveFilters =
    filters.rsvpStatus.length > 0 ||
    filters.partnerSide.length > 0 ||
    filters.ageGroup.length > 0 ||
    filters.groups.length > 0 ||
    filters.tableAssigned !== 'all' ||
    filters.hasDietary !== 'all';

  const getPartnerLabel = (side: 'partner_1' | 'partner_2' | 'both' | 'unassigned') => {
    if (side === 'partner_1') return partnerNames.partner_1;
    if (side === 'partner_2') return partnerNames.partner_2;
    if (side === 'both') return 'Beide';
    return 'Nicht zugeordnet';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-[#d4af37]/30 hover:border-[#d4af37] hover:shadow-md hover:shadow-[#d4af37]/10 transition-all duration-300 text-sm min-h-[44px]"
        >
          <Filter className={`w-4 h-4 transition-all duration-300 ${showFilters ? 'text-[#d4af37] rotate-180' : 'text-[#d4af37]'}`} />
          <span className="font-semibold text-[#0a253c]">Filter</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white text-xs rounded-full font-bold shadow-sm">
              {filters.rsvpStatus.length + filters.partnerSide.length + filters.ageGroup.length + filters.groups.length + (filters.tableAssigned !== 'all' ? 1 : 0) + (filters.hasDietary !== 'all' ? 1 : 0)}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-[#666666] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 min-h-[44px]"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Zurücksetzen</span>
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-gradient-to-br from-white to-[#f7f2eb]/20 rounded-xl p-4 shadow-lg space-y-4 border border-[#d4af37]/30">
          {/* RSVP Status Filter */}
          <div>
            <h4 className="text-xs font-bold text-[#0a253c] mb-2">RSVP-Status</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'accepted', label: 'Zugesagt', icon: UserCheck, color: 'green' },
                { id: 'declined', label: 'Abgesagt', icon: UserX, color: 'red' },
                { id: 'pending', label: 'Ausstehend', icon: Clock, color: 'orange' },
              ].map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => toggleRsvpStatus(id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 min-h-[44px] active:scale-95 ${
                    filters.rsvpStatus.includes(id as any)
                      ? color === 'green' ? 'bg-green-100 text-green-700 border-2 border-green-300 shadow-md' :
                        color === 'red' ? 'bg-red-100 text-red-700 border-2 border-red-300 shadow-md' :
                        'bg-orange-100 text-orange-700 border-2 border-orange-300 shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Partner Side Filter */}
          <div>
            <h4 className="text-xs font-bold text-[#0a253c] mb-2">Partnerseite</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'partner_1' as const, icon: User },
                { id: 'partner_2' as const, icon: User },
                { id: 'both' as const, icon: Users },
                { id: 'unassigned' as const, icon: User },
              ].map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => togglePartnerSide(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 min-h-[44px] active:scale-95 ${
                    filters.partnerSide.includes(id)
                      ? 'bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white border-2 border-[#d4af37] shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{getPartnerLabel(id)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Age Group Filter */}
          <div>
            <h4 className="text-xs font-bold text-[#0a253c] mb-2">Altersgruppe</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'adult', label: 'Erwachsene', icon: User },
                { id: 'child', label: 'Kinder', icon: Baby },
                { id: 'infant', label: 'Kleinkinder', icon: Baby },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => toggleAgeGroup(id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 min-h-[44px] active:scale-95 ${
                    filters.ageGroup.includes(id as any)
                      ? 'bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white border-2 border-[#d4af37] shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Group Filter */}
          {availableGroups.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#0a253c] mb-2">Gruppen</h4>
              <div className="flex flex-wrap gap-2">
                {availableGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 min-h-[44px] active:scale-95 ${
                      filters.groups.includes(group.id)
                        ? 'border-2 shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent hover:border-gray-300'
                    }`}
                    style={{
                      backgroundColor: filters.groups.includes(group.id) ? `${group.color}20` : undefined,
                      color: filters.groups.includes(group.id) ? group.color : undefined,
                      borderColor: filters.groups.includes(group.id) ? group.color : undefined,
                    }}
                  >
                    <Users className="w-4 h-4" />
                    <span>{group.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Table Assignment Filter */}
          <div>
            <h4 className="text-xs font-bold text-[#0a253c] mb-2">Tischzuordnung</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Alle' },
                { id: 'assigned', label: 'Zugewiesen' },
                { id: 'unassigned', label: 'Nicht zugewiesen' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => onFiltersChange({ ...filters, tableAssigned: id as any })}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 min-h-[44px] active:scale-95 ${
                    filters.tableAssigned === id
                      ? 'bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white border-2 border-[#d4af37] shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent hover:border-gray-300'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Restrictions Filter */}
          <div>
            <h4 className="text-xs font-bold text-[#0a253c] mb-2">Ernährungseinschränkungen</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Alle' },
                { id: 'yes', label: 'Hat Einschränkungen' },
                { id: 'no', label: 'Keine Einschränkungen' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => onFiltersChange({ ...filters, hasDietary: id as any })}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 min-h-[44px] active:scale-95 ${
                    filters.hasDietary === id
                      ? 'bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white border-2 border-[#d4af37] shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent hover:border-gray-300'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.rsvpStatus.map(status => (
            <div
              key={status}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-[#d4af37]/20 to-[#c19a2e]/20 text-[#0a253c] rounded-full text-sm font-semibold border border-[#d4af37]/40 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 min-h-[40px]"
            >
              <span>
                {status === 'accepted' ? 'Zugesagt' : status === 'declined' ? 'Abgesagt' : 'Ausstehend'}
              </span>
              <button
                onClick={() => toggleRsvpStatus(status)}
                className="hover:text-[#d4af37] transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {filters.partnerSide.map(side => (
            <div
              key={side}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-[#d4af37]/20 to-[#c19a2e]/20 text-[#0a253c] rounded-full text-sm font-semibold border border-[#d4af37]/40 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 min-h-[40px]"
            >
              <span>{getPartnerLabel(side)}</span>
              <button
                onClick={() => togglePartnerSide(side)}
                className="hover:text-[#d4af37] transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {filters.ageGroup.map(age => (
            <div
              key={age}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-[#d4af37]/20 to-[#c19a2e]/20 text-[#0a253c] rounded-full text-sm font-semibold border border-[#d4af37]/40 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 min-h-[40px]"
            >
              <span>
                {age === 'adult' ? 'Erwachsene' : age === 'child' ? 'Kinder' : 'Kleinkinder'}
              </span>
              <button
                onClick={() => toggleAgeGroup(age)}
                className="hover:text-[#d4af37] transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {filters.groups.map(groupId => {
            const group = availableGroups.find(g => g.id === groupId);
            if (!group) return null;
            return (
              <div
                key={groupId}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold border min-h-[40px]"
                style={{
                  backgroundColor: `${group.color}20`,
                  color: group.color,
                  borderColor: group.color,
                }}
              >
                <span>{group.name}</span>
                <button
                  onClick={() => toggleGroup(groupId)}
                  className="hover:opacity-70 transition-opacity p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {filters.tableAssigned !== 'all' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#d4af37]/20 text-[#0a253c] rounded-full text-sm font-semibold border border-[#d4af37]/30 min-h-[40px]">
              <span>
                {filters.tableAssigned === 'assigned' ? 'Tisch zugewiesen' : 'Tisch nicht zugewiesen'}
              </span>
              <button
                onClick={() => onFiltersChange({ ...filters, tableAssigned: 'all' })}
                className="hover:text-[#d4af37] transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {filters.hasDietary !== 'all' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#d4af37]/20 text-[#0a253c] rounded-full text-sm font-semibold border border-[#d4af37]/30 min-h-[40px]">
              <span>
                {filters.hasDietary === 'yes' ? 'Hat Einschränkungen' : 'Keine Einschränkungen'}
              </span>
              <button
                onClick={() => onFiltersChange({ ...filters, hasDietary: 'all' })}
                className="hover:text-[#d4af37] transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
