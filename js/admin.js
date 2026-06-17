// DiginixIT Admin Dashboard Logic

let currentChartInstance = null;

// --- 1. Tab Control Logic ---
function initTabs() {
    const sidebarBtns = document.querySelectorAll('.admin-tab-btn');
    const mobileBtns = document.querySelectorAll('.mobile-tab-btn');
    const contents = document.querySelectorAll('.admin-tab-content');

    function switchTab(tabId) {
        // Toggle desktop sidebar buttons
        sidebarBtns.forEach(btn => {
            const match = btn.getAttribute('data-tab') === tabId;
            btn.className = match ?
                "w-full flex items-center text-sm px-4 py-3 rounded-lg bg-primary text-white font-medium hover:bg-black transition-colors admin-tab-btn" :
                "w-full flex items-center text-sm px-4 py-3 rounded-lg text-secondary hover:bg-surface hover:text-primary transition-colors admin-tab-btn font-medium";
        });

        // Toggle mobile buttons
        mobileBtns.forEach(btn => {
            const match = btn.getAttribute('data-tab') === tabId;
            btn.className = match ?
                "px-4 py-2 bg-primary text-white text-xs font-bold rounded-full whitespace-nowrap mobile-tab-btn" :
                "px-4 py-2 bg-white text-secondary text-xs font-bold rounded-full whitespace-nowrap border border-border mobile-tab-btn";
        });

        // Toggle contents
        contents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });

        // If switching to analytics, redraw chart
        if (tabId === 'analytics') {
            loadAnalyticsData();
        } else if (tabId === 'blog') {
            loadBlogData();
        } else if (tabId === 'users') {
            loadUserData();
        } else if (tabId === 'settings') {
            loadSettingsData();
        }
    }

    // Attach click listeners
    sidebarBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    mobileBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });
}

// --- 2. Analytics Tab & Chart.js Configuration ---
async function loadAnalyticsData() {
    await window.backendReady;
    const stats = await window.apiCall('get_stats');
    if (!stats) return;

    // Set numbers
    const revenueVal = stats.revenue || "$0";
    const activeUsersVal = stats.activeUsers || "0";
    const executionsVal = stats.executions || "0";
    const visitsVal = stats.visits || 0;

    document.getElementById('stat-revenue').innerText = revenueVal;
    document.getElementById('stat-users').innerText = activeUsersVal;
    document.getElementById('stat-executions').innerText = executionsVal;
    document.getElementById('stat-visits').innerText = Number(visitsVal).toLocaleString();

    // Dynamically show/hide or set change text
    const revChange = document.getElementById('stat-revenue-change');
    if (revChange) {
        if (revenueVal === "$0" || revenueVal === "0" || revenueVal === "$0.00") {
            revChange.innerText = "0% change from last month";
            revChange.className = "text-[10px] text-gray-400 font-medium";
        } else {
            revChange.innerText = "+14.5% from last month";
            revChange.className = "text-[10px] text-green-500 font-bold";
        }
    }

    const usersChange = document.getElementById('stat-users-change');
    if (usersChange) {
        if (activeUsersVal === "0") {
            usersChange.innerText = "0% change from last month";
            usersChange.className = "text-[10px] text-gray-400 font-medium";
        } else {
            usersChange.innerText = "+5.2% from last month";
            usersChange.className = "text-[10px] text-green-500 font-bold";
        }
    }

    const execsChange = document.getElementById('stat-executions-change');
    if (execsChange) {
        if (executionsVal === "0") {
            execsChange.innerText = "0% change from last month";
            execsChange.className = "text-[10px] text-gray-400 font-medium";
        } else {
            execsChange.innerText = "+22.1% from last month";
            execsChange.className = "text-[10px] text-green-500 font-bold";
        }
    }

    const visitsChange = document.getElementById('stat-visits-change');
    if (visitsChange) {
        if (visitsVal === 0 || visitsVal === "0") {
            visitsChange.innerText = "0% change from last month";
            visitsChange.className = "text-[10px] text-gray-400 font-medium";
        } else {
            visitsChange.innerText = "+12.4% from last month";
            visitsChange.className = "text-[10px] text-green-500 font-bold";
        }
    }

    // Fill inputs
    document.getElementById('input-revenue').value = revenueVal;
    document.getElementById('input-users').value = activeUsersVal.toString().replace(/,/g, '');
    document.getElementById('input-executions').value = executionsVal;

    if (stats.revenueHistory) {
        document.getElementById('chart-jan').value = stats.revenueHistory[0] || 0;
        document.getElementById('chart-feb').value = stats.revenueHistory[1] || 0;
        document.getElementById('chart-mar').value = stats.revenueHistory[2] || 0;
        document.getElementById('chart-apr').value = stats.revenueHistory[3] || 0;
        document.getElementById('chart-may').value = stats.revenueHistory[4] || 0;
        document.getElementById('chart-jun').value = stats.revenueHistory[5] || 0;
    }

    renderRevenueChart(stats.revenueHistory || [0, 0, 0, 0, 0, 0]);
}

function renderRevenueChart(chartData) {
    const ctx = document.getElementById('adminRevenueChart');
    if (!ctx) return;

    if (currentChartInstance) {
        currentChartInstance.destroy();
    }

    currentChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Revenue ($)',
                data: chartData,
                borderColor: '#111111',
                backgroundColor: 'rgba(17, 17, 17, 0.05)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#FFFFFF',
                pointBorderColor: '#111111',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#F5F5F5' },
                    border: { display: false }
                },
                x: {
                    grid: { display: false },
                    border: { display: false }
                }
            }
        }
    });
}

window.handleStatsUpdate = async function (e) {
    e.preventDefault();
    const updatedStats = {
        revenue: document.getElementById('input-revenue').value,
        activeUsers: Number(document.getElementById('input-users').value).toLocaleString(),
        executions: document.getElementById('input-executions').value,
        revenueHistory: [
            Number(document.getElementById('chart-jan').value),
            Number(document.getElementById('chart-feb').value),
            Number(document.getElementById('chart-mar').value),
            Number(document.getElementById('chart-apr').value),
            Number(document.getElementById('chart-may').value),
            Number(document.getElementById('chart-jun').value),
        ],
        _csrf_token: window.csrfToken
    };

    await window.backendReady;
    const res = await window.apiCall('save_stats', updatedStats);
    if (res && res.success === true) {
        if (window.useSupabase) await window.fetchCSRFToken();
        alert('Platform metrics successfully updated.');
        await loadAnalyticsData();
    } else {
        alert('Failed to update stats.');
    }
};

// --- 3. Blog Management Tab ---
let blogs = []; // cache blogs list
let quill = null;

function initQuill() {
    const editorEl = document.getElementById('blog-quill-editor');
    if (editorEl && typeof Quill !== 'undefined' && !quill) {
        quill = new Quill('#blog-quill-editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'align': [] }],
                    ['link', 'clean']
                ]
            }
        });
    }
}

async function loadBlogData() {
    await window.backendReady;
    const res = await window.apiCall('get_blogs');
    if (res && Array.isArray(res)) {
        blogs = res;
    } else {
        console.error("Failed to load blogs:", res);
        blogs = [];
        const tbody = document.getElementById('blog-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="p-8 text-center text-red-500 font-bold">
                        Error loading articles: ${res && res.error ? window.escapeHtml(res.error) : 'Unknown error'}
                    </td>
                </tr>
            `;
        }
        return;
    }
    const tbody = document.getElementById('blog-table-body');
    if (!tbody) return;

    if (blogs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="p-8 text-center text-secondary font-light">No articles published. Click 'Add Article' to create one.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = blogs.map(post => `
        <tr class="border-b border-border hover:bg-surface transition-colors">
            <td class="p-4 font-bold text-primary max-w-xs truncate">${window.escapeHtml(post.title)}</td>
            <td class="p-4"><span class="px-2.5 py-1 bg-surface border border-border text-xs rounded-full uppercase tracking-wider text-secondary">${window.escapeHtml(post.category)}</span></td>
            <td class="p-4 text-secondary text-xs">${window.escapeHtml(post.author)}</td>
            <td class="p-4 text-secondary text-xs">${window.escapeHtml(formatLocalShortDate(post.date))}</td>
            <td class="p-4 text-right space-x-2">
                <button class="text-xs font-semibold text-primary hover:underline edit-blog-btn" data-id="${post.id}">Edit</button>
                <button class="text-xs font-semibold text-red-500 hover:underline delete-blog-btn" data-id="${post.id}">Delete</button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.edit-blog-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            window.editBlogPost(id);
        });
    });
    tbody.querySelectorAll('.delete-blog-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            window.deleteBlogPost(id);
        });
    });
}

const editorPanel = document.getElementById('blog-editor-panel');
const editorContent = document.getElementById('blog-editor-content');

window.toggleBlogModal = function (show, isEdit = false) {
    if (!editorPanel || !editorContent) return;

    // Make sure Quill is initialized
    initQuill();

    if (show) {
        if (!isEdit) {
            // Clear fields for a new post
            document.getElementById('edit-post-id').value = '';
            document.getElementById('blog-title').value = '';
            document.getElementById('blog-category').value = '';
            document.getElementById('blog-author').value = '';
            document.getElementById('blog-summary').value = '';
            if (quill) quill.setContents([]); // Clear Quill text
            document.getElementById('blog-editor-title').innerText = "Write New Article";
        }

        editorPanel.classList.remove('pointer-events-none');
        gsap.to(editorPanel, { opacity: 1, duration: 0.3 });
        gsap.to(editorContent, { x: 0, duration: 0.3, ease: "power2.out" });
    } else {
        gsap.to(editorPanel, { opacity: 0, duration: 0.2 });
        gsap.to(editorContent, { x: "100%", duration: 0.2 });
        setTimeout(() => {
            editorPanel.classList.add('pointer-events-none');
        }, 200);
    }
};

window.editBlogPost = function (id) {
    const post = blogs.find(b => b.id == id);
    if (!post) return;

    // Make sure Quill is initialized
    initQuill();

    document.getElementById('edit-post-id').value = post.id;
    document.getElementById('blog-title').value = post.title;
    document.getElementById('blog-category').value = post.category;
    document.getElementById('blog-author').value = post.author;
    document.getElementById('blog-summary').value = post.summary;
    if (quill) {
        quill.root.innerHTML = post.content || '';
    }
    document.getElementById('blog-editor-title').innerText = "Edit Article";

    toggleBlogModal(true, true);
};

window.deleteBlogPost = async function (id) {
    if (!confirm('Are you sure you want to delete this insights article?')) return;
    await window.backendReady;
    const res = await window.apiCall('delete_blog', { id, _csrf_token: window.csrfToken });
    if (res && res.success === true) {
        if (window.useSupabase) await window.fetchCSRFToken();
        await loadBlogData();
    } else {
        alert('Failed to delete blog post.');
    }
};

window.handleBlogSave = async function (e) {
    e.preventDefault();
    const id = document.getElementById('edit-post-id').value;
    const title = document.getElementById('blog-title').value.trim();
    const category = document.getElementById('blog-category').value.trim();
    const author = document.getElementById('blog-author').value.trim();
    const summary = document.getElementById('blog-summary').value.trim();
    const content = quill ? quill.root.innerHTML : '';

    const payload = { id, title, category, author, summary, content, _csrf_token: window.csrfToken };

    await window.backendReady;
    const res = await window.apiCall('save_blog', payload);
    if (res && res.success === true) {
        if (window.useSupabase) await window.fetchCSRFToken();
        alert('Blog post saved successfully.');
        toggleBlogModal(false);
        await loadBlogData();
    } else {
        alert('Failed to save blog post.');
    }
};

// --- 4. Users Tab Logic ---
let usersList = []; // cache users list

function formatLocalShortDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr).substring(0, 10);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return String(dateStr).substring(0, 10);
    }
}

async function loadUserData() {
    await window.backendReady;
    const res = await window.apiCall('get_users');
    if (res && Array.isArray(res)) {
        usersList = res;
    } else {
        console.error("Failed to load users:", res);
        usersList = [];
        const tbody = document.getElementById('users-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="p-8 text-center text-red-500 font-bold">
                        Error loading users: ${res && res.error ? window.escapeHtml(res.error) : 'Unknown error'}
                    </td>
                </tr>
            `;
        }
        return;
    }
    filterAndRenderUsers();
}

function filterAndRenderUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    const searchInput = document.getElementById('users-search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const dateFilterSelect = document.getElementById('users-date-filter');
    const range = dateFilterSelect ? dateFilterSelect.value : 'all';

    // Deduplicate by lowercase email to prevent duplication
    const uniqueUsersMap = new Map();
    usersList.forEach(user => {
        if (user && user.email) {
            uniqueUsersMap.set(user.email.toLowerCase(), user);
        }
    });
    const uniqueUsers = Array.from(uniqueUsersMap.values());

    let filteredUsers = uniqueUsers;
    if (query) {
        filteredUsers = uniqueUsers.filter(user => {
            const name = (user.name || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            const plan = (user.plan || 'Community').toLowerCase();
            const status = (user.status || 'Active').toLowerCase();
            return name.includes(query) || email.includes(query) || plan.includes(query) || status.includes(query);
        });
    }

    // Apply exact local range filters (Starts from 12:00 AM straight local time)
    if (range !== 'all') {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

        filteredUsers = filteredUsers.filter(user => {
            if (!user.date) return false;
            const d = new Date(user.date);
            if (isNaN(d.getTime())) return false;
            
            if (range === 'today') {
                return d.getTime() >= startOfToday.getTime();
            } else if (range === 'yesterday') {
                return d.getTime() >= startOfYesterday.getTime() && d.getTime() < startOfToday.getTime();
            } else if (range === 'week') {
                return d.getTime() >= sevenDaysAgo.getTime();
            } else if (range === 'month') {
                return d.getTime() >= startOfThisMonth.getTime();
            }
            return true;
        });
    }

    // Cache filtered list for PDF export
    window.currentFilteredUsers = filteredUsers;

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-secondary font-light">No clients found matching the search criteria.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredUsers.map((user, idx) => `
        <tr class="border-b border-border hover:bg-surface transition-colors">
            <td class="p-4 font-bold text-primary">${window.escapeHtml(user.name)}</td>
            <td class="p-4 text-xs font-mono text-secondary">${window.escapeHtml(user.email)}</td>
            <td class="p-4 text-xs text-secondary">${window.escapeHtml(formatLocalShortDate(user.date))}</td>
            <td class="p-4"><span class="px-2.5 py-1 text-xs rounded-full uppercase tracking-wider font-bold ${user.plan === 'Pro' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}">${window.escapeHtml(user.plan || 'Community')}</span></td>
            <td class="p-4 text-xs font-bold text-primary">${user.visits || 0}</td>
            <td class="p-4">
                <span class="px-2.5 py-1 text-xs rounded-full uppercase tracking-wider font-bold ${user.status === 'Blocked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
                    ${window.escapeHtml(user.status || 'Active')}
                </span>
            </td>
            <td class="p-4 text-right space-x-2">
                <button class="text-xs font-semibold text-primary hover:underline toggle-user-status-btn" data-email="${window.escapeHtml(user.email)}">
                    ${user.status === 'Blocked' ? 'Activate' : 'Block'}
                </button>
                <button class="text-xs font-semibold text-red-500 hover:underline delete-user-btn" data-email="${window.escapeHtml(user.email)}">Delete</button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.toggle-user-status-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const email = e.currentTarget.getAttribute('data-email');
            window.toggleUserStatus(email);
        });
    });
    tbody.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const email = e.currentTarget.getAttribute('data-email');
            window.deleteUser(email);
        });
    });
}

window.exportUsersPDF = function () {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        alert("PDF library is still loading. Please try again in a moment.");
        return;
    }

    const doc = new jsPDF();

    // Branded Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(17, 17, 17);
    doc.text("DIGINIXIT.", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.text("User Analytics & Engagement Report", 14, 26);
    
    // Add date range notice if any filters applied
    const dateFilterSelect = document.getElementById('users-date-filter');
    const rangeVal = dateFilterSelect ? dateFilterSelect.value : 'all';
    let separatorY = 38;
    let summaryY = 48;
    
    if (rangeVal && rangeVal !== 'all') {
        const labelMap = {
            today: 'Today',
            yesterday: 'Yesterday',
            week: 'Last 7 Days',
            month: 'This Month'
        };
        const rangeText = `Date Range: ${labelMap[rangeVal] || rangeVal}`;
        doc.text(rangeText, 14, 32);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);
        separatorY = 42;
        summaryY = 51;
    } else {
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
    }

    // Separator line
    doc.setDrawColor(229, 229, 229);
    doc.line(14, separatorY, 196, separatorY);

    // Get the filtered users
    const filteredList = window.currentFilteredUsers || usersList;

    // Summary Analytics
    const totalUsers = filteredList.length;
    const totalVisits = filteredList.reduce((sum, u) => sum + (Number(u.visits) || 0), 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text(`Total Users: ${totalUsers}`, 14, summaryY);
    doc.text(`Total Recorded Visits: ${totalVisits}`, 80, summaryY);

    // Generate table contents
    const headers = [["Client Name", "Email Address", "Tier Plan", "Total Visits"]];
    const data = filteredList.map(u => [
        u.name || "N/A",
        u.email || "N/A",
        u.plan || "Community",
        String(u.visits || 0)
    ]);

    doc.autoTable({
        head: headers,
        body: data,
        startY: summaryY + 7,
        theme: 'striped',
        headStyles: {
            fillColor: [17, 17, 17],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [51, 51, 51]
        },
        alternateRowStyles: {
            fillColor: [249, 249, 249]
        },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 70 },
            2: { cellWidth: 32 },
            3: { cellWidth: 30, halign: 'right' }
        },
        margin: { top: 55, left: 14, right: 14 }
    });

    doc.save("diginixit_users_report.pdf");
};

window.toggleUserStatus = async function (email) {
    await window.backendReady;
    const res = await window.apiCall('update_user_status', { email, _csrf_token: window.csrfToken });
    if (res && res.success === true) {
        if (window.useSupabase) await window.fetchCSRFToken();
        await loadUserData();
    } else {
        alert('Failed to update user status.');
    }
};

window.deleteUser = async function (email) {
    if (!confirm('Are you sure you want to delete this user profile?')) return;
    await window.backendReady;
    const res = await window.apiCall('delete_user', { email, _csrf_token: window.csrfToken });
    if (res && res.success === true) {
        if (window.useSupabase) await window.fetchCSRFToken();
        await loadUserData();
    } else {
        alert('Failed to delete user.');
    }
};

// --- 5. Settings Tab Logic ---
async function loadSettingsData() {
    await window.backendReady;
    const settings = await window.apiCall('get_settings') || {};
    document.getElementById('settings-sitename').value = settings.siteName || 'DIGINIXIT.';
    document.getElementById('settings-email').value = settings.contactEmail || 'contact@diginix.com';
    document.getElementById('settings-phone').value = settings.contactPhone || '';
    document.getElementById('settings-maintenance').checked = settings.maintenanceMode || false;
    document.getElementById('settings-linkedin').value = settings.linkedin || '';
    document.getElementById('settings-instagram').value = settings.instagram || '';
    document.getElementById('settings-twitter').value = settings.twitter || '';
}

window.handleSettingsUpdate = async function (e) {
    e.preventDefault();
    const siteName = document.getElementById('settings-sitename').value.trim();
    const contactEmail = document.getElementById('settings-email').value.trim();
    const contactPhone = document.getElementById('settings-phone').value.trim();
    const maintenanceMode = document.getElementById('settings-maintenance').checked;
    const linkedin = document.getElementById('settings-linkedin').value.trim();
    const instagram = document.getElementById('settings-instagram').value.trim();
    const twitter = document.getElementById('settings-twitter').value.trim();

    const newSettings = { siteName, contactEmail, contactPhone, maintenanceMode, linkedin, instagram, twitter, _csrf_token: window.csrfToken };

    await window.backendReady;
    const res = await window.apiCall('save_settings', newSettings);
    if (res && res.success === true) {
        if (window.useSupabase) await window.fetchCSRFToken();
        // Sync navbar layout name immediately
        const brandEls = document.querySelectorAll('.site-logo-text');
        brandEls.forEach(el => { el.innerText = siteName; });
        alert('System settings applied. Site configuration refreshed.');
    } else {
        alert('Failed to save settings.');
    }
};

window.handleAdminSignOut = async function () {
    await window.backendReady;
    if (window.useSupabase) {
        await window.supabase.auth.signOut();
    }
    alert('Secure session terminated.');
    window.location.replace('admin_login.html');
};

// Initial Start
document.addEventListener('DOMContentLoaded', async () => {
    await window.backendReady;
    initTabs();
    await loadAnalyticsData();

    // Attach listener to search input
    const searchInput = document.getElementById('users-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', filterAndRenderUsers);
    }

    // Attach listener to date filter dropdown
    const dateFilterSelect = document.getElementById('users-date-filter');
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', filterAndRenderUsers);
    }
});
