import { Heart, Sparkles, ArrowRight, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { emitModalEvent, openModal } from '../../lib/modalManager';

export default function StartModal() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      return;
    }

    emitModalEvent('cta:start', {
      email: formData.email,
      name: formData.name,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] mb-4 animate-float shadow-lg shadow-[#d4af37]/30">
          <Heart className="w-10 h-10 text-white fill-current" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">
          Startet eure Heldenreise
        </h3>
        <p className="text-gray-300 leading-relaxed">
          In weniger als 2 Minuten seid ihr bereit, eure Traumhochzeit zu planen. Kostenlos und ohne Verpflichtung.
        </p>
      </div>

      <div className="bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 rounded-xl p-6 border border-[#d4af37]/30">
        <div className="flex items-start gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-white mb-1">Was euch erwartet:</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-[#d4af37]">✓</span>
                <span>Sofortiger Zugriff auf alle Free Features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#d4af37]">✓</span>
                <span>Persönliches Dashboard mit Fortschritts-Tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#d4af37]">✓</span>
                <span>Intelligente Starter-Aufgaben für euren Einstieg</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#d4af37]">✓</span>
                <span>Jederzeit upgraden auf Premium möglich</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="start-email" className="block text-sm font-semibold text-white mb-2">
            E-Mail-Adresse <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              id="start-email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1a3a5c] border-2 border-gray-600 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 focus:outline-none transition-all"
              placeholder="eure@email.de"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="start-name" className="block text-sm font-semibold text-white mb-2">
            Name (optional)
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id="start-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1a3a5c] border-2 border-gray-600 text-white placeholder-gray-400 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 focus:outline-none transition-all"
              placeholder="z.B. Lisa & Tom"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#f4d03f] hover:to-[#d4af37] text-[#0a253c] px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-2 group"
        >
          <span>Jetzt kostenlos starten</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>

      <div className="text-center">
        <p className="text-gray-400 text-sm mb-2">Habt ihr bereits einen Account?</p>
        <button
          onClick={() => openModal('login')}
          className="text-[#d4af37] hover:text-[#f4d03f] font-semibold transition-colors"
        >
          Hier einloggen →
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <p className="text-gray-400 text-xs text-center leading-relaxed">
          Mit der Registrierung akzeptiert ihr unsere AGB und Datenschutzerklärung. Keine Kreditkarte erforderlich. Jederzeit kündbar.
        </p>
      </div>
    </div>
  );
}
