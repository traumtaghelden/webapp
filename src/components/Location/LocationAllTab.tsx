import { useState, useEffect, useRef } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, CheckCircle, Building2, Star, Scale, X } from 'lucide-react';
import { supabase, type Location, type LocationCategory, type LocationCategoryAssignment } from '../../lib/supabase';
import LocationDetailModal from '../LocationDetailModal';
import LocationBookingDialog from '../LocationBookingDialog';
import LocationComparisonModal from '../LocationComparisonModal';
import { useToast } from '../../contexts/ToastContext';
import { LOCATION } from '../../constants/terminology';
import {
  Church, Wine, PartyPopper, Sparkles, Hotel, Music, Users, Coffee, Camera, MapPin
} from 'lucide-react';

interface LocationAllTabProps {
  weddingId: string;
  locations: Location[];
  onUpdate: () => void;
  onAddLocation: () => void;
  initialCategoryFilter?: string | null;
}

interface CategoryWithStats extends LocationCategory {
  locationCount: number;
  bookedCount: number;
  availableCount: number;
}

interface LocationWithCategories extends Location {
  categoryIds: string[];
}

const categoryGradients: Record<string, {
  from: string;
  via: string;
  to: string;
  icon: any;
}> = {
  'Trauung': { from: '#9f1239', via: '#f43f5e', to: '#fb7185', icon: Church },
  'Empfang': { from: '#c2410c', via: '#f59e0b', to: '#fbbf24', icon: Wine },
  'Feier': { from: '#7e22ce', via: '#a855f7', to: '#c084fc', icon: PartyPopper },
  'Getting Ready': { from: '#831843', via: '#ec4899', to: '#f472b6', icon: Sparkles },
  'Übernachtung': { from: '#1e3a8a', via: '#3b82f6', to: '#60a5fa', icon: Hotel },
  'After Party': { from: '#991b1b', via: '#ef4444', to: '#f87171', icon: Music },
  'Polterabend': { from: '#065f46', via: '#10b981', to: '#34d399', icon: Users },
  'Brunch': { from: '#c2410c', via: '#f97316', to: '#fb923c', icon: Coffee },
  'Fotoshooting': { from: '#581c87', via: '#8b5cf6', to: '#a78bfa', icon: Camera },
  'Sonstige': { from: '#374151', via: '#6b7280', to: '#9ca3af', icon: MapPin }
};

export default function LocationAllTab({ weddingId, locations, onUpdate, onAddLocation, initialCategoryFilter }: LocationAllTabProps) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [bookingLocation, setBookingLocation] = useState<Location | null>(null);
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [categoryAssignments, setCategoryAssignments] = useState<LocationCategoryAssignment[]>([]);
  const [locationsWithCategories, setLocationsWithCategories] = useState<LocationWithCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareLocationIds, setCompareLocationIds] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  useEffect(() => {
    loadCategoriesAndAssignments();
  }, [weddingId, locations]);

  const loadCategoriesAndAssignments = async () => {
    try {
      setLoading(true);

      const [categoriesResult, assignmentsResult] = await Promise.all([
        supabase
          .from('location_categories')
          .select('*')
          .eq('wedding_id', weddingId)
          .order('order_index', { ascending: true }),
        supabase
          .from('location_category_assignments')
          .select('*')
          .eq('wedding_id', weddingId)
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;

      const assignments = assignmentsResult.data || [];
      setCategoryAssignments(assignments);

      const enrichedLocations: LocationWithCategories[] = locations.map(loc => ({
        ...loc,
        categoryIds: assignments
          .filter(a => a.location_id === loc.id)
          .map(a => a.category_id)
      }));

      setLocationsWithCategories(enrichedLocations);

      const categoriesWithStats: CategoryWithStats[] = (categoriesResult.data || []).map(cat => {
        const categoryLocations = enrichedLocations.filter(l =>
          l.categoryIds.includes(cat.id)
        );
        const bookedLocations = categoryLocations.filter(l => l.booking_status === 'booked');
        const availableLocations = categoryLocations.filter(l => l.booking_status !== 'booked');

        return {
          ...cat,
          locationCount: categoryLocations.length,
          bookedCount: bookedLocations.length,
          availableCount: availableLocations.length
        };
      });

      setCategories(categoriesWithStats.filter(cat => cat.locationCount > 0));
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast('Fehler beim Laden der Kategorien', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = locationsWithCategories.filter(location => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        location.name.toLowerCase().includes(query) ||
        (location.description && location.description.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handleBookLocation = (location: Location) => {
    setBookingLocation(location);
  };

  const handleBookingConfirm = async () => {
    if (!bookingLocation) return;

    try {
      const { error } = await supabase
        .from('locations')
        .update({ booking_status: 'booked' })
        .eq('id', bookingLocation.id);

      if (error) throw error;

      showToast(`${LOCATION.SINGULAR} erfolgreich gebucht!`, 'success');
      setBookingLocation(null);
      onUpdate();
    } catch (error) {
      console.error('Error booking location:', error);
      showToast('Fehler beim Buchen', 'error');
    }
  };

  const handleUnbookLocation = async (locationId: string) => {
    try {
      const { error } = await supabase
        .from('locations')
        .update({ booking_status: 'inquiry' })
        .eq('id', locationId);

      if (error) throw error;

      showToast(`${LOCATION.SINGULAR} zurück in den Pool verschoben`, 'success');
      onUpdate();
    } catch (error) {
      console.error('Error unbooking location:', error);
      showToast('Fehler beim Verschieben', 'error');
    }
  };

  const toggleCompareLocation = (locationId: string) => {
    setCompareLocationIds(prev => {
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId);
      }
      if (prev.length >= 2) {
        showToast('Maximal 2 Locations können verglichen werden', 'warning');
        return prev;
      }
      return [...prev, locationId];
    });
  };

  const startComparison = () => {
    if (compareLocationIds.length !== 2) {
      showToast('Wählen Sie genau 2 Locations zum Vergleich', 'warning');
      return;
    }
    setShowComparisonModal(true);
  };

  const compareLocations = locations.filter(l => compareLocationIds.includes(l.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {compareLocationIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            <span className="font-semibold">
              {compareLocationIds.length} {compareLocationIds.length === 1 ? 'Location' : 'Locations'} ausgewählt
            </span>
          </div>
          <div className="h-6 w-px bg-white/30"></div>
          <button
            onClick={startComparison}
            disabled={compareLocationIds.length !== 2}
            className="px-4 py-1.5 bg-white text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Vergleichen
          </button>
          <button
            onClick={() => setCompareLocationIds([])}
            className="p-1 hover:bg-white/20 rounded-full transition-all"
            title="Auswahl löschen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl p-3 shadow-lg border border-[#d4af37]/10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 mb-2">
          <div>
            <h3 className="text-base font-bold text-[#0a253c] tracking-tight">
              {LOCATION.PLURAL}-Pool
            </h3>
            <p className="text-xs text-[#666666] mt-0.5">
              {locations.length} {LOCATION.PLURAL} • {categories.length} Kategorien
            </p>
          </div>
          <button
            onClick={onAddLocation}
            className="flex items-center gap-1 px-3 py-1 bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{LOCATION.ADD}</span>
            <span className="sm:hidden">Neu</span>
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#666666] transition-all duration-300 group-focus-within:text-[#d4af37]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${LOCATION.PLURAL} durchsuchen...`}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-[#d4af37]/20 bg-white focus:border-[#d4af37] focus:shadow-md focus:shadow-[#d4af37]/10 focus:outline-none transition-all duration-300 placeholder:text-[#999999]"
          />
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const design = categoryGradients[category.name] || categoryGradients['Sonstige'];
          const Icon = design.icon;
          const categoryLocations = filteredLocations.filter(l => l.categoryIds.includes(category.id));

          if (categoryLocations.length === 0 && searchQuery) return null;

          return (
            <CategoryRow
              key={category.id}
              category={category}
              design={design}
              Icon={Icon}
              locations={categoryLocations}
              onBookLocation={handleBookLocation}
              onUnbookLocation={handleUnbookLocation}
              onEditLocation={(id) => setSelectedLocationId(id)}
              onUpdate={onUpdate}
              compareLocationIds={compareLocationIds}
              onToggleCompare={toggleCompareLocation}
            />
          );
        })}

        {categories.filter(cat => {
          const categoryLocations = filteredLocations.filter(l => l.categoryIds.includes(cat.id));
          return categoryLocations.length > 0;
        }).length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl border border-[#d4af37]/10">
            <Building2 className="w-20 h-20 text-[#d4af37] mx-auto mb-4 opacity-50" />
            <p className="text-[#666666] text-lg mb-2 font-semibold">
              {searchQuery ? 'Keine Locations gefunden' : 'Noch keine Locations'}
            </p>
            {!searchQuery && (
              <button
                onClick={onAddLocation}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all min-h-[40px]"
              >
                Erste {LOCATION.SINGULAR} hinzufügen
              </button>
            )}
          </div>
        )}
      </div>

      {bookingLocation && (
        <LocationBookingDialog
          isOpen={true}
          onClose={() => setBookingLocation(null)}
          location={bookingLocation}
          weddingId={weddingId}
          onConfirm={handleBookingConfirm}
        />
      )}

      {selectedLocationId && (
        <LocationDetailModal
          locationId={selectedLocationId}
          onClose={() => setSelectedLocationId(null)}
          onUpdate={onUpdate}
        />
      )}

      {showComparisonModal && compareLocations.length >= 2 && (
        <LocationComparisonModal
          isOpen={true}
          onClose={() => {
            setShowComparisonModal(false);
            setCompareLocationIds([]);
          }}
          locations={compareLocations}
          onBook={(locationId) => {
            const location = locations.find(l => l.id === locationId);
            if (location) {
              handleBookLocation(location);
            }
          }}
        />
      )}
    </div>
  );
}

interface CategoryRowProps {
  category: CategoryWithStats;
  design: { from: string; via: string; to: string; icon: any };
  Icon: any;
  locations: LocationWithCategories[];
  onBookLocation: (location: Location) => void;
  onUnbookLocation: (locationId: string) => void;
  onEditLocation: (locationId: string) => void;
  onUpdate: () => void;
  compareLocationIds: string[];
  onToggleCompare: (locationId: string) => void;
}

function CategoryRow({ category, design, Icon, locations, onBookLocation, onUnbookLocation, onEditLocation, onUpdate, compareLocationIds, onToggleCompare }: CategoryRowProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sortedLocations = [...locations].sort((a, b) => {
    const aBooked = a.booking_status === 'booked';
    const bBooked = b.booking_status === 'booked';
    const aFavorite = a.is_favorite || false;
    const bFavorite = b.is_favorite || false;

    if (aBooked && !bBooked) return -1;
    if (!aBooked && bBooked) return 1;

    if (!aBooked && !bBooked) {
      if (aFavorite && !bFavorite) return -1;
      if (!aFavorite && bFavorite) return 1;
    }

    return 0;
  });

  useEffect(() => {
    checkScrollButtons();
  }, [locations]);

  const checkScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left'
        ? carouselRef.current.scrollLeft - scrollAmount
        : carouselRef.current.scrollLeft + scrollAmount;

      carouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      setTimeout(checkScrollButtons, 300);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      <div
        className="rounded-2xl p-6 shadow-lg relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${design.from} 0%, ${design.via} 50%, ${design.to} 100%)`
        }}
      >
        <div className="relative z-10">
          <div className="bg-white/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
          <div className="space-y-1.5 text-white/90 text-sm">
            <div className="flex items-center justify-between">
              <span>Gesamt:</span>
              <span className="font-bold">{category.locationCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Gebucht:</span>
              <span className="font-bold text-green-200">{category.bookedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Verfügbar:</span>
              <span className="font-bold text-blue-200">{category.availableCount}</span>
            </div>
          </div>
        </div>
        <div
          className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, ${design.to} 0%, transparent 70%)`
          }}
        />
      </div>

      <div className="relative bg-gradient-to-br from-white to-[#f7f2eb]/20 rounded-2xl p-4 shadow-lg border border-[#d4af37]/10">
        {locations.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <p className="text-[#666666] text-sm">Keine Locations in dieser Kategorie</p>
          </div>
        ) : (
          <>
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-300 hover:scale-110"
              >
                <ChevronLeft className="w-5 h-5 text-[#0a253c]" />
              </button>
            )}

            <div
              ref={carouselRef}
              onScroll={checkScrollButtons}
              className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {sortedLocations.map((location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  onBook={() => onBookLocation(location)}
                  onUnbook={() => onUnbookLocation(location.id)}
                  onEdit={() => onEditLocation(location.id)}
                  onUpdate={onUpdate}
                  showCompare={compareLocationIds.includes(location.id)}
                  onToggleCompare={() => onToggleCompare(location.id)}
                />
              ))}
            </div>

            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-300 hover:scale-110"
              >
                <ChevronRight className="w-5 h-5 text-[#0a253c]" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface LocationCardProps {
  location: Location;
  onBook: () => void;
  onUnbook: () => void;
  onEdit: () => void;
  onUpdate?: () => void;
  showCompare?: boolean;
  onToggleCompare?: () => void;
}

function LocationCard({ location, onBook, onUnbook, onEdit, onUpdate, showCompare = false, onToggleCompare }: LocationCardProps) {
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const isBooked = location.booking_status === 'booked';
  const isFavorite = location.is_favorite || false;

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
      onUpdate?.();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleCompare) {
      onToggleCompare();
    }
  };

  if (isBooked) {
    return (
      <div
        onClick={onEdit}
        className="flex-shrink-0 w-[260px] bg-gradient-to-br from-green-50 via-white to-green-50/30 rounded-2xl p-5 border-2 border-green-400/40 hover:border-green-500 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group relative overflow-hidden"
        style={{
          boxShadow: '0 0 30px rgba(34, 197, 94, 0.3), 0 10px 30px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-green-400/20 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-green-400/20 to-transparent rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <div className="absolute top-0 right-0 flex items-center gap-1">
            <button
              onClick={handleCompare}
              className={`p-1.5 rounded-lg transition-all duration-300 ${
                showCompare
                  ? 'bg-blue-500 text-white scale-110'
                  : 'bg-white/80 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
              }`}
              title="Zum Vergleich"
            >
              <Scale className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFavorite}
              disabled={isTogglingFavorite}
              className={`p-1.5 rounded-lg transition-all duration-300 shadow-sm ${
                isFavorite
                  ? 'bg-[#d4af37] text-white scale-110 shadow-md'
                  : 'bg-white/90 text-gray-400 hover:bg-[#d4af37]/20 hover:text-[#d4af37] hover:scale-105'
              }`}
              title={isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
            >
              <Star className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="flex items-start justify-between mb-4 pr-16">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-[#0a253c] text-base truncate group-hover:text-green-600 transition-colors mb-1">
                {location.name}
              </h4>
              <p className="text-xs text-[#666666] truncate">{location.address || 'Keine Adresse'}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 flex-shrink-0 ml-2 shadow-lg">
              <CheckCircle className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-bold text-white">Gebucht</span>
            </div>
          </div>

          <div className="space-y-2 mb-4 bg-white/60 rounded-lg p-3 backdrop-blur-sm">
            {location.contact_name && (
              <div className="flex items-center gap-2 text-xs text-[#0a253c]">
                <span className="text-base">👤</span>
                <span className="truncate font-medium">{location.contact_name}</span>
              </div>
            )}

            {location.phone && (
              <div className="flex items-center gap-2 text-xs text-[#0a253c]">
                <span className="text-base">📞</span>
                <span className="truncate font-medium">{location.phone}</span>
              </div>
            )}

            {location.total_cost && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-base">💰</span>
                <span className="font-bold text-green-600">{location.total_cost.toLocaleString('de-DE')} €</span>
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnbook();
            }}
            className="w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 text-[#666666] hover:from-gray-200 hover:to-gray-300 hover:shadow-md border border-gray-300"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Zurück in Pool
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onEdit}
      className={`flex-shrink-0 w-[260px] bg-gradient-to-br rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group relative overflow-hidden ${
        isFavorite
          ? 'from-amber-50 via-[#f7f2eb] to-amber-50/30 border-2 border-[#d4af37] ring-2 ring-[#d4af37]/30'
          : 'from-white via-[#f7f2eb]/30 to-white border border-[#d4af37]/30 hover:border-[#d4af37]'
      }`}
    >
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl ${
        isFavorite ? 'bg-gradient-to-br from-[#d4af37]/20 to-transparent' : 'bg-gradient-to-br from-[#d4af37]/10 to-transparent'
      }`}></div>

      <div className="relative z-10">
        <div className="absolute top-0 right-0 flex items-center gap-1">
          <button
            onClick={handleCompare}
            className={`p-1.5 rounded-lg transition-all duration-300 ${
              showCompare
                ? 'bg-blue-500 text-white scale-110'
                : 'bg-white/80 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
            }`}
            title="Zum Vergleich"
          >
            <Scale className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFavorite}
            disabled={isTogglingFavorite}
            className={`p-1.5 rounded-lg transition-all duration-300 shadow-sm ${
              isFavorite
                ? 'bg-[#d4af37] text-white scale-110 shadow-md'
                : 'bg-gray-100 text-gray-400 hover:bg-[#d4af37]/20 hover:text-[#d4af37] hover:scale-105'
            }`}
            title={isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
          >
            <Star className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="flex items-start justify-between mb-4 pr-16">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[#0a253c] text-base truncate group-hover:text-[#d4af37] transition-colors mb-1">
              {location.name}
            </h4>
            <p className="text-xs text-[#666666] truncate">{location.address || 'Keine Adresse'}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-100 to-blue-200 px-3 py-1.5 rounded-full flex-shrink-0 ml-2 border border-blue-300">
            <span className="text-xs font-bold text-blue-700">Verfügbar</span>
          </div>
        </div>

        <div className="space-y-2 mb-4 bg-[#f7f2eb]/40 rounded-lg p-3">
          {location.contact_name && (
            <div className="flex items-center gap-2 text-xs text-[#0a253c]">
              <span className="text-base">👤</span>
              <span className="truncate font-medium">{location.contact_name}</span>
            </div>
          )}

          {location.phone && (
            <div className="flex items-center gap-2 text-xs text-[#0a253c]">
              <span className="text-base">📞</span>
              <span className="truncate font-medium">{location.phone}</span>
            </div>
          )}

          {location.total_cost && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-base">💰</span>
              <span className="font-bold text-[#d4af37]">{location.total_cost.toLocaleString('de-DE')} €</span>
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onBook();
          }}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white hover:shadow-xl hover:scale-105 active:scale-95 shadow-lg"
        >
          Jetzt buchen
        </button>
      </div>
    </div>
  );
}
