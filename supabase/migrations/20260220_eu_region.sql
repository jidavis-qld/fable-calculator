-- ══════════════════════════════════════════════════════════════
-- EU region migration
-- Adds EU beef prices, nutrition data, and recipes.
-- EU nutrition mirrors UK values (same nutrient set and units).
-- Run in the Supabase SQL editor with the service role.
-- ══════════════════════════════════════════════════════════════

-- ── 1. Insert EU beef prices (€/kg) ──────────────────────────
INSERT INTO beef_prices (trim, fat_pct, price, price_unit, country) VALUES
  ('90CL Beef Trim', 0.10, 8.60, 'per_kg', 'EU'),
  ('85CL Beef Trim', 0.15, 7.50, 'per_kg', 'EU'),
  ('80CL Beef Trim', 0.20, 7.00, 'per_kg', 'EU'),
  ('75CL Beef Trim', 0.25, 6.50, 'per_kg', 'EU'),
  ('70CL Beef Trim', 0.30, 6.00, 'per_kg', 'EU'),
  ('65CL Beef Trim', 0.35, 5.20, 'per_kg', 'EU'),
  ('60CL Beef Trim', 0.40, 4.60, 'per_kg', 'EU');

-- ── 2. Insert EU nutrition data ───────────────────────────────
-- EU uses same nutrient names and values as UK (per 100g).

-- Shiitake Infusion FB080 (per 100g)
INSERT INTO nutrition (ingredient, nutrient, value, unit, country) VALUES
  ('shiitake', 'Energy (kJ)',       590,    'kJ',  'EU'),
  ('shiitake', 'Energy (Calories)', 141.01, 'Cal', 'EU'),
  ('shiitake', 'Total Fat',         9.25,   'g',   'EU'),
  ('shiitake', 'Saturated Fat',     0.8,    'g',   'EU'),
  ('shiitake', 'Carbohydrate',      16.5,   'g',   'EU'),
  ('shiitake', 'Total Sugars',      0,      'g',   'EU'),
  ('shiitake', 'Dietary Fiber',     13.1,   'g',   'EU'),
  ('shiitake', 'Protein',           4.58,   'g',   'EU'),
  ('shiitake', 'Salt',              0.4625, 'g',   'EU');

-- Beef trims (per 100g)
INSERT INTO nutrition (ingredient, nutrient, value, unit, country) VALUES
  -- 90CL Beef Trim
  ('90CL Beef Trim', 'Energy (kJ)',       736.384, 'kJ',  'EU'),
  ('90CL Beef Trim', 'Energy (Calories)', 176,     'Cal', 'EU'),
  ('90CL Beef Trim', 'Total Fat',         10,      'g',   'EU'),
  ('90CL Beef Trim', 'Saturated Fat',     3.9,     'g',   'EU'),
  ('90CL Beef Trim', 'Carbohydrate',      0,       'g',   'EU'),
  ('90CL Beef Trim', 'Total Sugars',      0,       'g',   'EU'),
  ('90CL Beef Trim', 'Dietary Fiber',     0,       'g',   'EU'),
  ('90CL Beef Trim', 'Protein',           20,      'g',   'EU'),
  ('90CL Beef Trim', 'Salt',              0.165,   'g',   'EU'),
  -- 85CL Beef Trim
  ('85CL Beef Trim', 'Energy (kJ)',       899.56,  'kJ',  'EU'),
  ('85CL Beef Trim', 'Energy (Calories)', 215,     'Cal', 'EU'),
  ('85CL Beef Trim', 'Total Fat',         15,      'g',   'EU'),
  ('85CL Beef Trim', 'Saturated Fat',     5.7,     'g',   'EU'),
  ('85CL Beef Trim', 'Carbohydrate',      0,       'g',   'EU'),
  ('85CL Beef Trim', 'Total Sugars',      0,       'g',   'EU'),
  ('85CL Beef Trim', 'Dietary Fiber',     0,       'g',   'EU'),
  ('85CL Beef Trim', 'Protein',           18.6,    'g',   'EU'),
  ('85CL Beef Trim', 'Salt',              0.165,   'g',   'EU'),
  -- 80CL Beef Trim
  ('80CL Beef Trim', 'Energy (kJ)',       1062.736,'kJ',  'EU'),
  ('80CL Beef Trim', 'Energy (Calories)', 254,     'Cal', 'EU'),
  ('80CL Beef Trim', 'Total Fat',         20,      'g',   'EU'),
  ('80CL Beef Trim', 'Saturated Fat',     7.6,     'g',   'EU'),
  ('80CL Beef Trim', 'Carbohydrate',      0,       'g',   'EU'),
  ('80CL Beef Trim', 'Total Sugars',      0,       'g',   'EU'),
  ('80CL Beef Trim', 'Dietary Fiber',     0,       'g',   'EU'),
  ('80CL Beef Trim', 'Protein',           17.2,    'g',   'EU'),
  ('80CL Beef Trim', 'Salt',              0.165,   'g',   'EU'),
  -- 75CL Beef Trim
  ('75CL Beef Trim', 'Energy (kJ)',       1225.912,'kJ',  'EU'),
  ('75CL Beef Trim', 'Energy (Calories)', 293,     'Cal', 'EU'),
  ('75CL Beef Trim', 'Total Fat',         25,      'g',   'EU'),
  ('75CL Beef Trim', 'Saturated Fat',     9.6,     'g',   'EU'),
  ('75CL Beef Trim', 'Carbohydrate',      0,       'g',   'EU'),
  ('75CL Beef Trim', 'Total Sugars',      0,       'g',   'EU'),
  ('75CL Beef Trim', 'Dietary Fiber',     0,       'g',   'EU'),
  ('75CL Beef Trim', 'Protein',           15.8,    'g',   'EU'),
  ('75CL Beef Trim', 'Salt',              0.165,   'g',   'EU'),
  -- 70CL Beef Trim
  ('70CL Beef Trim', 'Energy (kJ)',       1389.088,'kJ',  'EU'),
  ('70CL Beef Trim', 'Energy (Calories)', 332,     'Cal', 'EU'),
  ('70CL Beef Trim', 'Total Fat',         30,      'g',   'EU'),
  ('70CL Beef Trim', 'Saturated Fat',     11.8,    'g',   'EU'),
  ('70CL Beef Trim', 'Carbohydrate',      0,       'g',   'EU'),
  ('70CL Beef Trim', 'Total Sugars',      0,       'g',   'EU'),
  ('70CL Beef Trim', 'Dietary Fiber',     0,       'g',   'EU'),
  ('70CL Beef Trim', 'Protein',           14.4,    'g',   'EU'),
  ('70CL Beef Trim', 'Salt',              0.165,   'g',   'EU'),
  -- 65CL Beef Trim
  ('65CL Beef Trim', 'Energy (kJ)',       1552.264,'kJ',  'EU'),
  ('65CL Beef Trim', 'Energy (Calories)', 371,     'Cal', 'EU'),
  ('65CL Beef Trim', 'Total Fat',         35,      'g',   'EU'),
  ('65CL Beef Trim', 'Saturated Fat',     13.63,   'g',   'EU'),
  ('65CL Beef Trim', 'Carbohydrate',      0,       'g',   'EU'),
  ('65CL Beef Trim', 'Total Sugars',      0,       'g',   'EU'),
  ('65CL Beef Trim', 'Dietary Fiber',     0,       'g',   'EU'),
  ('65CL Beef Trim', 'Protein',           13,      'g',   'EU'),
  ('65CL Beef Trim', 'Salt',              0.165,   'g',   'EU'),
  -- 60CL Beef Trim
  ('60CL Beef Trim', 'Energy (kJ)',       1715.44, 'kJ',  'EU'),
  ('60CL Beef Trim', 'Energy (Calories)', 410,     'Cal', 'EU'),
  ('60CL Beef Trim', 'Total Fat',         40,      'g',   'EU'),
  ('60CL Beef Trim', 'Saturated Fat',     15.6,    'g',   'EU'),
  ('60CL Beef Trim', 'Carbohydrate',      0,       'g',   'EU'),
  ('60CL Beef Trim', 'Total Sugars',      0,       'g',   'EU'),
  ('60CL Beef Trim', 'Dietary Fiber',     0,       'g',   'EU'),
  ('60CL Beef Trim', 'Protein',           11.6,    'g',   'EU'),
  ('60CL Beef Trim', 'Salt',              0.165,   'g',   'EU');

-- ── 3. Insert EU recipes (same ratios as UK) ──────────────────
INSERT INTO recipes (format, recipe, beef_pct, fable_pct, water_pct, country)
SELECT format, recipe, beef_pct, fable_pct, water_pct, 'EU'
FROM recipes WHERE country = 'UK';
