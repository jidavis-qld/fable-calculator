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
├── validator.html          # Validator page (all logic in one inline <script>)
├── fonts.css               # Brand fonts (Zapf Humanist, base64 embedded)
├── SCORING_RULES.md        # How the scoring engine works (plain English)
│
├── css/
│   ├── base.css            # Brand palette (CSS custom properties)
│   ├── quiz.css            # Quiz shell styles
│   ├── results.css         # Results page styles (hero, stat tiles, sections, tables)
│   ├── sustainability.css  # Sustainability section + carbon callout + footer + responsive
│   ├── labels.css          # UK Traffic Light + AU Health Star + EU Nutri-Score labels
│   └── validator.css       # Validator page styles
│
├── js/
│   ├── config.js           # Brand text + footer image config (headings, quiz copy)
│   ├── country.js          # COUNTRY_CONFIG (all 4 countries), active CC, shared data stores
│   ├── data.js             # Supabase credentials + sbFetch() + loadData() for calculator
│   ├── engine.js           # Scoring engine — candidate pool, normalise, pick winner
│   ├── quiz.js             # Quiz navigation and state
│   ├── render.js           # Results rendering (cost, nutrition, sustainability, stat tiles)
│   ├── nutriscore.js       # UK Traffic Light + AU Health Star + EU Nutri-Score label logic
│   ├── misc.js             # restart(), savePDF()
│   └── validator.js        # Standalone refactor of validator logic (not yet loaded by validator.html)
│
├── images/
│   ├── banner.jpg          # Footer food photography (Fable Shiitake Infused formats)
│   └── sticker.png         # Fable Mushroom Hand Sticker (hero, top-right)
│
└── supabase/
    └── migrations/
        ├── 20260220_multi_country.sql   # Initial multi-country schema — renamed tables, country column, UK data
        ├── 20260220_eu_region.sql       # EU beef prices, nutrition, recipes
        └── 20260220_au_region.sql       # AU beef prices, nutrition, recipes (FSANZ — kJ + Sodium in mg)
```

### JS load order (index.html)

```
config → country → data → engine → quiz → render → nutriscore → misc
```

`country.js` must be first — it declares all shared global data stores that the other modules write to.

`validator.html` loads `country.js` only, then runs its own self-contained inline `<script>` which duplicates the data-loading and rendering logic for the validator UI.

---

## Data (Supabase)

All mutable data lives in Supabase. The app reads it at runtime — no rebuild needed to change prices or weights.

| Table | Contents |
|---|---|
| `beef_prices` | Beef trim prices by country (`US`, `UK`, `EU`, `AU`) |
| `nutrition` | Nutrient values per 100g for each ingredient × country (`US`, `UK`, `EU`, `AU`) |
| `recipes` | Blend ratios (beef/fable/water) per format × recipe × country (`US`, `UK`, `EU`, `AU`) |
| `co2_kg_e` | CO₂e per kg for shiitake and beef (shared across countries) |
| `scoring_config` | Scoring weights and algorithm parameters (shared across countries) |

All country columns use 2-letter codes (`US`, `UK`, `AU`, `EU`) matching `COUNTRY_CONFIG[*].code` in `country.js`.

---

## Countries

| Code | Country | Currency | Price unit | Front-of-pack label |
|---|---|---|---|---|
| `US` | United States | $ | per lb | None (USDA FSIS nutrition facts, per 112g serving toggle) |
| `UK` | United Kingdom | £ | per kg | FSA Traffic Light (per 100g) |
| `AU` | Australia | $ | per kg | Health Star Rating (0.5–5.0 ★, FSANZ) |
| `EU` | Europe | € | per kg | Nutri-Score (A–E) |

---

## Health Claims

Claim thresholds are defined per-country in `js/country.js` inside `COUNTRY_CONFIG`. The output page and validator both use these to display **High in Fibre/Fiber** and **High in Protein** badges, with **Source of** fallback badges when the high-in threshold isn't reached.

| Country | High in Fibre | Source of Fibre | High in Protein | Source of Protein |
|---|---|---|---|---|
| US | ≥5g/100g (or ≥5.6g/serving) | ≥2.5g/100g | ≥10g/100g (or ≥10g/serving) | ≥5g/100g |
| UK | ≥6g/100g | ≥3g/100g | ≥20% energy from protein | ≥10% energy |
| AU | ≥7g/100g | ≥4g/100g | ≥10g/100g | ≥5g/100g |
| EU | ≥6g/100g | ≥3g/100g | ≥20% energy from protein | ≥10% energy |

---

## Scoring

See [`SCORING_RULES.md`](SCORING_RULES.md) for a full walkthrough of the candidate pool, normalisation, nutrition composite, priority weights, and balance-specific adjustments.

All scoring weights are live-editable in the Supabase `scoring_config` table — no deploy needed.
