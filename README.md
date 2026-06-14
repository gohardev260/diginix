# DiginixIT Serverless SaaS Web App

DiginixIT is a premium, high-performance serverless SaaS web application designed for a digital web engineering, design, and SEO agency. It features a state-of-the-art frontend stack, interactive tools, client dashboards, subscription flows, and a complete administration console. 

This repository is built for static hosting platforms (such as **Netlify**) and utilizes a **Supabase** backend for serverless data operations and client authentication.

---

## 🚀 Key Features & Website Modules

### 1. Visual & Interactive Core (Landing Page)
* **Interactive Particle System**: Powered by **Three.js**, rendering fluid canvas-based particle structures in the hero section.
* **Micro-Animations & Smooth Motion**: Integrated with **GSAP** (GreenSock Animation Platform) and **Lenis** smooth scroll for high-end micro-interactions.
* **Growing SVG Network Tree**: An interactive, dynamic animated SVG network tree illustrating the agency's tech philosophy.
* **Partner Marquee**: An infinite-scroll marquee showcasing partner brands and integrations.

### 2. SaaS Agency Tools Hub (`tools.html`)
A complete dashboard containing **20 advanced SaaS modules** split across three focus categories (SEO, Website performance, and UX/UI design). Many tools feature interactive modals:
* **SEO Suite**:
  * *Technical SEO Analyzer* (Interactive mock engine)
  * *Meta Tag Generator* (Generates complete HTML meta tag blocks dynamically)
  * *Robots.txt Generator* & *Sitemap Generator* (Generates SEO crawler rules)
  * *Keyword Difficulty*, *Schema Markup Gen*, and *SERP Position* (Pro level modules)
* **Website Suite**:
  * *CSS Minifier* (Real-time CSS compiler and compressor)
  * *HTML Minifier* (Compresses raw markup code)
  * *Color Palette Generator* (Generates harmonic swatches)
  * *Website Speed*, *Core Web Vitals*, *Accessibility Check*, and *Responsive Preview*
* **UX/UI Suite**:
  * *Contrast Checker* (Computes relative luminance for text/background and validates WCAG AAA/AA compliance badges in real-time)
  * *Typography Scale* (Bespoke typographic scale analyzer)
  * *Design System Gen*, *User Flow Generator*, *Wireframe Generator*, and *Persona Generator* (Pro level templates)

### 3. User Membership & Authentication System
* **Client Authentication (`auth.html`)**: Real-time sign-in and registration forms operating on client-side JS SDK.
* **User Profile Dashboard (`profile.html`)**: Allows logged-in users to manage membership tier, save analyses, and view account statuses.
* **Tier Lock Interface**: Pro-tier tools remain restricted until the user signs up and registers a subscription plan.
* **Interactive Stripe Checkout Checkout (`pricing.html`)**: Complete subscription pricing plan (Free Community vs. Pro Agency at $49/mo) connected to a mock checkout wizard that upgrades user roles upon successful execution.

### 4. Admin Management Console (`admin.html`)
A secure administrative control center featuring:
* **Analytics Dashboard**: Graphical data representation using **Chart.js**, revenue statistics, and visit counters.
* **PDF Report Exports**: Integrated with **jsPDF** & **jsPDF-AutoTable** to export user registration reports and metrics instantly.
* **Blog Manager (Full CRUD)**: Write, publish, edit, or delete articles and summaries stored in the database.
* **User Portal**: View user database profiles, tiers, activity counts, and toggle access states.
* **Global Settings**: Configure brand name, email handles, phone lines, social profiles, and activate a **Global Maintenance Mode** block.

---

## 🛠️ Tech Stack & Libraries
* **Frontend**: HTML5, TailwindCSS (Utility styles), Custom Vanilla CSS (Transitions, Glassmorphism, Noise overlay, Custom scrollbars).
* **Animations**: GSAP (GreenSock Engine), Lenis Scroll, Three.js (WebGL particles).
* **Database & Auth**: Supabase JavaScript Client SDK.
* **Analytics & Reports**: Chart.js, jsPDF, jsPDF-AutoTable.
* **Hosting Integration**: Netlify Forms (`data-netlify="true"` tag automatically hooked for contact queries).

---

## ⚙️ Local Setup & Supabase Connection

By default, the application runs in a **local-only mock storage mode (offline fallback)** using `localStorage`. This allows the site to run out-of-the-box in any browser.

To connect the application to your live Supabase database, follow these steps:

### 1. Database Initialization
1. Create a free project at [Supabase](https://supabase.com/).
2. In the Supabase Dashboard, navigate to the **SQL Editor** tab.
3. Click **New Query**, paste the contents of [supabase_setup.sql](file:///c:/Users/Gohar%20Rehman/Desktop/diginix/supabase_setup.sql), and click **Run**.
   * This creates the required tables (`settings`, `blogs`, `users`, `stats`) and populates them with seed data.
   * It also enables Row Level Security (RLS) policies to keep database access secure.

### 2. Frontend Configuration
1. Go to your Supabase project's **Settings > API**.
2. Copy your **Project URL** and your **anon / public API key**.
3. Open [js/common.js](file:///c:/Users/Gohar%20Rehman/Desktop/diginix/js/common.js) and insert your credentials into the constants at the top:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
4. Save the file. The app will now automatically connect to your live database!

### 3. Registering the Administrator Account
To log in to the admin dashboard (`admin_login.html`), you must register your admin credentials via Supabase:
1. In your Supabase Dashboard, go to **Authentication > Users**.
2. Click **Add User** and select **Create User**.
3. Enter the admin email and password.
4. Use this email and password to log in to the secure Admin console.

---

## ☁️ Netlify Deployment Guidelines

To deploy the website to Netlify:

1. **Option A: Drag and Drop**
   * Drag the entire `diginix` folder (containing the HTML files, `js/`, `css/`, etc.) directly into the Netlify Drop box.
2. **Option B: Git Connection**
   * Push your project code to a GitHub/GitLab repository.
   * Connect Netlify to your repository and configure it to deploy the root path.
3. **Configure Forms**:
   * Netlify will automatically detect the contact form in `contact.html` (due to the `data-netlify="true"` attribute).
   * Submissions will appear in your Netlify dashboard under **Forms**. You can configure email notifications directly there.
