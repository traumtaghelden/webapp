import { useState, useEffect } from 'react';
import { X, CheckCircle, Folder } from 'lucide-react';
import { supabase, type BudgetCategory } from '../../lib/supabase';

interface CategoryWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  weddingId: string;
  existingCount: number;
  editingCategory?: BudgetCategory | null;
}

const PRESET_COLORS = [
  { name: 'Gold', value: '#d4af37' },
  { name: 'Blau', value: '#3b82f6' },
  { name: 'Grün', value: '#10b981' },
  { name: 'Rot', value: '#ef4444' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Türkis', value: '#14b8a6' },
  { name: 'Gelb', value: '#f59e0b' },
];

export default function CategoryWizard({
  isOpen,
  onClose,
  onSuccess,
  weddingId,
  existingCount,
  editingCategory,
}: CategoryWizardProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0].value);
  const [plannedBudget, setPlannedBudget] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && editingCategory) {
      setName(editingCategory.name);
      setColor(editingCategory.color || PRESET_COLORS[0].value);
      setPlannedBudget((editingCategory.budget_limit || 0).toString());
    } else if (isOpen && !editingCategory) {
      setName('');
      setColor(PRESET_COLORS[0].value);
      setPlannedBudget('0');
    }
  }, [isOpen, editingCategory]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const budgetValue = parseFloat(plannedBudget) || 0;
    if (budgetValue <= 0) {
      alert('Bitte gib ein geplantes Budget größer als 0 ein');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('budget_categories')
          .update({
            name: name.trim(),
            color,
            budget_limit: budgetValue,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('budget_categories').insert({
          wedding_id: weddingId,
          name: name.trim(),
          color,
          budget_limit: budgetValue,
        });

        if (error) throw error;
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error(`Error ${editingCategory ? 'updating' : 'creating'} category:`, error);
      alert(`Fehler beim ${editingCategory ? 'Aktualisieren' : 'Erstellen'} der Kategorie`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setColor(PRESET_COLORS[0].value);
    setPlannedBudget('0');
    onClose();
  };

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = window.getComputedStyle(document.body).overflow;
      const originalHtmlOverflow = window.getComputedStyle(document.documentElement).overflow;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = '';
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="bg-gradient-to-b from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-3xl shadow-gold-lg border-2 border-[#d4af37]/30 max-w-md w-full max-h-[90vh] flex flex-col relative overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMTIsIDE3NSwgNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
        <div className="relative z-10 p-6 border-b border-[#d4af37]/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
              </h2>
              <p className="text-sm text-white/70 mt-1">
                {editingCategory ? 'Aktualisiere die Kategorie-Details' : `${existingCount} Kategorien erstellt`}
              </p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
              <X className="w-6 h-6 text-white/80 hover:text-white" />
            </button>
          </div>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Name der Kategorie <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="z.B. Catering"
                className="w-full px-4 py-3 rounded-xl border-2 border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Geplantes Budget <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={plannedBudget}
                  onChange={e => setPlannedBudget(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 font-semibold">€</span>
              </div>
              <p className="text-xs text-white/60 mt-1">
                Legt fest, wie viel ihr für diese Kategorie insgesamt einplanen möchtet. Einzelne Einträge werden dieser Kategorie zugeordnet.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/90 mb-3">Farbe wählen</label>
              <div className="grid grid-cols-4 gap-3">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className={`relative h-12 rounded-xl transition-all hover:scale-110 ${
                      color === c.value ? 'ring-4 ring-[#d4af37] ring-offset-2 ring-offset-[#0a253c]' : ''
                    }`}
                    style={{ backgroundColor: c.value }}
                  >
                    {color === c.value && (
                      <CheckCircle className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 bg-white/10 border-2 border-[#d4af37]/30 rounded-xl backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-white/90 mb-3">Vorschau</h4>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: color }}
                >
                  <Folder className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">{name || 'Kategorien-Name'}</div>
                  <div className="text-sm text-white/70">
                    Budget: {(parseFloat(plannedBudget) || 0).toLocaleString('de-DE')} €
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-6 border-t border-[#d4af37]/30 flex gap-3 bg-gradient-to-b from-transparent to-[#0a253c]/50 backdrop-blur-sm">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border-2 border-[#d4af37]/40 text-white/70 rounded-xl font-semibold hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all min-h-[40px]"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || parseFloat(plannedBudget) <= 0 || isSubmitting}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
          >
            {isSubmitting
              ? editingCategory ? 'Wird aktualisiert...' : 'Wird erstellt...'
              : editingCategory ? 'Kategorie aktualisieren' : 'Kategorie erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
}
