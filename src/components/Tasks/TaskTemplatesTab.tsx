import { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import TaskTemplateSelector from '../TaskTemplateSelector';

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  tasks_count: number;
  category: string;
}

interface TaskTemplatesTabProps {
  weddingId: string;
  onUpdate: () => void;
}

export default function TaskTemplatesTab({ weddingId, onUpdate }: TaskTemplatesTabProps) {
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data } = await supabase
        .from('task_templates')
        .select('*')
        .order('name');

      if (data) {
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const predefinedTemplates = [
    {
      name: 'Klassische Hochzeit',
      description: 'Vollständiger Aufgabenplan für eine traditionelle Hochzeit',
      tasks_count: 45,
      category: 'Komplett',
    },
    {
      name: 'Freie Trauung',
      description: 'Aufgaben für eine moderne, freie Zeremonie',
      tasks_count: 38,
      category: 'Komplett',
    },
    {
      name: 'Location-Planung',
      description: 'Alle Aufgaben rund um die Locationsuche',
      tasks_count: 12,
      category: 'Bereich',
    },
    {
      name: 'Catering-Organisation',
      description: 'Kompletter Catering-Planungsprozess',
      tasks_count: 15,
      category: 'Bereich',
    },
    {
      name: 'Gästeliste & Einladungen',
      description: 'Von der Liste bis zum Versand',
      tasks_count: 10,
      category: 'Bereich',
    },
    {
      name: 'Dekoration',
      description: 'Planung und Umsetzung der Dekoration',
      tasks_count: 18,
      category: 'Bereich',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Aufgaben-Vorlagen</h3>
          <p className="text-gray-300 mt-1">Starte mit bewährten Aufgabenplänen</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predefinedTemplates.map((template, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-6 shadow-lg border-2 border-[#d4af37]/30 hover:border-[#d4af37] transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#d4af37]" />
              </div>
              <span className="px-3 py-1 bg-[#f7f2eb] text-[#666666] rounded-full text-sm font-semibold">
                {template.category}
              </span>
            </div>
            <h4 className="font-bold text-[#0a253c] text-lg mb-2">{template.name}</h4>
            <p className="text-[#666666] text-sm mb-4">{template.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#999999]">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                {template.tasks_count} Aufgaben
              </span>
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="px-4 py-2 bg-[#d4af37] text-[#0a253c] rounded-lg font-bold hover:bg-[#c19a2e] transition-all opacity-0 group-hover:opacity-100"
              >
                Verwenden
              </button>
            </div>
          </div>
        ))}
      </div>

      {showTemplateSelector && (
        <TaskTemplateSelector
          weddingId={weddingId}
          onClose={() => setShowTemplateSelector(false)}
          onApplyTemplate={() => {
            setShowTemplateSelector(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
}
