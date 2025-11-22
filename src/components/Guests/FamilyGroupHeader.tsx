import { useState } from 'react';
import { Users, ChevronDown, ChevronRight, User, Baby, CheckCircle, XCircle, Clock, Utensils, Grid } from 'lucide-react';
import { type FamilyGroup } from '../../lib/supabase';
import { type FamilyGroupStats } from '../../hooks/useFamilyGrouping';

interface FamilyGroupHeaderProps {
  familyGroup: FamilyGroup | null;
  stats: FamilyGroupStats;
  isExpanded: boolean;
  onToggle: () => void;
  partnerNames: { partner_1: string; partner_2: string };
}

export default function FamilyGroupHeader({
  familyGroup,
  stats,
  isExpanded,
  onToggle,
  partnerNames
}: FamilyGroupHeaderProps) {
  const familyName = familyGroup?.family_name || 'Ohne Familie';

  const ageGroupText = [];
  if (stats.adults > 0) ageGroupText.push(`${stats.adults} Erw.`);
  if (stats.children > 0) ageGroupText.push(`${stats.children} Kinder`);
  if (stats.infants > 0) ageGroupText.push(`${stats.infants} Babys`);

  const rsvpText = `${stats.rsvpAccepted} von ${stats.total} zugesagt`;

  const partnerRollupParts = [];
  if (stats.partner1Count > 0) {
    const accepted = stats.partner1Count;
    partnerRollupParts.push(`${partnerNames.partner_1}: ${stats.partner1Count}`);
  }
  if (stats.partner2Count > 0) {
    partnerRollupParts.push(`${partnerNames.partner_2}: ${stats.partner2Count}`);
  }

  const tableText = stats.tables.length > 0
    ? `Tisch ${stats.tables.join(', ')}`
    : null;

  return (
    <div
      onClick={onToggle}
      className="bg-[#f7f2eb] rounded-xl p-4 cursor-pointer hover:bg-[#d4af37]/10 transition-all border-2 border-[#d4af37]/30 hover:border-[#d4af37]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <button className="flex-shrink-0 text-[#d4af37]">
            {isExpanded ? (
              <ChevronDown className="w-6 h-6" />
            ) : (
              <ChevronRight className="w-6 h-6" />
            )}
          </button>

          <div className="w-12 h-12 rounded-full bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-[#d4af37]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-bold text-[#0a253c] text-lg">{familyName}</h3>
              <span className="px-3 py-1 bg-[#d4af37] text-white rounded-full text-sm font-bold">
                {stats.total} {stats.total === 1 ? 'Person' : 'Personen'}
              </span>
              {stats.hasDietary && (
                <span
                  className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold"
                  title="Jemand hat Ernährungseinschränkungen"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  Dietary
                </span>
              )}
              {tableText && (
                <span
                  className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold"
                  title="Tischzuordnung"
                >
                  <Grid className="w-3.5 h-3.5" />
                  {tableText}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-[#666666] flex-wrap">
              {ageGroupText.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {ageGroupText.join(' · ')}
                </span>
              )}

              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-600" />
                {rsvpText}
              </span>

              {partnerRollupParts.length > 0 && (
                <span className="text-xs font-semibold">
                  {partnerRollupParts.join(' · ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
