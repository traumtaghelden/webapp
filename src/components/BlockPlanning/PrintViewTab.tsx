import { useState, useEffect } from 'react';
import { Printer, Clock, User, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TimelineEvent, TimelineBlockSubtask } from '../../lib/supabase';

interface PrintViewTabProps {
  event: TimelineEvent;
  weddingId: string;
}

interface ChecklistItem {
  id: string;
  item_text: string;
  category: string;
  order_index: number;
}

interface PackingItem {
  id: string;
  item_name: string;
  quantity: number;
  category: string;
  location: string;
  notes: string;
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  contact_name: string;
  phone: string;
  email: string;
  service_description: string;
}

export default function PrintViewTab({ event, weddingId }: PrintViewTabProps) {
  const [subtasks, setSubtasks] = useState<TimelineBlockSubtask[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, [event.id]);

  const loadAllData = async () => {
    setLoading(true);

    const [subtasksResult, checklistResult, packingResult, vendorsResult] = await Promise.all([
      supabase
        .from('timeline_block_subtasks')
        .select('*')
        .eq('timeline_event_id', event.id)
        .order('order_index', { ascending: true }),
      supabase
        .from('timeline_block_checklist')
        .select('*')
        .eq('timeline_event_id', event.id)
        .order('category, order_index', { ascending: true }),
      supabase
        .from('timeline_block_items')
        .select('*')
        .eq('timeline_event_id', event.id)
        .order('category, order_index', { ascending: true }),
      supabase
        .from('vendors')
        .select('*')
        .eq('timeline_event_id', event.id)
        .order('name', { ascending: true }),
    ]);

    if (subtasksResult.data) setSubtasks(subtasksResult.data);
    if (checklistResult.data) setChecklistItems(checklistResult.data);
    if (packingResult.data) setPackingItems(packingResult.data);
    if (vendorsResult.data) setVendors(vendorsResult.data);

    setLoading(false);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateAbsoluteTime = (offsetMinutes: number) => {
    const [hours, minutes] = event.time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + offsetMinutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  };

  const groupByCategory = <T extends { category: string }>(items: T[]) => {
    return items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const groupedChecklist = groupByCategory(checklistItems);
  const groupedPacking = groupByCategory(packingItems);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Druckansicht</h3>
          <p className="text-sm text-gray-600 mt-1">
            Komplette Übersicht zum Mitnehmen zur Hochzeit
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Printer className="w-4 h-4" />
          Drucken
        </button>
      </div>

      <div className="print-content bg-white rounded-xl border-2 border-gray-200 p-8">
        <div className="mb-8 pb-6 border-b-2 border-gray-300">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
          <div className="flex flex-wrap gap-6 text-gray-700">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">
                {formatTime(event.time)}
                {event.end_time && ` - ${formatTime(event.end_time)}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Dauer: {event.duration_minutes} Minuten</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{event.location}</span>
              </div>
            )}
            {event.assigned_to && (
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span>Verantwortlich: {event.assigned_to}</span>
              </div>
            )}
          </div>
          {event.description && (
            <p className="mt-4 text-gray-700">{event.description}</p>
          )}
        </div>

        {subtasks.length > 0 && (
          <div className="mb-8 page-break-before">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
              Detaillierter Ablauf
            </h2>
            <div className="space-y-3">
              {subtasks.map((subtask, index) => (
                <div key={subtask.id} className="flex gap-4 py-3 border-b border-gray-200">
                  <div className="w-16 font-bold text-gray-900 flex-shrink-0">
                    {calculateAbsoluteTime(subtask.start_offset_minutes)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      {index + 1}. {subtask.title}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      Dauer: {subtask.duration_minutes} Min
                      {subtask.assigned_to && ` • Verantwortlich: ${subtask.assigned_to}`}
                    </div>
                    {subtask.description && (
                      <p className="text-sm text-gray-700 mt-2">{subtask.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {checklistItems.length > 0 && (
          <div className="mb-8 page-break-before">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
              Checkliste
            </h2>
            {Object.entries(groupedChecklist).map(([category, items]) => (
              <div key={category} className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{category}</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {items.map((item) => (
                    <li key={item.id} className="text-gray-700">
                      {item.item_text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {packingItems.length > 0 && (
          <div className="mb-8 page-break-before">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
              Packliste
            </h2>
            {Object.entries(groupedPacking).map(([category, items]) => (
              <div key={category} className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{category}</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 font-semibold text-gray-700">Artikel</th>
                      <th className="text-center py-2 font-semibold text-gray-700 w-20">Anzahl</th>
                      <th className="text-left py-2 font-semibold text-gray-700 w-32">Standort</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-2 text-gray-700">
                          {item.item_name}
                          {item.notes && (
                            <span className="block text-xs text-gray-600 mt-1">
                              {item.notes}
                            </span>
                          )}
                        </td>
                        <td className="text-center py-2 text-gray-700">{item.quantity}</td>
                        <td className="py-2 text-gray-600">{item.location || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {vendors.length > 0 && (
          <div className="mb-8 page-break-before">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
              Dienstleister-Kontakte
            </h2>
            <div className="space-y-4">
              {vendors.map((vendor) => (
                <div key={vendor.id} className="pb-4 border-b border-gray-200">
                  <div className="font-semibold text-lg text-gray-900 mb-1">{vendor.name}</div>
                  <div className="text-sm text-gray-600 mb-2">{vendor.category}</div>
                  {vendor.contact_name && (
                    <div className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">Ansprechpartner:</span> {vendor.contact_name}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                    {vendor.phone && (
                      <div>
                        <span className="font-medium">Telefon:</span> {vendor.phone}
                      </div>
                    )}
                    {vendor.email && (
                      <div>
                        <span className="font-medium">E-Mail:</span> {vendor.email}
                      </div>
                    )}
                  </div>
                  {vendor.service_description && (
                    <p className="text-sm text-gray-600 mt-2">{vendor.service_description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {subtasks.length === 0 && checklistItems.length === 0 && packingItems.length === 0 && vendors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Noch keine Details für diesen Block geplant.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20mm;
            background: white !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-before {
            page-break-before: always;
          }
          h1 {
            font-size: 24pt;
          }
          h2 {
            font-size: 18pt;
            margin-top: 12pt;
          }
          h3 {
            font-size: 14pt;
          }
          body {
            font-size: 11pt;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
}
