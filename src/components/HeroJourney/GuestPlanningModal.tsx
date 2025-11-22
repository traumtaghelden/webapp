import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Gift, X, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface GuestPlanningModalProps {
  weddingId: string;
  onClose: () => void;
  onNavigate: () => void;
  onComplete: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const CHECKLIST_ITEMS: Omit<ChecklistItem, 'checked'>[] = [
  { id: 'save_the_dates', label: 'Save-the-Dates versendet' },
  { id: 'invitations_sent', label: 'Einladungen verschickt' },
  { id: 'rsvps_collected', label: 'RSVPs gesammelt' },
  { id: 'dietary_requirements', label: 'Diätwünsche erfasst' },
  { id: 'seating_plan', label: 'Sitzplan erstellt' },
  { id: 'guest_gifts', label: 'Gastgeschenke organisiert' },
  { id: 'childcare', label: 'Kinderbetreuung geplant (falls nötig)' },
  { id: 'accommodation_info', label: 'Unterkunfts-Infos geteilt' },
];

export default function GuestPlanningModal({
  weddingId,
  onClose,
  onNavigate,
  onComplete
}: GuestPlanningModalProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    CHECKLIST_ITEMS.map(item => ({ ...item, checked: false }))
  );
  const [loading, setLoading] = useState(true);
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
    loadProgress();
  }, [weddingId]);

  const loadProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_journey_progress')
        .select('data, progress_percentage')
        .eq('wedding_id', weddingId)
        .eq('phase_id', 'guest_planning')
        .maybeSingle();

      if (error) throw error;

      if (data?.data) {
        const savedData = data.data as Record<string, boolean>;
        setChecklist(prev =>
          prev.map(item => ({
            ...item,
            checked: savedData[item.id] || false
          }))
        );
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (itemId: string) => {
    const updatedChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setChecklist(updatedChecklist);

    const checklistData = updatedChecklist.reduce((acc, item) => {
      acc[item.id] = item.checked;
      return acc;
    }, {} as Record<string, boolean>);

    const checkedCount = updatedChecklist.filter(item => item.checked).length;
    const progressPercentage = Math.round((checkedCount / updatedChecklist.length) * 100);

    setSaving(true);
    try {
      const { error } = await supabase
        .from('hero_journey_progress')
        .upsert({
          wedding_id: weddingId,
          phase_id: 'guest_planning',
          data: checklistData,
          progress_percentage: progressPercentage,
          status: progressPercentage === 100 ? 'completed' : 'in_progress',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'wedding_id,phase_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving progress:', error);
      showToast('Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    try {
      const { error } = await supabase
        .from('hero_journey_progress')
        .upsert({
          wedding_id: weddingId,
          phase_id: 'guest_planning',
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'wedding_id,phase_id'
        });

      if (error) throw error;

      showToast('Gästeerlebnis als erledigt markiert!', 'success');
      onComplete();
      onClose();
    } catch (error) {
      console.error('Error completing step:', error);
      showToast('Fehler beim Abschließen', 'error');
    }
  };

  const checkedCount = checklist.filter(item => item.checked).length;
  const totalCount = checklist.length;
  const progressPercentage = Math.round((checkedCount / totalCount) * 100);

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center py-8 px-4 overflow-hidden transition-opacity duration-300"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, opacity: 1 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-2xl w-full shadow-2xl border border-[#F5B800]/30 relative"
        style={{ maxWidth: 'min(700px, calc(100vw - 2rem))' }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-[#d4af37]/5 pointer-events-none rounded-2xl"></div>

        {/* Header */}
        <div className="relative z-10 flex items-start gap-3 p-4 border-b border-gray-700/50 flex-shrink-0/50">
          <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-4 rounded-xl shadow-2xl shadow-[#d4af37]/50">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-bold text-white mb-1">Gästeerlebnis planen</h2>
            <p className="text-sm text-gray-300">Sorgt für ein unvergessliches Erlebnis eurer Gäste</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all hover:rotate-90 duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="relative z-10 px-6 pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Fortschritt</span>
            <span className="text-sm font-bold text-[#d4af37]">
              {checkedCount} von {totalCount} erledigt ({progressPercentage}%)
            </span>
          </div>
          <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="relative z-10 p-6 space-y-3 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
            </div>
          ) : (
            checklist.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-4 p-4 bg-[#1a3a5c]/30 hover:bg-[#1a3a5c]/50 rounded-xl cursor-pointer transition-all duration-200 border border-gray-700/50 hover:border-[#d4af37]/50 group"
              >
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(item.id)}
                    className="appearance-none w-6 h-6 border-2 border-gray-500 rounded-lg cursor-pointer transition-all duration-200 checked:bg-gradient-to-br checked:from-[#d4af37] checked:to-[#c19a2e] checked:border-[#d4af37]"
                    disabled={saving}
                  />
                  {item.checked && (
                    <CheckCircle className="w-5 h-5 text-white absolute inset-0 pointer-events-none animate-in zoom-in duration-200" />
                  )}
                </div>
                <span className={`text-base transition-all duration-200 ${
                  item.checked
                    ? 'text-gray-400 line-through'
                    : 'text-white group-hover:text-[#d4af37]'
                }`}>
                  {item.label}
                </span>
              </label>
            ))
          )}
        </div>

        {/* Info Section */}
        <div className="relative z-10 px-6 pb-6">
          <div className="bg-[#d4af37]/10 border border-[#F5B800]/30 rounded-xl p-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              💡 <strong className="text-white">Tipp:</strong> Gute Kommunikation und durchdachte Organisation sorgen dafür, dass sich eure Gäste wohl fühlen und ihr einen stressfreien Tag habt.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-gray-700/50">
          <button
            onClick={onNavigate}
            className="px-6 py-3 rounded-lg bg-[#d4af37] hover:bg-[#c19a2e] text-gray-900 font-semibold transition-all flex items-center justify-center gap-2 group"
          >
            <span>Gäste verwalten</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={handleComplete}
            className="px-6 py-3 rounded-lg border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 font-medium transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Als erledigt markieren</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
