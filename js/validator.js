/* ── Validator page logic ───────────────────────────────────────────────────────
   Depends on: js/country.js (CC, COUNTRY_CONFIG), js/data.js (sbFetch only)
               js/engine.js (normalise, normalisePadded, getBlendNutrient helpers)

   loadData():             fetches Supabase data for selected country.
   scoringEngine():        scores all recipe candidates.
   buildCandidates():      enumerates trim×recipe combinations.
   renderRankedTable():    generic winner-first comparison table.
   renderBalanceSection(): overall best-blend table.
   renderCostSection():    cost-ranked comparison.
   renderNutritionSection(): nutrition-ranked comparison.
   renderOutput():         orchestrates all sections.
   runValidator():         entry point — loads data then renders.
   ─────────────────────────────────────────────────────────────────────────── */

// Data stores (BEEF_PRICES, RECIPES, HEALTH_REF, SHIITAKE_CO2, BEEF_CO2,
// SCORING_CONFIG, CC) are declared in js/country.js which loads first.
let activeFormat = null;

/* ── Constraint state ── */
let mustFiber = false, mustProtein = false;

function toggleConstraint(which) {
  if (which === 'fiber') {
    mustFiber = !mustFiber;
    document.getElementById('check-fiber').classList.toggle('checked', mustFiber);
  } else {
    mustProtein = !mustProtein;
    document.getElementById('check-protein').classList.toggle('checked', mustProtein);
  }
}

const CL_ORDER_LEAN = [
  '60CL Beef Trim','65CL Beef Trim','70CL Beef Trim',
  '75CL Beef Trim','80CL Beef Trim','85CL Beef Trim','90CL Beef Trim'
];

async function loadData() {
  BEEF_PRICES = {}; RECIPES = {}; HEALTH_REF = { shiitake: {}, beef: {} };
  SHIITAKE_CO2 = 0; BEEF_CO2 = 0; SCORING_CONFIG = {};
  const selectedCountry = document.getElementById('country-select').value;
  CC = COUNTRY_CONFIG[selectedCountry];

  const fiberSub = `≥${CC.highFiber}g ${CC.fiberSpelling.toLowerCase()} per 100g`;
  const proteinSub = CC.highProtein.mode === 'energyPct'
    ? `≥${CC.highProtein.pct}% energy from protein`
    : `≥${CC.highProtein.g}g protein per 100g`;
  document.getElementById('fiber-sub').textContent = fiberSub;
  document.getElementById('protein-sub').textContent = proteinSub;
  document.querySelector('#check-fiber .check-text').textContent = `Must be High in ${CC.fiberSpelling}`;

  const countryFilter = `country=eq.${selectedCountry}`;
  const [nutrition, beefPrices, recipes, co2, scoringCfg] = await Promise.all([
    sbFetch('nutrition',   countryFilter),
    sbFetch('beef_prices', countryFilter),
    sbFetch('recipes',     countryFilter),
    sbFetch('co2_kg_e'),
    sbFetch('scoring_config'),
  ]);
  beefPrices.forEach(r => {
    BEEF_PRICES[r.trim] = { fat: parseFloat(r.fat_pct), price: parseFloat(r.price) };
  });
  recipes.forEach(r => {
    if (!RECIPES[r.format]) RECIPES[r.format] = {};
    RECIPES[r.format][r.recipe] = [parseFloat(r.beef_pct), parseFloat(r.fable_pct), parseFloat(r.water_pct)];
  });
  nutrition.forEach(r => {
    if (r.ingredient === 'shiitake') {
      HEALTH_REF.shiitake[r.nutrient] = { val: parseFloat(r.value) };
    } else {
      if (!HEALTH_REF.beef[r.ingredient]) HEALTH_REF.beef[r.ingredient] = {};
      HEALTH_REF.beef[r.ingredient][r.nutrient] = parseFloat(r.value);
    }
  });
  co2.forEach(r => {
    if (r.ingredient === 'shiitake') SHIITAKE_CO2 = parseFloat(r.co2_per_kg);
    if (r.ingredient === 'beef')     BEEF_CO2     = parseFloat(r.co2_per_kg);
  });
  scoringCfg.forEach(r => { SCORING_CONFIG[r.key] = parseFloat(r.value); });
}

function getBlendNutrient(nutrient, recipeName, trimName, format) {
  const [beefPct, fablePct] = RECIPES[format][recipeName];
  const s = HEALTH_REF.shiitake[nutrient]?.val ?? 0;
  const b = HEALTH_REF.beef[trimName]?.[nutrient] ?? 0;
  return s * fablePct + b * beefPct;
}

function getWeightSets() {
  const cfg = SCORING_CONFIG;
  return {
    balance:        { n: cfg.balance_n        ?? 0.50, c: cfg.balance_c        ?? 0.50, s: cfg.balance_s        ?? 0.00 },
    cost:           { n: cfg.cost_n           ?? 0.00, c: cfg.cost_c           ?? 1.00, s: cfg.cost_s           ?? 0.00 },
    nutrition:      { n: cfg.nutrition_n      ?? 1.00, c: cfg.nutrition_c      ?? 0.15, s: cfg.nutrition_s      ?? 0.10 },
    sustainability: { n: cfg.sustainability_n ?? 0.15, c: cfg.sustainability_c ?? 0.10, s: cfg.sustainability_s ?? 1.00 },
  };
}

function meetsHighProtein(protein_g, energyKJ) {
  const cfg = CC.highProtein;
  if (cfg.mode === 'energyPct') {
    if (!energyKJ || energyKJ === 0) return false;
    return (protein_g * 17 / energyKJ * 100) >= cfg.pct;
  }
  return protein_g >= cfg.g;
}

/* ── Scoring engine ── */
function scoringEngine(format, priority, userFat) {
  const shiitakeFat   = (HEALTH_REF.shiitake['Total Fat']?.val ?? 0) / 100;
  const shiitakeFiber = (HEALTH_REF.shiitake['Dietary Fiber'] ?? HEALTH_REF.shiitake['Dietary Fibre'])?.val ?? 0;
  const userTrimName  = Object.entries(BEEF_PRICES).find(([, d]) => d.fat === userFat)?.[0];
  const ceilIdx       = CL_ORDER_LEAN.indexOf(userTrimName);

  function naturalTrimIdx(beefPct, fablePct) {
    let floorIdx = null;
    for (let i = 0; i < CL_ORDER_LEAN.length; i++) {
      const data = BEEF_PRICES[CL_ORDER_LEAN[i]];
      if (!data) continue;
      if ((data.fat * beefPct) + (shiitakeFat * fablePct) > userFat) floorIdx = i;
    }
    if (floorIdx !== null) return floorIdx;
    for (let i = 0; i < CL_ORDER_LEAN.length; i++) {
      const data = BEEF_PRICES[CL_ORDER_LEAN[i]];
      if (!data) continue;
      if ((data.fat * beefPct) + (shiitakeFat * fablePct) <= userFat) return i;
    }
    return CL_ORDER_LEAN.length - 1;
  }

  function buildCandidates(applyConstraints) {
    const out = [];
    for (const [recipeName, [beefPct, fablePct, waterPct]] of Object.entries(RECIPES[format])) {
      if (format === 'Burger / Meatball' && waterPct > 0) continue;
      if (format === 'Burger / Meatball' && beefPct === 0.5) continue;
      const floorIdx = naturalTrimIdx(beefPct, fablePct);
      const lo = Math.min(floorIdx, ceilIdx), hi = Math.max(floorIdx, ceilIdx);
      for (let i = lo; i <= hi; i++) {
        const trimName = CL_ORDER_LEAN[i];
        const trimData = BEEF_PRICES[trimName];
        if (!trimData) continue;
        const fiber    = shiitakeFiber * fablePct;
        const protein  = getBlendNutrient('Protein',           recipeName, trimName, format);
        const energyKJ = getBlendNutrient('Energy (kJ)',       recipeName, trimName, format);
        // AU uses kJ only — convert to kcal for display; other countries have kcal stored directly
        const cals     = CC.code === 'AU'
          ? energyKJ / 4.184
          : getBlendNutrient('Energy (Calories)',               recipeName, trimName, format);
        const satFat   = getBlendNutrient('Saturated Fat',     recipeName, trimName, format);
        const cost     = beefPct * trimData.price + fablePct * CC.fablePrice + waterPct * CC.waterPrice;
        const co2      = beefPct * BEEF_CO2 + fablePct * SHIITAKE_CO2;
        const blendedFat = (trimData.fat * beefPct) + (shiitakeFat * fablePct);
        if (applyConstraints) {
          if (mustFiber   && fiber < CC.highFiber)                continue;
          if (mustProtein && !meetsHighProtein(protein, energyKJ)) continue;
        }
        out.push({ recipeName, trimName, beefPct, fablePct, waterPct,
                   fiber, protein, energyKJ, cals, satFat, cost, co2, blendedFat });
      }
    }
    return out;
  }

  const constrained  = buildCandidates(true);
  const usedFallback = constrained.length === 0 && (mustFiber || mustProtein);
  const pool         = constrained.length > 0 ? constrained : buildCandidates(false);
  if (pool.length === 0) return [];

  function normalise(values, lowerBetter) {
    const min = Math.min(...values), max = Math.max(...values);
    if (max === min) return values.map(() => 1.0);
    return values.map(v => lowerBetter ? (max - v) / (max - min) : (v - min) / (max - min));
  }
  function normalisePadded(values, lowerBetter, pad) {
    const min = Math.min(...values), max = Math.max(...values);
    const spread = max - min;
    if (spread === 0) return values.map(() => 1.0);
    const lo = min - spread * pad, hi = max + spread * pad;
    return values.map(v => lowerBetter ? (hi - v) / (hi - lo) : (v - lo) / (hi - lo));
  }

  const cfg     = SCORING_CONFIG;
  const nFiber   = normalise(pool.map(c => c.fiber),   false);
  const nProtein = normalise(pool.map(c => c.protein), false);
  const nCals    = normalise(pool.map(c => c.cals),    true);
  const nSatFat  = normalise(pool.map(c => c.satFat),  true);
  const nCost    = normalisePadded(pool.map(c => c.cost), true, cfg.cost_pad ?? 1.5);
  const nCO2     = normalisePadded(pool.map(c => c.co2),  true, cfg.co2_pad  ?? 1.0);

  const nutritionScore = pool.map((_, i) => Math.sqrt(
    (cfg.nutr_w_fiber    ?? 0.35) * nFiber[i] +
    (cfg.nutr_w_protein  ?? 0.35) * nProtein[i] +
    (cfg.nutr_w_calories ?? 0.20) * nCals[i] +
    (cfg.nutr_w_satfat   ?? 0.10) * nSatFat[i]
  ));

  const WEIGHT_SETS  = getWeightSets();
  const w            = WEIGHT_SETS[priority] || WEIGHT_SETS.balance;
  const trimPenalty  = cfg.trim_penalty ?? 0.05;
  const brb          = cfg.balance_recipe_bonus ?? 0.12;
  const userCeilIdx  = ceilIdx;

  const finalScores = pool.map((c, i) => {
    const raw = w.n * nutritionScore[i] + w.c * nCost[i] + w.s * nCO2[i];
    const candidateIdx = CL_ORDER_LEAN.indexOf(c.trimName);
    const stepsLeaner  = Math.max(0, userCeilIdx - candidateIdx);
    const penalised = (priority === 'balance') ? raw * (1 - trimPenalty * stepsLeaner) : raw;
    const bonus     = (priority === 'balance')
      ? brb * Math.exp(-Math.pow((c.fablePct + c.waterPct) - 0.40, 2) / (2 * 0.10 * 0.10))
      : 0;
    return penalised + bonus;
  });

  return pool
    .map((c, i) => ({ ...c, nutritionScore: nutritionScore[i], finalScore: finalScores[i], usedFallback }))
    .sort((a, b) => b.finalScore - a.finalScore);
}

/* ── Price inputs ── */
function buildPriceInputs() {
  const wrap = document.getElementById('price-inputs');
  wrap.innerHTML = '';
  CL_ORDER_LEAN.slice().reverse().forEach(trimName => {
    const data = BEEF_PRICES[trimName];
    if (!data) return;
    const cl  = trimName.replace(' Beef Trim', '');
    const div = document.createElement('div');
    div.className = 'price-input-group';
    div.innerHTML = `<label>${cl} (${CC.currency}/${CC.priceUnit.replace('per ', '')})</label>
      <input type="number" step="0.01" min="0" value="${data.price.toFixed(2)}"
        onchange="BEEF_PRICES['${trimName}'].price = parseFloat(this.value) || ${data.price.toFixed(2)}">`;
    wrap.appendChild(div);
  });
  document.getElementById('price-controls').style.display = 'block';
}

/* ── Format tabs ── */
function buildFormatTabs(formats) {
  const wrap = document.getElementById('format-tabs');
  wrap.innerHTML = '';
  formats.forEach((fmt, i) => {
    const btn = document.createElement('button');
    btn.className = 'fmt-tab' + (i === 0 ? ' active' : '');
    btn.textContent = fmt;
    btn.onclick = () => {
      document.querySelectorAll('.fmt-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      activeFormat = fmt;
      renderOutput();
    };
    wrap.appendChild(btn);
  });
}

/* ── Delta badge helper ── */
function deltaBadge(diff, unit, lowerBetter, zeroLabel = null) {
  if (Math.abs(diff) < 0.005) return zeroLabel
    ? `<span class="delta delta-neutral">${zeroLabel}</span>`
    : `<span class="delta delta-neutral">same</span>`;
  const better = lowerBetter ? diff < 0 : diff > 0;
  const cls    = better ? 'delta-better' : 'delta-worse';
  const sign   = diff > 0 ? '+' : '−';
  return `<span class="delta ${cls}">${sign}${unit}${Math.abs(diff).toFixed(2)}</span>`;
}
function deltaBadgeInt(diff, unit, lowerBetter) {
  if (Math.abs(diff) < 0.5) return `<span class="delta delta-neutral">same</span>`;
  const better = lowerBetter ? diff < 0 : diff > 0;
  const cls    = better ? 'delta-better' : 'delta-worse';
  const sign   = diff > 0 ? '+' : '−';
  return `<span class="delta ${cls}">${sign}${Math.abs(Math.round(diff))} ${unit}</span>`;
}

/* ── Generic ranked table — winner is first row, max 4 rows total ── */
function renderRankedTable(ranked, recBadgeLabel, colDefs) {
  // Always cap at 4 total rows (winner + 3 alternatives)
  const rows = ranked.slice(0, 4);
  if (rows.length === 0) return '<p style="color:#6b7a5c">No candidates available.</p>';
  const winner = rows[0];

  let html = `<div class="tbl-wrap"><table><thead><tr>`;
  colDefs.forEach(col => { html += `<th>${col.header}</th>`; });
  html += `</tr></thead><tbody>`;

  rows.forEach((c, idx) => {
    const isWinner = idx === 0;
    html += `<tr${isWinner ? ' class="winner-row"' : ''}>`;
    colDefs.forEach(col => {
      const cls = col.className ? ` class="${col.className}"` : '';
      html += `<td${cls}>${col.cell(c, winner, isWinner)}</td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody></table></div>`;
  return html;
}

/* ── Recipe name cell for winner vs alternative ── */
function recipeCell(c, winner, isWinner, badgeLabel) {
  const fb = c.usedFallback ? `<span class="fallback-badge">constraint not met</span>` : '';
  if (isWinner) {
    return `<div class="winner-recipe-name">${c.recipeName}${fb}
              <span class="rec-badge">${badgeLabel}</span></div>
            <div class="winner-trim-name">${c.trimName.replace(' Beef Trim', '')}</div>`;
  }
  return `${c.recipeName}${fb}`;
}

/* ── Render balance section ── */
function renderBalanceSection(format, userFat) {
  const ranked = scoringEngine(format, 'balance', userFat);
  if (ranked.length === 0) return '<p style="color:#6b7a5c">No candidates available.</p>';
  const winner = ranked[0];
  const priceUnit = CC.priceUnit.split(' ')[1];

  const cols = [
    { header: 'Recipe', className: 'col-recipe',
      cell: (c, w, iw) => recipeCell(c, w, iw, '★ Recommended') },
    { header: 'Beef Trim',
      cell: (c, w, iw) => iw ? '' : c.trimName.replace(' Beef Trim', '') },
    { header: `${CC.currency}/${priceUnit}`,
      cell: (c, w, iw) => iw
        ? `${CC.currency}${c.cost.toFixed(2)}`
        : `${CC.currency}${c.cost.toFixed(2)} ${deltaBadge(c.cost - w.cost, CC.currency, true)}` },
    { header: `${CC.fiberSpelling} (g/100g)`,
      cell: (c, w, iw) => iw
        ? c.fiber.toFixed(1)
        : `${c.fiber.toFixed(1)} ${deltaBadge(c.fiber - w.fiber, '', false)}` },
    { header: 'Protein (g/100g)',
      cell: (c, w, iw) => iw
        ? c.protein.toFixed(1)
        : `${c.protein.toFixed(1)} ${deltaBadge(c.protein - w.protein, '', false)}` },
    { header: 'Calories',
      cell: (c, w, iw) => iw
        ? c.cals.toFixed(0)
        : `${c.cals.toFixed(0)} ${deltaBadgeInt(c.cals - w.cals, 'kcal', true)}` },
    { header: 'Sat Fat (g)',
      cell: (c, w, iw) => iw
        ? c.satFat.toFixed(1)
        : `${c.satFat.toFixed(1)} ${deltaBadge(c.satFat - w.satFat, '', true)}` },
  ];

  return renderRankedTable(ranked, '★ Recommended', cols);
}

/* ── Render cost section ── */
function renderCostSection(format, userFat) {
  const all = scoringEngine(format, 'cost', userFat);
  if (all.length === 0) return '<p style="color:#6b7a5c">No candidates available.</p>';
  const ranked = [...all].sort((a, b) => a.cost - b.cost);
  const priceUnit = CC.priceUnit.split(' ')[1];

  const cols = [
    { header: 'Recipe', className: 'col-recipe',
      cell: (c, w, iw) => recipeCell(c, w, iw, '$ Lowest Cost') },
    { header: 'Beef Trim',
      cell: (c, w, iw) => iw ? '' : c.trimName.replace(' Beef Trim', '') },
    { header: `${CC.currency}/${priceUnit}`,
      cell: (c, w, iw) => {
        if (iw) return `${CC.currency}${c.cost.toFixed(2)}`;
        const diff = c.cost - w.cost;
        return `${CC.currency}${c.cost.toFixed(2)} <span class="delta delta-worse">+${CC.currency}${diff.toFixed(2)}</span>`;
      }},
    { header: `${CC.fiberSpelling} (g/100g)`,
      cell: (c) => c.fiber.toFixed(1) },
    { header: 'Protein (g/100g)',
      cell: (c) => c.protein.toFixed(1) },
    { header: 'Calories',
      cell: (c) => c.cals.toFixed(0) },
    { header: 'Sat Fat (g)',
      cell: (c) => c.satFat.toFixed(1) },
  ];

  return renderRankedTable(ranked, '$ Lowest Cost', cols);
}

/* ── Render nutrition section ── */
function renderNutritionSection(format, userFat) {
  const all = scoringEngine(format, 'nutrition', userFat);
  if (all.length === 0) return '<p style="color:#6b7a5c">No candidates available.</p>';
  // Already sorted by finalScore (nutrition-weighted) — just use that order
  const ranked = all;
  const winner = ranked[0];
  const priceUnit = CC.priceUnit.split(' ')[1];

  const cols = [
    { header: 'Recipe', className: 'col-recipe',
      cell: (c, w, iw) => recipeCell(c, w, iw, '✦ Best Nutrition') },
    { header: 'Beef Trim',
      cell: (c, w, iw) => iw ? '' : c.trimName.replace(' Beef Trim', '') },
    { header: `${CC.fiberSpelling} (g/100g)`,
      cell: (c, w, iw) => iw
        ? c.fiber.toFixed(1)
        : `${c.fiber.toFixed(1)} ${deltaBadge(c.fiber - w.fiber, '', false)}` },
    { header: 'Protein (g/100g)',
      cell: (c, w, iw) => iw
        ? c.protein.toFixed(1)
        : `${c.protein.toFixed(1)} ${deltaBadge(c.protein - w.protein, '', false)}` },
    { header: 'Calories',
      cell: (c, w, iw) => iw
        ? c.cals.toFixed(0)
        : `${c.cals.toFixed(0)} ${deltaBadgeInt(c.cals - w.cals, 'kcal', true)}` },
    { header: 'Sat Fat (g)',
      cell: (c, w, iw) => iw
        ? c.satFat.toFixed(1)
        : `${c.satFat.toFixed(1)} ${deltaBadge(c.satFat - w.satFat, '', true)}` },
    { header: `${CC.currency}/${priceUnit}`,
      cell: (c, w, iw) => iw
        ? `${CC.currency}${c.cost.toFixed(2)}`
        : `${CC.currency}${c.cost.toFixed(2)} ${deltaBadge(c.cost - w.cost, CC.currency, true)}` },
  ];

  return renderRankedTable(ranked, '✦ Best Nutrition', cols);
}

/* ── Main render ── */
function renderOutput() {
  const userFat = parseFloat(document.getElementById('q1-select').value);
  const format  = activeFormat;

  let html = '';

  // Section 1: Balanced
  html += `<div class="section-block">
    <div class="section-heading">Balanced recommendation</div>
    <p class="section-subhead">The best overall recipe weighing both cost and nutrition. Alternatives shown with differences against each metric.</p>
    ${renderBalanceSection(format, userFat)}
  </div>`;

  // Section 2: Cost
  html += `<div class="section-block">
    <div class="section-heading">Cost ranking</div>
    <p class="section-subhead">Recipes ranked from lowest to highest cost, with nutrition stats for comparison.</p>
    ${renderCostSection(format, userFat)}
  </div>`;

  // Section 3: Nutrition
  html += `<div class="section-block">
    <div class="section-heading">Nutrition ranking</div>
    <p class="section-subhead">Recipes ranked by best nutritional profile — highest ${CC.fiberSpelling.toLowerCase()}, protein, lower calories and saturated fat.</p>
    ${renderNutritionSection(format, userFat)}
  </div>`;

  document.getElementById('output').innerHTML = html;
}

/* ── Entry point ── */
async function runValidator() {
  document.getElementById('output').innerHTML = '<p class="loading">Running…</p>';
  document.getElementById('format-tabs').innerHTML = '';
  await loadData();
  buildPriceInputs();

  const formats = Object.keys(RECIPES);
  activeFormat  = activeFormat && formats.includes(activeFormat) ? activeFormat : formats[0];
  buildFormatTabs(formats);
  renderOutput();
}

window.addEventListener('DOMContentLoaded', () => { runValidator(); });
