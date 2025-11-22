import { useState, useEffect } from 'react';
import { FileText, Download, Eye, ExternalLink, Filter, Calendar } from 'lucide-react';
import { supabase, type Vendor, type VendorAttachment } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { VENDOR } from '../../constants/terminology';

interface VendorContractsTabProps {
  weddingId: string;
  vendors: Vendor[];
  onEditVendor: (vendorId: string) => void;
}

interface VendorWithContracts extends Vendor {
  contracts: VendorAttachment[];
}

export default function VendorContractsTab({
  weddingId,
  vendors,
  onEditVendor
}: VendorContractsTabProps) {
  const { showToast } = useToast();
  const [vendorsWithContracts, setVendorsWithContracts] = useState<VendorWithContracts[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadContracts();
  }, [vendors]);

  const loadContracts = async () => {
    try {
      setLoading(true);

      const vendorIds = vendors.map(v => v.id);
      if (vendorIds.length === 0) {
        setVendorsWithContracts([]);
        setLoading(false);
        return;
      }

      const { data: attachments } = await supabase
        .from('vendor_attachments')
        .select('*')
        .in('vendor_id', vendorIds)
        .eq('attachment_type', 'contract')
        .order('created_at', { ascending: false });

      const enrichedVendors = vendors.map(vendor => ({
        ...vendor,
        contracts: attachments?.filter(a => a.vendor_id === vendor.id) || []
      }));

      setVendorsWithContracts(enrichedVendors.filter(v => v.contracts.length > 0 || v.contract_sent));
    } catch (error) {
      console.error('Error loading contracts:', error);
      showToast('Fehler beim Laden der Verträge', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async () => {
    showToast('Export-Funktion in Entwicklung', 'info');
  };

  const handleDownload = async (attachment: VendorAttachment) => {
    try {
      const urlParts = attachment.file_url.split('/');
      const filePath = urlParts.slice(-3).join('/');

      const { data, error } = await supabase.storage
        .from('vendor-documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.file_name;
      link.click();
      URL.revokeObjectURL(url);

      showToast('Download gestartet', 'success');
    } catch (error) {
      console.error('Error downloading file:', error);
      showToast('Fehler beim Download', 'error');
    }
  };

  const filteredVendors = vendorsWithContracts.filter(vendor => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'sent') return vendor.contract_sent;
    if (filterStatus === 'signed') return vendor.contract_status === 'signed' || vendor.contract_status === 'completed';
    return true;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-3xl font-bold text-[#0a253c]">Verträge & Dokumente</h3>
          <p className="text-[#666666] mt-1">
            Alle Verträge deiner {VENDOR.PLURAL} an einem Ort
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-xl border-2 border-[#d4af37]/30 focus:border-[#d4af37] focus:outline-none"
          >
            <option value="all">Alle Status</option>
            <option value="sent">Vertrag versendet</option>
            <option value="signed">Vertrag unterzeichnet</option>
          </select>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all min-h-[40px]"
          >
            <Download className="w-4 h-4" />
            Alle exportieren
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredVendors.length === 0 ? (
          <div className="text-center py-16 bg-[#f7f2eb] rounded-2xl">
            <FileText className="w-20 h-20 text-[#d4af37] mx-auto mb-4 opacity-50" />
            <p className="text-[#666666] text-lg">
              {filterStatus === 'all'
                ? 'Noch keine Verträge vorhanden'
                : 'Keine Verträge mit diesem Status'}
            </p>
          </div>
        ) : (
          filteredVendors.map(vendor => (
            <div
              key={vendor.id}
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-[#d4af37]/30 hover:border-[#d4af37] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-xl font-bold text-[#0a253c]">{vendor.name}</h4>
                    {vendor.contract_sent && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        Vertrag versendet
                      </span>
                    )}
                    {(vendor.contract_status === 'signed' || vendor.contract_status === 'completed') && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Unterzeichnet
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#666666]">{vendor.category}</p>
                </div>
                <button
                  onClick={() => onEditVendor(vendor.id)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-[#d4af37] text-[#d4af37] rounded-xl font-semibold hover:bg-[#d4af37]/10 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Details
                </button>
              </div>

              {vendor.contracts.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {vendor.contracts.map(contract => (
                    <div
                      key={contract.id}
                      className="bg-[#f7f2eb] rounded-xl p-4 border-2 border-[#d4af37]/20 hover:border-[#d4af37] transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-[#0a253c] truncate mb-1">
                            {contract.file_name}
                          </h5>
                          <div className="flex items-center gap-3 text-xs text-[#666666] mb-2">
                            <span>{formatFileSize(contract.file_size)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(contract.created_at).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDownload(contract)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#d4af37] text-[#0a253c] rounded-lg text-sm font-semibold hover:bg-[#c19a2e] transition-all"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-[#f7f2eb] rounded-xl">
                  <FileText className="w-12 h-12 text-[#d4af37] mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-[#666666]">Noch keine Dokumente hochgeladen</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-[#f7f2eb] rounded-2xl p-6 border-2 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-[#0a253c] mb-2">Tipp: Dokumente verwalten</h4>
            <p className="text-sm text-[#666666]">
              Klicke auf "Details" bei einem {VENDOR.SINGULAR}, um weitere Dokumente hochzuladen oder bestehende zu verwalten.
              Alle Dokumenttypen (Verträge, Angebote, Rechnungen) werden automatisch kategorisiert.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
