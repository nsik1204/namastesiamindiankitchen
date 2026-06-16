# 🚀 Complete Deployment Guide: Namaste Siam Restaurant Website
*A beginner-friendly, zero-assumption guide to deploying your menu application to Vercel and connecting it to Supabase Database storage.*

This step-by-step manual outlines how to push your local workspace code to **GitHub**, set up and configure your **Supabase Database**, link environmental variables, deploy to **Vercel**, and establish custom domain settings with secure verification.

---

## 📂 1. Project Directory Structure
Make sure your files match this standard layout before proceeding. The application uses a dynamic **Express-like state engine** proxying real-time calls to the **Supabase JavaScript SDK** utilizing the static client wrappers.

```text
/ (Project Root)
├── .env.example              # Template file representing required environmental variables
├── .gitignore                # Tells Git which files to ignore (e.g. node_modules, build outputs)
├── index.html                # Main index entry point for the single page web application (SPA)
├── package.json              # App dependencies, configurations, and runner scripts
├── package-lock.json         # Pinned packages dependency tree reference
├── supabase_schema.sql       # Full database table structure and default dataset seed commands
├── tsconfig.json             # TypeScript compiler settings
├── vite.config.ts            # Vite bundler, loader, and server ingress plugin configurations
└── src/
    ├── App.tsx               # Main application component with router and modal overlays
    ├── data.ts               # Static default asset objects representation
    ├── index.css             # Unified global CSS with structural Tailwind configurations
    ├── main.tsx              # React mounting file targeting #root
    ├── types.ts              # TypeScript custom interfaces (Dishes, Categories, AboutInfo, etc.)
    ├── components/
    │   └── admin/
    │       └── AdminDashboard.tsx   # Secured backend administration management panel
    ├── context/
    │   └── AdminAuthContext.tsx     # Session administrator validation controller 
    └── services/
        ├── menuService.ts           # Dynamic queries layer handling read/write syncs
        └── supabaseClient.ts        # Guarded lazy loader for the Supabase instance
```

---

## 🛠️ 2. Git & GitHub Setup

### Step A: Initialize Git Repository
Open your computer's terminal at the project's root folder and execute the following sequential commands:

```bash
# Initialize a brand-new Git repository in the current folder
git init

# Verify that sensitive files like node_modules and .env are ignored
git status
```

### Step B: Stage and Commit Files
Add all tracking files to your first localized version control save-point:

```bash
# Stage all files for commit
git add .

# Create the first local commit with a clear comment
git commit -m "Initialize project: Integrate Supabase menus service and dynamic channels contact forms"

# Set the default branch to 'main'
git branch -M main
```

### Step C: Create a GitHub Repository
1. Open your web browser and navigate to [https://github.com](https://github.com).
2. Log into your account (or sign up for a free account if you do not have one).
3. On the top-right corner of the dashboard, click the **`+`** icon and select **New repository**.
4. Configure your repository settings:
   * **Repository name**: `namaste-siam-website`
   * **Description**: `Dynamic restaurant menu and click-to-chat bookings website`
   * **Public/Private**: Select **Private** (recommended to shield your settings) or **Public**.
   * *Do NOT check any of the initialization options (Add a README file, Add .gitignore, or Choose a license) because we already have them!*
5. Click the green **Create repository** button.

### Step D: Link to GitHub and Push Local Files
Under the section *"or push an existing repository from the command line"*, copy the link provided. Execute these command lines in your local terminal:

```bash
# Link your local repository to your newly created GitHub repository
# REMEMBER: Replace 'YOUR_USERNAME' with your actual GitHub username!
git remote add origin https://github.com/YOUR_USERNAME/namaste-siam-website.git

# Verify the remote address was connected successfully
git remote -v

# Push your localized code to GitHub
git push -u origin main
```

---

## ⚡ 3. Supabase Database Configuration

To enable infinite persistence for restaurant info, active menus, photo collages, and active WhatsApp/LINE click-to-chat channels, deploy the SQL blueprint onto your dedicated Supabase instance.

### Step A: Create a Free Supabase Project
1. Navigate to the [Supabase Dashboard](https://supabase.com).
2. Register an account using your GitHub credentials, then click **New Project** under your default organization.
3. Define project credentials:
   * **Name**: `Namaste Siam DB`
   * **Database Password**: *Set a secure password and save it somewhere safe!*
   * **Region**: Select the region geographically closest to your target customers (e.g., Southeast Asia, East Asia, or US East).
   * **Pricing Plan**: Choose the **Free** tier.
4. Click **Create new project** and wait 1–2 minutes for the database to provision.

### Step B: Execute the Setup SQL Blueprint
1. In the left navigation sidebar of the Supabase dashboard, click on the **SQL Editor** icon (represented by the console `>_` symbol).
2. Click **New Query** to open a fresh script worksheet.
3. Open the file `supabase_schema.sql` located inside your project workspace root, copy the entire block of code, and paste it directly into the Supabase SQL editor workspace.
4. Click the green **Run** button on the top-right.
5. Verify the console displays: `Success. No rows returned` or shows multiple successful insertion rows.

---

## ☁️ 4. Vercel Account & Import Flow

### Step A: Sign Up for Vercel
1. Navigate to [https://vercel.com/signup](https://vercel.com/signup).
2. Choose **Hobby** (Free account) and click **Continue with GitHub**.
3. Authorize Vercel to access your GitHub repositories when requested.

### Step B: Import the Project
1. Once logged into the Vercel dashboard, click the dark **Add New...** button and select **Project**.
2. Under the *"Import Git Repository"* section, locate your `namaste-siam-website` repository from your linked GitHub profile.
3. Click the blue **Import** button.

### Step C: Configure Variables, Build, and Deploy
1. Keep the **Framework Preset** as **Vite** (Vercel automatically detects this setting).
2. Keep the **Root Directory** as `./` (unmodified).
3. Expand the **Environment Variables** panel. Add your Supabase credentials so the client connection loads dynamically:

| Key | Value Source from Supabase |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Open Supabase Project ➔ Project Settings ➔ API ➔ **Project URL** |
| `VITE_SUPABASE_ANON_KEY` | Open Supabase Project ➔ Project Settings ➔ API ➔ **`anon` `public` key** |

*Note: Ensure there are no spaces or trailing backslashes pasted before/after these parameter string credentials.*

4. Click the blue **Deploy** button. Vercel will bundle, compile TypeScript types, and publish the compiled application assets onto their globally distributed edge network within 60 seconds!

---

## 🔄 5. Live Production Redeployments

Vercel implements a seamless continuous integration (CI/CD) structure. Every time you make code updates or visual tweaks in your workspace:

```bash
# 1. Stage the files you updated
git add .

# 2. Commit the updates locally
git commit -m "Update visual layout: Enhance card spacing and mobile response padding"

# 3. Push origin main to GitHub
git push origin main
```

**What happens next?** Vercel triggers automatically on every push, runs clean builds in the background, and swaps the operational bundle seamlessly over to the updated version without dropping any user traffic.

---

## 🌐 6. Connect Custom Domain with Free SSL

By default, Vercel gives you a dynamic subdomain like `namaste-siam.vercel.app`. To attach a custom branded domain:

1. Click on your project's card inside Vercel, and click the **Settings** tab.
2. Select **Domains** on the left menu list.
3. Type in your registered business domain name (e.g. `namastesiam.com` or `menu.namastesiam.com`) and click **Add**.
4. Vercel will display the recommended DNS configurations:
   * **For Apex Domains** (e.g. `namastesiam.com`): Create an **A record** at your domain registrar pointing `@` to IP address `76.76.21.21`.
   * **For Subdomains** (e.g. `menu.namastesiam.com`): Create a **CNAME record** pointing `menu` to `cname.vercel-dns.com`.
5. Once DNS records propagate, Vercel instantly signs a custom Let's Encrypt **SSL Certificate** to make your site connection securely HTTPS for absolute consumer protection.

---

## 📱 7. Customer Contact & QR Code Flow

With this dynamic configuration, customers interact with the interface instantly. Below is a map of how the direct messengers resolve:

```text
               Public Landing Page: Interactive Menu
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
   WhatsApp Contact Button                     LINE Contact Button
   ───────────────────────                     ───────────────────
- Reads 'whatsapp_number'                   - Reads 'line_id' from table.
- Reads 'whatsapp_default_message'.         - Compiles 'line_qr_url' link.
- Redirects immediately onto:               - Displays scanable QR code model.
  https://wa.me/number?text=message         - Redirects immediately on line app.
- NO intermediaries, clean hook-up.         - Dynamic fallback auto-generation.
```

If admin credentials or WhatsApp numbers change in the admin panel backend, the consumer-facing user interface reflects those updates immediately upon reload—no developer intervention or code redeployments required.

---

## 📋 8. Enterprise Security Checklist

* [ ] **Supabase API Safety**: Verify that Row Level Security (RLS) is configured correctly on all active tables so public API keys cannot perform unauthorized updates without active authentication tokens.
* [ ] **Admin Console Credentials**: Use the "Setup Initial Admin" tab in the Staff Authentication form to create your single primary administrator credential, which will be securely registered in your Supabase Auth user management directory. Ensure you restrict registration capabilities or monitor user creation on your Supabase dashboard under Authentication ➔ Users.
* [ ] **Vercel Advanced Scopes**: In the Vercel variables dashboard, restrict variable scopes exclusively to **Production** and **Preview** environments.
* [ ] **Sanitize Inputs**: Restrict food cover URLs or QR code strings on submissions to trusted secure protocols (`https://`) to avoid script injection vulnerabilities.
* [ ] **Backups Policy**: Enable nightly backups on Supabase (under Project Settings ➔ Database ➔ Backups) or run weekly manual snapshot exports using `pg_dump` tools to avoid accidental data loss.

---
*Created with ♥ for Namaste Siam Culinary Administrators and Platform Engineers.*
