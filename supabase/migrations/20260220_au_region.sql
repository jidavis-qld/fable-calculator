-- ══════════════════════════════════════════════════════════════
-- AU region migration
-- Adds AU beef prices, nutrition data, and recipes.
-- AU nutrition uses Sodium (mg) rather than Salt (g), per FSANZ labelling.
-- Run in the Supabase SQL editor with the service role.
-- ══════════════════════════════════════════════════════════════

-- ── 1. Insert AU beef prices (AUD/kg) ────────────────────────
INSERT INTO beef_prices (trim, fat_pct, price, price_unit, country) VALUES
  ('90CL Beef Trim', 0.10, 10.50, 'per_kg', 'AU'),
  ('85CL Beef Trim', 0.15,  9.75, 'per_kg', 'AU'),
  ('80CL Beef Trim', 0.20,  9.00, 'per_kg', 'AU'),
  ('75CL Beef Trim', 0.25,  8.50, 'per_kg', 'AU'),
  ('70CL Beef Trim', 0.30,  8.00, 'per_kg', 'AU'),
  ('65CL Beef Trim', 0.35,  7.50, 'per_kg', 'AU'),
  ('60CL Beef Trim', 0.40,  7.00, 'per_kg', 'AU');

-- ── 2. Insert AU nutrition data (per 100g) ────────────────────
-- AU uses Sodium (mg) per FSANZ labelling rules; no Salt column.
-- Energy (kJ) only — no kcal column required in AU.

-- Shiitake Infusion FB080
INSERT INTO nutrition (ingredient, nutrient, value, unit, country) VALUES
  ('shiitake', 'Energy (kJ)',    590,    'kJ', 'AU'),
  ('shiitake', 'Protein',        4.58,   'g',  'AU'),
  ('shiitake', 'Total Fat',      9.25,   'g',  'AU'),
  ('shiitake', 'Saturated Fat',  0.80,   'g',  'AU'),
  ('shiitake', 'Carbohydrate',   16.5,   'g',  'AU'),
  ('shiitake', 'Total Sugars',   0,      'g',  'AU'),
  ('shiitake', 'Dietary Fibre',  13.1,   'g',  'AU'),
  ('shiitake', 'Sodium',         185,    'mg', 'AU');

-- Beef trims (per 100g) — same values as UK/EU, Sodium 66mg for all trims
INSERT INTO nutrition (ingredient, nutrient, value, unit, country) VALUES
  -- 90CL
  ('90CL Beef Trim', 'Energy (kJ)',   736.4,  'kJ', 'AU'),
  ('90CL Beef Trim', 'Protein',       20.0,   'g',  'AU'),
  ('90CL Beef Trim', 'Total Fat',     10.0,   'g',  'AU'),
  ('90CL Beef Trim', 'Saturated Fat', 3.9,    'g',  'AU'),
  ('90CL Beef Trim', 'Carbohydrate',  0,      'g',  'AU'),
  ('90CL Beef Trim', 'Total Sugars',  0,      'g',  'AU'),
  ('90CL Beef Trim', 'Dietary Fibre', 0,      'g',  'AU'),
  ('90CL Beef Trim', 'Sodium',        66,     'mg', 'AU'),
  -- 85CL
  ('85CL Beef Trim', 'Energy (kJ)',   899.6,  'kJ', 'AU'),
  ('85CL Beef Trim', 'Protein',       18.6,   'g',  'AU'),
  ('85CL Beef Trim', 'Total Fat',     15.0,   'g',  'AU'),
  ('85CL Beef Trim', 'Saturated Fat', 5.7,    'g',  'AU'),
  ('85CL Beef Trim', 'Carbohydrate',  0,      'g',  'AU'),
  ('85CL Beef Trim', 'Total Sugars',  0,      'g',  'AU'),
  ('85CL Beef Trim', 'Dietary Fibre', 0,      'g',  'AU'),
  ('85CL Beef Trim', 'Sodium',        66,     'mg', 'AU'),
  -- 80CL
  ('80CL Beef Trim', 'Energy (kJ)',   1062.7, 'kJ', 'AU'),
  ('80CL Beef Trim', 'Protein',       17.2,   'g',  'AU'),
  ('80CL Beef Trim', 'Total Fat',     20.0,   'g',  'AU'),
  ('80CL Beef Trim', 'Saturated Fat', 7.6,    'g',  'AU'),
  ('80CL Beef Trim', 'Carbohydrate',  0,      'g',  'AU'),
  ('80CL Beef Trim', 'Total Sugars',  0,      'g',  'AU'),
  ('80CL Beef Trim', 'Dietary Fibre', 0,      'g',  'AU'),
  ('80CL Beef Trim', 'Sodium',        66,     'mg', 'AU'),
  -- 75CL
  ('75CL Beef Trim', 'Energy (kJ)',   1225.9, 'kJ', 'AU'),
  ('75CL Beef Trim', 'Protein',       15.8,   'g',  'AU'),
  ('75CL Beef Trim', 'Total Fat',     25.0,   'g',  'AU'),
  ('75CL Beef Trim', 'Saturated Fat', 9.6,    'g',  'AU'),
  ('75CL Beef Trim', 'Carbohydrate',  0,      'g',  'AU'),
  ('75CL Beef Trim', 'Total Sugars',  0,      'g',  'AU'),
  ('75CL Beef Trim', 'Dietary Fibre', 0,      'g',  'AU'),
  ('75CL Beef Trim', 'Sodium',        66,     'mg', 'AU'),
  -- 70CL
  ('70CL Beef Trim', 'Energy (kJ)',   1389.1, 'kJ', 'AU'),
  ('70CL Beef Trim', 'Protein',       14.4,   'g',  'AU'),
  ('70CL Beef Trim', 'Total Fat',     30.0,   'g',  'AU'),
  ('70CL Beef Trim', 'Saturated Fat', 11.8,   'g',  'AU'),
  ('70CL Beef Trim', 'Carbohydrate',  0,      'g',  'AU'),
  ('70CL Beef Trim', 'Total Sugars',  0,      'g',  'AU'),
  ('70CL Beef Trim', 'Dietary Fibre', 0,      'g',  'AU'),
  ('70CL Beef Trim', 'Sodium',        66,     'mg', 'AU'),
  -- 65CL
  ('65CL Beef Trim', 'Energy (kJ)',   1552.3, 'kJ', 'AU'),
  ('65CL Beef Trim', 'Protein',       13.0,   'g',  'AU'),
  ('65CL Beef Trim', 'Total Fat',     35.0,   'g',  'AU'),
  ('65CL Beef Trim', 'Saturated Fat', 13.63,  'g',  'AU'),
  ('65CL Beef Trim', 'Carbohydrate',  0,      'g',  'AU'),
  ('65CL Beef Trim', 'Total Sugars',  0,      'g',  'AU'),
  ('65CL Beef Trim', 'Dietary Fibre', 0,      'g',  'AU'),
  ('65CL Beef Trim', 'Sodium',        66,     'mg', 'AU'),
  -- 60CL
  ('60CL Beef Trim', 'Energy (kJ)',   1715.4, 'kJ', 'AU'),
  ('60CL Beef Trim', 'Protein',       11.6,   'g',  'AU'),
  ('60CL Beef Trim', 'Total Fat',     40.0,   'g',  'AU'),
  ('60CL Beef Trim', 'Saturated Fat', 15.6,   'g',  'AU'),
  ('60CL Beef Trim', 'Carbohydrate',  0,      'g',  'AU'),
  ('60CL Beef Trim', 'Total Sugars',  0,      'g',  'AU'),
  ('60CL Beef Trim', 'Dietary Fibre', 0,      'g',  'AU'),
  ('60CL Beef Trim', 'Sodium',        66,     'mg', 'AU');

-- ── 3. Insert AU recipes (same ratios as UK) ──────────────────
INSERT INTO recipes (format, recipe, beef_pct, fable_pct, water_pct, country)
SELECT format, recipe, beef_pct, fable_pct, water_pct, 'AU'
FROM recipes WHERE country = 'UK';
