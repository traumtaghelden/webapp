import { useState } from 'react';
import { X, Save, Eye, EyeOff } from 'lucide-react';
import type { TaskListPreferences } from './TaskListViewEnhanced';

interface TaskListColumnConfigProps {
  preferences: TaskListPreferences;
  onSave: (preferences: Partial<TaskListPreferences>) => void;
  onClose: () => void;
}

interface ColumnDefinition {
  key: string;
  label: string;
  description: string;
  required?: boolean;
}

const availableColumns: ColumnDefinition[] = [
  { key: 'checkbox', label: 'Auswahl-Checkbox', description: 'Für Mehrfachauswahl', required: true },
  { key: 'quick_complete', label: 'Schnell-Erledigen', description: 'Schneller Status-Wechsel', required: true },
  { key: 'title', label: 'Aufgabe', description: 'Titel und Beschreibung', required: true },
  { key: 'category', label: 'Kategorie', description: 'Aufgabenkategorie' },
  { key: 'priority', label: 'Priorität', description: 'Wichtigkeit der Aufgabe' },
  { key: 'due_date', label: 'Fälligkeitsdatum', description: 'Wann die Aufgabe fällig ist' },
  { key: 'assigned_to', label: 'Zugewiesen', description: 'Verantwortliche Person' },
  { key: 'status', label: 'Status', description: 'Bearbeitungsstatus' },
  { key: 'progress', label: 'Fortschritt', description: 'Unteraufgaben-Fortschritt' },
  { key: 'links', label: 'Verknüpfungen', description: 'Budget, Dienstleister, Timeline' },
  { key: 'comments', label: 'Kommentare', description: 'Anzahl der Kommentare' },
  { key: 'created_at', label: 'Erstellt am', description: 'Erstellungsdatum' },
  { key: 'actions', label: 'Aktionen', description: 'Bearbeiten und Löschen', required: true },
];

export default function TaskListColumnConfig({
  preferences,
  onSave,
  onClose,
}: TaskListColumnConfigProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(preferences.visibleColumns);
  const [compactMode, setCompactMode] = useState(preferences.compactMode);

  const handleToggleColumn = (columnKey: string) => {
    const column = availableColumns.find(col => col.key === columnKey);
    if (column?.required) return;

    if (visibleColumns.includes(columnKey)) {
      setVisibleColumns(visibleColumns.filter(key => key !== columnKey));
    } else {
      setVisibleColumns([...visibleColumns, columnKey]);
    }
  };

  const handleSave = () => {
    onSave({
      visibleColumns,
      compactMode,
    });
  };

  const handleReset = () => {
    setVisibleColumns(['checkbox', 'title', 'category', 'priority', 'due_date', 'assigned_to', 'status', 'actions']);
    setCompactMode(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#0a253c]">Spalten konfigurieren</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-[#0a253c] mb-2">Anzeigemodus</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
                className="w-5 h-5 text-[#d4af37] border-gray-300 rounded focus:ring-[#d4af37]"
              />
              <div>
                <p className="font-medium text-[#0a253c]">Kompakte Ansicht</p>
                <p className="text-sm text-gray-600">Mehr Aufgaben auf einen Blick</p>
              </div>
            </label>
          </div>

          <div>
            <h3 className="font-semibold text-[#0a253c] mb-4">Sichtbare Spalten</h3>
            <div className="space-y-2">
              {availableColumns.map((column) => {
                const isVisible = visibleColumns.includes(column.key);
                const isRequired = column.required;

                return (
                  <div
                    key={column.key}
                    className={`
                      border-2 rounded-xl p-4 transition-all
                      ${isVisible ? 'border-[#d4af37] bg-[#d4af37]/5' : 'border-gray-200 bg-white'}
                      ${isRequired ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-[#d4af37]/50'}
                    `}
                    onClick={() => !isRequired && handleToggleColumn(column.key)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {isVisible ? (
                          <Eye className="w-5 h-5 text-[#d4af37]" />
                        ) : (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#0a253c]">{column.label}</p>
                          {isRequired && (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                              Erforderlich
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{column.description}</p>
                      </div>
                      {!isRequired && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleColumn(column.key);
                            }}
                            className="w-5 h-5 text-[#d4af37] border-gray-300 rounded focus:ring-[#d4af37]"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-gray-700">
              <strong>Tipp:</strong> Wähle nur die Spalten aus, die du regelmäßig benötigst. Weniger Spalten bedeuten
              eine übersichtlichere Tabelle und schnellere Bearbeitung.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-xl font-semibold hover:scale-[1.02] active:scale-95 transition-all min-h-[40px]"
          >
            Zurücksetzen
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-xl font-semibold hover:scale-[1.02] active:scale-95 transition-all min-h-[40px]"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all min-h-[40px]"
            >
              <Save className="w-4 h-4" />
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
