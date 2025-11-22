import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, MapPin, AlertTriangle, CheckCircle, Sparkles, Sun, Cloud, Snowflake } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../utils/logger';

interface WeddingDateModalProps {
  weddingId: string;
  currentDate?: string;
  onClose: () => void;
  onSave: () => void;
}

export default function WeddingDateModal({
  weddingId,
  currentDate,
  onClose,
  onSave,
}: WeddingDateModalProps) {
  const [selectedDate, setSelectedDate] = useState(currentDate || '');
  const [locationName, setLocationName] = useState<string>('');
  const [hasLocation, setHasLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Body scroll lock beim Öffnen des Modals
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  useEffect(() => {
    checkLocation();
  }, [weddingId]);

  const checkLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('name')
        .eq('wedding_id', weddingId)
        .eq('booking_status', 'booked')
        .maybeSingle();

      if (data) {
        setLocationName(data.name);
        setHasLocation(true);
      }
    } catch (error) {
      logger.error('Error checking location', 'WeddingDateModal', error);
    }
  };

  const getSeasonInfo = (dateString: string) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const month = date.getMonth() + 1;

    if (month >= 3 && month <= 5) {
      return {
        season: 'Frühling',
        icon: Sun,
        color: 'from-green-500 to-green-600',
        tips: 'Angenehme Temperaturen, Blütenpracht, oft wechselhaftes Wetter',
        popularity: 'Mittel beliebt',
      };
    } else if (month >= 6 && month <= 8) {
      return {
        season: 'Sommer',
        icon: Sun,
        color: 'from-orange-500 to-yellow-500',
        tips: 'Hochsaison! Warm, lange Tage, aber auch teurer und voller',
        popularity: 'Sehr beliebt',
      };
    } else if (month >= 9 && month <= 11) {
      return {
        season: 'Herbst',
        icon: Cloud,
        color: 'from-amber-600 to-orange-600',
        tips: 'Goldene Farben, milderes Wetter, gute Verfügbarkeit',
        popularity: 'Beliebt',
      };
    } else {
      return {
        season: 'Winter',
        icon: Snowflake,
        color: 'from-blue-400 to-blue-600',
        tips: 'Winterromantik, günstigere Preise, Indoor-Planung wichtig',
        popularity: 'Weniger beliebt',
      };
    }
  };

  const seasonInfo = getSeasonInfo(selectedDate);

  const handleSave = async () => {
    if (!selectedDate) {
      showToast('Bitte wähle ein Datum', 'error');
      return;
    }

    setSaving(true);
    try {
      const [weddingResult, progressResult] = await Promise.all([
        supabase
          .from('weddings')
          .update({
            wedding_date: selectedDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', weddingId),
        supabase
          .from('hero_journey_progress')
          .upsert({
            wedding_id: weddingId,
            phase_id: 'date',
            status: 'completed',
            progress_percentage: 100,
            completed_at: new Date().toISOString(),
            data: {
              wedding_date: selectedDate
            },
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'wedding_id,phase_id'
          })
      ]);

      if (weddingResult.error || progressResult.error) {
        logger.error('Error saving date', 'WeddingDateModal', weddingResult.error || progressResult.error);
        showToast('Fehler beim Speichern', 'error');
      } else {
        showToast('Hochzeitsdatum erfolgreich gespeichert!', 'success');
        onSave();
        onClose();
      }
    } catch (error) {
      logger.error('Error in handleSave', 'WeddingDateModal', error);
      showToast('Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden transition-opacity duration-300"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, opacity: 1 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-2xl w-full shadow-2xl border border-[#F5B800]/30 relative max-h-[90vh] flex flex-col"
        style={{
          maxWidth: 'min(900px, calc(100vw - 2rem))'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-[#f4d03f]/10 pointer-events-none rounded-2xl"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#d4af37]/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#f4d03f]/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse pointer-events-none"></div>

        {/* Header */}
        <div className="relative z-10 flex items-start gap-3 p-4 border-b border-gray-700/50 flex-shrink-0">
          <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-2.5 rounded-lg shadow-xl shadow-[#d4af37]/40">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">Euer Hochzeitsdatum</h2>
            <p className="text-xs text-gray-400">Wählt den schönsten Tag eures Lebens</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-all hover:rotate-90 duration-300 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          {/* Location Info */}
          {hasLocation ? (
            <div className="bg-green-500/10 backdrop-blur-sm rounded-xl p-5 border border-green-500/30">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <h3 className="font-bold text-green-200 mb-1">Location bereits gewählt</h3>
                  <p className="text-green-100 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {locationName}
                  </p>
                  <p className="text-green-200/80 text-xs mt-2">
                    Achte darauf, dass dein Wunschdatum mit der Location-Verfügbarkeit übereinstimmt.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/10 backdrop-blur-sm rounded-xl p-5 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-200 mb-1">Noch keine Location gebucht</h3>
                  <p className="text-amber-100 text-sm">
                    Du kannst trotzdem schon ein Datum wählen. Denke daran, später die Verfügbarkeit der Location zu prüfen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-white mb-2">
              Wähle euer Hochzeitsdatum<span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-4 bg-[#1a3a5c]/50 border-2 border-gray-600/50 rounded-xl text-white text-lg font-semibold focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/30 outline-none transition-all"
            />
          </div>

          {/* Season Info */}
          {seasonInfo && (
            <div className={`bg-gradient-to-r ${seasonInfo.color} p-6 rounded-xl shadow-xl`}>
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <seasonInfo.icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-white">{seasonInfo.season}</h3>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                      {seasonInfo.popularity}
                    </span>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">{seasonInfo.tips}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-[#1a3a5c]/50 backdrop-blur-sm rounded-xl p-5 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-bold text-white mb-2">Wichtige Hinweise</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[#d4af37] font-bold mt-0.5">•</span>
                    <span>Beliebte Termine (Samstage im Sommer) frühzeitig buchen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#d4af37] font-bold mt-0.5">•</span>
                    <span>Feiertage und Schulferien beachten (Verfügbarkeit, Preise)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#d4af37] font-bold mt-0.5">•</span>
                    <span>Freitags und sonntags oft günstiger als samstags</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#d4af37] font-bold mt-0.5">•</span>
                    <span>Mindestens 12 Monate Vorlaufzeit empfohlen</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-end gap-2 p-4 border-t border-gray-700/50 bg-[#0A1F3D]/50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-300 border border-gray-600/50 hover:bg-gray-700/30 transition-all duration-300"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#c19a2e] hover:to-[#d4af37] text-gray-900 font-semibold transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Speichern...</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Datum speichern</span>
                <span className="sm:hidden">Speichern</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
