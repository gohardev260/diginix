// DiginixIT Admin Dashboard Logic

// Target timezone: Pakistan Standard Time (PKT, UTC+5)
const TARGET_TIMEZONE_OFFSET_MINUTES = 5 * 60;

window.adminState = {
    revenueChartInstance: null,
    userChartInstance: null,
    visitChartInstance: null,
    blogs: [],
    usersList: [],
    quill: null,
    currentFilteredUsers: [],
    visitLogsList: [],
    activeTab: 'analytics',
    isLoadingUsers: false
};

// --- 1. Tab Control Logic ---
function initTabs() {
    const sidebarBtns = document.querySelectorAll('.admin-tab-btn');
    const mobileBtns = document.querySelectorAll('.mobile-tab-btn');
    const contents = document.querySelectorAll('.admin-tab-content');

    function switchTab(tabId) {
        window.adminState.activeTab = tabId;
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
    const activeUsersVal = stats.activeUsers || "0";
    const visitsVal = stats.visits || 0;

    document.getElementById('stat-users').innerText = activeUsersVal;
    document.getElementById('stat-visits').innerText = Number(visitsVal).toLocaleString();

    // Dynamically show change texts (resetting to +0% / normal since manual overrides are removed)
    const usersChange = document.getElementById('stat-users-change');
    if (usersChange) {
        usersChange.innerText = "0% change from last month";
        usersChange.className = "text-[10px] text-gray-400 font-medium";
    }

    const visitsChange = document.getElementById('stat-visits-change');
    if (visitsChange) {
        visitsChange.innerText = "0% change from last month";
        visitsChange.className = "text-[10px] text-gray-400 font-medium";
    }

    // Generate Month Labels dynamically (last 6 months)
    const labels = [];
    const today = new Date();
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        labels.push(shortMonths[d.getMonth()]);
    }

    renderCharts(
        labels,
        stats.userHistory || [0, 0, 0, 0, 0, 0],
        stats.visitHistory || [0, 0, 0, 0, 0, 0]
    );
}

function renderCharts(labels, userData, visitData) {
    // 1. User Acquisitions Chart (Bar Chart)
    const ctxUsers = document.getElementById('adminUsersChart');
    if (ctxUsers) {
        if (window.adminState.userChartInstance) {
            window.adminState.userChartInstance.destroy();
        }
        window.adminState.userChartInstance = new Chart(ctxUsers, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'New Signups',
                    data: userData,
                    backgroundColor: '#111111',
                    hoverBackgroundColor: '#000000',
                    borderRadius: 4,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#F5F5F5' }, border: { display: false } },
                    x: { grid: { display: false }, border: { display: false } }
                }
            }
        });
    }

    // 2. Website Traffic Chart (Line Chart)
    const ctxVisits = document.getElementById('adminVisitsChart');
    if (ctxVisits) {
        if (window.adminState.visitChartInstance) {
            window.adminState.visitChartInstance.destroy();
        }
        window.adminState.visitChartInstance = new Chart(ctxVisits, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Visits',
                    data: visitData,
                    borderColor: '#666666',
                    backgroundColor: 'rgba(102, 102, 102, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#666666',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#F5F5F5' }, border: { display: false } },
                    x: { grid: { display: false }, border: { display: false } }
                }
            }
        });
    }
}

// --- 3. Blog Management Tab ---

// Register a custom BlockEmbed blot so Quill stores <pre class="ql-diagram"> as a
// single immutable embed — this is the only way to prevent Quill's Delta engine
// from collapsing whitespace / newlines inside a pre block.
function registerDiagramBlot() {
    if (typeof Quill === 'undefined') return;
    try { if (Quill.find && Quill.find('diagram')) return; } catch(e) {}
    try {
        const BlockEmbed = Quill.import('blots/block/embed');
        class DiagramBlot extends BlockEmbed {
            static create(value) {
                const node = super.create();
                node.textContent = typeof value === 'string' ? value : '';
                return node;
            }
            static value(domNode) { return domNode.textContent; }
        }
        DiagramBlot.blotName  = 'diagram';
        DiagramBlot.tagName   = 'pre';
        DiagramBlot.className = 'ql-diagram';
        Quill.register(DiagramBlot, true);
    } catch(e) { console.warn('DiagramBlot registration failed:', e); }
}

function initQuill() {
    const editorEl = document.getElementById('blog-quill-editor');
    if (editorEl && typeof Quill !== 'undefined' && !window.adminState.quill) {
        registerDiagramBlot();

        window.adminState.quill = new Quill('#blog-quill-editor', {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'align': [] }],
                        ['link', 'clean']
                    ]
                }
            }
        });

        const quill = window.adminState.quill;
        const toolbar = quill.getModule('toolbar');
        const toolbarContainer = toolbar.container;

        // Add tooltips to every standard toolbar button
        const tipMap = {
            'ql-bold':       'Bold (Ctrl+B)',
            'ql-italic':     'Italic (Ctrl+I)',
            'ql-underline':  'Underline (Ctrl+U)',
            'ql-strike':     'Strikethrough',
            'ql-blockquote': 'Blockquote',
            'ql-code-block': 'Code Block',
            'ql-link':       'Insert / Edit Link',
            'ql-clean':      'Remove Formatting',
            'ql-header':     'Heading Level',
            'ql-list':       'List',
            'ql-color':      'Text Colour',
            'ql-background': 'Highlight Colour',
            'ql-align':      'Text Alignment',
        };
        toolbarContainer.querySelectorAll('button, .ql-picker-label').forEach(el => {
            for (const [cls, tip] of Object.entries(tipMap)) {
                if (el.classList.contains(cls) && !el.title) {
                    el.title = tip;
                    break;
                }
            }
        });

        // Append an icon-only "Diagram" button (no visible text, tooltip only)
        const diagramGroup = document.createElement('span');
        diagramGroup.className = 'ql-formats';
        const diagramBtn = document.createElement('button');
        diagramBtn.type = 'button';
        diagramBtn.className = 'ql-diagram-insert';
        diagramBtn.title = 'Insert ASCII / Text Diagram';
        diagramBtn.innerHTML = `<svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2"  y="1"  width="14" height="4" rx="1"/>
            <rect x="1"  y="13" width="7"  height="4" rx="1"/>
            <rect x="10" y="13" width="7"  height="4" rx="1"/>
            <line x1="9"  y1="5"  x2="9"  y2="9"/>
            <line x1="4"  y1="9"  x2="14" y2="9"/>
            <line x1="4"  y1="9"  x2="4"  y2="13"/>
            <line x1="14" y1="9" x2="14" y2="13"/>
        </svg>`;
        diagramBtn.addEventListener('click', () => window.openDiagramModal());
        diagramGroup.appendChild(diagramBtn);
        toolbarContainer.appendChild(diagramGroup);
    }
}

// Diagram Modal Helpers
window.openDiagramModal = function () {
    const modal = document.getElementById('diagram-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    const ta = document.getElementById('diagram-textarea');
    if (ta) { ta.value = ''; setTimeout(() => ta.focus(), 50); }
};

window.closeDiagramModal = function () {
    const modal = document.getElementById('diagram-modal');
    if (modal) modal.style.display = 'none';
};

window.insertDiagramToEditor = function () {
    const ta = document.getElementById('diagram-textarea');
    const text = ta ? ta.value : '';
    if (!text.trim()) { window.closeDiagramModal(); return; }

    const quill = window.adminState.quill;
    if (!quill) return;

    // insertEmbed with the registered 'diagram' blot — Quill stores the pre block
    // as a single atomic node, so every space and newline is preserved verbatim.
    const range = quill.getSelection(true) || { index: quill.getLength() - 1, length: 0 };
    quill.insertEmbed(range.index, 'diagram', text, 'user');
    quill.setSelection(range.index + 1, 0, 'silent');

    window.closeDiagramModal();
};



async function loadBlogData() {
    await window.backendReady;
    const res = await window.apiCall('get_blogs');
    if (res && Array.isArray(res)) {
        window.adminState.blogs = res;
    } else {
        console.error("Failed to load blogs:", res);
        window.adminState.blogs = [];
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

    if (window.adminState.blogs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="p-8 text-center text-secondary font-light">No articles published. Click 'Add Article' to create one.</td>
            </tr>
        `;
        return;

    }

    tbody.innerHTML = window.adminState.blogs.map(post => `
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
            if (window.adminState.quill) window.adminState.quill.setContents([]); // Clear Quill text
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
    const post = window.adminState.blogs.find(b => b.id == id);
    if (!post) return;

    // Make sure Quill is initialized
    initQuill();

    document.getElementById('edit-post-id').value = post.id;
    document.getElementById('blog-title').value = post.title;
    document.getElementById('blog-category').value = post.category;
    document.getElementById('blog-author').value = post.author;
    document.getElementById('blog-summary').value = post.summary;
    if (window.adminState.quill) {
        window.adminState.quill.root.innerHTML = post.content || '';
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
    const content = window.adminState.quill ? window.adminState.quill.root.innerHTML : '';

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

// --- Visit Utility Helpers ---
function parseUserJoinedDate(dateStr) {
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);
    }
    return new Date(dateStr);
}

function deduplicateUsers(list) {
    if (!list || !Array.isArray(list)) return [];
    const seen = new Set();
    return list.filter(user => {
        if (!user || !user.email) return false;
        const emailLower = user.email.toLowerCase();
        if (seen.has(emailLower)) return false;
        seen.add(emailLower);
        return true;
    });
}

function getTargetTimezoneYMD() {
    const now = new Date();
    // Shift milliseconds by the target offset to find the target local date components
    const targetTime = new Date(now.getTime() + (TARGET_TIMEZONE_OFFSET_MINUTES * 60000));
    return {
        year: targetTime.getUTCFullYear(),
        month: targetTime.getUTCMonth(),
        day: targetTime.getUTCDate()
    };
}

function getPresetDateRange(preset) {
    const targetYMD = getTargetTimezoneYMD();
    // Create Date object at midnight UTC using target timezone date parts
    const startOfTodayUTC = new Date(Date.UTC(targetYMD.year, targetYMD.month, targetYMD.day));
    
    let start = null;
    let end = startOfTodayUTC;

    switch (preset) {
        case 'today':
            start = startOfTodayUTC;
            break;
        case 'yesterday':
            const yesterday = new Date(startOfTodayUTC);
            yesterday.setUTCDate(startOfTodayUTC.getUTCDate() - 1);
            start = yesterday;
            end = yesterday;
            break;
        case 'last-7-days':
            const sevenDaysAgo = new Date(startOfTodayUTC);
            sevenDaysAgo.setUTCDate(startOfTodayUTC.getUTCDate() - 6);
            start = sevenDaysAgo;
            break;
        case 'last-30-days':
            const thirtyDaysAgo = new Date(startOfTodayUTC);
            thirtyDaysAgo.setUTCDate(startOfTodayUTC.getUTCDate() - 29);
            start = thirtyDaysAgo;
            break;
        case 'this-month':
            start = new Date(Date.UTC(targetYMD.year, targetYMD.month, 1));
            break;
        case 'last-month':
            start = new Date(Date.UTC(targetYMD.year, targetYMD.month - 1, 1));
            end = new Date(Date.UTC(targetYMD.year, targetYMD.month, 0));
            break;
        case 'all-time':
        default:
            return { startStr: '', endStr: '' };
    }

    const formatDate = (d) => {
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        startStr: formatDate(start),
        endStr: formatDate(end)
    };
}

function formatLocalShortDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr).substring(0, 10);
        
        // Add target timezone offset in minutes to target epoch milliseconds
        const targetTime = new Date(d.getTime() + (TARGET_TIMEZONE_OFFSET_MINUTES * 60000));
        const year = targetTime.getUTCFullYear();
        const month = String(targetTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(targetTime.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return String(dateStr).substring(0, 10);
    }
}

async function loadUserData() {
    if (window.adminState.isLoadingUsers) return;
    window.adminState.isLoadingUsers = true;

    await window.backendReady;

    const searchInput = document.getElementById('users-search-input');
    const query = searchInput ? searchInput.value.trim() : '';

    const startDateInput = document.getElementById('users-start-date');
    const endDateInput = document.getElementById('users-end-date');
    
    // Normalise UI bounds to UTC ISO strings
    const startDateVal = startDateInput ? startDateInput.value : '';
    const endDateVal = endDateInput ? endDateInput.value : '';
    const startDate = getLocalDateBounds(startDateVal, false);
    const endDate = getLocalDateBounds(endDateVal, true);

    const startIso = startDate ? startDate.toISOString() : null;
    const endIso = endDate ? endDate.toISOString() : null;

    try {
        const res = await window.apiCall('get_filtered_users', {
            search: query,
            start_date: startIso,
            end_date: endIso
        });

        if (res && Array.isArray(res)) {
            window.adminState.usersList = res.map(u => ({
                name: u.name,
                email: u.email,
                date: u.date,
                status: u.status,
                rangeVisits: u.range_visits,
                totalVisits: u.total_visits
            }));
        } else {
            console.error("Failed to load users:", res);
            window.adminState.usersList = [];
        }
    } catch (e) {
        console.error("Error loading users:", e);
        window.adminState.usersList = [];
    } finally {
        window.adminState.isLoadingUsers = false;
    }

    filterAndRenderUsers();
}

function getLocalDateBounds(dateStr, isEnd = false) {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    let utcMs;
    if (isEnd) {
        utcMs = Date.UTC(year, month, day, 23, 59, 59, 999);
    } else {
        utcMs = Date.UTC(year, month, day, 0, 0, 0, 0);
    }
    
    // Subtract target timezone offset to translate target local day bounds back to UTC Date
    return new Date(utcMs - (TARGET_TIMEZONE_OFFSET_MINUTES * 60000));
}

function filterAndRenderUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    const filteredUsers = deduplicateUsers(window.adminState.usersList);

    // Cache filtered list for PDF export
    window.adminState.currentFilteredUsers = filteredUsers;
    window.currentFilteredUsers = filteredUsers; // compatibility fallback

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="p-8 text-center text-secondary font-light">No clients found matching the search criteria.</td>
            </tr>
        `;
        return;
    }

    const startDateInput = document.getElementById('users-start-date');
    const endDateInput = document.getElementById('users-end-date');
    const isFiltered = !!(startDateInput?.value || endDateInput?.value);

    tbody.innerHTML = filteredUsers.map((user, idx) => `
        <tr class="border-b border-border hover:bg-surface transition-colors">
            <td class="p-4 font-bold text-primary">${window.escapeHtml(user.name)}</td>
            <td class="p-4 text-xs font-mono text-secondary">${window.escapeHtml(user.email)}</td>
            <td class="p-4 text-xs text-secondary">${window.escapeHtml(formatLocalShortDate(user.date))}</td>
            <td class="p-4 text-xs font-bold text-primary">
                ${isFiltered ? `${user.rangeVisits || 0} <span class="text-secondary font-normal text-[10px]">/ ${user.totalVisits || 0}</span>` : (user.totalVisits || 0)}
            </td>
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
    const startDateInput = document.getElementById('users-start-date');
    const endDateInput = document.getElementById('users-end-date');
    const startDateVal = startDateInput ? startDateInput.value : '';
    const endDateVal = endDateInput ? endDateInput.value : '';
    let separatorY = 38;
    let summaryY = 48;
    
    if (startDateVal || endDateVal) {
        const rangeText = `Date Range: ${startDateVal || 'Beginning'} to ${endDateVal || 'End'}`;
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

    // Get the filtered users (deduplicated)
    const filteredList = deduplicateUsers(window.adminState.currentFilteredUsers);

    // Summary Analytics
    const totalUsers = filteredList.length;
    const isFiltered = !!(startDateVal || endDateVal);
    const totalVisits = filteredList.reduce((sum, u) => sum + (Number(isFiltered ? u.rangeVisits : u.totalVisits) || 0), 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text(`Total Users: ${totalUsers}`, 14, summaryY);
    const visitsSummaryLabel = isFiltered ? `Selected Range Visits: ${totalVisits}` : `Total Recorded Visits: ${totalVisits}`;
    doc.text(visitsSummaryLabel, 80, summaryY);

    // Generate table contents
    const visitsHeader = isFiltered ? "Visits (Range / Total)" : "Total Visits";
    const headers = [["Client Name", "Email Address", visitsHeader]];
    const data = filteredList.map(u => {
        const visitsText = isFiltered ? `${u.rangeVisits || 0} / ${u.totalVisits || 0}` : String(u.totalVisits || 0);
        return [
            u.name || "N/A",
            u.email || "N/A",
            visitsText
        ];
    });

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
            0: { cellWidth: 60 },
            1: { cellWidth: 90 },
            2: { cellWidth: 36, halign: 'right' }
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
    const settings = await window.apiCall('get_admin_settings') || {};
    document.getElementById('settings-sitename').value = settings.siteName || 'DIGINIXIT.';
    document.getElementById('settings-email').value = settings.contactEmail || 'contact@diginix.com';
    document.getElementById('settings-phone').value = settings.contactPhone || '';
    document.getElementById('settings-maintenance').checked = settings.maintenanceMode || false;
    document.getElementById('settings-linkedin').value = settings.linkedin || '';
    document.getElementById('settings-instagram').value = settings.instagram || '';
    document.getElementById('settings-twitter').value = settings.twitter || '';
    document.getElementById('settings-facebook').value = settings.facebook || '';
    document.getElementById('settings-youtube').value = settings.youtube || '';
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
    const facebook = document.getElementById('settings-facebook').value.trim();
    const youtube = document.getElementById('settings-youtube').value.trim();

    const newSettings = { siteName, contactEmail, contactPhone, maintenanceMode, linkedin, instagram, twitter, facebook, youtube, _csrf_token: window.csrfToken };

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

// Realtime Subscription handler
function subscribeToRealtime() {
    if (!window.useSupabase || !window.supabase) return null;

    const reloadActiveTab = () => {
        const activeTab = window.adminState.activeTab;
        console.log("Realtime event triggered reload of tab:", activeTab);
        if (activeTab === 'analytics') {
            loadAnalyticsData();
        } else if (activeTab === 'blog') {
            loadBlogData();
        } else if (activeTab === 'users') {
            loadUserData();
        } else if (activeTab === 'settings') {
            loadSettingsData();
        }
    };

    const channel = window.supabase.channel('admin-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'visit_logs' }, reloadActiveTab)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, reloadActiveTab)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stats' }, reloadActiveTab)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'blogs' }, reloadActiveTab)
        .subscribe();

    return channel;
}

// Initial Start
document.addEventListener('DOMContentLoaded', async () => {
    await window.backendReady;
    initTabs();
    await loadAnalyticsData();
    subscribeToRealtime();

    // Attach listener to search input
    const searchInput = document.getElementById('users-search-input');
    let searchDebounceTimeout = null;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimeout);
            searchDebounceTimeout = setTimeout(() => {
                loadUserData();
            }, 300);
        });
    }

    // Attach listeners to calendar date inputs and presets dropdown
    const startDateInput = document.getElementById('users-start-date');
    const endDateInput = document.getElementById('users-end-date');
    const clearDateBtn = document.getElementById('users-clear-date');
    const presetSelect = document.getElementById('users-date-preset');

    const resetPresetToCustom = () => {
        if (presetSelect) presetSelect.value = 'custom';
        loadUserData();
    };

    if (startDateInput) {
        startDateInput.addEventListener('change', resetPresetToCustom);
    }
    if (endDateInput) {
        endDateInput.addEventListener('change', resetPresetToCustom);
    }

    if (presetSelect) {
        presetSelect.addEventListener('change', () => {
            const val = presetSelect.value;
            if (val === 'custom') return;
            const { startStr, endStr } = getPresetDateRange(val);
            if (startDateInput) startDateInput.value = startStr;
            if (endDateInput) endDateInput.value = endStr;
            loadUserData();
        });
    }

    if (clearDateBtn) {
        clearDateBtn.addEventListener('click', () => {
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';
            if (presetSelect) presetSelect.value = 'all-time';
            loadUserData();
        });
    }
});
