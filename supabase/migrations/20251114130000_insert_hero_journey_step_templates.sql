/*
  # Insert Hero Journey Step Templates

  Adds predefined templates for each step in the hero journey
  to help users get started quickly with proven patterns.
*/

-- Budget Templates
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, guest_count_min, guest_count_max, budget_min, budget_max, sample_data, order_index) VALUES
('budget', 'Kleine Hochzeit', 'Perfekt für intime Feiern mit bis zu 50 Gästen', 'klein', 20, 50, 8000, 15000, '{"categories": ["Location", "Catering", "Fotografie", "Dekoration", "Unterhaltung"], "distribution": {"Location": 30, "Catering": 35, "Fotografie": 15, "Dekoration": 10, "Unterhaltung": 10}}', 1),
('budget', 'Mittlere Hochzeit', 'Ideal für 50-100 Gäste mit gutem Preis-Leistungs-Verhältnis', 'mittel', 50, 100, 15000, 30000, '{"categories": ["Location", "Catering", "Fotografie", "Dekoration", "Unterhaltung", "DJ/Band"], "distribution": {"Location": 25, "Catering": 35, "Fotografie": 15, "Dekoration": 10, "Unterhaltung": 10, "DJ/Band": 5}}', 2),
('budget', 'Große Hochzeit', 'Für große Feiern mit 100-150 Gästen', 'groß', 100, 150, 30000, 50000, '{"categories": ["Location", "Catering", "Fotografie", "Videografie", "Dekoration", "Blumen", "Unterhaltung", "DJ/Band"], "distribution": {"Location": 25, "Catering": 30, "Fotografie": 10, "Videografie": 8, "Dekoration": 8, "Blumen": 7, "Unterhaltung": 7, "DJ/Band": 5}}', 3),
('budget', 'Premium Hochzeit', 'Luxuriöse Feier ohne Kompromisse', 'exklusiv', 80, 120, 50000, 100000, '{"categories": ["Exklusive Location", "Premium Catering", "Fotografie", "Videografie", "Dekoration & Floristik", "Live-Band", "Hochzeitsplaner"], "distribution": {"Exklusive Location": 30, "Premium Catering": 28, "Fotografie": 10, "Videografie": 8, "Dekoration & Floristik": 12, "Live-Band": 7, "Hochzeitsplaner": 5}}', 4);

-- Guest Count Templates
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, guest_count_min, guest_count_max, sample_data, order_index) VALUES
('guest_count', 'Intime Feier', 'Nur engste Familie und beste Freunde (20-40 Personen)', 'klein', 20, 40, '{"breakdown": {"Familie Partner 1": 10, "Familie Partner 2": 10, "Gemeinsame Freunde": 15, "Trauzeugen": 2, "Kinder": 3}, "total": 40}', 1),
('guest_count', 'Klassische Hochzeit', 'Familie, Freunde und enge Bekannte (60-80 Personen)', 'mittel', 60, 80, '{"breakdown": {"Familie Partner 1": 20, "Familie Partner 2": 20, "Freunde Partner 1": 15, "Freunde Partner 2": 15, "Gemeinsame Freunde": 8, "Arbeitskollegen": 5, "Kinder": 7}, "total": 90}', 2),
('guest_count', 'Große Feier', 'Erweiterte Familie, viele Freunde (100-130 Personen)', 'groß', 100, 130, '{"breakdown": {"Familie Partner 1": 30, "Familie Partner 2": 30, "Freunde Partner 1": 20, "Freunde Partner 2": 20, "Gemeinsame Freunde": 15, "Arbeitskollegen": 10, "Kinder": 10}, "total": 135}', 3);

-- Timeline Templates
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, sample_data, order_index) VALUES
('timeline', 'Kompakte Feier', 'Trauung und Feier an einem Nachmittag/Abend (6-8 Stunden)', 'kurz', '{"events": [{"time": "14:00", "title": "Trauung", "duration": 30}, {"time": "14:30", "title": "Sektempfang & Fotos", "duration": 90}, {"time": "16:00", "title": "Kaffee & Kuchen", "duration": 60}, {"time": "17:00", "title": "Abendessen", "duration": 120}, {"time": "19:00", "title": "Eröffnungstanz", "duration": 15}, {"time": "19:15", "title": "Party", "duration": 225}, {"time": "22:30", "title": "Ausklang", "duration": 30}]}', 1),
('timeline', 'Standard Hochzeitstag', 'Klassischer Ablauf vom Nachmittag bis Mitternacht (8-10 Stunden)', 'standard', '{"events": [{"time": "13:00", "title": "Getting Ready", "duration": 120}, {"time": "15:00", "title": "Trauung", "duration": 45}, {"time": "15:45", "title": "Gratulationen & Sektempfang", "duration": 60}, {"time": "16:45", "title": "Fotoshooting", "duration": 90}, {"time": "18:15", "title": "Empfang der Gäste", "duration": 45}, {"time": "19:00", "title": "Dinner", "duration": 150}, {"time": "21:30", "title": "Eröffnungstanz", "duration": 15}, {"time": "21:45", "title": "Party", "duration": 195}, {"time": "00:45", "title": "Mitternachtssnack", "duration": 30}]}', 2),
('timeline', 'Ausgedehnte Feier', 'Von morgens bis spät in die Nacht (12-14 Stunden)', 'lang', '{"events": [{"time": "10:00", "title": "Getting Ready", "duration": 180}, {"time": "13:00", "title": "First Look", "duration": 30}, {"time": "13:30", "title": "Trauung", "duration": 45}, {"time": "14:15", "title": "Sektempfang", "duration": 75}, {"time": "15:30", "title": "Fotoshooting", "duration": 120}, {"time": "17:30", "title": "Kaffee & Kuchen", "duration": 60}, {"time": "18:30", "title": "Empfang & Aperitif", "duration": 60}, {"time": "19:30", "title": "Dinner", "duration": 180}, {"time": "22:30", "title": "Eröffnungstanz", "duration": 20}, {"time": "22:50", "title": "Party", "duration": 250}, {"time": "03:00", "title": "After Party", "duration": 120}]}', 3);

-- Ceremony Templates
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, sample_data, order_index) VALUES
('ceremony', 'Standesamt', 'Offizielle Trauung im Standesamt', 'trauung', '{"type": "Standesamt", "typical_duration": 20, "notes": "Terminvereinbarung frühzeitig erforderlich", "documents": ["Geburtsurkunden", "Personalausweise", "Ehefähigkeitszeugnis"]}', 1),
('ceremony', 'Kirchliche Trauung', 'Traditionelle Zeremonie in der Kirche', 'trauung', '{"type": "Kirchliche Trauung", "typical_duration": 45, "notes": "Traugespräche mit Pfarrer erforderlich", "preparation": ["Taufscheine", "Firmung", "Traugespräche"]}', 2),
('ceremony', 'Freie Trauung', 'Individuelle Zeremonie mit freiem Redner', 'trauung', '{"type": "Freie Trauung", "typical_duration": 30, "notes": "Redner frühzeitig buchen, persönliche Gestaltung möglich", "elements": ["Begrüßung", "Liebesgeschichte", "Gelübde", "Ringtausch", "Ritual"]}', 3),
('ceremony', 'Standesamt + Freie Trauung', 'Kombination aus offizieller und persönlicher Zeremonie', 'trauung', '{"type": "Kombiniert", "standesamt_duration": 20, "freie_trauung_duration": 30, "notes": "Standesamt für Rechtliches, freie Trauung für Emotionen"}', 4);

-- Style Templates
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, sample_data, order_index) VALUES
('personality', 'Romantisch & Elegant', 'Pastellfarben, Blumen, zeitlose Eleganz', 'farbpalette', '{"theme": "Romantisch", "colors": ["#FFE5E5", "#FFC1CC", "#E6E6FA", "#F5F5DC", "#FFFACD"], "style_elements": ["Rosen", "Kerzen", "Spitze", "Tüll", "Gold-Akzente"], "font_pairing": "Serif + Script"}', 1),
('personality', 'Modern & Minimalistisch', 'Klare Linien, neutrale Töne, weniger ist mehr', 'farbpalette', '{"theme": "Modern", "colors": ["#FFFFFF", "#F5F5F5", "#000000", "#D4AF37", "#808080"], "style_elements": ["Geometrie", "Glas", "Marmor", "Grün", "Clean Lines"], "font_pairing": "Sans-Serif modern"}', 2),
('personality', 'Rustikal & Natürlich', 'Holz, Grüntöne, Wildblumen, Vintage-Charme', 'rustikal', '{"theme": "Rustikal", "colors": ["#8B4513", "#DEB887", "#F5DEB3", "#556B2F", "#FFFAF0"], "style_elements": ["Holz", "Jute", "Wildblumen", "Laternen", "Vintage"], "font_pairing": "Handwriting + Serif"}', 3),
('personality', 'Glamourös & Luxuriös', 'Satte Farben, Gold, Kristall, opulente Details', 'komfort', '{"theme": "Glamourös", "colors": ["#000000", "#D4AF37", "#C0C0C0", "#8B0000", "#FFFFFF"], "style_elements": ["Kristall", "Samt", "Gold", "Spiegel", "Drama"], "font_pairing": "Bold Serif + Elegant"}', 4);

-- Location Templates
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, guest_count_min, guest_count_max, sample_data, order_index) VALUES
('location', 'Scheune / Landhof', 'Rustikale Atmosphäre, ideal für lockere Feiern', 'rustikal', 50, 120, '{"location_type": "Scheune", "capacity": "50-120", "advantages": ["Authentische Atmosphäre", "Großer Außenbereich", "Flexibel gestaltbar"], "considerations": ["Wetter-Backup nötig", "Heizung im Winter", "Evtl. Zelt erforderlich"]}', 1),
('location', 'Hotel / Restaurant', 'Komfortabel, All-Inclusive-Service', 'komfort', 40, 150, '{"location_type": "Hotel", "capacity": "40-150", "advantages": ["Full Service", "Übernachtung für Gäste", "Wetterunabhängig"], "considerations": ["Weniger individuell", "Höhere Kosten", "Feste Paketpreise"]}', 2),
('location', 'Schloss / Herrenhaus', 'Elegante, repräsentative Kulisse', 'exklusiv', 60, 200, '{"location_type": "Schloss", "capacity": "60-200", "advantages": ["Beeindruckende Kulisse", "Fotogene Umgebung", "Exklusivität"], "considerations": ["Hohe Kosten", "Früh buchen", "Evtl. Auflagen"]}', 3),
('location', 'Outdoor / Garten', 'Naturnahe Feier unter freiem Himmel', 'natur', 30, 100, '{"location_type": "Outdoor", "capacity": "30-100", "advantages": ["Natürliche Schönheit", "Flexible Gestaltung", "Einzigartige Atmosphäre"], "considerations": ["Wetter-Risiko", "Backup-Plan notwendig", "Zelt/Infrastruktur"]}', 4);

-- Personal Planning Templates
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, sample_data, order_index) VALUES
('personal_planning', 'Braut-Outfit Checkliste', 'Alles rund um das Brautkleid und Styling', 'stil', '{"tasks": ["Brautkleid aussuchen", "Änderungen terminieren", "Schuhe kaufen", "Accessoires wählen", "Hairstyling buchen", "Make-up Probe", "Unterwäsche besorgen", "Notfall-Kit"], "timeline": "6-12 Monate vor Hochzeit"}', 1),
('personal_planning', 'Bräutigam-Outfit Checkliste', 'Anzug, Accessoires und Styling', 'stil', '{"tasks": ["Anzug/Smoking auswählen", "Hemd & Krawatte/Fliege", "Schuhe kaufen", "Manschettenknöpfe", "Ansteckblume", "Friseur-Termin"], "timeline": "3-6 Monate vor Hochzeit"}', 2),
('personal_planning', 'Ringe & Gelübde', 'Die emotionalen Höhepunkte vorbereiten', 'persönlich', '{"tasks": ["Eheringe aussuchen", "Gravur festlegen", "Gelübde schreiben", "Ringkissen/Träger organisieren", "Probe-Lesung"], "timeline": "4-6 Monate vor Hochzeit"}', 3);

-- Guest Planning Templates
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, sample_data, order_index) VALUES
('guest_planning', 'Save-the-Date Timeline', 'Frühe Information der Gäste', 'kommunikation', '{"timeline": "9-12 Monate vorher", "tasks": ["Design wählen", "Adressen sammeln", "Drucken/Digital versenden", "Website erstellen"], "tips": ["Datum & Ort mitteilen", "Noch keine Details nötig", "Online-RSVP vorbereiten"]}', 1),
('guest_planning', 'Einladungen Workflow', 'Offizielle Einladungen gestalten und versenden', 'kommunikation', '{"timeline": "3-4 Monate vorher", "tasks": ["Design finalisieren", "Texte formulieren", "Drucken", "Adressieren", "Versenden", "RSVPs tracken"], "content": ["Namen", "Datum & Uhrzeit", "Adresse", "Dresscode", "RSVP-Deadline", "Infos (Hotel, Geschenke)"]}', 2),
('guest_planning', 'Sitzplan Organisation', 'Durchdachte Tischordnung für harmonisches Miteinander', 'planung', '{"timeline": "2-4 Wochen vorher", "tasks": ["Finale Gästezahl", "Tische festlegen", "Gruppieren nach Beziehung", "Sitzplan erstellen", "Tischkarten gestalten"], "tips": ["Dynamik beachten", "Kinder-Tisch", "VIP-Tisch", "Flexibel bleiben"]}', 3);

-- Vision Templates
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, sample_data, order_index) VALUES
('vision', 'Romantischer Traum', 'Märchenhafte Atmosphäre voller Emotionen', 'stil', '{"keywords": ["Romantisch", "Elegant", "Emotional", "Blumen", "Kerzen"], "vision_text": "Unsere Hochzeit soll ein romantischer Traum werden - voller Blumen, Kerzen und emotionaler Momente. Eine elegante Feier, bei der Liebe und Verbundenheit im Mittelpunkt stehen."}', 1),
('vision', 'Lockere Garten-Party', 'Entspannte Feier mit Freunden unter freiem Himmel', 'stil', '{"keywords": ["Locker", "Natürlich", "Outdoor", "Entspannt", "Fröhlich"], "vision_text": "Wir wünschen uns eine lockere Garten-Party mit unseren liebsten Menschen. Gutes Essen, Musik und viel Lachen in natürlicher Atmosphäre - entspannt und fröhlich."}', 2),
('vision', 'Modernes Statement', 'Stilvolle Feier mit klarem Design und besonderem Wow-Faktor', 'stil', '{"keywords": ["Modern", "Stylish", "Urban", "Minimalistisch", "Besonders"], "vision_text": "Unsere Hochzeit soll ein modernes Statement sein - klares Design, außergewöhnliche Location, stilvolle Details. Weniger ist mehr, aber jedes Element sitzt perfekt."}', 3);

-- Make all templates active
UPDATE hero_journey_step_templates SET is_active = true WHERE is_active IS NULL;
