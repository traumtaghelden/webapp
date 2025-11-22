import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Users, DollarSign, CheckCircle, Building2, Clock, X } from 'lucide-react';

interface Tutorial {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  content: string[];
}

const tutorials: Tutorial[] = [
  {
    id: 1,
    title: 'Erste Schritte nach dem Onboarding',
    description: 'Lernen Sie die Grundfunktionen kennen und starten Sie erfolgreich in Ihre Hochzeitsplanung.',
    icon: BookOpen,
    content: [
      '1. Dashboard erkunden: Nach dem Login landen Sie auf der Übersichtsseite. Hier sehen Sie die wichtigsten Kennzahlen Ihrer Hochzeitsplanung auf einen Blick: Tage bis zur Hochzeit, offene Aufgaben, Budget-Status und Gästeanzahl.',
      '2. Heldenplan nutzen: Der Heldenplan ist Ihr persönlicher Planungsassistent. Er führt Sie durch wichtige Meilensteine wie "Vision festlegen", "Budget definieren" und "Location finden". Folgen Sie den Schritten, um nichts Wichtiges zu vergessen.',
      '3. Grunddaten anlegen: Beginnen Sie damit, Ihr Gesamtbudget festzulegen, eine erste Gästeliste zu erstellen und wichtige Termine in der Timeline einzutragen. Diese Grunddaten helfen Ihnen, den Überblick zu behalten.',
      '4. Navigation verstehen: Die linke Sidebar ist Ihr Hauptmenü. Hier finden Sie alle Bereiche: Übersicht, Heldenplan, Aufgaben, Budget, Gäste, Dienstleister, Locations, Timeline und Einstellungen.',
      '5. Erste Aufgaben erstellen: Erstellen Sie eine "Starter-Aufgabe" wie "Location-Besichtigungen vereinbaren" oder "Save-the-Date Karten gestalten". So haben Sie direkt einen konkreten nächsten Schritt.'
    ]
  },
  {
    id: 2,
    title: 'Gäste hinzufügen und verwalten',
    description: 'Erstellen Sie Ihre Gästeliste, organisieren Sie Familien und verwalten Sie Zu- und Absagen.',
    icon: Users,
    content: [
      '1. Neuen Gast anlegen: Klicken Sie im Gäste-Bereich auf "Gast hinzufügen". Tragen Sie mindestens den Namen ein. Optional können Sie E-Mail, Telefon, Beziehung und Altersgruppe (Erwachsener/Kind/Baby) angeben.',
      '2. RSVP-Status verwalten: Setzen Sie den Status auf "Geplant" (noch nicht eingeladen), "Eingeladen" (Einladung verschickt), "Zugesagt" oder "Abgesagt". So behalten Sie den Überblick über Rückmeldungen.',
      '3. Familien gruppieren: Im Tab "Familien" können Sie Familiengruppen erstellen (z.B. "Familie Müller"). Ordnen Sie Gäste einer Familie zu, um Verwandte zusammenzufassen. Das erleichtert die Tischplanung und Einladungsverwaltung.',
      '4. Plus-One verwalten: Aktivieren Sie bei einem Gast die Option "Plus-One erlaubt" und tragen Sie optional den Namen der Begleitperson ein. Dies zählt automatisch zur Gesamtgästezahl.',
      '5. Besondere Hinweise: Nutzen Sie das Notizen-Feld für wichtige Informationen wie Ernährungseinschränkungen, besondere Bedürfnisse oder Sitzplatzwünsche. Diese Infos helfen bei der finalen Organisation.'
    ]
  },
  {
    id: 3,
    title: 'Budget erstellen und tracken',
    description: 'Definieren Sie Ihr Budget, erfassen Sie Ausgaben und behalten Sie die Kosten im Griff.',
    icon: DollarSign,
    content: [
      '1. Gesamtbudget festlegen: In den Einstellungen unter "Hochzeit" legen Sie Ihr Gesamtbudget fest (z.B. 15.000€). Diese Zahl dient als Orientierung für alle weiteren Ausgaben.',
      '2. Budget-Kategorien nutzen: Erstellen Sie Kategorien wie "Location", "Catering", "Dekoration", "Fotograf" etc. Jede Kategorie kann ein Limit haben, um die Ausgaben zu strukturieren.',
      '3. Ausgaben-Positionen anlegen: Für jede konkrete Ausgabe erstellen Sie eine Position (z.B. "Hochzeitslocation Schloss XY - 3.500€"). Tragen Sie geschätzte und tatsächliche Kosten ein.',
      '4. Bezahlstatus tracken: Markieren Sie Positionen als "Offen" oder "Bezahlt". So sehen Sie sofort, welche Rechnungen noch offen sind und wie viel bereits ausgegeben wurde.',
      '5. Budget-Übersicht nutzen: Die Übersichts-Charts zeigen Ihnen visuell, wie viel Budget bereits verplant ist, wie viel bezahlt wurde und wie viel noch verfügbar ist. So behalten Sie die Kontrolle über Ihre Finanzen.'
    ]
  },
  {
    id: 4,
    title: 'Aufgaben planen und zuweisen',
    description: 'Organisieren Sie To-Dos, setzen Sie Prioritäten und weisen Sie Aufgaben Teammitgliedern zu.',
    icon: CheckCircle,
    content: [
      '1. Aufgabe erstellen: Klicken Sie auf "Aufgabe hinzufügen" und geben Sie einen Titel ein (z.B. "Blumenschmuck auswählen"). Wählen Sie eine Kategorie (Planung, Location, Catering, etc.) für bessere Organisation.',
      '2. Priorität setzen: Vergeben Sie eine Priorität (Niedrig, Mittel, Hoch), um wichtige Aufgaben hervorzuheben. Hochpriorisierte Aufgaben erscheinen in der Übersicht ganz oben.',
      '3. Fälligkeitsdatum festlegen: Setzen Sie ein Ziel-Datum, bis wann die Aufgabe erledigt sein sollte. Überfällige Aufgaben werden automatisch markiert und in der Übersicht hervorgehoben.',
      '4. Aufgaben zuweisen: Weisen Sie die Aufgabe einer Person zu (z.B. "Partner 1", "Partner 2", "Trauzeuge"). So weiß jeder, wofür er verantwortlich ist.',
      '5. Status aktualisieren: Ändern Sie den Status von "Offen" über "In Bearbeitung" zu "Erledigt". Erledigte Aufgaben erhöhen Ihren Fortschrittsbalken und geben Ihnen ein gutes Gefühl!'
    ]
  },
  {
    id: 5,
    title: 'Dienstleister und Locations verwalten',
    description: 'Erfassen Sie Dienstleister, verwalten Sie Verträge und behalten Sie Zahlungen im Blick.',
    icon: Building2,
    content: [
      '1. Dienstleister anlegen: Im Bereich "Dienstleister" erstellen Sie Einträge für Ihre Dienstleister (Fotograf, DJ, Florist, etc.). Tragen Sie Name, Kategorie, Kontaktdaten und Kosten ein.',
      '2. Locations hinzufügen: Unter "Locations" erfassen Sie Ihre Hochzeitslocations (Trauungs-Location, Feier-Location, Übernachtung). Notieren Sie Adresse, Kapazität und Kosten.',
      '3. Verträge verwalten: Markieren Sie den Vertragsstatus (Nicht gesendet, Gesendet, Unterschrieben). Laden Sie optional Vertrags-Dokumente hoch, um alles zentral zu haben.',
      '4. Zahlungspläne erstellen: Premium-Nutzer können Zahlungspläne mit mehreren Raten anlegen (z.B. Anzahlung 30%, Restzahlung 70%). So behalten Sie Zahlungsfristen im Blick.',
      '5. Favoriten setzen: Markieren Sie wichtige Dienstleister als Favoriten, um sie schneller zu finden. Favoriten werden in der Übersicht oben angezeigt.'
    ]
  },
  {
    id: 6,
    title: 'Timeline für den Hochzeitstag erstellen',
    description: 'Planen Sie den Ablauf Ihres großen Tages minutiös und behalten Sie den Überblick.',
    icon: Clock,
    content: [
      '1. Timeline öffnen: Im Menüpunkt "Timeline" finden Sie Ihren Hochzeitstag-Ablaufplan. Hier planen Sie alle Events des Tages chronologisch.',
      '2. Events anlegen: Erstellen Sie Events mit Uhrzeit und Dauer (z.B. "14:00 Uhr - Trauung, 30 Min"). Jedes Event kann eine Beschreibung, Location und zugewiesene Personen haben.',
      '3. Pufferzeiten einplanen: Fügen Sie Puffer-Blöcke zwischen wichtigen Events ein (z.B. "15 Min Puffer für Fotos"). So haben Sie Spielraum, falls etwas länger dauert.',
      '4. Dienstleister zuordnen: Verknüpfen Sie Events mit Dienstleistern (z.B. "Fotograf bei Trauung", "DJ beim Empfang"). So sehen alle Beteiligten, wann sie gebraucht werden.',
      '5. Checklisten erstellen: Für jedes Event können Sie To-Do-Listen anlegen (z.B. "Ringe bereithalten", "Mikrofon testen"). Diese Checklisten helfen am Hochzeitstag, nichts zu vergessen.'
    ]
  }
];

export default function TutorialsTab() {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  // Body scroll lock when modal is open
  useEffect(() => {
    if (selectedTutorial) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [selectedTutorial]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-[#0a253c] mb-2">Anleitungen</h3>
        <p className="text-[#666666]">Schritt-für-Schritt-Guides für alle wichtigen Funktionen der Plattform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tutorials.map((tutorial) => {
          const Icon = tutorial.icon;
          return (
            <button
              key={tutorial.id}
              onClick={() => setSelectedTutorial(tutorial)}
              className="bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl p-6 shadow-lg border border-[#d4af37]/10 hover:shadow-xl hover:border-[#d4af37]/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-left group"
            >
              <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-lg font-bold text-[#0a253c] mb-2 group-hover:text-[#d4af37] transition-colors">
                {tutorial.title}
              </h4>
              <p className="text-sm text-[#666666] leading-relaxed">
                {tutorial.description}
              </p>
            </button>
          );
        })}
      </div>

      {selectedTutorial && createPortal(
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, opacity: 1 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTutorial(null);
          }}
        >
          <div className="bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl border-2 border-[#d4af37]">
            <div className="flex items-start gap-4 p-6 border-b border-[#d4af37]/20">
              <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-3 rounded-xl">
                {(() => {
                  const Icon = selectedTutorial.icon;
                  return <Icon className="w-6 h-6 text-white" />;
                })()}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white">{selectedTutorial.title}</h3>
                <p className="text-[#d4af37]/80 text-sm mt-1">{selectedTutorial.description}</p>
              </div>
              <button
                onClick={() => setSelectedTutorial(null)}
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] scrollbar-thin scrollbar-thumb-[#d4af37]/30 scrollbar-track-transparent">
              <div className="space-y-4">
                {selectedTutorial.content.map((paragraph, index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-xl p-4 border border-[#d4af37]/10 hover:border-[#d4af37]/30 transition-colors"
                  >
                    <p className="text-white/90 leading-relaxed">{paragraph}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-[#d4af37]/20">
              <button
                onClick={() => setSelectedTutorial(null)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white font-semibold hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
