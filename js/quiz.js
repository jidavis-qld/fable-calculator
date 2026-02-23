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
  const total = 5; // steps 2–6 are the 5 real steps
  const progressStep = Math.max(0, step - 1); // slide 1=0, slide 2=1, ..., slide 6=5
  document.getElementById('progress-bar').style.width = (progressStep / total * 100) + '%';
  document.getElementById('step-count').textContent = progressStep + ' / ' + total;
}

function selectOpt(el, group) {
  document.querySelectorAll('#'+group+'-options .opt-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  if (group === 'q1') { state.q1 = parseFloat(el.dataset.value); document.getElementById('btn-4').disabled = false; }
  if (group === 'q2') { state.q2 = el.dataset.value; document.getElementById('btn-5').disabled = false; }
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
    document.getElementById('q2-unformed-title').textContent = useMince ? 'Beef Mince (unformed)' : 'Ground Beef (unformed)';
    document.getElementById('q2-unformed-desc').textContent  = 'Loose mince — tacos, pasta, bolognese, etc.';
    document.getElementById('q2-sub').textContent = useMince
      ? "Select burgers/meatballs if you're giving your customers beef mince but you want them to form it themselves"
      : "Select burgers/meatballs if you're giving your customers ground beef but you want them to form it themselves";
  } else {
    comingSoon.style.display = 'block';
    btn.disabled = true;
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

