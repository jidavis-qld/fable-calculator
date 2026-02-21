/* ── Front-of-pack nutrition labels ─────────────────────────────────────────────
   UK Traffic Light (FSA 2013, per 100g):
     TFL_THRESHOLDS:      green/amber/red cutoffs for Fat, Saturates, Sugars, Salt.
     renderTrafficLight(): renders the coloured pill label for UK results.

   EU Nutri-Score (Santé Publique France current algorithm):
     nutriScorePoints():  maps a nutrient value to its 0–10 or 0–5 point score.
     calcNutriScore():    computes Points A (negative) minus Points C (positive).
     buildNsLabelHtml():  returns the five-tile A–E label HTML string.
     renderNutriScore():  renders blend vs 100% beef comparison for EU results.

   AU Health Star Rating (FSANZ NPSC algorithm, Category 2 — Foods):
     hsrPointsA():        baseline points for energy, sat fat, sugars, sodium.
     hsrPointsC():        modifying points for FVNL%, fibre, protein.
     calcHSR():           net score → star rating (0.5–5.0 in 0.5 steps).
     buildHsrLabelHtml(): returns the star label HTML string.
     renderHSR():         renders blend vs 100% beef comparison for AU results.

   To change thresholds, edit TFL_THRESHOLDS (UK), the arrays in calcNutriScore (EU),
   or the HSR_* tables below (AU).
   ─────────────────────────────────────────────────────────────────────────── */

// ── UK FSA Traffic Light Label ───────────────────────────────────────────────
// Thresholds per 100g (FSA 2013 front-of-pack guidelines)
const TFL_THRESHOLDS = {
  fat:       { green: 3,    amber: 17.5, unit: 'g',  name: 'Fat',       ri: 70  },
  saturates: { green: 1.5,  amber: 5,    unit: 'g',  name: 'Saturates', ri: 20  },
  sugars:    { green: 5,    amber: 22.5, unit: 'g',  name: 'Sugars',    ri: 90  },
  salt:      { green: 0.3,  amber: 1.5,  unit: 'g',  name: 'Salt',      ri: 6   },
};

// Energy RI values (adult)
const ENERGY_RI_KJ   = 8400;
const ENERGY_RI_KCAL = 2000;

function tflColour(val, green, amber) {
  if (val <= green)  return 'green';
  if (val <= amber)  return 'amber';
  return 'red';
}

function tflWord(colour) {
  return colour.charAt(0).toUpperCase() + colour.slice(1); // "Green" → nope, keep as label
}

function renderTrafficLight(recipeName, trimName) {
  const wrap  = document.getElementById('tfl-wrap');
  const label = document.getElementById('tfl-label');

  // Only show for UK
  if (CC.code !== 'UK') { wrap.classList.remove('visible'); return; }
  wrap.classList.add('visible');

  const energyKJ   = getBlendNutrient('Energy (kJ)',       recipeName, trimName);
  const energyKcal = getBlendNutrient('Energy (Calories)', recipeName, trimName);
  const fat        = getBlendNutrient('Total Fat',         recipeName, trimName);
  const saturates  = getBlendNutrient('Saturated Fat',     recipeName, trimName);
  const sugars     = getBlendNutrient('Total Sugars',      recipeName, trimName);
  const salt       = getBlendNutrient('Salt',              recipeName, trimName);

  // Energy % RI
  const energyRiPct = Math.round((energyKJ / ENERGY_RI_KJ) * 100);

  // Build nutrient cells
  const nutrients = [
    { key: 'fat',       val: fat,       fmt: fat.toFixed(1)       },
    { key: 'saturates', val: saturates, fmt: saturates.toFixed(1) },
    { key: 'sugars',    val: sugars,    fmt: sugars.toFixed(1)     },
    { key: 'salt',      val: salt,      fmt: salt.toFixed(2)       },
  ];

  const cellsHtml = nutrients.map(({ key, val, fmt }) => {
    const t      = TFL_THRESHOLDS[key];
    const colour = tflColour(val, t.green, t.amber);
    const riPct  = Math.round((val / t.ri) * 100);
    return `
      <div class="tfl-cell">
        <div class="tfl-cell-inner">
          <div class="tfl-pill ${colour}">
            <span class="tfl-traffic-word">${colour.charAt(0).toUpperCase() + colour.slice(1)}</span>
            <span class="tfl-value">${fmt}</span>
            <span class="tfl-unit">${t.unit}</span>
          </div>
          <div class="tfl-nutrient-name">${t.name}</div>
          <div class="tfl-ri">${riPct}% RI*</div>
        </div>
      </div>`;
  }).join('');

  label.innerHTML = `
    <div class="tfl-per100">per<br>100g</div>
    <div class="tfl-nutrients">
      <div class="tfl-cell" style="min-width:80px; border-left:1px solid #1a1a1a;">
        <div class="tfl-cell-inner">
          <div class="tfl-pill" style="background:#1a1a1a; color:#fff; min-height:42px;">
            <span class="tfl-value" style="font-size:13px;">${Math.round(energyKJ)}</span>
            <span class="tfl-unit">kJ</span>
            <span class="tfl-value" style="font-size:11px; margin-top:2px;">${Math.round(energyKcal)}</span>
            <span class="tfl-unit">kcal</span>
          </div>
          <div class="tfl-nutrient-name">Energy</div>
          <div class="tfl-ri">${energyRiPct}% RI*</div>
        </div>
      </div>
      ${cellsHtml}
    </div>`;
}

// ── EU Nutri-Score ────────────────────────────────────────────────────────────
// Algorithm: FSA/Santé Publique France current (general foods, red meat category)
// Points A (negative): Energy, Sugars, Saturated Fat, Sodium
// Points C (positive): Fruit/Veg/Legumes%, Fibre, Protein
// Final score = A - C (with protein excluded from C when A≥11 and FVL<5pts)
// Grade: A(<0), B(0-2), C(3-10), D(11-18), E(≥19)

function nutriScorePoints(val, thresholds) {
  // thresholds = array of upper bounds; points = index where val <= threshold
  for (let i = 0; i < thresholds.length; i++) {
    if (val <= thresholds[i]) return i;
  }
  return thresholds.length;
}

function calcNutriScore(energyKJ, sugars, satFat, salt, fibre, protein) {
  const sodium = salt * 400;
  const fvlPct = 0; // beef blend — no fruit/veg/legumes

  const ptEnergy = nutriScorePoints(energyKJ, [335,670,1005,1340,1675,2010,2345,2680,3015,3350]);
  const ptSugars = nutriScorePoints(sugars,   [4.5,9,13.5,18,22.5,27,31,36,40,45]);
  const ptSatFat = nutriScorePoints(satFat,   [1,2,3,4,5,6,7,8,9,10]);
  const ptSodium = nutriScorePoints(sodium,   [90,180,270,360,450,540,630,720,810,900]);
  const pointsA  = ptEnergy + ptSugars + ptSatFat + ptSodium;

  const ptFVLadj = 0; // fvlPct always 0 for beef
  const ptFibre  = nutriScorePoints(fibre,   [0.9,1.9,2.8,3.7,4.7]);
  const ptProtein= nutriScorePoints(protein, [1.6,3.2,4.8,6.4,8.0]);

  let score;
  if (pointsA < 11 || ptFVLadj === 5) {
    score = pointsA - (ptFVLadj + ptFibre + ptProtein);
  } else {
    score = pointsA - (ptFVLadj + ptFibre);
  }

  let grade;
  if      (score < 0)   grade = 'A';
  else if (score <= 2)  grade = 'B';
  else if (score <= 10) grade = 'C';
  else if (score <= 18) grade = 'D';
  else                  grade = 'E';

  return { score, grade };
}

function buildNsLabelHtml(score, grade) {
  const grades = ['A','B','C','D','E'];
  const tilesHtml = grades.map(g => `
    <div class="ns-tile ns-tile-${g.toLowerCase()} ${g === grade ? 'active' : 'inactive'}">
      <span class="ns-tile-letter">${g}</span>
    </div>`).join('');
  return `
    <div class="ns-title-block">
      <div class="ns-title-word">Nutri</div>
      <div class="ns-title-score">${score}</div>
      <div class="ns-title-sub">score</div>
    </div>
    <div class="ns-tiles">${tilesHtml}</div>`;
}

function renderNutriScore(recipeName, trimName, userTrimName) {
  const wrap = document.getElementById('ns-wrap');
  if (CC.code !== 'EU') { wrap.classList.remove('visible'); return; }
  wrap.classList.add('visible');

  // Blend score
  const blendResult = calcNutriScore(
    getBlendNutrient('Energy (kJ)',    recipeName, trimName),
    getBlendNutrient('Total Sugars',   recipeName, trimName),
    getBlendNutrient('Saturated Fat',  recipeName, trimName),
    getBlendNutrient('Salt',           recipeName, trimName),
    getBlendNutrient('Dietary Fiber',  recipeName, trimName),
    getBlendNutrient('Protein',        recipeName, trimName)
  );

  // Beef reference score (100% userTrimName)
  const beefRef = HEALTH_REF.beef[userTrimName] ?? {};
  const beefSalt = beefRef['Salt'] ?? (beefRef['Sodium'] ? beefRef['Sodium'] / 400 : 0);
  const beefResult = calcNutriScore(
    beefRef['Energy (kJ)']    ?? 0,
    beefRef['Total Sugars']   ?? 0,
    beefRef['Saturated Fat']  ?? 0,
    beefSalt,
    beefRef['Dietary Fiber']  ?? 0,
    beefRef['Protein']        ?? 0
  );

  document.getElementById('ns-label-blend').innerHTML = buildNsLabelHtml(blendResult.score, blendResult.grade);
  document.getElementById('ns-label-beef').innerHTML  = buildNsLabelHtml(beefResult.score,  beefResult.grade);
  document.getElementById('ns-col-beef-label').textContent = '100% ' + userTrimName;
}


// ── AU Health Star Rating ─────────────────────────────────────────────────────
// Algorithm: FSANZ NPSC (Nutrient Profiling Scoring Criterion), Category 2 — Foods
// Points A (baseline, higher = worse): Energy, Saturated Fat, Total Sugars, Sodium
// Points C (modifying, higher = better): FVNL%, Dietary Fibre, Protein
// Net score = A - C  (protein excluded from C when A ≥ 13 and FVNL < 5 pts)
// Net score mapped to star rating: -15 (5★) through 26+ (0.5★)
// Source: FSANZ HSR Calculator, Points Table A & C (Category 2 Foods)

const HSR_A_ENERGY  = [335,670,1005,1340,1675,2010,2345,2680,3015,3350,3685];
const HSR_A_SATFAT  = [1.01,2.01,3.01,4.01,5.01,6.01,7.01,8.01,9.01,10.01,11.21,12.51,13.91,15.51,17.31,19.31,21.61,24.11,26.91,30.01];
const HSR_A_SUGARS  = [5.01,8.91,12.81,16.81,20.71,24.61,28.51,32.41,36.31,40.31,44.21,48.11,52.01,55.91,59.81,63.81,67.71,71.61,75.51,79.41];
const HSR_A_SODIUM  = [90,180,270,360,450,540,630,720,810,900,990,1080,1170,1260,1350,1440,1530,1620,1710,1800];
const HSR_C_FVNL    = [40,60,67,75,80,90,95,99.5,100];
const HSR_C_FIBRE   = [0.91,1.91,2.81,3.71,4.71,5.41,6.31,7.31,8.41,9.71,11.21,13.01,15.01,17.31,20.01];
const HSR_C_PROTEIN = [1.61,3.20,4.81,6.41,8.01,9.61,11.61,13.91,16.71,20.01,24.01,28.91,34.71,41.61,50.01];

function hsrPoints(val, thresholds) {
  let pts = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (val > thresholds[i]) pts = i + 1; else break;
  }
  return pts;
}

function calcHSR(energyKJ, satFat, sugars, sodiumMg, fibre, protein, fvnlPct) {
  const ptEnergy = hsrPoints(energyKJ, HSR_A_ENERGY);
  const ptSatFat = hsrPoints(satFat,   HSR_A_SATFAT);
  const ptSugars = hsrPoints(sugars,   HSR_A_SUGARS);
  const ptSodium = hsrPoints(sodiumMg, HSR_A_SODIUM);
  const pointsA  = ptEnergy + ptSatFat + ptSugars + ptSodium;

  const ptFVNL  = hsrPoints(fvnlPct, HSR_C_FVNL);
  const ptFibre = hsrPoints(fibre,   HSR_C_FIBRE);
  const ptProt  = hsrPoints(protein, HSR_C_PROTEIN);

  // Tipping point: protein excluded when A ≥ 13 AND FVNL < 5 pts
  const pointsC = (pointsA >= 13 && ptFVNL < 5)
    ? ptFVNL + ptFibre
    : ptFVNL + ptFibre + ptProt;

  const netScore = pointsA - pointsC;

  // Cat 2 Foods star mapping (FSANZ official)
  let stars;
  if      (netScore <= -15) stars = 5.0;
  else if (netScore <= -10) stars = 4.5;
  else if (netScore <=  -5) stars = 4.0;
  else if (netScore <=   0) stars = 3.5;
  else if (netScore <=   5) stars = 3.0;
  else if (netScore <=  10) stars = 2.5;
  else if (netScore <=  15) stars = 2.0;
  else if (netScore <=  20) stars = 1.5;
  else if (netScore <=  25) stars = 1.0;
  else                      stars = 0.5;

  return { netScore, pointsA, pointsC, stars };
}

function buildHsrLabelHtml(stars) {
  // Official FSANZ HSR images stored locally in img/hsr/
  // numbered 1–10 where image number = stars × 2  (e.g. 3.5★ → img/hsr/7.png)
  const imgNum = Math.round(stars * 2);
  return `<img class="hsr-img" src="img/hsr/${imgNum}.png" alt="${stars.toFixed(1)} Health Stars" />`;
}

function renderHSR(recipeName, trimName, userTrimName) {
  const wrap = document.getElementById('hsr-wrap');
  if (CC.code !== 'AU') { wrap.classList.remove('visible'); return; }
  wrap.classList.add('visible');

  // Use state.q2 (the format the user chose) to look up blend ratios — same as getBlendNutrient
  const [beefPct, fablePct] = RECIPES[state.q2][recipeName];
  // Shiitake mushroom counts as FVNL under FSANZ — FVNL% = mushroom fraction of blend
  const fvnlPct = fablePct * 100;

  const blendResult = calcHSR(
    getBlendNutrient('Energy (kJ)',   recipeName, trimName),
    getBlendNutrient('Saturated Fat', recipeName, trimName),
    getBlendNutrient('Total Sugars',  recipeName, trimName),
    getBlendNutrient('Sodium',        recipeName, trimName),
    getBlendNutrient('Dietary Fibre', recipeName, trimName),
    getBlendNutrient('Protein',       recipeName, trimName),
    fvnlPct
  );

  const beefRef    = HEALTH_REF.beef[userTrimName] ?? {};
  const beefResult = calcHSR(
    beefRef['Energy (kJ)']   ?? 0,
    beefRef['Saturated Fat'] ?? 0,
    beefRef['Total Sugars']  ?? 0,
    beefRef['Sodium']        ?? 0,
    beefRef['Dietary Fibre'] ?? 0,
    beefRef['Protein']       ?? 0,
    0
  );

  document.getElementById('hsr-label-blend').innerHTML = buildHsrLabelHtml(blendResult.stars);
  document.getElementById('hsr-label-beef').innerHTML  = buildHsrLabelHtml(beefResult.stars);
  document.getElementById('hsr-col-beef-label').textContent = '100% ' + userTrimName;
}
