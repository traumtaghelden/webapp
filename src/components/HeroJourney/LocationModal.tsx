import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Users, DollarSign, Sparkles, CheckCircle, Lightbulb } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../utils/logger';

interface LocationModalProps {
  weddingId: string;
  onClose: () => void;
  onSave: () => void;
}

interface WeddingData {
  total_budget: number;
  guest_count: number;
  vision_keywords: string[];
  vision_text: string;
}

export default function LocationModal({
  weddingId,
  onClose,
  onSave,
}: LocationModalProps) {
  const [weddingData, setWeddingData] = useState<WeddingData | null>(null);

  // Body scroll lock beim Öffnen des Modals
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);
  const [notes, setNotes] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [weddingResult, progressResult] = await Promise.all([
        supabase
          .from('weddings')
          .select('total_budget, guest_count, vision_keywords, vision_text')
          .eq('id', weddingId)
          .maybeSingle(),
        supabase
          .from('hero_journey_progress')
          .select('status, data')
          .eq('wedding_id', weddingId)
          .eq('phase_id', 'location')
          .maybeSingle()
      ]);

      if (weddingResult.error) {
        logger.error('Error loading wedding data', 'LocationModal', weddingResult.error);
      } else if (weddingResult.data) {
        setWeddingData(weddingResult.data);
      }

      if (progressResult.data) {
        setIsStarted(progressResult.data.status === 'in_progress' || progressResult.data.status === 'completed');
        if (progressResult.data.data?.notes) {
          setNotes(progressResult.data.data.notes);
        }
      }
    } catch (error) {
      logger.error('Error in loadData', 'LocationModal', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendation = (): string => {
    if (!weddingData) return '';

    const { total_budget, guest_count, vision_keywords } = weddingData;
    const perPersonBudget = total_budget && guest_count ? Math.floor(total_budget / guest_count) : 0;

    let recommendation = '';

    if (total_budget && guest_count) {
      recommendation += `Bei eurem Budget von ${total_budget.toLocaleString('de-DE')} Euro und ${guest_count} Gästen `;

      if (perPersonBudget >= 150) {
        recommendation += 'habt ihr Spielraum für exklusive Locations wie Schlösser, Herrenhäuser oder Premium-Hotels. ';
      } else if (perPersonBudget >= 100) {
        recommendation += 'empfehlen wir klassische Locations wie Hotels, Restaurants oder stilvolle Landhäuser. ';
      } else {
        recommendation += 'sind rustikale Scheunen, Landhöfe oder Outdoor-Locations ideal für euch. ';
      }
    }

    if (vision_keywords && vision_keywords.length > 0) {
      const keywords = Array.isArray(vision_keywords) ? vision_keywords.join(', ') : vision_keywords;
      recommendation += `\n\nDenkt an eure Vision: ${keywords}. Die Location sollte diese Atmosphäre widerspiegeln.`;
    }

    if (guest_count) {
      recommendation += `\n\nWichtig: Die Location muss mindestens ${guest_count} Personen Platz bieten.`;
    }

    return recommendation;
  };

  const handleStart = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('hero_journey_progress')
        .upsert({
          wedding_id: weddingId,
          phase_id: 'location',
          status: 'in_progress',
          progress_percentage: 50,
          data: { notes, started_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'wedding_id,phase_id'
        });

      if (error) {
        logger.error('Error starting location', 'LocationModal', error);
        showToast('Fehler beim Starten', 'error');
      } else {
        setIsStarted(true);
        showToast('Location-Planung gestartet!', 'success');
      }
    } catch (error) {
      logger.error('Error in handleStart', 'LocationModal', error);
      showToast('Fehler beim Starten', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('hero_journey_progress')
        .upsert({
          wedding_id: weddingId,
          phase_id: 'location',
          status: 'completed',
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
          data: { notes },
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'wedding_id,phase_id'
        });

      if (error) {
        logger.error('Error completing location', 'LocationModal', error);
        showToast('Fehler beim Abschließen', 'error');
      } else {
        showToast('Location-Planung abgeschlossen!', 'success');
        onSave();
        onClose();
      }
    } catch (error) {
      logger.error('Error in handleComplete', 'LocationModal', error);
      showToast('Fehler beim Abschließen', 'error');
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
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">Location buchen</h2>
            <p className="text-xs text-gray-400">Findet eure Traumlocation für den großen Tag</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-all hover:rotate-90 duration-300 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]"></div>
            </div>
          ) : (
            <>
              {/* Empfehlungen */}
              <div className="bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/5 border border-[#d4af37]/30 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-[#d4af37]" />
                  <h3 className="text-xl font-bold text-white">Unsere Empfehlung für euch</h3>
                </div>

                <div className="text-gray-200 text-base leading-relaxed whitespace-pre-line">
                  {generateRecommendation()}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {weddingData?.total_budget && (
                    <div className="bg-[#1a3a5c]/50 rounded-lg p-4 border border-[#d4af37]/20">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-[#d4af37]" />
                        <span className="text-sm text-gray-400">Budget</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {weddingData.total_budget.toLocaleString('de-DE')} €
                      </p>
                    </div>
                  )}

                  {weddingData?.guest_count && (
                    <div className="bg-[#1a3a5c]/50 rounded-lg p-4 border border-[#d4af37]/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-[#d4af37]" />
                        <span className="text-sm text-gray-400">Gäste</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {weddingData.guest_count}
                      </p>
                    </div>
                  )}

                  {weddingData?.guest_count && weddingData?.total_budget && (
                    <div className="bg-[#1a3a5c]/50 rounded-lg p-4 border border-[#d4af37]/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-5 h-5 text-[#d4af37]" />
                        <span className="text-sm text-gray-400">Pro Person</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {Math.floor(weddingData.total_budget / weddingData.guest_count)} €
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Was ihr tun solltet */}
              <div className="bg-[#1a3a5c]/30 border border-gray-700/50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">Was ihr jetzt tun solltet:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-[#d4af37] mt-0.5 flex-shrink-0" />
                    <span>Recherchiert Locations mit passender Kapazität für eure Gästezahl</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-[#d4af37] mt-0.5 flex-shrink-0" />
                    <span>Filtert nach eurem Budget-Rahmen</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-[#d4af37] mt-0.5 flex-shrink-0" />
                    <span>Besichtigt eure Top 3-5 Favoriten</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-[#d4af37] mt-0.5 flex-shrink-0" />
                    <span>Prüft: Passt die Location zu eurer Vision?</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-[#d4af37] mt-0.5 flex-shrink-0" />
                    <span>Bucht eure Wunsch-Location</span>
                  </li>
                </ul>
              </div>

              {/* Optional: Notizen */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Notizen (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all resize-none"
                  placeholder="Notiert hier eure Gedanken, Ideen oder Links zu Locations..."
                  rows={4}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-end gap-2 p-4 border-t border-gray-700/50 bg-[#0A1F3D]/50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-300 border border-gray-600/50 hover:bg-gray-700/30 transition-all duration-300"
          >
            Abbrechen
          </button>

          {!isStarted ? (
            <button
              onClick={handleStart}
              disabled={saving}
              className="px-5 py-2 rounded-lg text-sm bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#c19a2e] hover:to-[#d4af37] text-gray-900 font-semibold transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Startet...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Jetzt starten</span>
                  <span className="sm:hidden">Starten</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="px-5 py-2 rounded-lg text-sm bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Speichert...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Abschließen</span>
                  <span className="sm:hidden">Fertig</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
