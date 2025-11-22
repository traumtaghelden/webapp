import { useMemo } from 'react';
import { type Guest, type FamilyGroup } from '../lib/supabase';

export interface FamilyGroupStats {
  total: number;
  adults: number;
  children: number;
  infants: number;
  rsvpAccepted: number;
  rsvpDeclined: number;
  rsvpPending: number;
  hasDietary: boolean;
  tables: number[];
  partner1Count: number;
  partner2Count: number;
  bothCount: number;
  unassignedCount: number;
}

export interface GroupedFamily {
  familyGroup: FamilyGroup | null;
  guests: Guest[];
  stats: FamilyGroupStats;
}

export function useFamilyGrouping(
  guests: Guest[],
  familyGroups: FamilyGroup[]
): GroupedFamily[] {
  return useMemo(() => {
    const groupedMap = new Map<string, Guest[]>();
    const ungroupedGuests: Guest[] = [];

    guests.forEach(guest => {
      if (guest.family_group_id) {
        const existing = groupedMap.get(guest.family_group_id) || [];
        groupedMap.set(guest.family_group_id, [...existing, guest]);
      } else {
        ungroupedGuests.push(guest);
      }
    });

    const calculateStats = (guestList: Guest[]): FamilyGroupStats => {
      const stats: FamilyGroupStats = {
        total: guestList.length,
        adults: 0,
        children: 0,
        infants: 0,
        rsvpAccepted: 0,
        rsvpDeclined: 0,
        rsvpPending: 0,
        hasDietary: false,
        tables: [],
        partner1Count: 0,
        partner2Count: 0,
        bothCount: 0,
        unassignedCount: 0,
      };

      const tableSet = new Set<number>();

      guestList.forEach(guest => {
        if (guest.age_group === 'adult') stats.adults++;
        else if (guest.age_group === 'child') stats.children++;
        else if (guest.age_group === 'infant') stats.infants++;

        if (guest.rsvp_status === 'accepted') stats.rsvpAccepted++;
        else if (guest.rsvp_status === 'declined') stats.rsvpDeclined++;
        else stats.rsvpPending++;

        if (guest.dietary_restrictions && guest.dietary_restrictions.trim()) {
          stats.hasDietary = true;
        }

        if (guest.table_number !== null) {
          tableSet.add(guest.table_number);
        }

        if (guest.partner_side === 'partner_1') stats.partner1Count++;
        else if (guest.partner_side === 'partner_2') stats.partner2Count++;
        else if (guest.partner_side === 'both') stats.bothCount++;
        else stats.unassignedCount++;
      });

      stats.tables = Array.from(tableSet).sort((a, b) => a - b);

      return stats;
    };

    const grouped: GroupedFamily[] = [];

    familyGroups.forEach(familyGroup => {
      const guestsInFamily = groupedMap.get(familyGroup.id) || [];
      if (guestsInFamily.length > 0) {
        grouped.push({
          familyGroup,
          guests: guestsInFamily,
          stats: calculateStats(guestsInFamily),
        });
      }
    });

    if (ungroupedGuests.length > 0) {
      grouped.push({
        familyGroup: null,
        guests: ungroupedGuests,
        stats: calculateStats(ungroupedGuests),
      });
    }

    return grouped;
  }, [guests, familyGroups]);
}
