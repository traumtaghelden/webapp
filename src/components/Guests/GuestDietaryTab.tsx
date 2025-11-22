import { useState } from 'react';
import { Utensils, AlertCircle, Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { type Guest } from '../../lib/supabase';
import { generateDietaryExportCSV, generateDietaryExportPDF, downloadFile } from '../../utils/exportHelpers';
import { useToast } from '../../contexts/ToastContext';

interface GuestDietaryTabProps {
  guests: Guest[];
  weddingDate?: string;
}

export default function GuestDietaryTab({ guests, weddingDate }: GuestDietaryTabProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportFilter, setExportFilter] = useState<'all' | 'confirmed'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  const guestsWithRestrictions = guests.filter(g => {
    if (!g.dietary_restrictions) return false;
    if (typeof g.dietary_restrictions === 'string') {
      return g.dietary_restrictions.trim().length > 0;
    }
    return false;
  });
  const guestsWithSpecialNeeds = guests.filter(g => g.special_needs && g.special_needs.trim() !== '');

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setIsExporting(true);
      const includeOnlyConfirmed = exportFilter === 'confirmed';
      const filterText = includeOnlyConfirmed ? 'bestätigte' : 'alle';
      const timestamp = new Date().toISOString().split('T')[0];

      if (format === 'csv') {
        const csv = generateDietaryExportCSV(guests, includeOnlyConfirmed);
        downloadFile(csv, `Ernaehrung_${filterText}_${timestamp}.csv`, 'text/csv;charset=utf-8;');
        showToast(`CSV-Export erfolgreich (${filterText} Gäste)`, 'success');
      } else {
        const pdf = generateDietaryExportPDF(guests, includeOnlyConfirmed, weddingDate);
        downloadFile(pdf, `Ernaehrung_${filterText}_${timestamp}.pdf`, 'application/pdf');
        showToast(`PDF-Export erfolgreich (${filterText} Gäste)`, 'success');
      }

      setShowExportMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      showToast('Fehler beim Export', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 active:scale-95 font-bold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            Exportieren
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-[#d4af37]/30 z-20 overflow-hidden">
                <div className="p-3 border-b border-[#d4af37]/20 bg-gradient-to-r from-[#f7f2eb]/50 to-white">
                  <p className="text-xs font-bold text-[#0a253c] mb-2">Filter auswählen:</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="export-filter"
                        checked={exportFilter === 'all'}
                        onChange={() => setExportFilter('all')}
                        className="text-[#d4af37] focus:ring-[#d4af37]"
                      />
                      <span className="text-xs font-semibold text-[#666666]">Alle geplanten Gäste</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="export-filter"
                        checked={exportFilter === 'confirmed'}
                        onChange={() => setExportFilter('confirmed')}
                        className="text-[#d4af37] focus:ring-[#d4af37]"
                      />
                      <span className="text-xs font-semibold text-[#666666]">Nur bestätigte Gäste</span>
                    </label>
                  </div>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gradient-to-r hover:from-[#f7f2eb] hover:to-[#d4af37]/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <FileText className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-bold text-[#0a253c]">Als PDF exportieren</span>
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={isExporting}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gradient-to-r hover:from-[#f7f2eb] hover:to-[#d4af37]/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-bold text-[#0a253c]">Als CSV exportieren</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-xl p-3 shadow-lg border-2 border-orange-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center shadow-md">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xs font-bold text-[#0a253c]">Ernährungswünsche</h3>
          </div>
          <p className="text-3xl font-bold text-orange-600 mb-1">{guestsWithRestrictions.length}</p>
          <p className="text-xs text-[#666666] font-semibold">Gäste mit speziellen Wünschen</p>
        </div>

        <div className="bg-gradient-to-br from-white to-red-50/30 rounded-xl p-3 shadow-lg border-2 border-red-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-md">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xs font-bold text-[#0a253c]">Besondere Bedürfnisse</h3>
          </div>
          <p className="text-3xl font-bold text-red-600 mb-1">{guestsWithSpecialNeeds.length}</p>
          <p className="text-xs text-[#666666] font-semibold">Gäste mit besonderen Bedürfnissen</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl p-5 shadow-lg border-2 border-[#d4af37]/20">
        <h4 className="font-bold text-[#0a253c] text-base mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-[#d4af37] to-[#c19a2e] rounded-full"></span>
          Gäste mit Ernährungswünschen
        </h4>
        <div className="space-y-2.5">
          {guestsWithRestrictions.map(guest => (
            <div key={guest.id} className="p-4 bg-white rounded-lg shadow-sm border border-[#d4af37]/10 hover:border-[#d4af37]/30 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-[#0a253c] mb-2 text-sm">{guest.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const restrictions = typeof guest.dietary_restrictions === 'string'
                        ? guest.dietary_restrictions.split(',').map(r => r.trim()).filter(Boolean)
                        : Array.isArray(guest.dietary_restrictions)
                        ? guest.dietary_restrictions
                        : [];

                      return restrictions.map((restriction, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                        >
                          {restriction}
                        </span>
                      ));
                    })()}
                  </div>
                  {guest.special_needs && (
                    <div className="mt-2.5 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-bold">Besondere Bedürfnisse: {guest.special_needs}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {guestsWithRestrictions.length === 0 && (
            <div className="text-center py-12 text-[#666666]">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f7f2eb] flex items-center justify-center">
                <Utensils className="w-8 h-8 text-[#d4af37] opacity-50" />
              </div>
              <p className="text-sm font-semibold">Keine speziellen Ernährungswünsche erfasst</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
