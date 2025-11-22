import { useState, useEffect } from 'react';
import { Save, Heart, Calendar, Users, DollarSign, CheckCircle, Loader2 } from 'lucide-react';
import { supabase, type Wedding } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface SettingsHochzeitTabProps {
  weddingId: string;
  onUpdate: () => void;
}

export default function SettingsHochzeitTab({ weddingId, onUpdate }: SettingsHochzeitTabProps) {
  const { showToast } = useToast();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState({
    partner1Name: '',
    partner2Name: '',
    partner1Age: '',
    partner2Age: '',
    partner1HeroType: 'hero1',
    partner2HeroType: 'hero2',
    weddingDate: '',
    guestCount: '',
    ceremonyType: 'traditional',
    budget: '',
  });

  useEffect(() => {
    loadWedding();
  }, [weddingId]);

  const loadWedding = async () => {
    try {
      const { data } = await supabase
        .from('weddings')
        .select('*')
        .eq('id', weddingId)
        .maybeSingle();

      if (data) {
        setWedding(data);
        const initialData = {
          partner1Name: data.partner_1_name,
          partner2Name: data.partner_2_name,
          partner1Age: data.partner_1_age?.toString() || '',
          partner2Age: data.partner_2_age?.toString() || '',
          partner1HeroType: data.partner_1_hero_type || 'hero1',
          partner2HeroType: data.partner_2_hero_type || 'hero2',
          weddingDate: data.wedding_date,
          guestCount: data.guest_count.toString(),
          ceremonyType: data.ceremony_type,
          budget: data.total_budget.toString(),
        };
        setFormData(initialData);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error loading wedding:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await supabase
        .from('weddings')
        .update({
          partner_1_name: formData.partner1Name,
          partner_2_name: formData.partner2Name,
          partner_1_age: formData.partner1Age ? parseInt(formData.partner1Age) : null,
          partner_2_age: formData.partner2Age ? parseInt(formData.partner2Age) : null,
          partner_1_hero_type: formData.partner1HeroType,
          partner_2_hero_type: formData.partner2HeroType,
          wedding_date: formData.weddingDate,
          guest_count: parseInt(formData.guestCount) || 0,
          ceremony_type: formData.ceremonyType,
          total_budget: parseFloat(formData.budget) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', weddingId);

      showToast('Änderungen erfolgreich gespeichert!', 'success');
      setHasChanges(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving:', error);
      showToast('Fehler beim Speichern der Änderungen', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getDaysUntilWedding = () => {
    if (!formData.weddingDate) return null;
    const today = new Date();
    const weddingDate = new Date(formData.weddingDate);
    const diffTime = weddingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilWedding = getDaysUntilWedding();

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-[#0a253c] mb-2">Hochzeitsdetails</h3>
          <p className="text-[#666666]">Verwalten Sie die Grunddaten Ihrer Hochzeit</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px]"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Speichert...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Speichern
            </>
          )}
        </button>
      </div>

      {/* Countdown Card */}
      {formData.weddingDate && daysUntilWedding !== null && daysUntilWedding > 0 && (
        <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium mb-1 text-white/80">Noch bis zur Hochzeit</div>
              <div className="text-4xl font-bold">{daysUntilWedding} Tage</div>
            </div>
            <Calendar className="w-16 h-16 text-white/30" />
          </div>
        </div>
      )}

      {/* Partner Information */}
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-2xl p-6 md:p-8 shadow-lg border border-[#d4af37]/10">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-2 rounded-lg">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-xl font-bold text-[#0a253c]">Partner-Informationen</h4>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Partner 1 */}
          <div className="space-y-4">
            <div className="bg-[#f7f2eb]/50 rounded-lg p-3 mb-4">
              <h5 className="text-lg font-semibold text-[#0a253c]">Partner 1</h5>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0a253c] mb-2">
                Name<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.partner1Name}
                onChange={(e) => handleChange('partner1Name', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#d4af37]/30 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 focus:outline-none bg-white transition-all min-h-[44px]"
                placeholder="z.B. Max Mustermann"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0a253c] mb-2">Alter</label>
              <input
                type="number"
                value={formData.partner1Age}
                onChange={(e) => handleChange('partner1Age', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#d4af37]/30 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 focus:outline-none bg-white transition-all min-h-[44px]"
                min="18"
                max="120"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Partner 2 */}
          <div className="space-y-4">
            <div className="bg-[#f7f2eb]/50 rounded-lg p-3 mb-4">
              <h5 className="text-lg font-semibold text-[#0a253c]">Partner 2</h5>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0a253c] mb-2">
                Name<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.partner2Name}
                onChange={(e) => handleChange('partner2Name', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#d4af37]/30 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 focus:outline-none bg-white transition-all min-h-[44px]"
                placeholder="z.B. Maria Musterfrau"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0a253c] mb-2">Alter</label>
              <input
                type="number"
                value={formData.partner2Age}
                onChange={(e) => handleChange('partner2Age', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#d4af37]/30 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 focus:outline-none bg-white transition-all min-h-[44px]"
                min="18"
                max="120"
                placeholder="Optional"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Wedding Details */}
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-2xl p-6 md:p-8 shadow-lg border border-[#d4af37]/10">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-2 rounded-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-xl font-bold text-[#0a253c]">Hochzeitsdetails</h4>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-[#0a253c] mb-2">
              Hochzeitsdatum<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="date"
              value={formData.weddingDate}
              onChange={(e) => handleChange('weddingDate', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#d4af37]/30 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 focus:outline-none bg-white transition-all min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0a253c] mb-2">
              Art der Trauung<span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={formData.ceremonyType}
              onChange={(e) => handleChange('ceremonyType', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#d4af37]/30 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 focus:outline-none bg-white transition-all min-h-[44px]"
            >
              <option value="traditional">Traditionell</option>
              <option value="civil">Standesamtlich</option>
              <option value="religious">Kirchlich</option>
              <option value="outdoor">Im Freien</option>
              <option value="destination">Destination Wedding</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0a253c] mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#d4af37]" />
                Geplante Gästezahl<span className="text-red-500 ml-1">*</span>
              </div>
            </label>
            <input
              type="number"
              value={formData.guestCount}
              onChange={(e) => handleChange('guestCount', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#d4af37]/30 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 focus:outline-none bg-white transition-all min-h-[44px]"
              min="1"
              placeholder="z.B. 80"
            />
            <p className="text-xs text-[#666666] mt-1">Diese Zahl können Sie später anpassen</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0a253c] mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#d4af37]" />
                Gesamtbudget (€)<span className="text-red-500 ml-1">*</span>
              </div>
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => handleChange('budget', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#d4af37]/30 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 focus:outline-none bg-white transition-all min-h-[44px]"
              min="0"
              step="100"
              placeholder="z.B. 15000"
            />
            <p className="text-xs text-[#666666] mt-1">Gesamtbudget für Ihre Hochzeit</p>
          </div>
        </div>
      </div>

      {/* Save Reminder */}
      {hasChanges && (
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-900">
              <div className="font-semibold mb-1">Ungespeicherte Änderungen</div>
              <div className="text-orange-800">
                Vergessen Sie nicht, Ihre Änderungen zu speichern, bevor Sie diese Seite verlassen.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
