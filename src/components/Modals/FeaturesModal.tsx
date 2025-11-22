import { CheckCircle, Calendar, Users, DollarSign, Clock, Building2, Sparkles } from 'lucide-react';
import { openModal } from '../../lib/modalManager';

export default function FeaturesModal() {
  return (
    <div className="space-y-6">
      <p className="text-gray-300 leading-relaxed">
        Traumtag Helden begleitet euch auf eurer Heldenreise zur perfekten Hochzeit. Mit unseren intelligenten Tools behaltet ihr jederzeit den Überblick und könnt euch auf das Wesentliche konzentrieren: eure Liebe zu feiern.
      </p>

      <div className="space-y-4">
        <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 border border-[#d4af37]/30 hover:border-[#d4af37]/50 transition-all">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white mb-2">Aufgaben meistern</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Intelligente Checklisten und Erinnerungen helfen euch, keinen wichtigen Schritt zu vergessen. Organisiert eure To-dos nach Priorität und behaltet Deadlines im Blick.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 border border-[#d4af37]/30 hover:border-[#d4af37]/50 transition-all">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white mb-2">Budget clever verwalten</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Behaltet eure Ausgaben im Griff mit detaillierter Kostenverfolgung, automatischen Berechnungen und übersichtlichen Charts. Kein Stress mehr mit versteckten Kosten.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 border border-[#d4af37]/30 hover:border-[#d4af37]/50 transition-all">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white mb-2">Gästeliste organisieren</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Verwaltet eure Gäste mit RSVP-Tracking, Familien-Gruppierung, Dietary Restrictions und vielem mehr. Alles an einem Ort, immer aktuell.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 border border-[#d4af37]/30 hover:border-[#d4af37]/50 transition-all">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white mb-2">Dienstleister koordinieren</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Alle Kontakte, Verträge und Zahlungen für Fotografen, Caterer, Location und Co. zentral verwalten. Nie wieder wichtige Details vergessen.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 border border-[#d4af37]/30 hover:border-[#d4af37]/50 transition-all">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white mb-2">Timeline perfekt planen</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Plant euren Hochzeitstag minutengenau mit unserer visuellen Timeline. Jedes Event wird zum planbaren Block mit Checklisten, Gästen und Budget.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 border border-[#d4af37]/30 hover:border-[#d4af37]/50 transition-all">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white mb-2">Fortschritt verfolgen</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Seht auf einen Blick, wie weit ihr seid. Unser Dashboard zeigt euch den Countdown, erledigte Aufgaben und Budget-Status in Echtzeit.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#0a253c] to-[#1a3a5c] rounded-xl p-6 text-white border border-[#d4af37]/20">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-6 h-6 text-[#f4d03f]" />
          <h3 className="font-bold text-xl">Bereit für eure Heldenreise?</h3>
        </div>
        <p className="text-gray-300 mb-4">
          Startet jetzt und erlebt, wie entspannt Hochzeitsplanung sein kann.
        </p>
        <button
          onClick={() => openModal('login')}
          className="w-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] hover:from-[#f4d03f] hover:to-[#d4af37] text-[#0a253c] px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-[#d4af37]/20"
        >
          Jetzt kostenlos starten
        </button>
      </div>
    </div>
  );
}
