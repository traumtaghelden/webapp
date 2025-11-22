import { CheckCircle, Clock, Circle, Trash2, X } from 'lucide-react';

interface TaskListBulkActionsProps {
  selectedCount: number;
  onStatusChange: (status: 'pending' | 'in_progress' | 'completed') => void;
  onDelete: () => void;
  onClear: () => void;
}

export default function TaskListBulkActions({
  selectedCount,
  onStatusChange,
  onDelete,
  onClear,
}: TaskListBulkActionsProps) {
  return (
    <div className="bg-[#d4af37] text-white rounded-2xl shadow-lg p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full px-4 py-2">
            <span className="font-bold">{selectedCount} ausgewählt</span>
          </div>
          <button
            onClick={onClear}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Auswahl aufheben"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-sm font-semibold mr-2">Status ändern:</span>
          <button
            onClick={() => onStatusChange('pending')}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            <Circle className="w-4 h-4" />
            <span>Offen</span>
          </button>
          <button
            onClick={() => onStatusChange('in_progress')}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span>In Bearbeitung</span>
          </button>
          <button
            onClick={() => onStatusChange('completed')}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Erledigt</span>
          </button>
          <div className="w-px h-8 bg-white/20 mx-2" />
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Löschen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
