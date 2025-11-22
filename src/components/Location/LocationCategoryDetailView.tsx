import { useState, useEffect, useRef } from 'react';
import { Mail, Phone, MapPin, Star, DollarSign, Edit, Building2, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { type Location } from '../../lib/supabase';

interface LocationCategoryDetailViewProps {
  locations: Location[];
  categoryName: string;
  gradientColors: { from: string; via: string; to: string };
  onLocationClick: (locationId: string) => void;
}

export default function LocationCategoryDetailView({
  locations,
  categoryName,
  gradientColors,
  onLocationClick
}: LocationCategoryDetailViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  const itemsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 3
  };

  const [itemsToShow, setItemsToShow] = useState(itemsPerView.desktop);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsToShow(itemsPerView.mobile);
      } else if (window.innerWidth < 1024) {
        setItemsToShow(itemsPerView.tablet);
      } else {
        setItemsToShow(itemsPerView.desktop);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || locations.length <= itemsToShow) return;

    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying, locations.length, itemsToShow]);

  const maxIndex = Math.max(0, locations.length - itemsToShow);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setIsAutoPlaying(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      return next > maxIndex ? 0 : next;
    });
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsAutoPlaying(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < maxIndex) {
      handleNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      handlePrev();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  if (locations.length === 0) {
    return (
      <div className="py-12 text-center">
        <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: gradientColors.via }} />
        <p className="text-white/70 text-lg font-semibold">
          Noch keine gebuchten Locations in dieser Kategorie
        </p>
        <p className="text-white/50 text-sm mt-2">
          Füge Locations hinzu und buche sie, um sie hier zu sehen
        </p>
      </div>
    );
  }

  const totalDots = maxIndex + 1;

  return (
    <div className="py-8 px-4 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Building2 className="w-7 h-7" />
              Gebuchte Locations
            </h4>
            <div className="h-1 w-24 bg-white/50 rounded-full" />
          </div>
          <div className="text-white/70 text-sm">
            {locations.length} {locations.length === 1 ? 'Location' : 'Locations'}
          </div>
        </div>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {locations.length > itemsToShow && (
          <>
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`
                absolute left-0 top-1/2 -translate-y-1/2 z-20
                w-12 h-12 lg:w-14 lg:h-14 rounded-full
                bg-white/20 backdrop-blur-lg border border-white/30
                flex items-center justify-center
                transition-all duration-300 transform -translate-x-1/2
                ${currentIndex === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-white/30 hover:scale-110 active:scale-95 cursor-pointer'
                }
              `}
            >
              <ChevronLeft className="w-6 h-6 lg:w-7 lg:h-7 text-white" strokeWidth={3} />
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
              className={`
                absolute right-0 top-1/2 -translate-y-1/2 z-20
                w-12 h-12 lg:w-14 lg:h-14 rounded-full
                bg-white/20 backdrop-blur-lg border border-white/30
                flex items-center justify-center
                transition-all duration-300 transform translate-x-1/2
                ${currentIndex >= maxIndex
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-white/30 hover:scale-110 active:scale-95 cursor-pointer'
                }
              `}
            >
              <ChevronRight className="w-6 h-6 lg:w-7 lg:h-7 text-white" strokeWidth={3} />
            </button>
          </>
        )}

        <div
          ref={carouselRef}
          className="overflow-hidden px-4 lg:px-12"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-700 ease-in-out gap-6"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`
            }}
          >
            {locations.map((location) => {
              const isFavorite = location.is_favorite;

              return (
                <div
                  key={location.id}
                  className="flex-shrink-0 cursor-pointer group"
                  style={{ width: `calc(${100 / itemsToShow}% - ${(itemsToShow - 1) * 24 / itemsToShow}px)` }}
                  onClick={() => onLocationClick(location.id)}
                >
                  <div className="relative bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-2xl hover:shadow-white/20 transform hover:scale-[1.02]">
                    {isFavorite && (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="bg-amber-500 rounded-full p-2 shadow-lg">
                          <Star className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                    )}

                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xl font-bold text-white mb-1 truncate group-hover:text-amber-200 transition-colors">
                            {location.name}
                          </h5>
                          {location.city && (
                            <p className="text-white/70 text-sm flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{location.city}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {location.contact_name && (
                          <div className="flex items-center gap-2 text-white/80 text-sm">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{location.contact_name}</span>
                          </div>
                        )}

                        {location.email && (
                          <div className="flex items-center gap-2 text-white/80 text-sm">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{location.email}</span>
                          </div>
                        )}

                        {location.phone && (
                          <div className="flex items-center gap-2 text-white/80 text-sm">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{location.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-amber-400" />
                            <div>
                              <p className="text-xs text-white/50">Gesamtkosten</p>
                              <p className="text-lg font-bold text-white">
                                {location.total_cost ? `${location.total_cost.toLocaleString('de-DE')} €` : 'N/A'}
                              </p>
                            </div>
                          </div>
                          {location.max_capacity > 0 && (
                            <div className="text-right">
                              <p className="text-xs text-white/50">Kapazität</p>
                              <p className="text-lg font-bold text-white">{location.max_capacity}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-center pt-2">
                        <div className="flex items-center gap-2 text-white/60 group-hover:text-white/90 transition-colors text-sm">
                          <Edit className="w-4 h-4" />
                          <span>Details anzeigen</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {totalDots > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: totalDots }).map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`
                  h-2 rounded-full transition-all duration-300
                  ${index === currentIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/40 hover:bg-white/60'
                  }
                `}
                aria-label={`Gehe zu Seite ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
