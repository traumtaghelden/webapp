import { Clock, MapPin, Users, Sparkles } from 'lucide-react';

interface WeddingDayBlock {
  id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location_name: string | null;
  location_address: string | null;
  color: string;
  icon: string;
  sort_order: number;
  is_expanded: boolean;
  is_buffer?: boolean;
  notes: string | null;
}

interface DashboardTimelineTabProps {
  weddingId: string;
  timelineEvents: WeddingDayBlock[];
  onNavigate: (tab: string) => void;
}

export default function DashboardTimelineTab({
  timelineEvents,
  onNavigate
}: DashboardTimelineTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Timeline Übersicht</h3>
          <p className="text-sm sm:text-base text-[#666666] mt-0.5 sm:mt-1">Dein Hochzeitstag im Detail</p>
        </div>
        <button
          onClick={() => onNavigate('timeline')}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-[#F5B800] to-[#f4d03f] text-gray-900 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:shadow-lg hover:scale-[1.05] active:scale-95 transition-all min-h-[40px] w-full sm:w-auto timeline-ripple-button"
        >
          <span className="sm:hidden">Bearbeiten</span>
          <span className="hidden sm:inline">Timeline bearbeiten</span>
        </button>
      </div>

      {timelineEvents.length > 0 ? (
        <div className="relative bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-gold-xl timeline-ambient-glow overflow-hidden timeline-content-fade">
          <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-gradient-to-br from-[#d4af37]/20 to-transparent rounded-full blur-3xl timeline-glow-pulse"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 lg:w-80 lg:h-80 bg-gradient-to-tr from-[#f4d03f]/10 to-transparent rounded-full blur-3xl timeline-glow-pulse" style={{ animationDelay: '1s' }}></div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
              <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-md sm:shadow-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white">Hochzeitstag Timeline</h2>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#f4d03f] animate-sparkle" />
            </div>

            <div className="space-y-2 sm:space-y-3 md:space-y-4 max-h-[400px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto pr-1 sm:pr-2 timeline-custom-scrollbar">
              {timelineEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`relative timeline-item-slide-in ${event.is_buffer ? 'pl-0' : 'pl-8 sm:pl-12 md:pl-16'}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {!event.is_buffer && (
                    <>
                      <div className="absolute left-1 sm:left-2 md:left-3 top-2 sm:top-2.5 md:top-3 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] ring-2 sm:ring-3 md:ring-4 ring-[#d4af37]/20 shadow-md sm:shadow-lg flex items-center justify-center timeline-marker-pulse">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-white rounded-full"></div>
                      </div>
                      {index !== timelineEvents.length - 1 && (
                        <div className="absolute left-2.5 sm:left-4 md:left-5 top-6 sm:top-7 md:top-8 bottom-0 w-0.5 bg-gradient-to-b from-[#d4af37] to-[#d4af37]/20 timeline-connection-line"></div>
                      )}
                    </>
                  )}

                  <div className={`group bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 lg:p-5 shadow-sm sm:shadow-md hover:shadow-gold-lg transition-all duration-300 border sm:border-2 timeline-card-flip timeline-ambient-glow ${
                    event.is_buffer
                      ? 'border-dashed border-gray-300 bg-gray-50/50'
                      : 'border-[#d4af37]/30 hover:border-[#d4af37]'
                  }`}>
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        {event.is_buffer ? (
                          <div className="flex items-center gap-1 sm:gap-2 text-gray-500">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                            <span className="text-xs sm:text-sm font-semibold px-2 sm:px-3 py-0.5 sm:py-1 bg-gray-100 rounded-full whitespace-nowrap">
                              {event.title || 'Pause'}
                            </span>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
                              <div className="flex items-center gap-1 sm:gap-2 text-[#d4af37] font-bold text-sm sm:text-base md:text-lg">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
                                <span className="truncate">{event.start_time}</span>
                                {event.end_time && (
                                  <span className="text-gray-400 truncate">- {event.end_time}</span>
                                )}
                              </div>
                              <span className="text-[9px] sm:text-xs bg-[#d4af37]/10 text-[#d4af37] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold w-fit">
                                {event.duration_minutes} Min
                              </span>
                            </div>
                            <h3 className="text-gray-900 font-bold text-sm sm:text-base md:text-lg lg:text-xl mb-1 sm:mb-2 group-hover:text-[#d4af37] transition-colors line-clamp-2">
                              {event.title}
                            </h3>
                            {event.description && (
                              <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 hidden sm:block">
                                {event.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
                              {event.location_name && (
                                <div className="flex items-center gap-1 text-gray-700">
                                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-[#d4af37] flex-shrink-0" />
                                  <span className="truncate">{event.location_name}</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12 md:py-16 bg-gradient-to-br from-[#0a253c] to-[#1a3a5c] rounded-xl sm:rounded-2xl md:rounded-3xl shadow-gold-xl timeline-ambient-glow timeline-content-fade">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#d4af37]/20 to-[#f4d03f]/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg timeline-glow-pulse">
            <Clock className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#d4af37]" />
          </div>
          <p className="text-white/80 text-base sm:text-lg mb-1 sm:mb-2 font-semibold px-4">Noch keine Timeline erstellt</p>
          <p className="text-white/50 text-xs sm:text-sm mb-4 sm:mb-6 px-4">Erstelle deine Hochzeitstimeline um hier einen Überblick zu sehen</p>
          <button
            onClick={() => onNavigate('timeline')}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-[#F5B800] to-[#f4d03f] text-gray-900 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:shadow-lg hover:scale-[1.05] active:scale-95 transition-all min-h-[40px] mx-4 timeline-ripple-button"
          >
            Timeline erstellen
          </button>
        </div>
      )}
    </div>
  );
}
