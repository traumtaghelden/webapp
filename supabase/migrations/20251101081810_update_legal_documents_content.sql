/*
  # Update Legal Documents with Detailed Content

  Updates the legal_documents table with comprehensive German content for:
  - Privacy Policy (Datenschutzerklärung)
  - Terms of Service (AGB)
  - Imprint (Impressum)
  - Cookie Policy

  These documents are GDPR-compliant templates that need to be customized
  with actual business details.
*/

-- Update Privacy Policy
UPDATE legal_documents
SET content = 'Vollständige Datenschutzerklärung - Siehe /privacy Seite für Details. 
Diese Version enthält: Verantwortliche Stelle, Welche Daten erfasst werden, 
Zweck der Verarbeitung, Rechtsgrundlagen, Datenspeicherung, Cookies, 
Ihre Rechte (Auskunft, Berichtigung, Löschung, Einschränkung, Übertragbarkeit, 
Widerspruch), Datenweitergabe, Sicherheit, Aufbewahrungsfristen, 
Informationen zu Minderjährigen, Änderungen und Kontakt.'
WHERE document_type = 'privacy_policy' AND version = '1.0';

-- Update Terms of Service
UPDATE legal_documents
SET content = 'Allgemeine Geschäftsbedingungen - Siehe /terms Seite für Details.
Diese Version enthält: Geltungsbereich, Vertragsgegenstand, 
Registrierung und Account, Nutzungsrechte und Pflichten, 
Nutzergenerierte Inhalte, Verfügbarkeit und Wartung, Haftung, 
Preise und Zahlungsbedingungen, Vertragslaufzeit und Kündigung, 
Datenschutz, Streitbeilegung und Schlussbestimmungen.'
WHERE document_type = 'terms_of_service' AND version = '1.0';

-- Update Imprint
UPDATE legal_documents
SET content = 'Impressum gemäß § 5 TMG - Siehe /imprint Seite für Details.
Diese Version enthält: Betreiber, Kontaktdaten, Vertretungsberechtigung, 
Registereintrag, Umsatzsteuer-ID, Verantwortlich für den Inhalt, 
Streitschlichtung, Haftung für Inhalte und Links, Urheberrecht.'
WHERE document_type = 'imprint' AND version = '1.0';

-- Update Cookie Policy
UPDATE legal_documents
SET content = 'Cookie-Richtlinie - Diese Website verwendet Cookies.
Notwendige Cookies: Erforderlich für den Betrieb (Login, Session).
Funktionale Cookies: Verbessern Benutzererfahrung (Einstellungen, Präferenzen).
Analyse Cookies: Helfen Website zu verbessern (optional, mit Einwilligung).
Marketing Cookies: Für personalisierte Werbung (optional, mit Einwilligung).
Sie können Ihre Cookie-Einstellungen jederzeit in den Datenschutz-Einstellungen ändern.'
WHERE document_type = 'cookie_policy' AND version = '1.0';

-- Ensure all documents are marked as active
UPDATE legal_documents
SET is_active = true
WHERE version = '1.0';