import { useState } from 'react';
import { Star, Mail, Phone, DollarSign, MapPin, CheckCircle, Clock, AlertCircle, Edit, Scale, Users } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { type Location } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

interface LocationHeroCardProps {
  location: Location;
  onUpdate: () => void;
  onEdit?: () => void;
  size?: 'normal' | 'compact';
  isDragging?: boolean;
  isCompareSelected?: boolean;
  onToggleCompare?: () => void;
  enableDragDrop?: boolean;
}

export default function LocationHeroCard({
  location,
  onUpdate,
  onEdit,
  size = 'normal',
  isDragging,
  isCompareSelected = false,
  onToggleCompare,
  enableDragDrop = false
}: LocationHeroCardProps) {
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const { attributes, listeners, setNodeRef: setDragNodeRef, transform, isDragging: isDraggingFromDnD } = useDraggable({
    id: location.id,
    disabled: !enableDragDrop
  });

  const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
    id: location.id,
    disabled: !enableDragDrop
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDragNodeRef(node);
    setDropNodeRef(node);
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const isBooked = location.booking_status === 'booked';
  const isFavorite = location.is_favorite;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    try {
      const { error } = await supabase
        .from('locations')
        .update({ is_favorite: !location.is_favorite })
        .eq('id', location.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const getStatusColor = () => {
    if (location.booking_status === 'booked') {
      return 'bg-green-100 text-green-700 border-green-300';
    }
    return 'bg-orange-100 text-orange-700 border-orange-300';
  };

  const getStatusIcon = () => {
    if (location.booking_status === 'booked') {
      return <CheckCircle className="w-3 h-3" />;
    }
    return <Clock className="w-3 h-3" />;
  };

  const getStatusLabel = () => {
    switch (location.booking_status) {
      case 'booked':
        return 'Gebucht';
      case 'confirmed':
        return 'Bestätigt';
      case 'pending':
        return 'In Verhandlung';
      case 'cancelled':
        return 'Storniert';
      default:
        return 'Anfrage';
    }
  };

  const cardSize = size === 'normal' ? 'p-6' : 'p-4';

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
        <div className="mb-6 mt-2 w-20 h-20 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#c19a2e] flex items-center justify-center shadow-lg">
          <MapPin className="w-10 h-10 text-white" />
        </div>

        <h3 className="text-xl font-bold text-[#0a253c] text-center mb-2 px-2">
          {location.name}
        </h3>

        <div className="text-sm text-[#666666] mb-3">
          {location.category}
        </div>

        <div className={`flex items-center gap-1 mb-3 px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          {getStatusLabel()}
        </div>

        {location.description && size === 'normal' && (
          <p className="text-sm text-[#666666] text-center line-clamp-2 mb-4 px-4">
            {location.description}
          </p>
        )}

        <div className="w-full pt-4 border-t border-[#d4af37]/20 space-y-2">
          {location.city && (
            <div className="flex items-center justify-center gap-2 text-sm text-[#666666]">
              <MapPin className="w-4 h-4 text-[#d4af37]" />
              <span>{location.city}</span>
            </div>
          )}

          {location.max_capacity > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-[#666666]">
              <Users className="w-4 h-4 text-[#d4af37]" />
              <span>{location.max_capacity} Personen</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-2">
            {location.total_cost && location.total_cost > 0 ? (
              <>
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-xl font-bold text-green-600">
                  {Number(location.total_cost).toLocaleString('de-DE')} €
                </span>
              </>
            ) : (
              <span className="text-sm text-[#999999]">Preis auf Anfrage</span>
            )}
          </div>
        </div>

      </div>

      {showQuickActions && size === 'normal' && (
        <div className="absolute inset-0 bg-[#0a253c]/95 rounded-3xl flex items-center justify-center z-10 animate-fadeIn">
          <div className="space-y-3 px-6 w-full">
            {location.contact_email && (
              <a
                href={`mailto:${location.contact_email}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-sm"
              >
                <Mail className="w-5 h-5 text-[#d4af37]" />
                <span className="text-sm font-semibold truncate">{location.contact_email}</span>
              </a>
            )}

            {location.contact_phone && (
              <a
                href={`tel:${location.contact_phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-sm"
              >
                <Phone className="w-5 h-5 text-[#d4af37]" />
                <span className="text-sm font-semibold">{location.contact_phone}</span>
              </a>
            )}

            {location.address && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-white backdrop-blur-sm">
                <MapPin className="w-5 h-5 text-[#d4af37]" />
                <span className="text-sm font-semibold truncate">{location.address}</span>
              </div>
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
