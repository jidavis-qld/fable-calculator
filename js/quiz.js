/* ── Quiz navigation & state ────────────────────────────────────────────────────
   state:             holds all user answers (country, biz, q1-trim, format, priority, constraints).
   goTo(step):        shows the target slide and updates progress bar.
   selectCountry():   sets the active CC config and re-labels constraint text.
   selectPriority():  captures the user priority and advances the quiz.
   ─────────────────────────────────────────────────────────────────────────── */

/* ── STATE ───────────────────────────────────────── */
const state = {
  businessType: null,
  country: null,
  q1: null,        // fat %
  q2: null,        // format
  priority: null,  // 'cost' | 'nutrition' | 'balance' | 'sustainability'
  mustFiber: false,
  mustProtein: false,
};

/* ── QUIZ NAVIGATION ─────────────────────────────── */
function goTo(step) {
  document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
  document.getElementById('slide-'+step).classList.add('active');
  // Burger path: slides 1-2-3-4-5-6   (6 slides, skip 5b)
  // Mince path:  slides 1-2-3-4-5-5b-6 (7 slides, but user sees 6 steps)
  const total = 6;
  // Map slide id to progress step number
  const stepMap = { 1:0, 2:1, 3:2, 4:3, 5:4, '5b':5, 6:6 };
  const key = String(step).replace('slide-','');
  const progressStep = stepMap[key] !== undefined ? stepMap[key] : Math.max(0, step - 1);
  document.getElementById('progress-bar').style.width = (progressStep / total * 100) + '%';
  document.getElementById('step-count').textContent = progressStep + ' / ' + total;

  // Update slide-6 label depending on which path arrived
  if (step === 6) {
    const viaMince = state.q2 === 'Ground Beef (unformed)';
    document.getElementById('slide-6-label').textContent = viaMince ? 'Step 6 of 6' : 'Step 5 of 6';
  }
}

function selectOpt(el, group) {
  document.querySelectorAll('#'+group+'-options .opt-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  if (group === 'q1')  { state.q1 = parseFloat(el.dataset.value); document.getElementById('btn-4').disabled = false; }
  if (group === 'q2b') { state.q2 = el.dataset.value; document.getElementById('btn-5b').disabled = false; updateQuizFiberVisibility(); }
}

/* Step 4: beef format selection — burger goes straight to slide 6, mince goes to slide 5b */
function selectFormat(el, type) {
  document.querySelectorAll('#q2-options .opt-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.q2 = el.dataset.value;
  const btn = document.getElementById('btn-5');
  btn.disabled = false;
  if (type === 'burger') {
    // Burger / Meatball — skip step 5b, go straight to priority
    btn.onclick = () => goTo(6);
  } else {
    // Beef Mince / Ground Beef — go to hand-form question
    btn.onclick = () => goTo('5b');
  }
  updateQuizFiberVisibility();
}

function selectBiz(el) {
  document.querySelectorAll('#biz-options .opt-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.businessType = el.dataset.value;
  document.getElementById('btn-2').disabled = false;
}

function selectCountry(el) {
  document.querySelectorAll('#country-options .opt-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const country = el.dataset.value;
  state.country = country;
  const comingSoon = document.getElementById('country-coming-soon');
  const btn = document.getElementById('btn-3');
  if (COUNTRY_CONFIG[country]) {
    CC = COUNTRY_CONFIG[country];
    comingSoon.style.display = 'none';
    btn.disabled = false;
    // Update constraint subtitle labels and spelling for this country
    document.getElementById('fiber-constraint-sub').textContent   = CC.fiberConstraintSub;
    document.getElementById('protein-constraint-sub').textContent = CC.proteinConstraintSub;
    document.querySelector('#check-list .check-item:first-child .check-text').textContent = `Must be High in ${CC.fiberSpelling}`;
    document.getElementById('stat-fiber-badge').textContent = `High in ${CC.fiberSpelling}`;
    document.getElementById('stat-fiber-label').textContent = `${CC.fiberSpelling.toLowerCase()} per 100g`;
    // Step 4: use "Beef Mince" for UK/EU/AU, "Ground Beef" for US
    const useMince = country !== 'United States';
    document.getElementById('q2-mince-title').textContent = useMince ? 'Beef Mince / Ground Beef' : 'Ground Beef / Beef Mince';
    updateQuizFiberVisibility();
  } else {
    comingSoon.style.display = 'block';
    btn.disabled = true;
  }
}

/* ── Hide fiber constraint on step 5 when it cannot be achieved ──
   AU: ≥7g threshold is never reachable — hide always.
   UK/EU + Burger/Meatball: insufficient fibre for a strong bind — hide
   and show an explanatory note instead.                              */
function updateQuizFiberVisibility() {
  const fiberItem = document.getElementById('check-fiber-item');
  const noteEl    = document.getElementById('fiber-constraint-note');
  if (!fiberItem || !noteEl) return;

  const isAU     = CC && CC.code === 'AU';
  const isBurger = state.q2 === 'Burger / Meatball';
  const isUKorEU = CC && (CC.code === 'UK' || CC.code === 'EU');
  const hideBurger = isUKorEU && isBurger;
  const hide       = isAU || hideBurger;

  fiberItem.style.display = hide ? 'none' : '';

  if (hideBurger) {
    noteEl.style.display = '';
    noteEl.textContent = 'High in Fibre not available for Burger / Meatball — insufficient fibre for a strong bind.';
  } else {
    noteEl.style.display = 'none';
    noteEl.textContent = '';
  }

  // Clear state if hidden
  if (hide && state.mustFiber) {
    state.mustFiber = false;
    fiberItem.classList.remove('checked');
  }
}

function toggleCheck(el, which) {
  el.classList.toggle('checked');
  if (which === 'fiber')   state.mustFiber   = el.classList.contains('checked');
  if (which === 'protein') state.mustProtein = el.classList.contains('checked');
}

/* ── PRIORITY SELECTION ──────────────────────────── */
function selectPriority(el) {
  document.querySelectorAll('#priority-options .opt-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.priority = el.dataset.value;
  document.getElementById('btn-6').disabled = false;
}

