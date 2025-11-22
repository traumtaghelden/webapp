import { useState, useEffect } from 'react';
import { Mail, Send, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

export default function ContactTab() {
  const { showToast } = useToast();
  const [userEmail, setUserEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>({});

  useEffect(() => {
    const loadUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    loadUserEmail();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: { subject?: string; message?: string } = {};

    if (!subject.trim()) {
      newErrors.subject = 'Bitte geben Sie einen Betreff ein';
    }

    if (!message.trim()) {
      newErrors.message = 'Bitte geben Sie eine Nachricht ein';
    } else if (message.trim().length < 20) {
      newErrors.message = 'Die Nachricht muss mindestens 20 Zeichen lang sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-support-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          userEmail,
          subject,
          message,
          priority,
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Senden der Nachricht');
      }

      showToast('Nachricht erfolgreich gesendet! Wir melden uns bald bei Ihnen.', 'success');

      setSubject('');
      setMessage('');
      setPriority('normal');
      setErrors({});
    } catch (error) {
      console.error('Error sending support email:', error);
      showToast('Fehler beim Senden der Nachricht. Bitte versuchen Sie es später erneut.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-[#0a253c] mb-2">Kontakt aufnehmen</h3>
        <p className="text-[#666666]">Haben Sie Fragen oder benötigen Sie Unterstützung? Schreiben Sie uns eine Nachricht.</p>
      </div>

      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-2xl p-6 md:p-8 shadow-lg border border-[#d4af37]/10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#0a253c] mb-2">
              Ihre E-Mail-Adresse
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
              <input
                type="email"
                value={userEmail}
                readOnly
                className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 pl-11 text-[#0a253c] cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-[#666666] mt-1">Diese E-Mail-Adresse wird für unsere Antwort verwendet</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0a253c] mb-2">
              Betreff <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) setErrors({ ...errors, subject: undefined });
              }}
              placeholder="z.B. Frage zur Budget-Verwaltung"
              className={`w-full bg-white border rounded-xl px-4 py-3 text-[#0a253c] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all ${
                errors.subject ? 'border-red-500' : 'border-gray-300 focus:border-[#d4af37]'
              }`}
            />
            {errors.subject && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.subject}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0a253c] mb-2">
              Priorität
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#0a253c] focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/50 transition-all cursor-pointer"
            >
              <option value="low">Niedrig - Allgemeine Frage</option>
              <option value="normal">Normal - Standard-Anfrage</option>
              <option value="high">Hoch - Dringendes Problem</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0a253c] mb-2">
              Nachricht <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors({ ...errors, message: undefined });
              }}
              placeholder="Beschreiben Sie Ihr Anliegen so detailliert wie möglich..."
              rows={8}
              className={`w-full bg-white border rounded-xl px-4 py-3 text-[#0a253c] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all resize-none ${
                errors.message ? 'border-red-500' : 'border-gray-300 focus:border-[#d4af37]'
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              <div>
                {errors.message && (
                  <div className="flex items-center gap-1 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.message}</span>
                  </div>
                )}
              </div>
              <span className={`text-xs ${message.length < 20 ? 'text-red-500' : 'text-[#666666]'}`}>
                {message.length} / 20 Zeichen (min.)
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white font-semibold rounded-xl hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 min-h-[48px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Wird gesendet...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Nachricht senden</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-gradient-to-br from-[#0a253c] to-[#1a3a5c] rounded-xl p-6 text-white">
        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#d4af37]" />
          Direkt-Kontakt
        </h4>
        <p className="text-white/80 text-sm leading-relaxed">
          Sie können uns auch direkt per E-Mail erreichen: <a href="mailto:sven@traumtaghelden.de" className="text-[#d4af37] hover:underline font-semibold">sven@traumtaghelden.de</a>
        </p>
        <p className="text-white/60 text-xs mt-2">
          Wir antworten in der Regel innerhalb von 24 Stunden (Werktags).
        </p>
      </div>
    </div>
  );
}
