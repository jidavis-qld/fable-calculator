/* ── Utility actions ────────────────────────────────────────────────────────────
   restart(): resets quiz state and returns user to step 3.
   savePDF():  triggers browser print dialog.
   ─────────────────────────────────────────────────────────────────────────── */

function restart() {
  document.getElementById('results-page').style.display = 'none';
  document.getElementById('quiz-shell').style.display = 'flex';
  // Keep business type (step 1) and Q1 trim (step 2) — only reset from step 3 onward
  state.q2 = null; state.priority = null;
  state.mustFiber = false; state.mustProtein = false;
  // Deselect only the format, priority, and constraint opt-cards (slides 4, 5, 6)
  ['slide-4','slide-5','slide-6'].forEach(id => {
    document.getElementById(id).querySelectorAll('.opt-card,.check-item')
      .forEach(c => c.classList.remove('selected','checked'));
  });
  document.getElementById('btn-4').disabled = true;
  document.getElementById('btn-5').disabled = true;
  document.getElementById('btn-6').disabled = true;
  goTo(4);
}

function savePDF() {
  window.print();
}
