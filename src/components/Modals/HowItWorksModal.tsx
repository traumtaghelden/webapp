import { Heart, Calendar, DollarSign, CheckCircle, Sparkles } from 'lucide-react';
import { openModal } from '../../lib/modalManager';

export default function HowItWorksModal() {
  return (
    <div className="space-y-6">
      <p className="text-gray-300 leading-relaxed">
        In nur wenigen Schritten seid ihr bereit, eure Traumhochzeit zu planen. Wir führen euch durch den gesamten Prozess – von der ersten Idee bis zum großen Tag.
      </p>

      <div className="space-y-6">
        <div className="relative pl-12">
          <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] flex items-center justify-center shadow-lg shadow-[#d4af37]/30">
            <span className="text-white font-bold">1</span>
          </div>
          <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-[#d4af37] to-transparent"></div>

          <div className="pb-8">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-[#d4af37]" />
              <h3 className="font-bold text-white text-lg">Profil erstellen</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Gebt eure Namen, das Hochzeitsdatum und ein paar Eckdaten ein. In weniger als 2 Minuten seid ihr startklar und könnt euer persönliches Dashboard sehen.
            </p>
          </div>
        </div>

        <div className="relative pl-12">
          <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] flex items-center justify-center shadow-lg shadow-[#d4af37]/30">
            <span className="text-white font-bold">2</span>
          </div>
          <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-[#d4af37] to-transparent"></div>

          <div className="pb-8">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-[#d4af37]" />
              <h3 className="font-bold text-white text-lg">Budget planen</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Legt euer Gesamtbudget fest und verteilt es auf Kategorien wie Location, Catering, Dekoration. Unser System hilft euch, die Kosten im Blick zu behalten.
            </p>
          </div>
        </div>

        <div className="relative pl-12">
          <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] flex items-center justify-center shadow-lg shadow-[#d4af37]/30">
            <span className="text-white font-bold">3</span>
          </div>
          <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-[#d4af37] to-transparent"></div>

          <div className="pb-8">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-[#d4af37]" />
              <h3 className="font-bold text-white text-lg">Aufgaben organisieren</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Wir geben euch Starter-Aufgaben vor, die ihr nach Belieben anpassen könnt. Fügt eigene To-dos hinzu, setzt Deadlines und behaltet den Fortschritt im Blick.
            </p>
          </div>
        </div>

        <div className="relative pl-12">
          <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] flex items-center justify-center shadow-lg shadow-[#d4af37]/30">
            <span className="text-white font-bold">4</span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-[#d4af37]" />
              <h3 className="font-bold text-white text-lg">Timeline gestalten</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              Plant euren Hochzeitstag minutengenau: Trauung, Empfang, Dinner, Party. Jedes Event wird zu einem planbaren Block mit Gästen, Dienstleistern und Budget.
            </p>
            <div className="inline-block bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold border border-green-500/30">
              Fertig! Ihr seid startklar.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#0a253c] to-[#1a3a5c] rounded-xl p-6 text-white border border-[#d4af37]/20">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-6 h-6 text-[#f4d03f]" />
          <h3 className="font-bold text-xl">Loslegen ist kinderleicht</h3>
        </div>
        <p className="text-gray-300 mb-4">
          Ihr könnt jederzeit starten, pausieren und weitermachen. Eure Daten sind sicher gespeichert und von überall zugänglich.
        </p>
        <button
          onClick={() => openModal('login')}
          className="w-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#f4d03f] hover:to-[#d4af37] text-[#0a253c] px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-[#d4af37]/20"
        >
          Jetzt starten
        </button>
      </div>

      <div className="text-center">
        <p className="text-gray-400 text-sm mb-2">Noch Fragen?</p>
        <button
          onClick={() => openModal('faq')}
          className="text-[#d4af37] hover:text-[#f4d03f] font-semibold transition-colors"
        >
          Zu den häufig gestellten Fragen →
        </button>
      </div>
    </div>
  );
}
