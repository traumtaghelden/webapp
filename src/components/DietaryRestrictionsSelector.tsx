import { useState } from 'react';
import { X, Plus, ChevronDown, ChevronRight } from 'lucide-react';

interface DietaryRestrictionsSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const PREDEFINED_OPTIONS = [
  // Allergien
  { category: 'Allergien', label: 'Nussallergie', value: 'Nussallergie' },
  { category: 'Allergien', label: 'Laktoseintoleranz', value: 'Laktoseintoleranz' },
  { category: 'Allergien', label: 'Glutenunverträglichkeit', value: 'Glutenunverträglichkeit' },
  { category: 'Allergien', label: 'Fruktoseintoleranz', value: 'Fruktoseintoleranz' },
  { category: 'Allergien', label: 'Fischallergie', value: 'Fischallergie' },
  { category: 'Allergien', label: 'Schalentierallergie', value: 'Schalentierallergie' },
  { category: 'Allergien', label: 'Eierallergie', value: 'Eierallergie' },
  { category: 'Allergien', label: 'Sojaalllergie', value: 'Sojaalllergie' },

  // Diät
  { category: 'Diät', label: 'Vegetarisch', value: 'Vegetarisch' },
  { category: 'Diät', label: 'Vegan', value: 'Vegan' },
  { category: 'Diät', label: 'Pescetarisch', value: 'Pescetarisch' },
  { category: 'Diät', label: 'Halal', value: 'Halal' },
  { category: 'Diät', label: 'Kosher', value: 'Kosher' },
  { category: 'Diät', label: 'Kein Schweinefleisch', value: 'Kein Schweinefleisch' },
  { category: 'Diät', label: 'Kein Rindfleisch', value: 'Kein Rindfleisch' },
  { category: 'Diät', label: 'Low Carb', value: 'Low Carb' },

  // Besondere Bedürfnisse
  { category: 'Besondere Bedürfnisse', label: 'Diabetiker', value: 'Diabetiker' },
  { category: 'Besondere Bedürfnisse', label: 'Babynahrung erforderlich', value: 'Babynahrung erforderlich' },
  { category: 'Besondere Bedürfnisse', label: 'Kein Alkohol', value: 'Kein Alkohol' },
  { category: 'Besondere Bedürfnisse', label: 'Rollstuhlgerecht', value: 'Rollstuhlgerecht' },
  { category: 'Besondere Bedürfnisse', label: 'Sitzplatz-Anforderung', value: 'Sitzplatz-Anforderung' },
];

export default function DietaryRestrictionsSelector({ value, onChange }: DietaryRestrictionsSelectorProps) {
  const [customInputs, setCustomInputs] = useState<Record<string, { show: boolean; value: string }>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Parse current value into array
  const selectedItems = value ? value.split(',').map(v => v.trim()).filter(v => v) : [];

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleOption = (optionValue: string) => {
    if (selectedItems.includes(optionValue)) {
      // Remove
      const updated = selectedItems.filter(v => v !== optionValue);
      onChange(updated.join(', '));
    } else {
      // Add
      onChange([...selectedItems, optionValue].join(', '));
    }
  };

  const removeItem = (item: string) => {
    const updated = selectedItems.filter(v => v !== item);
    onChange(updated.join(', '));
  };

  const showCustomInput = (category: string) => {
    setCustomInputs({
      ...customInputs,
      [category]: { show: true, value: '' }
    });
  };

  const hideCustomInput = (category: string) => {
    const updated = { ...customInputs };
    delete updated[category];
    setCustomInputs(updated);
  };

  const updateCustomValue = (category: string, newValue: string) => {
    setCustomInputs({
      ...customInputs,
      [category]: { show: true, value: newValue }
    });
  };

  const addCustomItem = (category: string) => {
    const customValue = customInputs[category]?.value;
    if (customValue && customValue.trim()) {
      onChange([...selectedItems, customValue.trim()].join(', '));
      hideCustomInput(category);
    }
  };

  const groupedOptions = PREDEFINED_OPTIONS.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, typeof PREDEFINED_OPTIONS>);

  const getSelectedCountForCategory = (category: string) => {
    const categoryOptions = groupedOptions[category]?.map(opt => opt.value) || [];
    return selectedItems.filter(item => categoryOptions.includes(item)).length;
  };

  return (
    <div className="space-y-4">
      {/* Compact selected items display */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item, index) => (
            <span
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-full text-sm font-semibold shadow-gold"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Collapsible categories */}
      <div className="space-y-3">
        {Object.entries(groupedOptions).map(([category, options]) => {
          const isExpanded = expandedCategories.has(category);
          const selectedCount = getSelectedCountForCategory(category);

          return (
            <div key={category} className="bg-white/10 border-2 border-[#d4af37]/30 rounded-xl backdrop-blur-sm overflow-hidden">
              {/* Category header button */}
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white/90">{category}</span>
                  {selectedCount > 0 && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-full text-xs font-bold">
                      {selectedCount}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-[#d4af37]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[#d4af37]" />
                )}
              </button>

              {/* Category content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Option buttons */}
                  <div className="flex flex-wrap gap-2">
                    {options.map((option) => {
                      const isSelected = selectedItems.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleOption(option.value)}
                          className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] shadow-gold scale-105'
                              : 'bg-white/5 border-2 border-[#d4af37]/30 text-white/90 hover:border-[#d4af37] hover:bg-white/10'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom input per category */}
                  <div className="pt-3 border-t border-[#d4af37]/20">
                    {customInputs[category]?.show ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customInputs[category]?.value || ''}
                          onChange={(e) => updateCustomValue(category, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomItem(category);
                            }
                          }}
                          placeholder={`Eigene ${category} eingeben...`}
                          className="flex-1 px-4 py-2 border-2 border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 rounded-xl focus:border-[#d4af37] focus:outline-none backdrop-blur-sm text-sm"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => addCustomItem(category)}
                          className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-xl font-semibold hover:opacity-90 transition-all text-sm shadow-gold"
                        >
                          Hinzufügen
                        </button>
                        <button
                          type="button"
                          onClick={() => hideCustomInput(category)}
                          className="px-4 py-2 border-2 border-white/30 text-white/90 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm"
                        >
                          Abbrechen
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => showCustomInput(category)}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-[#d4af37]/30 text-[#d4af37] rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm w-full justify-center"
                      >
                        <Plus className="w-4 h-4" />
                        Eigene {category} hinzufügen
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
