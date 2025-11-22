/**
 * TRAUMTAG HELDEN - ZENTRALES TERMINOLOGIE-GLOSSAR
 *
 * Dies ist die EINZIGE Quelle für alle UI-Texte, Labels und Begriffe.
 * ALLE Komponenten MÜSSEN diese Konstanten verwenden.
 *
 * REGEL: Deutsch für UI, Englisch für Code/Datenbank
 */

// ============================================================================
// MODUL: BUDGET
// ============================================================================

export const BUDGET = {
  // Hauptentitäten
  MODULE_NAME: 'Budget',
  ITEM: 'Budget-Posten',
  ITEM_PLURAL: 'Budget-Posten',
  CATEGORY: 'Kategorie',
  CATEGORY_PLURAL: 'Kategorien',
  PAYMENT: 'Zahlung',
  PAYMENT_PLURAL: 'Zahlungen',
  TAG: 'Tag',
  TAG_PLURAL: 'Tags',

  // Felder
  ESTIMATED_COST: 'Geplante Kosten',
  ACTUAL_COST: 'Tatsächliche Kosten',
  REMAINING_BUDGET: 'Übriges Budget',
  TOTAL_BUDGET: 'Gesamtbudget',

  // Zahlungstypen
  PAYMENT_TYPE: {
    DEPOSIT: 'Anzahlung',
    MILESTONE: 'Teilzahlung',
    FINAL: 'Restzahlung',
    MONTHLY: 'Monatliche Rate',
  },

  // Status
  PAYMENT_STATUS: {
    PENDING: 'Ausstehend',
    PAID: 'Bezahlt',
    PARTIAL: 'Teilweise bezahlt',
    OVERDUE: 'Überfällig',
    CANCELLED: 'Storniert',
  },

  // Aktionen
  ADD_ITEM: 'Budget-Posten hinzufügen',
  EDIT_ITEM: 'Budget-Posten bearbeiten',
  DELETE_ITEM: 'Budget-Posten löschen',
  VIEW_DETAILS: 'Details ansehen',
  CREATE_PAYMENT_PLAN: 'Zahlungsplan erstellen',
  MARK_AS_PAID: 'Als bezahlt markieren',

  // Premium Features
  PAYMENT_PLANS: 'Zahlungspläne',
  COST_SPLITTING: 'Kostenaufteilung',
  PER_PERSON_CALC: 'Pro-Kopf-Kalkulation',
  BUDGET_CHARTS: 'Budget-Analysen',
} as const;

// ============================================================================
// MODUL: DIENSTLEISTER
// ============================================================================

export const VENDOR = {
  // Hauptentitäten
  MODULE_NAME: 'Dienstleister',
  SINGULAR: 'Dienstleister',
  PLURAL: 'Dienstleister',
  CONTRACT: 'Vertrag',
  PAYMENT: 'Zahlung',
  PAYMENT_PLURAL: 'Zahlungen',
  DOCUMENT: 'Dokument',
  DOCUMENT_PLURAL: 'Dokumente',

  // Status
  CONTRACT_STATUS: {
    INQUIRY: 'Anfrage',
    NEGOTIATION: 'Verhandlung',
    SIGNED: 'Vertragsunterzeichnung',
    BOOKED: 'Gebucht',
    CANCELLED: 'Storniert',
  },

  // Felder
  NAME: 'Name',
  CATEGORY: 'Kategorie',
  CONTACT_NAME: 'Ansprechpartner',
  EMAIL: 'E-Mail',
  PHONE: 'Telefon',
  ADDRESS: 'Adresse',
  WEBSITE: 'Website',
  TOTAL_COST: 'Gesamtkosten',
  PAID_AMOUNT: 'Bezahlter Betrag',
  RATING: 'Bewertung',
  NOTES: 'Notizen',
  DESCRIPTION: 'Beschreibung',

  // Aktionen
  ADD: 'Dienstleister hinzufügen',
  EDIT: 'Dienstleister bearbeiten',
  DELETE: 'Dienstleister löschen',
  VIEW_DETAILS: 'Details ansehen',
  BOOK: 'Buchen',
  COMPARE: 'Vergleichen',

  // Premium
  PAYMENT_PLANS: 'Zahlungspläne',
  UNLIMITED: 'Unbegrenzte Dienstleister',
} as const;

// ============================================================================
// MODUL: LOCATIONS
// ============================================================================

export const LOCATION = {
  // Hauptentitäten
  MODULE_NAME: 'Locations',
  SINGULAR: 'Location',
  PLURAL: 'Locations',
  CONTRACT: 'Vertrag',
  CATEGORY: 'Kategorie',
  CATEGORY_PLURAL: 'Kategorien',
  DOCUMENT: 'Dokument',
  DOCUMENT_PLURAL: 'Dokumente',

  // Buchungsstatus
  BOOKING_STATUS: {
    INQUIRY: 'Anfrage',
    VISITED: 'Besichtigt',
    RESERVED: 'Reserviert',
    BOOKED: 'Gebucht',
    CONFIRMED: 'Bestätigt',
    CANCELLED: 'Storniert',
  },

  // Vertragsstatus
  CONTRACT_STATUS: {
    NOT_SENT: 'Nicht versendet',
    SENT: 'Versendet',
    SIGNED: 'Unterschrieben',
    COMPLETED: 'Abgeschlossen',
  },

  // Felder
  NAME: 'Name',
  DESCRIPTION: 'Beschreibung',
  ADDRESS: 'Adresse',
  CITY: 'Stadt',
  POSTAL_CODE: 'PLZ',
  COUNTRY: 'Land',
  CONTACT_NAME: 'Ansprechpartner',
  EMAIL: 'E-Mail',
  PHONE: 'Telefon',
  WEBSITE: 'Website',
  MAX_CAPACITY: 'Max. Kapazität',
  SEATED_CAPACITY: 'Sitzplätze',
  STANDING_CAPACITY: 'Stehplätze',
  RENTAL_COST: 'Mietkosten',
  DEPOSIT: 'Kaution',
  ADDITIONAL_COSTS: 'Zusatzkosten',
  TOTAL_COST: 'Gesamtkosten',
  VISIT_DATE: 'Besichtigungstermin',
  AMENITIES: 'Ausstattung',
  PARKING: 'Parkplätze',
  ACCESSIBILITY: 'Barrierefreiheit',
  CATERING_INCLUDED: 'Catering inklusive',
  CATERING_COST: 'Catering-Kosten pro Person',
  NOTES: 'Notizen',
  RATING: 'Bewertung',

  // Aktionen
  ADD: 'Location hinzufügen',
  EDIT: 'Location bearbeiten',
  DELETE: 'Location löschen',
  VIEW_DETAILS: 'Details ansehen',
  BOOK: 'Buchen',
  COMPARE: 'Vergleichen',
  MARK_AS_FAVORITE: 'Als Favorit markieren',
  SCHEDULE_VISIT: 'Besichtigung planen',

  // Standard-Kategorien
  CATEGORIES: {
    CHURCH: 'Kirche',
    REGISTRY_OFFICE: 'Standesamt',
    HALL: 'Saal',
    HOTEL: 'Hotel',
    RESTAURANT: 'Restaurant',
    OUTDOOR: 'Outdoor',
    CASTLE: 'Schloss',
    VINEYARD: 'Weingut',
    BARN: 'Scheune',
    BEACH: 'Strand',
    GARDEN: 'Garten',
  },

  // Premium Features
  UNLIMITED: 'Unbegrenzte Locations',
  ADVANCED_COMPARISON: 'Erweiterte Vergleichsfunktion',
} as const;

// ============================================================================
// MODUL: TIMELINE
// ============================================================================

export const TIMELINE = {
  // Hauptentitäten
  MODULE_NAME: 'Timeline',
  EVENT: 'Event',
  EVENT_PLURAL: 'Events',
  BUFFER: 'Puffer',
  BUFFER_PLURAL: 'Puffer',
  BLOCK: 'Block',
  BLOCK_PLURAL: 'Blöcke',

  // Event-Typen
  TYPE: {
    EVENT: 'Event',
    BUFFER: 'Puffer',
  },

  // Felder
  TIME: 'Uhrzeit',
  TITLE: 'Titel',
  DESCRIPTION: 'Beschreibung',
  LOCATION: 'Ort',
  DURATION: 'Dauer',
  ASSIGNED_TO: 'Zuständig',

  // Aktionen
  ADD_EVENT: 'Event hinzufügen',
  ADD_BUFFER: 'Puffer hinzufügen',
  EDIT_EVENT: 'Event bearbeiten',
  DELETE_EVENT: 'Event löschen',
  MOVE_EVENT: 'Event verschieben',

  // Premium
  BLOCK_PLANNING: 'Block-Planung',
  UNLIMITED_EVENTS: 'Unbegrenzte Events',
} as const;

// ============================================================================
// MODUL: AUFGABEN
// ============================================================================

export const TASK = {
  // Hauptentitäten
  MODULE_NAME: 'Aufgaben',
  SINGULAR: 'Aufgabe',
  PLURAL: 'Aufgaben',
  SUBTASK: 'Unteraufgabe',
  SUBTASK_PLURAL: 'Unteraufgaben',

  // Status
  STATUS: {
    PENDING: 'Ausstehend',
    IN_PROGRESS: 'In Bearbeitung',
    COMPLETED: 'Erledigt',
  },

  // Priorität
  PRIORITY: {
    LOW: 'Niedrig',
    MEDIUM: 'Mittel',
    HIGH: 'Hoch',
  },

  // Felder
  TITLE: 'Titel',
  DESCRIPTION: 'Beschreibung',
  ASSIGNED_TO: 'Zuständig',
  DUE_DATE: 'Fällig am',
  CATEGORY: 'Kategorie',
  NOTES: 'Notizen',

  // Aktionen
  ADD: 'Aufgabe hinzufügen',
  EDIT: 'Aufgabe bearbeiten',
  DELETE: 'Aufgabe löschen',
  COMPLETE: 'Als erledigt markieren',
  UNCOMPLETE: 'Als unerledigt markieren',

  // Filter
  SHOW_ALL: 'Alle anzeigen',
  SHOW_PENDING: 'Ausstehend',
  SHOW_IN_PROGRESS: 'In Bearbeitung',
  SHOW_COMPLETED: 'Erledigt',
  SHOW_OVERDUE: 'Überfällig',
} as const;

// ============================================================================
// MODUL: GÄSTE
// ============================================================================

export const GUEST = {
  // Hauptentitäten
  MODULE_NAME: 'Gäste',
  SINGULAR: 'Gast',
  PLURAL: 'Gäste',
  GROUP: 'Gruppe',
  GROUP_PLURAL: 'Gruppen',
  FAMILY: 'Familie',
  FAMILY_PLURAL: 'Familien',

  // RSVP Status
  RSVP_STATUS: {
    PLANNED: 'Geplant',
    INVITED: 'Eingeladen',
    ACCEPTED: 'Zugesagt',
    DECLINED: 'Abgesagt',
  },

  // Einladungs-Status
  INVITATION_STATUS: {
    NOT_SENT: 'Nicht versendet',
    SAVE_THE_DATE_SENT: 'Save-the-Date versendet',
    INVITATION_SENT: 'Einladung versendet',
    REMINDER_SENT: 'Erinnerung versendet',
  },

  // Altersgruppe
  AGE_GROUP: {
    ADULT: 'Erwachsene',
    CHILD: 'Kind',
    INFANT: 'Kleinkind',
  },

  // Felder
  NAME: 'Name',
  EMAIL: 'E-Mail',
  PHONE: 'Telefon',
  ADDRESS: 'Adresse',
  PLUS_ONE: 'Begleitung',
  VIP: 'VIP',
  DIETARY_RESTRICTIONS: 'Ernährungseinschränkungen',
  SPECIAL_NEEDS: 'Besondere Bedürfnisse',
  NOTES: 'Notizen',

  // Aktionen
  ADD: 'Gast hinzufügen',
  EDIT: 'Gast bearbeiten',
  DELETE: 'Gast löschen',
  INVITE: 'Einladen',
  SEND_REMINDER: 'Erinnerung senden',

  // Premium
  UNLIMITED: 'Unbegrenzte Gäste',
  FAMILY_GROUPS: 'Familiengruppen',
} as const;

// ============================================================================
// ALLGEMEINE BEGRIFFE
// ============================================================================

export const COMMON = {
  // Zeitfelder
  CREATED_AT: 'Erstellt am',
  UPDATED_AT: 'Aktualisiert am',
  DELETED_AT: 'Gelöscht am',

  // Standard-Felder
  ID: 'ID',
  NAME: 'Name',
  TITLE: 'Titel',
  DESCRIPTION: 'Beschreibung',
  NOTES: 'Notizen',
  STATUS: 'Status',
  PRIORITY: 'Priorität',
  CATEGORY: 'Kategorie',

  // Aktionen
  ADD: 'Hinzufügen',
  EDIT: 'Bearbeiten',
  DELETE: 'Löschen',
  SAVE: 'Speichern',
  CANCEL: 'Abbrechen',
  CLOSE: 'Schließen',
  BACK: 'Zurück',
  NEXT: 'Weiter',
  PREVIOUS: 'Zurück',
  CONFIRM: 'Bestätigen',

  // Filter & Suche
  FILTER: 'Filtern',
  SEARCH: 'Suchen',
  SORT_BY: 'Sortieren nach',
  SHOW_ALL: 'Alle anzeigen',

  // Tabs & Views
  OVERVIEW: 'Übersicht',
  DETAILS: 'Details',
  HISTORY: 'Verlauf',
  ATTACHMENTS: 'Anhänge',
  DOCUMENTS: 'Dokumente',
  FINANCES: 'Finanzen',

  // Export
  EXPORT: 'Exportieren',
  EXPORT_CSV: 'Als CSV exportieren',
  EXPORT_PDF: 'Als PDF exportieren',
  DOWNLOAD: 'Herunterladen',
  UPLOAD: 'Hochladen',

  // Fehler & Erfolg
  ERROR: 'Fehler',
  SUCCESS: 'Erfolgreich',
  WARNING: 'Warnung',
  INFO: 'Information',
  LOADING: 'Lädt...',
  NO_DATA: 'Keine Daten vorhanden',

  // Bestätigungen
  DELETE_CONFIRM: 'Wirklich löschen?',
  UNSAVED_CHANGES: 'Ungespeicherte Änderungen gehen verloren. Fortfahren?',
  ARE_YOU_SURE: 'Sind Sie sicher?',

  // Zeitangaben
  TODAY: 'Heute',
  YESTERDAY: 'Gestern',
  TOMORROW: 'Morgen',
  THIS_WEEK: 'Diese Woche',
  THIS_MONTH: 'Dieser Monat',

  // Sonstiges
  TOTAL: 'Gesamt',
  SUBTOTAL: 'Zwischensumme',
  AMOUNT: 'Betrag',
  DATE: 'Datum',
  TIME: 'Uhrzeit',
  LOCATION: 'Ort',
  CONTACT: 'Kontakt',
  PHONE: 'Telefon',
  EMAIL: 'E-Mail',
  ADDRESS: 'Adresse',
  WEBSITE: 'Website',
  RATING: 'Bewertung',
} as const;

// ============================================================================
// SUBSCRIPTION & PREMIUM
// ============================================================================

export const SUBSCRIPTION = {
  // Plan-Namen
  FREE: 'Free',
  PREMIUM: 'Premium',

  // Status
  ACTIVE: 'Aktiv',
  CANCELLED: 'Gekündigt',
  EXPIRED: 'Abgelaufen',

  // Limits (Free Plan)
  LIMITS: {
    GUESTS: '40 Gäste',
    BUDGET_ITEMS: '15 Budget-Posten',
    TIMELINE_EVENTS: '3 Timeline-Events',
    VENDORS: '5 Dienstleister',
  },

  // Call-to-Action
  UPGRADE_TO_PREMIUM: 'Auf Premium upgraden',
  UPGRADE_NOW: 'Jetzt upgraden',
  LEARN_MORE: 'Mehr erfahren',
  FEATURE_LOCKED: 'Premium-Feature',

  // Features
  UNLIMITED: 'Unbegrenzt',
  INCLUDED: 'Enthalten',
  NOT_INCLUDED: 'Nicht enthalten',
} as const;

// ============================================================================
// NAVIGATION
// ============================================================================

export const NAV = {
  DASHBOARD: 'Dashboard',
  OVERVIEW: 'Übersicht',
  TASKS: 'Aufgaben',
  BUDGET: 'Budget',
  GUESTS: 'Gäste',
  VENDORS: 'Dienstleister',
  LOCATIONS: 'Locations',
  TIMELINE: 'Timeline',
  SETTINGS: 'Einstellungen',
  PRIVACY: 'Datenschutz',
  SUBSCRIPTION: 'Abo',
  LOGOUT: 'Abmelden',
} as const;

// ============================================================================
// DATENBANK-MAPPING (für Kompatibilität)
// ============================================================================

/**
 * Maps UI-Begriffe zu Datenbank-Feldnamen
 * Verwendet für: Exports, API-Calls, Migrations
 */
export const DB_MAPPING = {
  // Budget
  'Budget-Posten': 'budget_items',
  'Kategorie': 'budget_categories',
  'Zahlung': 'budget_payments',
  'Geplante Kosten': 'estimated_cost',
  'Tatsächliche Kosten': 'actual_cost',

  // Vendor
  'Dienstleister': 'vendors',
  'Ansprechpartner': 'contact_name',
  'Gesamtkosten': 'total_cost',
  'Bezahlter Betrag': 'paid_amount',

  // Timeline
  'Event': 'timeline_events',
  'Uhrzeit': 'time',
  'Titel': 'title',
  'Beschreibung': 'description',
  'Ort': 'location',
  'Dauer': 'duration_minutes',

  // Task
  'Aufgabe': 'tasks',
  'Unteraufgabe': 'task_subtasks',
  'Fällig am': 'due_date',
  'Zuständig': 'assigned_to',

  // Guest
  'Gast': 'guests',
  'Gruppe': 'guest_groups',
  'Familie': 'family_groups',
  'Begleitung': 'plus_one',
  'Ernährungseinschränkungen': 'dietary_restrictions',
} as const;

// ============================================================================
// VALIDATION & BUILD-CHECK
// ============================================================================

/**
 * Verbotene Begriffe, die NICHT in UI-Texten verwendet werden dürfen
 * Build-Check prüft gegen diese Liste
 */
export const FORBIDDEN_TERMS = [
  // Budget
  'BudgetEntry',
  'CostItem',
  'Eintrag', // zu vage
  'Kosten-Item',

  // Timeline
  'Termin', // zu vage
  'Zeitblock', // verwirrend mit Block-Planning

  // Vendor
  'Anbieter', // veraltet
  'Service Provider',
  'Vendor', // nur in Code, nicht in UI

  // Task
  'ToDo',
  'Task', // nur in Code, nicht in UI

  // Guest
  'Guest', // nur in Code, nicht in UI

  // Allgemein
  'Item',
  'Entry',
  'Element', // zu vage
] as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BudgetTerms = typeof BUDGET;
export type VendorTerms = typeof VENDOR;
export type LocationTerms = typeof LOCATION;
export type TimelineTerms = typeof TIMELINE;
export type TaskTerms = typeof TASK;
export type GuestTerms = typeof GUEST;
export type CommonTerms = typeof COMMON;
export type SubscriptionTerms = typeof SUBSCRIPTION;
export type NavTerms = typeof NAV;
