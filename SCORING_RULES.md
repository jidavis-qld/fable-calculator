# Fable Shiitake Infusion Calculator — Scoring Rules

This document describes how the calculator recommends a recipe and beef trim for each priority. All scoring parameters are live-editable in the Supabase `scoring_config` table — no code deploy required.

---

## 1. Candidate Pool

For each user session the engine builds a pool of every valid recipe × trim combination before scoring begins.

### Beef trim ceiling (leanest allowed)

The user's Q1 selection (e.g. 85CL) is the **ceiling** — the engine will never recommend a leaner grade than what they specified.

### Beef trim floor (fattiest allowed)

For each recipe the engine scans from the fattiest trim (60CL) toward the leanest, and takes the **last trim whose blended fat percentage exceeds the user's target fat by more than 2 percentage points**. That trim is the floor — the fattiest grade whose blend still falls within the +2pp tolerance of the target.

Example — user selects 85CL (15% fat target → threshold = 17%):
- 75CL blend → 18.3% fat — above 17% threshold, skip
- 80CL blend → 14.8% fat — at or below 17% threshold ✓ → **floor = 80CL**
- Eligible range: 80CL and 85CL only

The +2pp tolerance allows trims whose blended fat slightly exceeds the target to still be considered, without penalising recipes that land fractionally above due to rounding.

Every trim from floor to ceiling (inclusive) is a candidate for that recipe.

### Format constraints

- **Burger / Meatball**: rehydrated recipes (water_pct > 0) are excluded entirely — only dry recipes are candidates.
- **Ground Beef (unformed)**: dry recipes (water_pct = 0) are excluded entirely — only rehydrated recipes are candidates.

### Hard constraints (optional, user-toggleable)

If enabled, candidates that fail these are dropped before scoring:

| Constraint | US threshold | UK / EU threshold | AU threshold |
|---|---|---|---|
| Must be High in Fiber | ≥5g fiber per 100g | ≥6g fibre per 100g | ≥7g fibre per 100g (FSANZ 1.2.7) |
| Must be High in Protein | ≥10g protein per 100g | ≥20% of energy from protein | ≥10g protein per 100g (FSANZ 1.2.7) |

Thresholds follow the regulatory definition for the active country (`COUNTRY_CONFIG` in `js/country.js`). If applying constraints produces an empty pool, the engine falls back to the unconstrained pool.

---

## 2. Normalisation

Each raw dimension is normalised to a 0–1 scale across all candidates in the pool using plain linear normalisation.

Maps `[min, max]` → `[0, 1]` linearly. Higher-is-better dimensions are mapped ascending; lower-is-better are inverted. This applies to all dimensions: fiber, protein, calories, saturated fat, cost, and CO2.

---

## 3. Nutrition Composite

Each of the four nutrition dimensions is first normalised individually to 0–1 (see Section 2), then combined as a weighted average:

```
nutritionScore = (nutr_w_fiber    × nFiber)
               + (nutr_w_protein  × nProtein)
               + (nutr_w_calories × nCals)
               + (nutr_w_satfat   × nSatFat)
```

Because each component is already on a 0–1 scale, the weighted sum is itself bounded 0–1 and no further normalisation or transform is applied. This ensures no single dimension (e.g. calories, which is numerically larger) can dominate through scale alone.

Fiber and calories/satfat favour Fable (high fiber, low calories); protein favours beef (beef has ~22g/100g vs Fable's ~2g/100g).

| Component | Direction | Weight (`scoring_config` key) | Value |
|---|---|---|---|
| Dietary Fiber | higher = better | `nutr_w_fiber` | 0.35 |
| Protein | higher = better | `nutr_w_protein` | 0.35 |
| Calories | lower = better | `nutr_w_calories` | 0.20 |
| Saturated Fat | lower = better | `nutr_w_satfat` | 0.10 |

---

## 4. Priority Weights

Each priority defines how much weight to give nutrition (n), cost (c), and sustainability/CO2 (s):

```
rawScore = wN × nutritionScore + wC × nCost + wS × nCO2
```

| Priority | wN (`_n`) | wC (`_c`) | wS (`_s`) |
|---|---|---|---|
| Lower Cost | 0.00 | 1.00 | 0.00 |
| Better Nutrition | 1.00 | 0.15 | 0.10 |
| Balance | 0.60 | 0.40 | 0.00 |
| Sustainability | 0.15 | 0.10 | 1.00 |

**Lower Cost** uses pure cost only (n=0, s=0) — it always picks the cheapest blend within the eligible trim range, with no nutrition or sustainability influence.

**Balance** excludes sustainability entirely (s=0) — it trades off nutrition vs cost equally.

---

## 5. Balance-Only Adjustments

One additional mechanic applies **only when priority = balance**. It has zero effect on cost, nutrition, or sustainability priorities.

### Trim penalty

Penalises candidates that use a fattier beef grade than the user's selected trim, encouraging the engine to prefer the user's chosen grade over cheaper but fattier alternatives.

```
finalScore = rawScore × (1 − trim_penalty × stepsLeaner)
```

Where `stepsLeaner` = number of CL steps below the user's trim (each step = 5CL).

| Config key | Value |
|---|---|
| `trim_penalty` | 0.05 per step |

Example: a candidate using 75CL when the user selected 85CL gets 2 steps → score multiplied by `1 − 0.05×2 = 0.90`.

---

## 6. Supabase `scoring_config` Table

All weights are stored as key/value rows and loaded at runtime. Changes take effect immediately on next page load — no code deploy needed.

| Key | Value | Description |
|---|---|---|
| `cost_n` | 0.00 | Nutrition weight for cost priority |
| `cost_c` | 1.00 | Cost weight for cost priority |
| `cost_s` | 0.00 | Sustainability weight for cost priority |
| `nutrition_n` | 1.00 | Nutrition weight for nutrition priority |
| `nutrition_c` | 0.15 | Cost weight for nutrition priority |
| `nutrition_s` | 0.10 | Sustainability weight for nutrition priority |
| `balance_n` | 0.60 | Nutrition weight for balance priority |
| `balance_c` | 0.40 | Cost weight for balance priority |
| `balance_s` | 0.00 | Sustainability weight for balance priority |
| `sustainability_n` | 0.15 | Nutrition weight for sustainability priority |
| `sustainability_c` | 0.10 | Cost weight for sustainability priority |
| `sustainability_s` | 1.00 | Sustainability weight for sustainability priority |
| `nutr_w_fiber` | 0.35 | Fiber weight in nutrition composite |
| `nutr_w_protein` | 0.35 | Protein weight in nutrition composite |
| `nutr_w_calories` | 0.20 | Calories weight in nutrition composite |
| `nutr_w_satfat` | 0.10 | Saturated fat weight in nutrition composite |
| `trim_penalty` | 0.05 | Per-step penalty for balance priority (balance only) |

---

## 7. Beef Prices

Prices stored in the Supabase `beef_prices` table (editable there). Each row has a `country` column (`US`, `UK`, `AU`, `EU`) and a `price_unit` column (`per_lb` or `per_kg`).

### United States ($/lb)

| Grade | Fat % | Price |
|---|---|---|
| 60CL | 40% | $1.60 |
| 65CL | 35% | $1.91 |
| 70CL | 30% | $2.49 |
| 75CL | 25% | $2.85 |
| 80CL | 20% | $3.22 |
| 85CL | 15% | $3.57 |
| 90CL | 10% | $3.95 |

Fable Shiitake Infusion: **$4.98/lb**

### United Kingdom (£/kg)

| Grade | Fat % | Price |
|---|---|---|
| 60CL | 40% | £4.00 |
| 65CL | 35% | £4.50 |
| 70CL | 30% | £5.00 |
| 75CL | 25% | £5.50 |
| 80CL | 20% | £6.00 |
| 85CL | 15% | £6.50 |
| 90CL | 10% | £7.50 |

Fable Shiitake Infusion: **£6.00/kg**

### Australia (AUD/kg)

| Grade | Fat % | Price |
|---|---|---|
| 60CL | 40% | $7.00 |
| 65CL | 35% | $7.50 |
| 70CL | 30% | $8.00 |
| 75CL | 25% | $8.50 |
| 80CL | 20% | $9.00 |
| 85CL | 15% | $9.75 |
| 90CL | 10% | $10.50 |

Fable Shiitake Infusion: **$10.50/kg**

### Europe (€/kg)

| Grade | Fat % | Price |
|---|---|---|
| 60CL | 40% | €4.60 |
| 65CL | 35% | €5.20 |
| 70CL | 30% | €6.00 |
| 75CL | 25% | €6.50 |
| 80CL | 20% | €7.00 |
| 85CL | 15% | €7.50 |
| 90CL | 10% | €8.60 |

Fable Shiitake Infusion: **€6.90/kg**
