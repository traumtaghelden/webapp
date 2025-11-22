import { useState, useEffect } from 'react';
import { X, Clock, MapPin, Users, Package, CheckSquare } from 'lucide-react';
import SubTimelineTab from '../BlockPlanning/SubTimelineTab';
import VendorsTab from './VendorsTab';
import PackingListTab from './PackingListTab';
import ChecklistTab from './ChecklistTab';
import { supabase } from '../../lib/supabase';

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
  day_offset: number;
}

interface BlockDetailModalProps {
  block: WeddingDayBlock;
  onClose: () => void;
  onUpdate: () => void;
}

type TabType = 'timeline' | 'vendors' | 'packing' | 'checklist';

export default function BlockDetailModal({ block, onClose, onUpdate }: BlockDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [stats, setStats] = useState({
    timelineCount: 0,
    vendorsCount: 0,
    packingTotal: 0,
    packingPacked: 0,
    checklistTotal: 0,
    checklistCompleted: 0,
  });

  useEffect(() => {
    loadStats();
    // Prevent body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    const scrollY = window.scrollY;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, [block.id]);

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:max-w-6xl sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div
          className="text-white px-4 py-4 rounded-t-none sm:rounded-t-2xl flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${block.color} 0%, ${block.color}dd 100%)`
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold break-words pr-2 flex-1">{block.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-white/90">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{block.start_time} - {block.end_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(block.duration_minutes)}</span>
            </div>
            {block.location_name && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{block.location_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 sm:gap-2 px-2 sm:px-4 pt-2 sm:pt-3 border-b border-gray-200 flex-shrink-0 scrollbar-hide" style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-t-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white shadow-md'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Timeline</span>
            {stats.timelineCount > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                activeTab === 'timeline' ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {stats.timelineCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-t-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'vendors'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white shadow-md'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Dienstleister</span>
            {stats.vendorsCount > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                activeTab === 'vendors' ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {stats.vendorsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('packing')}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-t-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'packing'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white shadow-md'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Packliste</span>
            {stats.packingTotal > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                activeTab === 'packing' ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {stats.packingPacked}/{stats.packingTotal}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-t-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white shadow-md'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Checkliste</span>
            {stats.checklistTotal > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                activeTab === 'checklist' ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {stats.checklistCompleted}/{stats.checklistTotal}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-gray-50">
          {activeTab === 'timeline' && <SubTimelineTab event={{ id: block.id, time: block.start_time, duration_minutes: block.duration_minutes }} onUpdate={loadStats} onUnsavedChanges={() => {}} />}
          {activeTab === 'vendors' && <VendorsTab blockId={block.id} onUpdate={loadStats} />}
          {activeTab === 'packing' && <PackingListTab blockId={block.id} onUpdate={loadStats} />}
          {activeTab === 'checklist' && <ChecklistTab blockId={block.id} onUpdate={loadStats} />}
        </div>
      </div>
    </div>
  );
}
