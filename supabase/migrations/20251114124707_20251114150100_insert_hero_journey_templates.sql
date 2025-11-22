/*
  # Insert Hero Journey Step Templates

  Inserts predefined templates for all 10 hero journey steps with sample data.
*/

-- Budget Templates (Step 2)
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, guest_count_min, guest_count_max, budget_min, budget_max, sample_data, order_index) VALUES
('budget', 'Sparsam', 'Kleine, intime Hochzeit mit essentiellen Elementen', 'klein', 20, 40, 5000, 10000, '{"total_budget": 8000, "breakdown": {"location": 1500, "catering": 3500, "decoration": 800, "photography": 1200, "music": 600, "flowers": 400}, "tips": "Fokus auf das Wesentliche, DIY-Elemente nutzen"}', 1),
('budget', 'Standard', 'Klassische Hochzeit mit allen wichtigen Elementen', 'mittel', 50, 80, 12000, 20000, '{"total_budget": 15000, "breakdown": {"location": 3000, "catering": 6000, "decoration": 1500, "photography": 2000, "music": 1200, "flowers": 800, "invitations": 500}, "tips": "Ausgewogene Verteilung, professionelle Dienstleister"}', 2),
('budget', 'Komfort', 'Gehobene Hochzeit mit vielen Extras', 'groß', 80, 120, 20000, 35000, '{"total_budget": 25000, "breakdown": {"location": 5000, "catering": 10000, "decoration": 3000, "photography": 3000, "music": 2000, "flowers": 1500, "invitations": 500}, "tips": "Hochwertige Dienstleister, mehr Dekoration"}', 3),
('budget', 'Luxus', 'Exklusive Hochzeit ohne Kompromisse', 'exklusiv', 100, 200, 40000, 80000, '{"total_budget": 50000, "breakdown": {"location": 10000, "catering": 20000, "decoration": 6000, "photography": 5000, "music": 3000, "flowers": 3000, "invitations": 1000, "entertainment": 2000}, "tips": "Premium-Locations, Gourmet-Catering, Live-Band"}', 4);

-- Guest Count Templates (Step 3)
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, guest_count_min, guest_count_max, sample_data, order_index) VALUES
('guest_count', 'Intim', 'Kleine Hochzeit im engsten Kreis', 'klein', 20, 35, '{"target_count": 25, "structure": {"family": 50, "friends": 40, "colleagues": 10}, "example": "Nur engste Familie und beste Freunde"}', 1),
('guest_count', 'Klein', 'Gemütliche Feier mit den Liebsten', 'klein', 40, 65, '{"target_count": 50, "structure": {"family": 45, "friends": 40, "colleagues": 15}, "example": "Familie, enge Freunde, einige Kollegen"}', 2),
('guest_count', 'Mittel', 'Klassische Hochzeit mit gutem Mix', 'mittel', 70, 100, '{"target_count": 80, "structure": {"family": 40, "friends": 35, "colleagues": 25}, "example": "Erweiterte Familie, Freundeskreis, Arbeitskollegen"}', 3),
('guest_count', 'Groß', 'Große Feier mit vielen Gästen', 'groß', 110, 200, '{"target_count": 130, "structure": {"family": 35, "friends": 30, "colleagues": 20, "other": 15}, "example": "Große Familien, mehrere Freundeskreise"}', 4);

-- Timeline Templates (Step 8)
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, sample_data, order_index) VALUES
('timeline', 'Kompakt', 'Konzentrierte Feier über 8 Stunden', 'kurz', '{"duration_hours": 8, "events": [{"time": "14:00", "title": "Trauung", "duration": 45}, {"time": "15:00", "title": "Sektempfang & Fotos", "duration": 90}, {"time": "16:30", "title": "Kaffee & Kuchen", "duration": 60}, {"time": "18:00", "title": "Abendessen", "duration": 120}, {"time": "20:00", "title": "Torte anschneiden", "duration": 30}, {"time": "20:30", "title": "Party", "duration": 90}]}', 1),
('timeline', 'Standard', 'Klassischer Ablauf über 12 Stunden', 'standard', '{"duration_hours": 12, "events": [{"time": "14:00", "title": "Trauung", "duration": 60}, {"time": "15:00", "title": "Sektempfang & Fotos", "duration": 120}, {"time": "17:00", "title": "Kaffee & Kuchen", "duration": 90}, {"time": "18:30", "title": "Abendessen", "duration": 150}, {"time": "21:00", "title": "Torte anschneiden", "duration": 30}, {"time": "21:30", "title": "Erster Tanz", "duration": 15}, {"time": "22:00", "title": "Party", "duration": 240}]}', 2),
('timeline', 'Ausgedehnt', 'Lange Feier mit Getting Ready ab morgens', 'lang', '{"duration_hours": 16, "events": [{"time": "10:00", "title": "Getting Ready", "duration": 180}, {"time": "13:00", "title": "First Look & Paarfotos", "duration": 60}, {"time": "14:00", "title": "Trauung", "duration": 60}, {"time": "15:00", "title": "Sektempfang", "duration": 120}, {"time": "17:00", "title": "Gruppenfotos", "duration": 60}, {"time": "18:00", "title": "Kaffee & Kuchen", "duration": 90}, {"time": "19:30", "title": "Abendessen", "duration": 150}, {"time": "22:00", "title": "Torte & Spiele", "duration": 60}, {"time": "23:00", "title": "Party", "duration": 180}]}', 3);

-- Vision Templates (Step 1)
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, sample_data, order_index) VALUES
('vision', 'Rustikal', 'Natürlich, warm und bodenständig', 'stil', '{"text": "Wir wünschen uns eine entspannte, rustikale Feier in natürlicher Atmosphäre. Holz, Natur und warme Farben sollen dominieren. Die Stimmung soll authentisch und ungezwungen sein.", "keywords": ["Rustikal", "Natürlich", "Entspannt", "Warm", "Authentisch"]}', 1),
('vision', 'Elegant', 'Klassisch, zeitlos und stilvoll', 'stil', '{"text": "Unsere Hochzeit soll elegant und zeitlos sein. Klare Linien, edle Materialien und eine stilvolle Atmosphäre sind uns wichtig. Wir möchten eine festliche, aber nicht übertriebene Feier.", "keywords": ["Elegant", "Klassisch", "Stilvoll", "Festlich", "Zeitlos"]}', 2),
('vision', 'Boho', 'Locker, kreativ und individuell', 'stil', '{"text": "Wir träumen von einer lockeren Boho-Hochzeit mit viel Kreativität und persönlichen Details. Naturmaterialien, Makramee und wilde Blumen sollen die Dekoration prägen. Die Stimmung soll frei und ungezwungen sein.", "keywords": ["Boho", "Locker", "Kreativ", "Natürlich", "Individuell"]}', 3),
('vision', 'Modern', 'Minimalistisch, klar und zeitgemäß', 'stil', '{"text": "Unsere Hochzeit soll modern und minimalistisch sein. Klare Formen, reduzierte Dekoration und hochwertige Details sind uns wichtig. Wir möchten eine zeitgemäße, aber warme Atmosphäre schaffen.", "keywords": ["Modern", "Minimalistisch", "Klar", "Hochwertig", "Zeitgemäß"]}', 4);

-- Ceremony Templates (Step 5)
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, sample_data, order_index) VALUES
('ceremony', 'Standesamt', 'Klassische standesamtliche Trauung', 'trauung', '{"type": "civil", "duration": 30, "typical_cost": 100, "checklist": ["Anmeldung 6 Monate vorher", "Dokumente vorbereiten", "2 Trauzeugen organisieren", "Urkunden bestellen"], "tips": "Meist vormittags, sehr strukturiert"}', 1),
('ceremony', 'Kirche', 'Traditionelle kirchliche Trauung', 'trauung', '{"type": "religious", "duration": 60, "typical_cost": 500, "checklist": ["Traugespräch vereinbaren", "Kirchenmusik organisieren", "Blumenschmuck abstimmen", "Trauzeugen benennen"], "tips": "Feierlicher Rahmen, mehr Planung nötig"}', 2),
('ceremony', 'Freie Trauung', 'Individuelle freie Zeremonie', 'trauung', '{"type": "outdoor", "duration": 45, "typical_cost": 800, "checklist": ["Freien Redner buchen", "Location festlegen", "Zeremonie gestalten", "Plan B bei Regen"], "tips": "Sehr persönlich, viel Gestaltungsfreiheit"}', 3);

-- Style Theme Templates (Step 7)
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, sample_data, order_index) VALUES
('style', 'Gold & Weiß', 'Klassisch elegant mit Gold-Akzenten', 'farbpalette', '{"theme": "classic", "colors": {"primary": "#d4af37", "secondary": "#ffffff", "accent": "#c19a2e"}, "fonts": {"heading": "Playfair Display", "body": "Lato"}}', 1),
('style', 'Blush & Grau', 'Romantisch mit sanften Tönen', 'farbpalette', '{"theme": "romantic", "colors": {"primary": "#f4c2c2", "secondary": "#6b7280", "accent": "#9ca3af"}, "fonts": {"heading": "Cormorant", "body": "Open Sans"}}', 2),
('style', 'Salbei & Creme', 'Natürlich und beruhigend', 'farbpalette', '{"theme": "bohemian", "colors": {"primary": "#9caf88", "secondary": "#f5f5dc", "accent": "#7a9370"}, "fonts": {"heading": "Libre Baskerville", "body": "Montserrat"}}', 3),
('style', 'Terracotta & Beige', 'Warm und erdverbunden', 'farbpalette', '{"theme": "rustic", "colors": {"primary": "#e07a5f", "secondary": "#f2cc8f", "accent": "#81b29a"}, "fonts": {"heading": "Merriweather", "body": "Nunito"}}', 4);

-- Location Templates (Step 4)
INSERT INTO hero_journey_step_templates (step_id, template_name, template_description, category, guest_count_min, guest_count_max, budget_min, budget_max, sample_data, order_index) VALUES
('location', 'Scheune/Gut', 'Rustikale Location mit Charme', 'rustikal', 60, 150, 2000, 5000, '{"capacity": 100, "amenities": ["Überdachter Bereich", "Außenfläche", "Sanitäranlagen", "Parkplätze"], "typical_cost": 3500, "tips": "Oft mit Catering-Pflicht, eigene Dekoration möglich"}', 1),
('location', 'Hotel/Restaurant', 'All-inclusive mit Service', 'komfort', 50, 200, 3000, 8000, '{"capacity": 120, "amenities": ["Küche vorhanden", "Service-Personal", "Übernachtung möglich", "Indoor & Outdoor"], "typical_cost": 5000, "tips": "Weniger Eigenarbeit, oft Paket-Angebote"}', 2),
('location', 'Villa/Schloss', 'Exklusiv und beeindruckend', 'exklusiv', 80, 200, 5000, 15000, '{"capacity": 150, "amenities": ["Historisches Ambiente", "Parkanlage", "Exklusivität", "Übernachtung"], "typical_cost": 10000, "tips": "Höhere Kosten, dafür einzigartiges Ambiente"}', 3);
