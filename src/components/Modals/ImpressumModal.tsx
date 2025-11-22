import { Building2, Mail } from 'lucide-react';

export default function ImpressumModal() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#d4af37]" />
            Angaben gemäß § 5 TMG
          </h3>
          <div className="text-gray-300 space-y-1">
            <p className="font-semibold">TraumtagHelden</p>
            <p>Sven Waitz</p>
            <p>c/o F2BII E-Commerce#105</p>
            <p>Hintergoldingerstrasse 30</p>
            <p>8638 Goldingen</p>
            <p>Schweiz</p>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-white mb-2">Vertreten durch</h3>
          <p className="text-gray-300">Sven Waitz</p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#d4af37]" />
            Kontakt
          </h3>
          <div className="text-gray-300 space-y-1">
            <p>E-Mail: sven@traumtaghelden.de</p>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-white mb-2">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h3>
          <div className="text-gray-300">
            <p>Sven Waitz</p>
            <p>Hintergoldingerstrasse 30</p>
            <p>8638 Goldingen</p>
            <p>Schweiz</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <h3 className="font-bold text-white mb-3">Haftungsausschluss</h3>

        <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
          <div>
            <h4 className="font-semibold text-white mb-1">Haftung für Inhalte</h4>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-1">Haftung für Links</h4>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Dienstleister oder Betreiber der Seiten verantwortlich.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-1">Urheberrecht</h4>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
