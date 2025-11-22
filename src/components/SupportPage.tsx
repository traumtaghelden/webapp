import { HelpCircle, BookOpen, Mail } from 'lucide-react';
import TabContainer, { type Tab } from './common/TabContainer';
import FAQTab from './Support/FAQTab';
import TutorialsTab from './Support/TutorialsTab';
import ContactTab from './Support/ContactTab';

export default function SupportPage() {
  const tabs: Tab[] = [
    {
      id: 'faq',
      label: 'FAQ',
      icon: <HelpCircle className="w-4 h-4" />,
      content: <FAQTab />,
    },
    {
      id: 'tutorials',
      label: 'Anleitungen',
      icon: <BookOpen className="w-4 h-4" />,
      content: <TutorialsTab />,
    },
    {
      id: 'contact',
      label: 'Kontakt',
      icon: <Mail className="w-4 h-4" />,
      content: <ContactTab />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#0a253c] to-[#1a3a5c] rounded-2xl p-6 md:p-8 text-white shadow-2xl border border-[#d4af37]/30">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-4 rounded-xl shadow-lg">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">Support & Hilfe</h2>
            <p className="text-white/80 leading-relaxed">
              Hier finden Sie Antworten auf häufige Fragen, detaillierte Anleitungen und die Möglichkeit,
              direkt mit unserem Support-Team Kontakt aufzunehmen.
            </p>
          </div>
        </div>
      </div>

      <TabContainer
        tabs={tabs}
        defaultTab="faq"
        storageKey="support-tab"
        urlParam="supportTab"
      />
    </div>
  );
}
