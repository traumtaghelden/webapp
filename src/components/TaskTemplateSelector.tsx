import { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, Download } from 'lucide-react';
import { supabase, type TaskTemplate } from '../lib/supabase';

interface TaskTemplateSelectorProps {
  weddingId: string;
  onClose: () => void;
  onApplyTemplate: () => void;
}

export default function TaskTemplateSelector({ weddingId, onClose, onApplyTemplate }: TaskTemplateSelectorProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data } = await supabase
        .from('task_templates')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (data) setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const tasks = selectedTemplate.tasks_json.map((task: any) => ({
        wedding_id: weddingId,
        title: task.title,
        category: task.category || 'general',
        priority: task.priority || 'medium',
        notes: task.notes || '',
        status: 'pending',
      }));

      await supabase.from('tasks').insert(tasks);
      onApplyTemplate();
      onClose();
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Fehler beim Anwenden der Vorlage');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-[#0a253c] rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-[#d4af37]/30 max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <div className="p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 pr-8 sm:pr-0">
              <div className="bg-[#d4af37] w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white">Aufgabenvorlagen</h2>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Wähle eine Vorlage für deine Hochzeitsplanung</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors absolute top-3 right-3 sm:static"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0a1929]">
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-[#d4af37] mx-auto mb-4 animate-pulse" />
              <p className="text-sm sm:text-base text-gray-400">Lade Vorlagen...</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {templates.map((template) => {
                const taskCount = Array.isArray(template.tasks_json) ? template.tasks_json.length : 0;
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-[#d4af37] bg-[#d4af37]/10 shadow-lg'
                        : 'border-gray-700 hover:border-[#d4af37] hover:shadow-md bg-[#0a253c]/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{template.name}</h3>
                        {template.description && (
                          <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3 line-clamp-2">{template.description}</p>
                        )}
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <CheckCircle className="w-6 h-6 text-[#d4af37] fill-current flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap">
                      <span className="px-2 sm:px-3 py-1 bg-[#d4af37]/20 text-[#d4af37] rounded-full font-semibold whitespace-nowrap">
                        {taskCount} Aufgaben
                      </span>
                      <span className="px-2 sm:px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full font-semibold capitalize whitespace-nowrap">
                        {template.wedding_type}
                      </span>
                    </div>

                    {selectedTemplate?.id === template.id && Array.isArray(template.tasks_json) && (
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700">
                        <p className="text-xs font-semibold text-white mb-2">Vorschau der Aufgaben:</p>
                        <div className="space-y-1 max-h-32 sm:max-h-40 overflow-y-auto">
                          {template.tasks_json.slice(0, 8).map((task: any, index: number) => (
                            <div key={index} className="text-[10px] sm:text-xs text-gray-300 flex items-start gap-1 sm:gap-2">
                              <span className="text-[#d4af37] flex-shrink-0">•</span>
                              <span className="line-clamp-1">{task.title}</span>
                            </div>
                          ))}
                          {taskCount > 8 && (
                            <p className="text-[10px] sm:text-xs text-gray-400 italic">... und {taskCount - 8} weitere</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-white/10 bg-[#0a253c]">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleApplyTemplate}
              disabled={!selectedTemplate}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base min-h-[40px]"
            >
              <Download className="w-4 h-4" />
              Vorlage anwenden
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border-2 border-gray-700 text-white rounded-xl font-semibold hover:bg-white/5 hover:scale-[1.02] active:scale-95 transition-all text-sm sm:text-base min-h-[40px]"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
