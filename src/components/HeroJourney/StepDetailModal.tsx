import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Info, CheckCircle, Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../utils/logger';

interface StepTemplate {
  id: string;
  template_name: string;
  template_description: string;
  category: string;
  sample_data: any;
}

interface StepDetailModalProps {
  stepId: string;
  stepTitle: string;
  stepDescription: string;
  stepIcon: React.ElementType;
  whyImportant: string;
  whatToDo: string[];
  estimatedTime: string;
  dependencies: string[];
  isCompleted: boolean;
  onClose: () => void;
  onNavigate: () => void;
}

export default function StepDetailModal({
  stepId,
  stepTitle,
  stepDescription,
  stepIcon: Icon,
  whyImportant,
  whatToDo,
  estimatedTime,
  dependencies,
  isCompleted,
  onClose,
  onNavigate,
}: StepDetailModalProps) {
  const [templates, setTemplates] = useState<StepTemplate[]>([]);

  // Body scroll lock beim Öffnen des Modals
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);
  const [selectedTemplate, setSelectedTemplate] = useState<StepTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, [stepId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hero_journey_step_templates')
        .select('*')
        .eq('step_id', stepId)
        .eq('is_active', true)
        .order('order_index');

      if (error) {
        logger.error('Error loading templates', 'StepDetailModal', error);
      } else {
        setTemplates(data || []);
      }
    } catch (error) {
      logger.error('Error in loadTemplates', 'StepDetailModal', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: StepTemplate) => {
    setSelectedTemplate(template);
  };

  const handleStartWithTemplate = () => {
    if (selectedTemplate) {
      // Store selected template in sessionStorage for the target page to use
      sessionStorage.setItem(`hero_journey_template_${stepId}`, JSON.stringify(selectedTemplate));
      showToast(`Vorlage "${selectedTemplate.template_name}" ausgewählt!`, 'success');
    }
    onNavigate();
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      klein: 'from-blue-500 to-blue-600',
      mittel: 'from-green-500 to-green-600',
      groß: 'from-orange-500 to-orange-600',
      exklusiv: 'from-purple-500 to-purple-600',
      kurz: 'from-teal-500 to-teal-600',
      standard: 'from-[#d4af37] to-[#c19a2e]',
      lang: 'from-indigo-500 to-indigo-600',
      stil: 'from-pink-500 to-pink-600',
      trauung: 'from-red-500 to-red-600',
      farbpalette: 'from-purple-500 to-purple-600',
      rustikal: 'from-amber-600 to-amber-700',
      komfort: 'from-emerald-600 to-emerald-700',
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden transition-opacity duration-300" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, opacity: 1 }}>
      <div
        className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-2xl w-full shadow-2xl border border-[#F5B800]/30 transition-transform duration-500 relative mx-auto"
        style={{
          transform: 'scale(1)',
          maxWidth: 'min(1100px, calc(100vw - 2rem))'
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-[#d4af37]/5 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>

        {/* Header */}
        <div className="relative z-10 flex items-start gap-3 p-4 border-b border-gray-700/50 flex-shrink-0/50">
          <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-4 rounded-xl shadow-2xl shadow-[#d4af37]/50">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
              {stepTitle}
              {isCompleted && <CheckCircle className="w-5 h-5 text-green-400" />}
            </h2>
            <p className="text-sm text-gray-300">{stepDescription}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all hover:rotate-90 duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          {/* Why Important Section */}
          <div className="bg-[#1a3a5c]/50 backdrop-blur-sm rounded-xl p-5 border border-[#d4af37]/20">
            <div className="flex items-start gap-3">
              <div className="bg-[#d4af37]/20 p-2 rounded-lg">
                <Lightbulb className="w-5 h-5 text-[#d4af37]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Warum ist dieser Schritt wichtig?</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{whyImportant}</p>
              </div>
            </div>
          </div>

          {/* What To Do Section */}
          <div className="bg-[#1a3a5c]/50 backdrop-blur-sm rounded-xl p-5 border border-blue-500/20">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Was ist konkret zu tun?</h3>
            </div>
            <ul className="space-y-2 ml-12">
              {whatToDo.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-[#d4af37] font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dependencies Section */}
          {dependencies.length > 0 && (
            <div className="bg-amber-500/10 backdrop-blur-sm rounded-xl p-5 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-amber-200 mb-2">Voraussetzungen</h3>
                  <p className="text-amber-100 text-sm">
                    {dependencies.join(' • ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Time Estimate */}
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Geschätzter Zeitaufwand: <strong className="text-white">{estimatedTime}</strong></span>
          </div>

          {/* Templates Section */}
          {templates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#d4af37]" />
                <h3 className="text-xl font-bold text-white">Wähle eine Vorlage</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Starte mit einer bewährten Vorlage und passe sie dann an deine Bedürfnisse an.
              </p>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`
                        p-5 rounded-xl text-left transition-all duration-300 border-2
                        ${
                          selectedTemplate?.id === template.id
                            ? 'bg-gradient-to-br from-[#d4af37]/20 to-[#c19a2e]/20 border-[#d4af37] shadow-xl shadow-[#d4af37]/30 scale-105'
                            : 'bg-[#1a3a5c]/30 border-gray-600/50 hover:border-[#d4af37]/50 hover:scale-102'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-white text-lg mb-1">{template.template_name}</h4>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getCategoryColor(template.category)}`}>
                            {template.category}
                          </span>
                        </div>
                        {selectedTemplate?.id === template.id && (
                          <CheckCircle className="w-5 h-5 text-[#d4af37]" />
                        )}
                      </div>
                      <p className="text-gray-300 text-sm">{template.template_description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between gap-4 p-6 border-t border-gray-700/50 bg-[#0A1F3D]/50 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl text-gray-300 border-2 border-gray-600/50 hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-300 font-medium hover:scale-105 active:scale-95"
          >
            Abbrechen
          </button>
          <button
            onClick={handleStartWithTemplate}
            className="relative px-8 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c19a2e] hover:from-[#c19a2e] hover:to-[#d4af37] text-white font-semibold transition-all duration-300 shadow-xl shadow-[#d4af37]/30 hover:shadow-2xl hover:shadow-[#d4af37]/50 hover:scale-105 active:scale-95 overflow-hidden group flex items-center gap-2"
          >
            <span className="relative z-10">
              {selectedTemplate ? `Mit "${selectedTemplate.template_name}" starten` : 'Jetzt starten'}
            </span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </button>
        </div>

        <style>{`
          @keyframes zoom-in {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-in.zoom-in { animation: zoom-in 0.5s ease-out forwards; }
        `}</style>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
