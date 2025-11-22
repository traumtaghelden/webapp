import { useState } from 'react';
import { Mail, Phone, MapPin, Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { type Guest, type FamilyGroup, type GuestGroup } from '../../lib/supabase';
import { generateContactsExportCSV, generateContactsExportPDF, downloadFile } from '../../utils/exportHelpers';
import { useToast } from '../../contexts/ToastContext';

interface GuestContactsTabProps {
  guests: Guest[];
  familyGroups: FamilyGroup[];
  guestGroups: GuestGroup[];
  weddingDate?: string;
}

export default function GuestContactsTab({ guests, familyGroups, guestGroups, weddingDate }: GuestContactsTabProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  const guestsWithEmail = guests.filter(g => g.email);
  const guestsWithPhone = guests.filter(g => g.phone);
  const guestsWithAddress = guests.filter(g => g.address);

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setIsExporting(true);
      const timestamp = new Date().toISOString().split('T')[0];

      if (format === 'csv') {
        const csv = generateContactsExportCSV(guests, familyGroups, guestGroups);
        downloadFile(csv, `Kontakte_${timestamp}.csv`, 'text/csv;charset=utf-8;');
        showToast('CSV-Export erfolgreich', 'success');
      } else {
        const pdf = generateContactsExportPDF(guests, familyGroups, guestGroups, weddingDate);
        downloadFile(pdf, `Kontakte_${timestamp}.pdf`, 'application/pdf');
        showToast('PDF-Export erfolgreich', 'success');
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
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border-2 border-[#d4af37]/30 z-20 overflow-hidden">
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
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl p-3 shadow-lg border-2 border-blue-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xs font-bold text-[#0a253c]">E-Mail-Adressen</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-1">{guestsWithEmail.length}</p>
            <p className="text-xs text-[#666666] font-semibold">von {guests.length} Gästen</p>
          </div>

          <div className="bg-gradient-to-br from-white to-green-50/30 rounded-xl p-3 shadow-lg border-2 border-green-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shadow-md">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xs font-bold text-[#0a253c]">Telefonnummern</h3>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-1">{guestsWithPhone.length}</p>
            <p className="text-xs text-[#666666] font-semibold">von {guests.length} Gästen</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-xl p-3 shadow-lg border-2 border-orange-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center shadow-md">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xs font-bold text-[#0a253c]">Adressen</h3>
          </div>
          <p className="text-3xl font-bold text-orange-600 mb-1">{guestsWithAddress.length}</p>
          <p className="text-xs text-[#666666] font-semibold">von {guests.length} Gästen</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl p-5 shadow-lg border-2 border-[#d4af37]/20">
        <h4 className="font-bold text-[#0a253c] text-base mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-[#d4af37] to-[#c19a2e] rounded-full"></span>
          Kontaktinformationen
        </h4>
        <div className="space-y-2.5">
          {guests.map(guest => (
            <div key={guest.id} className="p-4 bg-white rounded-lg shadow-sm border border-[#d4af37]/10 hover:border-[#d4af37]/30 hover:shadow-md transition-all duration-200">
              <h5 className="font-bold text-[#0a253c] mb-2.5 text-sm">{guest.name}</h5>
              <div className="space-y-1.5 text-xs">
                {guest.email && (
                  <div className="flex items-center gap-2 text-[#666666]">
                    <Mail className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <a href={`mailto:${guest.email}`} className="hover:text-[#d4af37] transition-colors font-semibold truncate">
                      {guest.email}
                    </a>
                  </div>
                )}
                {guest.phone && (
                  <div className="flex items-center gap-2 text-[#666666]">
                    <Phone className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <a href={`tel:${guest.phone}`} className="hover:text-[#d4af37] transition-colors font-semibold">
                      {guest.phone}
                    </a>
                  </div>
                )}
                {guest.address && (
                  <div className="flex items-center gap-2 text-[#666666]">
                    <MapPin className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                    <span className="font-medium">{guest.address}</span>
                  </div>
                )}
                {!guest.email && !guest.phone && !guest.address && (
                  <p className="text-[#999999] italic text-xs">Keine Kontaktinformationen</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
