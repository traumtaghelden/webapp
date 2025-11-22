import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, LayoutGrid, Table as TableIcon, CheckSquare, X, CheckCircle } from 'lucide-react';
import { supabase, type Guest, type GuestGroup, type FamilyGroup } from '../../lib/supabase';
import { GUEST, COMMON } from '../../constants/terminology';
import GuestDetailModal from '../GuestDetailModal';
import GuestFilterBar, { type GuestFilters } from './GuestFilterBar';
import GuestCard from './GuestCard';
import GuestTableView from './GuestTableView';
import FamilyGroupHeader from './FamilyGroupHeader';
import SwipeableListItem from '../common/SwipeableListItem';
import { useFamilyGrouping } from '../../hooks/useFamilyGrouping';
import { useToast } from '../../contexts/ToastContext';
import { Edit, Trash2 } from 'lucide-react';
import { SkeletonList, SkeletonTable } from '../common/SkeletonLoader';

interface GuestOverviewTabProps {
  guests: Guest[];
  onUpdate: () => void;
  onAddGuest: () => void;
}

type ViewMode = 'cards' | 'table';
type SortColumn = 'name' | 'email' | 'phone' | 'rsvp_status' | 'partner_side' | 'age_group' | 'table_number';
type SortDirection = 'asc' | 'desc';

export default function GuestOverviewTab({ guests, onUpdate, onAddGuest }: GuestOverviewTabProps) {
  const weddingId = guests.length > 0 ? guests[0].wedding_id : '';
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [partnerNames, setPartnerNames] = useState({ partner_1: 'Partner 1', partner_2: 'Partner 2' });
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);
  const [guestToEdit, setGuestToEdit] = useState<Guest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [groupByFamily, setGroupByFamily] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [filters, setFilters] = useState<GuestFilters>({
    rsvpStatus: [],
    partnerSide: [],
    ageGroup: [],
    groups: [],
    tableAssigned: 'all',
    hasDietary: 'all',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640 && viewMode === 'table') {
        setViewMode('cards');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        loadGroups(),
        loadFamilyGroups(),
        loadPartnerNames(),
        loadPreferences()
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [weddingId]);

  useEffect(() => {
    savePreferences();
  }, [viewMode, groupByFamily, filters, weddingId]);

  useEffect(() => {
    const familyIds = expandedFamilies;
    familyIds.forEach(id => {
      localStorage.setItem(`family-expanded-${id}`, 'true');
    });
  }, [expandedFamilies]);

  const loadGroups = async () => {
    const { data } = await supabase
      .from('guest_groups')
      .select('*')
      .eq('wedding_id', weddingId);
    if (data) setGroups(data);
  };

  const loadFamilyGroups = async () => {
    const { data } = await supabase
      .from('family_groups')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('family_name');
    if (data) setFamilyGroups(data);
  };

  const loadPartnerNames = async () => {
    const { data } = await supabase
      .from('weddings')
      .select('partner_1_name, partner_2_name')
      .eq('id', weddingId)
      .maybeSingle();
    if (data) {
      setPartnerNames({
        partner_1: data.partner_1_name || 'Partner 1',
        partner_2: data.partner_2_name || 'Partner 2',
      });
    }
  };

  const loadPreferences = () => {
    const prefs = localStorage.getItem(`guest-view-prefs-${weddingId}`);
    if (prefs) {
      try {
        const parsed = JSON.parse(prefs);
        if (parsed.viewMode) setViewMode(parsed.viewMode);
        if (typeof parsed.groupByFamily === 'boolean') setGroupByFamily(parsed.groupByFamily);
        if (parsed.filters) setFilters(parsed.filters);
      } catch (e) {
        console.error('Failed to load preferences', e);
      }
    }

    const search = localStorage.getItem(`guest-search-${weddingId}`);
    if (search) setSearchQuery(search);
  };

  const savePreferences = () => {
    localStorage.setItem(
      `guest-view-prefs-${weddingId}`,
      JSON.stringify({ viewMode, groupByFamily, filters })
    );
    localStorage.setItem(`guest-search-${weddingId}`, searchQuery);
  };

  const handlePartnerChange = async (guestId: string, partnerSide: 'partner_1' | 'partner_2' | 'both' | null) => {
    try {
      const { error } = await supabase
        .from('guests')
        .update({ partner_side: partnerSide })
        .eq('id', guestId);

      if (error) throw error;
      showToast('Partner-Zuordnung aktualisiert', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error updating partner side:', error);
      showToast('Fehler beim Aktualisieren', 'error');
    }
  };

  const handleGroupChange = async (guestId: string, groupId: string | null) => {
    try {
      const { error } = await supabase
        .from('guests')
        .update({ group_id: groupId })
        .eq('id', guestId);

      if (error) throw error;
      showToast('Gruppen-Zuordnung aktualisiert', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error updating group:', error);
      showToast('Fehler beim Aktualisieren', 'error');
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleFamilyToggle = (familyId: string) => {
    setExpandedFamilies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(familyId)) {
        newSet.delete(familyId);
        localStorage.removeItem(`family-expanded-${familyId}`);
      } else {
        newSet.add(familyId);
        localStorage.setItem(`family-expanded-${familyId}`, 'true');
      }
      return newSet;
    });
  };

  const handleSelectGuest = (guestId: string, selected: boolean) => {
    setSelectedGuestIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(guestId);
      } else {
        newSet.delete(guestId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedGuestIds(new Set(filteredGuests.map(g => g.id)));
    } else {
      setSelectedGuestIds(new Set());
    }
  };

  const handleBulkRsvpChange = async (status: 'accepted' | 'declined' | 'invited' | 'planned') => {
    if (selectedGuestIds.size === 0) return;

    try {
      const { error } = await supabase
        .from('guests')
        .update({ rsvp_status: status })
        .in('id', Array.from(selectedGuestIds));

      if (error) throw error;
      showToast(`${selectedGuestIds.size} Gäste aktualisiert`, 'success');
      setSelectedGuestIds(new Set());
      setShowBulkActions(false);
      onUpdate();
    } catch (error) {
      console.error('Error bulk updating:', error);
      showToast('Fehler beim Aktualisieren', 'error');
    }
  };

  const handleDeleteGuest = async (guest: Guest) => {
    try {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guest.id);

      if (error) throw error;
      showToast(`${guest.name} wurde gelöscht`, 'success');
      onUpdate();
    } catch (error) {
      console.error('Error deleting guest:', error);
      showToast('Fehler beim Löschen', 'error');
    }
  };

  const filteredGuests = useMemo(() => {
    let filtered = [...guests];

    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        g =>
          g.name.toLowerCase().includes(search) ||
          g.email?.toLowerCase().includes(search) ||
          g.notes?.toLowerCase().includes(search)
      );
    }

    if (filters.rsvpStatus.length > 0) {
      filtered = filtered.filter(g => {
        if (filters.rsvpStatus.includes('pending')) {
          return filters.rsvpStatus.includes(g.rsvp_status as any) || g.rsvp_status === 'invited' || g.rsvp_status === 'planned';
        }
        return filters.rsvpStatus.includes(g.rsvp_status as any);
      });
    }

    if (filters.partnerSide.length > 0) {
      filtered = filtered.filter(g => {
        if (filters.partnerSide.includes('unassigned')) {
          return filters.partnerSide.some(side => side === g.partner_side || (side === 'unassigned' && !g.partner_side));
        }
        return filters.partnerSide.includes(g.partner_side as any);
      });
    }

    if (filters.ageGroup.length > 0) {
      filtered = filtered.filter(g => filters.ageGroup.includes(g.age_group));
    }

    if (filters.groups.length > 0) {
      filtered = filtered.filter(g => g.group_id && filters.groups.includes(g.group_id));
    }

    if (filters.tableAssigned === 'assigned') {
      filtered = filtered.filter(g => g.table_number !== null);
    } else if (filters.tableAssigned === 'unassigned') {
      filtered = filtered.filter(g => g.table_number === null);
    }

    if (filters.hasDietary === 'yes') {
      filtered = filtered.filter(g => g.dietary_restrictions && g.dietary_restrictions.trim());
    } else if (filters.hasDietary === 'no') {
      filtered = filtered.filter(g => !g.dietary_restrictions || !g.dietary_restrictions.trim());
    }

    return filtered;
  }, [guests, debouncedSearch, filters]);

  const sortedGuests = useMemo(() => {
    const sorted = [...filteredGuests];
    sorted.sort((a, b) => {
      let aVal: any = a[sortColumn];
      let bVal: any = b[sortColumn];

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredGuests, sortColumn, sortDirection]);

  const groupedFamilies = useFamilyGrouping(sortedGuests, familyGroups);

  useEffect(() => {
    setShowBulkActions(selectedGuestIds.size > 0);
  }, [selectedGuestIds]);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl p-3 shadow-lg border border-[#d4af37]/10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 mb-2">
          <h3 className="text-base font-bold text-[#0a253c] tracking-tight">Alle {GUEST.PLURAL}</h3>

          <div className="flex items-center gap-1.5">
            <div className="hidden sm:flex items-center gap-0.5 bg-white rounded-lg p-0.5 shadow-sm border border-[#d4af37]/20">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all duration-300 ${
                  viewMode === 'cards'
                    ? 'bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white shadow-md'
                    : 'text-[#666666] hover:text-[#0a253c] hover:bg-[#f7f2eb]/50'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span className="hidden sm:inline">Karten</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all duration-300 ${
                  viewMode === 'table'
                    ? 'bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white shadow-md'
                    : 'text-[#666666] hover:text-[#0a253c] hover:bg-[#f7f2eb]/50'
                }`}
              >
                <TableIcon className="w-3 h-3" />
                <span className="hidden sm:inline">Tabelle</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onAddGuest}
              className="flex items-center gap-1 px-3 py-1 bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{GUEST.ADD}</span>
              <span className="sm:hidden">Neu</span>
            </button>
          </div>
        </div>

        <div className="relative mb-2 group">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#666666] transition-all duration-300 group-focus-within:text-[#d4af37]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${GUEST.PLURAL} durchsuchen...`}
            className="w-full pl-8 pr-8 py-1.5 text-sm rounded-lg border border-[#d4af37]/20 bg-white focus:border-[#d4af37] focus:shadow-md focus:shadow-[#d4af37]/10 focus:outline-none transition-all duration-300 placeholder:text-[#999999]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-[#d4af37] transition-all duration-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <GuestFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          availableGroups={groups}
          partnerNames={partnerNames}
        />

        {viewMode === 'cards' && (
          <div className="mt-2 mb-2">
            <label className="flex items-center gap-1.5 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={groupByFamily}
                  onChange={(e) => setGroupByFamily(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border border-[#d4af37]/40 bg-white checked:bg-gradient-to-br checked:from-[#d4af37] checked:to-[#c19a2e] focus:ring-2 focus:ring-[#d4af37]/50 transition-all duration-300 cursor-pointer appearance-none checked:border-[#d4af37]"
                />
                {groupByFamily && (
                  <CheckCircle className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                )}
              </div>
              <span className="text-[11px] font-semibold text-[#0a253c] group-hover:text-[#d4af37] transition-colors duration-200">Nach Familie gruppieren</span>
            </label>
          </div>
        )}

        <div className="mt-3">
          {isLoading ? (
            viewMode === 'cards' ? <SkeletonList items={8} /> : <SkeletonTable rows={10} />
          ) : viewMode === 'cards' && groupByFamily ? (
            <div className="space-y-3">
              {groupedFamilies.map((family) => {
                const familyId = family.familyGroup?.id || 'ungrouped';
                const isExpanded = expandedFamilies.has(familyId);

                return (
                  <div key={familyId}>
                    <FamilyGroupHeader
                      familyGroup={family.familyGroup}
                      stats={family.stats}
                      isExpanded={isExpanded}
                      onToggle={() => handleFamilyToggle(familyId)}
                      partnerNames={partnerNames}
                    />

                    {isExpanded && (
                      <div className="mt-2 ml-4 space-y-2">
                        {family.guests.map((guest) => (
                          <SwipeableListItem
                            key={guest.id}
                            leftActions={[
                              {
                                icon: Edit,
                                label: 'Bearbeiten',
                                color: '#3B82F6',
                                onAction: () => setGuestToEdit(guest),
                              },
                            ]}
                            rightActions={[
                              {
                                icon: Trash2,
                                label: 'Löschen',
                                color: '#EF4444',
                                onAction: () => setGuestToDelete(guest),
                              },
                            ]}
                          >
                            <GuestCard
                              guest={guest}
                              groups={groups}
                              partnerNames={partnerNames}
                              onPartnerChange={handlePartnerChange}
                              onGroupChange={handleGroupChange}
                              onClick={() => setSelectedGuest(guest)}
                              onEditClick={() => setGuestToEdit(guest)}
                              onDeleteClick={() => setGuestToDelete(guest)}
                              isSelected={selectedGuestIds.has(guest.id)}
                              onSelectChange={(selected) => handleSelectGuest(guest.id, selected)}
                              showCheckbox={true}
                              enableSwipe={true}
                              enableLongPress={true}
                            />
                          </SwipeableListItem>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {groupedFamilies.length === 0 && (
                <div className="text-center py-8 text-[#666666] text-sm">
                  Keine {GUEST.PLURAL} gefunden
                </div>
              )}
            </div>
          ) : viewMode === 'cards' ? (
            <div className="space-y-2">
              {sortedGuests.map((guest) => (
                <SwipeableListItem
                  key={guest.id}
                  leftActions={[
                    {
                      icon: Edit,
                      label: 'Bearbeiten',
                      color: '#3B82F6',
                      onAction: () => setGuestToEdit(guest),
                    },
                  ]}
                  rightActions={[
                    {
                      icon: Trash2,
                      label: 'Löschen',
                      color: '#EF4444',
                      onAction: () => setGuestToDelete(guest),
                    },
                  ]}
                >
                  <GuestCard
                    guest={guest}
                    groups={groups}
                    partnerNames={partnerNames}
                    onPartnerChange={handlePartnerChange}
                    onGroupChange={handleGroupChange}
                    onClick={() => setSelectedGuest(guest)}
                    onEditClick={() => setGuestToEdit(guest)}
                    onDeleteClick={() => setGuestToDelete(guest)}
                    isSelected={selectedGuestIds.has(guest.id)}
                    onSelectChange={(selected) => handleSelectGuest(guest.id, selected)}
                    showCheckbox={true}
                    enableSwipe={true}
                    enableLongPress={true}
                  />
                </SwipeableListItem>
              ))}

              {sortedGuests.length === 0 && (
                <div className="text-center py-8 text-[#666666] text-sm">
                  Keine {GUEST.PLURAL} gefunden
                </div>
              )}
            </div>
          ) : (
            <GuestTableView
              guests={sortedGuests}
              groups={groups}
              partnerNames={partnerNames}
              onGuestClick={setSelectedGuest}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              selectedGuests={selectedGuestIds}
              onSelectChange={handleSelectGuest}
              onSelectAll={handleSelectAll}
              showCheckbox={true}
            />
          )}
        </div>
      </div>

      {showBulkActions && createPortal(
        <div
          className="fixed bottom-0 left-0 right-0 bg-[#0a253c] text-white p-4 shadow-lg"
          style={{ zIndex: 10000 }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CheckSquare className="w-6 h-6" />
              <span className="font-bold">{selectedGuestIds.size} {GUEST.PLURAL} ausgewählt</span>
            </div>

            <div className="flex items-center gap-3">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkRsvpChange(e.target.value as any);
                    e.target.value = '';
                  }
                }}
                className="px-4 py-2 rounded-lg bg-white text-[#0a253c] font-semibold"
              >
                <option value="">RSVP-Status ändern...</option>
                <option value="accepted">Zugesagt</option>
                <option value="declined">Abgesagt</option>
                <option value="invited">Eingeladen</option>
                <option value="planned">Geplant</option>
              </select>

              <button
                onClick={() => {
                  setSelectedGuestIds(new Set());
                  setShowBulkActions(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all"
              >
                <X className="w-4 h-4" />
                Abbrechen
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedGuest && (
        <GuestDetailModal
          isOpen={true}
          onClose={() => setSelectedGuest(null)}
          guestId={selectedGuest.id}
          weddingId={selectedGuest.wedding_id}
          onUpdate={onUpdate}
        />
      )}

      {guestToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-[#0a253c] mb-2">Gast löschen</h3>
            <p className="text-[#666666] mb-4">
              Möchten Sie <strong>{guestToDelete.name}</strong> wirklich löschen?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setGuestToDelete(null)}
                className="px-4 py-2 rounded-lg border border-[#d4af37]/30 text-[#0a253c] hover:bg-[#f7f2eb]/50 transition-all"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  handleDeleteGuest(guestToDelete);
                  setGuestToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
