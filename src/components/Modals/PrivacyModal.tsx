import { Shield, Lock, Download, CheckCircle, Database, Mail, Eye, Trash2, FileText } from 'lucide-react';
import { emitModalEvent } from '../../lib/modalManager';

export default function PrivacyModal() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 rounded-xl border border-[#d4af37]/20">
        <Shield className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-white mb-1">Datenschutzerklärung nach DSGVO</h3>
          <p className="text-gray-200 text-sm leading-relaxed">
            Wir nehmen den Schutz eurer persönlichen Daten sehr ernst und behandeln sie vertraulich gemäß der DSGVO.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Verantwortlicher */}
        <div>
          <h3 className="font-bold text-white mb-3 text-lg">1. Verantwortlicher für die Datenverarbeitung</h3>
          <div className="bg-[#f7f2eb] rounded-lg p-4 text-sm">
            <p className="font-semibold mb-1 text-gray-900">Traumtaghelden</p>
            <p className="text-gray-700">E-Mail: sven@traumtaghelden.de</p>
            <p className="mt-2 text-xs text-gray-700">Verantwortlich im Sinne der DSGVO und anderer datenschutzrechtlicher Bestimmungen.</p>
          </div>
        </div>

        {/* Erhobene Daten */}
        <div>
          <h3 className="font-bold text-white mb-3 text-lg flex items-center gap-2">
            <Database className="w-5 h-5 text-[#d4af37]" />
            2. Welche Daten wir erheben und verarbeiten
          </h3>
          <div className="space-y-3 text-sm text-gray-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Account-Daten:</span> E-Mail-Adresse, verschlüsseltes Passwort, Account-Erstellungsdatum
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Hochzeitsdaten:</span> Hochzeitsdatum, Namen der Partner, Budget-Informationen, Gästeliste mit Namen und Kontaktdaten, Aufgaben und Notizen, Dienstleister-Informationen, Timeline-Planung
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Nutzungsdaten:</span> Login-Zeitpunkte, verwendete Funktionen (anonymisiert), Gerätetyp und Browser (nur technisch notwendig)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Zahlungsdaten:</span> Bei Premium-Abonnement: Zahlungsinformationen werden ausschließlich von Stripe verarbeitet. Wir speichern keine Kreditkartendaten.
              </div>
            </div>
          </div>
        </div>

        {/* Rechtsgrundlagen */}
        <div>
          <h3 className="font-bold text-white mb-3 text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#d4af37]" />
            3. Rechtsgrundlagen der Verarbeitung
          </h3>
          <div className="space-y-2 text-sm text-gray-200">
            <p className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <span><span className="font-semibold">Art. 6 Abs. 1 lit. b DSGVO:</span> Vertragserfüllung – Bereitstellung der Planungs-Software und aller gebuchten Funktionen</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <span><span className="font-semibold">Art. 6 Abs. 1 lit. a DSGVO:</span> Einwilligung – für optionale Newsletter und Marketing-E-Mails (jederzeit widerrufbar)</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <span><span className="font-semibold">Art. 6 Abs. 1 lit. f DSGVO:</span> Berechtigtes Interesse – zur Sicherstellung der IT-Sicherheit und Systemstabilität</span>
            </p>
          </div>
        </div>

        {/* Zweck der Verarbeitung */}
        <div>
          <h3 className="font-bold text-white mb-3 text-lg">4. Zweck der Datenverarbeitung</h3>
          <div className="space-y-2 text-sm text-gray-200 leading-relaxed">
            <p>Wir verwenden eure Daten ausschließlich für folgende Zwecke:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Bereitstellung und Betrieb der Hochzeitsplanungs-Software</li>
              <li>Speicherung und Synchronisation eurer Hochzeitsdaten über Geräte hinweg</li>
              <li>Verwaltung eures Accounts und Authentifizierung</li>
              <li>Abwicklung von Premium-Abonnements und Zahlungen</li>
              <li>Versand von technischen Benachrichtigungen und Service-E-Mails</li>
              <li>Technischer Support bei Anfragen</li>
              <li>Verbesserung der App-Funktionalität (anonymisierte Nutzungsstatistiken)</li>
            </ul>
            <p className="font-semibold text-white mt-3">
              Wir verkaufen niemals eure Daten. Wir geben sie nicht an Dritte weiter. Wir nutzen sie nicht für Werbezwecke.
            </p>
          </div>
        </div>

        {/* Speicherort */}
        <div>
          <h3 className="font-bold text-white mb-3 text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#d4af37]" />
            5. Speicherort und Sicherheit
          </h3>
          <div className="text-sm text-gray-200 leading-relaxed space-y-2">
            <p>
              Alle Daten werden verschlüsselt auf sicheren Servern innerhalb der Europäischen Union gespeichert. Wir nutzen Supabase als DSGVO-konforme Infrastruktur mit Rechenzentren in Deutschland.
            </p>
            <p className="font-semibold">Sicherheitsmaßnahmen:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>SSL/TLS-Verschlüsselung für alle Datenübertragungen</li>
              <li>Verschlüsselte Speicherung aller Passwörter (Bcrypt-Hashing)</li>
              <li>Row-Level-Security auf Datenbankebene</li>
              <li>Regelmäßige Sicherheits-Updates und Backups</li>
              <li>Zugriffskontrolle und Logging</li>
            </ul>
          </div>
        </div>

        {/* Datenweitergabe */}
        <div>
          <h3 className="font-bold text-white mb-3 text-lg">6. Weitergabe an Dritte</h3>
          <div className="text-sm text-gray-200 leading-relaxed space-y-2">
            <p>Wir geben eure Daten nur in folgenden Fällen an Dritte weiter:</p>
            <div className="space-y-2">
              <div className="bg-[#f7f2eb] rounded-lg p-3">
                <p className="font-semibold mb-1 text-gray-900">Supabase (Hosting & Datenbank)</p>
                <p className="text-xs text-gray-700">DSGVO-konform, Server in der EU, Auftragsverarbeitungsvertrag vorhanden</p>
              </div>
              <div className="bg-[#f7f2eb] rounded-lg p-3">
                <p className="font-semibold mb-1 text-gray-900">Stripe (Zahlungsabwicklung)</p>
                <p className="text-xs text-gray-700">Nur bei Premium-Abonnements, PCI-DSS zertifiziert, DSGVO-konform</p>
              </div>
            </div>
            <p className="font-semibold mt-3">Keine Weitergabe an:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Werbenetzwerke oder Marketing-Plattformen</li>
              <li>Social-Media-Plattformen</li>
              <li>Datenbroker oder Analytics-Dienste</li>
              <li>Andere kommerzielle Dritte</li>
            </ul>
          </div>
        </div>

        {/* Speicherdauer */}
        <div>
          <h3 className="font-bold text-white mb-3 text-lg">7. Speicherdauer</h3>
          <div className="text-sm text-gray-200 leading-relaxed">
            <p>Wir speichern eure Daten, solange euer Account aktiv ist. Bei Account-Löschung werden alle personenbezogenen Daten innerhalb von 30 Tagen vollständig und unwiderruflich gelöscht.</p>
            <p className="mt-2">Ausnahmen gelten nur für Daten, die wir aus rechtlichen Gründen aufbewahren müssen (z.B. Rechnungsdaten für steuerliche Zwecke – 10 Jahre gemäß HGB).</p>
          </div>
        </div>

        {/* Rechte der Betroffenen */}
        <div>
          <h3 className="font-bold text-white mb-3 text-lg flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#d4af37]" />
            8. Eure Rechte gemäß DSGVO
          </h3>
          <div className="space-y-2 text-sm text-gray-200">
            <div className="bg-[#f7f2eb] rounded-lg p-3">
              <p className="font-semibold mb-1 flex items-center gap-2 text-gray-900">
                <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                Recht auf Auskunft (Art. 15 DSGVO)
              </p>
              <p className="text-xs text-gray-700">Ihr könnt jederzeit eine Übersicht aller über euch gespeicherten Daten anfordern.</p>
            </div>
            <div className="bg-[#f7f2eb] rounded-lg p-3">
              <p className="font-semibold mb-1 flex items-center gap-2 text-gray-900">
                <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                Recht auf Berichtigung (Art. 16 DSGVO)
              </p>
              <p className="text-xs text-gray-700">Ihr könnt falsche Daten jederzeit selbst korrigieren oder uns kontaktieren.</p>
            </div>
            <div className="bg-[#f7f2eb] rounded-lg p-3">
              <p className="font-semibold mb-1 flex items-center gap-2 text-gray-900">
                <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                Recht auf Löschung (Art. 17 DSGVO)
              </p>
              <p className="text-xs text-gray-700">Ihr könnt euren Account und alle Daten mit einem Klick in den Einstellungen löschen.</p>
            </div>
            <div className="bg-[#f7f2eb] rounded-lg p-3">
              <p className="font-semibold mb-1 flex items-center gap-2 text-gray-900">
                <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                Recht auf Datenübertragbarkeit (Art. 20 DSGVO)
              </p>
              <p className="text-xs text-gray-700">Ihr könnt eure Daten in einem strukturierten Format (JSON, CSV, PDF) exportieren.</p>
            </div>
            <div className="bg-[#f7f2eb] rounded-lg p-3">
              <p className="font-semibold mb-1 flex items-center gap-2 text-gray-900">
                <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                Recht auf Widerspruch (Art. 21 DSGVO)
              </p>
              <p className="text-xs text-gray-700">Ihr könnt der Verarbeitung eurer Daten widersprechen, wenn diese auf berechtigtem Interesse basiert.</p>
            </div>
            <div className="bg-[#f7f2eb] rounded-lg p-3">
              <p className="font-semibold mb-1 flex items-center gap-2 text-gray-900">
                <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                Recht auf Beschwerde (Art. 77 DSGVO)
              </p>
              <p className="text-xs text-gray-700">Ihr könnt euch bei einer Datenschutz-Aufsichtsbehörde beschweren.</p>
            </div>
          </div>
        </div>

        {/* Cookies */}
        <div>
          <h3 className="font-bold text-white mb-3 text-lg">9. Cookies & Tracking</h3>
          <div className="text-sm text-gray-200 leading-relaxed space-y-2">
            <p>
              Wir verwenden nur <span className="font-semibold">technisch notwendige Cookies</span> für Login, Session-Management und Sicherheitsfunktionen. Diese sind erforderlich, damit die App funktioniert.
            </p>
            <p className="font-semibold text-white">Wir verwenden KEINE:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Tracking-Cookies von Drittanbietern</li>
              <li>Analytics-Tools (Google Analytics, Facebook Pixel, etc.)</li>
              <li>Werbe-Cookies oder Retargeting</li>
              <li>Social-Media-Plugins mit Tracking-Funktionen</li>
            </ul>
          </div>
        </div>

        {/* E-Mail-Kommunikation */}
        <div>
          <h3 className="font-bold text-white mb-3 text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#d4af37]" />
            10. E-Mail-Kommunikation
          </h3>
          <div className="text-sm text-gray-200 leading-relaxed">
            <p>Wir senden euch E-Mails nur in folgenden Fällen:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Transaktions-E-Mails (Account-Bestätigung, Passwort-Reset, Zahlungsbestätigungen)</li>
              <li>Wichtige Service-Mitteilungen (technische Updates, Sicherheitshinweise)</li>
              <li>Optionale Newsletter (nur mit ausdrücklicher Einwilligung, jederzeit abbestellbar)</li>
            </ul>
          </div>
        </div>

        {/* Kontakt */}
        <div className="bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 rounded-lg p-4 border border-[#d4af37]/20">
          <h3 className="font-bold text-white mb-2">Kontakt bei Datenschutzfragen</h3>
          <p className="text-sm text-gray-200 mb-2">
            Bei Fragen zum Datenschutz oder zur Ausübung eurer Rechte erreicht ihr uns unter:
          </p>
          <p className="text-sm font-semibold text-white">sven@traumtaghelden.de</p>
        </div>
      </div>

      <div className="border-t border-gray-600 pt-4 mt-6">
        <p className="text-gray-400 text-xs leading-relaxed">
          <span className="font-semibold">Stand:</span> November 2024 | Diese Datenschutzerklärung wurde gemäß den Anforderungen der DSGVO erstellt und wird regelmäßig aktualisiert.
        </p>
      </div>
    </div>
  );
}
