import { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface NotesTabProps {
  eventId: string;
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export default function NotesTab({ eventId, onUnsavedChanges }: NotesTabProps) {
  const [notes, setNotes] = useState('');
  const [originalNotes, setOriginalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [eventId]);

  useEffect(() => {
    onUnsavedChanges(notes !== originalNotes);
  }, [notes, originalNotes]);

  const loadNotes = async () => {
    const { data } = await supabase
      .from('wedding_day_blocks')
      .select('notes')
      .eq('id', eventId)
      .single();

    if (data) {
      setNotes(data.notes || '');
      setOriginalNotes(data.notes || '');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('wedding_day_blocks')
      .update({ notes: notes })
      .eq('id', eventId);

    setOriginalNotes(notes);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Event-Notizen</h3>
          <p className="text-sm text-gray-600 mt-1">
            Wichtige Informationen und Anweisungen für dieses Event
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={notes === originalNotes || saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Speichert...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              Gespeichert
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Speichern
            </>
          )}
        </button>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Hier können Sie wichtige Notizen zu diesem Event eintragen:&#10;&#10;• Allgemeine Hinweise&#10;• Besondere Anweisungen&#10;• Kontaktpersonen für dieses Event&#10;• Notfallplan (Was tun bei Verspätungen, Wetterproblemen, etc.)&#10;• Wichtige Telefonnummern&#10;• Zeitliche Abhängigkeiten&#10;• Besonderheiten zu beachten"
          rows={20}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
      </div>

      {notes !== originalNotes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          Sie haben ungespeicherte Änderungen. Vergessen Sie nicht zu speichern!
        </div>
      )}
    </div>
  );
}
