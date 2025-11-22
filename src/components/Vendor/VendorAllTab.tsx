import { useState, useEffect, useRef } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, CheckCircle, Building2, Star, Scale, X } from 'lucide-react';
import { supabase, type Vendor, type VendorCategory } from '../../lib/supabase';
import VendorDetailModal from '../VendorDetailModal';
import VendorBookingDialog from '../VendorBookingDialog';
import VendorComparisonModal from '../VendorComparisonModal';
import { useToast } from '../../contexts/ToastContext';
import { VENDOR } from '../../constants/terminology';
import {
  MapPin, Utensils, Camera, Video, Music, Flower2,
  Sparkles, Car, Cake, MoreHorizontal, Disc3,
  Heart, Calendar
} from 'lucide-react';

interface VendorAllTabProps {
  weddingId: string;
  vendors: Vendor[];
  onUpdate: () => void;
  onAddVendor: () => void;
  initialCategoryFilter?: string | null;
}

interface CategoryWithStats extends VendorCategory {
  vendorCount: number;
  bookedCount: number;
  availableCount: number;
}

const categoryGradients: Record<string, {
  from: string;
  via: string;
  to: string;
  icon: any;
}> = {
  'Location': { from: '#1e3a8a', via: '#3b82f6', to: '#60a5fa', icon: MapPin },
  'Catering': { from: '#065f46', via: '#10b981', to: '#34d399', icon: Utensils },
  'Fotografie': { from: '#581c87', via: '#8b5cf6', to: '#a78bfa', icon: Camera },
  'Videografie': { from: '#9f1239', via: '#ec4899', to: '#f472b6', icon: Video },
  'Musik': { from: '#c2410c', via: '#f59e0b', to: '#fbbf24', icon: Music },
  'Floristik': { from: '#0f766e', via: '#14b8a6', to: '#2dd4bf', icon: Flower2 },
  'Dekoration': { from: '#7e22ce', via: '#a855f7', to: '#c084fc', icon: Sparkles },
  'Transport': { from: '#0e7490', via: '#06b6d4', to: '#22d3ee', icon: Car },
  'Hochzeitstorte': { from: '#c2410c', via: '#f97316', to: '#fb923c', icon: Cake },
  'DJ': { from: '#991b1b', via: '#ef4444', to: '#f87171', icon: Disc3 },
  'Vermählung': { from: '#9f1239', via: '#f43f5e', to: '#fb7185', icon: Heart },
  'Event': { from: '#5b21b6', via: '#8b5cf6', to: '#a78bfa', icon: Calendar },
  'Styling': { from: '#831843', via: '#ec4899', to: '#f472b6', icon: Sparkles },
  'Sonstiges': { from: '#374151', via: '#6b7280', to: '#9ca3af', icon: MoreHorizontal }
};

export default function VendorAllTab({ weddingId, vendors, onUpdate, onAddVendor, initialCategoryFilter }: VendorAllTabProps) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [bookingVendor, setBookingVendor] = useState<Vendor | null>(null);
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareVendorIds, setCompareVendorIds] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [weddingId, vendors]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_categories')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('name', { ascending: true });

      if (error) throw error;

      const categoriesWithStats: CategoryWithStats[] = (data || []).map(cat => {
        const categoryVendors = vendors.filter(v => v.category === cat.name);
        const bookedVendors = categoryVendors.filter(v =>
          v.contract_status === 'signed' || v.contract_status === 'completed'
        );
        const availableVendors = categoryVendors.filter(v =>
          v.contract_status !== 'signed' && v.contract_status !== 'completed'
        );

        return {
          ...cat,
          vendorCount: categoryVendors.length,
          bookedCount: bookedVendors.length,
          availableCount: availableVendors.length
        };
      });

      setCategories(categoriesWithStats.filter(cat => cat.vendorCount > 0));
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast('Fehler beim Laden der Kategorien', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        vendor.name.toLowerCase().includes(query) ||
        vendor.category.toLowerCase().includes(query) ||
        (vendor.description && vendor.description.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handleBookVendor = (vendor: Vendor) => {
    setBookingVendor(vendor);
  };

  const handleBookingConfirm = async () => {
    if (!bookingVendor) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .update({ contract_status: 'signed' })
        .eq('id', bookingVendor.id);

      if (error) throw error;

      showToast(`${VENDOR.SINGULAR} erfolgreich gebucht!`, 'success');
      setBookingVendor(null);
      onUpdate();
    } catch (error) {
      console.error('Error booking vendor:', error);
      showToast('Fehler beim Buchen', 'error');
    }
  };

  const handleUnbookVendor = async (vendorId: string) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ contract_status: 'inquiry' })
        .eq('id', vendorId);

      if (error) throw error;

      showToast(`${VENDOR.SINGULAR} zurück in den Pool verschoben`, 'success');
      onUpdate();
    } catch (error) {
      console.error('Error unbooking vendor:', error);
      showToast('Fehler beim Verschieben', 'error');
    }
  };

  const toggleCompareVendor = (vendorId: string) => {
    setCompareVendorIds(prev => {
      if (prev.includes(vendorId)) {
        return prev.filter(id => id !== vendorId);
      }
      if (prev.length >= 2) {
        showToast('Maximal 2 Dienstleister können verglichen werden', 'warning');
        return prev;
      }
      return [...prev, vendorId];
    });
  };

  const startComparison = () => {
    if (compareVendorIds.length !== 2) {
      showToast('Wählen Sie genau 2 Dienstleister zum Vergleich', 'warning');
      return;
    }
    setShowComparisonModal(true);
  };

  const compareVendors = vendors.filter(v => compareVendorIds.includes(v.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comparison Banner */}
      {compareVendorIds.length > 0 && (
        <div className="fixed bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 sm:gap-4 animate-in slide-in-from-bottom duration-300 max-w-[calc(100vw-2rem)] sm:max-w-none">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-sm sm:text-base">
              <span className="hidden sm:inline">{compareVendorIds.length} {compareVendorIds.length === 1 ? 'Dienstleister' : 'Dienstleister'} ausgewählt</span>
              <span className="sm:hidden">{compareVendorIds.length} ausgewählt</span>
            </span>
          </div>
          <div className="h-5 sm:h-6 w-px bg-white/30"></div>
          <button
            onClick={startComparison}
            disabled={compareVendorIds.length !== 2}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm min-h-[36px] sm:min-h-0"
          >
            Vergleichen
          </button>
          <button
            onClick={() => setCompareVendorIds([])}
            className="p-1.5 sm:p-1 hover:bg-white/20 rounded-full transition-all min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
            title="Auswahl löschen"
          >
            <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      )}

      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-lg border border-[#d4af37]/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#0a253c] tracking-tight">
              {VENDOR.PLURAL}-Pool
            </h3>
            <p className="text-[10px] sm:text-xs text-[#666666] mt-0.5">
              {vendors.length} {VENDOR.PLURAL} • {categories.length} Kategorien
            </p>
          </div>
          <button
            onClick={onAddVendor}
            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white rounded-lg text-xs sm:text-sm font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 active:scale-95 min-h-[40px] sm:min-h-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{VENDOR.ADD}</span>
            <span className="sm:hidden">Neu</span>
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#666666] transition-all duration-300 group-focus-within:text-[#d4af37]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${VENDOR.PLURAL} durchsuchen...`}
            className="w-full pl-8 sm:pl-9 pr-3 py-2 sm:py-2.5 text-sm rounded-lg border border-[#d4af37]/20 bg-white focus:border-[#d4af37] focus:shadow-md focus:shadow-[#d4af37]/10 focus:outline-none transition-all duration-300 placeholder:text-[#999999] min-h-[44px] sm:min-h-0"
          />
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {categories.map((category) => {
          const design = categoryGradients[category.name] || categoryGradients['Sonstiges'];
          const Icon = design.icon;
          const categoryVendors = filteredVendors.filter(v => v.category === category.name);

          if (categoryVendors.length === 0 && searchQuery) return null;

          return (
            <CategoryRow
              key={category.id}
              category={category}
              design={design}
              Icon={Icon}
              vendors={categoryVendors}
              onBookVendor={handleBookVendor}
              onUnbookVendor={handleUnbookVendor}
              onEditVendor={(id) => setSelectedVendorId(id)}
              onUpdate={onUpdate}
              compareVendorIds={compareVendorIds}
              onToggleCompare={toggleCompareVendor}
            />
          );
        })}

        {categories.filter(cat => {
          const categoryVendors = filteredVendors.filter(v => v.category === cat.name);
          return categoryVendors.length > 0;
        }).length === 0 && (
          <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl border border-[#d4af37]/10">
            <Building2 className="w-16 h-16 sm:w-20 sm:h-20 text-[#d4af37] mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-[#666666] text-base sm:text-lg mb-2 font-semibold px-4">
              {searchQuery ? 'Keine Dienstleister gefunden' : 'Noch keine Dienstleister'}
            </p>
            {!searchQuery && (
              <button
                onClick={onAddVendor}
                className="mt-4 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all min-h-[44px] text-sm sm:text-base"
              >
                Ersten {VENDOR.SINGULAR} hinzufügen
              </button>
            )}
          </div>
        )}
      </div>

      {bookingVendor && (
        <VendorBookingDialog
          isOpen={true}
          onClose={() => setBookingVendor(null)}
          vendor={bookingVendor}
          weddingId={weddingId}
          onConfirm={handleBookingConfirm}
        />
      )}

      {selectedVendorId && (
        <VendorDetailModal
          vendorId={selectedVendorId}
          weddingId={weddingId}
          onClose={() => setSelectedVendorId(null)}
          onUpdate={onUpdate}
        />
      )}

      {showComparisonModal && compareVendors.length >= 2 && (
        <VendorComparisonModal
          isOpen={true}
          vendor1={compareVendors[0]}
          vendor2={compareVendors[1]}
          onClose={() => {
            setShowComparisonModal(false);
            setCompareVendorIds([]);
          }}
          onBook={(vendorId) => {
            const vendor = vendors.find(v => v.id === vendorId);
            if (vendor) {
              handleBookVendor(vendor);
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
  vendors: Vendor[];
  onBookVendor: (vendor: Vendor) => void;
  onUnbookVendor: (vendorId: string) => void;
  onEditVendor: (vendorId: string) => void;
  onUpdate: () => void;
  compareVendorIds: string[];
  onToggleCompare: (vendorId: string) => void;
}

function CategoryRow({ category, design, Icon, vendors, onBookVendor, onUnbookVendor, onEditVendor, onUpdate, compareVendorIds, onToggleCompare }: CategoryRowProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sortedVendors = [...vendors].sort((a, b) => {
    const aBooked = a.contract_status === 'signed' || a.contract_status === 'completed';
    const bBooked = b.contract_status === 'signed' || b.contract_status === 'completed';
    const aFavorite = a.is_favorite || false;
    const bFavorite = b.is_favorite || false;

    // 1. Gebucht zuerst
    if (aBooked && !bBooked) return -1;
    if (!aBooked && bBooked) return 1;

    // 2. Dann Favoriten (bei nicht gebuchten)
    if (!aBooked && !bBooked) {
      if (aFavorite && !bFavorite) return -1;
      if (!aFavorite && bFavorite) return 1;
    }

    return 0;
  });

  useEffect(() => {
    checkScrollButtons();
  }, [vendors]);

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
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-3 sm:gap-4">
      <div
        className="rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${design.from} 0%, ${design.via} 50%, ${design.to} 100%)`
        }}
      >
        <div className="relative z-10">
          <div className="bg-white/20 w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 backdrop-blur-sm">
            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{category.name}</h3>
          <div className="space-y-1 sm:space-y-1.5 text-white/90 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <span>Gesamt:</span>
              <span className="font-bold">{category.vendorCount}</span>
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

      <div className="relative bg-gradient-to-br from-white to-[#f7f2eb]/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-[#d4af37]/10">
        {vendors.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[160px] sm:min-h-[200px]">
            <p className="text-[#666666] text-xs sm:text-sm">Keine Dienstleister in dieser Kategorie</p>
          </div>
        ) : (
          <>
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 sm:p-2.5 transition-all duration-300 hover:scale-110 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a253c]" />
              </button>
            )}

            <div
              ref={carouselRef}
              onScroll={checkScrollButtons}
              className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {sortedVendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onBook={() => onBookVendor(vendor)}
                  onUnbook={() => onUnbookVendor(vendor.id)}
                  onEdit={() => onEditVendor(vendor.id)}
                  onUpdate={onUpdate}
                  showCompare={compareVendorIds.includes(vendor.id)}
                  onToggleCompare={() => onToggleCompare(vendor.id)}
                />
              ))}
            </div>

            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 sm:p-2.5 transition-all duration-300 hover:scale-110 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a253c]" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface VendorCardProps {
  vendor: Vendor;
  onBook: () => void;
  onUnbook: () => void;
  onEdit: () => void;
  onUpdate?: () => void;
  showCompare?: boolean;
  onToggleCompare?: () => void;
}

function VendorCard({ vendor, onBook, onUnbook, onEdit, onUpdate, showCompare = false, onToggleCompare }: VendorCardProps) {
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const isBooked = vendor.contract_status === 'signed' || vendor.contract_status === 'completed';
  const isFavorite = vendor.is_favorite || false;

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
        className="flex-shrink-0 w-[240px] sm:w-[260px] bg-gradient-to-br from-green-50 via-white to-green-50/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-green-400/40 hover:border-green-500 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group relative overflow-hidden"
        style={{
          boxShadow: '0 0 30px rgba(34, 197, 94, 0.3), 0 10px 30px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-green-400/20 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-green-400/20 to-transparent rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <div className="absolute top-0 right-0 flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={handleCompare}
              className={`p-1 sm:p-1.5 rounded-lg transition-all duration-300 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                showCompare
                  ? 'bg-blue-500 text-white scale-110'
                  : 'bg-white/80 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
              }`}
              title="Zum Vergleich"
            >
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={toggleFavorite}
              disabled={isTogglingFavorite}
              className={`p-1 sm:p-1.5 rounded-lg transition-all duration-300 shadow-sm min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                isFavorite
                  ? 'bg-[#d4af37] text-white scale-110 shadow-md'
                  : 'bg-white/90 text-gray-400 hover:bg-[#d4af37]/20 hover:text-[#d4af37] hover:scale-105'
              }`}
              title={isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
            >
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="flex items-start justify-between mb-3 sm:mb-4 pr-14 sm:pr-16">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-[#0a253c] text-sm sm:text-base truncate group-hover:text-green-600 transition-colors mb-1">
                {vendor.name}
              </h4>
              <p className="text-[10px] sm:text-xs text-[#666666] truncate">{vendor.category}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 flex-shrink-0 ml-2 shadow-lg">
              <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              <span className="text-[10px] sm:text-xs font-bold text-white hidden sm:inline">Gebucht</span>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 bg-white/60 rounded-lg p-2.5 sm:p-3 backdrop-blur-sm">
            {vendor.contact_name && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-[#0a253c]">
                <span className="text-sm sm:text-base">👤</span>
                <span className="truncate font-medium">{vendor.contact_name}</span>
              </div>
            )}

            {vendor.phone && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-[#0a253c]">
                <span className="text-sm sm:text-base">📞</span>
                <span className="truncate font-medium">{vendor.phone}</span>
              </div>
            )}

            {vendor.estimated_cost && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <span className="text-sm sm:text-base">💰</span>
                <span className="font-bold text-green-600">{vendor.estimated_cost.toLocaleString('de-DE')} €</span>
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnbook();
            }}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-gray-100 to-gray-200 text-[#666666] hover:from-gray-200 hover:to-gray-300 hover:shadow-md border border-gray-300 min-h-[40px]"
          >
            <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Zurück in Pool
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onEdit}
      className={`flex-shrink-0 w-[240px] sm:w-[260px] bg-gradient-to-br rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group relative overflow-hidden ${
        isFavorite
          ? 'from-amber-50 via-[#f7f2eb] to-amber-50/30 border-2 border-[#d4af37] ring-2 ring-[#d4af37]/30'
          : 'from-white via-[#f7f2eb]/30 to-white border border-[#d4af37]/30 hover:border-[#d4af37]'
      }`}
    >
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl ${
        isFavorite ? 'bg-gradient-to-br from-[#d4af37]/20 to-transparent' : 'bg-gradient-to-br from-[#d4af37]/10 to-transparent'
      }`}></div>

      <div className="relative z-10">
        <div className="absolute top-0 right-0 flex items-center gap-0.5 sm:gap-1">
          <button
            onClick={handleCompare}
            className={`p-1 sm:p-1.5 rounded-lg transition-all duration-300 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
              showCompare
                ? 'bg-blue-500 text-white scale-110'
                : 'bg-white/80 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
            }`}
            title="Zum Vergleich"
          >
            <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={toggleFavorite}
            disabled={isTogglingFavorite}
            className={`p-1 sm:p-1.5 rounded-lg transition-all duration-300 shadow-sm min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
              isFavorite
                ? 'bg-[#d4af37] text-white scale-110 shadow-md'
                : 'bg-gray-100 text-gray-400 hover:bg-[#d4af37]/20 hover:text-[#d4af37] hover:scale-105'
            }`}
            title={isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
          >
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="flex items-start justify-between mb-3 sm:mb-4 pr-14 sm:pr-16">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[#0a253c] text-sm sm:text-base truncate group-hover:text-[#d4af37] transition-colors mb-1">
              {vendor.name}
            </h4>
            <p className="text-[10px] sm:text-xs text-[#666666] truncate">{vendor.category}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-100 to-blue-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex-shrink-0 ml-2 border border-blue-300">
            <span className="text-[10px] sm:text-xs font-bold text-blue-700 hidden sm:inline">Verfügbar</span>
            <span className="text-[10px] font-bold text-blue-700 sm:hidden">✓</span>
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 bg-[#f7f2eb]/40 rounded-lg p-2.5 sm:p-3">
          {vendor.contact_name && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-[#0a253c]">
              <span className="text-sm sm:text-base">👤</span>
              <span className="truncate font-medium">{vendor.contact_name}</span>
            </div>
          )}

          {vendor.phone && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-[#0a253c]">
              <span className="text-sm sm:text-base">📞</span>
              <span className="truncate font-medium">{vendor.phone}</span>
            </div>
          )}

          {vendor.estimated_cost && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <span className="text-sm sm:text-base">💰</span>
              <span className="font-bold text-[#d4af37]">{vendor.estimated_cost.toLocaleString('de-DE')} €</span>
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onBook();
          }}
          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white hover:shadow-xl hover:scale-105 active:scale-95 shadow-lg min-h-[40px]"
        >
          <span className="hidden sm:inline">Jetzt buchen</span>
          <span className="sm:hidden">Buchen</span>
        </button>
      </div>
    </div>
  );
}
