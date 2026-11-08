# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Diners & Guests**: Local patrons and international visitors in Bangkok, Thailand seeking authentic Indian and Thai culinary specialties, browsing the menu on mobile or desktop, discovering chef specials, and contacting the restaurant via WhatsApp or LINE.
- **Restaurant Management & Staff**: Kitchen and operations staff managing the live menu, dishes, pricing, spice levels, categories, gallery images, opening hours, and contact channels in real time.

## Product Purpose

Namaste Siam Indian Kitchen provides a digital dining portal and interactive menu that honors culinary heritage while giving diners a fast, beautiful, and transparent way to explore dishes, dietary options, and restaurant details. It connects directly to Supabase for dynamic menu management, real-time sync, and image storage, deployed seamlessly via Vercel.

## Positioning

Unlike generic restaurant landing pages or static PDF menus, Namaste Siam offers a tailored, warm-paper culinary experience celebrating authentic Indian cuisine and Thai signatures. It features live real-time menu search, ingredient breakdowns, spice-level indications, chef recommendations, customer favorites, and zero-friction reservations via direct chat (WhatsApp and LINE).

## Operating Context

- **Guest Surface**: High mobile traffic (~70%+) from social media (Instagram, LINE, Google Maps) as well as desktop visitors planning reservations or dining out.
- **Admin Surface**: Authenticated web portal (`/unlock-admin?k=...`) allowing staff to update prices, toggle availability, edit descriptions, adjust sort order, and upload dishes and gallery media directly into Supabase Storage.
- **Deployment**: Static single-page application (SPA) built with Vite and React 19, hosted on Vercel with HTTPS, client-side routing, and real-time Supabase PostgreSQL backend.

## Capabilities and Constraints

- **Live Database Integration**: Reads and writes to Supabase PostgreSQL (`foods`, `categories`, `restaurant_info`, `about_info`, `gallery`, `chat_settings`).
- **Real-time Synchronization**: Supabase realtime subscriptions (`postgres_changes`) keep menus instantly synchronized across all active devices without page reload.
- **Resilient Fallback**: Graceful handling when offline or unconfigured, preventing crashes and displaying friendly status states.
- **Direct Reservations**: Instant click-to-chat deep links to WhatsApp (`https://wa.me/...`) and LINE (`https://line.me/R/ti/p/...`).
- **No Heavy External Framework Migration**: Must retain Vite + React 19 + TypeScript + Tailwind CSS architecture.

## Brand Commitments

- **Brand Name**: Namaste Siam Indian Kitchen
- **Aesthetic Direction**: Warm paper, tandoor and spice-inspired palette (Wine, Amber, Milk, Paper, Ink, Sand).
- **Typography**: Elegant editorial serif for titles and clean sans-serif for body typography.
- **Authenticity**: Genuine culinary photography and genuine dish descriptions; zero generic AI-generated stock templates.
- **Motion**: Restrained ambient embers and subtle interactive micro-transitions respecting `prefers-reduced-motion`.

## Evidence on Hand

- **Live Website**: `https://namastesiamindiankitchen.vercel.app/`
- **Database Architecture**: `supabase_schema.sql` (defining all tables, RLS policies, triggers, and seed records).
- **Storage Architecture**: `SUPABASE_STORAGE.md` (defining `food-images`, `gallery`, `hero`, `restaurant`, `specials` buckets).
- **Target Git Identity**: `nsik1204` / `namastesiamindiankitchen@gmail.com`.

## Product Principles

1. **Brand Authenticity Over Generic Trends**: Every element reflects the warm, hospitable soul of Indian and Thai dining, rejecting typical corporate SaaS aesthetics.
2. **Speed & Scannability**: Guests should find dish details, dietary suitability (Veg/Non-Veg), spice levels, and pricing within seconds.
3. **Data Integrity & Live Truth**: Supabase is the single source of truth; no hardcoded stale content should disguise database disconnects.
4. **Accessible & Responsive by Default**: Flawless touch-friendly experience on small mobile screens through large desktop displays.

## Accessibility & Inclusion

- Explicit dietary distinction (Veg vs Non-Veg badge indicators and filters).
- Clear spice-level indicators (🌶 Mild, 🌶🌶 Medium, 🌶🌶🌶 Hot).
- Transparent food allergen and dietary advisory disclosures.
- Keyboard navigability (Escape to dismiss modals, Enter/Space to select dishes).
- High-contrast text readability on warm surfaces meeting WCAG 2.1 AA standards.

