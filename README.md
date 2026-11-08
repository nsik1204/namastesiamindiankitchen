# Namaste Siam Indian Kitchen

> Premium contemporary Indian & Thai culinary restaurant portal, interactive menu, and real-time management system.

[![Live Website](https://img.shields.io/badge/Live-namastesiamindiankitchen.vercel.app-red?style=flat&logo=vercel)](https://namastesiamindiankitchen.vercel.app/)
[![Database](https://img.shields.io/badge/Database-Supabase-green?style=flat&logo=supabase)](https://supabase.com)
[![Framework](https://img.shields.io/badge/Framework-React_19_+_Vite-blue?style=flat&logo=react)](https://vitejs.dev)

---

## 🍽️ About the Project

**Namaste Siam Indian Kitchen** celebrates the vibrant culinary traditions of India combined with authentic Thai flavors. This single-page web application provides:
- **Interactive Live Menu**: Instant search across dish names, ingredients, and categories.
- **Dietary & Spice Guidance**: Explicit Vegetarian vs. Non-Vegetarian badges and calibrated spice-level indicators (🌶 Mild to 🌶🌶🌶 Hot).
- **Chef Specials & Favorites**: Dynamic highlights of daily specials, bestsellers, and customer favorites.
- **Direct Reservations**: Instant click-to-chat links to WhatsApp and LINE for booking tables.
- **Real-Time Supabase Database**: Live Postgres subscriptions (`postgres_changes`) updating dish availability and prices immediately across all connected patrons.
- **Protected Admin Panel**: Secure portal for kitchen operations staff to manage menu dishes, categories, gallery photos, and restaurant details.

---

## 🛠️ Technology Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with Warm-Paper & Tandoor Editorial Design System
- **Database & Storage**: [Supabase](https://supabase.com/) (PostgreSQL with Row-Level Security and Cloud Storage buckets)
- **Deployment**: [Vercel](https://vercel.com/) (Edge Static SPA hosting with rewrites and automated HTTPS)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone git@github.com-nsik1204:nsik1204/namastesiamindiankitchen.git
cd namastesiamindiankitchen
npm install
```

### 2. Environment Configuration

Copy the example environment file and add your Supabase credentials:

```bash
cp .env.example .env
```

Fill in the required values:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_UNLOCK_KEY=your-admin-unlock-key
```

### 3. Development Server

Start the local development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) (or the Vite preview at [http://localhost:5173](http://localhost:5173)).

### 4. Production Build & Linting

Run TypeScript type-checking:
```bash
npm run lint
```

Build for production:
```bash
npm run build
```

Run the production server locally:
```bash
npm start
```

---

## 🗄️ Database & Storage Architecture

- **Database Tables**: `categories`, `foods`, `restaurant_info`, `about_info`, `gallery`, `chat_settings` (Defined in [`supabase_schema.sql`](supabase_schema.sql)).
- **Storage Buckets**: `food-images`, `gallery`, `hero`, `restaurant`, `specials` (Documented in [`SUPABASE_STORAGE.md`](SUPABASE_STORAGE.md)).
- **Security**: Strict Row-Level Security (RLS) policies permit public `SELECT` reads while reserving mutations exclusively for authenticated administrators.

---

## 🔒 Security & Admin Access

- The administrative dashboard is protected by an unlock key gate at `/unlock-admin?k=<YOUR_KEY>` combined with Supabase Auth role validation.
- All secrets and service role keys are excluded from client builds.

---

## 📄 License & Attribution

Copyright © 2026 **Namaste Siam Indian Kitchen**. All rights reserved.
