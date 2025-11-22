import { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, Star, Sparkles, Plus, Link as LinkIcon } from 'lucide-react';
import { supabase, type Location } from '../../lib/supabase';
import LocationHeroCard from './LocationHeroCard';
import { LOCATION } from '../../constants/terminology';
import { useToast } from '../../contexts/ToastContext';

interface LocationHeroesTabProps {
  weddingId: string;
  locations: Location[];
  onUpdate: () => void;
  onAddLocation: () => void;
  onEditLocation: (locationId: string) => void;
}

interface LocationWithAssignments extends Location {
  eventAssignments?: any[];
  events?: any[];
}

export default function LocationHeroesTab({
  weddingId,
  locations,
  onUpdate,
  onAddLocation,
  onEditLocation
}: LocationHeroesTabProps) {
  const { showToast } = useToast();
  const [locationsWithData, setLocationsWithData] = useState<LocationWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);

  const bookedLocations = locations.filter(l =>
    l.booking_status === 'booked'
  );

  useEffect(() => {
    loadLocationData();
  }, [locations]);

  const loadLocationData = async () => {
    try {
      setLoading(true);

      const locationIds = bookedLocations.map(l => l.id);
      if (locationIds.length === 0) {
        setLocationsWithData([]);
        setLoading(false);
        return;
      }

      const { data: assignments } = await supabase
        .from('location_event_assignments')
        .select('*, wedding_day_blocks(*)')
        .in('location_id', locationIds);

      const enrichedLocations = bookedLocations.map(location => {
        const locationAssignments = assignments?.filter(a => a.location_id === location.id) || [];
        const locationEvents = locationAssignments
          .map(a => a.wedding_day_blocks)
          .filter(Boolean);

        return {
          ...location,
          eventAssignments: locationAssignments,
          events: locationEvents
        };
      });

      setLocationsWithData(enrichedLocations);
    } catch (error) {
      console.error('Error loading location data:', error);
      showToast('Fehler beim Laden der Daten', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = bookedLocations.reduce((sum, l) => sum + (l.total_cost || 0), 0);
  const totalCapacity = bookedLocations.reduce((sum, l) => sum + (l.max_capacity || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-3xl p-8 shadow-2xl border-2 border-[#d4af37]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl"></div>

        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Sparkles className="w-10 h-10 text-[#d4af37] animate-pulse" />
                Meine {LOCATION.PLURAL}
              </h2>
              <p className="text-white/70 text-lg">
                Deine gebuchten Locations für den großen Tag
              </p>
            </div>
            <button
              onClick={onAddLocation}
              className="flex items-center gap-2 px-6 py-4 bg-[#d4af37] text-[#0a253c] rounded-xl font-bold hover:bg-[#c19a2e] transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-6 h-6" />
              {LOCATION.ADD}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 hover:border-[#d4af37] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{bookedLocations.length}</div>
                  <div className="text-white/70 text-sm">Gebuchte {LOCATION.PLURAL}</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 hover:border-[#d4af37] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {totalCost.toLocaleString('de-DE')} €
                  </div>
                  <div className="text-white/70 text-sm">
                    Gesamtkosten
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 hover:border-[#d4af37] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{totalCapacity}</div>
                  <div className="text-white/70 text-sm">Gesamtkapazität</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 hover:border-[#d4af37] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Star className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{bookedLocations.filter(l => l.is_favorite).length}</div>
                  <div className="text-white/70 text-sm">Favoriten</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#d4af37]"></div>
        </div>
      ) : bookedLocations.length === 0 ? (
        <div className="bg-gradient-to-br from-[#f7f2eb] to-white rounded-3xl p-16 text-center border-2 border-dashed border-[#d4af37] shadow-xl">
          <Users className="w-24 h-24 text-[#d4af37] mx-auto mb-6 opacity-50" />
          <h3 className="text-3xl font-bold text-[#0a253c] mb-4">
            Noch keine gebuchten {LOCATION.PLURAL}
          </h3>
          <p className="text-[#666666] text-lg mb-8 max-w-md mx-auto">
            Beginne damit, deine Traumlocations zu buchen. Wähle aus dem Pool oder füge neue {LOCATION.PLURAL} hinzu.
          </p>
          <button
            onClick={onAddLocation}
            className="px-8 py-4 bg-[#d4af37] text-[#0a253c] rounded-xl font-bold text-lg hover:bg-[#c19a2e] transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-6 h-6 inline mr-2" />
            Erste {LOCATION.SINGULAR} hinzufügen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {locationsWithData.map((location) => (
            <div key={location.id} className="group relative">
              <LocationHeroCard
                location={location}
                onUpdate={onUpdate}
                onEdit={() => onEditLocation(location.id)}
                size="normal"
              />

              {location.events && location.events.length > 0 && (
                <div className="mt-3 bg-white rounded-xl p-3 shadow-md border-2 border-[#d4af37]/20">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#0a253c] mb-2">
                    <LinkIcon className="w-4 h-4 text-[#d4af37]" />
                    Zugeordnete Events
                  </div>
                  <div className="space-y-1">
                    {location.events.slice(0, 3).map((event: any) => (
                      <div
                        key={event.id}
                        className="text-xs px-2 py-1 bg-[#d4af37]/10 text-[#0a253c] rounded-lg truncate"
                      >
                        {event.title}
                      </div>
                    ))}
                    {location.events.length > 3 && (
                      <div className="text-xs text-[#666666] text-center pt-1">
                        +{location.events.length - 3} weitere
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
