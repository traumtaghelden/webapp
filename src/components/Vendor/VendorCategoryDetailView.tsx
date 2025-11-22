import { useState, useEffect, useRef } from 'react';
import { Mail, Phone, ExternalLink, Star, DollarSign, Edit, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { type Vendor } from '../../lib/supabase';
import VendorAvatar from '../common/VendorAvatar';

interface VendorCategoryDetailViewProps {
  vendors: Vendor[];
  categoryName: string;
  gradientColors: { from: string; via: string; to: string };
  onVendorClick: (vendorId: string) => void;
}

export default function VendorCategoryDetailView({
  vendors,
  categoryName,
  gradientColors,
  onVendorClick
}: VendorCategoryDetailViewProps) {
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
    if (!isAutoPlaying || vendors.length <= itemsToShow) return;

    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying, vendors.length, itemsToShow]);

  const maxIndex = Math.max(0, vendors.length - itemsToShow);

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

  if (vendors.length === 0) {
    return (
      <div className="py-12 text-center">
        <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: gradientColors.via }} />
        <p className="text-white/70 text-lg font-semibold">
          Noch keine gebuchten Dienstleister in dieser Kategorie
        </p>
        <p className="text-white/50 text-sm mt-2">
          Füge Dienstleister hinzu und buche sie, um sie hier zu sehen
        </p>
      </div>
    );
  }

  const totalDots = maxIndex + 1;

  return (
    <div className="py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8">
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h4 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-2 flex items-center gap-2 sm:gap-3">
              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              <span className="hidden sm:inline">Gebuchte Dienstleister</span>
              <span className="sm:hidden">Gebucht</span>
            </h4>
            <div className="h-0.5 sm:h-1 w-16 sm:w-20 lg:w-24 bg-white/50 rounded-full" />
          </div>
          <div className="text-white/70 text-xs sm:text-sm">
            {vendors.length} {vendors.length === 1 ? 'Dienstleister' : 'Dienstleister'}
          </div>
        </div>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Navigation Buttons */}
        {vendors.length > itemsToShow && (
          <>
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`
                absolute left-0 top-1/2 -translate-y-1/2 z-20
                w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full
                bg-white/20 backdrop-blur-lg border border-white/30
                flex items-center justify-center
                transition-all duration-300 transform -translate-x-1/2
                min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0
                ${currentIndex === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-white/30 hover:scale-110 active:scale-95 cursor-pointer'
                }
              `}
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" strokeWidth={3} />
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
              className={`
                absolute right-0 top-1/2 -translate-y-1/2 z-20
                w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full
                bg-white/20 backdrop-blur-lg border border-white/30
                flex items-center justify-center
                transition-all duration-300 transform translate-x-1/2
                min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0
                ${currentIndex >= maxIndex
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-white/30 hover:scale-110 active:scale-95 cursor-pointer'
                }
              `}
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" strokeWidth={3} />
            </button>
          </>
        )}

        {/* Carousel Container */}
        <div
          ref={carouselRef}
          className="overflow-hidden px-2 sm:px-4 lg:px-12"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-700 ease-in-out gap-3 sm:gap-4 lg:gap-6"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`
            }}
          >
            {vendors.map((vendor) => {
              const isFavorite = vendor.is_favorite || (vendor.rating && vendor.rating >= 4);

              return (
                <div
                  key={vendor.id}
                  className="flex-shrink-0 group"
                  style={{ width: itemsToShow === 1 ? '100%' : `calc(${100 / itemsToShow}% - ${(itemsToShow - 1) * 16 / itemsToShow}px)` }}
                >
                  <div
                    className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 xl:p-8 h-full
                      bg-white/10 backdrop-blur-lg border border-white/20
                      transition-all duration-500 transform
                      hover:scale-105 hover:shadow-2xl hover:bg-white/20 cursor-pointer
                      shadow-lg"
                    onClick={() => onVendorClick(vendor.id)}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: `radial-gradient(circle at top right, ${gradientColors.to}40 0%, transparent 70%)`
                      }}
                    />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4 sm:mb-5 lg:mb-6">
                        <div className="flex-shrink-0">
                          <VendorAvatar
                            name={vendor.name}
                            category={categoryName}
                            size="xl"
                            isBooked={true}
                            isFavorite={isFavorite}
                          />
                        </div>

                        {isFavorite && (
                          <div className="bg-[#d4af37]/20 p-2.5 rounded-full animate-pulse">
                            <Star className="w-6 h-6 text-[#d4af37]" fill="#d4af37" />
                          </div>
                        )}
                      </div>

                      <div className="mb-3 sm:mb-4">
                        <h5 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-white mb-1.5 sm:mb-2 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] lg:min-h-[3.5rem]">
                          {vendor.name}
                        </h5>
                        {vendor.contact_name && (
                          <p className="text-xs sm:text-sm text-white/60 line-clamp-1">
                            Kontakt: {vendor.contact_name}
                          </p>
                        )}
                      </div>

                      {vendor.description && (
                        <p className="text-xs sm:text-sm text-white/70 mb-4 sm:mb-5 lg:mb-6 line-clamp-2 sm:line-clamp-3 min-h-[2.5rem] sm:min-h-[3rem] lg:min-h-[4rem]">
                          {vendor.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/20">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-green-400/20 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 text-green-400" />
                          </div>
                          <div>
                            {vendor.total_cost && vendor.total_cost > 0 ? (
                              <>
                                <div className="text-base sm:text-lg lg:text-xl font-bold text-white">
                                  {Number(vendor.total_cost).toLocaleString('de-DE')} €
                                </div>
                                <div className="text-[10px] sm:text-xs text-white/60">Gesamtkosten</div>
                              </>
                            ) : (
                              <div className="text-xs sm:text-sm text-white/70">Preis auf Anfrage</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-5 lg:mb-6">
                        {vendor.email && (
                          <a
                            href={`mailto:${vendor.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all text-xs sm:text-sm min-h-[44px] sm:min-h-0"
                          >
                            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d4af37] flex-shrink-0" />
                            <span className="truncate">{vendor.email}</span>
                          </a>
                        )}

                        {vendor.phone && (
                          <a
                            href={`tel:${vendor.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all text-xs sm:text-sm min-h-[44px] sm:min-h-0"
                          >
                            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d4af37] flex-shrink-0" />
                            <span>{vendor.phone}</span>
                          </a>
                        )}

                        {vendor.website && (
                          <a
                            href={vendor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all text-xs sm:text-sm min-h-[44px] sm:min-h-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d4af37] flex-shrink-0" />
                            <span className="truncate">Website besuchen</span>
                          </a>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onVendorClick(vendor.id);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#d4af37] hover:bg-[#c19a2e] rounded-lg text-[#0a253c] font-bold transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base min-h-[44px]"
                      >
                        <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                        Details anzeigen
                      </button>
                    </div>

                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${gradientColors.to}, transparent)`,
                        boxShadow: `0 0 20px ${gradientColors.to}`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carousel Indicators (Dots) */}
        {vendors.length > itemsToShow && totalDots > 1 && (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6 lg:mt-8">
            {Array.from({ length: totalDots }).map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`
                  transition-all duration-300 rounded-full min-h-[12px] min-w-[12px]
                  ${currentIndex === index
                    ? 'w-8 h-2.5 sm:w-10 sm:h-3 bg-white'
                    : 'w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white/30 hover:bg-white/50'
                  }
                `}
                aria-label={`Gehe zu Seite ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Auto-play indicator */}
        {isAutoPlaying && vendors.length > itemsToShow && (
          <div className="absolute top-4 right-4 z-10">
            <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <span className="text-xs text-white font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Auto-Play
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
