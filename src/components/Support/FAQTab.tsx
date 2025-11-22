import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: 'Wie erstelle ich eine Gästeliste?',
    answer: 'Navigieren Sie zum Menüpunkt "Gäste" in der Sidebar. Klicken Sie auf den Button "Gast hinzufügen" und füllen Sie die Grunddaten wie Name, E-Mail und Beziehung aus. Sie können Gäste auch in Familiengruppen organisieren, um Verwandte zusammenzufassen. Die Gästeliste kann nach Status (Geplant, Eingeladen, Zugesagt, Abgesagt) gefiltert werden.'
  },
  {
    id: 2,
    question: 'Wie verwalte ich mein Budget?',
    answer: 'Im Budget-Bereich können Sie Ihr Gesamtbudget festlegen und einzelne Ausgaben-Positionen anlegen. Jede Position kann einer Kategorie zugeordnet werden (z.B. Location, Catering, Dekoration). Sie sehen in Echtzeit, wie viel Budget bereits verplant ist und wie viel noch verfügbar bleibt. Markieren Sie Positionen als "Bezahlt", um den Überblick über offene Zahlungen zu behalten.'
  },
  {
    id: 3,
    question: 'Wie füge ich Dienstleister hinzu?',
    answer: 'Gehen Sie zu "Dienstleister" in der Navigation und klicken Sie auf "Dienstleister hinzufügen". Tragen Sie Name, Kategorie (z.B. Fotograf, DJ, Florist), Kontaktdaten und Kosten ein. Sie können Verträge verwalten, Zahlungspläne erstellen und Dienstleister mit Timeline-Events verknüpfen. Favorisieren Sie wichtige Dienstleister, um sie schneller zu finden.'
  },
  {
    id: 4,
    question: 'Wie funktioniert die Timeline?',
    answer: 'Die Timeline hilft Ihnen, den Ablauf Ihres Hochzeitstages zu planen. Unter "Timeline" können Sie Events mit Uhrzeit, Dauer und Beschreibung anlegen (z.B. "14:00 - Trauung", "16:00 - Empfang"). Sie können Pufferzeiten einplanen, Dienstleister und Locations zuordnen und To-Do-Listen für jedes Event erstellen. Die Timeline gibt Ihnen einen strukturierten Überblick über den gesamten Tag.'
  },
  {
    id: 5,
    question: 'Was ist der Heldenplan?',
    answer: 'Der Heldenplan (Hero Journey) ist ein interaktiver Planungsassistent, der Sie Schritt für Schritt durch Ihre Hochzeitsplanung führt. Er zeigt Ihnen wichtige Meilensteine (z.B. "Vision festlegen", "Budget definieren", "Gäste planen") und gibt Ihnen konkrete Handlungsempfehlungen. Der Heldenplan passt sich Ihrem Hochzeitsdatum an und priorisiert die nächsten wichtigen Schritte automatisch.'
  },
  {
    id: 6,
    question: 'Wie exportiere ich meine Daten?',
    answer: 'In den Einstellungen unter dem Tab "Daten" finden Sie die Export-Funktion. Hier können Sie Ihre Gästeliste, Budget-Übersicht, Aufgaben und Dienstleister als Excel- oder PDF-Datei herunterladen. Diese Exporte eignen sich hervorragend für Backups oder zum Teilen mit Ihrem Partner oder Wedding Planner.'
  },
  {
    id: 7,
    question: 'Wie ändere ich meine Hochzeitsdaten?',
    answer: 'Gehen Sie zu "Einstellungen" in der Sidebar und wählen Sie den Tab "Hochzeit". Hier können Sie Hochzeitsdatum, Namen der Partner, Gästeanzahl und andere grundlegende Informationen anpassen. Änderungen werden sofort in der gesamten Anwendung übernommen, und die Timeline passt sich automatisch an das neue Datum an.'
  },
  {
    id: 8,
    question: 'Was bietet Premium?',
    answer: 'Mit Premium schalten Sie unbegrenzte Funktionen frei: Unbegrenzt Gäste, Aufgaben, Dienstleister und Budget-Positionen (in der kostenlosen Version gibt es Limits). Zusätzlich erhalten Sie erweiterte Features wie detaillierte Budget-Analysen, Zahlungspläne, erweiterte Statistiken und Priority-Support. Premium kostet 29,99€/Monat und kann jederzeit gekündigt werden.'
  },
  {
    id: 9,
    question: 'Wie verknüpfe ich Budget mit Dienstleistern?',
    answer: 'Beim Erstellen oder Bearbeiten einer Budget-Position können Sie im Formular einen Dienstleister aus Ihrem System auswählen. Die Kosten werden dann automatisch synchronisiert. Wenn Sie die Kosten beim Dienstleister ändern, wird auch die Budget-Position aktualisiert. Diese Verknüpfung hilft Ihnen, den Überblick zu behalten und Doppelerfassungen zu vermeiden.'
  },
  {
    id: 10,
    question: 'Wie gruppiere ich Familien?',
    answer: 'Im Gäste-Bereich gibt es den Tab "Familien". Hier können Sie Familiengruppen erstellen (z.B. "Familie Schmidt", "Familie Müller") und Gäste zuordnen. Sie können auch festlegen, welcher Partner-Seite die Familie zugehört. Familiengruppierungen erleichtern die Organisation bei Tischordnung, Einladungen und beim Überblick über Zusagen. Jede Familie kann einen Hauptansprechpartner haben.'
  }
];

export default function FAQTab() {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-[#0a253c] mb-2">Häufig gestellte Fragen</h3>
        <p className="text-[#666666]">Hier finden Sie Antworten auf die wichtigsten Fragen zur Nutzung der Plattform.</p>
      </div>

      <div className="space-y-3">
        {faqData.map((faq) => {
          const isOpen = openId === faq.id;

          return (
            <div
              key={faq.id}
              className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl shadow-lg border border-[#d4af37]/10 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#d4af37]/30"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-[#f7f2eb]/20 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-2 rounded-lg flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-[#0a253c] text-base leading-relaxed">
                    {faq.question}
                  </span>
                </div>
                <div className="flex-shrink-0 mt-1">
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-[#d4af37]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#666666]" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                  <div className="pl-11 pr-4">
                    <div className="border-t border-[#d4af37]/20 pt-4">
                      <p className="text-[#0a253c] leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
