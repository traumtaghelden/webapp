import { useState, useEffect } from 'react';
import {
  MapPin, CheckCircle, ChevronDown, ChevronUp, Church, Wine,
  PartyPopper, Sparkles, Hotel, Music, Users, Coffee, Camera
} from 'lucide-react';
import { supabase, type LocationCategory, type Location, type LocationCategoryAssignment } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import LocationDetailModal from '../LocationDetailModal';
import LocationCategoryDetailView from './LocationCategoryDetailView';
import LocationCategoryMiniCarousel from './LocationCategoryMiniCarousel';

interface LocationCategoryOverviewProps {
  weddingId: string;
  locations: Location[];
  onCategoryClick: (categoryId: string) => void;
}

interface CategoryWithStats extends LocationCategory {
  locationCount: number;
  bookedCount: number;
  totalCost: number;
  hasBooked: boolean;
}

interface LocationWithCategories extends Location {
  categoryIds: string[];
}

const categoryGradients: Record<string, {
  from: string;
  via: string;
  to: string;
  icon: any;
  decorativeElement: string;
}> = {
  'Trauung': {
    from: '#9f1239',
    via: '#f43f5e',
    to: '#fb7185',
    icon: Church,
    decorativeElement: '💒'
  },
  'Empfang': {
    from: '#c2410c',
    via: '#f59e0b',
    to: '#fbbf24',
    icon: Wine,
    decorativeElement: '🥂'
  },
  'Feier': {
    from: '#7e22ce',
    via: '#a855f7',
    to: '#c084fc',
    icon: PartyPopper,
    decorativeElement: '🎉'
  },
  'Getting Ready': {
    from: '#831843',
    via: '#ec4899',
    to: '#f472b6',
    icon: Sparkles,
    decorativeElement: '✨'
  },
  'Übernachtung': {
    from: '#1e3a8a',
    via: '#3b82f6',
    to: '#60a5fa',
    icon: Hotel,
    decorativeElement: '🏨'
  },
  'After Party': {
    from: '#991b1b',
    via: '#ef4444',
    to: '#f87171',
    icon: Music,
    decorativeElement: '🎵'
  },
  'Polterabend': {
    from: '#065f46',
    via: '#10b981',
    to: '#34d399',
    icon: Users,
    decorativeElement: '🎊'
  },
  'Brunch': {
    from: '#c2410c',
    via: '#f97316',
    to: '#fb923c',
    icon: Coffee,
    decorativeElement: '☕'
  },
  'Fotoshooting': {
    from: '#581c87',
    via: '#8b5cf6',
    to: '#a78bfa',
    icon: Camera,
    decorativeElement: '📸'
  },
  'Sonstige': {
    from: '#374151',
    via: '#6b7280',
    to: '#9ca3af',
    icon: MapPin,
    decorativeElement: '📍'
  }
};

export default function LocationCategoryOverview({
  weddingId,
  locations,
  onCategoryClick
}: LocationCategoryOverviewProps) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [categoryAssignments, setCategoryAssignments] = useState<LocationCategoryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [bookedLocationsByCategory, setBookedLocationsByCategory] = useState<Record<string, Location[]>>({});
  const [loadingLocations, setLoadingLocations] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

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

      if (categoriesResult.data) {
        const assignments = assignmentsResult.data || [];
        setCategoryAssignments(assignments);

        const locationsWithCategories: LocationWithCategories[] = locations.map(loc => ({
          ...loc,
          categoryIds: assignments
            .filter(a => a.location_id === loc.id)
            .map(a => a.category_id)
        }));

        const categoriesWithStats = categoriesResult.data.map(cat => {
          const categoryLocations = locationsWithCategories.filter(l =>
            l.categoryIds.includes(cat.id)
          );
          const bookedLocations = categoryLocations.filter(l => l.booking_status === 'booked');
          const totalCost = bookedLocations.reduce((sum, l) => sum + (l.total_cost || 0), 0);

          return {
            ...cat,
            locationCount: categoryLocations.length,
            bookedCount: bookedLocations.length,
            totalCost,
            hasBooked: bookedLocations.length > 0
          };
        });

        setCategories(categoriesWithStats);

        categoriesWithStats.forEach(cat => {
          if (cat.bookedCount > 0) {
            loadBookedLocationsForCategory(cat.id);
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

  const loadBookedLocationsForCategory = async (categoryId: string) => {
    if (bookedLocationsByCategory[categoryId]) {
      return;
    }

    try {
      setLoadingLocations(categoryId);

      const relevantAssignments = categoryAssignments.filter(a => a.category_id === categoryId);
      const locationIds = relevantAssignments.map(a => a.location_id);

      const bookedLocs = locations.filter(l =>
        locationIds.includes(l.id) && l.booking_status === 'booked'
      );

      setBookedLocationsByCategory(prev => ({
        ...prev,
        [categoryId]: bookedLocs
      }));
    } catch (error) {
      console.error('Error loading booked locations:', error);
      showToast('Fehler beim Laden der Locations', 'error');
    } finally {
      setLoadingLocations(null);
    }
  };

  const handleCategoryClick = async (category: CategoryWithStats) => {
    if (expandedCategoryId === category.id) {
      setExpandedCategoryId(null);
    } else {
      setExpandedCategoryId(category.id);
      if (category.bookedCount > 0) {
        await loadBookedLocationsForCategory(category.id);
      }
    }
  };

  const handlePanelClick = (category: CategoryWithStats) => {
    if (category.bookedCount === 0) {
      onCategoryClick(category.id);
    } else {
      handleCategoryClick(category);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#d4af37]"></div>
      </div>
    );
  }

  const categoriesWithBookedLocations = categories.filter(cat => cat.bookedCount > 0);
  const categoriesWithoutBookedLocations = categories.filter(cat => cat.bookedCount === 0);

  return (
    <div className="space-y-8">
      {categoriesWithBookedLocations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categoriesWithBookedLocations.map((category, index) => {
          const design = categoryGradients[category.name] || categoryGradients['Sonstige'];
          const Icon = design.icon;
          const isExpanded = expandedCategoryId === category.id;
          const isLoading = loadingLocations === category.id;
          const bookedLocations = bookedLocationsByCategory[category.id] || [];
          const hasBooked = category.bookedCount > 0;

          return (
            <div
              key={category.id}
              className={`
                transition-all duration-700 ease-in-out
                ${isExpanded ? 'sm:col-span-2 lg:col-span-3 xl:col-span-4' : ''}
              `}
            >
              <div
                className="w-full relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500"
                style={{
                  background: `linear-gradient(135deg, ${design.from} 0%, ${design.via} 50%, ${design.to} 100%)`,
                  animationDelay: `${index * 100}ms`
                }}
              >
              <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle, ${design.to} 0%, transparent 70%)`,
                  animation: 'float 6s ease-in-out infinite'
                }}
              />

              <div className="absolute top-4 right-4 text-6xl opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                {design.decorativeElement}
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <button
                onClick={() => handlePanelClick(category)}
                className="w-full text-left group"
              >
              <div className={`relative p-8 space-y-6 flex flex-col ${hasBooked ? 'min-h-[500px]' : 'min-h-[200px]'}`}>
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-9 h-9 text-white" strokeWidth={2.5} />
                  </div>

                  {category.hasBooked && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-bold text-green-600">Gebucht</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform duration-300">
                    {category.name}
                  </h3>
                  <div className="h-1 w-12 bg-white/50 rounded-full group-hover:w-20 transition-all duration-300" />
                </div>

                {!hasBooked && (
                  <div className="space-y-2 text-white/90 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Gesamt:</span>
                      <span className="font-bold">{category.locationCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Verfügbar:</span>
                      <span className="font-bold text-blue-200">{category.locationCount}</span>
                    </div>
                  </div>
                )}

                {hasBooked && !isExpanded && bookedLocations.length > 0 && !isLoading && (
                  <div className="-mx-8 mt-auto -mb-6">
                    <LocationCategoryMiniCarousel
                      locations={bookedLocations}
                      categoryName={category.name}
                      gradientColors={design}
                      onLocationClick={(locationId) => setSelectedLocationId(locationId)}
                    />
                  </div>
                )}

                {hasBooked && !isExpanded && isLoading && (
                  <div className="flex items-center justify-center py-8 mt-auto">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  </div>
                )}

                {category.bookedCount > 0 && (
                  <div className="absolute bottom-6 right-6 transition-all duration-300 z-20">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-white" strokeWidth={2.5} />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white" strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                )}

                {category.bookedCount === 0 && (
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              </button>

              <div
                className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(90deg, transparent, ${design.to}, transparent)`,
                  boxShadow: `0 0 20px ${design.to}`
                }}
              />
            </div>

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
                      <LocationCategoryDetailView
                        locations={bookedLocations}
                        categoryName={category.name}
                        gradientColors={design}
                        onLocationClick={(locationId) => setSelectedLocationId(locationId)}
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

      {categoriesWithoutBookedLocations.length > 0 && (
        <>
          <div className="flex items-center gap-4 mt-12 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            <span className="text-sm font-medium text-gray-500 px-4">
              Weitere Kategorien
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {categoriesWithoutBookedLocations.map((category, index) => {
              const design = categoryGradients[category.name] || categoryGradients['Sonstige'];
              const Icon = design.icon;

              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryClick(category.id)}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${design.from} 0%, ${design.via} 50%, ${design.to} 100%)`,
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <div
                    className="absolute -top-10 -right-10 w-20 h-20 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle, ${design.to} 0%, transparent 70%)`,
                      animation: 'float 6s ease-in-out infinite'
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative p-5 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mx-auto">
                      <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>

                    <div className="text-center">
                      <h3 className="text-base font-bold text-white leading-tight">
                        {category.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-center gap-1 text-white/70 text-xs">
                      <span>Hinzufügen</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {categories.length === 0 && (
        <div className="text-center py-20">
          <MapPin className="w-24 h-24 text-[#d4af37] mx-auto mb-6 opacity-50" />
          <h3 className="text-2xl font-bold text-[#0a253c] mb-2">
            Keine Kategorien vorhanden
          </h3>
          <p className="text-[#666666]">
            Kategorien werden automatisch beim ersten Login erstellt
          </p>
        </div>
      )}

      {selectedLocationId && (
        <LocationDetailModal
          locationId={selectedLocationId}
          onClose={() => setSelectedLocationId(null)}
          onUpdate={() => {
            loadCategoriesAndAssignments();
            setBookedLocationsByCategory({});
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
