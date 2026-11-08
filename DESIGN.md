---
name: "Namaste Siam Indian Kitchen"
description: "Heritage Indian Deep Forest Green & Antique Gold design system"
colors:
  primary: "#173d32"
  primary-deep: "#102c25"
  primary-light: "#285747"
  accent-gold: "#d9b66d"
  accent-gold-dark: "#b58c45"
  accent-terracotta: "#9b4935"
  neutral-background: "#f8eedb"
  neutral-surface: "#fff9ef"
  neutral-main: "#30251e"
  neutral-muted: "#75685a"
  border-line: "#e4d7bf"
  status-veg: "#386b4d"
  status-veg-bg: "rgba(56, 107, 77, 0.12)"
  status-nonveg: "#9b4935"
  status-nonveg-bg: "rgba(155, 73, 53, 0.12)"
  status-error: "#a33c32"
  status-error-bg: "#fdf2f0"
typography:
  display:
    fontFamily: "Fraunces, Georgia, 'Times New Roman', serif"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Fraunces, Georgia, 'Times New Roman', serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.15
  title:
    fontFamily: "Fraunces, Georgia, 'Times New Roman', serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.2
  body:
    fontFamily: "'DM Sans', 'Instrument Sans', 'Avenir Next', 'Segoe UI', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "'DM Sans', 'Instrument Sans', sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 800
    letterSpacing: "0.18em"
    textTransform: "uppercase"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "22px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "36px"
  section: "52px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.full}"
    padding: "12px 22px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-pill:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "9px 17px"
  badge:
    backgroundColor: "rgba(217, 182, 109, 0.16)"
    textColor: "{colors.neutral-main}"
    rounded: "{rounded.full}"
    padding: "7px 13px"
  card:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.xl}"
    padding: "18px"
---

# Design System

## 1. Overview

Namaste Siam Indian Kitchen's visual identity captures the sensory richness of traditional Indian and Thai cooking in an authentic, regal Heritage Indian aesthetic (Deep Forest Green & Antique Gold). Drawing inspiration from royal Indian heritage architecture, antique brassware, pure ivory parchment, and fragrant botanicals, the design creates a welcoming, premium culinary atmosphere. It avoids cold tech tropes (generic blue gradients, oversized SaaS cards, unnecessary glassmorphism) in favor of warmth, clarity, tactile paper tones, and authentic hospitality.

## 2. Colors

The palette is rooted in authentic Indian heritage materials:
- **Primary Deep Forest Green (`#173D32`)**: Regal deep green used for header, footers, primary interactive CTA buttons, category controls, and section title accents.
- **Primary Dark Midnight Green (`#102C25`)**: Deep anchoring tone for active hover states and lightbox backdrops.
- **Primary Light Muted Emerald (`#285747`)**: Soft secondary emerald for category hover states and badge borders.
- **Antique Gold (`#D9B66D`)**: Warm, burnished antique brass tone used for active nav indicators, special ribbons, star icons, and CTA trims (3–7% visual distribution). Note: Never used as small text on ivory surfaces.
- **Gold Dark (`#B58C45`)**: Rich bronze-gold for subtle accents and high-contrast gold elements.
- **Warm Sand Background (`#F8EEDB`)**: Soft natural ivory canvas providing 55–65% of the visual field to maintain effortless readability and food photography prominence.
- **Warm Silk Surface (`#FFF9EF`)**: Pristine card, drawer, and modal surface providing crisp contrast against the warm ivory page backdrop.
- **Main Text Charcoal Brown (`#30251E`)**: High-contrast, warm dark brown for headings and primary copy (13.8:1 AAA contrast on Surface).
- **Muted Text Warm Taupe (`#75685A`)**: Refined secondary text color for dish descriptions, metadata, and allergen notes (5.2:1 AA contrast).
- **Linen Border (`#E4D7BF`)**: Soft border defining card edges, input outlines, and dividers without visual heaviness.
- **Dietary Indicators**:
  - Vegetarian: Leaf Green (`#386B4D`) on `rgba(56, 107, 77, 0.12)`
  - Non-Vegetarian: Warm Terracotta (`#9B4935`) on `rgba(155, 73, 53, 0.12)`
- **Feedback & Status**:
  - Open Now / Success: `#386B4D`
  - Closed Now / Error: `#A33C32`

## 3. Typography

- **Display & Headings**: Fraunces / Georgia editorial serif. Gives dish names, section titles, and brand headers warmth, prestige, and timeless culinary craft.
- **Body & Controls**: DM Sans / Instrument Sans. Clean, legible geometric sans-serif ensuring effortless scannability of ingredients, descriptions, prices, and dietary tags.
- **Eyebrows & Labels**: 10px–11px, uppercase with `0.16em–0.2em` letter-spacing, rendered in Antique Gold or Deep Forest Green to establish clear visual hierarchy.

## 4. Layout

- **Container Constraint**: `max-width: 1180px` centered with responsive horizontal gutters (`16px` on mobile, `20px` on desktop).
- **Section Rhythm**: Sections are separated by `52px` vertical padding with consistent `SectionTitle` pairings (Lead word + Deep Forest Green accent word).
- **Responsive Grids**:
  - Dish grids use `repeat(auto-fill, minmax(260px, 1fr))` with `18px` gap, collapsing smoothly to single-column on mobile viewports (<640px).
  - Gallery uses an auto-fill grid with `180px` row height and tall spans for dynamic masonry-style cadence.
  - Restaurant info cards use an auto-fit grid adapting seamlessly between 1 and 3 columns.

## 5. Elevation & Depth

- **Flat/Tonal Layering First**: Elevation is primarily achieved through contrasting surface tones (Warm Sand `#F8EEDB` under Silk Paper `#FFF9EF`).
- **Warm Shadows**:
  - Rest state: `0 10px 30px rgba(48, 37, 30, 0.07)`
  - Hover state: `0 18px 36px rgba(48, 37, 30, 0.12)` with `translateY(-3px to -5px)`
  - Modal overlay: `0 28px 70px rgba(16, 44, 37, 0.45)` over a `rgba(16, 44, 37, 0.65)` backdrop
- **Focus Rings**: `0 0 0 3px rgba(217, 182, 109, 0.45)` for full keyboard accessibility without harsh browser outlines.

## 6. Shapes

- **Card Corners**: `20px` to `22px` border radius (`rounded-xl` to `rounded-2xl`), giving dishes and content blocks soft, approachable contours.
- **Buttons & Badges**: Fully pill-shaped (`border-radius: 9999px`) for high tactile affordance on touchscreens.
- **Inputs**: `12px` rounded inputs or full-pill search bars with generous internal touch padding (`12px–14px`).

## 7. Components

- **DishCard**: Contains food photography (16:9 aspect ratio, object-fit cover), title in Fraunces serif, price in THB (฿) in Deep Green `#173D32`, description snippet in Muted Taupe `#75685A`, Veg/Non-Veg badge, Chef Special / Bestseller ribbons in Antique Gold `#D9B66D`, and spice-level rating.
- **Category Filter Pills**: Horizontally scrollable or wrapping pills. Active: Deep Forest Green `#173D32` with Ivory `#FFF9EF` text; Inactive: Silk `#FFF9EF` with `#E4D7BF` border.
- **Search Bar**: Live interactive input on Silk `#FFF9EF` with Border `#E4D7BF` and Deep Forest Green focus outline.
- **Today's Special Hero Card**: Featured visual anchor highlighting chef specials with elevated photography and pricing.
- **Interactive Dish Modal**: High-res detail view with full ingredient lists, dietary attributes, and allergen considerations.

## 8. Do's and Don'ts

### Do
- Always preserve the warm ivory (`#F8EEDB`) and silk surface (`#FFF9EF`) palette.
- Keep dishes prominent with authentic, high-quality photography.
- Clearly mark vegetarian dishes with distinctive green indicators (`#386B4D`).
- Respect user motion preferences (`prefers-reduced-motion`).
- Ensure all interactive elements have at least 44x44px touch targets on mobile.

### Don't
- Do not introduce generic AI corporate SaaS patterns (cold blue glows, neon cyan borders, gradient cards).
- Do not use generic cold white (`#FFFFFF`) backgrounds or sterile pure grey (`#808080`) text.
- Do not turn the entire page dark; keep 55-65% ivory and light surfaces.
- Do not use Antique Gold for small text on light surfaces where contrast would be insufficient.
- Do not hide or remove genuine restaurant data, contact channels, or dietary advisories.
- Do not use harsh browser alert boxes or unhandled blank loading screens.
