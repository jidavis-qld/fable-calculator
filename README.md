# Fable Shiitake Infusion Calculator

A browser-based tool that recommends a Fable Shiitake Infusion recipe and beef trim for a given customer priority (cost, nutrition, balance, or sustainability). Also includes a Recipe Validator for exploring all recipe/trim combinations in detail.

---

## Pages

| File | Description |
|---|---|
| `index.html` | Main calculator quiz — 6-step wizard → results output |
| `validator.html` | Validator tool — explore all recipes by format, trim, and country |

---

## File Structure

```
├── index.html              # Calculator page (HTML only — no inline CSS/JS)
├── validator.html          # Validator page (HTML only)
├── fonts.css               # Brand fonts (Zapf Humanist, base64 embedded)
├── SCORING_RULES.md        # How the scoring engine works (plain English)
│
├── css/
│   ├── base.css            # Brand palette (CSS custom properties)
│   ├── quiz.css            # Quiz shell styles
│   ├── results.css         # Results page styles
│   ├── sustainability.css  # Sustainability section + footer + responsive
│   ├── labels.css          # UK Traffic Light + EU Nutri-Score labels
│   └── validator.css       # Validator page styles
│
├── js/
│   ├── config.js           # Brand text config (headings, quiz copy)
│   ├── country.js          # COUNTRY_CONFIG, active CC, shared data stores
│   ├── data.js             # Supabase connection + loadData() for calculator
│   ├── engine.js           # Scoring engine — candidate pool, normalise, pick
│   ├── quiz.js             # Quiz navigation and state
│   ├── render.js           # Results rendering (cost, nutrition, sustainability)
│   ├── nutriscore.js       # UK Traffic Light + EU Nutri-Score labels
│   ├── misc.js             # restart(), savePDF()
│   └── validator.js        # All validator page logic (own loadData)
│
└── supabase/
    └── migrations/
        ├── 20260220_multi_country.sql   # Renamed tables, added country column, UK data
        └── 20260220_eu_region.sql       # EU beef prices, nutrition, recipes
```

### JS load order (index.html)

```
config → country → data → engine → quiz → render → nutriscore → misc
```

`country.js` must be first — it declares all shared global data stores that the other modules write to.

---

## Data (Supabase)

All mutable data lives in Supabase. The app reads it at runtime — no rebuild needed to change prices or weights.

| Table | Contents |
|---|---|
| `beef_prices` | Beef trim prices by country (`US`, `UK`, `EU`) |
| `nutrition` | Nutrient values per 100g for each ingredient × country |
| `recipes` | Blend ratios (beef/fable/water) per format × recipe × country |
| `co2_kg_e` | CO₂e per kg for shiitake and beef (shared across countries) |
| `scoring_config` | Scoring weights and algorithm parameters (shared) |

---

## Countries

| Country | Currency | Front-of-pack label |
|---|---|---|
| United States | $ / lb | None |
| United Kingdom | £ / kg | FSA Traffic Light (per 100g) |
| Australia | $ / kg | Health Star Rating (0.5–5.0 ★) |
| Europe | € / kg | Nutri-Score (A–E) |

---

## Scoring

See [`SCORING_RULES.md`](SCORING_RULES.md) for a full walkthrough of the candidate pool, normalisation, nutrition composite, priority weights, and balance-specific adjustments.

All scoring weights are live-editable in the Supabase `scoring_config` table — no deploy needed.
