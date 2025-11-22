/*
  # Synchronize Vendor Categories to German Names

  ## Description
  Updates vendor.category field to use German names matching vendor_categories table

  ## Changes
  1. Maps English category names to German equivalents:
     - photography → Fotografie
     - location → Location
     - catering → Catering
     - videography → Videografie
     - music → Musik
     - flowers → Floristik
     - decoration → Dekoration
     - transport → Transport
     - cake → Hochzeitstorte
     - other → Sonstiges

  ## Notes
  - Ensures consistency between vendors.category and vendor_categories.name
  - Case-insensitive matching for flexibility
*/

-- Update vendor categories to match German naming in vendor_categories
UPDATE vendors SET category = 'Fotografie' WHERE LOWER(category) IN ('photography', 'fotografie', 'photo');
UPDATE vendors SET category = 'Location' WHERE LOWER(category) IN ('location', 'venue');
UPDATE vendors SET category = 'Catering' WHERE LOWER(category) = 'catering';
UPDATE vendors SET category = 'Videografie' WHERE LOWER(category) IN ('videography', 'videografie', 'video');
UPDATE vendors SET category = 'Musik' WHERE LOWER(category) IN ('music', 'musik', 'dj');
UPDATE vendors SET category = 'Floristik' WHERE LOWER(category) IN ('flowers', 'floristik', 'floristry');
UPDATE vendors SET category = 'Dekoration' WHERE LOWER(category) IN ('decoration', 'dekoration', 'decor');
UPDATE vendors SET category = 'Transport' WHERE LOWER(category) = 'transport';
UPDATE vendors SET category = 'Hochzeitstorte' WHERE LOWER(category) IN ('cake', 'hochzeitstorte', 'wedding cake');
UPDATE vendors SET category = 'Sonstiges' WHERE LOWER(category) IN ('other', 'sonstiges', 'misc', 'miscellaneous');

-- Update any remaining uncategorized vendors
UPDATE vendors 
SET category = 'Sonstiges' 
WHERE category IS NULL 
   OR category = '' 
   OR category NOT IN (
     'Fotografie', 'Location', 'Catering', 'Videografie', 
     'Musik', 'Floristik', 'Dekoration', 'Transport', 
     'Hochzeitstorte', 'Sonstiges'
   );
