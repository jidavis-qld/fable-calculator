/* ── Brand & quiz configuration ────────────────────────────────────────────────
   Edit CONFIG to change copy, brand name, section headings, and quiz text.
   Edit COUNTRY_CONFIG to change currencies, prices, and claim thresholds.
   ─────────────────────────────────────────────────────────────────────────── */

/* ══════════════════════════════════════════════════════════════
   ✏️  DESIGN & COPY CONFIG — SAFE TO EDIT
   Everything your marketing manager needs is in this block.
   Do NOT edit anything below the closing }; of this object.
══════════════════════════════════════════════════════════════ */
const CONFIG = {

  brand: {
    name:       "Fable Food",
    website:    "https://www.fablefood.co",
    tagline:    "MUSHROOMS REIMAGINED",
  },

  colors: {
    /* Main dark green used for headers and quiz background */
    forest:   "#1a2e1a",
    /* Mid green — section headers, accents */
    moss:     "#3d5a1e",
    /* Lighter green — bubble color */
    fern:     "#6b8f3e",
    /* Pale green — highlight chips, progress bar, buttons */
    sage:     "#a8c080",
    /* Very light green — table backgrounds, cards */
    mist:     "#e8f0dc",
    /* Page background */
    cream:    "#f7f4ee",
    /* Disclaimer / note text color */
    rust:     "#c44d2c",
  },

  fonts: {
    /* Heading font — loaded from Google Fonts */
    heading: "'Playfair Display', serif",
    /* Body font — loaded from Google Fonts */
    body:    "'DM Sans', sans-serif",
  },

  hero: {
    eyebrow:  "Your personalised blend",
    title:    "Your magical blend of Shiitake Infusion & Beef!",
    /* The italic word(s) in the title — must appear exactly in title above */
    titleItalic: "Shiitake Infusion & Beef!",
    bubbleNote: "*Water is included to rehydrate the mushroom mix, as it is partially dried, and this achieves a moisture content enabling the mince to be used in the same recipes as 100% beef.",
  },

  sections: {
    cost: {
      heading: "Cost",
      disclaimer: "Calculations shown reflect ingredient cost of Fable Shiitake Infusion and beef trim only. Additional processing and packaging costs are typically about the same as ground beef.",
    },
    nutrition: {
      heading: "Nutrition",
    },
    sustainability: {
      heading: "Sustainability",
      disclaimer: "Calculations shown reflect ingredient impact of Fable Shiitake Infusion and beef trim only. Additional ingredients and processing inputs not included.",
    },
  },

  footer: {
    thankYouText: "Thank you!",
    /* URL for the footer background food photo (must be a direct image link) */
    footerImageUrl: "images/banner.jpg",
  },

  quiz: {
    /* Labels shown above each question */
    q1Label:  "Step 3 of 5",
    q2Label:  "Step 4 of 5",
    q3Label:  "Step 5 of 5",

    q1Title:  "How much fat should the finished product contain?",

    q2Title:  "Do you want your product to be used for making formed or unformed beef?",
    q2Sub:    "Select burgers/meatballs if you're giving your customers ground beef but you want them to form it themselves",

    q3Title:  "Rank what matters most to you",
    q3Sub:    "Drag to reorder — most important at the top.",

    ctaButton: "See My Results →",
    restartButton: "Try Another Recipe",
  },

};
/* ══════════════════════════════════════════════════════════════
   END OF CONFIG — do not edit below this line unless you're
   comfortable with JavaScript.
══════════════════════════════════════════════════════════════ */

/* Apply CONFIG to CSS variables and DOM on load */
(function applyConfig() {
  const r = document.documentElement.style;
  r.setProperty('--forest', CONFIG.colors.forest);
  r.setProperty('--moss',   CONFIG.colors.moss);
  r.setProperty('--fern',   CONFIG.colors.fern);
  r.setProperty('--sage',   CONFIG.colors.sage);
  r.setProperty('--mist',   CONFIG.colors.mist);
  r.setProperty('--cream',  CONFIG.colors.cream);
  r.setProperty('--rust',   CONFIG.colors.rust);

  document.querySelectorAll('.quiz-logo').forEach(el => el.innerHTML = '<img src="images/FAB Fable logo.png" alt="Fable" class="quiz-logo-img">');
  document.querySelector('.results-eyebrow').textContent = CONFIG.hero.eyebrow;
  document.querySelector('.bubble-note').textContent = CONFIG.hero.bubbleNote;
  document.querySelector('.footer-thankyou').textContent = CONFIG.footer.thankYouText;
  document.querySelector('.footer-tagline').innerHTML = CONFIG.brand.tagline + ' | <a href="'+CONFIG.brand.website+'" target="_blank">'+CONFIG.brand.website.replace('https://','')+'</a>';
  document.querySelector('.footer-img-wrap img').src = CONFIG.footer.footerImageUrl;

  // Section headings & disclaimers
  document.querySelector('#section-cost .section-title').textContent   = CONFIG.sections.cost.heading;
  document.querySelector('#section-cost .section-note').textContent    = CONFIG.sections.cost.disclaimer;
  document.querySelectorAll('.section-title')[1].textContent           = CONFIG.sections.nutrition.heading;
  document.querySelectorAll('.section-title')[2].textContent           = CONFIG.sections.sustainability.heading;
  document.querySelectorAll('.section-note')[1].textContent            = CONFIG.sections.sustainability.disclaimer;

  // Quiz copy — slides 4, 5, 6 are the actual questions (indices 3, 4, 5)
  // Slides 1 (welcome), 2 (business), 3 (country) come before them in the DOM
  document.querySelectorAll('.slide-label')[3].textContent    = CONFIG.quiz.q1Label;
  document.querySelectorAll('.slide-label')[4].textContent    = CONFIG.quiz.q2Label;
  document.querySelectorAll('.slide-label')[5].textContent    = CONFIG.quiz.q3Label;
  document.querySelectorAll('.slide-question')[3].textContent = CONFIG.quiz.q1Title;
  document.querySelectorAll('.slide-sub')[3].textContent      = CONFIG.quiz.q1Sub;
  document.querySelectorAll('.slide-question')[4].textContent = CONFIG.quiz.q2Title;
  document.querySelectorAll('.slide-sub')[4].textContent      = CONFIG.quiz.q2Sub;
  document.querySelectorAll('.slide-question')[5].textContent = CONFIG.quiz.q3Title;
  document.querySelectorAll('.slide-sub')[5].textContent      = CONFIG.quiz.q3Sub;
  document.getElementById('btn-6').textContent               = CONFIG.quiz.ctaButton;

  // Hero title with italic
  const titleEl = document.getElementById('hero-title');
  const full = CONFIG.hero.title;
  const italic = CONFIG.hero.titleItalic;
  if (italic && full.includes(italic)) {
    const parts = full.split(italic);
    titleEl.innerHTML = parts[0] + '<br><em>' + italic + '</em>';
  } else {
    titleEl.textContent = full;
  }
})();

