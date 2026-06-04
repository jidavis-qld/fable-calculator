/* ── Supabase data loading (calculator) ─────────────────────────────────────────
   SUPABASE_URL / SUPABASE_KEY: connection credentials — declared in
               js/supabase-config.js, which must load before this file.
   sbFetch():   thin wrapper around the Supabase REST API — shared by both pages.
   loadData():  calculator-specific loader. Uses CC (from country.js) to filter
               by country, then populates BEEF_PRICES, RECIPES, HEALTH_REF,
               SHIITAKE_CO2, BEEF_CO2, SCORING_CONFIG.
               The validator page runs its own inline loader in validator.html.
   ─────────────────────────────────────────────────────────────────────────── */

async function sbFetch(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*${params ? '&' + params : ''}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  return res.json();
}


async function loadData() {
  const countryCode = CC.code;
  const countryFilter = `country=eq.${countryCode}`;

  const [nutrition, beefPrices, recipes, co2, scoringCfg] = await Promise.all([
    sbFetch('nutrition',   countryFilter),
    sbFetch('beef_prices', countryFilter),
    sbFetch('recipes',     countryFilter),
    sbFetch('co2_kg_e'),
    sbFetch('scoring_config'),
  ]);

  // Reset data stores for fresh load
  BEEF_PRICES = {}; RECIPES = {}; HEALTH_REF = { shiitake: {}, beef: {} };
  FABLE_PRICE = CC.fablePrice; WATER_PRICE = CC.waterPrice;

  // Build BEEF_PRICES
  beefPrices.forEach(r => {
    BEEF_PRICES[r.trim] = { fat: parseFloat(r.fat_pct), price: parseFloat(r.price) };
  });

  // Build RECIPES
  recipes.forEach(r => {
    if (!RECIPES[r.format]) RECIPES[r.format] = {};
    RECIPES[r.format][r.recipe] = [
      parseFloat(r.beef_pct),
      parseFloat(r.fable_pct),
      parseFloat(r.water_pct)
    ];
  });

  // Build HEALTH_REF from nutrition table
  nutrition.forEach(r => {
    if (r.ingredient === 'shiitake') {
      HEALTH_REF.shiitake[r.nutrient] = { val: parseFloat(r.value), unit: r.unit || '' };
    } else {
      if (!HEALTH_REF.beef[r.ingredient]) HEALTH_REF.beef[r.ingredient] = {};
      HEALTH_REF.beef[r.ingredient][r.nutrient] = parseFloat(r.value);
    }
  });

  // Build CO2 values
  co2.forEach(r => {
    if (r.ingredient === 'shiitake') SHIITAKE_CO2 = parseFloat(r.co2_per_kg);
    if (r.ingredient === 'beef')     BEEF_CO2     = parseFloat(r.co2_per_kg);
  });

  // Build SCORING_CONFIG — keyed by config key for easy lookup
  scoringCfg.forEach(r => { SCORING_CONFIG[r.key] = parseFloat(r.value); });
}

