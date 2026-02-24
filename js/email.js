/* ── Email results modal ─────────────────────────────────────────────────────
   openEmailModal()  — show the lightbox
   closeEmailModal() — hide it (also closes on overlay click)
   sendResults()     — validate, collect state, POST to Supabase Edge Function
   ─────────────────────────────────────────────────────────────────────────── */

const SUPABASE_URL      = 'https://qrtomlulbcuantmtaxfc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydG9tbHVsYmN1YW50bXRheGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NzkyMjgsImV4cCI6MjA1NTU1NTIyOH0.6vPECnLZHEXhGQ1FLrjSJ-E2q3yHE1h6kHgYaCdK3dY';

function openEmailModal() {
  document.getElementById('email-modal-overlay').style.display = 'flex';
  document.getElementById('email-first-name').focus();
}

function closeEmailModal(e) {
  // If called from overlay click, only close if they clicked the backdrop itself
  if (e && e.target !== document.getElementById('email-modal-overlay')) return;
  document.getElementById('email-modal-overlay').style.display = 'none';
}

async function sendResults() {
  const firstName = document.getElementById('email-first-name').value.trim();
  const lastName  = document.getElementById('email-last-name').value.trim();
  const email     = document.getElementById('email-address').value.trim();
  const company   = document.getElementById('email-company').value.trim();
  const errorEl   = document.getElementById('email-modal-error');
  const btn       = document.getElementById('email-send-btn');

  // Validate
  errorEl.style.display = 'none';
  if (!firstName) { showError('Please enter your first name.'); return; }
  if (!email || !email.includes('@')) { showError('Please enter a valid email address.'); return; }

  // Collect results from current page state
  const blendPrice  = document.getElementById('price-blend')?.textContent?.replace(/[^0-9.]/g, '') || '';
  const beefPrice   = document.getElementById('beef-only-price-input')?.value || '';
  const fiber       = document.getElementById('stat-fiber')?.textContent?.replace('g','') || '';
  const protein     = document.getElementById('stat-protein')?.textContent?.replace('g','') || '';
  const carbonPct   = document.getElementById('stat-carbon')?.textContent?.replace('%','') || '';
  const subtitle    = document.getElementById('hero-subtitle')?.textContent || '';

  // Parse blend ratio and trim from subtitle e.g. "A 70/30 85CL/Shiitake blend — Burger / Meatball"
  const ratioMatch = subtitle.match(/(\d+)\/(\d+)/);
  const blendRatio = ratioMatch ? `${ratioMatch[1]}/${ratioMatch[2]}` : '';
  const trimMatch  = subtitle.match(/(\d+CL[^/]*)\//);
  const trimName   = trimMatch ? trimMatch[1].trim() + ' Beef Trim' : '';

  const recipePill = document.getElementById('cost-recipe-pill')?.textContent?.replace('Recipe recommendation: ','') || '';
  const highFiber   = document.getElementById('stat-fiber-badge')?.style.display !== 'none';
  const highProtein = document.getElementById('stat-protein-badge')?.style.display !== 'none';

  const results = {
    country:      state.country      || '',
    businessType: state.businessType || '',
    format:       state.q2           || '',
    blendRatio,
    trimName,
    recipeName:   recipePill,
    blendPrice,
    beefPrice,
    currency:     CC?.currency  || '$',
    priceUnit:    CC?.priceUnit || 'per kg',
    fiber,
    protein,
    carbonPct,
    highFiber:    String(highFiber),
    highProtein:  String(highProtein),
  };

  // Send
  btn.disabled = true;
  btn.textContent = 'Sending…';

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-results`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ firstName, lastName, email, company, results }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      showError(data.error || 'Something went wrong. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Send my results →';
      return;
    }

    // Success state
    document.querySelector('.email-modal').innerHTML = `
      <div class="email-modal-success">
        <div class="success-icon">✅</div>
        <h3>On its way!</h3>
        <p>We've sent your blend results to <strong>${email}</strong>.<br>Check your inbox (and junk folder, just in case).</p>
        <button class="email-modal-btn" style="margin-top:24px;" onclick="closeEmailModal()">Close</button>
      </div>
    `;

  } catch (err) {
    console.error(err);
    showError('Network error. Please check your connection and try again.');
    btn.disabled = false;
    btn.textContent = 'Send my results →';
  }
}

function showError(msg) {
  const el = document.getElementById('email-modal-error');
  el.textContent = msg;
  el.style.display = 'block';
}
