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

    document.getElementById('stat-revenue').innerText = revenueVal;
    document.getElementById('stat-users').innerText = activeUsersVal;
    document.getElementById('stat-executions').innerText = executionsVal;

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

    renderRevenueChart(stats.revenueHistory || [0,0,0,0,0,0]);
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

window.handleStatsUpdate = async function(e) {
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
        ]
    };

    await window.backendReady;
    const res = await window.apiCall('save_stats', updatedStats);
    if (res && res.success === true) {
        alert('Platform metrics successfully updated.');
        await loadAnalyticsData();
    } else {
        alert('Failed to update stats.');
    }
};

// --- 3. Blog Management Tab ---
let blogs = []; // cache blogs list

async function loadBlogData() {
    await window.backendReady;
    blogs = await window.apiCall('get_blogs') || [];
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
            <td class="p-4 font-bold text-primary max-w-xs truncate">${post.title}</td>
            <td class="p-4"><span class="px-2.5 py-1 bg-surface border border-border text-xs rounded-full uppercase tracking-wider text-secondary">${post.category}</span></td>
            <td class="p-4 text-secondary text-xs">${post.author}</td>
            <td class="p-4 text-secondary text-xs">${post.date}</td>
            <td class="p-4 text-right space-x-2">
                <button onclick="editBlogPost('${post.id}')" class="text-xs font-semibold text-primary hover:underline">Edit</button>
                <button onclick="deleteBlogPost('${post.id}')" class="text-xs font-semibold text-red-500 hover:underline">Delete</button>
            </td>
        </tr>
    `).join('');
}

const editorPanel = document.getElementById('blog-editor-panel');
const editorContent = document.getElementById('blog-editor-content');

window.toggleBlogModal = function(show, isEdit = false) {
    if (!editorPanel || !editorContent) return;

    if (show) {
        if (!isEdit) {
            // Clear fields for a new post
            document.getElementById('edit-post-id').value = '';
            document.getElementById('blog-title').value = '';
            document.getElementById('blog-author').value = '';
            document.getElementById('blog-image').value = '';
            document.getElementById('blog-summary').value = '';
            document.getElementById('blog-content').value = '';
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

window.editBlogPost = function(id) {
    const post = blogs.find(b => b.id == id);
    if (!post) return;

    document.getElementById('edit-post-id').value = post.id;
    document.getElementById('blog-title').value = post.title;
    document.getElementById('blog-category').value = post.category;
    document.getElementById('blog-author').value = post.author;
    document.getElementById('blog-image').value = post.image;
    document.getElementById('blog-summary').value = post.summary;
    document.getElementById('blog-content').value = post.content;
    document.getElementById('blog-editor-title').innerText = "Edit Article";

    toggleBlogModal(true, true);
};

window.deleteBlogPost = async function(id) {
    if (!confirm('Are you sure you want to delete this insights article?')) return;
    await window.backendReady;
    const res = await window.apiCall('delete_blog', { id });
    if (res && res.success === true) {
        await loadBlogData();
    } else {
        alert('Failed to delete blog post.');
    }
};

window.handleBlogSave = async function(e) {
    e.preventDefault();
    const id = document.getElementById('edit-post-id').value;
    const title = document.getElementById('blog-title').value.trim();
    const category = document.getElementById('blog-category').value;
    const author = document.getElementById('blog-author').value.trim();
    const image = document.getElementById('blog-image').value.trim();
    const summary = document.getElementById('blog-summary').value.trim();
    const content = document.getElementById('blog-content').value;

    const payload = { id, title, category, author, image, summary, content };

    await window.backendReady;
    const res = await window.apiCall('save_blog', payload);
    if (res && res.success === true) {
        alert('Blog post saved successfully.');
        toggleBlogModal(false);
        await loadBlogData();
    } else {
        alert('Failed to save blog post.');
    }
};

// --- 4. Users Tab Logic ---
async function loadUserData() {
    await window.backendReady;
    const users = await window.apiCall('get_users') || [];
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-secondary font-light">No clients registered on platform.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map((user, idx) => `
        <tr class="border-b border-border hover:bg-surface transition-colors">
            <td class="p-4 font-bold text-primary">${user.name}</td>
            <td class="p-4 text-xs font-mono text-secondary">${user.email}</td>
            <td class="p-4 text-xs text-secondary">${user.date || '2026-06-01'}</td>
            <td class="p-4"><span class="px-2.5 py-1 text-xs rounded-full uppercase tracking-wider font-bold ${user.plan === 'Pro' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}">${user.plan || 'Community'}</span></td>
            <td class="p-4 text-xs font-bold text-primary">${user.visits || 0}</td>
            <td class="p-4">
                <span class="px-2.5 py-1 text-xs rounded-full uppercase tracking-wider font-bold ${user.status === 'Blocked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
                    ${user.status || 'Active'}
                </span>
            </td>
            <td class="p-4 text-right space-x-2">
                <button onclick="toggleUserStatus('${user.email}')" class="text-xs font-semibold text-primary hover:underline">
                    ${user.status === 'Blocked' ? 'Activate' : 'Block'}
                </button>
                <button onclick="deleteUser('${user.email}')" class="text-xs font-semibold text-red-500 hover:underline">Delete</button>
            </td>
        </tr>
    `).join('');
}

window.toggleUserStatus = async function(email) {
    await window.backendReady;
    const res = await window.apiCall('update_user_status', { email });
    if (res && res.success === true) {
        await loadUserData();
    } else {
        alert('Failed to update user status.');
    }
};

window.deleteUser = async function(email) {
    if (!confirm('Are you sure you want to delete this user profile?')) return;
    await window.backendReady;
    const res = await window.apiCall('delete_user', { email });
    if (res && res.success === true) {
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

window.handleSettingsUpdate = async function(e) {
    e.preventDefault();
    const siteName = document.getElementById('settings-sitename').value.trim();
    const contactEmail = document.getElementById('settings-email').value.trim();
    const contactPhone = document.getElementById('settings-phone').value.trim();
    const maintenanceMode = document.getElementById('settings-maintenance').checked;
    const linkedin = document.getElementById('settings-linkedin').value.trim();
    const instagram = document.getElementById('settings-instagram').value.trim();
    const twitter = document.getElementById('settings-twitter').value.trim();

    const newSettings = { siteName, contactEmail, contactPhone, maintenanceMode, linkedin, instagram, twitter };
    
    await window.backendReady;
    const res = await window.apiCall('save_settings', newSettings);
    if (res && res.success === true) {
        // Sync navbar layout name immediately
        const brandEls = document.querySelectorAll('.site-logo-text');
        brandEls.forEach(el => { el.innerText = siteName; });
        alert('System settings applied. Site configuration refreshed.');
    } else {
        alert('Failed to save settings.');
    }
};

window.handleAdminSignOut = async function() {
    localStorage.removeItem('adminLoggedIn');
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
});
