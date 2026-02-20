# Fable Shiitake Infusion Calculator — Scoring Rules

This document describes how the calculator recommends a recipe and beef trim for each priority. All scoring parameters are live-editable in the Supabase `scoring_config` table — no code deploy required.

---

## 1. Candidate Pool

For each user session the engine builds a pool of every valid recipe × trim combination before scoring begins.

### Beef trim ceiling (leanest allowed)

The user's Q1 selection (e.g. 85CL) is the **ceiling** — the engine will never recommend a leaner grade than what they specified.

### Beef trim floor (fattiest allowed)

For each recipe the engine scans from the fattiest trim (60CL) toward the leanest, and takes the **first trim whose blended fat percentage is at or below the user's target fat**. That trim is the floor — the fattiest grade that still meets the fat specification for that recipe.

Example — user selects 85CL (15% fat), recipe is 70/30:
- 75CL blend → 18.3% fat — above target, skip
- 80CL blend → 14.8% fat — at or below target ✓ → **floor = 80CL**
- Eligible range: 80CL and 85CL only

Every trim from floor to ceiling (inclusive) is a candidate for that recipe.

### Format constraints

- **Burger / Meatball**: rehydrated recipes (water_pct > 0) are excluded entirely — only dry recipes are candidates.
- **Ground Beef (unformed)**: both dry and rehydrated recipes are eligible.

### Hard constraints (optional, user-toggleable)

If enabled, candidates that fail these are dropped before scoring:

| Constraint | Threshold |
|---|---|
| Must have fiber | Blended dietary fiber ≥ 5g per 100g |
| Must have protein | Blended protein ≥ 10g per 100g |

If applying constraints produces an empty pool, the engine falls back to the unconstrained pool.

---

## 2. Normalisation

Each raw dimension is normalised to a 0–1 scale across all candidates in the pool.

### Standard normalise (nutrition dimensions)

Maps `[min, max]` → `[0, 1]` linearly. Higher-is-better dimensions are mapped ascending; lower-is-better are inverted.

### Padded normalise (cost and CO2)

Extends the range by `pad × spread` on each side before mapping, so real price/CO2 differences occupy the middle of the scale rather than snapping to 0 and 1. This prevents tiny price spreads from creating misleadingly extreme scores.

| Dimension | Pad value (`scoring_config` key) |
|---|---|
| Cost ($/lb) | `cost_pad` = 1.0 |
| CO2 (kg CO2e/kg) | `co2_pad` = 1.0 |

---

## 3. Nutrition Composite

The four nutrition dimensions are combined into a single score:

```
nutritionRaw = (nutr_w_fiber    × nFiber)
             + (nutr_w_protein  × nProtein)
             + (nutr_w_calories × nCals)
             + (nutr_w_satfat   × nSatFat)

nutritionScore = √nutritionRaw   ← diminishing returns
```

Fiber and calories/satfat favour Fable (high fiber, low calories); protein favours beef (beef has ~22g/100g vs Fable's ~2g/100g).

| Component | Direction | Weight (`scoring_config` key) | Value |
|---|---|---|---|
| Dietary Fiber | higher = better | `nutr_w_fiber` | 0.35 |
| Protein | higher = better | `nutr_w_protein` | 0.35 |
| Calories | lower = better | `nutr_w_calories` | 0.20 |
| Saturated Fat | lower = better | `nutr_w_satfat` | 0.10 |

The nutrition composite is re-normalised 0–1 after the sqrt transform before being used in priority scoring.

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
| Balance | 0.50 | 0.50 | 0.00 |
| Sustainability | 0.15 | 0.10 | 1.00 |

**Lower Cost** uses pure cost only (n=0, s=0) — it always picks the cheapest blend within the eligible trim range, with no nutrition or sustainability influence.

**Balance** excludes sustainability entirely (s=0) — it trades off nutrition vs cost equally.

---

## 5. Balance-Only Adjustments

Two additional mechanics apply **only when priority = balance**. They have zero effect on cost, nutrition, or sustainability priorities.

### Trim penalty

Penalises candidates that use a fattier beef grade than the user's selected trim, encouraging the engine to prefer the user's chosen grade over cheaper but fattier alternatives.

```
penalisedScore = rawScore × (1 − trim_penalty × stepsLeaner)
```

Where `stepsLeaner` = number of CL steps below the user's trim (each step = 5CL).

| Config key | Value |
|---|---|
| `trim_penalty` | 0.05 per step |

Example: a candidate using 75CL when the user selected 85CL gets 2 steps → score multiplied by `1 − 0.05×2 = 0.90`.

### Balance Recipe Bonus (BRB)

A gaussian bonus centred on 40% Fable (the 60/40 recipe) to reward moderate blending as the "balanced" choice, rather than maximising Fable for nutrition or minimising it for cost.

```
bonus = brb × exp( −((fablePct + waterPct − 0.40)² / (2 × 0.10²)) )
```

`fablePct + waterPct` is used so rehydrated recipes are evaluated on their intended blend ratio (e.g. "60/40 rehydrated" stores fable_pct=0.35 + water_pct=0.05 = 0.40 combined).

| Config key | Value | Notes |
|---|---|---|
| `balance_recipe_bonus` | 0.12 | Peak bonus at exactly 40% Fable |
| Gaussian sigma | 0.10 | ~68% of peak at 30% or 50% Fable |

The final balance score is: `penalisedScore + bonus`

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
| `balance_n` | 0.50 | Nutrition weight for balance priority |
| `balance_c` | 0.50 | Cost weight for balance priority |
| `balance_s` | 0.00 | Sustainability weight for balance priority |
| `sustainability_n` | 0.15 | Nutrition weight for sustainability priority |
| `sustainability_c` | 0.10 | Cost weight for sustainability priority |
| `sustainability_s` | 1.00 | Sustainability weight for sustainability priority |
| `nutr_w_fiber` | 0.35 | Fiber weight in nutrition composite |
| `nutr_w_protein` | 0.35 | Protein weight in nutrition composite |
| `nutr_w_calories` | 0.20 | Calories weight in nutrition composite |
| `nutr_w_satfat` | 0.10 | Saturated fat weight in nutrition composite |
| `cost_pad` | 1.0 | Padding multiplier for cost normalisation |
| `co2_pad` | 1.0 | Padding multiplier for CO2 normalisation |
| `trim_penalty` | 0.05 | Per-step penalty for balance priority (balance only) |
| `balance_recipe_bonus` | 0.12 | Peak gaussian bonus for 60/40 recipe (balance only) |

---

## 7. Beef Prices ($/lb)

Prices stored in the Supabase `beef_prices` table, editable there.

| Grade | Fat % | Price ($/lb) |
|---|---|---|
| 60CL | 40% | $1.60 |
| 65CL | 35% | $1.91 |
| 70CL | 30% | $2.49 |
| 75CL | 25% | $2.85 |
| 80CL | 20% | $3.22 |
| 85CL | 15% | $3.57 |
| 90CL | 10% | $3.95 |

Fable Shiitake Infusion price: **$4.98/lb** (hardcoded in app).
