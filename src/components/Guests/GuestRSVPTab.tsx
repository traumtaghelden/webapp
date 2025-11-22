import { useState } from 'react';
import { CheckCircle, XCircle, Clock, TrendingUp, HelpCircle, GripVertical, User } from 'lucide-react';
import { supabase, type Guest } from '../../lib/supabase';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '../../contexts/ToastContext';

interface GuestRSVPTabProps {
  guests: Guest[];
  onUpdate: () => void;
}

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
}

function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[300px] transition-colors rounded-xl ${
        isOver ? 'bg-[#d4af37]/10 ring-2 ring-[#d4af37]' : ''
      }`}
    >
      {children}
    </div>
  );
}

interface SortableGuestCardProps {
  guest: Guest;
  isDragging: boolean;
  activeId: string | null;
  columnColor: string;
  columnBgColor: string;
}

function SortableGuestCard({ guest, isDragging, activeId, columnColor, columnBgColor }: SortableGuestCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: guest.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`relative p-3 mb-3 rounded-lg ${columnBgColor} hover:bg-opacity-80 transition-all group shadow-sm hover:shadow-md ${
        isDragging && activeId === guest.id ? 'opacity-50 scale-95' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-1 hover:text-[#d4af37] transition-all group-hover:scale-125 duration-200 touch-none"
          title="⬍⬍ Ziehen zum Verschieben ⬍⬍"
        >
          <GripVertical className={`w-5 h-5 ${columnColor} group-hover:text-[#d4af37] transition-colors`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#0a253c] truncate">{guest.name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {guest.plus_one && (
              <span className={`text-xs ${columnColor} font-semibold`}>Mit Begleitung</span>
            )}
            <span className="text-xs text-[#666666]">
              {guest.age_group === 'adult' ? 'Erwachsener' : guest.age_group === 'child' ? 'Kind' : 'Kleinkind'}
            </span>
          </div>
          {(guest.rsvp_status === 'invited' || guest.rsvp_status === 'planned') && (
            <span className={`text-xs px-2 py-0.5 rounded inline-block mt-1 ${
              guest.rsvp_status === 'invited'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {guest.rsvp_status === 'invited' ? 'Eingeladen' : 'Geplant'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GuestRSVPTab({ guests, onUpdate }: GuestRSVPTabProps) {
  const { showToast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Korrigierte Status-Filter basierend auf tatsächlichen DB-Werten
  const accepted = guests.filter(g => g.rsvp_status === 'accepted');
  const declined = guests.filter(g => g.rsvp_status === 'declined');
  const pending = guests.filter(g => g.rsvp_status === 'invited' || g.rsvp_status === 'planned');

  // Rücklaufquote = Zugesagt von allen Gästen
  const acceptanceRate = guests.length > 0
    ? Math.round((accepted.length / guests.length) * 100)
    : 0;

  // Antwortquote = Alle die geantwortet haben (zugesagt + abgesagt) von allen Gästen
  const responseRate = guests.length > 0
    ? Math.round(((accepted.length + declined.length) / guests.length) * 100)
    : 0;

  const statusColumns = [
    {
      id: 'accepted',
      label: 'Zugesagt',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      guests: accepted
    },
    {
      id: 'declined',
      label: 'Abgesagt',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      guests: declined
    },
    {
      id: 'pending',
      label: 'Ausstehend',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      guests: pending
    },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);

    if (!over || active.id === over.id) return;

    const activeGuest = guests.find(g => g.id === active.id);
    if (!activeGuest) return;

    const overId = over.id.toString();
    let newStatus: 'planned' | 'invited' | 'accepted' | 'declined';
    let targetColumn: string;

    // Determine target column
    if (overId.startsWith('droppable-')) {
      targetColumn = overId.replace('droppable-', '');
    } else {
      const overGuest = guests.find(g => g.id === overId);
      if (overGuest) {
        // If dropped on another guest, use that guest's status
        if (overGuest.rsvp_status === 'invited' || overGuest.rsvp_status === 'planned') {
          targetColumn = 'pending';
        } else {
          targetColumn = overGuest.rsvp_status;
        }
      } else {
        return;
      }
    }

    // Map column to actual status
    switch (targetColumn) {
      case 'accepted':
        newStatus = 'accepted';
        break;
      case 'declined':
        newStatus = 'declined';
        break;
      case 'pending':
        // Default to 'invited' when moving to pending column
        newStatus = 'invited';
        break;
      default:
        return;
    }

    // Don't update if status hasn't changed
    const currentStatus = activeGuest.rsvp_status;
    const currentColumn = (currentStatus === 'invited' || currentStatus === 'planned') ? 'pending' : currentStatus;
    if (currentColumn === targetColumn) {
      return;
    }

    try {
      const { error } = await supabase
        .from('guests')
        .update({ rsvp_status: newStatus })
        .eq('id', active.id);

      if (error) throw error;

      const statusLabels: Record<string, string> = {
        accepted: 'Zugesagt',
        declined: 'Abgesagt',
        pending: 'Ausstehend (Eingeladen)',
      };

      showToast('Status aktualisiert', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error updating guest status:', error);
      showToast('Fehler beim Aktualisieren des Status', 'error');
      onUpdate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl p-3 shadow-lg border-2 border-[#d4af37]/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#c19a2e] flex items-center justify-center shadow-md">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xs font-bold text-[#0a253c]">Zusagerate</h3>
          </div>
          <p className="text-3xl font-bold text-[#d4af37] mb-2">{acceptanceRate}%</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] h-1.5 rounded-full transition-all"
              style={{ width: `${acceptanceRate}%` }}
            />
          </div>
          <p className="text-xs text-[#666666] font-semibold mt-1">
            {accepted.length} von {guests.length} Gästen
          </p>
        </div>

        <div className="bg-gradient-to-br from-white to-green-50/30 rounded-xl p-3 shadow-lg border-2 border-green-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shadow-md">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xs font-bold text-[#0a253c]">Zugesagt</h3>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-2">{accepted.length}</p>
          <p className="text-xs text-[#666666] font-semibold">
            {guests.length > 0 ? Math.round((accepted.length / guests.length) * 100) : 0}% der Gäste
          </p>
        </div>

        <div className="bg-gradient-to-br from-white to-red-50/30 rounded-xl p-3 shadow-lg border-2 border-red-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-md">
              <XCircle className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xs font-bold text-[#0a253c]">Abgesagt</h3>
          </div>
          <p className="text-3xl font-bold text-red-600 mb-2">{declined.length}</p>
          <p className="text-xs text-[#666666] font-semibold">
            {guests.length > 0 ? Math.round((declined.length / guests.length) * 100) : 0}% der Gäste
          </p>
        </div>

        <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-xl p-3 shadow-lg border-2 border-orange-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center shadow-md">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xs font-bold text-[#0a253c]">Ausstehend</h3>
          </div>
          <p className="text-3xl font-bold text-orange-600 mb-2">{pending.length}</p>
          <p className="text-xs text-[#666666] font-semibold">
            Geplant + Eingeladen
          </p>
        </div>
      </div>

      {(accepted.length > 0 || declined.length > 0) && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-300 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 text-sm">Antwortquote</h4>
                <p className="text-xs text-blue-700 font-semibold">
                  {accepted.length + declined.length} von {guests.length} Gästen haben geantwortet
                </p>
              </div>
            </div>
            <div className="text-3xl font-black text-blue-600">{responseRate}%</div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <h3 className="text-xl font-bold text-[#0a253c]">RSVP Status</h3>
          <span className="px-2.5 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold rounded-full animate-pulse shadow-md">
            DRAG & DROP
          </span>
        </div>
        <p className="text-xs text-[#666666] font-semibold">
          Ziehe Gäste zwischen den Spalten, um ihren RSVP-Status zu ändern
        </p>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid md:grid-cols-3 gap-6">
          {statusColumns.map(({ id, label, icon: Icon, color, bgColor, guests: columnGuests }) => (
            <div key={id} className="space-y-2">
              <div className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl p-4 shadow-lg border-2 border-[#d4af37]/20">
                <div className="flex items-center gap-2.5 mb-4">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <h4 className="font-bold text-[#0a253c] text-sm">{label}</h4>
                  <span className="px-2.5 py-1 bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white rounded-full text-xs font-bold ml-auto shadow-sm">
                    {columnGuests.length}
                  </span>
                </div>
                <DroppableColumn id={id}>
                  <div className="space-y-2">
                    <SortableContext items={columnGuests.map(g => g.id)} strategy={verticalListSortingStrategy}>
                      {columnGuests.map(guest => (
                        <SortableGuestCard
                          key={guest.id}
                          guest={guest}
                          isDragging={isDragging}
                          activeId={activeId}
                          columnColor={color}
                          columnBgColor={bgColor}
                        />
                      ))}
                    </SortableContext>
                    {columnGuests.length === 0 && (
                      <div className="text-center py-10 text-[#999999]">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#f7f2eb] flex items-center justify-center">
                          <Icon className={`w-6 h-6 ${color} opacity-50`} />
                        </div>
                        <p className="text-xs font-semibold">
                          {id === 'accepted' && 'Noch keine Zusagen'}
                          {id === 'declined' && 'Noch keine Absagen'}
                          {id === 'pending' && 'Alle Gäste haben geantwortet'}
                        </p>
                      </div>
                    )}
                  </div>
                </DroppableColumn>
              </div>
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="p-3 rounded-lg bg-[#f7f2eb] shadow-2xl border-2 border-[#d4af37] opacity-90 scale-105 rotate-3 cursor-grabbing">
              <div className="flex items-start gap-3">
                <GripVertical className="w-5 h-5 text-[#d4af37]" />
                <div className="flex-1">
                  <p className="font-semibold text-[#0a253c]">
                    {guests.find(g => g.id === activeId)?.name || 'Gast'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

    </div>
  );
}
