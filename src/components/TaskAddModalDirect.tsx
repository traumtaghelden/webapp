import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, CheckSquare, Calendar, Flag, FolderOpen, AlignLeft, User, Clock,
  MapPin, Utensils, Palette, Camera, Music, Mail, Shirt, Flower2,
  Car, Home, FileText, ChevronDown, ChevronUp, DollarSign, Users,
  Building2, AlertCircle, Plus, Copy, Save, Check, Zap, Sparkles
} from 'lucide-react';

interface TaskAddModalDirectProps {
  isOpen: boolean;
  weddingId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  task_count?: number;
}

interface BudgetItem {
  id: string;
  title: string;
  estimated_cost: number;
  actual_cost: number;
  payment_status: string;
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  contact_email: string;
  status: string;
}

interface TimelineEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  duration_minutes: number;
}

const CATEGORY_CONFIG = {
  general: { icon: FolderOpen, label: 'Allgemein', color: '#6b7280' },
  venue: { icon: MapPin, label: 'Location', color: '#3b82f6' },
  catering: { icon: Utensils, label: 'Catering', color: '#f59e0b' },
  decoration: { icon: Palette, label: 'Dekoration', color: '#ec4899' },
  photography: { icon: Camera, label: 'Fotografie', color: '#8b5cf6' },
  music: { icon: Music, label: 'Musik', color: '#10b981' },
  invitations: { icon: Mail, label: 'Einladungen', color: '#06b6d4' },
  attire: { icon: Shirt, label: 'Kleidung', color: '#f43f5e' },
  flowers: { icon: Flower2, label: 'Blumen', color: '#84cc16' },
  transportation: { icon: Car, label: 'Transport', color: '#14b8a6' },
  accommodation: { icon: Home, label: 'Unterkunft', color: '#6366f1' },
  legal: { icon: FileText, label: 'Rechtliches', color: '#ef4444' }
};

const PRIORITY_CONFIG = {
  low: { label: 'Niedrig', color: 'bg-green-500', textColor: 'text-green-400' },
  medium: { label: 'Mittel', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  high: { label: 'Hoch', color: 'bg-orange-500', textColor: 'text-orange-400' },
  urgent: { label: 'Dringend', color: 'bg-red-500', textColor: 'text-red-400' }
};

export default function TaskAddModalDirect({ isOpen, weddingId, onClose, onSuccess }: TaskAddModalDirectProps) {
  // Basic fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  // Date & Time
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');

  // Assignment
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Budget & Vendor
  const [selectedBudgetItem, setSelectedBudgetItem] = useState('');
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Timeline
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState('');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCategorySection, setShowCategorySection] = useState(true);
  const [showDateSection, setShowDateSection] = useState(false);
  const [showTeamSection, setShowTeamSection] = useState(false);
  const [showBudgetSection, setShowBudgetSection] = useState(false);
  const [showVendorSection, setShowVendorSection] = useState(false);
  const [showTimelineSection, setShowTimelineSection] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  // Load data
  useEffect(() => {
    if (isOpen) {
      loadTeamMembers();
      loadBudgetItems();
      loadVendors();
      loadTimelineEvents();
      loadDraft();
      // Lock body scroll when modal opens
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when modal closes
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Track changes
  useEffect(() => {
    if (isOpen && (title || description)) {
      setHasUnsavedChanges(true);
      saveDraft();
    }
  }, [title, description, category, priority, dueDate, selectedTeamMembers, selectedVendor]);

  useEffect(() => {
    setCharacterCount(description.length);
  }, [description]);

  const loadTeamMembers = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('wedding_team_roles')
        .select('id, name, role')
        .eq('wedding_id', weddingId)
        .order('name');

      if (error) throw error;
      if (data) setTeamMembers(data);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadBudgetItems = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('budget_items')
        .select('id, item_name, estimated_cost, actual_cost, payment_status')
        .eq('wedding_id', weddingId)
        .order('item_name');

      if (error) {
        console.error('Error loading budget items:', error);
        return;
      }
      if (data) setBudgetItems(data);
    } catch (error) {
      console.error('Error loading budget items:', error);
    }
  };

  const loadVendors = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, category, email, contract_status')
        .eq('wedding_id', weddingId)
        .order('name');

      if (error) {
        console.error('Error loading vendors:', error);
        return;
      }
      if (data) setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const loadTimelineEvents = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('wedding_day_blocks')
        .select('id, title, start_time, duration_minutes')
        .eq('wedding_id', weddingId)
        .order('start_time');

      if (error) {
        console.error('Error loading timeline events:', error);
        return;
      }
      if (data) setTimelineEvents(data);
    } catch (error) {
      console.error('Error loading timeline events:', error);
    }
  };

  const saveDraft = useCallback(() => {
    const draft = {
      title,
      description,
      category,
      priority,
      dueDate,
      dueTime,
      selectedTeamMembers,
      selectedBudgetItem,
      selectedVendor,
      selectedTimelineEvent,
      timestamp: Date.now()
    };
    localStorage.setItem(`task_draft_${weddingId}`, JSON.stringify(draft));
  }, [title, description, category, priority, dueDate, dueTime, selectedTeamMembers, selectedBudgetItem, selectedVendor, selectedTimelineEvent, weddingId]);

  const loadDraft = () => {
    const draftStr = localStorage.getItem(`task_draft_${weddingId}`);
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        const ageMinutes = (Date.now() - draft.timestamp) / 1000 / 60;
        if (ageMinutes < 60) {
          if (confirm('Es gibt einen nicht gespeicherten Entwurf. Möchten Sie ihn wiederherstellen?')) {
            setTitle(draft.title || '');
            setDescription(draft.description || '');
            setCategory(draft.category || 'general');
            setPriority(draft.priority || 'medium');
            setDueDate(draft.dueDate || '');
            setDueTime(draft.dueTime || '');
            setSelectedTeamMembers(draft.selectedTeamMembers || []);
            setSelectedBudgetItem(draft.selectedBudgetItem || '');
            setSelectedVendor(draft.selectedVendor || '');
            setSelectedTimelineEvent(draft.selectedTimelineEvent || '');
          }
        }
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(`task_draft_${weddingId}`);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('general');
    setPriority('medium');
    setDueDate('');
    setDueTime('');
    setSelectedTeamMembers([]);
    setSelectedBudgetItem('');
    setSelectedVendor('');
    setSelectedTimelineEvent('');
    setValidationErrors([]);
    setHasUnsavedChanges(false);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!title.trim()) {
      errors.push('Titel ist erforderlich');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, createAnother = false) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { supabase } = await import('../lib/supabase');

      const taskData: any = {
        wedding_id: weddingId,
        title: title.trim(),
        status: 'pending',
        category: category,
        priority: priority,
        color: CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.color || '#d4af37',
      };

      // Add notes field if description is provided (tasks table uses 'notes' not 'description')
      if (description.trim()) {
        taskData.notes = description.trim();
      }

      if (dueDate) {
        if (dueTime) {
          taskData.due_date = `${dueDate}T${dueTime}`;
        } else {
          taskData.due_date = dueDate;
        }
      }

      if (selectedTeamMembers.length > 0) {
        taskData.assigned_to = selectedTeamMembers[0];
      }

      if (selectedVendor) {
        taskData.vendor_id = selectedVendor;
      }

      const { error } = await supabase.from('tasks').insert([taskData]);

      if (error) throw error;

      clearDraft();
      onSuccess();

      if (createAnother) {
        resetForm();
      } else {
        onClose();
      }
    } catch (error: any) {
      console.error('Error creating task:', error);
      const errorMsg = error?.message || 'Unbekannter Fehler';
      alert(`Fehler beim Erstellen der Aufgabe: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('Sie haben ungespeicherte Änderungen. Möchten Sie wirklich schließen?')) {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const setQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setDueDate(date.toISOString().split('T')[0]);
  };

  const toggleTeamMember = (memberId: string) => {
    setSelectedTeamMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectedBudgetDetails = budgetItems.find(item => item.id === selectedBudgetItem);
  const selectedVendorDetails = vendors.find(v => v.id === selectedVendor);
  const selectedTimelineDetails = timelineEvents.find(e => e.id === selectedTimelineEvent);

  if (!isOpen) return null;

  const CategoryIcon = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.icon || FolderOpen;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999]"
      onClick={handleBackdropClick}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="bg-[#0a253c] rounded-2xl md:rounded-2xl rounded-t-2xl shadow-2xl border-2 border-[#d4af37]/30 w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] h-full md:h-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-6 flex items-start justify-between border-b border-white/10 flex-shrink-0">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="bg-[#d4af37] w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-6 h-6 md:w-7 md:h-7 text-black" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">Neue Aufgabe</h2>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                {title ? `${Math.round((title.length / 50) * 100)}% ausgefüllt` : 'Erstellen Sie eine neue Aufgabe'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-300 transition-colors -mt-1"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Bitte beheben Sie folgende Fehler:</p>
                <ul className="mt-1 space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx} className="text-sm text-red-300">• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Basic Information Section */}
            <div className="bg-[#0a1929]/50 rounded-xl p-4 md:p-5 border border-white/5">
              <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-[#d4af37]" />
                Grundinformationen
              </h3>

              {/* Titel */}
              <div className="mb-3 md:mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Titel* <span className="text-gray-400 font-normal text-xs md:text-sm">(erforderlich)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg bg-[#0a1929] border border-gray-700 text-white placeholder-gray-500 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all"
                  placeholder="z.B. Location besichtigen, Blumen bestellen..."
                  autoFocus
                  required
                />
              </div>

              {/* Category Quick Select Chips - Collapsible */}
              <div className="mb-3 md:mb-4">
                <button
                  type="button"
                  onClick={() => setShowCategorySection(!showCategorySection)}
                  className="w-full flex items-center justify-between text-sm font-medium text-white mb-2 md:mb-3 hover:text-[#d4af37] transition-colors"
                >
                  <span>Kategorie</span>
                  {showCategorySection ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {showCategorySection && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 md:gap-2">
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = category === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCategory(key)}
                        className={`p-2 md:p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-[#d4af37] border-[#d4af37] text-black'
                            : 'bg-[#0a1929] border-gray-700 text-white hover:border-[#d4af37]/50'
                        }`}
                      >
                        <Icon className="w-4 h-4 md:w-5 md:h-5 mx-auto mb-0.5 md:mb-1" />
                        <span className="text-[10px] md:text-xs font-medium block truncate">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
                )}
              </div>

              {/* Priority with Visual Indicators */}
              <div className="mb-3 md:mb-4">
                <label className="block text-sm font-medium text-white mb-2 md:mb-3">
                  Priorität
                </label>
                <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => {
                    const isSelected = priority === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPriority(key as any)}
                        className={`p-2 md:p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-[#d4af37] border-[#d4af37] text-black'
                            : 'bg-[#0a1929] border-gray-700 text-white hover:border-[#d4af37]/50'
                        }`}
                      >
                        <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${config.color} mx-auto mb-0.5 md:mb-1`} />
                        <span className="text-[10px] md:text-xs font-medium block">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-white mb-2">
                  <span className="flex items-center gap-2">
                    <AlignLeft className="w-4 h-4" />
                    Beschreibung
                  </span>
                  <span className="text-xs text-gray-400">{characterCount}</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg bg-[#0a1929] border border-gray-700 text-white placeholder-gray-500 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all min-h-[100px] md:min-h-[120px] resize-y"
                  placeholder="Beschreibung, Notizen, Details..."
                />
              </div>
            </div>

            {/* Date & Time Section - Collapsible */}
            <div className="bg-[#0a1929]/50 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setShowDateSection(!showDateSection)}
                className="w-full p-4 md:p-5 flex items-center justify-between text-left"
              >
                <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-[#d4af37]" />
                  Zeitplanung
                </h3>
                {showDateSection ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {showDateSection && (
              <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-3 md:space-y-4 border-t border-white/5 pt-4">
              {/* Quick Date Buttons */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Schnellauswahl
                </label>
                <div className="grid grid-cols-2 md:flex md:flex-wrap gap-1.5 md:gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickDate(1)}
                    className="px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-lg bg-[#0a1929] border border-gray-700 text-white hover:border-[#d4af37] transition-all"
                  >
                    Morgen
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(7)}
                    className="px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-lg bg-[#0a1929] border border-gray-700 text-white hover:border-[#d4af37] transition-all"
                  >
                    1 Woche
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(14)}
                    className="px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-lg bg-[#0a1929] border border-gray-700 text-white hover:border-[#d4af37] transition-all"
                  >
                    2 Wochen
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(30)}
                    className="px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-lg bg-[#0a1929] border border-gray-700 text-white hover:border-[#d4af37] transition-all"
                  >
                    1 Monat
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Fälligkeitsdatum
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 md:px-4 py-2.5 text-sm md:text-base rounded-lg bg-[#0a1929] border border-gray-700 text-white focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                    <Clock className="w-4 h-4" />
                    Uhrzeit
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-3 md:px-4 py-2.5 text-sm md:text-base rounded-lg bg-[#0a1929] border border-gray-700 text-white focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all"
                  />
                </div>
              </div>
              </div>
              )}
            </div>

            {/* Team Assignment Section - Collapsible */}
            <div className="bg-[#0a1929]/50 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setShowTeamSection(!showTeamSection)}
                className="w-full p-4 md:p-5 flex items-center justify-between text-left"
              >
                <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-[#d4af37]" />
                  Team-Zuweisung
                </h3>
                {showTeamSection ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {showTeamSection && (
              <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-white/5 pt-4">
              {teamMembers.length > 0 ? (
                <div className="space-y-2">
                  {teamMembers.map(member => (
                    <label
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTeamMembers.includes(member.id)
                          ? 'bg-[#d4af37]/10 border-[#d4af37]'
                          : 'bg-[#0a1929] border-gray-700 hover:border-[#d4af37]/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeamMembers.includes(member.id)}
                        onChange={() => toggleTeamMember(member.id)}
                        className="w-4 h-4 rounded border-gray-700 text-[#d4af37] focus:ring-[#d4af37]"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium">{member.name}</p>
                        <p className="text-sm text-gray-400">{member.role}</p>
                      </div>
                      {selectedTeamMembers.includes(member.id) && (
                        <Check className="w-5 h-5 text-[#d4af37]" />
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Keine Team-Mitglieder gefunden</p>
              )}
              </div>
              )}
            </div>

            {/* Budget Section - Collapsible */}
            {budgetItems.length > 0 && (
              <div className="bg-[#0a1929]/50 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setShowBudgetSection(!showBudgetSection)}
                  className="w-full p-5 flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#d4af37]" />
                    Budget & Kosten
                  </h3>
                  {showBudgetSection ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {showBudgetSection && (
                  <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Verknüpfter Budget-Posten
                      </label>
                      <select
                        value={selectedBudgetItem}
                        onChange={(e) => setSelectedBudgetItem(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-[#0a1929] border border-gray-700 text-white focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all"
                      >
                        <option value="">Keinen Budget-Posten auswählen</option>
                        {budgetItems.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.item_name} - €{item.estimated_cost?.toFixed(2) || '0.00'} ({item.payment_status})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedBudgetDetails && (
                      <div className="p-3 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg">
                        <p className="text-sm text-white font-medium mb-1">Budget-Details</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Geschätzt:</span>
                            <span className="text-white ml-1">€{selectedBudgetDetails.estimated_cost?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Aktuell:</span>
                            <span className="text-white ml-1">€{selectedBudgetDetails.actual_cost?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-400">Status:</span>
                            <span className="text-white ml-1">{selectedBudgetDetails.payment_status}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Vendor Section - Collapsible */}
            {vendors.length > 0 && (
              <div className="bg-[#0a1929]/50 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setShowVendorSection(!showVendorSection)}
                className="w-full p-5 flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#d4af37]" />
                  Dienstleister
                </h3>
                {showVendorSection ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {showVendorSection && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Verknüpfter Dienstleister
                    </label>
                    <select
                      value={selectedVendor}
                      onChange={(e) => setSelectedVendor(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-[#0a1929] border border-gray-700 text-white focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all"
                    >
                      <option value="">Keinen Dienstleister auswählen</option>
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name} - {vendor.category} ({vendor.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedVendorDetails && (
                    <div className="mt-3 p-3 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg">
                      <p className="text-sm text-white font-medium mb-1">Dienstleister-Info</p>
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="text-gray-400">Kategorie:</span>
                          <span className="text-white ml-1">{selectedVendorDetails.category}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">E-Mail:</span>
                          <span className="text-white ml-1">{selectedVendorDetails.contact_email}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Status:</span>
                          <span className="text-white ml-1">{selectedVendorDetails.status}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
            )}

            {/* Timeline Section - Collapsible */}
            {timelineEvents.length > 0 && (
              <div className="bg-[#0a1929]/50 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setShowTimelineSection(!showTimelineSection)}
                className="w-full p-5 flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#d4af37]" />
                  Zeitplan-Event
                </h3>
                {showTimelineSection ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {showTimelineSection && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Verknüpftes Timeline-Event
                    </label>
                    <select
                      value={selectedTimelineEvent}
                      onChange={(e) => setSelectedTimelineEvent(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-[#0a1929] border border-gray-700 text-white focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all"
                    >
                      <option value="">Kein Event auswählen</option>
                      {timelineEvents.map(event => (
                        <option key={event.id} value={event.id}>
                          {event.title} - {event.start_time || 'Keine Zeit'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTimelineDetails && (
                    <div className="mt-3 p-3 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg">
                      <p className="text-sm text-white font-medium mb-1">Event-Details</p>
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="text-gray-400">Datum:</span>
                          <span className="text-white ml-1">
                            {new Date(selectedTimelineDetails.event_date).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Uhrzeit:</span>
                          <span className="text-white ml-1">{selectedTimelineDetails.event_time || 'Nicht angegeben'}</span>
                        </div>
                        {selectedTimelineDetails.duration_minutes > 0 && (
                          <div>
                            <span className="text-gray-400">Dauer:</span>
                            <span className="text-white ml-1">{selectedTimelineDetails.duration_minutes} Minuten</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
            )}

          </div>
        </form>

        {/* Footer - Fixed */}
        <div className="p-3 md:p-6 border-t border-white/10 flex-shrink-0 bg-[#0a253c]">
          <div className="flex flex-col gap-2 md:gap-3">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 justify-center md:justify-start">
                <AlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">Ungespeicherte Änderungen</span>
                <span className="md:hidden">Nicht gespeichert</span>
              </div>
            )}

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 md:justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full md:w-auto px-4 md:px-6 py-2.5 text-sm md:text-base rounded-lg border border-gray-700 text-white hover:bg-white/5 transition-all disabled:opacity-50 order-3 md:order-1"
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={!title.trim() || isSubmitting}
                className="w-full md:w-auto px-4 md:px-6 py-2.5 text-sm md:text-base rounded-lg border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2 order-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Weitere erstellen</span>
                <span className="md:hidden">+ Weitere</span>
              </button>

              <button
                type="submit"
                onClick={(e) => handleSubmit(e, false)}
                disabled={!title.trim() || isSubmitting}
                className="w-full md:w-auto px-4 md:px-6 py-2.5 text-sm md:text-base rounded-lg bg-[#d4af37] text-black font-medium hover:bg-[#c19a2e] transition-all disabled:opacity-50 flex items-center justify-center gap-2 order-1 md:order-3"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Erstellt...' : 'Erstellen'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
