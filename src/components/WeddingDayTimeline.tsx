import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar, Clock, MapPin, ChevronDown, ChevronUp, Edit2, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import EventBlock from './WeddingDayTimeline/EventBlock';
import BlockEditModal from './WeddingDayTimeline/BlockEditModal';
import BufferBlockModal from './WeddingDayTimeline/BufferBlockModal';
import BlockDetailModal from './WeddingDayTimeline/BlockDetailModal';

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
  day_offset: number; // 0 = Hochzeitstag, 1 = Folgetag (+1)
}

export default function WeddingDayTimeline() {
  const [blocks, setBlocks] = useState<WeddingDayBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<WeddingDayBlock | null>(null);
  const [showBufferModal, setShowBufferModal] = useState(false);
  const [bufferTimeSlot, setBufferTimeSlot] = useState<{ start: string; end: string } | null>(null);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [selectedBlockForPlanning, setSelectedBlockForPlanning] = useState<WeddingDayBlock | null>(null);
  const { showToast } = useToast();

  const loadBlocks = useCallback(async (wId: string) => {
    try {
      const { data, error } = await supabase
        .from('wedding_day_blocks')
        .select('*')
        .eq('wedding_id', wId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Sort blocks by actual time (day_offset + start_time) for gap detection
      const sortedBlocks = (data || []).sort((a, b) => {
        // Compare day_offset first
        if (a.day_offset !== b.day_offset) {
          return a.day_offset - b.day_offset;
        }
        // Then compare start_time
        return a.start_time.localeCompare(b.start_time);
      });

      setBlocks(sortedBlocks);
    } catch (error) {
      console.error('Error loading blocks:', error);
      showToast('Fehler beim Laden der Event-Blöcke', 'error');
    }
  }, [showToast]);

  const loadWeddingAndBlocks = useCallback(async () => {
    try {
      console.log('Loading wedding and blocks...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User:', user?.id);

      if (!user) {
        console.error('No user found');
        return;
      }

      const { data: wedding, error } = await supabase
        .from('weddings')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('Wedding query result:', { wedding, error });

      if (error) {
        console.error('Error fetching wedding:', error);
        showToast('Fehler beim Laden der Hochzeitsdaten', 'error');
        return;
      }

      if (wedding) {
        console.log('Setting wedding ID:', wedding.id);
        setWeddingId(wedding.id);
        await loadBlocks(wedding.id);
      } else {
        console.error('No wedding found for user');
        showToast('Keine Hochzeit gefunden', 'error');
      }
    } catch (error) {
      console.error('Error loading wedding:', error);
      showToast('Fehler beim Laden der Daten', 'error');
    } finally {
      setLoading(false);
    }
  }, [loadBlocks, showToast]);

  useEffect(() => {
    loadWeddingAndBlocks();
  }, [loadWeddingAndBlocks]);

  const handleAddBlock = () => {
    setEditingBlock(null);
    setShowAddModal(true);
  };

  const handleEditBlock = (block: WeddingDayBlock) => {
    setEditingBlock(block);

    // Check if it's a buffer block
    if (block.is_buffer) {
      // Open buffer modal for editing
      setBufferTimeSlot({ start: block.start_time, end: block.end_time });
      setShowBufferModal(true);
    } else {
      // Open regular block edit modal
      setShowAddModal(true);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Möchten Sie diesen Event-Block wirklich löschen? Alle zugehörigen Daten (Timeline, Dienstleister, Packliste, Checkliste) werden ebenfalls gelöscht.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('wedding_day_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      setBlocks(blocks.filter(b => b.id !== blockId));
      showToast('Event-Block erfolgreich gelöscht', 'success');
    } catch (error) {
      console.error('Error deleting block:', error);
      showToast('Fehler beim Löschen des Event-Blocks', 'error');
    }
  };

  const handleSaveBlock = useCallback(async (blockData: Partial<WeddingDayBlock>) => {
    console.log('handleSaveBlock called with:', blockData);
    console.log('weddingId:', weddingId);

    if (!weddingId) {
      console.error('No wedding ID available!');
      showToast('Fehler: Keine Hochzeits-ID gefunden', 'error');
      return;
    }

    try {
      // Bereite die Daten vor und entferne duration_minutes (wird automatisch berechnet)
      const { duration_minutes, id, wedding_id, created_at, updated_at, ...dataToSave } = blockData as any;

      // Konvertiere leere Strings zu null für nullable Felder
      const cleanedData = {
        ...dataToSave,
        description: dataToSave.description?.trim() || null,
        location_name: dataToSave.location_name?.trim() || null,
        location_address: dataToSave.location_address?.trim() || null,
        notes: dataToSave.notes?.trim() || null,
      };

      console.log('Saving block with data:', cleanedData);

      if (editingBlock) {
        // Update existing block
        const { error } = await supabase
          .from('wedding_day_blocks')
          .update(cleanedData)
          .eq('id', editingBlock.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        showToast('Event-Block aktualisiert', 'success');
      } else {
        // Create new block
        const insertData = {
          ...cleanedData,
          wedding_id: weddingId,
          sort_order: blocks.length,
          is_expanded: false,
        };

        console.log('Inserting block:', insertData);

        const { error, data } = await supabase
          .from('wedding_day_blocks')
          .insert(insertData)
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        console.log('Insert successful:', data);
        showToast('Event-Block erstellt', 'success');
      }

      await loadBlocks(weddingId);
      setShowAddModal(false);
      setEditingBlock(null);
    } catch (error) {
      console.error('Error saving block:', error);
      showToast('Fehler beim Speichern', 'error');
    }
  }, [weddingId, editingBlock, blocks.length, showToast, loadBlocks]);

  const handleToggleExpand = async (blockId: string, isExpanded: boolean) => {
    const block = blocks.find(b => b.id === blockId);

    // On mobile (< 1024px), open BlockPlanningModal instead of inline expand
    if (window.innerWidth < 1024 && block && !block.is_buffer) {
      if (isExpanded) {
        setSelectedBlockForPlanning(block);
        setShowPlanningModal(true);
      }
      return;
    }

    // Desktop: use inline expand/collapse
    try {
      if (isExpanded) {
        // Wenn ein Block geöffnet wird, schließe alle anderen Blöcke
        // Batch update: alle Blöcke auf collapsed setzen
        const { error: closeError } = await supabase
          .from('wedding_day_blocks')
          .update({ is_expanded: false })
          .neq('id', blockId);

        if (closeError) throw closeError;

        // Dann öffne den ausgewählten Block
        const { error: openError } = await supabase
          .from('wedding_day_blocks')
          .update({ is_expanded: true })
          .eq('id', blockId);

        if (openError) throw openError;

        // Lokalen State aktualisieren: nur der ausgewählte Block ist expanded
        setBlocks(blocks.map(b => ({
          ...b,
          is_expanded: b.id === blockId
        })));
      } else {
        // Block schließen
        const { error } = await supabase
          .from('wedding_day_blocks')
          .update({ is_expanded: false })
          .eq('id', blockId);

        if (error) throw error;

        setBlocks(blocks.map(b =>
          b.id === blockId ? { ...b, is_expanded: false } : b
        ));
      }
    } catch (error) {
      console.error('Error updating expand state:', error);
      showToast('Fehler beim Aktualisieren des Event-Blocks', 'error');
    }
  };

  // Convert time to minutes, using day_offset to determine if next day
  const timeToMinutes = (time: string, dayOffset: number = 0): number => {
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;

    // Add 24 hours for each day offset (0 = same day, 1 = next day)
    if (dayOffset > 0) {
      totalMinutes += dayOffset * 24 * 60;
    }

    return totalMinutes;
  };

  const getTimeRange = () => {
    if (blocks.length === 0) return { minHour: 0, maxHour: 23 };

    // Find earliest start time (considering day_offset)
    let minMinutes = Infinity;
    blocks.forEach(block => {
      const startMinutes = timeToMinutes(block.start_time, block.day_offset);
      if (startMinutes < minMinutes) {
        minMinutes = startMinutes;
      }
    });
    const minHour = Math.max(0, Math.floor(minMinutes / 60));

    // Find the latest end time (considering day_offset)
    let maxMinutes = 0;
    blocks.forEach(block => {
      const endMinutes = timeToMinutes(block.end_time, block.day_offset);
      if (endMinutes > maxMinutes) {
        maxMinutes = endMinutes;
      }
    });

    // Convert max minutes back to hours, with extra hour for buffer
    const maxHour = Math.ceil((maxMinutes + 60) / 60);

    return { minHour, maxHour };
  };

  const generateTimeMarkers = () => {
    if (blocks.length === 0) return [];
    const { minHour, maxHour } = getTimeRange();
    const markers = [];

    for (let hour = minHour; hour <= maxHour; hour++) {
      // Display hours beyond 24 as next-day times (e.g., 25 = 01:00, 26 = 02:00)
      const displayHour = hour >= 24 ? hour - 24 : hour;
      const nextDayIndicator = hour >= 24 ? ' (+1)' : '';

      // Calculate which blocks are expanded before this hour to apply correct offset
      let offsetForThisHour = 0;
      blocks.forEach((block) => {
        const blockStartMinutes = timeToMinutes(block.start_time, block.day_offset);
        const blockStartHour = Math.floor(blockStartMinutes / 60);
        if (block.is_expanded && blockStartHour < hour) {
          offsetForThisHour += 700; // Match expandedAdditionalHeight
        }
      });

      markers.push(
        <div
          key={hour}
          className="absolute flex items-center gap-1 lg:gap-2 timeline-content-fade transition-all duration-500 ease-in-out"
          style={{
            top: `${(hour - minHour) * 80 + offsetForThisHour}px`,
            animationDelay: `${(hour - minHour) * 0.05}s`
          }}
        >
          <div className="text-[10px] lg:text-xs font-bold text-[#F5B800] w-10 lg:w-16 text-right">
            {displayHour.toString().padStart(2, '0')}:00
            <span className="hidden lg:inline">{nextDayIndicator}</span>
          </div>
          <div className="w-2 lg:w-4 h-0.5 lg:h-1 bg-gradient-to-r from-[#F5B800] to-transparent rounded-full timeline-marker-pulse"></div>
        </div>
      );
    }
    return markers;
  };

  const handleOpenBufferModal = (gapStartTime: string, gapEndTime: string) => {
    setBufferTimeSlot({ start: gapStartTime, end: gapEndTime });
    setShowBufferModal(true);
  };

  const handleSaveBuffer = async (bufferType: string, bufferName: string) => {
    if (!weddingId) return;

    // For editing, bufferTimeSlot might not be needed as we keep the original times
    if (!editingBlock && !bufferTimeSlot) return;

    try {
      // Map buffer types to colors and icons
      const bufferTypeConfig: Record<string, { color: string; icon: string }> = {
        waiting: { color: '#94A3B8', icon: 'Clock' },
        travel: { color: '#64748B', icon: 'Car' },
        break: { color: '#8B5CF6', icon: 'Coffee' },
        preparation: { color: '#3B82F6', icon: 'Users' },
        transfer: { color: '#10B981', icon: 'MapPin' },
      };

      const config = bufferTypeConfig[bufferType] || { color: '#94A3B8', icon: 'Clock' };

      // Check if we're editing an existing buffer
      if (editingBlock && editingBlock.is_buffer) {
        // Update existing buffer
        const updateData = {
          title: bufferName,
          event_type: bufferType,
          color: config.color,
          icon: config.icon,
        };

        const { error } = await supabase
          .from('wedding_day_blocks')
          .update(updateData)
          .eq('id', editingBlock.id);

        if (error) throw error;

        showToast('Pufferzeit erfolgreich aktualisiert', 'success');
      } else {
        // Create new buffer
        const insertData = {
          wedding_id: weddingId,
          title: bufferName,
          event_type: bufferType,
          start_time: bufferTimeSlot.start,
          end_time: bufferTimeSlot.end,
          color: config.color,
          icon: config.icon,
          sort_order: blocks.length,
          is_expanded: false,
          is_buffer: true,
        };

        const { error } = await supabase
          .from('wedding_day_blocks')
          .insert(insertData);

        if (error) throw error;

        showToast('Pufferzeit erfolgreich hinzugefügt', 'success');
      }

      await loadBlocks(weddingId);
      setShowBufferModal(false);
      setBufferTimeSlot(null);
      setEditingBlock(null);
    } catch (error) {
      console.error('Error saving buffer:', error);
      showToast('Fehler beim Speichern der Pufferzeit', 'error');
    }
  };

  const renderBlocksWithGaps = () => {
    if (blocks.length === 0) return null;

    const { minHour } = getTimeRange();
    const startMinutes = minHour * 60;
    const pixelsPerMinute = 80 / 60; // 80px per hour

    const elements: React.ReactNode[] = [];
    let cumulativeOffset = 0; // Track cumulative vertical offset from expanded blocks

    blocks.forEach((block, index) => {
      const blockStartMinutes = timeToMinutes(block.start_time, block.day_offset);
      const blockEndMinutes = timeToMinutes(block.end_time, block.day_offset);
      const blockDuration = blockEndMinutes - blockStartMinutes;

      const baseTopPosition = (blockStartMinutes - startMinutes) * pixelsPerMinute;
      const topPosition = baseTopPosition + cumulativeOffset;
      const height = blockDuration * pixelsPerMinute;

      // Add minimal gap between blocks (4px)
      const blockGap = 4;
      const adjustedHeight = Math.max(height - blockGap, 40); // Minimum 40px height

      // When expanded, provide plenty of vertical space for content
      const expandedAdditionalHeight = block.is_expanded ? 700 : 0;

      const blockStyle = block.is_expanded
        ? {
            top: `${topPosition}px`,
            height: 'auto',
            minHeight: `${adjustedHeight + expandedAdditionalHeight}px`,
            zIndex: 20,
          }
        : {
            top: `${topPosition}px`,
            height: `${adjustedHeight}px`,
            zIndex: 1,
          };

      elements.push(
        <div
          key={block.id}
          className="absolute w-full transition-all duration-500 ease-in-out"
          style={blockStyle}
        >
          <EventBlock
            block={block}
            onToggleExpand={handleToggleExpand}
            onEdit={handleEditBlock}
            onDelete={handleDeleteBlock}
          />
        </div>
      );

      // Update cumulative offset for next blocks
      if (block.is_expanded) {
        cumulativeOffset += expandedAdditionalHeight;
      }

      // Check for gap after this block (if not last block and current block is not a buffer)
      if (index < blocks.length - 1 && !block.is_buffer) {
        const nextBlock = blocks[index + 1];
        const gapStart = blockEndMinutes;
        const gapEnd = timeToMinutes(nextBlock.start_time, nextBlock.day_offset);
        const gapDuration = gapEnd - gapStart;

        // Only show gap if it's at least 15 minutes and next block is not a buffer
        if (gapDuration >= 15 && !nextBlock.is_buffer) {
          const baseGapTopPosition = (gapStart - startMinutes) * pixelsPerMinute;
          const gapTopPosition = baseGapTopPosition + cumulativeOffset;
          const gapHeight = gapDuration * pixelsPerMinute;

          const formatTime = (minutes: number) => {
            let h = Math.floor(minutes / 60);
            const m = minutes % 60;
            // Handle next-day times (e.g., 25:00 -> 01:00, 26:30 -> 02:30)
            if (h >= 24) {
              h = h - 24;
            }
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          };

          // Adjust button size based on available space
          const isSmallGap = gapHeight < 60; // Less than 60px height
          const isMediumGap = gapHeight >= 60 && gapHeight < 100;

          elements.push(
            <div
              key={`gap-${block.id}-${nextBlock.id}`}
              className="absolute w-full transition-all duration-500 ease-in-out"
              style={{
                top: `${gapTopPosition}px`,
                height: `${gapHeight}px`,
                zIndex: 10,
                pointerEvents: 'auto'
              }}
            >
              <div className="h-full bg-white/5 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all">
                <button
                  onClick={() => handleOpenBufferModal(formatTime(gapStart), formatTime(gapEnd))}
                  className={`bg-white/10 hover:bg-white/20 border-2 border-dashed border-white/30 hover:border-[#F5B800] text-white rounded-lg font-medium shadow-sm hover:shadow-md flex items-center gap-2 hover:scale-105 transition-all duration-300 ${
                    isSmallGap
                      ? 'px-2 py-1 text-xs'
                      : isMediumGap
                      ? 'px-3 py-1.5 text-xs'
                      : 'px-4 py-2 text-sm'
                  }`}
                  style={{ pointerEvents: 'auto' }}
                  title={`${Math.floor(gapDuration / 60)}h ${gapDuration % 60}min Puffer hinzufügen`}
                >
                  <Clock className={isSmallGap ? 'w-3 h-3' : 'w-4 h-4'} />
                  {isSmallGap ? (
                    // Very compact: just duration
                    <span>{Math.floor(gapDuration / 60)}h {gapDuration % 60}m</span>
                  ) : isMediumGap ? (
                    // Medium: duration + "Puffer"
                    <span>{Math.floor(gapDuration / 60)}h {gapDuration % 60}min Puffer</span>
                  ) : (
                    // Full text for large gaps
                    <span>{Math.floor(gapDuration / 60)}h {gapDuration % 60}min Puffer hinzufügen</span>
                  )}
                </button>
              </div>
            </div>
          );
        }
      }
    });

    return elements;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] relative overflow-hidden p-4 lg:p-8">
      {/* Floating Orbs */}
      <div className="timeline-floating-orb" style={{ top: '10%', left: '5%' }} />
      <div className="timeline-floating-orb" style={{ top: '60%', right: '10%', animationDelay: '4s' }} />
      <div className="timeline-floating-orb" style={{ bottom: '20%', left: '15%', animationDelay: '8s' }} />

      {/* Particle Container */}
      <div className="timeline-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="timeline-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              '--tx': `${(Math.random() - 0.5) * 100}px`,
              '--ty': `${-Math.random() * 150}px`
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-8 h-8 text-[#F5B800]" />
              Hochzeitstag Timeline
            </h1>
            <p className="text-gray-300 mt-1">
              Planen Sie Ihren perfekten Hochzeitstag minutengenau
            </p>
          </div>
          <button
            onClick={handleAddBlock}
            className="bg-[#F5B800] hover:bg-[#E0A800] text-gray-900 font-medium px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-2xl timeline-ripple-button hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Block hinzufügen</span>
          </button>
        </div>

        {/* Stats */}
        {blocks.length > 0 && (
          <div className="timeline-content-fade">
            {/* Mobile Toggle Button */}
            <button
              onClick={() => setIsStatsExpanded(!isStatsExpanded)}
              className="md:hidden w-full bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 flex items-center justify-between hover:bg-white/15 transition-all duration-300 mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-white">Statistik</div>
                <div className="text-xs text-gray-300">
                  {blocks.length} Blöcke
                </div>
              </div>
              {isStatsExpanded ? (
                <ChevronUp className="w-5 h-5 text-[#F5B800]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#F5B800]" />
              )}
            </button>

            {/* Stats Grid - Always visible on desktop, collapsible on mobile */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${isStatsExpanded ? 'block' : 'hidden md:grid'}`}>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 timeline-ambient-glow timeline-stat-count-up hover:bg-white/20 transition-all duration-300">
                <div className="text-sm text-gray-300">Gesamt-Blöcke</div>
                <div className="text-2xl font-bold text-white">{blocks.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 timeline-ambient-glow timeline-stat-count-up hover:bg-white/20 transition-all duration-300" style={{ animationDelay: '0.1s' }}>
                <div className="text-sm text-gray-300">Erste Event</div>
                <div className="text-2xl font-bold text-white">
                  {blocks[0]?.start_time || '--:--'}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 timeline-ambient-glow timeline-stat-count-up hover:bg-white/20 transition-all duration-300" style={{ animationDelay: '0.2s' }}>
                <div className="text-sm text-gray-300">Letzte Event</div>
                <div className="text-2xl font-bold text-white">
                  {blocks[blocks.length - 1]?.end_time || '--:--'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto relative z-10">
        {blocks.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/20 timeline-ambient-glow timeline-content-fade">
            <Calendar className="w-16 h-16 text-[#F5B800] mx-auto mb-4 timeline-glow-pulse" />
            <h3 className="text-xl font-bold text-white mb-2">
              Noch keine Event-Blöcke erstellt
            </h3>
            <p className="text-gray-300 mb-6">
              Beginnen Sie mit der Planung Ihres Hochzeitstages, indem Sie Ihren ersten Event-Block hinzufügen.
            </p>
            <button
              onClick={handleAddBlock}
              className="bg-[#F5B800] hover:bg-[#E0A800] text-gray-900 font-medium px-6 py-3 rounded-lg inline-flex items-center gap-2 timeline-ripple-button hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Ersten Block erstellen
            </button>
          </div>
        ) : (
          <div className="flex gap-3 lg:gap-6">
            {/* Time Axis - Now visible on mobile too */}
            <div className="flex-shrink-0 w-12 lg:w-20">
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 lg:w-1 bg-gradient-to-b from-[#F5B800]/20 via-[#F5B800]/40 to-[#F5B800]/20 rounded-full timeline-glow-pulse" />
                {generateTimeMarkers()}
              </div>
            </div>

            {/* Blocks List with absolute positioning */}
            <div
              className="flex-1 relative transition-all duration-500 ease-in-out"
              style={{
                minHeight: `${
                  (getTimeRange().maxHour - getTimeRange().minHour + 1) * 80 +
                  blocks.filter(b => b.is_expanded).length * 700
                }px`
              }}
            >
              {renderBlocksWithGaps()}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <BlockEditModal
          block={editingBlock}
          onSave={handleSaveBlock}
          onClose={() => {
            setShowAddModal(false);
            setEditingBlock(null);
          }}
        />
      )}

      {/* Buffer Modal */}
      {showBufferModal && bufferTimeSlot && (
        <BufferBlockModal
          startTime={bufferTimeSlot.start}
          endTime={bufferTimeSlot.end}
          onSave={handleSaveBuffer}
          onClose={() => {
            setShowBufferModal(false);
            setBufferTimeSlot(null);
            setEditingBlock(null);
          }}
          existingBlock={editingBlock && editingBlock.is_buffer ? {
            title: editingBlock.title,
            event_type: editingBlock.event_type
          } : undefined}
          isEdit={!!(editingBlock && editingBlock.is_buffer)}
        />
      )}

      {/* Block Detail Modal (Mobile Fullscreen) */}
      {showPlanningModal && selectedBlockForPlanning && (
        <BlockDetailModal
          block={selectedBlockForPlanning}
          onClose={() => {
            setShowPlanningModal(false);
            setSelectedBlockForPlanning(null);
          }}
          onUpdate={() => {
            if (weddingId) {
              loadBlocks(weddingId);
            }
          }}
        />
      )}
    </div>
  );
}
