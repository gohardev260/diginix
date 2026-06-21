# 🌌 DiginixIT Serverless SaaS Web App

DiginixIT is a premium, high-performance serverless SaaS web application designed for an elite, multidisciplinary digital agency specializing in **Web Engineering**, **UX/UI Design**, **Technical SEO**, **Law & Tech Compliance**, and **Corporate Finance**. 

Featuring a state-of-the-art frontend stack, interactive tools, secure client dashboards, subscription flows, and a comprehensive administration console, DiginixIT delivers a highly responsive, modern user experience. The application runs with a **Supabase** backend for serverless data operations and client authentication, and is fully configured for static hosting platforms (such as GitHub Pages or Netlify).

---

## 🚀 Key Features & Website Modules

### 1. Interactive Visual Core & Aesthetics
* **WebGL Particle System**: Powered by **Three.js**, rendering a fluid, interactive canvas-based particle network in the hero section.
* **Smooth Motion & Micro-Animations**: Built with the **GSAP (GreenSock)** animation suite and **Lenis** smooth scroll for premium micro-interactions and scroll-bound animations.
* **Interactive SVG Network Tree**: An animated SVG tree that grows and responds dynamically, visualizing the agency's multidisciplinary tech philosophy.
* **Infinite Logo Marquee**: A seamless, hardware-accelerated marquee showcasing trusted brands and technology partners (Vercel, Netlify, Stripe, Figma, OpenAI, etc.).
* **Glassmorphic Design System**: Custom Vanilla CSS incorporating glassmorphism, noise overlays, and custom scrollbars for a premium dark/light mode experience.

### 2. Premium Multidisciplinary Services
DiginixIT showcases five core capability areas with custom-tailored interactive SVGs:
* **Web Engineering**: High-performance React, Next.js, and serverless architectures engineered for speed, safety, and scale.
* **UX/UI Design**: Spatial editorial layouts, comprehensive design systems, and cohesive design tokens.
* **Technical SEO**: Structural audit systems, automated schema generation, and Core Web Vitals optimization.
* **Law & Tech Compliance**: Digital contract auditing, IP protection, CCPA/GDPR compliance frameworks, and SLA curation.
* **Corporate Finance**: Strategic fundraising models, growth capitalization diagnostics, tech valuation metrics, and cash flow optimization.

### 3. SaaS Agency Tools Hub (`tools.html`)
An advanced developer and optimizer dashboard containing **20 specialized modules** categorised into three suites:
* **SEO Suite**:
  * *Technical SEO Analyzer* (Interactive mock engine)
  * *Meta Tag Generator* (Dynamically generates HTML meta tags)
  * *Robots.txt & Sitemap Generators* (Builds crawling rules instantly)
  * *Keyword Difficulty*, *Schema Markup Gen*, and *SERP Position* (Pro modules)
* **Website Performance Suite**:
  * *CSS Minifier* (Real-time compiler and compressor)
  * *HTML Minifier* (Compresses raw markup code)
  * *Color Palette Generator* (Generates harmonic swatches)
  * *Website Speed*, *Core Web Vitals*, *Accessibility Check*, and *Responsive Preview*
* **UX/UI Suite**:
  * *Contrast Checker* (Computes relative luminance and checks WCAG compliance)
  * *Typography Scale* (Bespoke typographic scale analyzer)
  * *Design System Gen*, *User Flow Gen*, *Wireframe Gen*, and *Persona Gen* (Pro templates)

*Note: Pro-tier tools require a subscription upgrade and are visually locked using the client-side authentication states.*

### 4. Membership, Subscription & Stripe Mockup
* **Client Authentication (`auth.html`)**: Interactive signup/login forms leveraging the Supabase JavaScript Client SDK.
* **User Profile Dashboard (`profile.html`)**: Displays logged-in user tiers, stored analysis reports, and subscription details.
* **Stripe Checkout Simulation (`pricing.html`)**: A mock checkout wizard validating user upgrades to the Pro tier ($49/mo) upon completion.

### 5. Secure Admin Management Console (`admin.html`)
A secure administrative control center featuring:
* **Analytics & Revenue Charts**: Graphical dashboard powered by **Chart.js** displaying user engagement metrics, system stats, and revenue records.
* **CRUD Blog Manager**: Full Create, Read, Update, and Delete operations for publishing articles stored in Supabase.
* **User Manager**: Audit registered users, update subscription tiers, and toggle active status.
* **Global Settings**: Configure support details (email, phone, socials), custom brand name, and toggle the **Global Maintenance Mode** banner.
* **PDF Report Exporter**: Instant client database and report downloads using **jsPDF** & **jsPDF-AutoTable**.

---

## 🛠️ Technology Stack & Libraries

* **Markup & Logic**: HTML5, Vanilla JavaScript (ES6+ Modules)
* **CSS & Layout**: TailwindCSS (Utility styles), Custom CSS (Animations, Noise Overlay, Glassmorphism, Theme styles)
* **Client-Side Database SDK**: Supabase JS SDK (v2)
* **Animations**: Three.js (WebGL particles), GSAP (GreenSock Engine), Lenis Scroll (Smooth scroll)
* **Data Visualizations & PDF**: Chart.js, jsPDF, jsPDF-AutoTable
* **Icons**: Lucide Icons

---

## ⚙️ Local Setup & Configuration

By default, DiginixIT includes a **local-only mock storage mode (offline fallback)** using `localStorage`. If Supabase credentials are not provided, it will gracefully run fully offline using browser storage.

To connect your live Supabase database and authentication instance, follow these steps:

### 1. Database Setup
1. Create a free project at [Supabase](https://supabase.com/).
2. Navigate to the **SQL Editor** tab in your Supabase dashboard.
3. Click **New Query**, paste the contents of [supabase_setup.sql](file:///c:/Users/Gohar%20Rehman/Desktop/diginix/supabase_setup.sql), and click **Run**.
   * This sets up the tables (`settings`, `blogs`, `users`, `stats`), inserts initial seed data, and enables RLS policies.

### 2. API Configuration
1. Obtain your **Project URL** and **anon/public API key** from your Supabase Project **Settings > API** page.
2. Open [js/common.js](file:///c:/Users/Gohar%20Rehman/Desktop/diginix/js/common.js) and insert your credentials at the top:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
3. Save the file. The app will now communicate directly with your live database.

### 3. Create Admin Credentials
To access the Admin dashboard (`admin_login.html`):
1. Navigate to **Authentication > Users** in the Supabase Dashboard.
2. Click **Add User** -> **Create User**.
3. Set the email and password.
4. Log in using these credentials on the agency dashboard.

---

## ☁️ Deployment Guidelines

Since DiginixIT is built entirely as a static frontend connected to a serverless backend, you can deploy it instantly:

### Option A: Netlify Deployment
1. Drag and drop the root `diginix` folder into Netlify Drop.
2. *Alternative*: Connect Netlify to your GitHub repository and point it to the root directory.
3. **Netlify Forms Integration**: The contact form in `contact.html` features a `data-netlify="true"` attribute. Netlify will automatically intercept submissions and show them in your form dashboard.

### Option B: GitHub Pages
1. Push your project files to your GitHub repository.
2. Go to **Settings > Pages** and select the deployment branch (e.g., `main`).
3. Ensure the custom domain (configured in [CNAME](file:///c:/Users/Gohar%20Rehman/Desktop/diginix/CNAME) as `www.diginixit.com`) is mapped under your DNS records to GitHub's server IPs.
