// DiginixIT Common JS

// --- SUPABASE CONFIGURATION ---
// Insert your live URL and Anon Key here from the Supabase Dashboard (Settings > API)
const SUPABASE_URL = 'https://qxqxgoczgtqedfywzetd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4cXhnb2N6Z3RxZWRmeXd6ZXRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzE3OTMsImV4cCI6MjA5Njc0Nzc5M30.UNnihB2OM5eyYLoegbSuLp35zD30YNeKwQnHMP5WeqQ';

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
    { name: "Sarah Connor", email: "sarah@connor.com", date: "2026-05-10", status: "Active", plan: "Community" },
    { name: "John Doe", email: "john@doe.com", date: "2026-05-15", status: "Active", plan: "Pro" },
    { name: "Jane Smith", email: "jane@smith.com", date: "2026-06-01", status: "Blocked", plan: "Community" }
];

const defaultSettings = {
    siteName: "DIGINIXIT.",
    contactEmail: "contact@diginix.com",
    maintenanceMode: false
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
window.apiCall = async function(action, data = null) {
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
                    .from('blogs')
                    .select('*')
                    .order('id', { ascending: false });
                if (error) throw error;
                return blogs || [];
            }
            
            case 'save_blog': {
                const blogData = {
                    title: data.title,
                    category: data.category,
                    author: data.author,
                    image: data.image,
                    summary: data.summary,
                    content: data.content
                };
                if (data.id) {
                    const { error } = await window.supabase
                        .from('blogs')
                        .update(blogData)
                        .eq('id', data.id);
                    if (error) throw error;
                } else {
                    const { error } = await window.supabase
                        .from('blogs')
                        .insert({
                            ...blogData,
                            date: new Date().toISOString().split('T')[0]
                        });
                    if (error) throw error;
                }
                return { success: true };
            }
            
            case 'delete_blog': {
                const { error } = await window.supabase
                    .from('blogs')
                    .delete()
                    .eq('id', data.id);
                if (error) throw error;
                return { success: true };
            }
            
            case 'get_users': {
                const { data: users, error } = await window.supabase
                    .from('users')
                    .select('name, email, date, plan, status')
                    .order('id', { ascending: false });
                if (error) throw error;
                return users || [];
            }
            
            case 'update_user_status': {
                const { data: user, error: fetchError } = await window.supabase
                    .from('users')
                    .select('status')
                    .eq('email', data.email)
                    .single();
                if (fetchError || !user) throw new Error("User not found");
                
                const newStatus = user.status === 'Blocked' ? 'Active' : 'Blocked';
                
                const { error: updateError } = await window.supabase
                    .from('users')
                    .update({ status: newStatus })
                    .eq('email', data.email);
                if (updateError) throw updateError;
                return { success: true, status: newStatus };
            }
            
            case 'delete_user': {
                const { error } = await window.supabase
                    .from('users')
                    .delete()
                    .eq('email', data.email);
                if (error) throw error;
                return { success: true };
            }
            
            case 'get_settings': {
                const { data: rows, error } = await window.supabase
                    .from('settings')
                    .select('*');
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
                const rows = [
                    { key_name: 'siteName', value_text: data.siteName },
                    { key_name: 'contactEmail', value_text: data.contactEmail },
                    { key_name: 'maintenanceMode', value_text: data.maintenanceMode ? 'true' : 'false' }
                ];
                const { error } = await window.supabase
                    .from('settings')
                    .upsert(rows, { onConflict: 'key_name' });
                if (error) throw error;
                return { success: true };
            }
            
            case 'get_stats': {
                const { data: rows, error } = await window.supabase
                    .from('stats')
                    .select('*')
                    .limit(1);
                if (error) throw error;

                // Dynamically retrieve the true count of registered users from the users table
                let realUserCount = 0;
                try {
                    const { count, error: countError } = await window.supabase
                        .from('users')
                        .select('*', { count: 'exact', head: true });
                    if (!countError && count !== null) {
                        realUserCount = count;
                    }
                } catch (e) {
                    console.warn("Failed to count users dynamically:", e);
                }

                if (!rows || rows.length === 0) {
                    return {
                        revenue: "$0",
                        activeUsers: String(realUserCount),
                        executions: "0",
                        revenueHistory: [0,0,0,0,0,0]
                    };
                }
                const dbStats = rows[0];
                return {
                    revenue: dbStats.revenue,
                    activeUsers: String(realUserCount || dbStats.activeusers || dbStats.activeUsers || 0),
                    executions: dbStats.executions,
                    revenueHistory: (dbStats.revenuehistory || dbStats.revenueHistory || '0,0,0,0,0,0').split(',').map(Number)
                };
            }
            
            case 'save_stats': {
                const histStr = data.revenueHistory.join(',');
                const row = {
                    revenue: data.revenue,
                    activeusers: data.activeUsers,
                    executions: data.executions,
                    revenuehistory: histStr
                };
                
                const { data: existing, error: existError } = await window.supabase
                    .from('stats')
                    .select('id')
                    .limit(1);
                if (existError) throw existError;
                
                let error;
                if (existing && existing.length > 0) {
                    const { error: updateError } = await window.supabase
                        .from('stats')
                        .update(row)
                        .eq('id', existing[0].id);
                    error = updateError;
                } else {
                    const { error: insertError } = await window.supabase
                        .from('stats')
                        .insert(row);
                    error = insertError;
                }
                if (error) throw error;
                return { success: true };
            }
            
            case 'submit_contact':
                // Handled directly via Netlify form actions POST
                return { success: true };
                
            case 'login': {
                const { data: user, error } = await window.supabase
                    .from('users')
                    .select('*')
                    .eq('email', data.email)
                    .eq('password', data.password)
                    .maybeSingle();
                if (error) throw error;
                if (!user) {
                    return { success: false, error: "Invalid email or password" };
                }
                if (user.status === 'Blocked') {
                    return { success: false, error: "Your account is blocked. Please contact administrator." };
                }
                delete user.password;
                return { success: true, user: user };
            }
            
            case 'register': {
                const { data: existing, error: existError } = await window.supabase
                    .from('users')
                    .select('id')
                    .eq('email', data.email)
                    .maybeSingle();
                if (existError) throw existError;
                if (existing) {
                    return { success: false, error: "An account with this email address already exists." };
                }
                
                const newUser = {
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    plan: data.plan,
                    date: new Date().toISOString().split('T')[0],
                    status: 'Active'
                };
                
                const { error: insertError } = await window.supabase
                    .from('users')
                    .insert(newUser);
                if (insertError) throw insertError;
                
                delete newUser.password;
                return { success: true, user: newUser };
            }
            
            case 'update_profile': {
                const updateData = { name: data.name };
                if (data.password) {
                    updateData.password = data.password;
                }
                const { error: updateError } = await window.supabase
                    .from('users')
                    .update(updateData)
                    .eq('email', data.email);
                if (updateError) throw updateError;
                
                const { data: user, error: fetchError } = await window.supabase
                    .from('users')
                    .select('name, email, date, plan, status')
                    .eq('email', data.email)
                    .single();
                if (fetchError) throw fetchError;
                return { success: true, user: user };
            }
            
            case 'update_subscription': {
                const { error: updateError } = await window.supabase
                    .from('users')
                    .update({ plan: data.plan })
                    .eq('email', data.email);
                if (updateError) throw updateError;
                
                const { data: user, error: fetchError } = await window.supabase
                    .from('users')
                    .select('name, email, date, plan, status')
                    .eq('email', data.email)
                    .single();
                if (fetchError) throw fetchError;
                return { success: true, user: user };
            }
            
            default:
                return { success: false, error: "Unknown action" };
        }
    } catch (err) {
        console.error(`DiginixIT: Supabase query execution exception on '${action}':`, err);
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
            case 'get_stats':
                resolve(stats);
                break;
            case 'save_stats':
                localStorage.setItem('stats', JSON.stringify(data));
                resolve({ success: true });
                break;
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
                    resolve({ success: true, user: user });
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
                        plan: data.plan,
                        date: new Date().toISOString().split('T')[0],
                        status: 'Active'
                    };
                    users.push(newUser);
                    localStorage.setItem('users', JSON.stringify(users));
                    resolve({ success: true, user: newUser });
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
                    resolve({ success: true, user: users[profIdx] });
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
                    resolve({ success: true, user: users[subIdx] });
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

// --- 5. Site Settings Synced Site-Wide ---
async function applySiteSettings() {
    const settings = await window.apiCall('get_settings');
    if (settings && settings.siteName) {
        const brandEls = document.querySelectorAll('.site-logo-text');
        brandEls.forEach(el => {
            el.innerText = settings.siteName;
        });
        if (document.title.includes('DiginixIT |') || document.title.includes('DIGINIXIT')) {
            const currentSuffix = document.title.split('|')[1] || '';
            document.title = settings.siteName.replace('.', '') + ' |' + currentSuffix;
        }
    }
}

// --- 6. Navbar Auth Status Management ---
function updateNavbarAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const desktopAuthContainer = document.getElementById('desktop-auth-container');
    const mobileAuthContainer = document.getElementById('mobile-auth-container');

    if (currentUser) {
        if (desktopAuthContainer) {
            desktopAuthContainer.innerHTML = `
                <div class="flex items-center space-x-4">
                    <a href="profile.html" class="text-sm font-medium text-secondary hover:text-primary transition-colors" id="nav-profile">Hello, ${currentUser.name}</a>
                    <button id="btn-signout" class="text-sm font-medium hover:text-secondary transition-colors">Sign Out</button>
                </div>
            `;
            document.getElementById('btn-signout').addEventListener('click', handleSignOut);
        }
        if (mobileAuthContainer) {
            mobileAuthContainer.innerHTML = `
                <div class="text-center py-2 text-secondary font-medium"><a href="profile.html" class="hover:text-primary transition-colors">Hello, ${currentUser.name}</a></div>
                <button id="mobile-btn-signout" class="w-full text-center py-4 border border-border rounded-full font-medium hover:bg-surface transition-colors">Sign Out</button>
            `;
            document.getElementById('mobile-btn-signout').addEventListener('click', handleSignOut);
        }
    }
}

function handleSignOut() {
    localStorage.removeItem('currentUser');
    window.location.reload();
}

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
document.addEventListener('DOMContentLoaded', async () => {
    initLocalStorage();
    await window.backendReady;
    await applySiteSettings();
    updateNavbarAuth();
    initMobileMenu();
    highlightActiveNav();
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
