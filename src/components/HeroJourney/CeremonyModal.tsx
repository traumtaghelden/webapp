import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, Clock, MapPin, CheckCircle, Sparkles, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../utils/logger';

interface CeremonyTemplate {
  id: string;
  template_name: string;
  template_description: string;
  sample_data: {
    type: string;
    duration: number;
    typical_cost: number;
    checklist: string[];
    tips: string;
  };
}

interface CeremonyModalProps {
  weddingId: string;
  currentCeremonyType?: string;
  currentCeremonyLocation?: string;
  currentCeremonyTime?: string;
  currentWeddingDate?: string;
  onClose: () => void;
  onSave: () => void;
}

export default function CeremonyModal({
  weddingId,
  currentCeremonyType,
  currentCeremonyLocation,
  currentCeremonyTime,
  currentWeddingDate,
  onClose,
  onSave,
}: CeremonyModalProps) {
  const [templates, setTemplates] = useState<CeremonyTemplate[]>([]);

  // Body scroll lock beim Öffnen des Modals
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);
  const [selectedTemplate, setSelectedTemplate] = useState<CeremonyTemplate | null>(null);
  const [ceremonyType, setCeremonyType] = useState(currentCeremonyType || '');
  const [ceremonyLocation, setCeremonyLocation] = useState(currentCeremonyLocation || '');
  const [ceremonyTime, setCeremonyTime] = useState(currentCeremonyTime || '14:00');
  const [ceremonyDuration, setCeremonyDuration] = useState(60);
  const [weddingDate, setWeddingDate] = useState(currentWeddingDate || '');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_journey_step_templates')
        .select('*')
        .eq('step_id', 'ceremony')
        .eq('is_active', true)
        .order('order_index');

      if (error) {
        logger.error('Error loading templates', 'CeremonyModal', error);
      } else {
        setTemplates(data || []);
      }
    } catch (error) {
      logger.error('Error in loadTemplates', 'CeremonyModal', error);
    }
  };

  const handleTemplateSelect = (template: CeremonyTemplate) => {
    setSelectedTemplate(template);
    setCeremonyType(template.sample_data.type);
    setCeremonyDuration(template.sample_data.duration);
  };

  const handleSave = async () => {
    if (!weddingDate) {
      showToast('Bitte gib das Hochzeitsdatum an', 'error');
      return;
    }

    setSaving(true);
    try {
      const [weddingResult, progressResult] = await Promise.all([
        supabase
          .from('weddings')
          .update({
            wedding_date: weddingDate,
            ceremony_type: ceremonyType || null,
            ceremony_location: ceremonyLocation || null,
            ceremony_time: ceremonyTime || null,
            ceremony_duration: ceremonyDuration || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', weddingId),
        supabase
          .from('hero_journey_progress')
          .upsert({
            wedding_id: weddingId,
            phase_id: 'ceremony',
            status: 'completed',
            progress_percentage: 100,
            completed_at: new Date().toISOString(),
            data: {
              ceremony_type: ceremonyType,
              ceremony_location: ceremonyLocation,
              ceremony_time: ceremonyTime
            },
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'wedding_id,phase_id'
          })
      ]);

      if (weddingResult.error || progressResult.error) {
        logger.error('Error saving ceremony', 'CeremonyModal', weddingResult.error || progressResult.error);
        showToast('Fehler beim Speichern', 'error');
      } else {
        showToast('Trauung erfolgreich gespeichert!', 'success');
        onSave();
        onClose();
      }
    } catch (error) {
      logger.error('Error in handleSave', 'CeremonyModal', error);
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
          maxWidth: 'min(1000px, calc(100vw - 2rem))'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-[#f4d03f]/10 pointer-events-none rounded-2xl"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#d4af37]/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#f4d03f]/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse pointer-events-none"></div>

        {/* Header */}
        <div className="relative z-10 flex items-start gap-3 p-4 border-b border-gray-700/50 flex-shrink-0">
          <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-2.5 rounded-lg shadow-xl shadow-[#d4af37]/40">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">Trauung & Timing</h2>
            <p className="text-xs text-gray-400">Lege fest, wo und wie ihr euch das Ja-Wort gebt</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-all hover:rotate-90 duration-300 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          {/* Templates */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#d4af37]" />
              <h3 className="text-xl font-bold text-white">Wähle deine Trauungsart</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`
                    p-5 rounded-xl text-left transition-all duration-300 border-2
                    ${
                      selectedTemplate?.id === template.id
                        ? 'bg-gradient-to-br from-[#d4af37]/20 to-red-500/20 border-[#d4af37] shadow-xl scale-105'
                        : 'bg-[#1a3a5c]/30 border-gray-600/50 hover:border-[#d4af37]/50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-white text-lg">{template.template_name}</h4>
                    {selectedTemplate?.id === template.id && (
                      <CheckCircle className="w-6 h-6 text-[#d4af37]" />
                    )}
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{template.template_description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {template.sample_data.duration} Min
                    </span>
                    <span>~{template.sample_data.typical_cost}€</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedTemplate && (
              <div className="bg-[#d4af37]/10 backdrop-blur-sm rounded-xl p-5 border border-[#d4af37]/30">
                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#d4af37]" />
                  Typische Checkliste für {selectedTemplate.template_name}
                </h4>
                <ul className="space-y-2">
                  {selectedTemplate.sample_data.checklist.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                      <span className="text-[#d4af37] font-bold mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <p className="text-sm text-blue-200 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Tipp:</strong> {selectedTemplate.sample_data.tips}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Hochzeitsdatum<span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#1a3a5c]/50 border-2 border-gray-600/50 rounded-xl text-white focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/30 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Trauungsort
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={ceremonyLocation}
                  onChange={(e) => setCeremonyLocation(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#1a3a5c]/50 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/30 outline-none transition-all"
                  placeholder="z.B. Standesamt Musterstadt, Kirche St. Maria"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Uhrzeit
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="time"
                    value={ceremonyTime}
                    onChange={(e) => setCeremonyTime(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#1a3a5c]/50 border-2 border-gray-600/50 rounded-xl text-white focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/30 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Dauer (Minuten)
                </label>
                <input
                  type="number"
                  value={ceremonyDuration}
                  onChange={(e) => setCeremonyDuration(parseInt(e.target.value) || 60)}
                  className="w-full px-4 py-3 bg-[#1a3a5c]/50 border-2 border-gray-600/50 rounded-xl text-white focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/30 outline-none transition-all"
                  min="15"
                  max="180"
                  step="15"
                />
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
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Trauung speichern</span>
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
