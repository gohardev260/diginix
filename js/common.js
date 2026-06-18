// DiginixIT Common JS

// --- HTML ESCAPING UTILITY ---
window.escapeHtml = function (unsafe) {
    if (!unsafe) return "";
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

window.isSafeImageUrl = function (url) {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return ['https:'].includes(parsed.protocol);
    } catch (e) {
        return url.startsWith('/') && !url.toLowerCase().startsWith('/javascript:') && !url.toLowerCase().startsWith('/data:');
    }
};

// --- SUPABASE CONFIGURATION ---
// Insert your live URL and Anon Key here from the Supabase Dashboard (Settings > API)
const SUPABASE_URL = 'https://fvvdmrogquycehyncslp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dmRtcm9ncXV5Y2VoeW5jc2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDQ3NTUsImV4cCI6MjA5NjgyMDc1NX0.a8PSwryUl589P7OkTZNdrik-f-1iLsTtxdhM9fKYM24';

// --- AUTHENTICATION STATE & VERIFICATION ---
window.currentUser = null;

async function verifySessionWithBackend(session) {
    if (!session || !session.user) return null;
    try {
        const { data: user, error } = await window.supabase
            .rpc('verify_session_from_jwt', {
                p_user_id: session.user.id
            });

        if (error || !user) {
            return null;
        }

        return Array.isArray(user) ? user[0] : user;
    } catch (e) {
        console.error("Session verification failed:", e);
        return null;
    }
}
window.verifySessionWithBackend = verifySessionWithBackend;

// --- 1. Data Initialization (Local Storage Mock Database - Offline Fallback Mode Only) ---
const defaultBlogs = [
    {
        id: "1",
        title: "The Future of Web Development in 2026",
        summary: "Exploring the shift towards minimal frameworks and spatial interfaces.",
        content: "We are entering a new era of web design. The visual fatigue of standard templates is real. Users want websites that are not just fast, but feel like tangible, premium physical products. In 2026, we see a massive surge in spatial layouts, dark-mode-first interfaces, cinematic animations, and interactive canvas components like Three.js. DiginixIT is leading this charge by combining WebGL with custom editorial layouts that capture user attention instantly.",
        author: "Alex Rivers",
        date: "2026-06-01",
        category: "Tech",
        image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800"
    },
    {
        id: "2",
        title: "Mastering Design Systems",
        summary: "How to build a scalable design system that developers actually love to use.",
        content: "A design system is more than a Figma library. It is a shared language. To make a design system successful, developers and designers must share tokens—specifically HSL colors, grid spacings, typographic scales, and micro-animations. In this post, we explore how to configure clean, extensible utility variables in CSS and JS to automate style updates, minimize stylesheet bloat, and maintain pixel-perfect consistency across a suite of SaaS tools.",
        author: "Sophia Chen",
        date: "2026-05-25",
        category: "Design",
        image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800"
    },
    {
        id: "3",
        title: "Optimizing Core Web Vitals for $10k Sites",
        summary: "A step-by-step checklist to achieve perfect Lighthouse scores.",
        content: "Google's search algorithms heavily weight Core Web Vitals (LCP, FID, CLS). If your page takes more than 2.5 seconds to render the main hero element, you are losing valuable SEO ranking. Optimizing site performance requires several layers of tuning: deferred scripts loading, dynamic WebP image compression, CSS cleanup, layout shifts avoidance, and hardware-accelerated transitions. Follow our checklist to hit perfect 100/100 Lighthouse scores.",
        author: "Marcus Vance",
        date: "2026-05-18",
        category: "SEO",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"
    }
];

const defaultUsers = [
    { name: "Sarah Connor", email: "sarah@connor.com", date: "2026-05-10", status: "Active", plan: "Community", visits: 12 },
    { name: "John Doe", email: "john@doe.com", date: "2026-05-15", status: "Active", plan: "Pro", visits: 45 },
    { name: "Jane Smith", email: "jane@smith.com", date: "2026-06-01", status: "Blocked", plan: "Community", visits: 0 }
];

const defaultSettings = {
    siteName: "DIGINIXIT.",
    contactEmail: "contact@diginix.com",
    contactPhone: "+92 300 7960300",
    maintenanceMode: false,
    linkedin: "https://linkedin.com/",
    instagram: "https://instagram.com/",
    twitter: "https://twitter.com/"
};

const defaultStats = {
    revenue: "$124,500",
    activeUsers: "8,241",
    executions: "142.3K",
    revenueHistory: [42000, 58000, 65000, 89000, 105000, 124500]
};

function initLocalStorage() {
    if (!localStorage.getItem('blogs')) {
        localStorage.setItem('blogs', JSON.stringify(defaultBlogs));
    }
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem('settings')) {
        localStorage.setItem('settings', JSON.stringify(defaultSettings));
    }
    if (!localStorage.getItem('stats')) {
        localStorage.setItem('stats', JSON.stringify(defaultStats));
    }
    if (!localStorage.getItem('visit_logs')) {
        localStorage.setItem('visit_logs', JSON.stringify([]));
    }
}
initLocalStorage();

// --- 2. Live Supabase Backend Initialization ---
window.useSupabase = false;
window.supabase = null;

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function initSupabase() {
    const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY &&
        SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
        SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

    if (!isConfigured) {
        console.log("DiginixIT: Supabase credentials not set. Running in offline localStorage mode.");
        window.useSupabase = false;
        return;
    }

    try {
        // Load Supabase Client SDK from JSDelivr
        await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');

        if (typeof supabase !== 'undefined') {
            window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.useSupabase = false;
            console.log("DiginixIT: Live Supabase client initialized (disabled for testing).");
        } else {
            console.warn("DiginixIT: Failed to define 'supabase'. Falling back to localStorage.");
            window.useSupabase = false;
        }
    } catch (e) {
        console.warn("DiginixIT: Supabase connection failed. Falling back to localStorage:", e);
        window.useSupabase = false;
    }
}
window.backendReady = initSupabase();

// --- 3. Unified API Client Wrapper ---
window.apiCall = async function (action, data = null) {
    await window.backendReady;

    if (!window.useSupabase) {
        return apiCallLocalStorageFallback(action, data);
    }

    try {
        switch (action) {
            case 'ping':
                return { success: true, message: "Database active" };

            case 'get_blogs': {
                const { data: blogs, error } = await window.supabase
                    .rpc('get_public_blogs');
                if (error) throw error;
                return blogs || [];
            }

            case 'save_blog': {
                const { error } = await window.supabase
                    .rpc('save_blog_secure', {
                        p_id: data.id ? Number(data.id) : null,
                        p_title: data.title,
                        p_category: data.category,
                        p_author: data.author,
                        p_summary: data.summary,
                        p_content: data.content,
                        p_csrf_token: data._csrf_token
                    });
                if (error) throw error;
                return { success: true };
            }

            case 'delete_blog': {
                const { error } = await window.supabase
                    .rpc('delete_blog_secure', {
                        p_id: Number(data.id),
                        p_csrf_token: data._csrf_token
                    });
                if (error) throw error;
                return { success: true };
            }

            case 'get_users': {
                const { data: users, error } = await window.supabase
                    .rpc('get_all_users_admin');
                if (error) throw error;
                return users || [];
            }

            case 'get_visit_logs': {
                const { data: logs, error } = await window.supabase
                    .rpc('get_visit_logs_admin');
                if (error) throw error;
                return logs || [];
            }

            case 'update_user_status': {
                const { data: result, error } = await window.supabase
                    .rpc('update_user_status_secure', {
                        p_email: data.email,
                        p_csrf_token: data._csrf_token
                    });
                if (error) throw error;
                const ret = Array.isArray(result) ? result[0] : result;
                return { success: ret.success, status: ret.status };
            }

            case 'delete_user': {
                const { error } = await window.supabase
                    .rpc('delete_user_secure', {
                        p_email: data.email,
                        p_csrf_token: data._csrf_token
                    });
                if (error) throw error;
                return { success: true };
            }

            case 'get_settings': {
                let rows, error;
                try {
                    const res = await window.supabase.rpc('get_all_settings_admin');
                    rows = res.data;
                    error = res.error;
                } catch (e) {
                    error = e;
                }
                if (error || !rows) {
                    const res = await window.supabase.rpc('get_public_settings');
                    rows = res.data;
                    error = res.error;
                }
                if (error) throw error;
                const settings = {};
                (rows || []).forEach(row => {
                    let val = row.value_text;
                    if (row.key_name === 'maintenanceMode') {
                        val = (val === 'true');
                    }
                    settings[row.key_name] = val;
                });
                return settings;
            }

            case 'save_settings': {
                const { error } = await window.supabase
                    .rpc('save_settings_secure', {
                        p_site_name: data.siteName,
                        p_contact_email: data.contactEmail,
                        p_contact_phone: data.contactPhone || '',
                        p_maintenance_mode: data.maintenanceMode ? 'true' : 'false',
                        p_linkedin: data.linkedin || '',
                        p_instagram: data.instagram || '',
                        p_twitter: data.twitter || '',
                        p_csrf_token: data._csrf_token
                    });
                if (error) throw error;
                return { success: true };
            }

            case 'get_stats': {
                const { data: rows, error } = await window.supabase
                    .rpc('get_public_stats');
                if (error) throw error;
                const dbStats = Array.isArray(rows) ? rows[0] : rows;
                if (!dbStats) {
                    return {
                        revenue: "$0",
                        activeUsers: "0",
                        executions: "0",
                        visits: 0,
                        revenueHistory: [0, 0, 0, 0, 0, 0]
                    };
                }
                return {
                    revenue: dbStats.revenue,
                    activeUsers: String(dbStats.activeusers),
                    executions: dbStats.executions,
                    visits: Number(dbStats.visits),
                    revenueHistory: (dbStats.revenuehistory || '0,0,0,0,0,0').split(',').map(Number)
                };
            }

            case 'save_stats': {
                const histStr = data.revenueHistory.join(',');
                const { error } = await window.supabase
                    .rpc('save_stats_secure', {
                        p_revenue: data.revenue,
                        p_active_users: data.activeUsers,
                        p_executions: data.executions,
                        p_revenue_history: histStr,
                        p_csrf_token: data._csrf_token
                    });
                if (error) throw error;
                return { success: true };
            }

            case 'submit_contact':
                // Handled directly via Netlify form actions POST
                return { success: true };

            case 'login': {
                const { data: authData, error: authError } = await window.supabase.auth.signInWithPassword({
                    email: data.email,
                    password: data.password
                });
                if (authError) {
                    return { success: false, error: authError.message || "Invalid email or password" };
                }
                const verified = await verifySessionWithBackend(authData.session);
                if (!verified) {
                    await window.supabase.auth.signOut();
                    return { success: false, error: "Your account is not active. Please contact support." };
                }
                return { success: true, user: verified };
            }

            case 'register': {
                const { data: authData, error: authError } = await window.supabase.auth.signUp({
                    email: data.email,
                    password: data.password,
                    options: {
                        data: {
                            full_name: data.name
                        }
                    }
                });
                if (authError) {
                    return { success: false, error: authError.message || "Registration failed" };
                }
                if (!authData.user) {
                    return { success: false, error: "Registration failed" };
                }
                const { data: user, error: rpcError } = await window.supabase
                    .rpc('create_user_profile_from_auth', {
                        p_auth_user_id: authData.user.id,
                        p_name: data.name,
                        p_email: data.email
                    });
                if (rpcError) {
                    return { success: false, error: rpcError.message || "Profile creation failed" };
                }
                const returnedUser = Array.isArray(user) ? user[0] : user;
                return { success: true, user: returnedUser };
            }

            case 'update_profile': {
                const { data: user, error: rpcError } = await window.supabase
                    .rpc('update_profile_secure', {
                        p_name: data.name
                    });
                if (rpcError) {
                    return { success: false, error: rpcError.message || "Update profile failed" };
                }
                if (data.password) {
                    const { error: authError } = await window.supabase.auth.updateUser({
                        password: data.password
                    });
                    if (authError) {
                        return { success: false, error: "Profile updated, but password update failed: " + authError.message };
                    }
                }
                const returnedUser = Array.isArray(user) ? user[0] : user;
                return { success: true, user: returnedUser };
            }

            case 'update_subscription': {
                const { data: user, error: rpcError } = await window.supabase
                    .rpc('update_subscription_secure_jwt', {
                        p_plan: data.plan
                    });
                if (rpcError) {
                    return { success: false, error: rpcError.message || "Subscription upgrade failed" };
                }
                const returnedUser = Array.isArray(user) ? user[0] : user;
                return { success: true, user: returnedUser };
            }

            case 'verify_session': {
                const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
                if (sessionError || !session) {
                    return { success: false, error: "Session expired. Please sign in again." };
                }
                const verified = await verifySessionWithBackend(session);
                if (!verified) {
                    return { success: false, error: "Session expired. Please sign in again." };
                }
                return { success: true, user: verified };
            }

            case 'increment_user_visit': {
                const { data: visits, error } = await window.supabase
                    .rpc('increment_user_visit_secure', { p_email: data ? data.email : null });
                if (error) throw error;
                return { success: true, visits: visits };
            }

            default:
                return { success: false, error: "Unknown action" };
        }
    } catch (err) {
        console.error(`DiginixIT: Supabase query execution exception on '${action}':`, err);
        if (err && typeof err === 'object') {
            console.error(`Error Details for '${action}':`, {
                message: err.message,
                details: err.details,
                hint: err.hint,
                code: err.code
            });
        }
        return { success: false, error: err.message || "Database connection error." };
    }
};

// --- 4. Offline localStorage Fallback Operations ---
function apiCallLocalStorageFallback(action, data) {
    return new Promise((resolve) => {
        let blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        let settings = JSON.parse(localStorage.getItem('settings') || '{}');
        let stats = JSON.parse(localStorage.getItem('stats') || '{}');

        switch (action) {
            case 'ping':
                resolve({ success: false, message: "Local storage only" });
                break;
            case 'get_blogs':
                resolve(blogs.slice().reverse());
                break;
            case 'save_blog':
                if (data.id) {
                    const idx = blogs.findIndex(b => b.id === data.id);
                    if (idx !== -1) blogs[idx] = { ...blogs[idx], ...data };
                } else {
                    const newBlog = {
                        ...data,
                        id: Date.now().toString(),
                        date: new Date().toISOString().split('T')[0]
                    };
                    blogs.push(newBlog);
                }
                localStorage.setItem('blogs', JSON.stringify(blogs));
                resolve({ success: true });
                break;
            case 'delete_blog':
                blogs = blogs.filter(b => b.id !== data.id);
                localStorage.setItem('blogs', JSON.stringify(blogs));
                resolve({ success: true });
                break;
            case 'get_users':
                resolve(users);
                break;
            case 'get_visit_logs': {
                const visitLogs = JSON.parse(localStorage.getItem('visit_logs') || '[]');
                resolve(visitLogs);
                break;
            }
            case 'update_user_status':
                const uIdx = users.findIndex(u => u.email === data.email);
                let newStatus = 'Active';
                if (uIdx !== -1) {
                    users[uIdx].status = users[uIdx].status === 'Blocked' ? 'Active' : 'Blocked';
                    newStatus = users[uIdx].status;
                    localStorage.setItem('users', JSON.stringify(users));
                }
                resolve({ success: true, status: newStatus });
                break;
            case 'delete_user':
                users = users.filter(u => u.email !== data.email);
                localStorage.setItem('users', JSON.stringify(users));
                resolve({ success: true });
                break;
            case 'get_settings':
                resolve(settings);
                break;
            case 'save_settings':
                localStorage.setItem('settings', JSON.stringify(data));
                resolve({ success: true });
                break;
            case 'get_stats': {
                const visitLogs = JSON.parse(localStorage.getItem('visit_logs') || '[]');
                resolve({
                    ...stats,
                    visits: visitLogs.length
                });
                break;
            }
            case 'save_stats':
                localStorage.setItem('stats', JSON.stringify(data));
                resolve({ success: true });
                break;
            case 'increment_user_visit': {
                let visitLogs = JSON.parse(localStorage.getItem('visit_logs') || '[]');
                visitLogs.push({
                    email: (data && data.email) ? data.email : null,
                    visited_at: new Date().toISOString()
                });
                localStorage.setItem('visit_logs', JSON.stringify(visitLogs));

                let visitCount = 0;
                if (data && data.email) {
                    const userIdx = users.findIndex(u => u.email.toLowerCase() === data.email.toLowerCase());
                    if (userIdx !== -1) {
                        users[userIdx].visits = (Number(users[userIdx].visits) || 0) + 1;
                        visitCount = users[userIdx].visits;
                        localStorage.setItem('users', JSON.stringify(users));
                    }
                }
                resolve({ success: true, visits: visitCount });
                break;
            }
            case 'submit_contact':
                resolve({ success: true });
                break;
            case 'login': {
                const user = users.find(u => u.email.toLowerCase() === data.email.toLowerCase() && u.password === data.password);
                if (!user) {
                    resolve({ success: false, error: "Invalid email or password" });
                } else if (user.status === 'Blocked') {
                    resolve({ success: false, error: "Your account is blocked. Please contact administrator." });
                } else {
                    const safeUser = { ...user };
                    delete safeUser.password;
                    // Generate local fake session token
                    safeUser.session_token = 'local-session-token';
                    resolve({ success: true, user: safeUser });
                }
                break;
            }
            case 'register':
                if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
                    resolve({ success: false, error: "An account with this email address already exists." });
                } else {
                    const newUser = {
                        name: data.name,
                        email: data.email,
                        password: data.password,
                        plan: 'Community', // Force 'Community' plan
                        date: new Date().toISOString().split('T')[0],
                        status: 'Active'
                    };
                    users.push(newUser);
                    localStorage.setItem('users', JSON.stringify(users));

                    const safeUser = { ...newUser };
                    delete safeUser.password;
                    safeUser.session_token = 'local-session-token';
                    resolve({ success: true, user: safeUser });
                }
                break;
            case 'update_profile': {
                const profIdx = users.findIndex(u => u.email === data.email);
                if (profIdx !== -1) {
                    users[profIdx].name = data.name;
                    if (data.password) {
                        users[profIdx].password = data.password;
                    }
                    localStorage.setItem('users', JSON.stringify(users));

                    const safeUser = { ...users[profIdx] };
                    delete safeUser.password;
                    safeUser.session_token = 'local-session-token';
                    resolve({ success: true, user: safeUser });
                } else {
                    resolve({ success: false, error: "User profile not found" });
                }
                break;
            }
            case 'update_subscription': {
                const subIdx = users.findIndex(u => u.email === data.email);
                if (subIdx !== -1) {
                    users[subIdx].plan = data.plan;
                    localStorage.setItem('users', JSON.stringify(users));

                    const safeUser = { ...users[subIdx] };
                    delete safeUser.password;
                    safeUser.session_token = 'local-session-token';
                    resolve({ success: true, user: safeUser });
                } else {
                    resolve({ success: false, error: "User profile not found" });
                }
                break;
            }
            default:
                resolve({ success: false, error: "Unknown action" });
        }
    });
}

// --- 4.5. Floating Social Sidebar Injection ---
function injectSocialSidebar() {
    // Prevent rendering on admin dashboard and login pages
    const path = window.location.pathname.toLowerCase();
    if (path.includes('admin')) return;

    // Check if sidebar already exists (prevent duplicate injection)
    if (document.getElementById('social-sidebar')) return;

    const sidebar = document.createElement('div');
    sidebar.id = 'social-sidebar';
    sidebar.className = 'social-sidebar';
    sidebar.innerHTML = `
        <div class="social-sidebar-handle" title="Follow Us">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        <div class="social-sidebar-divider"></div>
        <div class="social-sidebar-links">
            <a id="sidebar-social-linkedin" href="#" target="_blank" title="LinkedIn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg></a>
            <a id="sidebar-social-instagram" href="#" target="_blank" title="Instagram"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>
            <a id="sidebar-social-twitter" href="#" target="_blank" title="Twitter/X"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
        </div>
    `;
    document.body.appendChild(sidebar);
}

// --- 5. Site Settings Synced Site-Wide ---
async function applySiteSettings() {
    const settings = await window.apiCall('get_settings');
    if (settings) {
        if (settings.siteName) {
            const brandEls = document.querySelectorAll('.site-logo-text');
            brandEls.forEach(el => {
                el.innerText = settings.siteName;
            });
            if (document.title.includes('DiginixIT |') || document.title.includes('DIGINIXIT')) {
                const currentSuffix = document.title.split('|')[1] || '';
                document.title = settings.siteName.replace('.', '') + ' |' + currentSuffix;
            }
        }

        // Update sidebar social links dynamically
        const lnLink = document.getElementById('sidebar-social-linkedin');
        if (lnLink) {
            lnLink.href = settings.linkedin || 'https://linkedin.com/';
            lnLink.style.display = 'inline-flex';
        }
        const igLink = document.getElementById('sidebar-social-instagram');
        if (igLink) {
            igLink.href = settings.instagram || 'https://instagram.com/';
            igLink.style.display = 'inline-flex';
        }
        const twLink = document.getElementById('sidebar-social-twitter');
        if (twLink) {
            twLink.href = settings.twitter || 'https://twitter.com/';
            twLink.style.display = 'inline-flex';
        }
    }
}

// --- 6. Navbar Auth Status Management ---
function updateNavbarAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const desktopAuthContainer = document.getElementById('desktop-auth-container');
    const mobileAuthContainer = document.getElementById('mobile-auth-container');

    if (currentUser) {
        const safeName = window.escapeHtml(currentUser.name);
        if (desktopAuthContainer) {
            desktopAuthContainer.innerHTML = `
                <div class="flex items-center space-x-4">
                    <a href="profile.html" class="text-sm font-medium text-secondary hover:text-primary transition-colors" id="nav-profile">Hello, ${safeName}</a>
                    <button id="btn-signout" class="text-sm font-medium hover:text-secondary transition-colors">Sign Out</button>
                </div>
            `;
            document.getElementById('btn-signout').addEventListener('click', handleSignOut);
        }
        if (mobileAuthContainer) {
            mobileAuthContainer.innerHTML = `
                <div class="text-center py-2 text-secondary font-medium"><a href="profile.html" class="hover:text-primary transition-colors">Hello, ${safeName}</a></div>
                <button id="mobile-btn-signout" class="w-full text-center py-4 border border-border rounded-full font-medium hover:bg-surface transition-colors">Sign Out</button>
            `;
            document.getElementById('mobile-btn-signout').addEventListener('click', handleSignOut);
        }
    } else {
        // Restore default navigation if signed out
        if (desktopAuthContainer) {
            desktopAuthContainer.innerHTML = `
                <a href="auth.html?mode=signin" class="text-sm font-medium hover:text-secondary transition-colors" id="btn-signin">Sign In</a>
                <div class="magnetic-wrap">
                    <a href="auth.html?mode=signup" class="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-black transition-colors inline-block" id="btn-signup">Get Started</a>
                </div>
            `;
        }
        if (mobileAuthContainer) {
            mobileAuthContainer.innerHTML = `
                <a href="auth.html?mode=signin" class="w-full text-center py-4 border border-border rounded-full font-medium hover:bg-surface transition-colors" id="mobile-btn-signin">Sign In</a>
                <a href="auth.html?mode=signup" class="w-full text-center py-4 bg-primary text-white rounded-full font-medium hover:bg-black transition-colors" id="mobile-btn-signup">Get Started</a>
            `;
        }
    }
}

async function handleSignOut() {
    await window.backendReady;
    if (window.useSupabase) {
        await window.supabase.auth.signOut();
    }
    localStorage.removeItem('currentUser');
    window.location.href = './';
}

async function initializeAuth() {
    await window.backendReady;
    if (!window.useSupabase) return;

    try {
        const { data, error } = await window.supabase.auth.getSession();
        if (error || !data.session) {
            localStorage.removeItem('currentUser');
            updateNavbarAuth();
            return;
        }

        const verified = await verifySessionWithBackend(data.session);
        if (verified) {
            localStorage.setItem('currentUser', JSON.stringify(verified));
            updateNavbarAuth();
        } else {
            await window.supabase.auth.signOut();
            localStorage.removeItem('currentUser');
            updateNavbarAuth();
        }
    } catch (e) {
        console.error("Auth init exception:", e);
    }
}
window.initializeAuth = initializeAuth;

// --- 7. Mobile Hamburger Drawer Menu Toggle ---
function initMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (!hamburgerBtn || !mobileMenu) return;

    hamburgerBtn.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('active');
        if (isOpen) {
            hamburgerBtn.innerHTML = `<i data-lucide="x" class="w-6 h-6"></i>`;
        } else {
            hamburgerBtn.innerHTML = `<i data-lucide="menu" class="w-6 h-6"></i>`;
        }
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
}

// --- 8. Highlight Active Page Link ---
function highlightActiveNav() {
    const currentPath = window.location.pathname;
    const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1);

    const navMap = {
        'index.html': 'nav-home',
        'services.html': 'nav-services',
        'tools.html': 'nav-tools',
        'pricing.html': 'nav-pricing',
        'blog.html': 'nav-blog',
        'article.html': 'nav-blog',
        'profile.html': 'nav-profile',
        'contact.html': 'nav-contact'
    };

    const activeId = navMap[pageName] || 'nav-home';
    const activeLink = document.getElementById(activeId);
    if (activeLink) {
        activeLink.classList.add('active-nav-link');
    }
}

// Navbar scroll background change
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) {
        if (window.scrollY > 50) {
            nav.classList.add('glass-nav');
        } else {
            nav.classList.remove('glass-nav');
        }
    }
});

// Run shared initialization on load
document.addEventListener('DOMContentLoaded', () => {
    initLocalStorage();
    injectSocialSidebar();
    updateNavbarAuth();
    initMobileMenu();
    highlightActiveNav();
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    // Perform database-dependent site adjustments in the background once ready
    (async () => {
        await window.backendReady;
        if (window.useSupabase) {
            await initializeAuth();
        }
        await applySiteSettings();

        // Count visit once per session for all visitors when they visit public client pages
        const path = window.location.pathname.toLowerCase();
        const isClientPage = !path.includes('admin.html') && !path.includes('admin_login.html');
        if (isClientPage) {
            if (!sessionStorage.getItem('user_visit_tracked')) {
                sessionStorage.setItem('user_visit_tracked', 'true');
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
                const email = currentUser ? currentUser.email : null;
                try {
                    await window.apiCall('increment_user_visit', { email: email });
                } catch (e) {
                    console.error("Failed to record website visit:", e);
                }
            }
        }
    })();
});
