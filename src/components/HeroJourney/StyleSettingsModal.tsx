import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { X, Palette, CheckCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../utils/logger';

interface StyleSettingsModalProps {
  weddingId: string;
  currentTheme: string;
  currentColors: { primary?: string; secondary?: string; accent?: string };
  currentFonts: { heading?: string; body?: string };
  onClose: () => void;
  onSave: () => void;
}

const themeOptions = [
  { id: 'modern', label: 'Modern', desc: 'Klare Linien, minimalistisch' },
  { id: 'classic', label: 'Klassisch', desc: 'Zeitlos elegant' },
  { id: 'bohemian', label: 'Boho', desc: 'Natürlich, entspannt' },
  { id: 'rustic', label: 'Rustikal', desc: 'Warm, naturverbunden' },
  { id: 'glamorous', label: 'Glamourös', desc: 'Luxuriös, festlich' },
  { id: 'vintage', label: 'Vintage', desc: 'Nostalgisch, romantisch' },
];

const colorPalettes = [
  { name: 'Gold & Weiß', primary: '#d4af37', secondary: '#ffffff', accent: '#c19a2e' },
  { name: 'Blush & Grau', primary: '#f4c2c2', secondary: '#6b7280', accent: '#9ca3af' },
  { name: 'Salbei & Creme', primary: '#9caf88', secondary: '#f5f5dc', accent: '#7a9370' },
  { name: 'Navy & Gold', primary: '#1e3a8a', secondary: '#d4af37', accent: '#60a5fa' },
  { name: 'Terracotta & Beige', primary: '#e07a5f', secondary: '#f2cc8f', accent: '#81b29a' },
  { name: 'Lavendel & Weiß', primary: '#b19cd9', secondary: '#ffffff', accent: '#9b7fbd' },
];

export default function StyleSettingsModal({
  weddingId,
  currentTheme,
  currentColors,
  currentFonts,
  onClose,
  onSave,
}: StyleSettingsModalProps) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || '');

  // Body scroll lock beim Öffnen des Modals
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);
  const [colors, setColors] = useState(currentColors || {});
  const [fonts, setFonts] = useState(currentFonts || {});
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const selectColorPalette = (palette: typeof colorPalettes[0]) => {
    setColors({
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
    });
  };

  const handleSave = async () => {
    if (!selectedTheme) {
      showToast('Bitte wählt einen Stil aus.', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('weddings')
        .update({
          style_theme: selectedTheme,
          style_colors: colors,
          style_fonts: fonts,
          updated_at: new Date().toISOString(),
        })
        .eq('id', weddingId);

      if (error) {
        logger.error('Error saving style settings', 'StyleSettingsModal', error);
        showToast('Fehler beim Speichern des Stils', 'error');
      } else {
        showToast('Stil erfolgreich gespeichert!', 'success');
        onSave();
        onClose();
      }
    } catch (error) {
      logger.error('Error in handleSave', 'StyleSettingsModal', error);
      showToast('Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden transition-opacity duration-300" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, opacity: 1 }}>
      <div
        className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-2xl w-full mx-auto"
        style={{
          maxWidth: 'min(1000px, calc(100vw - 2rem))'
        }}
      >
        <div className="flex items-start gap-3 p-4 border-b border-gray-700/50 flex-shrink-0">
          <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-3 rounded-lg shadow-lg">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">Euer Stil & Design</h2>
            <p className="text-xs text-gray-400">
              Wählt Farben, Schriftarten und den Gesamtstil für eure Hochzeit
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-all hover:rotate-90 duration-300 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Wählt euren Hochzeitsstil
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {themeOptions.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`
                      p-4 rounded-lg text-left transition-all border-2
                      ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#d4af37]/20 to-[#f4d03f]/20 border-[#d4af37]'
                          : 'bg-[#1a3a5c] border-gray-600 hover:border-[#d4af37]/50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-white font-medium">{theme.label}</span>
                      {isSelected && <CheckCircle className="w-5 h-5 text-[#d4af37]" />}
                    </div>
                    <p className="text-xs text-gray-400">{theme.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Wählt eure Farbpalette
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {colorPalettes.map((palette) => {
                const isSelected =
                  colors.primary === palette.primary &&
                  colors.secondary === palette.secondary &&
                  colors.accent === palette.accent;
                return (
                  <button
                    key={palette.name}
                    onClick={() => selectColorPalette(palette)}
                    className={`
                      p-4 rounded-lg text-left transition-all border-2
                      ${
                        isSelected
                          ? 'border-[#d4af37] bg-[#1a3a5c]/50'
                          : 'border-gray-600 bg-[#1a3a5c] hover:border-[#d4af37]/50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium text-sm">{palette.name}</span>
                      {isSelected && <CheckCircle className="w-5 h-5 text-[#d4af37]" />}
                    </div>
                    <div className="flex gap-2">
                      <div
                        className="w-12 h-12 rounded-lg shadow-md border border-white/20"
                        style={{ backgroundColor: palette.primary }}
                      />
                      <div
                        className="w-12 h-12 rounded-lg shadow-md border border-white/20"
                        style={{ backgroundColor: palette.secondary }}
                      />
                      <div
                        className="w-12 h-12 rounded-lg shadow-md border border-white/20"
                        style={{ backgroundColor: palette.accent }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Individuelle Farben (optional)
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Primärfarbe</label>
                <input
                  type="color"
                  value={colors.primary || '#d4af37'}
                  onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                  className="w-full h-12 rounded-lg cursor-pointer border-2 border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Sekundärfarbe</label>
                <input
                  type="color"
                  value={colors.secondary || '#ffffff'}
                  onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                  className="w-full h-12 rounded-lg cursor-pointer border-2 border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Akzentfarbe</label>
                <input
                  type="color"
                  value={colors.accent || '#c19a2e'}
                  onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                  className="w-full h-12 rounded-lg cursor-pointer border-2 border-gray-600"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-700/50 bg-[#0A1F3D]/50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-300 border border-gray-600/50 hover:bg-gray-700/30 transition-all"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#c19a2e] hover:from-[#c19a2e] hover:to-[#d4af37] text-gray-900 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#d4af37]/30 hover:shadow-xl hover:scale-105 active:scale-95"
          >
            {saving ? 'Speichern...' : 'Stil speichern'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
