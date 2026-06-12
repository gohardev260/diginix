# DiginixIT Serverless Web App

This is a modern, responsive web application for DiginixIT Agency, architected for static hosting on **Netlify** with a **Supabase** database backend. It features dynamic particle visuals (Three.js), micro-animations (GSAP), custom analytics, client authentication, and Netlify Forms integration.

There is no server-side code (PHP/Node) required. The frontend interacts directly with Supabase via the client-side JavaScript SDK.

---

## Project Structure

```
index.html               ← Landing page & Hero visual
services.html            ← Capability summaries
tools.html               ← SaaS utility modules (Free & Pro tiers)
pricing.html             ← Elite subscription details & checkout
blog.html                ← Insights listing & article modals
contact.html             ← Contact form integrated with Netlify Forms
auth.html                ← User login & sign-up
profile.html             ← User profile dashboard & tier management
admin_login.html         ← Admin Secure Auth Portal
admin.html               ← Admin Management Panel (Console)
js/                      
   ├─ common.js          ← Supabase connection & unified API wrapper
   ├─ admin.js           ← Admin panel interaction & CRUD
   ├─ tools.js           ← Individual visual tool forms
   └─ script.js          ← Visual effects (GSAP, Three.js, Lenis scroll)
css/                     
   └─ style.css          ← Custom CSS system (transitions, glassmorphism)
supabase_setup.sql       ← Database initialization script
```

---

## Local Setup & Supabase Connection

By default, the application runs in a **local-only mock storage mode (offline fallback)** using `localStorage`. This allows the site to run out-of-the-box in any browser.

To connect the application to your live Supabase database, follow these steps:

### 1. Database Initialization
1. Create a free project at [Supabase](https://supabase.com/).
2. In the Supabase Dashboard, navigate to the **SQL Editor** tab.
3. Click **New Query**, paste the contents of `supabase_setup.sql`, and click **Run**.
   * This creates the required tables (`settings`, `blogs`, `users`, `stats`) and populates them with seed data.
   * It also enables Row Level Security (RLS) policies to keep database access secure.

### 2. Frontend Configuration
1. Go to your Supabase project's **Settings > API**.
2. Copy your **Project URL** and your **anon / public API key**.
3. Open `js/common.js` and insert your credentials into the constants at the top:
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

## Netlify Deployment Guidelines

To deploy the website to Netlify:

1. **Option A: Drag and Drop**
   * Drag the entire `DiginixIT` folder (containing the HTML files, `js/`, `css/`, etc.) directly into the Netlify Drop box.
2. **Option B: Git Connection**
   * Push your project code to a GitHub/GitLab repository.
   * Connect Netlify to your repository and configure it to deploy the root path.
3. **Configure Forms**:
   * Netlify will automatically detect the contact form in `contact.html` (due to the `data-netlify="true"` attribute).
   * Submissions will appear in your Netlify dashboard under **Forms**. You can configure email notifications directly there.

---

## Technical Notes

* **Image Storage**: External image links (e.g. Unsplash URL strings) are saved in the database text fields rather than large binary uploads. This keeps database storage size at less than 1MB (well below the free tier's 500MB limit).
* **No Database Fallback Merging**: When Supabase is configured, all lists (blogs, users, inquiries) load purely from the live database. Changes made in the admin console are written directly to the database.
