import { useState, useEffect } from 'react';
import {
  MapPin, Utensils, Camera, Video, Music, Flower2,
  Sparkles, Car, Cake, MoreHorizontal, CheckCircle,
  TrendingUp, Users, ChevronDown, ChevronUp, Disc3,
  Heart, Calendar, FileDown
} from 'lucide-react';
import { supabase, type VendorCategory, type Vendor } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import VendorCategoryDetailView from './VendorCategoryDetailView';
import VendorDetailModal from '../VendorDetailModal';
import VendorCategoryMiniCarousel from './VendorCategoryMiniCarousel';
import { exportBookedVendorsToPDF } from '../../utils/vendorPdfExport';

interface VendorCategoryOverviewProps {
  weddingId: string;
  vendors: Vendor[];
  onCategoryClick: (categoryName: string) => void;
}

interface CategoryWithStats extends VendorCategory {
  vendorCount: number;
  bookedCount: number;
  totalCost: number;
  hasBooked: boolean;
}

const categoryGradients: Record<string, {
  from: string;
  via: string;
  to: string;
  icon: any;
  decorativeElement: string;
}> = {
  'Location': {
    from: '#1e3a8a',
    via: '#3b82f6',
    to: '#60a5fa',
    icon: MapPin,
    decorativeElement: '🏛️'
  },
  'Catering': {
    from: '#065f46',
    via: '#10b981',
    to: '#34d399',
    icon: Utensils,
    decorativeElement: '🍽️'
  },
  'Fotografie': {
    from: '#581c87',
    via: '#8b5cf6',
    to: '#a78bfa',
    icon: Camera,
    decorativeElement: '📸'
  },
  'Videografie': {
    from: '#9f1239',
    via: '#ec4899',
    to: '#f472b6',
    icon: Video,
    decorativeElement: '🎬'
  },
  'Musik': {
    from: '#c2410c',
    via: '#f59e0b',
    to: '#fbbf24',
    icon: Music,
    decorativeElement: '🎵'
  },
  'Floristik': {
    from: '#0f766e',
    via: '#14b8a6',
    to: '#2dd4bf',
    icon: Flower2,
    decorativeElement: '🌸'
  },
  'Dekoration': {
    from: '#7e22ce',
    via: '#a855f7',
    to: '#c084fc',
    icon: Sparkles,
    decorativeElement: '✨'
  },
  'Transport': {
    from: '#0e7490',
    via: '#06b6d4',
    to: '#22d3ee',
    icon: Car,
    decorativeElement: '🚗'
  },
  'Hochzeitstorte': {
    from: '#c2410c',
    via: '#f97316',
    to: '#fb923c',
    icon: Cake,
    decorativeElement: '🎂'
  },
  'DJ': {
    from: '#991b1b',
    via: '#ef4444',
    to: '#f87171',
    icon: Disc3,
    decorativeElement: '🎧'
  },
  'Vermählung': {
    from: '#9f1239',
    via: '#f43f5e',
    to: '#fb7185',
    icon: Heart,
    decorativeElement: '💒'
  },
  'Event': {
    from: '#5b21b6',
    via: '#8b5cf6',
    to: '#a78bfa',
    icon: Calendar,
    decorativeElement: '🎉'
  },
  'Styling': {
    from: '#831843',
    via: '#ec4899',
    to: '#f472b6',
    icon: Sparkles,
    decorativeElement: '💄'
  },
  'Sonstiges': {
    from: '#374151',
    via: '#6b7280',
    to: '#9ca3af',
    icon: MoreHorizontal,
    decorativeElement: '📦'
  }
};

export default function VendorCategoryOverview({
  weddingId,
  vendors,
  onCategoryClick
}: VendorCategoryOverviewProps) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [bookedVendorsByCategory, setBookedVendorsByCategory] = useState<Record<string, Vendor[]>>({});
  const [loadingVendors, setLoadingVendors] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, [weddingId, vendors]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('vendor_categories')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('order_index', { ascending: true });

      if (data) {
        const categoriesWithStats = data.map(cat => {
          const categoryVendors = vendors.filter(v => v.category === cat.name);
          const bookedVendors = categoryVendors.filter(v =>
            v.contract_status === 'signed' || v.contract_status === 'completed'
          );
          const totalCost = bookedVendors.reduce((sum, v) => sum + (v.total_cost || 0), 0);

          return {
            ...cat,
            vendorCount: categoryVendors.length,
            bookedCount: bookedVendors.length,
            totalCost,
            hasBooked: bookedVendors.length > 0
          };
        });
        setCategories(categoriesWithStats);

        // Pre-load booked vendors for categories with bookings
        categoriesWithStats.forEach(cat => {
          if (cat.bookedCount > 0) {
            loadBookedVendorsForCategory(cat.name, cat.id);
          }
        });
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast('Fehler beim Laden der Kategorien', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBookedVendorsForCategory = async (categoryName: string, categoryId: string) => {
    if (bookedVendorsByCategory[categoryId]) {
      return;
    }

    try {
      setLoadingVendors(categoryId);
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('wedding_id', weddingId)
        .eq('category', categoryName)
        .in('contract_status', ['signed', 'completed'])
        .order('name', { ascending: true });

      if (error) throw error;

      setBookedVendorsByCategory(prev => ({
        ...prev,
        [categoryId]: data || []
      }));
    } catch (error) {
      console.error('Error loading booked vendors:', error);
      showToast('Fehler beim Laden der Dienstleister', 'error');
    } finally {
      setLoadingVendors(null);
    }
  };

  const handleCategoryClick = async (category: CategoryWithStats) => {
    if (expandedCategoryId === category.id) {
      setExpandedCategoryId(null);
    } else {
      setExpandedCategoryId(category.id);
      if (category.bookedCount > 0) {
        await loadBookedVendorsForCategory(category.name, category.id);
      }
    }
  };

  const handlePanelClick = (category: CategoryWithStats) => {
    if (category.bookedCount === 0) {
      onCategoryClick(category.name);
    } else {
      handleCategoryClick(category);
    }
  };

  const handleExportPDF = () => {
    try {
      const bookedVendors = vendors.filter(
        v => v.contract_status === 'signed' || v.contract_status === 'completed'
      );

      if (bookedVendors.length === 0) {
        showToast('Keine gebuchten Dienstleister vorhanden', 'warning');
        return;
      }

      exportBookedVendorsToPDF(vendors);
      showToast('PDF erfolgreich erstellt', 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToast('Fehler beim Erstellen des PDFs', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#d4af37]"></div>
      </div>
    );
  }

  // Sort categories: with BOOKED vendors first (top section), all others below
  const categoriesWithBookedVendors = categories.filter(cat => cat.bookedCount > 0);
  const categoriesWithoutBookedVendors = categories.filter(cat => cat.bookedCount === 0);

  return (
    <div className="space-y-8">
      {/* Export Button - Dezent rechts */}
      {categoriesWithBookedVendors.length > 0 && (
        <div className="flex justify-end -mt-4">
          <button
            onClick={handleExportPDF}
            className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-gray-900 rounded-xl font-medium shadow-md hover:shadow-lg hover:shadow-[#d4af37]/30 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <FileDown className="w-4 h-4" />
            <span className="text-sm">Als PDF exportieren</span>
          </button>
        </div>
      )}

      {/* Categories with BOOKED Vendors - Top Section */}
      {categoriesWithBookedVendors.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {categoriesWithBookedVendors.map((category, index) => {
          const design = categoryGradients[category.name] || categoryGradients['Sonstiges'];
          const Icon = design.icon;
          const isExpanded = expandedCategoryId === category.id;
          const isLoading = loadingVendors === category.id;
          const bookedVendors = bookedVendorsByCategory[category.id] || [];
          const hasBooked = category.bookedCount > 0;

          return (
            <div
              key={category.id}
              className={`
                transition-all duration-700 ease-in-out
                ${isExpanded ? 'lg:col-span-2 xl:col-span-3' : ''}
              `}
            >
              <div
                className="w-full relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500"
                style={{
                  background: `linear-gradient(135deg, ${design.from} 0%, ${design.via} 50%, ${design.to} 100%)`,
                  animationDelay: `${index * 100}ms`
                }}
              >
              {/* Animated Background Orb */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle, ${design.to} 0%, transparent 70%)`,
                  animation: 'float 6s ease-in-out infinite'
                }}
              />

              {/* Decorative Element */}
              <div className="absolute top-4 right-4 text-6xl opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                {design.decorativeElement}
              </div>

              {/* Glass Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <button
                onClick={() => handlePanelClick(category)}
                className="w-full text-left group"
              >
              <div className={`relative p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 flex flex-col ${hasBooked ? 'min-h-[400px] sm:min-h-[500px]' : 'min-h-[160px] sm:min-h-[200px]'}`}>
                {/* Icon Section */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-9 lg:h-9 text-white" strokeWidth={2.5} />
                  </div>

                  {/* Booked Badge */}
                  {category.hasBooked && (
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                      <span className="text-[10px] sm:text-xs font-bold text-green-600">Gebucht</span>
                    </div>
                  )}
                </div>

                {/* Category Name */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform duration-300">
                    {category.name}
                  </h3>
                  <div className="h-0.5 sm:h-1 w-10 sm:w-12 bg-white/50 rounded-full group-hover:w-16 sm:group-hover:w-20 transition-all duration-300" />
                </div>

                {/* Stats for categories WITHOUT booked vendors - Compact View */}
                {!hasBooked && (
                  <div className="space-y-2 text-white/90 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Gesamt:</span>
                      <span className="font-bold">{category.vendorCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Verfügbar:</span>
                      <span className="font-bold text-blue-200">{category.vendorCount}</span>
                    </div>
                  </div>
                )}

                {/* Vendor Carousel - Only show for categories WITH booked vendors */}
                {hasBooked && !isExpanded && bookedVendors.length > 0 && !isLoading && (
                  <div className="-mx-8 mt-auto -mb-6">
                    <VendorCategoryMiniCarousel
                      vendors={bookedVendors}
                      categoryName={category.name}
                      gradientColors={design}
                      onVendorClick={(vendorId) => setSelectedVendorId(vendorId)}
                    />
                  </div>
                )}

                {/* Loading state for carousel */}
                {hasBooked && !isExpanded && isLoading && (
                  <div className="flex items-center justify-center py-8 mt-auto">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  </div>
                )}

                {/* Expand/Collapse Arrow */}
                {category.bookedCount > 0 && (
                  <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 transition-all duration-300 z-20">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                      ) : (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                )}

                {/* Navigate Arrow for categories without booked vendors */}
                {category.bookedCount === 0 && (
                  <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              </button>

              {/* Bottom Glow Effect */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(90deg, transparent, ${design.to}, transparent)`,
                  boxShadow: `0 0 20px ${design.to}`
                }}
              />
            </div>

            {/* Expanded Detail View */}
            <div
              className={`
                overflow-hidden transition-all duration-700 ease-in-out
                ${isExpanded ? 'max-h-[2000px] opacity-100 mt-6' : 'max-h-0 opacity-0'}
              `}
            >
              <div
                className="rounded-3xl shadow-2xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${design.from} 0%, ${design.via} 50%, ${design.to} 100%)`
                }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-transparent" />

                  <div className="relative z-10">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
                      </div>
                    ) : (
                      <VendorCategoryDetailView
                        vendors={bookedVendors}
                        categoryName={category.name}
                        gradientColors={design}
                        onVendorClick={(vendorId) => setSelectedVendorId(vendorId)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          );
        })}
        </div>
      )}

      {/* Categories WITHOUT Booked Vendors - Compact Size (Bottom Section) */}
      {categoriesWithoutBookedVendors.length > 0 && (
        <>
          <div className="flex items-center gap-4 mt-12 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            <span className="text-sm font-medium text-gray-500 px-4">
              Weitere Kategorien
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {categoriesWithoutBookedVendors.map((category, index) => {
              const design = categoryGradients[category.name] || categoryGradients['Sonstiges'];
              const Icon = design.icon;

              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryClick(category.name)}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${design.from} 0%, ${design.via} 50%, ${design.to} 100%)`,
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {/* Animated Background Orb */}
                  <div
                    className="absolute -top-10 -right-10 w-20 h-20 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle, ${design.to} 0%, transparent 70%)`,
                      animation: 'float 6s ease-in-out infinite'
                    }}
                  />

                  {/* Glass Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Content */}
                  <div className="relative p-4 sm:p-5 space-y-2 sm:space-y-3">
                    {/* Icon */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mx-auto">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                    </div>

                    {/* Category Name */}
                    <div className="text-center">
                      <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                        {category.name}
                      </h3>
                    </div>

                    {/* Add Icon Hint */}
                    <div className="flex items-center justify-center gap-1 text-white/70 text-[10px] sm:text-xs">
                      <span>Hinzufügen</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="text-center py-20">
          <Users className="w-24 h-24 text-[#d4af37] mx-auto mb-6 opacity-50" />
          <h3 className="text-2xl font-bold text-[#0a253c] mb-2">
            Keine Kategorien vorhanden
          </h3>
          <p className="text-[#666666]">
            Kategorien werden automatisch beim ersten Login erstellt
          </p>
        </div>
      )}

      {/* Vendor Detail Modal */}
      {selectedVendorId && (
        <VendorDetailModal
          vendorId={selectedVendorId}
          weddingId={weddingId}
          onClose={() => setSelectedVendorId(null)}
          onUpdate={() => {
            loadCategories();
            setBookedVendorsByCategory({});
          }}
        />
      )}

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(10px, -10px) scale(1.1);
          }
          66% {
            transform: translate(-10px, 10px) scale(0.9);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .grid > button {
          animation: fadeIn 0.6s ease-out backwards;
        }
      `}</style>
    </div>
  );
}
