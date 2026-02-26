/* ── send-results Edge Function ─────────────────────────────────────────────
   POST /functions/v1/send-results
   Body: {
     firstName, lastName, email, company,   // contact fields
     results: {                              // blend data from the calculator
       country, businessType, format,
       blendRatio, trimName, recipeName,
       blendPrice, beefPrice, currency, priceUnit,
       fiber, protein, carbonPct,
       highFiber, highProtein
     }
   }

   1. Upsert contact in HubSpot CRM
   2. Send formatted HTML email via HubSpot Transactional Email API
   ──────────────────────────────────────────────────────────────────────── */

const HUBSPOT_API_KEY  = Deno.env.get('HUBSPOT_API_KEY')!;
const HUBSPOT_EMAIL_ID = Deno.env.get('HUBSPOT_EMAIL_ID')!;
const FROM_EMAIL       = Deno.env.get('FROM_EMAIL') || 'hello@fablefood.co';
const FROM_NAME        = Deno.env.get('FROM_NAME')  || 'Fable Food';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Rate limiting: max 5 requests per IP per 15 minutes ──────────────────────
const RATE_LIMIT_MAX    = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in ms
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now  = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { firstName, lastName, email, company, results } = await req.json();

    if (!email || !firstName) {
      return new Response(JSON.stringify({ error: 'First name and email are required.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ── 1. Upsert HubSpot contact ─────────────────────────────────────────
    const contactRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: {
          firstname:          firstName,
          lastname:           lastName  || '',
          email:              email,
          company:            company   || '',
          hs_lead_status:     'NEW',
          fable_blend_result: results
            ? `${results.blendRatio} ${results.trimName} / Shiitake (${results.country})`
            : '',
        }
      })
    });

    // 409 = contact already exists — patch it instead
    if (contactRes.status === 409) {
      const body = await contactRes.json();
      const contactId = body.message?.match(/ID: (\d+)/)?.[1];
      if (contactId) {
        await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ properties: { firstname: firstName, lastname: lastName || '', company: company || '' } })
        });
      }
    }

    // ── 2. Send transactional email via HubSpot ───────────────────────────
    const emailHtml = buildEmailHtml(firstName, results);

    const sendRes = await fetch('https://api.hubapi.com/marketing/v3/transactional/single-email/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailId: parseInt(HUBSPOT_EMAIL_ID),
        message: { to: email, from: FROM_EMAIL, fromName: FROM_NAME, replyTo: FROM_EMAIL },
        customProperties: { email_body_html: emailHtml },
        contactProperties: { firstname: firstName },
      })
    });

    if (!sendRes.ok) {
      const err = await sendRes.text();
      console.error('HubSpot send error:', err);
      return new Response(JSON.stringify({ error: 'Failed to send email. Please try again.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Unexpected error. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ── Email HTML builder ────────────────────────────────────────────────────────
function buildEmailHtml(firstName: string, r: Record<string, string>): string {
  const blendRatio  = r?.blendRatio  || '—';
  const trimName    = r?.trimName    || '—';
  const recipeName  = r?.recipeName  || '—';
  const currency    = r?.currency    || '$';
  const blendPrice  = r?.blendPrice  || '—';
  const beefPrice   = r?.beefPrice   || '—';
  const priceUnit   = r?.priceUnit   || 'per kg';
  const fiber       = r?.fiber       || '—';
  const carbonPct   = r?.carbonPct   || '—';
  const format      = r?.format      || '';
  const highFiber   = r?.highFiber   === 'true';
  const highProtein = r?.highProtein === 'true';

  const beefPct   = blendRatio.split('/')[0] || '—';
  const fablePct  = blendRatio.split('/')[1] || '—';

  const claims = [
    highFiber   ? '✔ High in Fibre'   : '',
    highProtein ? '✔ High in Protein' : '',
  ].filter(Boolean).join('&nbsp;&nbsp;&nbsp;');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your Fable Blend Results</title></head>
<body style="margin:0;padding:0;background:#f4f2eb;font-family:'DM Sans',Arial,sans-serif;color:#332f21;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2eb;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="background:#2e4214;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
    <div style="font-family:Georgia,serif;font-size:38px;font-weight:700;color:#cfff8e;letter-spacing:0.04em;">fable</div>
    <div style="color:rgba(207,255,142,0.65);font-size:12px;letter-spacing:0.18em;text-transform:uppercase;margin-top:4px;">Shiitake Infusion Calculator</div>
  </td></tr>

  <!-- Intro -->
  <tr><td style="background:#ffffff;padding:36px 40px 20px;">
    <p style="font-size:18px;font-weight:700;color:#2e4214;margin:0 0 8px;">Hi ${firstName},</p>
    <p style="font-size:15px;line-height:1.6;color:#5e7462;margin:0;">
      Here are your personalised results from the Fable Shiitake Infusion blend calculator.
    </p>
  </td></tr>

  <!-- Blend ratio -->
  <tr><td style="background:#ffffff;padding:0 40px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8f3d4;border-radius:14px;text-align:center;">
      <tr>
        <td style="width:44%;padding:20px 12px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#5e7462;margin-bottom:6px;">Beef Trim</div>
          <div style="font-size:52px;font-weight:700;color:#2e4214;font-family:Georgia,serif;line-height:1;">${beefPct}%</div>
          <div style="font-size:13px;color:#5e7462;margin-top:4px;">${trimName}</div>
        </td>
        <td style="width:12%;font-size:20px;font-weight:700;color:#5e7462;vertical-align:middle;">+</td>
        <td style="width:44%;padding:20px 12px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#5e7462;margin-bottom:6px;">Shiitake Infusion</div>
          <div style="font-size:52px;font-weight:700;color:#2e4214;font-family:Georgia,serif;line-height:1;">${fablePct}%</div>
          <div style="font-size:13px;color:#5e7462;margin-top:4px;">Fable Infusion</div>
        </td>
      </tr>
      <tr><td colspan="3" style="padding:0 20px 20px;text-align:center;">
        <span style="background:#2e4214;color:#cfff8e;font-size:12px;font-weight:700;padding:5px 16px;border-radius:100px;letter-spacing:0.04em;">${recipeName}</span>
        &nbsp;
        <span style="background:#2e4214;color:#cfff8e;font-size:12px;font-weight:700;padding:5px 16px;border-radius:100px;letter-spacing:0.04em;">${format}</span>
      </td></tr>
    </table>
  </td></tr>

  <!-- Key stats -->
  <tr><td style="background:#ffffff;padding:0 40px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8f3d4;border-radius:14px;overflow:hidden;">
      <tr style="background:#f4f2eb;">
        <td style="width:33%;text-align:center;padding:18px 10px;border-right:1px solid #e8f3d4;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#5e7462;margin-bottom:6px;">Blend Price</div>
          <div style="font-size:26px;font-weight:700;color:#2e4214;font-family:Georgia,serif;">${currency}${blendPrice}</div>
          <div style="font-size:12px;color:#5e7462;">${priceUnit}</div>
          <div style="font-size:11px;color:#5e7462;margin-top:3px;">vs ${currency}${beefPrice} beef</div>
        </td>
        <td style="width:34%;text-align:center;padding:18px 10px;border-right:1px solid #e8f3d4;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#5e7462;margin-bottom:6px;">Fibre / 100g</div>
          <div style="font-size:26px;font-weight:700;color:#2e4214;font-family:Georgia,serif;">${fiber}g</div>
          ${highFiber ? `<span style="background:#cfff8e;color:#2e4214;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;display:inline-block;margin-top:4px;">High in Fibre</span>` : ''}
        </td>
        <td style="width:33%;text-align:center;padding:18px 10px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#5e7462;margin-bottom:6px;">CO₂ Reduction</div>
          <div style="font-size:26px;font-weight:700;color:#2e4214;font-family:Georgia,serif;">${carbonPct}%</div>
          <div style="font-size:12px;color:#5e7462;">vs 100% beef</div>
        </td>
      </tr>
    </table>
  </td></tr>

  ${claims ? `
  <!-- Health claims -->
  <tr><td style="background:#ffffff;padding:0 40px 28px;">
    <p style="font-size:13px;font-weight:700;color:#2e4214;margin:0;">${claims}</p>
  </td></tr>` : ''}

  <!-- CTA -->
  <tr><td style="background:#ffffff;padding:0 40px 40px;text-align:center;">
    <a href="https://www.fablefood.co/contact" style="display:inline-block;background:#cfff8e;color:#2e4214;font-family:Georgia,serif;font-size:16px;font-weight:700;padding:14px 40px;border-radius:100px;text-decoration:none;">Talk to our team →</a>
    <p style="font-size:13px;color:#5e7462;margin-top:16px;line-height:1.5;">Ready to get started with Fable Shiitake Infusion? Our team can help.</p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#2e4214;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#cfff8e;">fable</div>
    <div style="font-size:11px;color:rgba(207,255,142,0.6);margin-top:4px;letter-spacing:0.12em;">MUSHROOMS REIMAGINED</div>
    <div style="margin-top:10px;">
      <a href="https://www.fablefood.co" style="color:rgba(207,255,142,0.55);font-size:12px;text-decoration:none;">www.fablefood.co</a>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
