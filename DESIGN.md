---
name: "Namaste Siam Indian Kitchen"
description: "Warm-paper tandoor palette and culinary editorial design system"
colors:
  primary: "#a90e02"
  primary-deep: "#3d1f00"
  accent-amber: "#e08a2b"
  accent-amber-hi: "#f6c464"
  neutral-milk: "#fdf8f1"
  neutral-paper: "#fffdf9"
  neutral-ink: "#2b1a0e"
  neutral-muted: "#8c7358"
  border-line: "rgba(122, 74, 34, 0.16)"
  status-veg: "#166534"
  status-veg-bg: "rgba(22, 101, 52, 0.1)"
  status-nonveg: "#9b1c1c"
  status-nonveg-bg: "rgba(155, 28, 28, 0.1)"
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
    textColor: "{colors.neutral-milk}"
    rounded: "{rounded.full}"
    padding: "12px 22px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-pill:
    backgroundColor: "{colors.neutral-paper}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "9px 17px"
  badge:
    backgroundColor: "rgba(224, 138, 43, 0.12)"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "7px 13px"
  card:
    backgroundColor: "{colors.neutral-paper}"
    rounded: "{rounded.xl}"
    padding: "18px"
---

# Design System

## 1. Overview

Namaste Siam Indian Kitchen's visual identity captures the sensory richness of traditional Indian and Thai cooking in a refined, contemporary dining aesthetic. Drawing inspiration from tandoor embers, warm clay pottery, natural linen, and fragrant spices, the design creates a welcoming, premium culinary atmosphere. It avoids cold tech tropes (generic blue gradients, oversized SaaS cards, unnecessary glassmorphism) in favor of warmth, clarity, tactile paper tones, and authentic hospitality.

## 2. Colors

The palette is rooted in culinary materials:
- **Primary Wine (`#A90E02`)**: Saffron-chili red used for prominent accents, brand highlights, interactive anchors, and pricing.
- **Deep Wine (`#3D1F00`)**: Roasted earthenware tone anchoring footers, high-contrast borders, and deep backgrounds.
- **Amber & Amber High (`#E08A2B`, `#F6C464`)**: Tandoor ember glow used for section eyebrow tags, active states, ratings, and ambient particle gradients.
- **Warm Milk (`#FDF8F1`)**: Soft linen background color providing an inviting, low-fatigue reading canvas.
- **Parchment Paper (`#FFFDF9`)**: Pure card and modal surface providing crisp contrast against the warm milk page backdrop.
- **Ink (`#2B1A0E`)**: Roasted coffee-black for headings and primary text with softer optical contrast than harsh `#000000`.
- **Muted Husk (`#8C7358`)**: Earthy secondary text color for dish descriptions, metadata, and allergen notes.
- **Line & Border (`rgba(122, 74, 34, 0.16)`)**: Warm sepia border defining card edges without visual heaviness.
- **Dietary Indicators**:
  - Vegetarian: `#166534` on `rgba(22, 101, 52, 0.1)`
  - Non-Vegetarian: `#9B1C1C` on `rgba(155, 28, 28, 0.1)`

## 3. Typography

- **Display & Headings**: Fraunces / Georgia editorial serif. Gives dish names, section titles, and brand headers warmth, prestige, and timeless culinary craft.
- **Body & Controls**: DM Sans / Instrument Sans. Clean, legible geometric sans-serif ensuring effortless scannability of ingredients, descriptions, prices, and dietary tags.
- **Eyebrows & Labels**: 10px–11px, uppercase with `0.16em–0.2em` letter-spacing, rendered in Amber or Wine to establish clear visual hierarchy.

## 4. Layout

- **Container Constraint**: `max-width: 1180px` centered with responsive horizontal gutters (`16px` on mobile, `20px` on desktop).
- **Section Rhythm**: Sections are separated by `52px` vertical padding with consistent `SectionTitle` pairings (Lead word + Wine accent word).
- **Responsive Grids**:
  - Dish grids use `repeat(auto-fill, minmax(260px, 1fr))` with `18px` gap, collapsing smoothly to single-column on mobile viewports (<640px).
  - Gallery uses an auto-fill grid with `180px` row height and tall spans for dynamic masonry-style cadence.
  - Restaurant info cards use an auto-fit grid adapting seamlessly between 1 and 3 columns.

## 5. Elevation & Depth

- **Flat/Tonal Layering First**: Elevation is primarily achieved through contrasting surface tones (Milk background `#FDF8F1` under Paper cards `#FFFDF9`).
- **Warm Shadows**:
  - Rest state: `0 10px 30px rgba(61, 31, 0, 0.08)`
  - Hover state: `0 18px 36px rgba(61, 31, 0, 0.15)` with `translateY(-3px to -5px)`
  - Modal overlay: `0 28px 70px rgba(43, 26, 14, 0.35)` over a `rgba(43, 26, 14, 0.55)` backdrop
- **Focus Rings**: `0 0 0 3px rgba(224, 138, 43, 0.35)` for full keyboard accessibility without harsh browser outlines.

## 6. Shapes

- **Card Corners**: `20px` to `22px` border radius (`rounded-xl` to `rounded-2xl`), giving dishes and content blocks soft, approachable contours.
- **Buttons & Badges**: Fully pill-shaped (`border-radius: 9999px`) for high tactile affordance on touchscreens.
- **Inputs**: `12px` rounded inputs or full-pill search bars with generous internal touch padding (`12px–14px`).

## 7. Components

- **DishCard**: Contains food photography (16:9 aspect ratio, object-fit cover), title, price in THB (฿), description snippet, Veg/Non-Veg badge, Chef Special / Bestseller ribbons, and spice-level rating.
- **Category Filter Pills**: Horizontally scrollable or wrapping pills allowing one-touch category filtering with immediate feedback.
- **Search Bar**: Live interactive input with instant filtering across dish titles, descriptions, and ingredients.
- **Today's Special Hero Card**: Featured visual anchor highlighting chef specials with elevated photography and pricing.
- **Interactive Dish Modal**: High-res detail view with full ingredient lists, dietary attributes, and allergen considerations.

## 8. Do's and Don'ts

### Do
- Always preserve the warm milk (`#FDF8F1`) and paper (`#FFFDF9`) palette.
- Keep dishes prominent with authentic, high-quality photography.
- Clearly mark vegetarian dishes with distinctive green indicators.
- Respect user motion preferences (`prefers-reduced-motion`).
- Ensure all interactive elements have at least 44x44px touch targets on mobile.

### Don't
- Do not introduce generic AI corporate SaaS patterns (cold blue glows, neon cyan borders, gradient cards).
- Do not use generic cold white (`#FFFFFF`) backgrounds or sterile pure grey (`#808080`) text.
- Do not add jarring or bouncy animations that distract from the food.
- Do not hide or remove genuine restaurant data, contact channels, or dietary advisories.
- Do not use harsh browser alert boxes or unhandled blank loading screens.

