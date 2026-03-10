# Fable Brand Style Guide
> For AI-assisted webapp implementation. All values are production-verified from the live Fable Calculator app.

---

## Typography

### Typeface
**Zapf Humanist** — custom brand serif, embedded as base64 in `fonts.css` (weights 400 and 700).
Always declare with the following fallback stack:

```css
font-family: 'Zapf Humanist', Georgia, serif;
```

To use the font, include `fonts.css` before any other stylesheet:
```html
<link rel="stylesheet" href="fonts.css">
```

The file contains two `@font-face` declarations:
- `font-weight: 400` — body / regular
- `font-weight: 700` — headings / bold

**Exception:** UK Traffic Light food labels use `Arial, Helvetica, sans-serif` to match the FSA standard.

### Type Scale

| Role | Size | Weight | Notes |
|---|---|---|---|
| Page H1 | `28px` | 700 | `letter-spacing: -0.01em` |
| Hero title | `clamp(30px, 5vw, 52px)` | 700 | `line-height: 1.15` |
| Hero subtitle | `20px` | 400 | color `#cfff8e` on dark bg |
| Slide question | `clamp(22px, 3.5vw, 34px)` | 700 | `line-height: 1.3` |
| Key stat value | `28px` | 700 | |
| Option card title | `17px` | 700 | |
| Body / labels | `15–16px` | 400 | `line-height: 1.5–1.6` |
| Small / meta | `13–14px` | 400 | |
| Eyebrow / caps | `11px` | 700 | `letter-spacing: 0.2em; text-transform: uppercase` |

---

## Colour Palette

### CSS Custom Properties
Declare these in `:root` — all other values should reference these tokens.

```css
:root {
  /* Brand colours */
  --fable-dark:    #332f21;   /* dark brown/black */
  --fable-hero:    #2e4214;   /* hero dark green */
  --fable-lime:    #cfff8e;   /* lime/sage — primary accent */
  --fable-olive:   #5e590f;   /* olive */
  --fable-sage:    #5e7462;   /* muted sage green */
  --fable-bright:  #03d63d;   /* bright green (secondary) */
  --fable-lavender:#ab9ed9;   /* lavender (secondary) */

  /* UI role aliases */
  --forest:  #2e4214;   /* primary dark — backgrounds, headings, borders */
  --moss:    #5e590f;   /* olive — bubble backgrounds */
  --fern:    #5e7462;   /* mid sage — secondary text */
  --sage:    #cfff8e;   /* lime — highlights, badges, active states */
  --mist:    #e8f3d4;   /* very light green — hover tints */
  --cream:   #f4f2eb;   /* warm off-white — page background */
  --earth:   #8b6914;   /* warm brown — accent */
  --rust:    #5e590f;   /* rust/olive — secondary accent */
  --white:   #ffffff;
  --ink:     #332f21;   /* body text */
  --mid:     #5e7462;   /* secondary text */

  /* Additional utility */
  --border:  #d6e4c8;   /* default border colour */
  --sub:     #5a6b47;   /* subtext / captions */
}
```

### Colour Usage Rules

| Context | Value |
|---|---|
| Page background | `var(--cream)` `#f4f2eb` |
| Hero / dark section bg | `var(--forest)` `#2e4214` |
| Primary text | `var(--ink)` `#332f21` |
| Secondary / subtext | `#5a6b47` |
| Primary button bg | `var(--fable-lime)` `#cfff8e` |
| Primary button text | `var(--fable-hero)` `#2e4214` |
| Ghost button | `rgba(207,255,142,0.06)` bg / `rgba(250,250,250,0.8)` text |
| Borders (default) | `var(--border)` `#d6e4c8` |
| Borders (subtle) | `rgba(46,66,20,0.1)` |
| Selected / active tint | `#edf4e4` |
| Key stats bar bg | `#cfff8e` |
| Amber diff badge bg | `#fff3cd` |
| Amber diff badge text | `#92400e` |
| Amber diff badge border | `#fcd34d` |

---

## Buttons

### Primary (pill) — used on hero / dark backgrounds
```css
padding: 14px 40px;
border-radius: 100px;
background: var(--fable-lime);   /* #cfff8e */
color: var(--fable-hero);        /* #2e4214 */
font-family: 'Zapf Humanist', Georgia, serif;
font-size: 15px;
font-weight: 700;
border: none;
letter-spacing: 0.03em;
transition: all 0.25s;
```
**Hover:** `background: var(--fable-hero); color: var(--fable-lime); transform: scale(1.02); box-shadow: 0 4px 20px rgba(46,66,20,0.15);`
**Disabled:** `opacity: 0.3; cursor: not-allowed;`

### Primary — dark (used on light backgrounds)
```css
background: var(--forest);
color: var(--lime);
border-radius: 100px;
padding: 10px 28px;
font-size: 14px;
font-weight: 700;
```
**Hover:** `background: #3d5a1c;`

### Ghost (outlined pill)
```css
background: transparent;
color: var(--forest);
border: 1.5px solid var(--border);
border-radius: 100px;
padding: 8px 18px;
font-size: 14px;
font-weight: 600;
```
**Hover:** `background: var(--mist); border-color: var(--forest);`

### Back (circular icon button)
```css
width: 44px; height: 44px;
border-radius: 50%;
border: 1.5px solid rgba(46,66,20,0.2);
background: transparent;
color: rgba(46,66,20,0.45);
font-size: 18px;
```
**Hover:** `border-color: var(--forest); color: var(--forest);`

### Floating Action Button (FAB)
```css
position: fixed; bottom: 28px; right: 28px;
padding: 12px 20px;
background: var(--fable-hero);
color: #fff;
border-radius: 100px;
box-shadow: 0 4px 20px rgba(46,66,20,0.35);
font-size: 15px; font-weight: 700;
```
**Hover:** `background: var(--fable-lime); color: var(--fable-hero); transform: translateY(-2px);`

---

## Cards & Containers

### Option Card (quiz)
```css
background: rgba(46,66,20,0.04);
border: 1.5px solid rgba(46,66,20,0.1);
border-radius: 16px 16px 12px 16px;   /* subtle organic asymmetry */
padding: 22px 24px;
transition: all 0.25s ease;
```
**Hover:** `background: rgba(46,66,20,0.07); border-color: rgba(46,66,20,0.22); transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.07);`
**Selected:** `background: #edf4e4; border-color: var(--forest); box-shadow: 0 0 0 1px rgba(46,66,20,0.15), 0 6px 24px rgba(0,0,0,0.07);`

### List Item (rank / check)
```css
background: rgba(46,66,20,0.04);
border: 1.5px solid rgba(46,66,20,0.1);
border-radius: 14px;
padding: 16px 20px;
```

### Controls / Panel card
```css
background: #fff;
border: 1px solid var(--border);
border-radius: 12px;
padding: 16px 20px;
```

### Key Stats Bar
```css
display: flex;
background: #cfff8e;
border: 1px solid rgba(46,66,20,0.15);
border-radius: 16px;
overflow: hidden;
/* Each cell: border-right: 1px solid rgba(46,66,20,0.15); */
```

---

## Badges & Chips

### Stat badge (on lime bg — inverted)
```css
background: var(--forest);   /* #2e4214 */
color: var(--sage);          /* #cfff8e */
font-size: 14px; font-weight: 700;
letter-spacing: 0.1em;
padding: 3px 10px;
border-radius: 100px;
text-transform: uppercase;
```

### Source badge (outlined)
```css
background: transparent;
border: 1.5px solid rgba(46,66,20,0.4);
color: var(--forest);
font-weight: 600;
```

### Delta-worse badge (amber)
```css
background: #fff3cd;
color: #92400e;
border: 1px solid #fcd34d;
border-radius: 4px;
padding: 2px 6px;
font-size: 11px; font-weight: 700;
```

### Check / radio indicator
```css
width: 22px; height: 22px;
border-radius: 50%;          /* circular for radio */
border-radius: 6px;          /* square for checkbox */
border: 2px solid rgba(46,66,20,0.18);
/* Selected: */
background: var(--fable-lime);
border-color: var(--fable-lime);
/* Checkmark: content: '\2713'; color: var(--forest); font-size: 12px; font-weight: 700; */
```

### Rank number pill
```css
width: 32px; height: 32px;
border-radius: 50%;
background: var(--fable-hero);
color: var(--fable-lime);
font-size: 14px; font-weight: 700;
```

---

## Organic Shapes (Brand "Bubbles")

A signature element of the Fable brand — rounded organic blobs used for recipe composition display.

```css
/* Base bubble */
border-radius: 50% 50% 42% 58% / 55% 45% 55% 45%;
transition: transform 0.3s ease;

/* Hover */
transform: scale(1.05);

/* Sizes */
.bubble-lg  { width: 145px; height: 145px; background: var(--fable-olive); }
.bubble-md  { width: 115px; height: 115px; background: var(--fable-sage); }
.bubble-sm  { width: 82px;  height: 82px;  background: rgba(207,255,142,0.1); }

/* Text inside bubble */
.bubble-pct   { font-size: 30px; font-weight: 700; color: #fff; line-height: 1; }
.bubble-label { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.75); }
```

Decorative background shapes use this pattern:
```css
border-radius: 40% 60% 50% 50% / 50% 50% 60% 40%;
background: rgba(207,255,142,0.03);
```

---

## Form Controls

### Select / Dropdown
```css
background: #fff;
color: var(--text);
border: 1px solid var(--border);
border-radius: 8px;
padding: 7px 12px;
font-size: 14px;
font-family: 'Zapf Humanist', Georgia, serif;
/* Focus: border-color: var(--forest); outline: none; */
```

### Editable number input (inline in tables)
```css
width: 60–70px;
border: 1px solid #b8ccaa;
border-radius: 6px;
background: #fff;
font: inherit;
text-align: right; /* or center for bubble variant */
padding: 3px 6px;
-moz-appearance: textfield;
/* Hide spinners: input[type=number]::-webkit-inner-spin-button { display: none; } */
```

---

## Progress Bar
```css
height: 3px;
background: rgba(46,66,20,0.12);   /* track */
border-radius: 2px;

/* Fill */
background: var(--forest);
border-radius: 2px;
transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Animations & Transitions

### Slide-in (quiz transitions)
```css
@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
animation: slideUp 0.45s cubic-bezier(0.4, 0, 0.2, 1) both;
```

### Standard transition
```css
transition: all 0.2s;          /* fast — hover states */
transition: all 0.25s ease;    /* medium — cards */
transition: all 0.3s ease;     /* slow — bubbles */
```

### Hero decorative gradient
```css
background: radial-gradient(ellipse 60% 80% at 50% 120%, rgba(207,255,142,0.06), transparent 60%);
```

---

## Layout & Spacing

| Token | Value |
|---|---|
| Page max-width | `1200px` |
| Page padding | `40px 24px` |
| Section padding (hero) | `60px 40px 80px` |
| Card gap | `12px` |
| Section gap | `24–48px` |
| Border radius — pill | `100px` |
| Border radius — card | `14–16px` |
| Border radius — chip | `8px` |
| Border radius — small | `6px` |

### Responsive breakpoints
```css
@media (max-width: 900px) { /* 2-col → stacked */ }
@media (max-width: 640px) { /* single column */ }
@media (max-width: 480px) { /* mobile adjustments */ }
```

---

## Background Patterns

### Page background
```css
background: var(--cream);   /* #f4f2eb */
```

### Quiz shell — subtle green radial vignette
```css
background:
  radial-gradient(ellipse 80% 60% at 50% 0%, rgba(46,66,20,0.04) 0%, transparent 60%),
  radial-gradient(ellipse 40% 40% at 90% 80%, rgba(46,66,20,0.03) 0%, transparent 50%);
```

### Hero section
```css
background: var(--forest);   /* #2e4214 */
/* + decorative radial overlay + organic blob pseudo-elements */
```

---

## Image & Icon Assets

All assets live in the `images/` directory. Use relative paths from HTML root.

### Logos
| File | Usage |
|---|---|
| `images/FAB_logo_white.png` | White Fable logo — use on dark/hero backgrounds |
| `images/FAB_hand_white.png` | Fable hand icon — white variant |
| `images/FAB Fable logo.png` | Full colour Fable logo |
| `images/Mushroom Hand_GREEN.png` | Green mushroom hand — decorative |

### Hero sticker
```css
/* Top-right corner of hero sections */
position: absolute; top: 20px; right: 24px;
width: 130px; height: 130px;
object-fit: contain;
opacity: 0.92;
```

### Questionnaire / UI icons
Located in `images/Infusion Tool Icons/`. All are PNG, sized at 48×48px in the UI.

| File | Concept |
|---|---|
| `Balance.png` | Balance / equilibrium |
| `Beef Processor.png` | Beef processor |
| `Beef Trim.png` | Beef trim |
| `Burger.png` | Burger format |
| `Cost Control.png` | Cost saving |
| `Food Manufacturer.png` | Food manufacturer |
| `Foodservice Restaurant.png` | Foodservice / restaurant |
| `Grocer Retailer.png` | Grocery / retail |
| `Ground Mince Beef.png` | Ground / mince beef format |
| `Nutrition.png` | Better nutrition |
| `Sustainability.png` | Sustainability |

Usage:
```html
<img src="images/Infusion%20Tool%20Icons/Nutrition.png"
     alt="Better Nutrition"
     style="width:48px;height:48px;object-fit:contain;">
```

### Banner
`images/banner.jpg` — hero/page banner image.

---

## Shadows

```css
/* Card hover */
box-shadow: 0 6px 24px rgba(0,0,0,0.07);

/* Selected card */
box-shadow: 0 0 0 1px rgba(46,66,20,0.15), 0 6px 24px rgba(0,0,0,0.07);

/* FAB button */
box-shadow: 0 4px 20px rgba(46,66,20,0.35);

/* Button hover */
box-shadow: 0 4px 20px rgba(46,66,20,0.15);

/* FAB hover */
box-shadow: 0 8px 28px rgba(46,66,20,0.4);
```

---

## Eyebrow / Label Pattern

Used above headings and section titles:
```css
font-size: 11px;
font-weight: 700;
letter-spacing: 0.2em;
text-transform: uppercase;
color: #5a6b47;   /* on light bg */
color: var(--fable-sage);  /* on dark bg */
opacity: 0.85;
margin-bottom: 14px;
```

---

## Print / PDF Export

For pages that support Save as PDF:
```css
@media print {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  /* Hide interactive controls, show print-only summary div */
}
```

---

## Quick Reference Cheatsheet

```
FONTS
  Primary:   'Zapf Humanist', Georgia, serif  (400, 700)
  Labels:    Arial, Helvetica, sans-serif

COLOURS
  Background:     #f4f2eb   (--cream)
  Hero bg:        #2e4214   (--forest / --fable-hero)
  Primary accent: #cfff8e   (--sage / --fable-lime)
  Body text:      #332f21   (--ink / --fable-dark)
  Subtext:        #5a6b47
  Muted green:    #5e7462   (--fern / --fable-sage)
  Olive:          #5e590f   (--moss / --fable-olive)
  Border:         #d6e4c8

BORDER RADIUS
  Pill buttons:   100px
  Cards:          16px
  List items:     14px
  Inputs:         6–8px
  Organic blobs:  50% 50% 42% 58% / 55% 45% 55% 45%

TRANSITIONS
  Fast:    all 0.2s
  Medium:  all 0.25s ease
  Slow:    all 0.3s ease

FONT SIZES
  H1:      28px (700)
  Hero:    clamp(30px, 5vw, 52px) (700)
  Body:    15–16px (400)
  Small:   13–14px
  Eyebrow: 11px (700, uppercase, ls 0.2em)
```
