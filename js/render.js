/* ── Output rendering functions ─────────────────────────────────────────────────
   calculate():           main entry point after quiz completion — runs engine,
                          calls all renderX() functions, shows results page.
   renderBubbles():       the organic blend ratio bubbles at the top of results.
   renderCostTable():     the editable cost breakdown table.
   renderNutrition():     the nutrition comparison table with diff badges.
   renderSustainability(): the CO₂ comparison blocks and carbon callout.
   setServingMode():      switches the US nutrition table between per-100g and
                          per-serving (112g / 4 oz) views.
   ─────────────────────────────────────────────────────────────────────────── */

// Module-level nutrition state — populated by calculate(), used by setServingMode()
let _nutritionState = null;

// 'per100g' | 'perServing'  — only relevant for US
let _servingMode = 'per100g';

function setServingMode(mode) {
  _servingMode = mode;
  document.getElementById('btn-per-100g').classList.toggle('active', mode === 'per100g');
  document.getElementById('btn-per-serving').classList.toggle('active', mode === 'perServing');
  if (_nutritionState) {
    const { recipeName, trimName, beefPct, fablePct, userTrimName, fiberFallback } = _nutritionState;
    renderNutrition(recipeName, trimName, beefPct, fablePct, userTrimName, fiberFallback);
  }
}

async function calculate() {
  await loadData();

  // Guard: if Supabase returned no data for this country the migration hasn't been run yet
  if (Object.keys(BEEF_PRICES).length === 0 || Object.keys(RECIPES).length === 0) {
    alert(`No data found for ${CC.code}. Please run the Supabase migration for this region and try again.`);
    return;
  }

  // Scoring engine returns both recipe and trim in one pass
  const { recipeName, trimName, fiberFallback } = scoringEngine();
  const [beefPct, fablePct, waterPct] = RECIPES[state.q2][recipeName];
  const trimPrice     = BEEF_PRICES[trimName].price;
  const blendPrice    = beefPct * trimPrice + fablePct * FABLE_PRICE + waterPct * WATER_PRICE;
  const fiberKey      = CC.code === 'AU' ? 'Dietary Fibre' : 'Dietary Fiber';
  const fiber         = getBlendNutrient(fiberKey, recipeName, trimName);
  const protein       = getBlendNutrient('Protein', recipeName, trimName);
  const energyKJ      = getBlendNutrient('Energy (kJ)', recipeName, trimName);
  // beefOnlyPrice = the price of the user's originally selected fat % trim (Q1)
  const userTrimName  = Object.entries(BEEF_PRICES).find(([, d]) => d.fat === state.q1)?.[0] || trimName;
  const beefOnlyPrice = BEEF_PRICES[userTrimName].price;

  // Carbon
  const blendCO2   = fablePct * SHIITAKE_CO2 + beefPct * BEEF_CO2;
  const beefCO2    = 1.0 * BEEF_CO2; // 100% beef
  const carbonPct  = Math.round((1 - blendCO2 / beefCO2) * 100);

  // Hero bubbles
  const blendName = beefPct*100+'/'+(fablePct+waterPct)*100;
  renderBubbles(beefPct, fablePct, waterPct, trimName);

  // Key stats
  document.getElementById('stat-price').textContent = CC.currency+blendPrice.toFixed(2);
  document.getElementById('stat-fiber').textContent = fiber.toFixed(1)+'g';
  const highFiber   = fiber >= CC.highFiber;
  const sourceFiber = !highFiber && fiber >= CC.sourceFiber;
  const fiberBadge  = document.getElementById('stat-fiber-badge');
  fiberBadge.textContent   = `High in ${CC.fiberSpelling}`;
  fiberBadge.style.display = highFiber ? '' : 'none';
  const fiberSrcBadge = document.getElementById('stat-fiber-source-badge');
  fiberSrcBadge.textContent   = `Source of ${CC.fiberSpelling}`;
  fiberSrcBadge.style.display = sourceFiber ? '' : 'none';
  document.getElementById('stat-protein').textContent = protein.toFixed(1)+'g';
  const highProtein   = meetsHighProtein(protein, energyKJ);
  const srcProtein    = !highProtein && meetsSourceProtein(protein, energyKJ);
  document.getElementById('stat-protein-badge').style.display        = highProtein ? '' : 'none';
  document.getElementById('stat-protein-source-badge').style.display = srcProtein  ? '' : 'none';
  document.getElementById('stat-carbon').textContent = carbonPct+'%';

  // Hero title
  const trimShort = trimName.replace(' Beef Trim', '');
  const formatLabel = state.q2 === 'Burger / Meatball' ? 'Burger / Meatball' : 'Ground Beef / Beef Mince';
  document.getElementById('hero-subtitle').textContent =
    `A ${Math.round(beefPct*100)}% ${trimShort} Beef & ${Math.round((fablePct+waterPct)*100)}% Shiitake blend — ${formatLabel}`;

  // Cost section
  document.getElementById('cost-recipe-pill').textContent = 'Recipe recommendation: '+recipeName;
  document.getElementById('stat-price-label').textContent = CC.priceUnit;
  document.getElementById('cost-table-unit-header').textContent = `Cost/${CC.priceUnit.split(' ')[1]}`;
  document.getElementById('price-blend-unit').textContent = CC.priceUnit;
  document.getElementById('price-beef-unit').textContent = CC.priceUnit;
  renderCostTable(beefPct, fablePct, waterPct, trimName, trimPrice, blendPrice, userTrimName);
  document.getElementById('price-blend').textContent = CC.currency+blendPrice.toFixed(2);
  document.getElementById('price-beef-label').textContent = '100% ' + userTrimName;
  renderBeefPriceBlock(beefOnlyPrice, userTrimName, trimName);

  // Nutrition — reset to per-100g on each new calculation, show toggle for US only
  _servingMode = 'per100g';
  _nutritionState = { recipeName, trimName, beefPct, fablePct, userTrimName, fiberFallback };
  const toggleWrap = document.getElementById('serving-toggle-wrap');
  toggleWrap.style.display = CC.code === 'US' ? '' : 'none';
  document.getElementById('btn-per-100g').classList.add('active');
  document.getElementById('btn-per-serving').classList.remove('active');
  renderNutrition(recipeName, trimName, beefPct, fablePct, userTrimName, fiberFallback);
  renderTrafficLight(recipeName, trimName);
  renderNutriScore(recipeName, trimName, userTrimName);
  renderHSR(recipeName, trimName, userTrimName);

  // Sustainability — initialise editable beef CO2 input then render
  initBeefCO2Input(() => {
    // Recalculate CO2 figures using the (possibly overridden) BEEF_CO2
    const newBlendCO2  = fablePct * SHIITAKE_CO2 + beefPct * BEEF_CO2;
    const newBeefCO2   = 1.0 * BEEF_CO2;
    const newCarbonPct = Math.round((1 - newBlendCO2 / newBeefCO2) * 100);
    document.getElementById('stat-carbon').textContent = newCarbonPct + '%';
    renderSustainability(beefPct, fablePct, trimName, newBlendCO2, newBeefCO2, newCarbonPct, userTrimName);
  });
  renderSustainability(beefPct, fablePct, trimName, blendCO2, beefCO2, carbonPct, userTrimName);

  // Show results
  document.getElementById('quiz-shell').style.display = 'none';
  document.getElementById('results-page').style.display = 'block';
  window.scrollTo(0, 0);
}


function renderBubbles(beefPct, fablePct, waterPct, trimName) {
  const container = document.getElementById('blend-bubbles');
  const trimShort = trimName.replace(' Beef Trim', '');
  const hasWater = waterPct > 0;

  container.innerHTML = `
    <div class="bubble bubble-lg">
      <div class="bubble-pct">${Math.round(beefPct*100)}%</div>
      <div class="bubble-label">${trimShort}<br>Beef Trim</div>
    </div>
    <div class="bubble bubble-md">
      <div class="bubble-pct">${Math.round(fablePct*100)}%</div>
      <div class="bubble-label">Shiitake<br>Infusion</div>
    </div>
    ${hasWater ? `<div class="bubble bubble-sm">
      <div class="bubble-pct" style="font-size:22px">${Math.round(waterPct*100)}%</div>
      <div class="bubble-label">Water*</div>
    </div>` : ''}
  `;
  document.getElementById('bubble-note-wrap')?.remove();
  document.querySelector('.bubble-note').style.display = hasWater ? '' : 'none';
}

function renderBeefPriceBlock(beefOnlyPrice, userTrimName, trimName) {
  const sameTrims = userTrimName === trimName;
  const el = document.getElementById('price-beef');
  el.innerHTML = `${CC.currency}<input
    type="number"
    id="beef-only-price-input"
    value="${beefOnlyPrice.toFixed(2)}"
    min="0" step="any"
    inputmode="decimal"
    style="width:70px;border:none;border-bottom:1px dashed currentColor;background:transparent;font:inherit;color:inherit;text-align:center;-moz-appearance:textfield;"
  />`;
  // Remove spinner arrows via inline style tag if not already present
  if (!document.getElementById('no-spinner-style')) {
    const s = document.createElement('style');
    s.id = 'no-spinner-style';
    s.textContent = 'input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }';
    document.head.appendChild(s);
  }
  document.getElementById('beef-only-price-input').addEventListener('input', function() {
    const newPrice = parseFloat(this.value) || 0;
    // Only sync to the cost table beef input when both sides show the same CL trim
    if (sameTrims) {
      const costInput = document.getElementById('beef-price-input');
      if (costInput) {
        costInput.value = newPrice.toFixed(2);
        costInput.dispatchEvent(new Event('input'));
      }
    }
  });
}


function renderCostTable(beefPct, fablePct, waterPct, trimName, trimPrice, blendPrice, userTrimName) {
  const tbody = document.getElementById('cost-tbody');
  tbody.innerHTML = '';
  const cur = CC.currency;

  // Beef row — cost/unit is editable, recalculates totals on input
  const beefRow = document.createElement('tr');
  beefRow.innerHTML = `
    <td>${trimName}</td>
    <td>${Math.round(beefPct*100)}%</td>
    <td><span>${cur}<input
      type="number"
      id="beef-price-input"
      value="${trimPrice.toFixed(2)}"
      min="0" step="0.01"
      style="width:60px;border:none;border-bottom:1px dashed #999;background:transparent;font:inherit;text-align:right;-moz-appearance:textfield;"
      inputmode="decimal"
      title="Click to edit your beef price"
    /></span></td>
    <td id="beef-cost-cell">${cur}${(beefPct*trimPrice).toFixed(2)}</td>
  `;
  tbody.appendChild(beefRow);

  // Fable row — static
  const fableRow = document.createElement('tr');
  fableRow.innerHTML = `<td>Shiitake Infusion</td><td>${Math.round(fablePct*100)}%</td><td>${cur}${FABLE_PRICE.toFixed(2)}</td><td>${cur}${(fablePct*FABLE_PRICE).toFixed(2)}</td>`;
  tbody.appendChild(fableRow);

  // Water row
  if (waterPct > 0) {
    const waterRow = document.createElement('tr');
    waterRow.innerHTML = `<td>Water</td><td>${Math.round(waterPct*100)}%</td><td>${cur}0.00</td><td>${cur}0.00</td>`;
    tbody.appendChild(waterRow);
  }

  // Total row
  const totalPct = beefPct + fablePct + waterPct;
  const totalRow = document.createElement('tr');
  totalRow.id = 'cost-total-row';
  totalRow.innerHTML = `<td></td><td>${Math.round(totalPct*100)}%</td><td></td><td id="cost-total-cell">${cur}${blendPrice.toFixed(2)}</td>`;
  tbody.appendChild(totalRow);

  // Live recalculate when beef price is edited
  const sameTrims = userTrimName === trimName;
  document.getElementById('beef-price-input').addEventListener('input', function() {
    const newBeefPrice  = parseFloat(this.value) || 0;
    const newBeefCost   = beefPct * newBeefPrice;
    const newBlendPrice = newBeefCost + fablePct * FABLE_PRICE + waterPct * WATER_PRICE;
    document.getElementById('beef-cost-cell').textContent  = cur + newBeefCost.toFixed(2);
    document.getElementById('cost-total-cell').textContent = cur + newBlendPrice.toFixed(2);
    document.getElementById('price-blend').textContent     = cur + newBlendPrice.toFixed(2);
    // Only sync to the comparison bubble beef input when both sides show the same CL trim
    if (sameTrims) {
      const beefOnlyInput = document.getElementById('beef-only-price-input');
      if (beefOnlyInput) beefOnlyInput.value = newBeefPrice.toFixed(2);
    }
  });
}

// Returns true if blend meets the "high in protein" claim for the active country.
// US: simple g/100g threshold. UK: protein energy % = (protein_g * 17kJ) / energyKJ * 100

function renderNutrition(recipeName, trimName, beefPct, fablePct, userTrimName, fiberFallback = false) {
  // Per-serving scaling (US only)
  const isUS       = CC.code === 'US';
  const perServing = isUS && _servingMode === 'perServing';
  const servingMult = perServing ? (CC.servingG / 100) : 1;

  // Update column headers to reflect current view
  const blendHeaderEl = document.getElementById('nutrition-blend-header');
  const beefHeaderEl  = document.getElementById('nutrition-beef-header');
  if (blendHeaderEl) blendHeaderEl.textContent = perServing
    ? `Shiitake Infused (per ${CC.servingG}g)`
    : 'Shiitake Infused';

  // Nutrient list differs by country
  const isUK = CC.code === 'UK' || CC.code === 'EU';
  const isAU = CC.code === 'AU';
  const nutrients = isAU ? [
    { key: 'Energy (kJ)',    label: 'Energy (kJ)',    bold: true },
    { key: 'Protein',        label: 'Protein',        bold: true },
    { key: 'Total Fat',      label: 'Total Fat',      bold: true },
    { key: 'Saturated Fat',  label: '   Saturated Fat', sub: true },
    { key: 'Carbohydrate',   label: 'Carbohydrate',   bold: true },
    { key: 'Total Sugars',   label: '   Total Sugars',  sub: true },
    { key: 'Dietary Fibre',  label: '   Dietary Fibre', sub: true },
    { key: 'Sodium',         label: 'Sodium',         bold: true },
  ] : isUK ? [
    { key: 'Energy (kJ)',       label: 'Energy (kJ)',       bold: true },
    { key: 'Energy (Calories)', label: 'Energy (Calories)', bold: true },
    { key: 'Total Fat',         label: 'Total Fat',         bold: true },
    { key: 'Saturated Fat',     label: '   Saturated Fat',  sub: true  },
    { key: 'Carbohydrate',      label: 'Carbohydrate',      bold: true },
    { key: 'Total Sugars',      label: '    Total Sugars',  sub: true  },
    { key: 'Dietary Fiber',     label: '    Dietary Fiber', sub: true  },
    { key: 'Protein',           label: 'Protein',           bold: true },
    { key: 'Salt',              label: 'Salt',              bold: true },
  ] : [
    { key: 'Energy (Calories)', label: 'Energy (Calories)', bold: true },
    { key: 'Total Fat',         label: 'Total Fat',         bold: true },
    { key: 'Saturated Fat',     label: '   Saturated Fat',  sub: true  },
    { key: 'Trans Fat',         label: '   Trans Fat',      sub: true  },
    { key: 'Cholesterol',       label: 'Cholesterol',       bold: true },
    { key: 'Sodium',            label: 'Sodium',            bold: true },
    { key: 'Total Carbohydrate',label: 'Total Carbohydrate',bold: true },
    { key: 'Dietary Fiber',     label: '    Dietary Fiber', sub: true  },
    { key: 'Total Sugars',      label: '    Total Sugars',  sub: true  },
    { key: 'Added Sugars',      label: '    Includes Added Sugars', sub: true },
    { key: 'Protein',           label: 'Protein',           bold: true },
    { key: 'Vitamin D',         label: 'Vitamin D'                    },
    { key: 'Calcium',           label: 'Calcium'                      },
    { key: 'Iron',              label: 'Iron'                         },
    { key: 'Potassium',         label: 'Potassium'                    },
  ];

  // Nutrients where LOWER blend value = better outcome
  const lowerBetter = new Set(['Energy (kJ)','Energy (Calories)','Total Fat','Saturated Fat','Trans Fat','Cholesterol','Sodium','Carbohydrate','Total Carbohydrate','Total Sugars','Added Sugars','Salt']);
  // Nutrients where HIGHER blend value = better outcome
  const higherBetter = new Set(['Dietary Fiber','Dietary Fibre','Protein','Vitamin D','Calcium','Iron','Potassium']);

  // Interpolate between two hex colours by a 0–1 factor
  function lerpColor(hexA, hexB, t) {
    const parse = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
    const [r1,g1,b1] = parse(hexA), [r2,g2,b2] = parse(hexB);
    const r = Math.round(r1 + (r2-r1)*t), g = Math.round(g1 + (g2-g1)*t), b = Math.round(b1 + (b2-b1)*t);
    return `rgb(${r},${g},${b})`;
  }

  // Given a ratio (blendVal / beefVal), return {bg, color} for the badge
  // For lower-better: green=≤0.80, gradient 0.80→1.00, neutral=1.00→1.15, gradient 1.15→1.30, red=≥1.30
  // For higher-better: inverse
  function badgeColors(ratio, isLowerBetter) {
    const GREEN_BG = '#ddf5d0', GREEN_FG = '#2e5a14';
    const NEUTRAL_BG = '#f0efe6', NEUTRAL_FG = '#5e7462';
    const RED_BG = '#fce4ec',   RED_FG = '#c62828';

    // Flip ratio for higher-better so same thresholds apply
    const r = isLowerBetter ? ratio : (ratio === 0 ? 9999 : 1 / ratio);

    let bg, fg;
    if (r <= 0.80) {
      bg = GREEN_BG; fg = GREEN_FG;
    } else if (r <= 1.00) {
      // Green → Neutral gradient
      const t = (r - 0.80) / 0.20;
      bg = lerpColor(GREEN_BG, NEUTRAL_BG, t);
      fg = lerpColor(GREEN_FG, NEUTRAL_FG, t);
    } else if (r <= 1.15) {
      bg = NEUTRAL_BG; fg = NEUTRAL_FG;
    } else if (r < 1.30) {
      // Neutral → Red gradient
      const t = (r - 1.15) / 0.15;
      bg = lerpColor(NEUTRAL_BG, RED_BG, t);
      fg = lerpColor(NEUTRAL_FG, RED_FG, t);
    } else {
      bg = RED_BG; fg = RED_FG;
    }
    return { bg, fg };
  }

  const tbody = document.getElementById('nutrition-tbody');
  tbody.innerHTML = '';
  if (beefHeaderEl) beefHeaderEl.textContent = perServing
    ? `100% ${userTrimName} (per ${CC.servingG}g)`
    : '100% ' + userTrimName;
  const claims = [];

  nutrients.forEach(({ key, label, bold, sub }) => {
    // Raw per-100g values — diff badge always uses ratio of per-100g values (unaffected by scale)
    const blendVal100 = getBlendNutrient(key, recipeName, trimName);
    const beefVal100  = HEALTH_REF.beef[userTrimName]?.[key] ?? 0;

    // Display values — scaled when in per-serving mode
    const blendVal = blendVal100 * servingMult;
    const beefVal  = beefVal100  * servingMult;

    const isLower  = lowerBetter.has(key);
    const isHigher = higherBetter.has(key);

    let diffHtml = '';

    // Special case: fiber with zero beef baseline — show a highlight badge instead of %
    if (key === 'Dietary Fiber' && beefVal100 === 0 && blendVal100 > 0) {
      diffHtml = `<span class="diff-badge diff-fiber">★ ADDED FIBER</span>`;
    } else if (beefVal100 > 0) {
      // Diff ratio always uses per-100g values so it doesn't change with serving toggle
      const ratio = blendVal100 / beefVal100;
      const changePct = Math.round((ratio - 1) * 100);
      const { bg, fg } = badgeColors(ratio, isLower || !isHigher);
      const sign = changePct < 0 ? '▼ ' : changePct > 0 ? '▲ ' : '';
      const label2 = changePct === 0 ? '=' : `${sign}${Math.abs(changePct)}%`;
      diffHtml = `<span class="diff-badge" style="background:${bg};color:${fg}">${label2}</span>`;
    } else if (beefVal100 === 0 && blendVal100 === 0) {
      diffHtml = '';
    }

    const tr = document.createElement('tr');
    tr.className = bold ? 'bold-row' : (sub ? 'sub-row' : '');
    tr.innerHTML = `
      <td>${label}</td>
      <td>${fmtNutrient(key, blendVal)}</td>
      <td>${fmtNutrient(key, beefVal)}</td>
      <td>${diffHtml}</td>
    `;
    tbody.appendChild(tr);

    // Health claims — use per-serving thresholds for US when in serving mode, else per-100g
    if (key === 'Dietary Fiber' || key === 'Dietary Fibre') {
      const highThresh   = (isUS && perServing) ? CC.highFiberServing   : CC.highFiber;
      const sourceThresh = (isUS && perServing) ? CC.sourceFiberServing : CC.sourceFiber;
      if (blendVal >= highThresh) claims.push(`High in ${CC.fiberSpelling}`);
      else if (blendVal >= sourceThresh) claims.push(`Source of ${CC.fiberSpelling}`);
    }
    if (key === 'Protein') {
      const energyKJ = getBlendNutrient('Energy (kJ)', recipeName, trimName) * servingMult;
      const hpCfg    = (isUS && perServing) ? CC.highProteinServing   : CC.highProtein;
      const spCfg    = (isUS && perServing) ? CC.sourceProteinServing : CC.sourceProtein;
      // Inline check using the selected config so we don't need to mutate CC
      function checkProtein(cfg, prot, eKJ) {
        if (cfg.mode === 'energyPct') return eKJ > 0 && (prot * 17 / eKJ * 100) >= cfg.pct;
        return prot >= cfg.g;
      }
      if (checkProtein(hpCfg, blendVal, energyKJ)) claims.push('High in Protein');
      else if (checkProtein(spCfg, blendVal, energyKJ)) claims.push('Source of Protein');
    }
    if (key === 'Vitamin D' && blendVal >= 10) claims.push('High in Vitamin D');
  });

  const chips = document.getElementById('hc-chips');
  chips.innerHTML = claims.map(c => `<div class="hc-chip">${c}</div>`).join('');

  // Show burger/meatball fibre warning if constraint couldn't be met
  const fiberWarning = document.getElementById('fiber-burger-warning');
  fiberWarning.style.display = (fiberFallback && state.q2 === 'Burger / Meatball') ? '' : 'none';
}


function renderSustainability(beefPct, fablePct, trimName, blendCO2, beefCO2, carbonPct, userTrimName) {
  // Format a CO2 value: bold number + small muted unit label
  const co2Val = (n) =>
    `<span class="sust-num">${parseFloat(n).toFixed(1)}</span><span class="sust-unit"> kg CO₂e/kg</span>`;

  // Blend side — shows the recommended blend trim
  document.getElementById('sust-blend-rows').innerHTML = `
    <div class="sust-row"><span class="sust-ingredient">Shiitake Infusion</span><span class="sust-val">${co2Val(SHIITAKE_CO2)}</span></div>
    <div class="sust-row"><span class="sust-ingredient">${trimName}</span><span class="sust-val">${co2Val(BEEF_CO2)}</span></div>
    <div class="sust-row sust-total"><span class="sust-ingredient">Total</span><span class="sust-val">${co2Val(blendCO2)}</span></div>
  `;
  // Beef only side — shows the user's Q1 selected trim as the reference
  document.getElementById('sust-beef-rows').innerHTML = `
    <div class="sust-row"><span class="sust-ingredient">${userTrimName}</span><span class="sust-val">${co2Val(BEEF_CO2)}</span></div>
    <div class="sust-row sust-total"><span class="sust-ingredient">Total</span><span class="sust-val">${co2Val(beefCO2)}</span></div>
  `;
  // Callout
  document.getElementById('carbon-pct').textContent = carbonPct+'% reduction';
}

/* ── Editable beef CO2 input ──────────────────────────────────────────────────
   Reads/writes localStorage key 'beef_co2_override'.
   Populates the input with the stored value (or the Supabase default).
   Calls onUpdate() whenever the value changes so the caller can re-render.  */
function initBeefCO2Input(onUpdate) {
  const input = document.getElementById('beef-co2-input');
  if (!input) return;

  // Apply any saved override, otherwise show the Supabase default
  const stored = localStorage.getItem('beef_co2_override');
  if (stored !== null) {
    const val = parseFloat(stored);
    if (!isNaN(val) && val > 0) BEEF_CO2 = val;
  }
  input.value = parseFloat(BEEF_CO2).toFixed(1);

  // Remove any previous listener to avoid duplicates on re-renders
  input.replaceWith(input.cloneNode(true));
  const freshInput = document.getElementById('beef-co2-input');

  freshInput.addEventListener('input', () => {
    const val = parseFloat(freshInput.value);
    if (!isNaN(val) && val > 0) {
      BEEF_CO2 = val;
      localStorage.setItem('beef_co2_override', val);
      onUpdate();
    }
  });
}
