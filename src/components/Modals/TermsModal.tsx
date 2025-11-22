import { FileText, CheckCircle } from 'lucide-react';

export default function TermsModal() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 rounded-xl border border-[#d4af37]/20">
        <FileText className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-white mb-1">Allgemeine Geschäftsbedingungen</h3>
          <p className="text-gray-200 text-sm leading-relaxed">
            Kurze Zusammenfassung der wichtigsten Regeln für die Nutzung von Traumtag Helden.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-white mb-3">Die wichtigsten Punkte</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white mb-1">Nur für private Nutzung</h4>
                <p className="text-gray-200 text-sm leading-relaxed">
                  Traumtag Helden ist für eure private Hochzeitsplanung gedacht. Gewerbliche Nutzung (z.B. als Wedding Planner für Kunden) ist nur nach Absprache erlaubt.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white mb-1">Account & Zugangsdaten</h4>
                <p className="text-gray-200 text-sm leading-relaxed">
                  Ihr seid für eure Zugangsdaten verantwortlich. Teilt euer Passwort nur mit eurem Partner und verwendet ein sicheres Passwort.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white mb-1">Abonnement & Kündigung</h4>
                <p className="text-gray-200 text-sm leading-relaxed">
                  Premium ist monatlich kündbar – ohne versteckte Kosten oder Fallstricke. Nach der Kündigung könnt ihr weiterhin den Free-Plan nutzen, eure Daten bleiben erhalten.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white mb-1">Verfügbarkeit & Support</h4>
                <p className="text-gray-200 text-sm leading-relaxed">
                  Wir bemühen uns, die App rund um die Uhr verfügbar zu halten. Wartungsarbeiten kündigen wir rechtzeitig an. Bei Fragen steht euch unser Support-Team zur Verfügung.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white mb-1">Eure Inhalte</h4>
                <p className="text-gray-200 text-sm leading-relaxed">
                  Alle Daten, die ihr in die App eingebt (Texte, Fotos, Listen), gehören euch. Wir verwenden sie nur, um die App-Funktionen für euch bereitzustellen. Ihr könnt sie jederzeit exportieren oder löschen.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white mb-1">Haftung</h4>
                <p className="text-gray-200 text-sm leading-relaxed">
                  Wir geben unser Bestes, um die App fehlerfrei zu betreiben. Dennoch können wir keine Garantie für Vollständigkeit oder Fehlerfreiheit geben. Nutzt die App als Planungshilfe und verlasst euch bei wichtigen Terminen auf zusätzliche Absicherungen.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white mb-1">Änderungen der AGB</h4>
                <p className="text-gray-200 text-sm leading-relaxed">
                  Wir informieren euch rechtzeitig über wichtige Änderungen dieser Bedingungen. Bei wesentlichen Änderungen habt ihr ein Sonderkündigungsrecht.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-600 pt-6">
          <h3 className="font-bold text-white mb-3">Rechtliches</h3>
          <div className="text-gray-200 text-sm space-y-2 leading-relaxed">
            <p>
              <span className="font-semibold">Gerichtsstand:</span> Deutschland, nach deutschem Recht
            </p>
            <p>
              <span className="font-semibold">Salvatorische Klausel:</span> Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 rounded-xl p-6 border border-[#d4af37]/20">
        <p className="text-gray-200 text-sm leading-relaxed">
          <span className="font-semibold text-white">Fragen zu den AGB?</span> Schreibt uns an{' '}
          <a href="mailto:legal@traumtag-helden.de" className="text-[#d4af37] hover:text-[#c19a2e] underline">
            legal@traumtag-helden.de
          </a>{' '}
          – wir helfen gerne weiter.
        </p>
      </div>

      <div className="border-t border-gray-600 pt-6">
        <p className="text-gray-400 text-xs leading-relaxed">
          Stand: Januar 2025. Die vollständigen, juristisch formulierten AGB findet ihr nach dem Login in den Einstellungen. Diese Zusammenfassung dient eurem schnellen Verständnis.
        </p>
      </div>
    </div>
  );
}
