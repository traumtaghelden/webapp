import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { type Vendor } from '../../lib/supabase';

interface VendorCategoryMiniCarouselProps {
  vendors: Vendor[];
  categoryName: string;
  gradientColors: { from: string; via: string; to: string };
  onVendorClick: (vendorId: string) => void;
}

export default function VendorCategoryMiniCarousel({
  vendors,
  categoryName,
  gradientColors,
  onVendorClick
}: VendorCategoryMiniCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || vendors.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % vendors.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying, vendors.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + vendors.length) % vendors.length);
    setIsAutoPlaying(false);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % vendors.length);
    setIsAutoPlaying(false);
  };

  const handleVendorClick = (e: React.MouseEvent, vendorId: string) => {
    e.stopPropagation();
    onVendorClick(vendorId);
  };

  if (vendors.length === 0) {
    return null;
  }

  const currentVendor = vendors[currentIndex];
  const isFavorite = currentVendor.is_favorite || (currentVendor.rating && currentVendor.rating >= 4);

  // Define all possible data fields - always show 4 slots
  const allDataFields = [
    {
      icon: Star,
      label: 'Kontakt',
      value: currentVendor.contact_name || '-',
      show: true
    },
    {
      icon: Phone,
      label: 'Telefon',
      value: currentVendor.phone || '-',
      show: true
    },
    {
      icon: Mail,
      label: 'E-Mail',
      value: currentVendor.email || '-',
      show: true
    },
    {
      icon: MapPin,
      label: 'Adresse',
      value: currentVendor.address || '-',
      show: true
    }
  ];

  // Always show exactly 4 fields for consistent height
  const displayFields = allDataFields.slice(0, 4);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Navigation Arrows */}
      {vendors.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110 active:scale-95 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          >
            <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" strokeWidth={2.5} />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110 active:scale-95 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          >
            <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Vendor Card */}
      <div
        onClick={(e) => handleVendorClick(e, currentVendor.id)}
        className="cursor-pointer px-8 sm:px-10 lg:px-12 py-3 sm:py-4"
      >
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-105">
          {/* Vendor Name Header */}
          <div className="flex items-start justify-between mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-white/20">
            <div className="flex-1 min-w-0">
              <h5 className="text-lg sm:text-xl font-bold text-white mb-1">
                {currentVendor.name}
              </h5>
              <p className="text-xs sm:text-sm text-white/50">
                {categoryName}
              </p>
            </div>
            {isFavorite && (
              <div className="flex-shrink-0 ml-2 sm:ml-3">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37]" fill="#d4af37" />
              </div>
            )}
          </div>

          {/* Data Fields Grid - Always 4 fields for consistent height */}
          <div className="grid grid-cols-1 gap-1.5 sm:gap-2 min-h-[140px] sm:min-h-[160px]">
            {displayFields.map((field, index) => {
              const Icon = field.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all bg-white/5"
                >
                  {Icon && (
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-white/60 flex-shrink-0">
                      {field.label}
                    </span>
                    <span className="text-xs sm:text-sm text-white truncate text-right">
                      {field.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Glow effect */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1 transition-opacity duration-300"
            style={{
              background: `linear-gradient(90deg, transparent, ${gradientColors.to}, transparent)`,
              boxShadow: `0 0 15px ${gradientColors.to}`
            }}
          />
        </div>
      </div>

      {/* Carousel Indicators */}
      {vendors.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
          {vendors.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
                setIsAutoPlaying(false);
              }}
              className={`
                transition-all duration-300 rounded-full min-h-[8px] min-w-[8px]
                ${currentIndex === index
                  ? 'w-5 h-2 sm:w-6 sm:h-2 bg-white'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                }
              `}
              aria-label={`Gehe zu Dienstleister ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {vendors.length > 1 && (
        <div className="absolute top-2 right-2 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
          <span className="text-[10px] sm:text-xs text-white font-semibold">
            {currentIndex + 1} / {vendors.length}
          </span>
        </div>
      )}
    </div>
  );
}
