import { useState } from 'react';
import { Star, Mail, Phone, DollarSign, ExternalLink, CheckCircle, Clock, AlertCircle, Edit, Scale } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { type Vendor } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import VendorAvatar from '../common/VendorAvatar';

interface VendorHeroCardProps {
  vendor: Vendor;
  onUpdate: () => void;
  onEdit?: () => void;
  size?: 'normal' | 'compact';
  isDragging?: boolean;
  isCompareSelected?: boolean;
  onToggleCompare?: () => void;
  enableDragDrop?: boolean;
}

export default function VendorHeroCard({
  vendor,
  onUpdate,
  onEdit,
  size = 'normal',
  isDragging,
  isCompareSelected = false,
  onToggleCompare,
  enableDragDrop = false
}: VendorHeroCardProps) {
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const { attributes, listeners, setNodeRef: setDragNodeRef, transform, isDragging: isDraggingFromDnD } = useDraggable({
    id: vendor.id,
    disabled: !enableDragDrop
  });

  const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
    id: vendor.id,
    disabled: !enableDragDrop
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDragNodeRef(node);
    setDropNodeRef(node);
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const isBooked = vendor.contract_status === 'signed' || vendor.contract_status === 'completed';
  const isFavorite = vendor.is_favorite || (vendor.rating && vendor.rating >= 4);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ is_favorite: !vendor.is_favorite })
        .eq('id', vendor.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const getStatusColor = () => {
    switch (vendor.contract_status) {
      case 'signed':
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (vendor.contract_status) {
      case 'signed':
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'cancelled':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusLabel = () => {
    switch (vendor.contract_status) {
      case 'signed':
        return 'Gebucht';
      case 'completed':
        return 'Abgeschlossen';
      case 'pending':
        return 'In Verhandlung';
      case 'cancelled':
        return 'Storniert';
      default:
        return 'Anfrage';
    }
  };

  const cardSize = size === 'normal' ? 'p-6' : 'p-4';
  const avatarSize = size === 'normal' ? 'xl' : 'lg';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(enableDragDrop ? attributes : {})}
      {...(enableDragDrop ? listeners : {})}
      className={`
        bg-white rounded-3xl ${cardSize} shadow-lg hover:shadow-2xl
        transition-all duration-300
        border-2 ${
          isCompareSelected
            ? 'border-blue-500 bg-gradient-to-br from-blue-50/50 to-white ring-4 ring-blue-300'
            : isBooked
            ? 'border-green-300 bg-gradient-to-br from-green-50/50 to-white'
            : 'border-[#d4af37]/30 hover:border-[#d4af37]'
        }
        ${isDragging || isDraggingFromDnD ? 'scale-105 rotate-2 shadow-2xl opacity-75' : ''}
        ${isOver && !isDraggingFromDnD ? 'ring-4 ring-blue-400 scale-105 border-blue-500' : ''}
        relative overflow-hidden group cursor-pointer
        transform hover:scale-105
      `}
      onMouseEnter={() => setShowQuickActions(true)}
      onMouseLeave={() => setShowQuickActions(false)}
      onClick={onEdit}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-full blur-3xl" />

      {isBooked && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-400" />
      )}

      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {onToggleCompare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare();
            }}
            className={`
              transition-all duration-300 p-1.5 rounded-lg
              ${isCompareSelected ? 'bg-blue-500 text-white scale-110' : 'bg-white/80 text-gray-600 hover:bg-blue-100 hover:text-blue-600'}
            `}
          >
            <Scale className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={toggleFavorite}
          disabled={isTogglingFavorite}
          className={`
            transition-all duration-300
            ${isFavorite ? 'text-[#d4af37] scale-125' : 'text-gray-300 hover:text-[#d4af37] hover:scale-110'}
          `}
        >
          <Star
            className="w-6 h-6"
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      <div className="relative flex flex-col items-center">
        <div className="mb-6 mt-2">
          <VendorAvatar
            name={vendor.name}
            category={vendor.category}
            size={avatarSize}
            isBooked={isBooked}
            isFavorite={isFavorite}
          />
        </div>

        <h3 className="text-xl font-bold text-[#0a253c] text-center mb-2 px-2">
          {vendor.name}
        </h3>

        <div className={`flex items-center gap-1 mb-3 px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          {getStatusLabel()}
        </div>

        {vendor.description && size === 'normal' && (
          <p className="text-sm text-[#666666] text-center line-clamp-2 mb-4 px-4">
            {vendor.description}
          </p>
        )}

        <div className="w-full pt-4 border-t border-[#d4af37]/20">
          <div className="flex items-center justify-center gap-2">
            {vendor.total_cost && vendor.total_cost > 0 ? (
              <>
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-xl font-bold text-green-600">
                  {Number(vendor.total_cost).toLocaleString('de-DE')} €
                </span>
              </>
            ) : (
              <span className="text-sm text-[#999999]">Preis auf Anfrage</span>
            )}
          </div>
        </div>

        {size === 'normal' && vendor.deposit_paid && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-4 border-t border-[#d4af37]/20">
            {vendor.deposit_paid && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" />
                Anzahlung erfolgt
              </div>
            )}
          </div>
        )}
      </div>

      {showQuickActions && size === 'normal' && (
        <div className="absolute inset-0 bg-[#0a253c]/95 rounded-3xl flex items-center justify-center z-10 animate-fadeIn">
          <div className="space-y-3 px-6 w-full">
            {vendor.email && (
              <a
                href={`mailto:${vendor.email}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-sm"
              >
                <Mail className="w-5 h-5 text-[#d4af37]" />
                <span className="text-sm font-semibold truncate">{vendor.email}</span>
              </a>
            )}

            {vendor.phone && (
              <a
                href={`tel:${vendor.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-sm"
              >
                <Phone className="w-5 h-5 text-[#d4af37]" />
                <span className="text-sm font-semibold">{vendor.phone}</span>
              </a>
            )}

            {vendor.website && (
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-sm"
              >
                <ExternalLink className="w-5 h-5 text-[#d4af37]" />
                <span className="text-sm font-semibold">Website besuchen</span>
              </a>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#d4af37] hover:bg-[#c19a2e] rounded-xl text-[#0a253c] font-bold transition-all"
            >
              <Edit className="w-5 h-5" />
              Details anzeigen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
