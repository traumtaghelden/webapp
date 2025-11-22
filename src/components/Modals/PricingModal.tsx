import { Check, Crown, Sparkles } from 'lucide-react';
import { emitModalEvent, openModal } from '../../lib/modalManager';

export default function PricingModal() {
  return (
    <div className="space-y-6">
      <p className="text-gray-300 leading-relaxed text-center">
        Teste alle Premium-Features 14 Tage kostenlos. Danach nur 29,99€ pro Monat - jederzeit kündbar.
      </p>

      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl border-2 border-[#d4af37] p-8 bg-gradient-to-br from-[#d4af37]/10 to-[#f4d03f]/10 relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <div className="bg-[#d4af37] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Crown className="w-3 h-3" />
              PREMIUM
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-3xl font-bold text-white mb-2">Premium</h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-bold text-white">29,99€</span>
              <span className="text-gray-400 text-lg">/ Monat</span>
            </div>
            <div className="bg-green-500/20 text-green-400 text-sm font-medium px-3 py-1.5 rounded-full inline-block mb-3 border border-green-500/30">
              14 Tage kostenlos testen
            </div>
            <p className="text-gray-300">
              Alle Features inklusive - unbegrenzt planen, organisieren und entspannt zur Traumhochzeit.
            </p>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <span className="text-white font-semibold">Unbegrenzte Gäste & Familien</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <span className="text-white font-semibold">Unbegrenzte Budget-Einträge</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <span className="text-white font-semibold">Unbegrenzte Timeline-Events & Puffer</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <span className="text-white font-semibold">Block-Planung für Timeline</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <span className="text-white font-semibold">Unbegrenzte Dienstleister & Locations</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <span className="text-white font-semibold">Erweiterte Budget-Analysen & Charts</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <span className="text-white font-semibold">Automatische Budget-Synchronisation</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <span className="text-white font-semibold">PDF & CSV Export</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <span className="text-white font-semibold">Kein Wasserzeichen</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <span className="text-white font-semibold">Priority Support</span>
            </li>
          </ul>

          <button
            onClick={() => emitModalEvent('modal:pricing:upgrade')}
            className="w-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#f4d03f] hover:to-[#d4af37] text-[#0a253c] px-6 py-4 rounded-full font-bold transition-all shadow-lg shadow-[#d4af37]/20 text-lg"
          >
            14 Tage kostenlos testen
          </button>

          <p className="text-center text-gray-400 text-xs mt-4">
            Keine Zahlungsdaten während der Testphase. Jederzeit kündbar.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#0a253c] to-[#1a3a5c] rounded-xl p-6 border border-[#d4af37]/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-[#f4d03f] flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-white mb-2">Warum Premium?</h4>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              Mit Premium plant ihr eure Hochzeit ohne Limits - egal ob 50 oder 500 Gäste, 10 oder 100 Aufgaben.
              Alle Features stehen euch 14 Tage kostenlos zur Verfügung. Nach der Testphase entscheidet ihr,
              ob ihr für 29,99€/Monat weitermachen möchtet.
            </p>
            <button
              onClick={() => openModal('features')}
              className="text-[#d4af37] hover:text-[#f4d03f] font-semibold text-sm transition-colors"
            >
              Alle Features im Detail →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
