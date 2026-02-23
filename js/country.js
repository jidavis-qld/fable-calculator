/* ── Country configuration & active country state ──────────────────────────────
   COUNTRY_CONFIG: per-country currency, prices, and nutritional claim thresholds.
   CC: the currently-active country config (mutated by selectCountry()).
   ─────────────────────────────────────────────────────────────────────────── */

/* ── Country configuration ────────────────────────── */
const COUNTRY_CONFIG = {
  'United States': {
    code:        'US',
    currency:    '$',
    priceUnit:   'per lb',
    fablePrice:  4.98,
    waterPrice:  0.001,
    // Serving size for US nutrition facts panel
    servingG:         112,  // 4 oz serving
    // Claim thresholds — per 100g (used by validator, stat tiles, scoring engine)
    highFiber:        5,    // g per 100g
    sourceFiber:      2.5,
    highProtein:      { mode: 'grams', g: 10 },
    sourceProtein:    { mode: 'grams', g: 5  },
    // Claim thresholds — per serving (USDA FSIS, 112g / 4 oz serving)
    // Fiber: USDA follows FDA DV of 28g — "Excellent source" ≥20% DV, "Good source" ≥10% DV
    highFiberServing:     5.6,  // g per serving (≥20% DV = excellent source)
    sourceFiberServing:   2.8,  // g per serving (≥10% DV = good source)
    // Protein: USDA FSIS — "Good source" ≥10g, "Excellent source" ≥20g per serving
    highProteinServing:   { mode: 'grams', g: 10 }, // ≥10g per serving (good source)
    sourceProteinServing: { mode: 'grams', g: 5  }, // ≥5g per serving (contains protein)
    fiberSpelling:        'Fiber',
    fiberConstraintSub:   '≥5g fiber per 100g — achievable in all blends',
    proteinConstraintSub: '≥10g protein per 100g — may affect trim selection',
  },
  'United Kingdom': {
    code:        'UK',
    currency:    '£',
    priceUnit:   'per kg',
    fablePrice:  6.00,
    waterPrice:  0.001,
    // Claim thresholds — UK Food Standards Agency definitions
    highFiber:        6,    // g per 100g
    sourceFiber:      3,    // g per 100g
    highProtein:      { mode: 'energyPct', pct: 20 }, // protein energy ≥20% of total kJ
    sourceProtein:    { mode: 'energyPct', pct: 10 },
    fiberSpelling:        'Fibre',
    fiberConstraintSub:   '≥6g fibre per 100g (UK high in fibre)',
    proteinConstraintSub: '≥20% energy from protein (UK high in protein)',
  },
  'Australia': {
    code:        'AU',
    currency:    '$',
    priceUnit:   'per kg',
    fablePrice:  10.50,
    waterPrice:  0.001,
    // Claim thresholds — FSANZ Standard 1.2.7
    highFiber:        7,    // g per 100g ("high in dietary fibre")
    sourceFiber:      4,    // g per 100g ("source of dietary fibre")
    highProtein:      { mode: 'grams', g: 10 },  // ≥10g per 100g
    sourceProtein:    { mode: 'grams', g: 5  },
    fiberSpelling:        'Fibre',
    fiberConstraintSub:   '≥7g fibre per 100g (AU high in fibre)',
    proteinConstraintSub: '≥10g protein per 100g',
  },
  'Europe': {
    code:        'EU',
    currency:    '€',
    priceUnit:   'per kg',
    fablePrice:  6.90,
    waterPrice:  0.001,
    // Claim thresholds — EU Regulation 1924/2006 (same as UK post-Brexit equivalents)
    highFiber:        6,    // g per 100g
    sourceFiber:      3,    // g per 100g
    highProtein:      { mode: 'energyPct', pct: 20 },
    sourceProtein:    { mode: 'energyPct', pct: 10 },
    fiberSpelling:        'Fibre',
    fiberConstraintSub:   '≥6g fibre per 100g (EU high in fibre)',
    proteinConstraintSub: '≥20% energy from protein (EU high in protein)',
  },
};

// Active country config — set when country is selected
let CC = COUNTRY_CONFIG['United States'];

/* ── DATA TABLES (loaded from Supabase) ───────────── */
let BEEF_PRICES  = {};   // { '80CL Beef Trim': { fat, price }, ... }
let RECIPES      = {};   // { 'Burger / Meatball': { '50/50, no water': [beef, fable, water] } }
let HEALTH_REF   = { shiitake: {}, beef: {} };
let FABLE_PRICE  = CC.fablePrice;
let WATER_PRICE  = CC.waterPrice;
let SHIITAKE_CO2 = 0;
let BEEF_CO2     = 0;
let SCORING_CONFIG = {};  // loaded from scoring_config table in Supabase

