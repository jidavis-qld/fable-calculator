/* ── Blend scoring & calculation engine ─────────────────────────────────────────
   scoringEngine():     builds all recipe candidates and scores them.
   buildCandidates():   enumerates every valid trim×recipe combination.
   normalise():         normalises a dimension 0–1 across the candidate pool.
   pickRecipe():        entry point — returns the best-scoring recipe.
   getBlendNutrient():  interpolates blend nutrient values from HEALTH_REF.
   meetsHighProtein():  checks EU/UK high-protein claim thresholds.
   fmtNutrient():       formats a nutrient value with correct units/decimals.
   ─────────────────────────────────────────────────────────────────────────── */

/* ── BEEF TRIM NAME LOOKUP ───────────────────────── */
function beefTrimName(fatPct) {
  const cl = Math.round((1 - fatPct)*100);
  return cl+'CL Beef Trim';
}

/* ── CALCULATE BEST RECIPE ───────────────────────── */

// CL grades ordered from fattiest to leanest
// When we need more protein we step up through leaner trims
const CL_ORDER_LEAN = [
  '60CL Beef Trim','65CL Beef Trim','70CL Beef Trim',
  '75CL Beef Trim','80CL Beef Trim','85CL Beef Trim','90CL Beef Trim'
];

/* ══════════════════════════════════════════════════════════════
   SCORING ENGINE
   Finds the best recipe × trim combination for the user's priorities.
   Full rules documented in SCORING_RULES.md.

   Nutrition composite weights (all normalised 0–1, then sqrt for diminishing returns):
     Dietary Fiber  : 0.35  (higher = better — key Fable differentiator)
     Protein        : 0.35  (higher = better — favours beef)
     Calories       : 0.20  (lower = better)
     Saturated Fat  : 0.10  (lower = better)

   Priority weight sets (wN=nutrition, wC=cost, wS=sustainability):
     cost           : wN=0.00, wC=1.00, wS=0.00  (pure cost, no other influence)
     nutrition      : wN=1.00, wC=0.15, wS=0.10
     balance        : wN=0.50, wC=0.50, wS=0.00  (sustainability excluded)
     sustainability : wN=0.15, wC=0.10, wS=1.00
   All weights are live-editable in Supabase scoring_config table.

   Trim eligibility per recipe (two bounds):
     Ceiling (leanest allowed) : user's Q1 trim selection.
     Floor (fattiest allowed)  : first trim (scanning fatty→lean) whose blended
       fat is at or below the user's target fat for that recipe.
     Only trims between floor and ceiling (inclusive) are candidates.

   Balance-only mechanics (no effect on other priorities):
     trim_penalty          : score × (1 − 0.05 × CL_steps_below_user_trim)
     balance_recipe_bonus  : gaussian bonus centred on 40% fable (60/40 recipe)

   Hard constraints (optional, user-toggleable):
     mustFiber   : blended dietary fiber >= 5g per 100g
     mustProtein : blended protein >= 10g per 100g
══════════════════════════════════════════════════════════════ */

function scoringEngine() {
  const format  = state.q2;
  const priority = state.priority; // 'cost' | 'nutrition' | 'balance' | 'sustainability'
  const userFat = state.q1;        // user's Q1 fat % selection

  const shiitakeFat   = (HEALTH_REF.shiitake['Total Fat']?.val   ?? 0) / 100;
  const shiitakeFiber = (HEALTH_REF.shiitake['Dietary Fiber'] ?? HEALTH_REF.shiitake['Dietary Fibre'])?.val ?? 0;

  // User's Q1 trim = the ceiling (leanest allowed beef CL)
  // e.g. if user picked 80CL, engine cannot go to 85CL or 90CL
  const userTrimName = Object.entries(BEEF_PRICES).find(([, d]) => d.fat === userFat)?.[0];
  const ceilIdx = CL_ORDER_LEAN.indexOf(userTrimName); // index in fatty→lean order

  // For a given recipe, find the trim floor — the leanest trim (scanning fatty→lean)
  // whose blended fat is still above the user's target fat, i.e. the closest-above
  // option. Falls back to the first trim at-or-below if no trim exceeds the target.
  function naturalTrimIdx(beefPct, fablePct) {
    let floorIdx = null;
    for (let i = 0; i < CL_ORDER_LEAN.length; i++) {
      const data = BEEF_PRICES[CL_ORDER_LEAN[i]];
      if (!data) continue;
      const blendedFat = (data.fat * beefPct) + (shiitakeFat * fablePct);
      if (blendedFat > userFat) floorIdx = i; // keep updating: last above = closest above
    }
    if (floorIdx !== null) return floorIdx;
    // Fallback: no trim exceeds target — use first trim at or below
    for (let i = 0; i < CL_ORDER_LEAN.length; i++) {
      const data = BEEF_PRICES[CL_ORDER_LEAN[i]];
      if (!data) continue;
      if ((data.fat * beefPct) + (shiitakeFat * fablePct) <= userFat) return i;
    }
    return CL_ORDER_LEAN.length - 1;
  }

  // ── Step 1: build all candidate combinations ──────────────────
  // Only trims between floor (natural) and ceiling (Q1 trim) are eligible
  function buildCandidates(applyConstraints) {
    const out = [];
    for (const [recipeName, [beefPct, fablePct, waterPct]] of Object.entries(RECIPES[format])) {
      // Burger / Meatball: no rehydrated (water-containing) or 50/50 recipes
      if (format === 'Burger / Meatball' && waterPct > 0) continue;
      if (format === 'Burger / Meatball' && beefPct === 0.5) continue;

      const floorIdx = naturalTrimIdx(beefPct, fablePct);
      // Eligible CL range: from floorIdx up to ceilIdx (both inclusive)
      // In CL_ORDER_LEAN, higher index = leaner = higher CL
      const lo = Math.min(floorIdx, ceilIdx);
      const hi = Math.max(floorIdx, ceilIdx);

      for (let i = lo; i <= hi; i++) {
        const trimName = CL_ORDER_LEAN[i];
        const trimData = BEEF_PRICES[trimName];
        if (!trimData) continue;

        const blendedFat = (trimData.fat * beefPct) + (shiitakeFat * fablePct);
        const fiber     = shiitakeFiber * fablePct; // beef has no fiber
        const protein   = getBlendNutrient('Protein',           recipeName, trimName);
        const energyKJ  = getBlendNutrient('Energy (kJ)',        recipeName, trimName);
        const cals      = getBlendNutrient('Energy (Calories)',  recipeName, trimName);
        const satFat    = getBlendNutrient('Saturated Fat',      recipeName, trimName);
        const cost      = beefPct * trimData.price + fablePct * FABLE_PRICE + waterPct * WATER_PRICE;
        const co2       = beefPct * BEEF_CO2 + fablePct * SHIITAKE_CO2;

        if (applyConstraints) {
          if (state.mustFiber   && fiber < CC.highFiber)                     continue;
          if (state.mustProtein && !meetsHighProtein(protein, energyKJ))     continue;
        }

        out.push({ recipeName, trimName, beefPct, fablePct, waterPct,
                   fiber, protein, energyKJ, cals, satFat, cost, co2, blendedFat });
      }
    }
    return out;
  }

  // Try with constraints first; fall back to unconstrained if nothing passes
  const candidates = buildCandidates(true);
  const fiberFallback = candidates.length === 0 && state.mustFiber;
  const pool = candidates.length > 0 ? candidates : buildCandidates(false);

  if (pool.length === 0) return { recipeName: Object.keys(RECIPES[format])[0], trimName: CL_ORDER_LEAN[4], fiberFallback: false };

  // ── Step 2: normalise each raw dimension across the pool ───────
  // Standard normalise: maps [min, max] → [0, 1]
  function normalise(values, lowerBetter) {
    const min = Math.min(...values), max = Math.max(...values);
    if (max === min) return values.map(() => 1.0);
    return values.map(v => lowerBetter ? (max - v) / (max - min) : (v - min) / (max - min));
  }
  // Padded normalise: extends the range by `pad` × spread on each side,
  // so real differences occupy the middle of the scale (less extreme 0/1 scoring).
  function normalisePadded(values, lowerBetter, pad) {
    const min = Math.min(...values), max = Math.max(...values);
    const spread = max - min;
    if (spread === 0) return values.map(() => 1.0);
    const lo = min - spread * pad, hi = max + spread * pad;
    return values.map(v => lowerBetter ? (hi - v) / (hi - lo) : (v - lo) / (hi - lo));
  }

  const cfg = SCORING_CONFIG;
  const costPad = cfg.cost_pad ?? 1.5;
  const co2Pad  = cfg.co2_pad  ?? 1.0;

  const nFiber   = normalise(pool.map(c => c.fiber),   false); // higher better
  const nProtein = normalise(pool.map(c => c.protein), false); // higher better
  const nCals    = normalise(pool.map(c => c.cals),    true);  // lower better
  const nSatFat  = normalise(pool.map(c => c.satFat),  true);  // lower better
  const nCost    = normalisePadded(pool.map(c => c.cost), true, costPad);  // lower better, padded
  const nCO2     = normalisePadded(pool.map(c => c.co2),  true, co2Pad);  // lower better, padded

  // Nutrition composite: weighted sum then sqrt for diminishing returns
  const nutritionRaw = pool.map((_, i) =>
    (cfg.nutr_w_fiber    ?? 0.35) * nFiber[i] +
    (cfg.nutr_w_protein  ?? 0.35) * nProtein[i] +
    (cfg.nutr_w_calories ?? 0.20) * nCals[i] +
    (cfg.nutr_w_satfat   ?? 0.10) * nSatFat[i]
  );
  const nutritionScore = nutritionRaw.map(v => Math.sqrt(v));

  // ── Step 3: apply priority weights ────────────────────────────
  const WEIGHT_SETS = {
    cost:           { n: cfg.cost_n           ?? 0.00, c: cfg.cost_c           ?? 1.00, s: cfg.cost_s           ?? 0.00 },
    nutrition:      { n: cfg.nutrition_n      ?? 1.00, c: cfg.nutrition_c      ?? 0.15, s: cfg.nutrition_s      ?? 0.10 },
    balance:        { n: cfg.balance_n        ?? 0.50, c: cfg.balance_c        ?? 0.50, s: cfg.balance_s        ?? 0.00 },
    sustainability: { n: cfg.sustainability_n ?? 0.15, c: cfg.sustainability_c ?? 0.10, s: cfg.sustainability_s ?? 1.00 },
  };
  const w = WEIGHT_SETS[priority] || WEIGHT_SETS.balance;

  const trimPenalty = cfg.trim_penalty ?? 0.05;
  const brb         = cfg.balance_recipe_bonus ?? 0.12;

  const finalScores = pool.map((c, i) => {
    const raw = w.n * nutritionScore[i] + w.c * nCost[i] + w.s * nCO2[i];
    // Trim penalty + BRB: both only apply in balance priority
    const candidateIdx = CL_ORDER_LEAN.indexOf(c.trimName);
    const stepsLeaner  = Math.max(0, ceilIdx - candidateIdx);
    const penalised = (priority === 'balance')
      ? raw * (1 - trimPenalty * stepsLeaner)
      : raw;
    const bonus = (priority === 'balance')
      ? brb * Math.exp(-Math.pow((c.fablePct + c.waterPct) - 0.40, 2) / (2 * 0.10 * 0.10))
      : 0;
    return penalised + bonus;
  });

  // ── Step 4: pick the winner ────────────────────────────────────
  let bestIdx = 0;
  for (let i = 1; i < finalScores.length; i++) {
    if (finalScores[i] > finalScores[bestIdx]) bestIdx = i;
  }

  return { recipeName: pool[bestIdx].recipeName, trimName: pool[bestIdx].trimName, fiberFallback };
}

// Kept for backwards compatibility — used in mustProtein constraint check
function pickBeefTrim(recipeName) {
  const result = scoringEngine();
  // If the engine returned this recipe, use its trim; otherwise find closest eligible trim
  if (result.recipeName === recipeName) return result.trimName;

  // Fallback: find the leanest eligible trim for the given recipe
  const shiitakeFat = (HEALTH_REF.shiitake['Total Fat']?.val ?? 0) / 100;
  const [beefPct, fablePct] = RECIPES[state.q2][recipeName];
  const userFat = state.q1;

  let bestTrim = null, bestDiff = Infinity;
  for (const [name, data] of Object.entries(BEEF_PRICES)) {
    const blendedFat = (data.fat * beefPct) + (shiitakeFat * fablePct);
    if (blendedFat > userFat + 0.001) continue;
    const diff = Math.abs(blendedFat - userFat);
    if (diff < bestDiff) { bestDiff = diff; bestTrim = name; }
  }
  return bestTrim;
}

// pickRecipe() is now a thin wrapper — the engine returns both recipe and trim together
function pickRecipe() {
  return scoringEngine().recipeName;
}

function getBlendNutrient(nutrient, recipeName, trimName) {
  const [beefPct, fablePct] = RECIPES[state.q2][recipeName];
  const s = HEALTH_REF.shiitake[nutrient]?.val ?? 0;
  const b = HEALTH_REF.beef[trimName]?.[nutrient] ?? 0;
  return s * fablePct + b * beefPct;
}

function meetsHighProtein(protein_g, energyKJ) {
  const cfg = CC.highProtein;
  if (cfg.mode === 'energyPct') {
    if (!energyKJ || energyKJ === 0) return false;
    return (protein_g * 17 / energyKJ * 100) >= cfg.pct;
  }
  return protein_g >= cfg.g;
}

function meetsSourceProtein(protein_g, energyKJ) {
  const cfg = CC.sourceProtein;
  if (cfg.mode === 'energyPct') {
    if (!energyKJ || energyKJ === 0) return false;
    return (protein_g * 17 / energyKJ * 100) >= cfg.pct;
  }
  return protein_g >= cfg.g;
}

function fmtNutrient(key, val) {
  if (val === 0) return '0';
  if (key === 'Energy (Calories)' || key === 'Energy (kJ)' || key === 'Sodium') return Math.round(val).toString();
  if (val < 1) return val.toFixed(2);
  return val.toFixed(1);
}

