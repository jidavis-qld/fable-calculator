-- ══════════════════════════════════════════════════════════════
-- Multi-country migration
-- Renames US-specific tables to generic names, adds country column
-- to country-specific tables, and renames price_per_lb → price
-- with a price_unit column. Inserts UK data.
-- Run in the Supabase SQL editor with the service role.
-- ══════════════════════════════════════════════════════════════

-- ── 1. Rename tables ──────────────────────────────────────────
ALTER TABLE us_nutrition RENAME TO nutrition;
ALTER TABLE us_recipes   RENAME TO recipes;
-- us_recipe_ranks_view is a view — recreate below after base table rename

-- ── 2. Add country column to country-specific tables ──────────
ALTER TABLE nutrition   ADD COLUMN country TEXT NOT NULL DEFAULT 'US';
ALTER TABLE recipes     ADD COLUMN country TEXT NOT NULL DEFAULT 'US';
ALTER TABLE beef_prices ADD COLUMN country TEXT NOT NULL DEFAULT 'US';

-- ── 3. Rename price_per_lb → price, add price_unit column ─────
ALTER TABLE beef_prices RENAME COLUMN price_per_lb TO price;
ALTER TABLE beef_prices ADD COLUMN price_unit TEXT NOT NULL DEFAULT 'per_lb';

-- ── 4. Create generic recipe_ranks_view (keep us_recipe_ranks_view intact) ──
-- The old us_recipe_ranks_view computes scores internally — we UNION it for
-- both US and UK since recipes share the same ratios and rankings.
CREATE OR REPLACE VIEW recipe_ranks_view AS
  SELECT id, format, recipe, 'US' AS country, nutrition_rank, cost_rank, sustainability_rank, high_fiber
  FROM us_recipe_ranks_view
  UNION ALL
  SELECT id, format, recipe, 'UK' AS country, nutrition_rank, cost_rank, sustainability_rank, high_fiber
  FROM us_recipe_ranks_view;

-- ── 5. Insert UK beef prices (£/kg) ──────────────────────────
INSERT INTO beef_prices (trim, fat_pct, price, price_unit, country) VALUES
  ('90CL Beef Trim', 0.10, 7.50, 'per_kg', 'UK'),
  ('85CL Beef Trim', 0.15, 6.50, 'per_kg', 'UK'),
  ('80CL Beef Trim', 0.20, 6.00, 'per_kg', 'UK'),
  ('75CL Beef Trim', 0.25, 5.50, 'per_kg', 'UK'),
  ('70CL Beef Trim', 0.30, 5.00, 'per_kg', 'UK'),
  ('65CL Beef Trim', 0.35, 4.50, 'per_kg', 'UK'),
  ('60CL Beef Trim', 0.40, 4.00, 'per_kg', 'UK');

-- ── 6. Insert UK nutrition data ───────────────────────────────
-- Shiitake Infusion FB080 (per 100g) — UK nutrient names
INSERT INTO nutrition (ingredient, nutrient, value, unit, country) VALUES
  ('shiitake', 'Energy (kJ)',       590,    'kJ',  'UK'),
  ('shiitake', 'Energy (Calories)', 141.01, 'Cal', 'UK'),
  ('shiitake', 'Total Fat',         9.25,   'g',   'UK'),
  ('shiitake', 'Saturated Fat',     0.8,    'g',   'UK'),
  ('shiitake', 'Carbohydrate',      16.5,   'g',   'UK'),
  ('shiitake', 'Total Sugars',      0,      'g',   'UK'),
  ('shiitake', 'Dietary Fiber',     13.1,   'g',   'UK'),
  ('shiitake', 'Protein',           4.58,   'g',   'UK'),
  ('shiitake', 'Salt',              0.4625, 'g',   'UK');

-- Beef trims (per 100g) — UK nutrient names
INSERT INTO nutrition (ingredient, nutrient, value, unit, country) VALUES
  -- 90CL Beef Trim
  ('90CL Beef Trim', 'Energy (kJ)',       736.384, 'kJ',  'UK'),
  ('90CL Beef Trim', 'Energy (Calories)', 176,     'Cal', 'UK'),
  ('90CL Beef Trim', 'Total Fat',         10,      'g',   'UK'),
  ('90CL Beef Trim', 'Saturated Fat',     3.9,     'g',   'UK'),
  ('90CL Beef Trim', 'Carbohydrate',      0,       'g',   'UK'),
  ('90CL Beef Trim', 'Total Sugars',      0,       'g',   'UK'),
  ('90CL Beef Trim', 'Dietary Fiber',     0,       'g',   'UK'),
  ('90CL Beef Trim', 'Protein',           20,      'g',   'UK'),
  ('90CL Beef Trim', 'Salt',              0.165,   'g',   'UK'),
  -- 85CL Beef Trim
  ('85CL Beef Trim', 'Energy (kJ)',       899.56,  'kJ',  'UK'),
  ('85CL Beef Trim', 'Energy (Calories)', 215,     'Cal', 'UK'),
  ('85CL Beef Trim', 'Total Fat',         15,      'g',   'UK'),
  ('85CL Beef Trim', 'Saturated Fat',     5.7,     'g',   'UK'),
  ('85CL Beef Trim', 'Carbohydrate',      0,       'g',   'UK'),
  ('85CL Beef Trim', 'Total Sugars',      0,       'g',   'UK'),
  ('85CL Beef Trim', 'Dietary Fiber',     0,       'g',   'UK'),
  ('85CL Beef Trim', 'Protein',           18.6,    'g',   'UK'),
  ('85CL Beef Trim', 'Salt',              0.165,   'g',   'UK'),
  -- 80CL Beef Trim
  ('80CL Beef Trim', 'Energy (kJ)',       1062.736,'kJ',  'UK'),
  ('80CL Beef Trim', 'Energy (Calories)', 254,     'Cal', 'UK'),
  ('80CL Beef Trim', 'Total Fat',         20,      'g',   'UK'),
  ('80CL Beef Trim', 'Saturated Fat',     7.6,     'g',   'UK'),
  ('80CL Beef Trim', 'Carbohydrate',      0,       'g',   'UK'),
  ('80CL Beef Trim', 'Total Sugars',      0,       'g',   'UK'),
  ('80CL Beef Trim', 'Dietary Fiber',     0,       'g',   'UK'),
  ('80CL Beef Trim', 'Protein',           17.2,    'g',   'UK'),
  ('80CL Beef Trim', 'Salt',              0.165,   'g',   'UK'),
  -- 75CL Beef Trim
  ('75CL Beef Trim', 'Energy (kJ)',       1225.912,'kJ',  'UK'),
  ('75CL Beef Trim', 'Energy (Calories)', 293,     'Cal', 'UK'),
  ('75CL Beef Trim', 'Total Fat',         25,      'g',   'UK'),
  ('75CL Beef Trim', 'Saturated Fat',     9.6,     'g',   'UK'),
  ('75CL Beef Trim', 'Carbohydrate',      0,       'g',   'UK'),
  ('75CL Beef Trim', 'Total Sugars',      0,       'g',   'UK'),
  ('75CL Beef Trim', 'Dietary Fiber',     0,       'g',   'UK'),
  ('75CL Beef Trim', 'Protein',           15.8,    'g',   'UK'),
  ('75CL Beef Trim', 'Salt',              0.165,   'g',   'UK'),
  -- 70CL Beef Trim
  ('70CL Beef Trim', 'Energy (kJ)',       1389.088,'kJ',  'UK'),
  ('70CL Beef Trim', 'Energy (Calories)', 332,     'Cal', 'UK'),
  ('70CL Beef Trim', 'Total Fat',         30,      'g',   'UK'),
  ('70CL Beef Trim', 'Saturated Fat',     11.8,    'g',   'UK'),
  ('70CL Beef Trim', 'Carbohydrate',      0,       'g',   'UK'),
  ('70CL Beef Trim', 'Total Sugars',      0,       'g',   'UK'),
  ('70CL Beef Trim', 'Dietary Fiber',     0,       'g',   'UK'),
  ('70CL Beef Trim', 'Protein',           14.4,    'g',   'UK'),
  ('70CL Beef Trim', 'Salt',              0.165,   'g',   'UK'),
  -- 65CL Beef Trim
  ('65CL Beef Trim', 'Energy (kJ)',       1552.264,'kJ',  'UK'),
  ('65CL Beef Trim', 'Energy (Calories)', 371,     'Cal', 'UK'),
  ('65CL Beef Trim', 'Total Fat',         35,      'g',   'UK'),
  ('65CL Beef Trim', 'Saturated Fat',     13.63,   'g',   'UK'),
  ('65CL Beef Trim', 'Carbohydrate',      0,       'g',   'UK'),
  ('65CL Beef Trim', 'Total Sugars',      0,       'g',   'UK'),
  ('65CL Beef Trim', 'Dietary Fiber',     0,       'g',   'UK'),
  ('65CL Beef Trim', 'Protein',           13,      'g',   'UK'),
  ('65CL Beef Trim', 'Salt',              0.165,   'g',   'UK'),
  -- 60CL Beef Trim
  ('60CL Beef Trim', 'Energy (kJ)',       1715.44, 'kJ',  'UK'),
  ('60CL Beef Trim', 'Energy (Calories)', 410,     'Cal', 'UK'),
  ('60CL Beef Trim', 'Total Fat',         40,      'g',   'UK'),
  ('60CL Beef Trim', 'Saturated Fat',     15.6,    'g',   'UK'),
  ('60CL Beef Trim', 'Carbohydrate',      0,       'g',   'UK'),
  ('60CL Beef Trim', 'Total Sugars',      0,       'g',   'UK'),
  ('60CL Beef Trim', 'Dietary Fiber',     0,       'g',   'UK'),
  ('60CL Beef Trim', 'Protein',           11.6,    'g',   'UK'),
  ('60CL Beef Trim', 'Salt',              0.165,   'g',   'UK');

-- ── 7. Copy US recipes to recipes table with country='US' ─────
-- (Already done implicitly by the rename + DEFAULT 'US' above)
-- No action needed — existing rows now have country='US'.

-- ── 8. Insert UK recipes (same ratios as US — country only) ───
INSERT INTO recipes (format, recipe, beef_pct, fable_pct, water_pct, country)
SELECT format, recipe, beef_pct, fable_pct, water_pct, 'UK'
FROM recipes WHERE country = 'US';
