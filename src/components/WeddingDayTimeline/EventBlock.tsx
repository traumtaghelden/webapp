import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Edit2, Trash2, MapPin, Clock, Users, Package, CheckSquare, Calendar, Car, Coffee, StickyNote } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SubTimelineTab from '../BlockPlanning/SubTimelineTab';
import VendorsTab from './VendorsTab';
import PackingListTab from './PackingListTab';
import ChecklistTab from './ChecklistTab';

interface WeddingDayBlock {
  id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location_name: string | null;
  location_address: string | null;
  color: string;
  icon: string;
  sort_order: number;
  is_expanded: boolean;
  is_buffer?: boolean;
  notes: string | null;
}

interface EventBlockProps {
  block: WeddingDayBlock;
  onToggleExpand: (blockId: string, isExpanded: boolean) => void;
  onEdit: (block: WeddingDayBlock) => void;
  onDelete: (blockId: string) => void;
}

type TabType = 'timeline' | 'vendors' | 'packing' | 'checklist';

// Color scheme for event types with shimmer effect
const getEventTypeColors = (eventType: string, isExpanded: boolean = false) => {
  const colorSchemes: Record<string, { bg: string; bgExpanded: string; shimmer: string; border: string; text: string; iconBg: string }> = {
    getting_ready: {
      bg: 'from-pink-500/20 via-pink-400/15 to-rose-500/20',
      bgExpanded: 'from-pink-500/95 via-pink-400/90 to-rose-500/95',
      shimmer: 'before:from-pink-400/0 before:via-pink-300/30 before:to-pink-400/0',
      border: 'border-pink-400/40',
      text: 'text-pink-100',
      iconBg: 'bg-gradient-to-br from-pink-500 to-rose-500'
    },
    ceremony: {
      bg: 'from-purple-500/20 via-purple-400/15 to-indigo-500/20',
      bgExpanded: 'from-purple-500/95 via-purple-400/90 to-indigo-500/95',
      shimmer: 'before:from-purple-400/0 before:via-purple-300/30 before:to-purple-400/0',
      border: 'border-purple-400/40',
      text: 'text-purple-100',
      iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-500'
    },
    cocktail: {
      bg: 'from-amber-500/20 via-yellow-400/15 to-orange-500/20',
      bgExpanded: 'from-amber-500/95 via-yellow-400/90 to-orange-500/95',
      shimmer: 'before:from-amber-400/0 before:via-yellow-300/30 before:to-amber-400/0',
      border: 'border-amber-400/40',
      text: 'text-amber-100',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500'
    },
    photoshoot: {
      bg: 'from-blue-500/20 via-cyan-400/15 to-sky-500/20',
      bgExpanded: 'from-blue-500/95 via-cyan-400/90 to-sky-500/95',
      shimmer: 'before:from-blue-400/0 before:via-cyan-300/30 before:to-blue-400/0',
      border: 'border-blue-400/40',
      text: 'text-blue-100',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500'
    },
    dinner: {
      bg: 'from-red-500/20 via-rose-400/15 to-pink-500/20',
      bgExpanded: 'from-red-500/95 via-rose-400/90 to-pink-500/95',
      shimmer: 'before:from-red-400/0 before:via-rose-300/30 before:to-red-400/0',
      border: 'border-red-400/40',
      text: 'text-red-100',
      iconBg: 'bg-gradient-to-br from-red-500 to-pink-500'
    },
    party: {
      bg: 'from-emerald-500/20 via-green-400/15 to-teal-500/20',
      bgExpanded: 'from-emerald-500/95 via-green-400/90 to-teal-500/95',
      shimmer: 'before:from-emerald-400/0 before:via-green-300/30 before:to-emerald-400/0',
      border: 'border-emerald-400/40',
      text: 'text-emerald-100',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500'
    },
    transfer: {
      bg: 'from-slate-500/20 via-gray-400/15 to-zinc-500/20',
      bgExpanded: 'from-slate-500/95 via-gray-400/90 to-zinc-500/95',
      shimmer: 'before:from-slate-400/0 before:via-gray-300/30 before:to-slate-400/0',
      border: 'border-slate-400/40',
      text: 'text-slate-100',
      iconBg: 'bg-gradient-to-br from-slate-500 to-zinc-500'
    },
    waiting: {
      bg: 'from-gray-500/15 via-gray-400/10 to-slate-500/15',
      bgExpanded: 'from-gray-500/95 via-gray-400/90 to-slate-500/95',
      shimmer: 'before:from-gray-400/0 before:via-gray-300/20 before:to-gray-400/0',
      border: 'border-gray-400/30',
      text: 'text-gray-200',
      iconBg: 'bg-gradient-to-br from-gray-500 to-slate-500'
    },
    other: {
      bg: 'from-yellow-500/20 via-amber-400/15 to-orange-400/20',
      bgExpanded: 'from-yellow-500/95 via-amber-400/90 to-orange-400/95',
      shimmer: 'before:from-yellow-400/0 before:via-amber-300/30 before:to-yellow-400/0',
      border: 'border-yellow-400/40',
      text: 'text-yellow-100',
      iconBg: 'bg-gradient-to-br from-yellow-500 to-orange-500'
    },
  };

  const scheme = colorSchemes[eventType] || colorSchemes.other;
  return {
    ...scheme,
    bg: isExpanded ? scheme.bgExpanded : scheme.bg
  };
};

export default function EventBlock({ block, onToggleExpand, onEdit, onDelete }: EventBlockProps) {
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [notes, setNotes] = useState(block.notes || '');
  const [stats, setStats] = useState({
    timelineCount: 0,
    vendorsCount: 0,
    packingTotal: 0,
    packingPacked: 0,
    checklistTotal: 0,
    checklistCompleted: 0,
  });

  const colors = getEventTypeColors(block.event_type, block.is_expanded);

  useEffect(() => {
    if (block.is_expanded && !block.is_buffer) {
      loadStats();
    }
  }, [block.is_expanded, block.id, block.is_buffer]);

  const loadStats = async () => {
    try {
      const [timelineRes, vendorsRes, packingRes, checklistRes] = await Promise.all([
        supabase.from('timeline_block_subtasks').select('id', { count: 'exact', head: true }).eq('block_id', block.id),
        supabase.from('wedding_day_vendors').select('id', { count: 'exact', head: true }).eq('block_id', block.id),
        supabase.from('wedding_day_packing_list').select('is_packed').eq('block_id', block.id),
        supabase.from('wedding_day_checklist').select('is_completed').eq('block_id', block.id),
      ]);

      const packingData = packingRes.data || [];
      const checklistData = checklistRes.data || [];

      setStats({
        timelineCount: timelineRes.count || 0,
        vendorsCount: vendorsRes.count || 0,
        packingTotal: packingData.length,
        packingPacked: packingData.filter(p => p.is_packed).length,
        checklistTotal: checklistData.length,
        checklistCompleted: checklistData.filter(c => c.is_completed).length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      Calendar: <Calendar className="w-6 h-6 text-white" />,
      Clock: <Clock className="w-6 h-6 text-white" />,
      Users: <Users className="w-6 h-6 text-white" />,
      Package: <Package className="w-6 h-6 text-white" />,
      Car: <Car className="w-6 h-6 text-white" />,
      Coffee: <Coffee className="w-6 h-6 text-white" />,
      MapPin: <MapPin className="w-6 h-6 text-white" />,
    };
    return iconMap[iconName] || <Calendar className="w-6 h-6 text-white" />;
  };

  const handleNotesUpdate = async () => {
    try {
      const { error } = await supabase
        .from('wedding_day_blocks')
        .update({ notes })
        .eq('id', block.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  // Render buffer block with simplified layout - responsive to available height
  if (block.is_buffer) {
    // Determine layout based on duration (estimate: 1 minute ≈ 1.33px at standard zoom)
    const isVerySmall = block.duration_minutes <= 30; // 30 minutes or less
    const isSmall = block.duration_minutes > 30 && block.duration_minutes <= 60; // 30-60 minutes

    // Buffer type labels
    const bufferTypeLabels: Record<string, string> = {
      waiting: 'Wartezeit',
      travel: 'Weg/Fahrt',
      break: 'Pause',
      preparation: 'Vorbereitung',
      transfer: 'Transfer',
    };

    const bufferTypeLabel = bufferTypeLabels[block.event_type] || block.event_type;

    return (
      <div className="h-full bg-gray-50/80 rounded-xl shadow border-2 border-dashed border-gray-300 overflow-hidden transition-all duration-300 hover:shadow-lg flex items-center">
        <div className={`w-full ${isVerySmall ? 'p-1 lg:p-1.5' : isSmall ? 'p-2 lg:p-3' : 'p-2 lg:p-4'}`}>
          <div className={`flex items-center justify-between ${isVerySmall ? 'gap-1 lg:gap-1.5' : 'gap-2 lg:gap-4'}`}>
            {/* Icon - smaller for compact layouts */}
            {!isVerySmall && (
              <div
                className={`flex-shrink-0 rounded-lg flex items-center justify-center shadow-sm ${
                  isSmall ? 'w-6 h-6 lg:w-8 lg:h-8' : 'w-8 h-8 lg:w-12 lg:h-12'
                }`}
                style={{ backgroundColor: block.color }}
              >
                <div className="scale-75 lg:scale-100">
                  {getIconComponent(block.icon)}
                </div>
              </div>
            )}

            {/* Content - single line for very small */}
            <div className="flex-1 min-w-0 flex items-center justify-between gap-1 lg:gap-2">
              {isVerySmall ? (
                // Ultra-compact: single line with buffer type badge
                <>
                  <div className="flex items-center gap-1 lg:gap-2 min-w-0">
                    <Clock className="w-2.5 h-2.5 lg:w-3 lg:h-3 flex-shrink-0 text-gray-600" />
                    <span className="text-[10px] lg:text-xs font-semibold text-gray-700 truncate">
                      {block.title}
                    </span>
                    <span className="hidden sm:inline px-1 lg:px-1.5 py-0.5 bg-gray-200 rounded text-[9px] lg:text-[10px] font-medium text-gray-600 whitespace-nowrap">
                      {bufferTypeLabel}
                    </span>
                    <span className="text-[10px] lg:text-xs text-gray-500 whitespace-nowrap">
                      <span className="hidden sm:inline">{block.start_time} - {block.end_time}</span>
                      <span className="sm:hidden">{block.start_time}</span>
                    </span>
                    <span className="hidden sm:inline text-[10px] lg:text-xs text-gray-400 whitespace-nowrap">
                      ({formatDuration(block.duration_minutes)})
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => onEdit(block)}
                      className="flex-shrink-0 text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded p-0.5 transition-all"
                      title="Bearbeiten"
                    >
                      <Edit2 className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                    </button>
                    <button
                      onClick={() => onDelete(block.id)}
                      className="flex-shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded p-0.5 transition-all"
                      title="Löschen"
                    >
                      <Trash2 className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 lg:gap-2 mb-0.5 lg:mb-1">
                      <h3 className={`font-bold text-gray-700 leading-tight truncate ${
                        isSmall ? 'text-xs lg:text-sm' : 'text-sm lg:text-base'
                      }`}>
                        {block.title}
                      </h3>
                      <span className={`px-1.5 lg:px-2 py-0.5 bg-gray-200 rounded font-medium text-gray-600 whitespace-nowrap ${
                        isSmall ? 'text-[9px] lg:text-[10px]' : 'text-[10px] lg:text-xs'
                      }`}>
                        {bufferTypeLabel}
                      </span>
                    </div>
                    <div className={`flex flex-wrap items-center gap-1 lg:gap-2 text-gray-600 ${
                      isSmall ? 'text-[10px] lg:text-xs' : 'text-xs lg:text-sm'
                    }`}>
                      <span className="flex items-center gap-1 font-medium whitespace-nowrap">
                        <Clock className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                        <span className="hidden sm:inline">{block.start_time} - {block.end_time}</span>
                        <span className="sm:hidden">{block.start_time}</span>
                      </span>
                      <span className="px-1 lg:px-1.5 py-0.5 bg-gray-200 rounded text-[10px] lg:text-xs font-medium whitespace-nowrap">
                        {formatDuration(block.duration_minutes)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-0.5 lg:gap-1 flex-shrink-0">
                    <button
                      onClick={() => onEdit(block)}
                      className={`text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg transition-all ${
                        isSmall ? 'p-0.5 lg:p-1' : 'p-1 lg:p-1.5'
                      }`}
                      title="Bearbeiten"
                    >
                      <Edit2 className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                    </button>
                    {!block.is_buffer && (
                      <button
                        onClick={() => setNotesExpanded(!notesExpanded)}
                        className={`text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg transition-all ${
                          isSmall ? 'p-0.5 lg:p-1' : 'p-1 lg:p-1.5'
                        }`}
                        title="Notizen"
                      >
                        <StickyNote className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(block.id)}
                      className={`text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ${
                        isSmall ? 'p-0.5 lg:p-1' : 'p-1 lg:p-1.5'
                      }`}
                      title="Löschen"
                    >
                      <Trash2 className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes Section - only show if expanded and not very small and not a buffer */}
          {notesExpanded && !isVerySmall && !block.is_buffer && (
            <div className={`pt-2 border-t border-gray-300 ${isSmall ? 'mt-2' : 'mt-3'}`}>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Notizen
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesUpdate}
                placeholder="Notizen..."
                className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none transition-all resize-none"
                rows={2}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${block.is_expanded ? 'min-h-full' : 'h-full'} rounded-xl shadow-gold timeline-block-hover timeline-border-glow timeline-expand-transition overflow-hidden flex flex-col bg-gradient-to-br ${!block.is_expanded ? 'backdrop-blur-sm' : ''} ${colors.bg} ${colors.border} border-2 relative before:absolute before:inset-0 before:bg-gradient-to-r ${colors.shimmer} before:animate-shimmer before:pointer-events-none`}>
      {/* Collapsed Header */}
      <div className="p-2 lg:p-5 flex-shrink-0">
        <div className="flex items-start gap-2 lg:gap-4">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-10 h-10 lg:w-14 lg:h-14 rounded-lg flex items-center justify-center shadow-md timeline-icon-rotate-glow timeline-glow-pulse ${colors.iconBg}`}
          >
            <div className="scale-75 lg:scale-100">
              {getIconComponent(block.icon)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1 lg:gap-2 mb-1 lg:mb-2">
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm lg:text-xl font-bold mb-0.5 lg:mb-1 ${colors.text} truncate`}>
                  {block.title}
                </h3>
                <div className={`flex flex-wrap items-center gap-1.5 lg:gap-3 text-xs lg:text-sm ${colors.text}`}>
                  <span className="flex items-center gap-1 font-medium whitespace-nowrap">
                    <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="hidden sm:inline">{block.start_time} - {block.end_time}</span>
                    <span className="sm:hidden">{block.start_time}</span>
                  </span>
                  <span className="px-1.5 lg:px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded text-[10px] lg:text-xs font-medium whitespace-nowrap">
                    {formatDuration(block.duration_minutes)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-0.5 lg:gap-2 flex-shrink-0">
                <button
                  onClick={() => onEdit(block)}
                  className="p-1 lg:p-2 text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg transition-all timeline-ripple-button hover:scale-110"
                  title="Bearbeiten"
                >
                  <Edit2 className="w-3 h-3 lg:w-4 lg:h-4" />
                </button>
                <button
                  onClick={() => onDelete(block.id)}
                  className="p-1 lg:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all timeline-ripple-button hover:scale-110"
                  title="Löschen"
                >
                  <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                </button>
                <button
                  onClick={() => onToggleExpand(block.id, !block.is_expanded)}
                  className="p-1 lg:p-2 text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg transition-all timeline-ripple-button hover:scale-110"
                >
                  {block.is_expanded ? (
                    <ChevronUp className="w-4 h-4 lg:w-5 lg:h-5" />
                  ) : (
                    <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Location */}
            {block.location_name && (
              <div className={`flex items-center gap-1 text-xs lg:text-sm mb-1 lg:mb-3 ${colors.text} opacity-90`}>
                <MapPin className="w-3 h-3 lg:w-4 lg:h-4 text-[#d4af37] flex-shrink-0" />
                <span className="truncate">{block.location_name}</span>
              </div>
            )}

            {/* Stats - Hide on small mobile when not expanded */}
            {!block.is_expanded && (
              <div className={`hidden sm:flex flex-wrap items-center gap-2 lg:gap-3 text-[10px] lg:text-xs ${colors.text} opacity-80`}>
                {stats.timelineCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {stats.timelineCount}
                  </span>
                )}
                {stats.vendorsCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {stats.vendorsCount}
                  </span>
                )}
                {stats.packingTotal > 0 && (
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {stats.packingPacked}/{stats.packingTotal}
                  </span>
                )}
                {stats.checklistTotal > 0 && (
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-3 h-3" />
                    {stats.checklistCompleted}/{stats.checklistTotal}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {block.is_expanded && (
        <div className={`border-t flex-1 flex flex-col min-h-0 timeline-content-fade ${colors.border}`}>
          {/* Tab Navigation */}
          <div className={`flex gap-2 px-5 pt-4 border-b overflow-x-auto flex-shrink-0 timeline-custom-scrollbar ${colors.border}`}>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap timeline-ripple-button hover:scale-105 ${
                activeTab === 'timeline'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white shadow-md'
                  : `bg-white/90 hover:bg-white text-gray-700`
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Timeline</span>
              {stats.timelineCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded timeline-badge-pop ${
                  activeTab === 'timeline' ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {stats.timelineCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('vendors')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap timeline-ripple-button hover:scale-105 ${
                activeTab === 'vendors'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white shadow-md'
                  : `bg-white/90 hover:bg-white text-gray-700`
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Dienstleister</span>
              {stats.vendorsCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded timeline-badge-pop ${
                  activeTab === 'vendors' ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {stats.vendorsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('packing')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap timeline-ripple-button hover:scale-105 ${
                activeTab === 'packing'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white shadow-md'
                  : `bg-white/90 hover:bg-white text-gray-700`
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Packliste</span>
              {stats.packingTotal > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded timeline-badge-pop ${
                  activeTab === 'packing' ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {stats.packingPacked}/{stats.packingTotal}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap timeline-ripple-button hover:scale-105 ${
                activeTab === 'checklist'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white shadow-md'
                  : `bg-white/90 hover:bg-white text-gray-700`
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Checkliste</span>
              {stats.checklistTotal > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded timeline-badge-pop ${
                  activeTab === 'checklist' ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {stats.checklistCompleted}/{stats.checklistTotal}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-5 bg-white/95 flex-1 overflow-y-auto min-h-0 timeline-custom-scrollbar timeline-tab-slide">
            {activeTab === 'timeline' && <SubTimelineTab event={{ id: block.id, time: block.start_time, duration_minutes: block.duration_minutes }} onUpdate={loadStats} />}
            {activeTab === 'vendors' && <VendorsTab blockId={block.id} onUpdate={loadStats} />}
            {activeTab === 'packing' && <PackingListTab blockId={block.id} onUpdate={loadStats} />}
            {activeTab === 'checklist' && <ChecklistTab blockId={block.id} onUpdate={loadStats} />}
          </div>
        </div>
      )}
    </div>
  );
}
