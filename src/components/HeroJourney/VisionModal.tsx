import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import {
  X, Sparkles, CheckCircle, Star, Heart, FileText,
  Users, MapPin, Calendar, Home, Lightbulb, AlertTriangle
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../utils/logger';

interface VisionModalProps {
  weddingId: string;
  currentVision: string;
  currentKeywords: string[];
  onClose: () => void;
  onSave: () => void;
}

interface VisionDetails {
  size?: 'intim' | 'mittel' | 'gross';
  atmosphere_formal?: number;
  atmosphere_traditional?: number;
  budget_range?: string;
  season_preference?: string;
  location_type?: string;
  guest_count_min?: number;
  guest_count_max?: number;
}

interface VisionPriorities {
  location?: number;
  food_drinks?: number;
  decoration?: number;
  music_entertainment?: number;
  photography_video?: number;
  atmosphere?: number;
  guest_count?: number;
  timeline?: number;
  budget_control?: number;
  personal_details?: number;
  custom_aspects?: string;
}

interface VisionPreferences {
  must_haves?: string;
  deal_breakers?: string;
  special_wishes?: string;
}

interface StepProgress {
  step1_complete: boolean;
  step2_complete: boolean;
  step3_complete: boolean;
}

const suggestedKeywords = [
  'Elegant', 'Rustikal', 'Boho', 'Modern', 'Klassisch', 'Romantisch',
  'Vintage', 'Glamourös', 'Natürlich', 'Urban', 'Festlich', 'Locker',
  'Intim', 'Minimalistisch', 'Luxuriös', 'Entspannt', 'Farbenfroh', 'Traditionell'
];

const priorityAspects = [
  { id: 'location', label: 'Location-Qualität', description: 'Die perfekte Location für eure Feier', icon: MapPin },
  { id: 'food_drinks', label: 'Essen & Getränke', description: 'Kulinarische Erlebnisse für eure Gäste', icon: Heart },
  { id: 'decoration', label: 'Dekoration & Blumen', description: 'Schöne Deko & Blumenarrangements', icon: Sparkles },
  { id: 'music_entertainment', label: 'Musik & Unterhaltung', description: 'Live-Musik, DJ oder Entertainment', icon: Heart },
  { id: 'photography_video', label: 'Fotografie & Video', description: 'Professionelle Erinnerungen festhalten', icon: Heart },
  { id: 'atmosphere', label: 'Atmosphäre & Stimmung', description: 'Die richtige Stimmung für euren Tag', icon: Heart },
  { id: 'guest_count', label: 'Anzahl der Gäste', description: 'Wie groß soll die Feier werden', icon: Users },
  { id: 'timeline', label: 'Ablauf & Timing', description: 'Perfekte Planung des Tagesablaufs', icon: Calendar },
  { id: 'budget_control', label: 'Budget-Kontrolle', description: 'Kosten im Blick behalten', icon: FileText },
  { id: 'personal_details', label: 'Persönliche Details', description: 'Individuelle & persönliche Momente', icon: Heart },
];

export default function VisionModal({
  weddingId,
  currentVision,
  currentKeywords,
  onClose,
  onSave,
}: VisionModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
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

  // Step 1 state
  const [visionText, setVisionText] = useState(currentVision);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(currentKeywords);
  const [weddingSize, setWeddingSize] = useState<'intim' | 'mittel' | 'gross' | undefined>();
  const [atmosphereFormal, setAtmosphereFormal] = useState(3);
  const [atmosphereTrad, setAtmosphereTrad] = useState(3);

  // Step 2 state
  const [priorities, setPriorities] = useState<VisionPriorities>({});
  const [customAspects, setCustomAspects] = useState('');

  // Step 3 state
  const [budgetRange, setBudgetRange] = useState<string>('');
  const [seasonPreference, setSeasonPreference] = useState<string>('');
  const [locationType, setLocationType] = useState<string>('');
  const [mustHaves, setMustHaves] = useState('');
  const [dealBreakers, setDealBreakers] = useState('');

  // Step progress
  const [stepProgress, setStepProgress] = useState<StepProgress>({
    step1_complete: false,
    step2_complete: false,
    step3_complete: false,
  });

  useEffect(() => {
    loadExistingData();
  }, [weddingId]);

  const loadExistingData = async () => {
    try {
      const { data, error } = await supabase
        .from('weddings')
        .select('vision_details, vision_priorities, vision_preferences, vision_step_progress')
        .eq('id', weddingId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const details = data.vision_details as VisionDetails || {};
        const priors = data.vision_priorities as VisionPriorities || {};
        const prefs = data.vision_preferences as VisionPreferences || {};
        const progress = data.vision_step_progress as StepProgress || { step1_complete: false, step2_complete: false, step3_complete: false };

        setWeddingSize(details.size);
        setAtmosphereFormal(details.atmosphere_formal || 3);
        setAtmosphereTrad(details.atmosphere_traditional || 3);
        setPriorities(priors);
        setCustomAspects(priors.custom_aspects || '');
        setBudgetRange(details.budget_range || '');
        setSeasonPreference(details.season_preference || '');
        setLocationType(details.location_type || '');
        setMustHaves(prefs.must_haves || '');
        setDealBreakers(prefs.deal_breakers || '');
        setStepProgress(progress);
      }
    } catch (error) {
      logger.error('Error loading vision data', 'VisionModal', error);
    }
  };

  const toggleKeyword = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword));
    } else {
      setSelectedKeywords([...selectedKeywords, keyword]);
    }
  };

  const setPriority = (aspectId: string, value: number) => {
    setPriorities({ ...priorities, [aspectId]: value });
  };

  const isStep1Valid = () => {
    // Match the validation in HeroJourneyPage:
    // vision_text must be > 50 chars AND keywords must have at least 3 items
    return visionText.trim().length > 50 && selectedKeywords.length >= 3;
  };

  const getTopPriorities = () => {
    const entries = Object.entries(priorities)
      .filter(([key]) => key !== 'custom_aspects')
      .map(([key, value]) => ({
        id: key,
        value: value as number,
        label: priorityAspects.find(a => a.id === key)?.label || key
      }))
      .sort((a, b) => b.value - a.value);

    return entries.slice(0, 3);
  };


  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const updateData = {
        vision_text: visionText.trim(),
        vision_keywords: selectedKeywords,
        vision_details: {
          size: weddingSize,
          atmosphere_formal: atmosphereFormal,
          atmosphere_traditional: atmosphereTrad,
          budget_range: budgetRange,
          season_preference: seasonPreference,
          location_type: locationType,
        },
        vision_priorities: {
          ...priorities,
          custom_aspects: customAspects,
        },
        vision_preferences: {
          must_haves: mustHaves,
          deal_breakers: dealBreakers,
        },
        vision_step_progress: stepProgress,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('weddings')
        .update(updateData)
        .eq('id', weddingId);

      if (error) throw error;

      showToast('Entwurf gespeichert!', 'info');
    } catch (error) {
      logger.error('Error saving draft', 'VisionModal', error);
      showToast('Fehler beim Speichern des Entwurfs', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalSave = async () => {
    if (!isStep1Valid()) {
      showToast('Bitte gebt eine Vision (mind. 50 Zeichen) ein und wählt mindestens 3 Keywords aus.', 'error');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        vision_text: visionText.trim(),
        vision_keywords: selectedKeywords,
        vision_details: {
          size: weddingSize,
          atmosphere_formal: atmosphereFormal,
          atmosphere_traditional: atmosphereTrad,
          budget_range: budgetRange,
          season_preference: seasonPreference,
          location_type: locationType,
        },
        vision_priorities: {
          ...priorities,
          custom_aspects: customAspects,
        },
        vision_preferences: {
          must_haves: mustHaves,
          deal_breakers: dealBreakers,
        },
        vision_step_progress: {
          step1_complete: true,
          step2_complete: Object.keys(priorities).length > 0,
          step3_complete: !!budgetRange,
        },
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('weddings')
        .update(updateData)
        .eq('id', weddingId);

      if (error) throw error;

      showToast('Vision erfolgreich gespeichert!', 'success');
      onSave();
      onClose();
    } catch (error) {
      logger.error('Error saving vision', 'VisionModal', error);
      showToast('Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="vision-step-animate">
        <label className="block text-sm font-semibold text-white mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4af37] to-[#c19a2e] flex items-center justify-center text-white text-xs font-bold">1</span>
            Eure Vision in Worten
          </span>
          <span className={`text-xs ${visionText.trim().length >= 50 ? 'text-green-400' : 'text-gray-400'}`}>
            {visionText.trim().length}/50 Zeichen
          </span>
        </label>
        <div className="relative group">
          <textarea
            value={visionText}
            onChange={(e) => setVisionText(e.target.value)}
            className="w-full bg-[#1a3a5c]/50 backdrop-blur-sm border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/30 outline-none transition-all min-h-[100px] resize-none hover:border-[#d4af37]/50"
            placeholder="z.B. Wir wünschen uns eine entspannte, naturverbundene Feier mit unseren engsten Freunden..."
          />
        </div>
      </div>

      <div className="vision-step-animate">
        <label className="block text-sm font-semibold text-white mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f4d03f] to-[#d4af37] flex items-center justify-center text-white text-xs font-bold">2</span>
            Wählt passende Keywords aus
          </span>
          <span className={`text-xs ${selectedKeywords.length >= 3 ? 'text-green-400' : 'text-gray-400'}`}>
            {selectedKeywords.length}/3 Keywords
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {suggestedKeywords.map((keyword) => {
            const isSelected = selectedKeywords.includes(keyword);
            return (
              <button
                key={keyword}
                onClick={() => toggleKeyword(keyword)}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-gray-900 shadow-md scale-105'
                    : 'bg-[#1a3a5c]/50 text-gray-300 border border-gray-600/50 hover:border-[#d4af37]/50 hover:scale-105'
                }`}
              >
                {isSelected && <CheckCircle className="w-3 h-3 inline mr-1" />}
                {keyword}
              </button>
            );
          })}
        </div>
        {!isStep1Valid() && (visionText.trim().length > 0 || selectedKeywords.length > 0) && (
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200">
              <strong>Hinweis:</strong> Für die Schritt-Vervollständigung werden mindestens 50 Zeichen Vision-Text und 3 Keywords benötigt.
            </div>
          </div>
        )}
      </div>

      <div className="vision-step-animate">
        <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center text-white text-xs font-bold">3</span>
          Hochzeitsgröße
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'intim', label: 'Intim', subtitle: '1-30', icon: Heart },
            { value: 'mittel', label: 'Mittel', subtitle: '31-80', icon: Users },
            { value: 'gross', label: 'Groß', subtitle: '81+', icon: Users },
          ].map((size) => {
            const Icon = size.icon;
            const isSelected = weddingSize === size.value;
            return (
              <button
                key={size.value}
                onClick={() => setWeddingSize(size.value as any)}
                className={`p-2 rounded-lg border transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#d4af37] to-[#f4d03f] border-[#d4af37] text-gray-900 shadow-md'
                    : 'bg-[#1a3a5c]/50 border-gray-600/50 text-gray-300 hover:border-[#d4af37]/50'
                }`}
              >
                <Icon className="w-5 h-5 mx-auto mb-0.5" />
                <div className="text-xs font-bold">{size.label}</div>
                <div className="text-[10px] opacity-80">{size.subtitle}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="vision-step-animate">
        <label className="block text-sm font-semibold text-white mb-2">
          Atmosphäre: Formell vs. Locker
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-16">Locker</span>
          <div className="flex-1 relative">
            <input
              type="range"
              min="1"
              max="5"
              value={atmosphereFormal}
              onChange={(e) => setAtmosphereFormal(Number(e.target.value))}
              className="w-full h-2 bg-[#1a3a5c] rounded-lg appearance-none cursor-pointer slider-atmosphere"
              style={{
                background: `linear-gradient(to right, #d4af37 0%, #d4af37 ${((atmosphereFormal - 1) / 4) * 100}%, #1a3a5c ${((atmosphereFormal - 1) / 4) * 100}%, #1a3a5c 100%)`
              }}
            />
          </div>
          <span className="text-xs text-gray-400 w-16 text-right">Formell</span>
        </div>
      </div>

      <div className="vision-step-animate">
        <label className="block text-sm font-semibold text-white mb-2">
          Stil: Modern vs. Traditionell
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-16">Modern</span>
          <div className="flex-1 relative">
            <input
              type="range"
              min="1"
              max="5"
              value={atmosphereTrad}
              onChange={(e) => setAtmosphereTrad(Number(e.target.value))}
              className="w-full h-2 bg-[#1a3a5c] rounded-lg appearance-none cursor-pointer slider-style"
              style={{
                background: `linear-gradient(to right, #d4af37 0%, #d4af37 ${((atmosphereTrad - 1) / 4) * 100}%, #1a3a5c ${((atmosphereTrad - 1) / 4) * 100}%, #1a3a5c 100%)`
              }}
            />
          </div>
          <span className="text-xs text-gray-400 w-16 text-right">Traditionell</span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-white mb-1">Was ist euch besonders wichtig?</h3>
        <p className="text-xs text-gray-400">Bewertet die verschiedenen Aspekte mit 1-5 Sternen</p>
      </div>

      <div className="space-y-2">
        {priorityAspects.map((aspect) => {
          const Icon = aspect.icon;
          const rating = priorities[aspect.id as keyof VisionPriorities] as number || 0;

          return (
            <div key={aspect.id} className="bg-[#1a3a5c]/50 rounded-lg p-2.5 border border-gray-600/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-1.5 rounded-lg flex-shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-white">{aspect.label}</div>
                    <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{aspect.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setPriority(aspect.id, star)}
                      className="transition-all duration-200 hover:scale-110"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= rating
                            ? 'fill-[#d4af37] text-[#d4af37]'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {getTopPriorities().length > 0 && (
        <div className="bg-gradient-to-br from-[#d4af37]/20 to-[#f4d03f]/20 border border-[#d4af37] rounded-lg p-3 mt-3">
          <h4 className="font-semibold text-sm text-white mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-[#d4af37]" />
            Eure Top 3 Prioritäten
          </h4>
          <div className="space-y-1.5">
            {getTopPriorities().map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4af37] to-[#c19a2e] flex items-center justify-center text-white text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="text-white text-sm font-medium">{item.label}</span>
                <div className="flex ml-auto gap-0.5">
                  {[...Array(item.value)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#d4af37] text-[#d4af37]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-white mb-1.5">
          Weitere wichtige Aspekte (optional)
        </label>
        <textarea
          value={customAspects}
          onChange={(e) => setCustomAspects(e.target.value)}
          className="w-full bg-[#1a3a5c]/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/30 outline-none transition-all min-h-[60px] resize-none"
          placeholder="z.B. Nachhaltigkeit, Kinderprogramm, Barrierefreiheit..."
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Budget-Rahmen
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { value: 'bis_5k', label: 'bis 5k' },
              { value: '5_10k', label: '5-10k' },
              { value: '10_20k', label: '10-20k' },
              { value: '20_30k', label: '20-30k' },
              { value: '30k_plus', label: '30k+' },
              { value: 'unklar', label: 'Unklar' },
            ].map((budget) => (
              <button
                key={budget.value}
                onClick={() => setBudgetRange(budget.value)}
                className={`p-2 rounded-lg border transition-all duration-300 text-xs font-medium ${
                  budgetRange === budget.value
                    ? 'bg-gradient-to-br from-[#d4af37] to-[#f4d03f] border-[#d4af37] text-gray-900 shadow-md'
                    : 'bg-[#1a3a5c]/50 border-gray-600/50 text-gray-300 hover:border-[#d4af37]/50'
                }`}
              >
                {budget.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Saisonale Präferenz
          </label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {[
              { value: 'fruehling', label: 'Frühling', icon: '🌸' },
              { value: 'sommer', label: 'Sommer', icon: '☀️' },
              { value: 'herbst', label: 'Herbst', icon: '🍂' },
              { value: 'winter', label: 'Winter', icon: '❄️' },
              { value: 'flexibel', label: 'Flexibel', icon: '📅' },
            ].map((season) => (
              <button
                key={season.value}
                onClick={() => setSeasonPreference(season.value)}
                className={`p-2 rounded-lg border transition-all duration-300 ${
                  seasonPreference === season.value
                    ? 'bg-gradient-to-br from-[#d4af37] to-[#f4d03f] border-[#d4af37] text-gray-900 shadow-md'
                    : 'bg-[#1a3a5c]/50 border-gray-600/50 text-gray-300 hover:border-[#d4af37]/50'
                }`}
              >
                <span className="text-xl mb-0.5 block">{season.icon}</span>
                <span className="text-xs font-medium">{season.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Wunsch-Location-Typ
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { value: 'indoor', label: 'Indoor', icon: Home },
              { value: 'outdoor', label: 'Outdoor', icon: MapPin },
              { value: 'hybrid', label: 'Hybrid', icon: Heart },
              { value: 'unklar', label: 'Unklar', icon: Lightbulb },
            ].map((loc) => {
              const Icon = loc.icon;
              return (
                <button
                  key={loc.value}
                  onClick={() => setLocationType(loc.value)}
                  className={`p-2 rounded-lg border transition-all duration-300 ${
                    locationType === loc.value
                      ? 'bg-gradient-to-br from-[#d4af37] to-[#f4d03f] border-[#d4af37] text-gray-900 shadow-md'
                      : 'bg-[#1a3a5c]/50 border-gray-600/50 text-gray-300 hover:border-[#d4af37]/50'
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-0.5" />
                  <span className="text-xs font-medium">{loc.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1.5">
            Must-Haves (optional)
          </label>
          <textarea
            value={mustHaves}
            onChange={(e) => setMustHaves(e.target.value)}
            className="w-full bg-[#1a3a5c]/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/30 outline-none transition-all min-h-[60px] resize-none"
            placeholder="z.B. Live-Band, freie Trauung, veganes Menü..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1.5">
            Deal-Breakers / No-Gos (optional)
          </label>
          <textarea
            value={dealBreakers}
            onChange={(e) => setDealBreakers(e.target.value)}
            className="w-full bg-[#1a3a5c]/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/30 outline-none transition-all min-h-[60px] resize-none"
            placeholder="z.B. kein Buffet, keine DJ, keine Outdoor-Location im Winter..."
          />
        </div>
    </div>
  );

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden transition-opacity duration-300"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, opacity: 1 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-2xl w-full shadow-2xl border border-[#F5B800]/30 transition-transform duration-500 relative max-h-[90vh] flex flex-col"
        style={{
          transform: 'scale(1)',
          maxWidth: 'min(900px, calc(100vw - 2rem))'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-[#f4d03f]/10 pointer-events-none rounded-2xl"></div>

        <div className="absolute top-0 left-0 w-64 h-64 bg-[#d4af37]/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#f4d03f]/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse pointer-events-none"></div>

        <div className="relative z-10 flex items-start gap-3 p-4 border-b border-gray-700/50 flex-shrink-0">
          <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-2.5 rounded-lg shadow-xl shadow-[#d4af37]/40">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">
              Es beginnt mit einem Traum...
            </h2>
            <p className="text-xs text-gray-400">
              Schritt {currentStep}/3 - {currentStep === 1 ? 'Traumhochzeit' : currentStep === 2 ? 'Prioritäten' : 'Rahmendaten'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all hover:rotate-90 duration-300 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar - Kompakter */}
        <div className="relative z-10 px-4 pt-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-400">Fortschritt</span>
            <span className="text-xs font-bold text-[#d4af37]">{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#0A1F3D] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Tab Navigation - Kompakter */}
        <div className="relative z-10 flex gap-1.5 px-4 pt-3 pb-2 flex-shrink-0">
          {[
            { step: 1, label: 'Traumhochzeit', icon: Sparkles },
            { step: 2, label: 'Prioritäten', icon: Star },
            { step: 3, label: 'Rahmendaten', icon: Heart },
          ].map(({ step, label, icon: Icon }) => {
            const isActive = currentStep === step;
            const isComplete = stepProgress[`step${step}_complete` as keyof StepProgress];

            return (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={`flex-1 px-3 py-2 rounded-lg font-medium text-xs transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-gray-900 shadow-md'
                    : 'bg-transparent text-gray-300 hover:bg-gray-700/30'
                }`}
              >
                {isComplete ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{step}</span>
              </button>
            );
          })}
        </div>

        {/* Content - Optimierte Höhe */}
        <div className="relative z-10 p-4 flex-1 overflow-y-auto custom-scrollbar">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Footer - Kompakter */}
        <div className="relative z-10 flex justify-between gap-2 p-4 border-t border-gray-700/50 bg-[#0A1F3D]/50 flex-shrink-0">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 rounded-lg text-sm text-gray-300 border border-gray-600/50 hover:bg-gray-700/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Zurück
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm text-white border border-[#d4af37]/50 hover:bg-[#d4af37]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Entwurf
            </button>

            {currentStep < 3 ? (
              <button
                onClick={() => {
                  if (currentStep === 1 && !isStep1Valid()) {
                    showToast('Bitte gebt eine Vision (mind. 50 Zeichen) ein und wählt mindestens 3 Keywords aus.', 'error');
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}
                className="px-5 py-2 rounded-lg text-sm bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#c19a2e] hover:to-[#d4af37] text-gray-900 font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
              >
                Weiter
              </button>
            ) : (
              <button
                onClick={handleFinalSave}
                disabled={saving || !isStep1Valid()}
                className="px-5 py-2 rounded-lg text-sm bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#c19a2e] hover:to-[#d4af37] text-gray-900 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Speichern...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Vision speichern</span>
                    <span className="sm:hidden">Fertig</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <style>{`
          .vision-step-animate {
            opacity: 1;
            animation: fadeInUp 0.5s ease-out;
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(26, 58, 92, 0.3);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #c19a2e 0%, #d4af37 100%);
          }

          .slider-atmosphere::-webkit-slider-thumb,
          .slider-style::-webkit-slider-thumb {
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
            cursor: pointer;
            box-shadow: 0 3px 12px rgba(212, 175, 55, 0.6);
            border: 3px solid white;
            margin-top: -10px;
          }

          .slider-atmosphere::-moz-range-thumb,
          .slider-style::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 3px 12px rgba(212, 175, 55, 0.6);
          }

          .slider-atmosphere::-webkit-slider-runnable-track,
          .slider-style::-webkit-slider-runnable-track {
            height: 8px;
            border-radius: 4px;
          }

          .slider-atmosphere::-moz-range-track,
          .slider-style::-moz-range-track {
            height: 8px;
            border-radius: 4px;
          }

          .slider-atmosphere:hover::-webkit-slider-thumb,
          .slider-style:hover::-webkit-slider-thumb {
            box-shadow: 0 4px 16px rgba(212, 175, 55, 0.8);
            transform: scale(1.1);
          }

          .slider-atmosphere:active::-webkit-slider-thumb,
          .slider-style:active::-webkit-slider-thumb {
            transform: scale(0.95);
          }
        `}</style>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
