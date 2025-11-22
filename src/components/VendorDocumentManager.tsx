import { useState, useEffect, useRef } from 'react';
import { Upload, File, FileText, Trash2, Download, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VendorAttachment {
  id: string;
  vendor_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  category: string;
  created_at: string;
}

interface VendorDocumentManagerProps {
  vendorId: string;
  onUpdate: () => void;
}

export default function VendorDocumentManager({ vendorId, onUpdate }: VendorDocumentManagerProps) {
  const [attachments, setAttachments] = useState<VendorAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: 'contract', label: 'Vertrag', icon: '📄' },
    { value: 'offer', label: 'Angebot', icon: '💰' },
    { value: 'invoice', label: 'Rechnung', icon: '🧾' },
    { value: 'communication', label: 'Kommunikation', icon: '💬' },
    { value: 'other', label: 'Sonstiges', icon: '📎' },
  ];

  const MAX_FILE_SIZE_FREE = 5 * 1024 * 1024; // 5MB
  const MAX_FILE_SIZE_PREMIUM = 20 * 1024 * 1024; // 20MB
  const MAX_TOTAL_SIZE_FREE = 50 * 1024 * 1024; // 50MB

  const maxFileSize = isPremium ? MAX_FILE_SIZE_PREMIUM : MAX_FILE_SIZE_FREE;

  useEffect(() => {
    loadAttachments();
    checkPremiumStatus();
  }, [vendorId]);

  const checkPremiumStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: wedding } = await supabase
        .from('weddings')
        .select('is_premium')
        .eq('user_id', user.id)
        .single();

      if (wedding) {
        setIsPremium(wedding.is_premium || false);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('vendor_attachments')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (data) setAttachments(data);
    } catch (error) {
      console.error('Error loading attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalSize = () => {
    return attachments.reduce((sum, att) => sum + att.file_size, 0);
  };

  const canUpload = (fileSize: number) => {
    if (isPremium) return true;

    const totalSize = getTotalSize();
    if (totalSize + fileSize > MAX_TOTAL_SIZE_FREE) {
      return false;
    }
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      if (file.size > maxFileSize) {
        alert(
          `Datei "${file.name}" ist zu groß. Maximum: ${isPremium ? '20MB' : '5MB'}`
        );
        continue;
      }

      if (!canUpload(file.size)) {
        alert(
          `Speicherplatz-Limit erreicht (${(MAX_TOTAL_SIZE_FREE / 1024 / 1024).toFixed(0)}MB). Upgrade auf Premium für unbegrenzten Speicher.`
        );
        continue;
      }

      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${vendorId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-documents')
        .getPublicUrl(filePath);

      const category = detectCategory(file.name);

      const { error: insertError } = await supabase
        .from('vendor_attachments')
        .insert([{
          vendor_id: vendorId,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
          category,
          uploaded_by: user.id,
        }]);

      if (insertError) throw insertError;

      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(0);
        setUploading(false);
      }, 500);

      loadAttachments();
      onUpdate();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Fehler beim Hochladen der Datei');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const detectCategory = (fileName: string): string => {
    const lower = fileName.toLowerCase();
    if (lower.includes('vertrag') || lower.includes('contract')) return 'contract';
    if (lower.includes('angebot') || lower.includes('offer')) return 'offer';
    if (lower.includes('rechnung') || lower.includes('invoice')) return 'invoice';
    if (lower.includes('email') || lower.includes('mail')) return 'communication';
    return 'other';
  };

  const handleDelete = async (attachment: VendorAttachment) => {
    if (!confirm(`Dokument "${attachment.file_name}" wirklich löschen?`)) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const urlParts = attachment.file_url.split('/');
      const filePath = urlParts.slice(-3).join('/');

      await supabase.storage
        .from('vendor-documents')
        .remove([filePath]);

      await supabase
        .from('vendor_attachments')
        .delete()
        .eq('id', attachment.id);

      loadAttachments();
      onUpdate();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Fehler beim Löschen der Datei');
    }
  };

  const handleDownload = async (attachment: VendorAttachment) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Fehler beim Herunterladen der Datei');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const totalSize = getTotalSize();
  const totalSizePercent = isPremium ? 0 : (totalSize / MAX_TOTAL_SIZE_FREE) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage Info */}
      {!isPremium && (
        <div className="bg-orange-500/20 rounded-xl p-4 border-2 border-orange-400/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-orange-200">Speicherplatz</span>
            <span className="text-sm font-bold text-orange-100">
              {formatFileSize(totalSize)} / {formatFileSize(MAX_TOTAL_SIZE_FREE)}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-orange-400 to-yellow-400 h-full rounded-full transition-all"
              style={{ width: `${Math.min(totalSizePercent, 100)}%` }}
            />
          </div>
          {totalSizePercent > 80 && (
            <p className="text-xs text-orange-200 mt-2">
              Upgrade auf Premium für unbegrenzten Speicher
            </p>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-[#d4af37] bg-[#d4af37]/20'
            : 'border-white/30 hover:border-[#d4af37] hover:bg-white/5'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        />
        <Upload className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">
          Dateien hochladen
        </h3>
        <p className="text-sm text-white/80 mb-2">
          Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen
        </p>
        <p className="text-xs text-white/60">
          PDF, Word, Text, Bilder • Max. {isPremium ? '20MB' : '5MB'} pro Datei
        </p>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-500/20 rounded-xl p-4 border-2 border-blue-400/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
            <span className="text-sm font-semibold text-blue-100">Wird hochgeladen...</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-400 to-blue-500 h-full rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Documents List */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">
          Dokumente ({attachments.length})
        </h3>

        {attachments.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border-2 border-white/10">
            <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/70">Noch keine Dokumente hochgeladen</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {attachments.map((attachment) => {
              const category = categories.find(c => c.value === attachment.category);
              return (
                <div
                  key={attachment.id}
                  className="bg-white/10 border-2 border-white/20 rounded-xl p-4 hover:border-[#d4af37] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center flex-shrink-0 text-2xl">
                      {category?.icon || '📎'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate mb-1">
                        {attachment.file_name}
                      </h4>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-white/20 text-white/90 rounded-full text-xs font-medium">
                          {category?.label || 'Sonstiges'}
                        </span>
                        <span className="text-xs text-white/60">
                          {formatFileSize(attachment.file_size)}
                        </span>
                      </div>
                      <p className="text-xs text-white/50">
                        {new Date(attachment.created_at).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleDownload(attachment)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#d4af37] text-[#0a253c] rounded-lg text-sm font-semibold hover:bg-[#c19a2e] transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(attachment)}
                      className="px-3 py-2 bg-red-500/30 text-red-200 rounded-lg hover:bg-red-500/50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Categories Summary */}
      {attachments.length > 0 && (
        <div className="bg-white/5 rounded-xl p-4 border-2 border-white/10">
          <h4 className="font-semibold text-white mb-3">Nach Kategorie</h4>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const count = attachments.filter(a => a.category === category.value).length;
              if (count === 0) return null;
              return (
                <div
                  key={category.value}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border-2 border-white/20"
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-semibold text-white">{category.label}</span>
                  <span className="px-2 py-0.5 bg-[#d4af37] text-[#0a253c] rounded-full text-xs font-bold">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
