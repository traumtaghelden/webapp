import { useState, useEffect, useMemo, useCallback, startTransition, memo } from 'react';
import { X, MessageSquare, Paperclip, Send, Download, Trash2, Upload, Calendar, Info, Link as LinkIcon, Clock, CheckCircle, Circle, AlertCircle, Edit, Save, Image as ImageIcon, FileText, File, ZoomIn } from 'lucide-react';
import { supabase, type TaskComment, type TaskAttachment, type Task, type TaskSubtask, type TaskDependency, type BudgetItem, type Vendor } from '../lib/supabase';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

interface TaskDetailModalProps {
  isOpen?: boolean;
  taskId: string;
  taskTitle?: string;
  onClose: () => void;
  weddingId?: string;
  onUpdate?: () => void;
}

export default function TaskDetailModal({ isOpen = true, taskId, taskTitle, onClose, weddingId, onUpdate }: TaskDetailModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'attachments'>('overview');
  const [task, setTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});

  // Performance: Debounce expensive inputs (250ms for better typing experience)
  const debouncedTitle = useDebouncedValue(editedTask.title ?? '', 250);
  const debouncedDescription = useDebouncedValue(editedTask.description ?? '', 250);
  const [teamRoles, setTeamRoles] = useState<any[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [budgetItem, setBudgetItem] = useState<BudgetItem | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Performance: Memoize linked entity display to prevent recalculations
  const linkedEntityInfo = useMemo(() => ({
    hasBudgetItem: !!budgetItem,
    hasVendor: !!vendor,
    budgetItemName: budgetItem?.item_name,
    vendorName: vendor?.name,
  }), [budgetItem, vendor]);

  // Performance: Memoize comments count for badge display
  const commentsCount = useMemo(() => comments.length, [comments.length]);
  const attachmentsCount = useMemo(() => attachments.length, [attachments.length]);

  useEffect(() => {
    // Lock body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Get scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Performance: Use startTransition for non-critical data loading
    startTransition(() => {
      loadData();
      getUserId();
      loadTaskDetails();
    });

    if (weddingId) {
      startTransition(() => {
        loadTeamRoles();
        loadBudgetItems();
        loadVendors();
      });
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (lightboxImage) {
          setLightboxImage(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      // Restore body scroll
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [taskId, weddingId, onClose, lightboxImage]);

  const getUserId = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUserId(data.user.id);
    }
  };

  const loadTaskDetails = async () => {
    try {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();

      if (taskData) {
        setTask(taskData);

        const [subtasksData, dependenciesData] = await Promise.all([
          supabase.from('task_subtasks').select('*').eq('task_id', taskId).order('sort_order'),
          supabase.from('task_dependencies').select('*').eq('task_id', taskId),
        ]);

        if (subtasksData.data) setSubtasks(subtasksData.data);
        if (dependenciesData.data) setDependencies(dependenciesData.data);

        if (taskData.budget_item_id) {
          const { data: budgetData } = await supabase
            .from('budget_items')
            .select('*')
            .eq('id', taskData.budget_item_id)
            .maybeSingle();

          if (budgetData) {
            setBudgetItem(budgetData);
          } else {
            // Budget item was deleted, clear the invalid reference
            await supabase
              .from('tasks')
              .update({ budget_item_id: null })
              .eq('id', taskId);
            setBudgetItem(null);
          }
        }

        if (taskData.vendor_id) {
          const { data: vendorData } = await supabase
            .from('vendors')
            .select('*')
            .eq('id', taskData.vendor_id)
            .maybeSingle();

          if (vendorData) {
            setVendor(vendorData);
          } else {
            // Vendor was deleted, clear the invalid reference
            await supabase
              .from('tasks')
              .update({ vendor_id: null })
              .eq('id', taskId);
            setVendor(null);
          }
        }
      }
    } catch (error) {
      console.error('Error loading task details:', error);
    }
  };

  const loadTeamRoles = async () => {
    try {
      const { data } = await supabase
        .from('wedding_team_roles')
        .select('*')
        .eq('wedding_id', weddingId);
      if (data) setTeamRoles(data);
    } catch (error) {
      console.error('Error loading team roles:', error);
    }
  };

  const loadBudgetItems = async () => {
    try {
      const { data } = await supabase
        .from('budget_items')
        .select('*')
        .eq('wedding_id', weddingId);
      if (data) setBudgetItems(data);
    } catch (error) {
      console.error('Error loading budget items:', error);
    }
  };

  const loadVendors = async () => {
    try {
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .eq('wedding_id', weddingId);
      if (data) setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const handleStartEdit = () => {
    if (task) {
      setEditedTask({
        title: task.title,
        category: task.category,
        priority: task.priority,
        due_date: task.due_date,
        assigned_to: task.assigned_to,
        notes: task.notes,
        status: task.status,
        budget_item_id: task.budget_item_id,
        vendor_id: task.vendor_id,
      });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = useCallback(async () => {
    try {
      // Clean up empty strings to null for foreign key fields
      const cleanedTask = {
        ...editedTask,
        assigned_to: editedTask.assigned_to || null,
        budget_item_id: editedTask.budget_item_id || null,
        vendor_id: editedTask.vendor_id || null,
      };

      const { error } = await supabase
        .from('tasks')
        .update(cleanedTask)
        .eq('id', taskId);

      if (error) throw error;

      setIsEditing(false);
      await loadTaskDetails();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Fehler beim Speichern der Aufgabe');
    }
  }, [editedTask, taskId, onUpdate]);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTask({});
  };

  const categories = [
    'general',
    'venue',
    'catering',
    'decoration',
    'music',
    'photography',
    'invitations',
    'flowers',
    'dress',
    'other',
  ];

  const loadData = async () => {
    const [commentsData, attachmentsData] = await Promise.all([
      supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true }),
      supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false }),
    ]);

    if (commentsData.data) setComments(commentsData.data);
    if (attachmentsData.data) setAttachments(attachmentsData.data);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim()) return;

    try {
      await supabase.from('task_comments').insert([
        {
          task_id: taskId,
          user_id: userId,
          comment: newComment.trim(),
        },
      ]);

      setNewComment('');
      loadData();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, [newComment, taskId, userId]);

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Möchtest du diesen Kommentar wirklich löschen?')) return;

    try {
      await supabase.from('task_comments').delete().eq('id', commentId);
      loadData();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${taskId}-${Date.now()}.${fileExt}`;
        const filePath = `task-attachments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('wedding-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('wedding-files')
          .getPublicUrl(filePath);

        await supabase.from('task_attachments').insert([
          {
            task_id: taskId,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: userId,
          },
        ]);
      }

      loadData();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Fehler beim Hochladen der Datei. Bitte versuche es erneut.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string, fileUrl: string) => {
    if (!confirm('Möchtest du diese Datei wirklich löschen?')) return;

    try {
      const filePath = fileUrl.split('/').slice(-2).join('/');
      await supabase.storage.from('wedding-files').remove([filePath]);
      await supabase.from('task_attachments').delete().eq('id', attachmentId);
      loadData();
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  const isPdfFile = (fileType: string) => {
    return fileType === 'application/pdf';
  };

  const imageAttachments = attachments.filter(att => isImageFile(att.file_type));
  const otherAttachments = attachments.filter(att => !isImageFile(att.file_type));

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 lg:pl-[288px]"
      style={{ zIndex: 99999 }}
      onClick={handleBackdropClick}
    >
      <div
        className="bg-[#0a1929] rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-800 max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 border-b border-gray-800">
          {/* Header - nur Titel und Schließen Button */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white pr-8">{taskTitle || task?.title || 'Aufgabe'}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Schließen"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Tab Navigation - optimiert für mobile */}
          <div className="grid grid-cols-2 sm:flex gap-2">
            {/* Edit-Modus: Speichern & Abbrechen Buttons */}
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="col-span-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-green-600 text-white rounded-lg sm:rounded-xl font-semibold transition-all hover:bg-green-700 active:scale-95 min-h-[44px] sm:min-h-0"
                >
                  <Save className="w-4 h-4" />
                  <span>Speichern</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="col-span-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 border-2 border-red-500 text-red-500 rounded-lg sm:rounded-xl font-semibold transition-all hover:bg-red-500/10 active:scale-95 min-h-[44px] sm:min-h-0"
                >
                  <X className="w-4 h-4" />
                  <span>Abbrechen</span>
                </button>
              </>
            ) : (
              /* Bearbeiten Button - volle Breite auf Mobile */
              <button
                onClick={handleStartEdit}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-[#d4af37] text-black rounded-lg sm:rounded-xl font-semibold transition-all hover:bg-[#c19a2e] active:scale-95 min-h-[44px] sm:min-h-0"
              >
                <Edit className="w-4 h-4" />
                <span>Bearbeiten</span>
              </button>
            )}

            {/* Übersicht Tab */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold transition-all min-h-[44px] sm:min-h-0 ${
                activeTab === 'overview'
                  ? 'bg-[#d4af37] text-black shadow-md'
                  : 'bg-gray-800/80 text-white hover:bg-gray-700'
              }`}
            >
              <Info className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Übersicht</span>
            </button>

            {/* Kommentare Tab */}
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold transition-all min-h-[44px] sm:min-h-0 relative ${
                activeTab === 'comments'
                  ? 'bg-[#d4af37] text-black shadow-md'
                  : 'bg-gray-800/80 text-white hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs sm:text-sm hidden sm:inline">Kommentare</span>
              {comments.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'comments' ? 'bg-black/20' : 'bg-[#d4af37] text-black'
                }`}>
                  {comments.length}
                </span>
              )}
            </button>

            {/* Anhänge Tab */}
            <button
              onClick={() => setActiveTab('attachments')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold transition-all min-h-[44px] sm:min-h-0 relative ${
                activeTab === 'attachments'
                  ? 'bg-[#d4af37] text-black shadow-md'
                  : 'bg-gray-800/80 text-white hover:bg-gray-700'
              }`}
            >
              <Paperclip className="w-4 h-4" />
              <span className="text-xs sm:text-sm hidden sm:inline">Anhänge</span>
              {attachments.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'attachments' ? 'bg-black/20' : 'bg-[#d4af37] text-black'
                }`}>
                  {attachments.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'overview' && task && (
            <div className="space-y-4 sm:space-y-6">
              {isEditing ? (
                <div className="bg-[#0a1929]/50 border-2 border-gray-700 rounded-xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-4">Aufgabe bearbeiten</h3>
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-white mb-2">Titel</label>
                      <input
                        type="text"
                        value={editedTask.title || ''}
                        onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#0a1929] border border-gray-700 text-white focus:border-[#d4af37] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Status</label>
                      <select
                        value={editedTask.status || 'pending'}
                        onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as any })}
                        className="w-full px-4 py-3 rounded-xl bg-[#0a1929] border border-gray-700 text-white focus:border-[#d4af37] focus:outline-none"
                      >
                        <option value="pending">Offen</option>
                        <option value="in_progress">In Bearbeitung</option>
                        <option value="completed">Erledigt</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Priorität</label>
                      <select
                        value={editedTask.priority || 'medium'}
                        onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as any })}
                        className="w-full px-4 py-3 rounded-xl bg-[#0a1929] border border-gray-700 text-white focus:border-[#d4af37] focus:outline-none"
                      >
                        <option value="low">Niedrig</option>
                        <option value="medium">Mittel</option>
                        <option value="high">Hoch</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Kategorie</label>
                      <select
                        value={editedTask.category || 'general'}
                        onChange={(e) => setEditedTask({ ...editedTask, category: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#0a1929] border border-gray-700 text-white focus:border-[#d4af37] focus:outline-none"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Fällig am</label>
                      <input
                        type="date"
                        value={editedTask.due_date || ''}
                        onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#0a1929] border border-gray-700 text-white focus:border-[#d4af37] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Verantwortlich</label>
                      <select
                        value={editedTask.assigned_to || ''}
                        onChange={(e) => setEditedTask({ ...editedTask, assigned_to: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#0a1929] border border-gray-700 text-white focus:border-[#d4af37] focus:outline-none"
                      >
                        <option value="">Nicht zugewiesen</option>
                        {teamRoles.map((role: any) => (
                          <option key={role.id} value={role.name}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Budget-Posten</label>
                      <select
                        value={editedTask.budget_item_id || ''}
                        onChange={(e) => setEditedTask({ ...editedTask, budget_item_id: e.target.value || null })}
                        className="w-full px-4 py-3 rounded-xl bg-[#0a1929] border border-gray-700 text-white focus:border-[#d4af37] focus:outline-none"
                      >
                        <option value="">Keine Verknüpfung</option>
                        {budgetItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.item_name} - {item.category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Dienstleister</label>
                      <select
                        value={editedTask.vendor_id || ''}
                        onChange={(e) => setEditedTask({ ...editedTask, vendor_id: e.target.value || null })}
                        className="w-full px-4 py-3 rounded-xl bg-[#0a1929] border border-gray-700 text-white focus:border-[#d4af37] focus:outline-none"
                      >
                        <option value="">Keine Verknüpfung</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} - {v.category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-white mb-2">Notizen</label>
                      <textarea
                        value={editedTask.notes || ''}
                        onChange={(e) => setEditedTask({ ...editedTask, notes: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#0a1929] border border-gray-700 text-white placeholder-gray-500 focus:border-[#d4af37] focus:outline-none"
                        rows={4}
                        placeholder="Zusätzliche Details..."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-[#0a1929]/50 rounded-xl p-4 sm:p-6 border border-gray-800">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Info className="w-5 h-5 text-[#d4af37]" />
                      Aufgabendetails
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Status</p>
                        <div className="flex items-center gap-2">
                          {task.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-500 fill-current" />
                          ) : task.status === 'in_progress' ? (
                            <Clock className="w-5 h-5 text-blue-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                          <span className="font-semibold text-white">
                            {task.status === 'completed' ? 'Erledigt' : task.status === 'in_progress' ? 'In Bearbeitung' : 'Offen'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Priorität</p>
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${
                          task.priority === 'high' ? 'bg-red-100 text-red-700' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.priority === 'high' && <AlertCircle className="w-4 h-4" />}
                          {task.priority === 'high' ? 'Hoch' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Kategorie</p>
                        <span className="inline-block px-3 py-1.5 bg-[#d4af37]/20 text-[#d4af37] rounded-full text-sm font-bold">
                          {task.category}
                        </span>
                      </div>
                      {task.due_date && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Fälligkeitsdatum</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#d4af37]" />
                            <span className="font-semibold text-white">{formatDate(task.due_date)}</span>
                            {new Date(task.due_date) < new Date() && task.status !== 'completed' && (
                              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Überfällig</span>
                            )}
                          </div>
                        </div>
                      )}
                      {task.assigned_to && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Zugewiesen an</p>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#d4af37] flex items-center justify-center text-black font-bold">
                              {task.assigned_to.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-white">{task.assigned_to}</span>
                          </div>
                        </div>
                      )}
                      {task.created_at && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Erstellt am</p>
                          <span className="text-sm text-gray-300">{formatDate(task.created_at)}</span>
                        </div>
                      )}
                    </div>
                    {task.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Notizen</p>
                        <p className="text-gray-200 whitespace-pre-wrap bg-[#0a1929] rounded-lg p-3 border border-gray-800">{task.notes}</p>
                      </div>
                    )}
                  </div>

                  {subtasks.length > 0 && (
                    <div className="bg-[#0a1929]/50 border border-gray-800 rounded-xl p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-white">Unteraufgaben</h3>
                        <span className="text-sm font-bold text-[#d4af37]">
                          {subtasks.filter(s => s.completed).length}/{subtasks.length}
                        </span>
                      </div>
                      <div className="mb-4">
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#d4af37] to-[#f4c430] h-full transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${(subtasks.filter(s => s.completed).length / subtasks.length) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100)}% abgeschlossen
                        </p>
                      </div>
                      <div className="space-y-2">
                        {subtasks.map(subtask => (
                          <div key={subtask.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors">
                            {subtask.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-500 fill-current flex-shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            )}
                            <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-200 font-medium'}`}>
                              {subtask.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(budgetItem || vendor) && (
                    <div className="space-y-4">
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-[#d4af37]" />
                        Verknüpfungen
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {budgetItem && (
                          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 hover:border-green-500/50 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-white text-lg font-bold">€</span>
                              </div>
                              <p className="text-xs text-green-400 font-bold uppercase tracking-wide">Budget-Posten</p>
                            </div>
                            <p className="text-lg font-bold text-white mb-2">{budgetItem.item_name}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-300">Geschätzt:</span>
                              <span className="text-lg font-bold text-green-400">{budgetItem.estimated_cost}€</span>
                            </div>
                            {budgetItem.actual_cost && (
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-sm text-gray-300">Tatsächlich:</span>
                                <span className="text-lg font-bold text-green-300">{budgetItem.actual_cost}€</span>
                              </div>
                            )}
                          </div>
                        )}
                        {vendor && (
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 hover:border-blue-500/50 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-white text-lg">👤</span>
                              </div>
                              <p className="text-xs text-blue-400 font-bold uppercase tracking-wide">Dienstleister</p>
                            </div>
                            <p className="text-lg font-bold text-white mb-2">{vendor.name}</p>
                            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold">
                              {vendor.category}
                            </span>
                            {vendor.email && (
                              <p className="text-xs text-gray-400 mt-2">{vendor.email}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {imageAttachments.length > 0 && (
                    <div className="bg-[#0a1929]/50 border border-gray-800 rounded-xl p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-[#d4af37]" />
                        Bildanhänge ({imageAttachments.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {imageAttachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="relative group aspect-square rounded-xl overflow-hidden bg-gray-800 border border-gray-700 hover:border-[#d4af37] transition-all cursor-pointer"
                            onClick={() => setLightboxImage(attachment.file_url)}
                          >
                            <img
                              src={attachment.file_url}
                              alt={attachment.file_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-8 h-8 text-white" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                              <p className="text-xs text-white truncate">{attachment.file_name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {otherAttachments.length > 0 && (
                    <div className="bg-[#0a1929]/50 border border-gray-800 rounded-xl p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Paperclip className="w-5 h-5 text-[#d4af37]" />
                        Weitere Dateien ({otherAttachments.length})
                      </h3>
                      <div className="space-y-2">
                        {otherAttachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-[#d4af37] transition-all group"
                          >
                            <div className="flex-shrink-0">
                              {isPdfFile(attachment.file_type) ? (
                                <FileText className="w-6 h-6 text-red-400" />
                              ) : (
                                <File className="w-6 h-6 text-[#d4af37]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{attachment.file_name}</p>
                              <p className="text-xs text-gray-400">{formatFileSize(attachment.file_size)}</p>
                            </div>
                            <a
                              href={attachment.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <Download className="w-5 h-5 text-[#d4af37]" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className={`border-2 border-dashed rounded-xl p-6 transition-all ${
                      dragActive
                        ? 'border-[#d4af37] bg-[#d4af37]/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <label className="flex flex-col items-center justify-center cursor-pointer">
                      <Upload className={`w-10 h-10 mb-2 ${dragActive ? 'text-[#d4af37]' : 'text-gray-400'}`} />
                      <p className="text-sm text-white font-semibold">
                        {uploading ? 'Lädt hoch...' : dragActive ? 'Dateien hier ablegen' : 'Dateien hochladen'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Klicken oder Dateien hierher ziehen</p>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleFileUpload(e.target.files)}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-[#0a1929]/50 border border-gray-800 rounded-xl p-4 hover:bg-[#0a1929]/70 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-gray-200 whitespace-pre-wrap">{comment.comment}</p>
                        <p className="text-xs text-gray-400 mt-2">{formatDateTime(comment.created_at)}</p>
                      </div>
                      {comment.user_id === userId && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-[#d4af37] mx-auto mb-4 opacity-50" />
                    <p className="text-gray-400">Noch keine Kommentare vorhanden</p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-[#0a1929] pt-3 sm:pt-4 border-t border-gray-800">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Kommentar hinzufügen..."
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-[#0a1929] border border-gray-700 text-white placeholder-gray-500 focus:border-[#d4af37] focus:outline-none resize-none text-sm"
                    rows={2}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all sm:self-end text-sm min-h-[40px]"
                  >
                    <span className="sm:hidden">Senden</span>
                    <Send className="w-4 h-4 hidden sm:block" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4 sm:space-y-6">
              <div
                className={`border-2 border-dashed rounded-xl p-8 transition-all ${
                  dragActive
                    ? 'border-[#d4af37] bg-[#d4af37]/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className={`w-12 h-12 mb-3 ${dragActive ? 'text-[#d4af37]' : 'text-gray-400'}`} />
                  <p className="text-base text-white font-semibold">
                    {uploading ? 'Lädt hoch...' : dragActive ? 'Dateien hier ablegen' : 'Dateien hochladen'}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Klicken oder Dateien hierher ziehen</p>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files)}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {imageAttachments.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-white mb-3">Bilder</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {imageAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="relative group aspect-square rounded-xl overflow-hidden bg-gray-800 border border-gray-700 hover:border-[#d4af37] transition-all"
                      >
                        <img
                          src={attachment.file_url}
                          alt={attachment.file_name}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setLightboxImage(attachment.file_url)}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => setLightboxImage(attachment.file_url)}
                            className="p-2 bg-[#d4af37] rounded-lg hover:bg-[#c19a2e] transition-colors"
                          >
                            <ZoomIn className="w-5 h-5 text-black" />
                          </button>
                          {attachment.uploaded_by === userId && (
                            <button
                              onClick={() => handleDeleteAttachment(attachment.id, attachment.file_url)}
                              className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="w-5 h-5 text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {otherAttachments.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-white mb-3">Weitere Dateien</h3>
                  <div className="space-y-2">
                    {otherAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-4 p-4 bg-[#0a1929]/50 border border-gray-800 rounded-xl hover:bg-[#0a1929]/70 transition-all group"
                      >
                        <div className="flex-shrink-0">
                          {isPdfFile(attachment.file_type) ? (
                            <FileText className="w-8 h-8 text-red-400" />
                          ) : (
                            <File className="w-8 h-8 text-[#d4af37]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{attachment.file_name}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                            <span>{formatFileSize(attachment.file_size)}</span>
                            <span>•</span>
                            <span>{formatDateTime(attachment.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={attachment.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Download className="w-5 h-5 text-[#d4af37]" />
                          </a>
                          {attachment.uploaded_by === userId && (
                            <button
                              onClick={() => handleDeleteAttachment(attachment.id, attachment.file_url)}
                              className="p-2 hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-5 h-5 text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {attachments.length === 0 && (
                <div className="text-center py-12">
                  <Paperclip className="w-16 h-16 text-[#d4af37] mx-auto mb-4 opacity-50" />
                  <p className="text-gray-400">Noch keine Anhänge vorhanden</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          style={{ zIndex: 999999 }}
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={lightboxImage}
            alt="Vorschau"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
