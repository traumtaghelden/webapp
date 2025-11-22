import { useState, useEffect } from 'react';
import {
  Crown,
  Users,
  CreditCard,
  Building2,
  CheckCircle,
  Calendar,
  FileText,
  Sparkles,
  Shield,
  Clock,
  ArrowLeft,
  Zap,
  Heart,
  MapPin,
  ListChecks,
  Download,
  Headphones,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../contexts/ToastContext';

interface PremiumPageProps {
  onBack: () => void;
}

export default function PremiumPage({ onBack }: PremiumPageProps) {
  const { accountStatus, deletionScheduledAt, isLoading: statusLoading } = useSubscription();
  const { showToast } = useToast();
  const [checkingOut, setCheckingOut] = useState(false);
  const [showCancelBanner, setShowCancelBanner] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const canceled = params.get('canceled');

    if (canceled === 'true') {
      setShowCancelBanner(true);
      window.history.replaceState({}, '', '/premium');
    }
  }, []);

  const handleCheckout = async () => {
    try {
      setCheckingOut(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        showToast('Bitte melden Sie sich an', 'error');
        return;
      }

      const priceId = import.meta.env.VITE_STRIPE_PRICE_ID;
      if (!priceId || priceId === 'price_XXXXXXXXXXXXXXXX' || priceId.includes('XXX')) {
        showToast('Stripe Price ID muss in der .env konfiguriert werden', 'error');
        console.error('VITE_STRIPE_PRICE_ID ist nicht konfiguriert. Bitte eine echte Stripe Price ID eintragen.');
        return;
      }

      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/?upgrade=success`;
      const cancelUrl = `${baseUrl}/?upgrade=canceled`;

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          price_id: priceId,
          success_url: successUrl,
          cancel_url: cancelUrl,
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      showToast('Fehler beim Starten des Checkout-Prozesses', 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  const isPremium = accountStatus === 'premium_active';
  const isExpired = accountStatus === 'trial_expired' || accountStatus === 'premium_cancelled';
  const daysUntilDeletion = deletionScheduledAt
    ? Math.max(0, Math.ceil((new Date(deletionScheduledAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Unbegrenzte Gäste',
      description: 'Verwalte so viele Gäste wie du möchtest, inklusive Familien und Begleitpersonen',
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Vollständiges Budget-Management',
      description: 'Unbegrenzte Budget-Einträge, Pro-Kopf-Berechnung und eigene Ratenpläne',
    },
    {
      icon: <Building2 className="w-6 h-6" />,
      title: 'Unbegrenzte Dienstleister',
      description: 'Alle Dienstleister verwalten mit automatischer Budget-Synchronisation',
    },
    {
      icon: <ListChecks className="w-6 h-6" />,
      title: 'Aufgaben & Checklisten',
      description: 'Unbegrenzte Aufgaben mit Zuweisungen, Deadlines und Prioritäten',
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Location-Management',
      description: 'Alle Locations vergleichen, verwalten und mit Events verknüpfen',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Hochzeitstag-Timeline',
      description: 'Detaillierter Tagesablauf mit Block-Planung und Zeitmanagement',
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Sitzplan-Funktion',
      description: 'Erstelle und verwalte Tischpläne für deine Gäste',
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'PDF-Exporte',
      description: 'Exportiere Budget, Gästeliste und mehr als professionelle PDFs',
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: 'Prioritäts-Support',
      description: 'Schnelle Hilfe bei Fragen und Problemen',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Sichere Datenspeicherung',
      description: 'Deine Daten sind sicher und werden niemals gelöscht',
    },
  ];

  const faqs = [
    {
      question: 'Kann ich jederzeit kündigen?',
      answer: 'Ja, du kannst dein Premium-Abo jederzeit kündigen. Es läuft dann bis zum Ende des bezahlten Zeitraums und wird nicht automatisch verlängert.',
    },
    {
      question: 'Was passiert mit meinen Daten nach der Kündigung?',
      answer: 'Nach der Kündigung hast du 30 Tage lang Read-Only-Zugriff auf deine Daten. In dieser Zeit kannst du alles exportieren oder dein Abo reaktivieren.',
    },
    {
      question: 'Ist die Zahlung sicher?',
      answer: 'Ja, alle Zahlungen werden über Stripe abgewickelt - einen der sichersten Zahlungsanbieter weltweit. Wir speichern keine Kreditkartendaten.',
    },
    {
      question: 'Kann ich zwischen verschiedenen Plänen wechseln?',
      answer: 'Aktuell bieten wir einen Premium-Plan für 29,99€/Monat an. Dieser Plan enthält alle Features ohne Einschränkungen.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f7f2eb]/30 to-white">
      {showCancelBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                Upgrade abgebrochen. Du kannst jederzeit zurückkommen und Premium aktivieren.
              </p>
            </div>
            <button
              onClick={() => setShowCancelBanner(false)}
              className="text-amber-600 hover:text-amber-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {isExpired && daysUntilDeletion > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <Shield className="w-6 h-6 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Achtung: Deine Daten werden in {daysUntilDeletion} Tagen gelöscht!</p>
              <p className="text-sm opacity-90">Upgrade jetzt auf Premium und sichere deine gesamte Hochzeitsplanung.</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#666666] hover:text-[#0a253c] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Dashboard
        </button>

        {isPremium ? (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-500 rounded-xl">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#0a253c]">Du bist bereits Premium!</h1>
                <p className="text-[#666666] mt-1">Genieße alle Features ohne Einschränkungen.</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Zum Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-[#d4af37]/10 px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-5 h-5 text-[#d4af37]" />
                <span className="text-sm font-semibold text-[#d4af37]">Premium Zugang</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0a253c] mb-4">
                Plane deine Hochzeit
                <br />
                <span className="text-[#d4af37]">ohne Grenzen</span>
              </h1>

              <p className="text-lg sm:text-xl text-[#666666] max-w-3xl mx-auto mb-8">
                Mit Premium bekommst du unbegrenzten Zugriff auf alle Features und kannst deine
                Traumhochzeit stressfrei planen.
              </p>

              <div className="inline-flex flex-col items-center bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-2xl p-8 border-2 border-[#d4af37]/30 shadow-xl mb-8">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-[#0a253c]">29,99€</span>
                  <span className="text-xl text-[#666666]">/ Monat</span>
                </div>
                <p className="text-sm text-[#666666] mb-6">Jederzeit kündbar</p>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="bg-[#d4af37] hover:bg-[#c19a2e] text-white px-8 py-4 rounded-lg font-bold text-lg flex items-center gap-3 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {checkingOut ? (
                    <>
                      <Clock className="w-6 h-6 animate-spin" />
                      Wird geladen...
                    </>
                  ) : (
                    <>
                      <Crown className="w-6 h-6" />
                      Jetzt Premium holen
                    </>
                  )}
                </button>

                <div className="flex items-center gap-6 mt-6 text-sm text-[#666666]">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Sichere Zahlung</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#d4af37]" />
                    <span>Sofortiger Zugriff</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Jederzeit kündbar</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold text-[#0a253c] text-center mb-12">
                Alles, was du für deine Traumhochzeit brauchst
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl p-6 border border-[#d4af37]/10 hover:border-[#d4af37]/30 hover:shadow-lg transition-all"
                  >
                    <div className="p-3 bg-[#d4af37]/10 rounded-lg inline-block mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold text-[#0a253c] mb-2">{feature.title}</h3>
                    <p className="text-[#666666] text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#d4af37]/5 to-[#d4af37]/10 rounded-2xl p-8 lg:p-12 mb-16">
              <h2 className="text-3xl font-bold text-[#0a253c] text-center mb-12">
                Häufig gestellte Fragen
              </h2>

              <div className="space-y-4 max-w-3xl mx-auto">
                {faqs.map((faq, index) => (
                  <details
                    key={index}
                    className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all group"
                  >
                    <summary className="font-semibold text-[#0a253c] cursor-pointer list-none flex items-center justify-between">
                      {faq.question}
                      <span className="text-[#d4af37] group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <p className="text-[#666666] mt-4 leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] rounded-2xl p-8 lg:p-12 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Bereit für deine Traumhochzeit?</h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Starte jetzt mit Premium und plane deine Hochzeit ohne Einschränkungen.
                Jederzeit kündbar.
              </p>

              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="bg-white hover:bg-gray-100 text-[#d4af37] px-8 py-4 rounded-lg font-bold text-lg flex items-center gap-3 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mx-auto"
              >
                {checkingOut ? (
                  <>
                    <Clock className="w-6 h-6 animate-spin" />
                    Wird geladen...
                  </>
                ) : (
                  <>
                    <Crown className="w-6 h-6" />
                    Für 29,99€/Monat Premium holen
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
