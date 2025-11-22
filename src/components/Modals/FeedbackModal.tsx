import { useState, useEffect } from 'react';
import { X, MessageSquare, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface FeedbackModalProps {
  onClose: () => void;
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [feedbackText, setFeedbackText] = useState('');
  const [satisfactionRating, setSatisfactionRating] = useState<number | null>(null);
  const [allowPublicUse, setAllowPublicUse] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAlreadySubmitted, setHasAlreadySubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    checkIfSubmitted();
  }, []);

  const checkIfSubmitted = async () => {
    try {
      const { data, error } = await supabase.rpc('has_submitted_feedback');

      if (error) {
        console.error('Error checking feedback status:', error);
      } else {
        setHasAlreadySubmitted(data || false);
      }
    } catch (error) {
      console.error('Error checking feedback status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (feedbackText.trim().length < 10) {
      showToast('error', 'Fehler', 'Feedback muss mindestens 10 Zeichen lang sein');
      return;
    }

    if (!allowPublicUse) {
      showToast('warning', 'Hinweis', 'Bitte erlaube die öffentliche Nutzung deines Feedbacks');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('submit_user_feedback', {
        p_feedback_text: feedbackText.trim(),
        p_satisfaction_rating: satisfactionRating,
        p_allow_public_use: allowPublicUse
      });

      if (error) {
        throw error;
      }

      if (data && typeof data === 'object' && 'success' in data) {
        if (data.success) {
          showToast('success', 'Erfolgreich!', data.message || 'Vielen Dank für dein Feedback!');
          onClose();
        } else {
          showToast('error', 'Fehler', data.error || 'Ein Fehler ist aufgetreten');
        }
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      showToast('error', 'Fehler', error.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = feedbackText.trim().length >= 10 && allowPublicUse;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-2xl max-w-2xl w-full mx-4 p-6">
          <div className="text-white text-center">Lade...</div>
        </div>
      </div>
    );
  }

  if (hasAlreadySubmitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-start gap-4 p-6 border-b border-gray-700">
            <div className="bg-[#F5B800] p-3 rounded-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">Feedback bereits eingereicht</h2>
              <p className="text-sm text-gray-300 mt-1">Du hast bereits Feedback eingereicht</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                Vielen Dank für dein Feedback! Du hast bereits Feedback eingereicht und kannst dies nur einmal tun.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-[#F5B800] hover:bg-[#E0A800] text-gray-900 font-medium transition-all"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-700">
          <div className="bg-[#F5B800] p-3 rounded-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Dein Feedback</h2>
            <p className="text-sm text-gray-300 mt-1">
              Teile deine Erfahrung mit uns und erhalte 3 zusätzliche Testtage
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Feedback Text */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Dein Feedback <span className="text-red-400">*</span>
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Erzähle uns von deiner Erfahrung mit der Hochzeitsplaner-App... (mindestens 10 Zeichen)"
              className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 outline-none transition-all resize-none"
              rows={5}
            />
            <p className="text-xs text-gray-400 mt-1">
              {feedbackText.length} / mindestens 10 Zeichen
            </p>
          </div>

          {/* Satisfaction Rating */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Wie zufrieden bist du? (Optional)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSatisfactionRating(rating)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    satisfactionRating === rating
                      ? 'bg-[#F5B800] border-[#F5B800] text-gray-900'
                      : 'bg-[#1a3a5c] border-gray-600 text-gray-300 hover:border-[#F5B800]/50'
                  }`}
                >
                  <Star
                    className={`w-5 h-5 mx-auto ${
                      satisfactionRating === rating ? 'fill-gray-900' : ''
                    }`}
                  />
                  <span className="text-xs mt-1 block">{rating}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              1 = Unzufrieden, 5 = Sehr zufrieden
            </p>
          </div>

          {/* Public Use Checkbox */}
          <div className="bg-[#0A1F3D]/50 border border-gray-700 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPublicUse}
                onChange={(e) => setAllowPublicUse(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-600 text-[#F5B800] focus:ring-[#F5B800] focus:ring-offset-0 bg-[#1a3a5c]"
              />
              <div className="flex-1">
                <span className="text-sm text-white font-medium">
                  Mit dem Absenden des Feedbacks erlaube ich die öffentliche Nutzung dieses Feedbacks{' '}
                  <span className="text-red-400">*</span>
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  Wir können dein Feedback auf unserer Website und in Marketing-Materialien verwenden.
                  Deine E-Mail-Adresse wird nicht veröffentlicht.
                </p>
              </div>
            </label>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              <strong>Belohnung:</strong> Als Dankeschön für dein Feedback erhältst du automatisch{' '}
              <strong>3 zusätzliche Testtage</strong>, wenn du dich aktuell in der Testphase befindest.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-gray-300 border border-gray-600 hover:bg-gray-700/30 transition-all"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              isFormValid && !isSubmitting
                ? 'bg-[#F5B800] hover:bg-[#E0A800] text-gray-900'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Wird gesendet...' : 'Feedback absenden'}
          </button>
        </div>
      </div>
    </div>
  );
}
