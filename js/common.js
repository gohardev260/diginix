// DiginixIT Common JS

// --- UUID GENERATOR ---
function getUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Initialize Visitor and Session IDs
if (typeof window !== 'undefined') {
    if (!localStorage.getItem('visitor_id')) {
        localStorage.setItem('visitor_id', getUUID());
    }
    if (!sessionStorage.getItem('session_id')) {
        sessionStorage.setItem('session_id', getUUID());
    }
}

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
    twitter: "https://twitter.com/",
    facebook: "https://facebook.com/",
    youtube: "https://youtube.com/"
};

const defaultStats = {
    activeUsers: "8,241",
    visits: 142300,
    userHistory: [100, 200, 300, 400, 500, 600],
    visitHistory: [1000, 2000, 3000, 4000, 5000, 6000]
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
        const logs = [];
        const today = new Date();
        
        // Helper to generate a random date between two Date objects
        const randomDateBetween = (start, end) => {
            const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            return date.toISOString();
        };

        // Sarah Connor joined 2026-05-10
        const sarahStart = new Date(2026, 4, 10, 0, 0, 0, 0); // May 10, 2026
        for (let i = 0; i < 12; i++) {
            logs.push({
                email: 'sarah@connor.com',
                visited_at: randomDateBetween(sarahStart, today)
            });
        }

        // John Doe joined 2026-05-15
        const johnStart = new Date(2026, 4, 15, 0, 0, 0, 0); // May 15, 2026
        for (let i = 0; i < 45; i++) {
            logs.push({
                email: 'john@doe.com',
                visited_at: randomDateBetween(johnStart, today)
            });
        }

        // 100 Anonymous visits over last 40 days
        const anonStart = new Date();
        anonStart.setDate(today.getDate() - 40);
        for (let i = 0; i < 100; i++) {
            logs.push({
                email: null,
                visited_at: randomDateBetween(anonStart, today)
            });
        }

        // Sort chronologically
        logs.sort((a, b) => new Date(a.visited_at) - new Date(b.visited_at));
        localStorage.setItem('visit_logs', JSON.stringify(logs));
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
        // Load Supabase Client SDK locally
        await loadScript('js/supabase.js');

        if (typeof supabase !== 'undefined') {
            window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.useSupabase = true;
            console.log("DiginixIT: Live Supabase client initialized.");
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
                const { data: rows, error } = await window.supabase.rpc('get_public_settings');
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

            case 'get_admin_settings': {
                const { data: rows, error } = await window.supabase.rpc('get_all_settings_admin');
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
                        p_facebook: data.facebook || '',
                        p_youtube: data.youtube || '',
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
                        activeUsers: "0",
                        visits: 0,
                        userHistory: [0, 0, 0, 0, 0, 0],
                        visitHistory: [0, 0, 0, 0, 0, 0]
                    };
                }
                return {
                    activeUsers: String(dbStats.activeusers),
                    visits: Number(dbStats.visits),
                    userHistory: (dbStats.userhistory || '0,0,0,0,0,0').split(',').map(Number),
                    visitHistory: (dbStats.visithistory || '0,0,0,0,0,0').split(',').map(Number)
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
                const sessionId = sessionStorage.getItem('session_id');
                if (sessionId) {
                    try {
                        await window.supabase.rpc('associate_session_visits', {
                            p_session_id: sessionId,
                            p_email: verified.email
                        });
                        sessionStorage.setItem('user_logged_visit_tracked', verified.email);
                        sessionStorage.setItem('user_visit_tracked', 'true');
                    } catch (e) {
                        console.error("Failed to associate session on login:", e);
                    }
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
                const sessionId = sessionStorage.getItem('session_id');
                if (sessionId) {
                    try {
                        await window.supabase.rpc('associate_session_visits', {
                            p_session_id: sessionId,
                            p_email: returnedUser.email
                        });
                        sessionStorage.setItem('user_logged_visit_tracked', returnedUser.email);
                        sessionStorage.setItem('user_visit_tracked', 'true');
                    } catch (e) {
                        console.error("Failed to associate session on registration:", e);
                    }
                }
                return { success: true, user: returnedUser };
            }

            case 'associate_session_visits': {
                const { error } = await window.supabase
                    .rpc('associate_session_visits', {
                        p_session_id: data.session_id,
                        p_email: data.email
                    });
                if (error) throw error;
                return { success: true };
            }

            case 'get_filtered_users': {
                const { data: users, error } = await window.supabase
                    .rpc('get_filtered_users_admin', {
                        p_search: data.search,
                        p_start_date: data.start_date,
                        p_end_date: data.end_date
                    });
                if (error) throw error;
                return users || [];
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
                return { success: true };
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
                    .rpc('increment_user_visit_secure', { 
                        p_email: data ? data.email : null,
                        p_session_id: data ? data.session_id : null
                    });
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
            case 'get_filtered_users': {
                const query = data.search ? data.search.toLowerCase().trim() : '';
                const startDate = data.start_date ? new Date(data.start_date) : null;
                const endDate = data.end_date ? new Date(data.end_date) : null;
                const visitLogs = JSON.parse(localStorage.getItem('visit_logs') || '[]');

                let filtered = users.map(user => {
                    const userLogs = visitLogs.filter(log => log.email && log.email.toLowerCase() === user.email.toLowerCase());
                    const totalVisits = Math.max(Number(user.visits) || 0, userLogs.length);
                    
                    let rangeVisits = 0;
                    if (startDate || endDate) {
                        const logsInRange = userLogs.filter(log => {
                            const logDate = new Date(log.visited_at);
                            return (!startDate || logDate >= startDate) && (!endDate || logDate <= endDate);
                        });
                        rangeVisits = logsInRange.length;
                    } else {
                        rangeVisits = totalVisits;
                    }
                    return {
                        ...user,
                        range_visits: rangeVisits,
                        total_visits: totalVisits
                    };
                });

                if (query) {
                    filtered = filtered.filter(u => {
                        return (u.name || '').toLowerCase().includes(query) ||
                               (u.email || '').toLowerCase().includes(query) ||
                               (u.plan || 'Community').toLowerCase().includes(query) ||
                               (u.status || 'Active').toLowerCase().includes(query);
                    });
                }

                if (startDate || endDate) {
                    filtered = filtered.filter(u => {
                        const uDate = new Date(u.date);
                        const joinedInRange = (!startDate || uDate >= startDate) && (!endDate || uDate <= endDate);
                        const visitedInRange = u.range_visits > 0;
                        return joinedInRange || visitedInRange;
                    });
                }

                // Map keys to match PostgREST returned fields
                const mapped = filtered.map(u => ({
                    name: u.name,
                    email: u.email,
                    date: u.date,
                    plan: u.plan,
                    status: u.status,
                    range_visits: u.range_visits,
                    total_visits: u.total_visits
                }));

                resolve(mapped);
                break;
            }
            case 'associate_session_visits': {
                let visitLogs = JSON.parse(localStorage.getItem('visit_logs') || '[]');
                const sessionId = data.session_id;
                const email = data.email;
                let updateCount = 0;

                if (sessionId && email) {
                    visitLogs.forEach(log => {
                        if (log.session_id === sessionId && (!log.email || log.email === '')) {
                            log.email = email;
                            updateCount++;
                        }
                    });
                    if (updateCount > 0) {
                        localStorage.setItem('visit_logs', JSON.stringify(visitLogs));
                        const userIdx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
                        if (userIdx !== -1) {
                            users[userIdx].visits = (Number(users[userIdx].visits) || 0) + updateCount;
                            localStorage.setItem('users', JSON.stringify(users));
                        }
                    }
                }
                resolve({ success: true });
                break;
            }
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
                if (data && data.email) {
                    let visitLogs = JSON.parse(localStorage.getItem('visit_logs') || '[]');
                    visitLogs = visitLogs.filter(log => !log.email || log.email.toLowerCase() !== data.email.toLowerCase());
                    localStorage.setItem('visit_logs', JSON.stringify(visitLogs));
                }
                resolve({ success: true });
                break;
            case 'get_settings':
            case 'get_admin_settings':
                resolve(settings);
                break;
            case 'save_settings':
                localStorage.setItem('settings', JSON.stringify(data));
                resolve({ success: true });
                break;
            case 'get_stats': {
                const visitLogs = JSON.parse(localStorage.getItem('visit_logs') || '[]');
                const usersList = JSON.parse(localStorage.getItem('users') || '[]');
                
                const totalUsers = usersList.length;
                const totalVisits = usersList.reduce((sum, u) => sum + (Number(u.visits) || 0), 0) + visitLogs.filter(log => !log.email).length;
                
                const months = [];
                const today = new Date();
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    months.push(d);
                }
                
                const userHistory = months.map(m => {
                    return usersList.filter(u => {
                        const uDate = new Date(u.date);
                        return uDate.getFullYear() === m.getFullYear() && uDate.getMonth() === m.getMonth();
                    }).length;
                });
                
                const visitHistory = months.map(m => {
                    return visitLogs.filter(log => {
                        const logDate = new Date(log.visited_at);
                        return logDate.getFullYear() === m.getFullYear() && logDate.getMonth() === m.getMonth();
                    }).length;
                });
                
                resolve({
                    activeUsers: String(totalUsers),
                    visits: totalVisits,
                    userHistory: userHistory,
                    visitHistory: visitHistory
                });
                break;
            }
            case 'save_stats':
                localStorage.setItem('stats', JSON.stringify(data));
                resolve({ success: true });
                break;
            case 'increment_user_visit': {
                let visitLogs = JSON.parse(localStorage.getItem('visit_logs') || '[]');
                const sessionId = data ? data.session_id : null;
                const email = data ? data.email : null;
                
                const alreadyTracked = sessionId && visitLogs.some(log => log.session_id === sessionId);
                let visitCount = 0;

                if (!alreadyTracked) {
                    visitLogs.push({
                        email: email,
                        session_id: sessionId,
                        visited_at: new Date().toISOString()
                    });
                    localStorage.setItem('visit_logs', JSON.stringify(visitLogs));

                    if (email) {
                        const userIdx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
                        if (userIdx !== -1) {
                            users[userIdx].visits = (Number(users[userIdx].visits) || 0) + 1;
                            visitCount = users[userIdx].visits;
                            localStorage.setItem('users', JSON.stringify(users));
                        }
                    }
                } else {
                    if (email) {
                        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
                        if (user) visitCount = user.visits;
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
            <a id="sidebar-social-facebook" href="#" target="_blank" title="Facebook"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
            <a id="sidebar-social-youtube" href="#" target="_blank" title="YouTube"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg></a>
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
        const fbLink = document.getElementById('sidebar-social-facebook');
        if (fbLink) {
            fbLink.href = settings.facebook || 'https://facebook.com/';
            fbLink.style.display = 'inline-flex';
        }
        const ytLink = document.getElementById('sidebar-social-youtube');
        if (ytLink) {
            ytLink.href = settings.youtube || 'https://youtube.com/';
            ytLink.style.display = 'inline-flex';
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

            // Link guest session visits to authenticated user
            const sessionId = sessionStorage.getItem('session_id');
            if (sessionId) {
                await window.apiCall('associate_session_visits', {
                    session_id: sessionId,
                    email: verified.email
                });
                sessionStorage.setItem('user_logged_visit_tracked', verified.email);
            }
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

        // Retry Queue processor
        async function processTrackingQueue() {
            if (!window.useSupabase) return; // Do not process/clear queue if running in local storage fallback mode
            let queue = JSON.parse(localStorage.getItem('visit_tracking_queue') || '[]');
            if (queue.length === 0) return;
            if (typeof navigator !== 'undefined' && !navigator.onLine) return;

            const remainingQueue = [];
            for (const visit of queue) {
                try {
                    const res = await window.apiCall('increment_user_visit', { 
                        email: visit.email, 
                        session_id: visit.session_id 
                    });
                    if (!res || res.success !== true) {
                        remainingQueue.push(visit);
                    }
                } catch (e) {
                    console.error("Queue tracking attempt failed:", e);
                    remainingQueue.push(visit);
                }
            }
            localStorage.setItem('visit_tracking_queue', JSON.stringify(remainingQueue));
        }

        window.addEventListener('online', processTrackingQueue);
        setInterval(processTrackingQueue, 15000);

        async function recordVisit(email = null) {
            const sessionId = sessionStorage.getItem('session_id');
            const visitPayload = { email, session_id: sessionId };
            try {
                if (!window.useSupabase) {
                    // Log locally for offline mode fallback, but raise error so it gets queued
                    apiCallLocalStorageFallback('increment_user_visit', visitPayload);
                    throw new Error("Supabase not active, queuing visit");
                }
                const res = await window.apiCall('increment_user_visit', visitPayload);
                if (res && res.success === true) {
                    sessionStorage.setItem('user_visit_tracked', 'true');
                    if (email) {
                        sessionStorage.setItem('user_logged_visit_tracked', email);
                    }
                } else {
                    throw new Error("Tracking write failed");
                }
            } catch (e) {
                console.error("Failed to record website visit, queuing for retry:", e);
                let queue = JSON.parse(localStorage.getItem('visit_tracking_queue') || '[]');
                const exists = queue.some(q => q.session_id === sessionId && q.email === email);
                if (!exists) {
                    queue.push(visitPayload);
                    localStorage.setItem('visit_tracking_queue', JSON.stringify(queue));
                }
            }
        }

        // Count visit once per session for all visitors when they visit public client pages
        const path = window.location.pathname.toLowerCase();
        const isClientPage = !path.includes('admin.html') && !path.includes('admin_login.html');
        if (isClientPage) {
            // Ignore automated bots/crawlers to prevent visits count inflation
            const botPattern = /bot|crawler|spider|crawling|slurp|transcoder|pingdom|uptime|lighthouse/i;
            if (typeof navigator !== 'undefined' && navigator.userAgent && botPattern.test(navigator.userAgent)) {
                return;
            }
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            const email = currentUser ? currentUser.email : null;
            
            const trackedSession = sessionStorage.getItem('user_visit_tracked');
            const trackedEmail = sessionStorage.getItem('user_logged_visit_tracked');

            if (!trackedSession || (email && trackedEmail !== email)) {
                await recordVisit(email);
            }
        }

        // Also process tracking queue initially
        processTrackingQueue();
    })();
});
