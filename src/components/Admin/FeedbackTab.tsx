import { useState, useEffect } from 'react';
import { MessageSquare, Star, Eye, EyeOff, Search, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Feedback {
  id: string;
  user_email: string;
  feedback_text: string;
  satisfaction_rating: number | null;
  allow_public_use: boolean;
  admin_hidden: boolean;
  created_at: string;
}

interface FeedbackResponse {
  id: string;
  user_email: string;
  feedback_text: string;
  satisfaction_rating: number | null;
  allow_public_use: boolean;
  admin_hidden: boolean;
  created_at: string;
  total_count: string;
}

export default function FeedbackTab() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [onlyPublic, setOnlyPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    publicApproved: 0,
    averageRating: 0
  });

  const itemsPerPage = 20;

  useEffect(() => {
    loadFeedbacks();
    loadStats();
  }, [currentPage, searchText, onlyPublic]);

  const loadFeedbacks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_all_feedback_admin', {
        p_only_public: onlyPublic,
        p_search_text: searchText || null,
        p_limit: itemsPerPage,
        p_offset: (currentPage - 1) * itemsPerPage
      });

      if (error) {
        console.error('Error loading feedbacks:', error);
        return;
      }

      if (data && data.length > 0) {
        const feedbacksData: Feedback[] = data.map((item: FeedbackResponse) => ({
          id: item.id,
          user_email: item.user_email,
          feedback_text: item.feedback_text,
          satisfaction_rating: item.satisfaction_rating,
          allow_public_use: item.allow_public_use,
          admin_hidden: item.admin_hidden,
          created_at: item.created_at
        }));

        setFeedbacks(feedbacksData);
        setTotalCount(parseInt(data[0].total_count));
      } else {
        setFeedbacks([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error loading feedbacks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_feedback_admin', {
        p_only_public: false,
        p_search_text: null,
        p_limit: 1000,
        p_offset: 0
      });

      if (error) {
        console.error('Error loading stats:', error);
        return;
      }

      if (data && data.length > 0) {
        const total = data.length;
        const publicApproved = data.filter((f: FeedbackResponse) => f.allow_public_use).length;
        const ratingsSum = data
          .filter((f: FeedbackResponse) => f.satisfaction_rating !== null)
          .reduce((sum: number, f: FeedbackResponse) => sum + (f.satisfaction_rating || 0), 0);
        const ratingsCount = data.filter((f: FeedbackResponse) => f.satisfaction_rating !== null).length;
        const averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

        setStats({
          total,
          publicApproved,
          averageRating: Math.round(averageRating * 10) / 10
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleToggleVisibility = async (feedbackId: string) => {
    try {
      const { data, error } = await supabase.rpc('toggle_feedback_visibility', {
        p_feedback_id: feedbackId
      });

      if (error) {
        console.error('Error toggling visibility:', error);
        return;
      }

      if (data && typeof data === 'object' && 'success' in data && data.success) {
        loadFeedbacks();
        loadStats();
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#0A1F3D] to-[#1a3a5c] rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#F5B800]/20 p-2 rounded-lg">
              <MessageSquare className="w-5 h-5 text-[#F5B800]" />
            </div>
            <h3 className="text-sm font-medium text-gray-400">Gesamt-Feedbacks</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="bg-gradient-to-br from-[#0A1F3D] to-[#1a3a5c] rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-500/20 p-2 rounded-lg">
              <Eye className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-400">Öffentlich freigegeben</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.publicApproved}</p>
        </div>

        <div className="bg-gradient-to-br from-[#0A1F3D] to-[#1a3a5c] rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#F5B800]/20 p-2 rounded-lg">
              <Star className="w-5 h-5 text-[#F5B800]" />
            </div>
            <h3 className="text-sm font-medium text-gray-400">Durchschn. Zufriedenheit</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'} / 5
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-[#0A1F3D] to-[#1a3a5c] rounded-xl p-4 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suche nach Feedback-Text oder E-Mail..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 outline-none transition-all"
            />
          </div>

          {/* Public Filter Toggle */}
          <button
            onClick={() => {
              setOnlyPublic(!onlyPublic);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              onlyPublic
                ? 'bg-[#F5B800] text-gray-900'
                : 'bg-[#1a3a5c] text-gray-300 border border-gray-600 hover:bg-gray-700/30'
            }`}
          >
            <Filter className="w-4 h-4" />
            Nur öffentliche
          </button>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-gradient-to-br from-[#0A1F3D] to-[#1a3a5c] rounded-xl border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Lade Feedbacks...</div>
        ) : feedbacks.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Keine Feedbacks gefunden.
            {searchText && ' Versuche eine andere Suche.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0A1F3D]/50 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Benutzer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Feedback
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Bewertung
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Öffentlich
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {feedbacks.map((feedback) => (
                  <tr
                    key={feedback.id}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedFeedback(feedback)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(feedback.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {feedback.user_email}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300 max-w-md">
                      <div className="line-clamp-2">{feedback.feedback_text}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {feedback.satisfaction_rating ? (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-[#F5B800] fill-[#F5B800]" />
                          <span className="text-sm font-medium text-white">
                            {feedback.satisfaction_rating}/5
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {feedback.allow_public_use ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          Ja
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                          Nein
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(feedback.id);
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          feedback.admin_hidden
                            ? 'bg-gray-600/30 text-gray-400 hover:bg-gray-600/50'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                        title={feedback.admin_hidden ? 'Versteckt' : 'Sichtbar'}
                      >
                        {feedback.admin_hidden ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        {feedback.admin_hidden ? 'Versteckt' : 'Sichtbar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
            <div className="text-sm text-gray-400">
              Seite {currentPage} von {totalPages} ({totalCount} Feedbacks gesamt)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-[#1a3a5c] text-gray-300 border border-gray-600 hover:bg-gray-700/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-[#1a3a5c] text-gray-300 border border-gray-600 hover:bg-gray-700/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-start gap-4 p-6 border-b border-gray-700">
              <div className="bg-[#F5B800] p-3 rounded-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">Feedback Details</h2>
                <p className="text-sm text-gray-300 mt-1">
                  Von {selectedFeedback.user_email}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(selectedFeedback.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Rating */}
              {selectedFeedback.satisfaction_rating && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Zufriedenheitsbewertung
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 ${
                          star <= (selectedFeedback.satisfaction_rating || 0)
                            ? 'text-[#F5B800] fill-[#F5B800]'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                    <span className="text-lg font-medium text-white ml-2">
                      {selectedFeedback.satisfaction_rating} / 5
                    </span>
                  </div>
                </div>
              )}

              {/* Feedback Text */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Feedback-Text
                </label>
                <div className="bg-[#1a3a5c] border border-gray-600 rounded-lg p-4 text-white whitespace-pre-wrap">
                  {selectedFeedback.feedback_text}
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Öffentliche Nutzung
                  </label>
                  {selectedFeedback.allow_public_use ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/20 text-green-400">
                      <Eye className="w-4 h-4" />
                      Erlaubt
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400">
                      <EyeOff className="w-4 h-4" />
                      Nicht erlaubt
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Admin-Sichtbarkeit
                  </label>
                  {selectedFeedback.admin_hidden ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600/30 text-gray-400">
                      <EyeOff className="w-4 h-4" />
                      Versteckt
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/20 text-green-400">
                      <Eye className="w-4 h-4" />
                      Sichtbar
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center gap-3 p-6 border-t border-gray-700">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleVisibility(selectedFeedback.id);
                  setSelectedFeedback({
                    ...selectedFeedback,
                    admin_hidden: !selectedFeedback.admin_hidden
                  });
                }}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  selectedFeedback.admin_hidden
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'bg-gray-600/30 text-gray-400 hover:bg-gray-600/50'
                }`}
              >
                {selectedFeedback.admin_hidden ? (
                  <>
                    <Eye className="w-4 h-4 inline mr-2" />
                    Sichtbar machen
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 inline mr-2" />
                    Verstecken
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-6 py-2.5 rounded-lg bg-[#F5B800] hover:bg-[#E0A800] text-gray-900 font-medium transition-all"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
