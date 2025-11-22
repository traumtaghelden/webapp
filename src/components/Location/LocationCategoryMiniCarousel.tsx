import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Phone, Mail, MapPin, Users } from 'lucide-react';
import { type Location } from '../../lib/supabase';

interface LocationCategoryMiniCarouselProps {
  locations: Location[];
  categoryName: string;
  gradientColors: { from: string; via: string; to: string };
  onLocationClick: (locationId: string) => void;
}

export default function LocationCategoryMiniCarousel({
  locations,
  categoryName,
  gradientColors,
  onLocationClick
}: LocationCategoryMiniCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || locations.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % locations.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying, locations.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + locations.length) % locations.length);
    setIsAutoPlaying(false);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % locations.length);
    setIsAutoPlaying(false);
  };

  const handleLocationClick = (e: React.MouseEvent, locationId: string) => {
    e.stopPropagation();
    onLocationClick(locationId);
  };

  if (locations.length === 0) {
    return null;
  }

  const currentLocation = locations[currentIndex];
  const isFavorite = currentLocation.is_favorite;

  const allDataFields = [
    {
      icon: Users,
      label: 'Kontakt',
      value: currentLocation.contact_name || '-',
      show: true
    },
    {
      icon: Phone,
      label: 'Telefon',
      value: currentLocation.phone || '-',
      show: true
    },
    {
      icon: Mail,
      label: 'E-Mail',
      value: currentLocation.email || '-',
      show: true
    },
    {
      icon: MapPin,
      label: 'Stadt',
      value: currentLocation.city || '-',
      show: true
    }
  ];

  const displayFields = allDataFields.slice(0, 4);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {locations.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </>
      )}

      <div
        onClick={(e) => handleLocationClick(e, currentLocation.id)}
        className="cursor-pointer px-12 py-4"
      >
        <div className="relative overflow-hidden rounded-2xl p-6 bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-105">
          <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/20">
            <div className="flex-1 min-w-0">
              <h5 className="text-xl font-bold text-white mb-1">
                {currentLocation.name}
              </h5>
              <p className="text-sm text-white/50">
                {categoryName}
              </p>
            </div>
            {isFavorite && (
              <div className="flex-shrink-0 ml-3">
                <Star className="w-5 h-5 text-[#d4af37]" fill="#d4af37" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 min-h-[160px]">
            {displayFields.map((field, index) => {
              const Icon = field.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all bg-white/5"
                >
                  {Icon && (
                    <Icon className="w-4 h-4 text-white/70 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                    <span className="text-xs text-white/60 flex-shrink-0">
                      {field.label}
                    </span>
                    <span className="text-sm text-white truncate text-right">
                      {field.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 h-1 transition-opacity duration-300"
            style={{
              background: `linear-gradient(90deg, transparent, ${gradientColors.to}, transparent)`,
              boxShadow: `0 0 15px ${gradientColors.to}`
            }}
          />
        </div>
      </div>

      {locations.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {locations.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
                setIsAutoPlaying(false);
              }}
              className={`
                transition-all duration-300 rounded-full
                ${currentIndex === index
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                }
              `}
              aria-label={`Gehe zu Location ${index + 1}`}
            />
          ))}
        </div>
      )}

      {locations.length > 1 && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
          <span className="text-xs text-white font-semibold">
            {currentIndex + 1} / {locations.length}
          </span>
        </div>
      )}
    </div>
  );
}
