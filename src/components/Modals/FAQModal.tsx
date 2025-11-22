import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { emitModalEvent } from '../../lib/modalManager';

export default function FAQModal() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Was kostet die Nutzung von Traumtag Helden?',
      answer: 'Wir bieten einen kostenlosen Plan mit allen Basis-Features für kleinere Hochzeiten (bis 50 Gäste). Für größere Hochzeiten und erweiterte Funktionen gibt es Premium für 29,99€/Monat – jederzeit kündbar.',
    },
    {
      question: 'Wie sicher sind meine Daten?',
      answer: 'Eure Daten werden verschlüsselt und sicher in der EU gespeichert. Wir halten uns streng an die DSGVO und geben niemals Daten an Dritte weiter. Ihr habt jederzeit volle Kontrolle und könnt eure Daten exportieren oder löschen.',
    },
    {
      question: 'Kann ich jederzeit upgraden oder kündigen?',
      answer: 'Ja, absolut! Ihr könnt jederzeit zwischen Free und Premium wechseln. Premium ist monatlich kündbar, keine lange Vertragsbindung. Auch nach dem Downgrade bleiben eure Daten erhalten.',
    },
    {
      question: 'Funktioniert es auch auf dem Smartphone?',
      answer: 'Ja! Traumtag Helden ist vollständig responsive und funktioniert perfekt auf Smartphones, Tablets und Desktops. Plant von überall aus, wann immer ihr möchtet.',
    },
    {
      question: 'Was passiert nach der Hochzeit mit meinen Daten?',
      answer: 'Eure Daten bleiben unbegrenzt gespeichert und ihr könnt sie jederzeit als digitale Erinnerung behalten, exportieren oder für andere Events nutzen. Kein Zeitlimit!',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 rounded-xl border border-[#d4af37]/30">
        <HelpCircle className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-white mb-1">Häufig gestellte Fragen</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            Hier findet ihr Antworten auf die wichtigsten Fragen rund um Traumtag Helden. Fehlt etwas? Meldet euch gerne bei uns!
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border-2 border-gray-700 rounded-xl overflow-hidden transition-all hover:border-[#d4af37]/50 bg-gradient-to-br from-[#1a3a5c]/30 to-[#0a253c]/30"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
              aria-expanded={openIndex === index}
            >
              <span className="font-semibold text-white pr-4">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-[#d4af37] flex-shrink-0 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openIndex === index && (
              <div className="px-4 pb-4 animate-fade-in">
                <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 rounded-xl p-6 border border-[#d4af37]/30">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-6 h-6 text-[#d4af37]" />
          <h3 className="font-bold text-white">Weitere Fragen?</h3>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          Wir helfen euch gerne weiter! Schickt uns eine Nachricht und wir antworten schnellstmöglich.
        </p>
        <button
          onClick={() => emitModalEvent('modal:faq:more')}
          className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#f4d03f] hover:to-[#d4af37] text-[#0a253c] px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-[#d4af37]/20"
        >
          Kontakt aufnehmen
        </button>
      </div>
    </div>
  );
}
