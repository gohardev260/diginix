// DiginixIT Admin Dashboard Logic

// Target timezone: Pakistan Standard Time (PKT, UTC+5)
const TARGET_TIMEZONE_OFFSET_MINUTES = 5 * 60;

window.adminState = {
    revenueChartInstance: null,
    userChartInstance: null,
    visitChartInstance: null,
    deviceChartInstance: null,
    retentionChartInstance: null,
    topPagesChartInstance: null,
    locationsChartInstance: null,
    bounceChartInstance: null,
    blogs: [],
    usersList: [],
    quill: null,
    currentFilteredUsers: [],
    visitLogsList: [],
    activeTab: 'analytics',
    isLoadingUsers: false,
    blogFilter: 'all',
    analyticsPreset: '30d'
};

// ── Tab Control Logic ────────────────────────────────────────────────
function initTabs() {
    const sidebarBtns = document.querySelectorAll('.admin-tab-btn');
    const mobileBtns = document.querySelectorAll('.mobile-tab-btn');
    const contents = document.querySelectorAll('.admin-tab-content');

    function switchTab(tabId) {
        window.adminState.activeTab = tabId;
        sidebarBtns.forEach(btn => {
            const match = btn.getAttribute('data-tab') === tabId;
            btn.className = match ?
                "w-full flex items-center text-sm px-4 py-3 rounded-lg bg-primary text-white font-medium hover:bg-black transition-colors admin-tab-btn" :
                "w-full flex items-center text-sm px-4 py-3 rounded-lg text-secondary hover:bg-surface hover:text-primary transition-colors admin-tab-btn font-medium";
        });
        mobileBtns.forEach(btn => {
            const match = btn.getAttribute('data-tab') === tabId;
            btn.className = match ?
                "px-4 py-2 bg-primary text-white text-xs font-bold rounded-full whitespace-nowrap mobile-tab-btn" :
                "px-4 py-2 bg-white text-secondary text-xs font-bold rounded-full whitespace-nowrap border border-border mobile-tab-btn";
        });
        contents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });

        if (tabId === 'analytics') loadAnalyticsData();
        else if (tabId === 'blog') loadBlogData();
        else if (tabId === 'users') loadUserData();
        else if (tabId === 'settings') loadSettingsData();
    }

    sidebarBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab'))));
    mobileBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab'))));
}

// ── Analytics: Timeline Preset Helpers ──────────────────────────────
function getAnalyticsDateRange(preset) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start, end = new Date(today.getTime() + 86400000 - 1); // end of today

    switch (preset) {
        case '7d':
            start = new Date(today); start.setDate(today.getDate() - 6);
            break;
        case '30d':
            start = new Date(today); start.setDate(today.getDate() - 29);
            break;
        case '90d':
            start = new Date(today); start.setDate(today.getDate() - 89);
            break;
        case '1y':
            start = new Date(today); start.setFullYear(today.getFullYear() - 1);
            break;
        case 'all':
        default:
            start = new Date(2020, 0, 1);
            break;
    }
    return { start, end };
}

function getPresetLabel(preset) {
    const labels = { '7d': 'Last 7 Days', '30d': 'Last 30 Days', '90d': 'Last 90 Days', '1y': 'Last Year', 'all': 'All Time' };
    return labels[preset] || preset;
}

// ── Dynamic Bucketing Logic for Real Data ───────────────────────────
function generateBuckets(startDate, endDate) {
    const buckets = [];
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays <= 1.1) {
        // Hourly buckets for a single day
        const baseDate = new Date(startDate);
        baseDate.setHours(0, 0, 0, 0);
        for (let h = 0; h < 24; h++) {
            const bStart = new Date(baseDate);
            bStart.setHours(h, 0, 0, 0);
            const bEnd = new Date(baseDate);
            bEnd.setHours(h, 59, 59, 999);
            
            let label = h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`;
            buckets.push({ start: bStart, end: bEnd, label, visits: 0, signups: 0, duration: 0, durationCount: 0, bounces: 0, sessions: {} });
        }
    } else if (diffDays <= 31) {
        // Daily buckets
        const current = new Date(startDate);
        current.setHours(0, 0, 0, 0);
        const limit = new Date(endDate);
        limit.setHours(23, 59, 59, 999);

        while (current <= limit) {
            const bStart = new Date(current);
            const bEnd = new Date(current);
            bEnd.setHours(23, 59, 59, 999);
            
            const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const label = `${shortMonths[current.getMonth()]} ${current.getDate()}`;
            
            buckets.push({ start: bStart, end: bEnd, label, visits: 0, signups: 0, duration: 0, durationCount: 0, bounces: 0, sessions: {} });
            current.setDate(current.getDate() + 1);
        }
    } else if (diffDays <= 180) {
        // Weekly buckets
        const current = new Date(startDate);
        current.setHours(0, 0, 0, 0);
        const limit = new Date(endDate);
        limit.setHours(23, 59, 59, 999);

        while (current <= limit) {
            const bStart = new Date(current);
            const bEnd = new Date(current);
            bEnd.setDate(bEnd.getDate() + 6);
            bEnd.setHours(23, 59, 59, 999);
            
            const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const label = `Wk of ${shortMonths[current.getMonth()]} ${current.getDate()}`;
            
            buckets.push({ start: bStart, end: bEnd, label, visits: 0, signups: 0, duration: 0, durationCount: 0, bounces: 0, sessions: {} });
            current.setDate(current.getDate() + 7);
        }
    } else {
        // Monthly buckets
        const current = new Date(startDate);
        current.setDate(1);
        current.setHours(0, 0, 0, 0);
        const limit = new Date(endDate);
        limit.setHours(23, 59, 59, 999);

        while (current <= limit) {
            const bStart = new Date(current);
            const bEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);
            
            const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const label = `${shortMonths[current.getMonth()]} ${current.getFullYear()}`;
            
            buckets.push({ start: bStart, end: bEnd, label, visits: 0, signups: 0, duration: 0, durationCount: 0, bounces: 0, sessions: {} });
            current.setMonth(current.getMonth() + 1);
        }
    }
    return buckets;
}

// Helper to calculate statistics of a logs subset
function calculateCollectionStats(filteredLogs) {
    const totalVisits = filteredLogs.length;
    
    // Unique active users (sessions or emails)
    const activeUserSessions = new Set();
    filteredLogs.forEach(log => {
        if (log.session_id) activeUserSessions.add(log.session_id);
        else if (log.email) activeUserSessions.add(log.email.toLowerCase());
    });
    const activeUsers = activeUserSessions.size;

    // Session durations and bounces
    const sessions = {};
    filteredLogs.forEach(log => {
        const sId = log.session_id || log.email || 'anon';
        const d = new Date(log.visited_at).getTime();
        sessions[sId] = sessions[sId] || [];
        sessions[sId].push(d);
    });

    let totalDuration = 0;
    let totalSessions = 0;
    let bounces = 0;

    for (const sId in sessions) {
        const times = sessions[sId];
        totalSessions++;
        if (times.length === 1) {
            bounces++;
            totalDuration += 15; // default 15 seconds bounce visit
        } else {
            times.sort((a, b) => a - b);
            const diffSec = (times[times.length - 1] - times[0]) / 1000;
            totalDuration += diffSec;
        }
    }

    const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
    const bounceRate = totalSessions > 0 ? Math.round((bounces / totalSessions) * 100) : 0;

    return { totalVisits, activeUsers, avgDuration, bounceRate };
}

// ── Analytics: Main Load ─────────────────────────────────────────────
async function loadAnalyticsData() {
    await window.backendReady;
    
    let logs = [];
    let users = [];
    try {
        const [logsRes, usersRes] = await Promise.all([
            window.apiCall('get_visit_logs'),
            window.apiCall('get_filtered_users', { search: '' })
        ]);
        logs = Array.isArray(logsRes) ? logsRes : [];
        users = Array.isArray(usersRes) ? usersRes : [];
    } catch (e) {
        console.error("Failed to load real logs or users:", e);
    }

    // Determine bounds
    const preset = window.adminState.analyticsPreset;
    let startDate, endDate;
    
    if (preset === 'custom') {
        const startVal = document.getElementById('analytics-start-date')?.value;
        const endVal = document.getElementById('analytics-end-date')?.value;
        startDate = getLocalDateBounds(startVal, false) || new Date(Date.now() - 30 * 86400000);
        endDate = getLocalDateBounds(endVal, true) || new Date();
    } else {
        const range = getAnalyticsDateRange(preset);
        startDate = range.start;
        endDate = range.end;
        
        // Sync UI date pickers
        const startInput = document.getElementById('analytics-start-date');
        const endInput = document.getElementById('analytics-end-date');
        if (startInput) startInput.value = startDate.toISOString().slice(0, 10);
        if (endInput) endInput.value = endDate.toISOString().slice(0, 10);
    }

    // Prior period bounds for comparison
    const rangeDurationMs = endDate.getTime() - startDate.getTime();
    const priorEndDate = new Date(startDate.getTime() - 1);
    const priorStartDate = new Date(startDate.getTime() - rangeDurationMs);

    // Filter current and prior
    const filterLogsByRange = (list, start, end) => list.filter(log => {
        const d = new Date(log.visited_at);
        return d >= start && d <= end;
    });
    const filterUsersByRange = (list, start, end) => list.filter(u => {
        const d = new Date(u.date);
        return d >= start && d <= end;
    });

    const currentLogs = filterLogsByRange(logs, startDate, endDate);
    const priorLogs = filterLogsByRange(logs, priorStartDate, priorEndDate);
    const currentUsers = filterUsersByRange(users, startDate, endDate);
    const priorUsers = filterUsersByRange(users, priorStartDate, priorEndDate);

    // Compute metrics
    const currentStats = calculateCollectionStats(currentLogs);
    const priorStats = calculateCollectionStats(priorLogs);

    // Sync Stats Row KPI UI
    const formatDuration = (s) => {
        if (s < 60) return `${s}s`;
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}m ${sec}s`;
    };

    document.getElementById('stat-users').innerText = currentStats.activeUsers.toLocaleString();
    document.getElementById('stat-visits').innerText = currentStats.totalVisits.toLocaleString();
    document.getElementById('stat-session').innerText = formatDuration(currentStats.avgDuration);
    document.getElementById('stat-bounce').innerText = `${currentStats.bounceRate}%`;

    const updateChangeLabel = (elementId, current, prior) => {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        let percent = 0;
        if (prior > 0) {
            percent = Math.round(((current - prior) / prior) * 100);
        } else if (current > 0) {
            percent = 100;
        }
        
        if (percent > 0) {
            el.innerText = `+${percent}% vs last period`;
            el.className = "text-[10px] text-green-500 font-semibold mt-1";
        } else if (percent < 0) {
            el.innerText = `${percent}% vs last period`;
            el.className = "text-[10px] text-red-500 font-semibold mt-1";
        } else {
            el.innerText = `0% vs last period`;
            el.className = "text-[10px] text-ink-mute font-medium mt-1";
        }
    };

    updateChangeLabel('stat-users-change', currentStats.activeUsers, priorStats.activeUsers);
    updateChangeLabel('stat-visits-change', currentStats.totalVisits, priorStats.totalVisits);
    updateChangeLabel('stat-session-change', currentStats.avgDuration, priorStats.avgDuration);
    updateChangeLabel('stat-bounce-change', currentStats.bounceRate, priorStats.bounceRate);

    // Update traffic period label
    const trafficLabel = document.getElementById('traffic-period-label');
    if (trafficLabel) trafficLabel.textContent = getPresetLabel(preset);

    // Populate Buckets
    const buckets = generateBuckets(startDate, endDate);
    buckets.forEach(bucket => {
        const bLogs = currentLogs.filter(log => {
            const d = new Date(log.visited_at);
            return d >= bucket.start && d <= bucket.end;
        });
        const bUsers = currentUsers.filter(u => {
            const d = new Date(u.date);
            return d >= bucket.start && d <= bucket.end;
        });

        const bStats = calculateCollectionStats(bLogs);
        bucket.visits = bStats.totalVisits;
        bucket.signups = bUsers.length;
        bucket.duration = bStats.avgDuration;
        bucket.bounceRate = bStats.bounceRate;
    });

    const chartLabels = buckets.map(b => b.label);
    const visitHistoryData = buckets.map(b => b.visits);
    const signupHistoryData = buckets.map(b => b.signups);
    const retentionHistoryData = buckets.map(b => b.duration);
    const bounceHistoryData = buckets.map(b => b.bounceRate);

    // Device breakdown
    const devices = { Desktop: 0, Mobile: 0, Tablet: 0 };
    currentLogs.forEach(log => {
        let d = log.device;
        if (!d && log.user_agent) {
            if (/Mobi|Android|iPhone|iPod/i.test(log.user_agent)) d = 'Mobile';
            else if (/iPad/i.test(log.user_agent)) d = 'Tablet';
            else d = 'Desktop';
        }
        d = d || 'Desktop';
        devices[d] = (devices[d] || 0) + 1;
    });
    const totalDevices = devices.Desktop + devices.Mobile + devices.Tablet;
    const devicePct = totalDevices > 0 ? [
        Math.round((devices.Desktop / totalDevices) * 100),
        Math.round((devices.Mobile / totalDevices) * 100),
        Math.round((devices.Tablet / totalDevices) * 100)
    ] : [100, 0, 0];

    // Top Pages
    const pagesMap = {};
    currentLogs.forEach(log => {
        const url = log.page_url || '/home';
        pagesMap[url] = (pagesMap[url] || 0) + 1;
    });
    const sortedPages = Object.entries(pagesMap).sort((a,b)=>b[1]-a[1]).slice(0, 6);
    const topPagesLabels = sortedPages.length > 0 ? sortedPages.map(e=>e[0]) : ['/home', '/blog', '/services'];
    const topPagesData = sortedPages.length > 0 ? sortedPages.map(e=>e[1]) : [0, 0, 0];

    // Visitor Countries
    const countryMap = {};
    currentLogs.forEach(log => {
        const country = log.country || 'Unknown';
        countryMap[country] = (countryMap[country] || 0) + 1;
    });
    const sortedCountries = Object.entries(countryMap).sort((a,b)=>b[1]-a[1]).slice(0, 6);
    const countryLabels = sortedCountries.length > 0 ? sortedCountries.map(e=>e[0]) : ['Pakistan', 'United States', 'United Kingdom'];
    const countryData = sortedCountries.length > 0 ? sortedCountries.map(e=>e[1]) : [0, 0, 0];

    renderAnalyticsCharts(
        chartLabels, signupHistoryData, visitHistoryData, retentionHistoryData, bounceHistoryData,
        devicePct, topPagesLabels, topPagesData, countryLabels, countryData
    );

    renderRecentVisitorsList(currentLogs);
}

// ── Analytics: Destroy all chart instances ───────────────────────────
function destroyAllCharts() {
    const instances = [
        'visitChartInstance', 'userChartInstance', 'deviceChartInstance',
        'retentionChartInstance', 'topPagesChartInstance', 'locationsChartInstance',
        'bounceChartInstance'
    ];
    instances.forEach(key => {
        if (window.adminState[key]) {
            try { window.adminState[key].destroy(); } catch(e) {}
            window.adminState[key] = null;
        }
    });
}

// ── Analytics: Render All 8 Charts (Solid Colors, No Gradients) ──────
function renderAnalyticsCharts(
    labels, userData, visitData, retentionData, bounceData, 
    devicePct, topPagesLabels, topPagesData, countryLabels, countryData
) {
    destroyAllCharts();

    // ── Chart 1: Website Traffic Trendline (Solid Area/Line) ─────────
    const ctxVisits = document.getElementById('adminVisitsChart');
    if (ctxVisits) {
        window.adminState.visitChartInstance = new Chart(ctxVisits, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Visits',
                    data: visitData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 1.5,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#171717', titleColor: '#fff', bodyColor: '#fafafa',
                        padding: 10, cornerRadius: 6,
                        callbacks: { label: ctx => ` ${ctx.parsed.y.toLocaleString()} visits` }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f0f0f0', lineWidth: 1 },
                        border: { display: false },
                        ticks: { color: '#888', font: { size: 10 } }
                    },
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { color: '#888', font: { size: 10 }, maxTicksLimit: 12 }
                    }
                }
            }
        });
    }

    // ── Chart 2: Device Breakdown Doughnut (Solid Colors) ────────────
    const ctxDevice = document.getElementById('adminDeviceChart');
    if (ctxDevice) {
        const deviceLabels = ['Desktop', 'Mobile', 'Tablet'];
        const deviceColors = ['#6366f1', '#f59e0b', '#10b981'];
        window.adminState.deviceChartInstance = new Chart(ctxDevice, {
            type: 'doughnut',
            data: {
                labels: deviceLabels,
                datasets: [{
                    data: devicePct,
                    backgroundColor: deviceColors,
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#171717', titleColor: '#fff', bodyColor: '#fafafa',
                        padding: 10, cornerRadius: 6,
                        callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` }
                    }
                }
            }
        });

        // Custom legend labels
        const legend = document.getElementById('device-legend');
        if (legend) {
            legend.innerHTML = deviceLabels.map((l, i) => `
                <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#707070;font-weight:500">
                    <span style="width:8px;height:8px;border-radius:50%;background:${deviceColors[i]};display:inline-block"></span>
                    ${l} <strong style="color:#171717">${devicePct[i]}%</strong>
                </div>
            `).join('');
        }
    }

    // ── Chart 3: User Acquisitions - Slim Solid Bars ─────────────────
    const ctxUsers = document.getElementById('adminUsersChart');
    if (ctxUsers) {
        window.adminState.userChartInstance = new Chart(ctxUsers, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'New Signups',
                    data: userData,
                    backgroundColor: '#8b5cf6',
                    borderRadius: 4,
                    borderWidth: 0,
                    maxBarThickness: 16
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#171717', titleColor: '#fff', bodyColor: '#fafafa',
                        padding: 10, cornerRadius: 6
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f0f0f0', lineWidth: 1 },
                        border: { display: false },
                        ticks: { color: '#888', font: { size: 10 }, precision: 0 }
                    },
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { color: '#888', font: { size: 10 }, maxTicksLimit: 12 }
                    }
                }
            }
        });
    }

    // ── Chart 4: Session Retention Mixed Bar + Line (Solid) ──────────
    const ctxRetention = document.getElementById('adminRetentionChart');
    if (ctxRetention) {
        window.adminState.retentionChartInstance = new Chart(ctxRetention, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Duration (sec)',
                        data: retentionData,
                        backgroundColor: 'rgba(245, 158, 11, 0.25)',
                        borderRadius: 4,
                        borderWidth: 0,
                        maxBarThickness: 16,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: 'Trend',
                        data: retentionData,
                        borderColor: '#f97316',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.4,
                        pointBackgroundColor: '#f97316',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 1.5,
                        pointRadius: 2.5,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#171717', titleColor: '#fff', bodyColor: '#fafafa',
                        padding: 10, cornerRadius: 6,
                        callbacks: {
                            label: ctx => {
                                if (ctx.datasetIndex === 0) {
                                    const s = ctx.parsed.y;
                                    return ` ${Math.floor(s/60)}m ${s%60}s avg duration`;
                                }
                                return null;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f0f0f0', lineWidth: 1 },
                        border: { display: false },
                        ticks: {
                            color: '#888', font: { size: 10 },
                            callback: v => `${Math.floor(v/60)}m`
                        }
                    },
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { color: '#888', font: { size: 10 }, maxTicksLimit: 12 }
                    }
                }
            }
        });
    }

    // ── Chart 5: Top Pages Horizontal Bar (Solid Colors) ─────────────
    const ctxPages = document.getElementById('adminTopPagesChart');
    if (ctxPages) {
        window.adminState.topPagesChartInstance = new Chart(ctxPages, {
            type: 'bar',
            data: {
                labels: topPagesLabels,
                datasets: [{
                    label: 'Page Views',
                    data: topPagesData,
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                    borderWidth: 0,
                    maxBarThickness: 16
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#171717', titleColor: '#fff', bodyColor: '#fafafa',
                        padding: 10, cornerRadius: 6,
                        callbacks: { label: ctx => ` ${ctx.parsed.x.toLocaleString()} views` }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: '#f0f0f0', lineWidth: 1 },
                        border: { display: false },
                        ticks: { color: '#888', font: { size: 10 } }
                    },
                    y: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { color: '#555', font: { size: 11 } }
                    }
                }
            }
        });
    }

    // ── Chart 6: Visitor Locations Horizontal Bar (Solid Colors) ─────
    const ctxLocations = document.getElementById('adminLocationsChart');
    if (ctxLocations) {
        window.adminState.locationsChartInstance = new Chart(ctxLocations, {
            type: 'bar',
            data: {
                labels: countryLabels,
                datasets: [{
                    label: 'Visitors',
                    data: countryData,
                    backgroundColor: '#06b6d4',
                    borderRadius: 4,
                    borderWidth: 0,
                    maxBarThickness: 16
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#171717', titleColor: '#fff', bodyColor: '#fafafa',
                        padding: 10, cornerRadius: 6,
                        callbacks: { label: ctx => ` ${ctx.parsed.x.toLocaleString()} visitors` }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: '#f0f0f0', lineWidth: 1 },
                        border: { display: false },
                        ticks: { color: '#888', font: { size: 10 } }
                    },
                    y: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { color: '#555', font: { size: 11 } }
                    }
                }
            }
        });
    }

    // ── Chart 7: Bounce Rate Trendline Curve (Solid) ─────────────────
    const ctxBounce = document.getElementById('adminBounceChart');
    if (ctxBounce) {
        window.adminState.bounceChartInstance = new Chart(ctxBounce, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Bounce Rate %',
                    data: bounceData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 1.5,
                    pointRadius: 2.5,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#171717', titleColor: '#fff', bodyColor: '#fafafa',
                        padding: 10, cornerRadius: 6,
                        callbacks: { label: ctx => ` ${ctx.parsed.y}% bounce rate` }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false, min: 0, max: 100,
                        grid: { color: '#f0f0f0', lineWidth: 1 },
                        border: { display: false },
                        ticks: { color: '#888', font: { size: 10 }, callback: v => v + '%' }
                    },
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { color: '#888', font: { size: 10 }, maxTicksLimit: 12 }
                    }
                }
            }
        });
    }
}

// ── Recent Visitors List (Real Data with relative times) ────────────
function renderRecentVisitorsList(logs) {
    const list = document.getElementById('recent-visitors-list');
    if (!list) return;

    if (logs.length === 0) {
        list.innerHTML = `<div class="p-8 text-center text-xs text-secondary">No visitor logs in this period.</div>`;
        return;
    }

    // Sort logs chronologically DESC and take top 7
    const sortedLogs = logs.slice().sort((a,b) => new Date(b.visited_at) - new Date(a.visited_at)).slice(0, 7);

    const getRelativeTime = (visitedAtStr) => {
        const visitedAt = new Date(visitedAtStr);
        const diffMs = Date.now() - visitedAt.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHrs = Math.floor(diffMin / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        const diffDays = Math.floor(diffHrs / 24);
        return `${diffDays}d ago`;
    };

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#f97316', '#ec4899'];

    list.innerHTML = sortedLogs.map((log, idx) => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0f0f0">
            <div style="width:8px;height:8px;border-radius:50%;background:${colors[idx % colors.length]};flex-shrink:0"></div>
            <div style="flex:1;min-width:0">
                <div style="font-size:11px;font-weight:600;color:#171717;font-family:monospace">${window.escapeHtml(log.ip_address || '127.0.0.1')}</div>
                <div style="font-size:10px;color:#707070">${window.escapeHtml(log.country || 'Unknown')} · <span style="color:#888">${window.escapeHtml(log.page_url || '/home')}</span></div>
            </div>
            <div style="font-size:10px;color:#b2b2b2;white-space:nowrap;flex-shrink:0">${getRelativeTime(log.visited_at)}</div>
        </div>
    `).join('');
}

// ── Analytics: Timeline Preset Init ─────────────────────────────────
function initAnalyticsPresets() {
    const presetBtns = document.querySelectorAll('.analytics-preset-btn');
    const startInput = document.getElementById('analytics-start-date');
    const endInput = document.getElementById('analytics-end-date');

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active-preset'));
            btn.classList.add('active-preset');
            const preset = btn.getAttribute('data-preset');
            window.adminState.analyticsPreset = preset;

            const { start, end } = getAnalyticsDateRange(preset);
            if (startInput) startInput.value = start.toISOString().slice(0,10);
            if (endInput) endInput.value = end.toISOString().slice(0,10);

            loadAnalyticsData();
        });
    });

    // Custom date range
    [startInput, endInput].forEach(inp => {
        if (!inp) return;
        inp.addEventListener('change', () => {
            presetBtns.forEach(b => b.classList.remove('active-preset'));
            window.adminState.analyticsPreset = 'custom';
            loadAnalyticsData();
        });
    });

    // Default bounds (30d)
    const { start, end } = getAnalyticsDateRange('30d');
    if (startInput) startInput.value = start.toISOString().slice(0, 10);
    if (endInput) endInput.value = end.toISOString().slice(0, 10);
}

// ── Blog Management Tab ──────────────────────────────────────────────

// Quill DiagramBlot registration
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

        const tipMap = {
            'ql-bold': 'Bold (Ctrl+B)', 'ql-italic': 'Italic (Ctrl+I)',
            'ql-underline': 'Underline (Ctrl+U)', 'ql-strike': 'Strikethrough',
            'ql-blockquote': 'Blockquote', 'ql-code-block': 'Code Block',
            'ql-link': 'Insert / Edit Link', 'ql-clean': 'Remove Formatting',
            'ql-header': 'Heading Level', 'ql-list': 'List',
            'ql-color': 'Text Colour', 'ql-background': 'Highlight Colour',
            'ql-align': 'Text Alignment'
        };
        toolbarContainer.querySelectorAll('button, .ql-picker-label').forEach(el => {
            for (const [cls, tip] of Object.entries(tipMap)) {
                if (el.classList.contains(cls) && !el.title) { el.title = tip; break; }
            }
        });

        // Diagram button
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

// Diagram Modal helpers
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
    const range = quill.getSelection(true) || { index: quill.getLength() - 1, length: 0 };
    quill.insertEmbed(range.index, 'diagram', text, 'user');
    quill.setSelection(range.index + 1, 0, 'silent');
    window.closeDiagramModal();
};

// ── Blog: Load & Filter ──────────────────────────────────────────────
async function loadBlogData() {
    await window.backendReady;
    const res = await window.apiCall('get_blogs');
    if (res && Array.isArray(res)) {
        window.adminState.blogs = res;
    } else {
        window.adminState.blogs = [];
        const tbody = document.getElementById('blog-table-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-red-500 font-bold">
                Error loading articles: ${res && res.error ? window.escapeHtml(res.error) : 'Unknown error'}
            </td></tr>`;
        }
        return;
    }
    renderBlogTable();
}

function renderBlogTable() {
    const tbody = document.getElementById('blog-table-body');
    if (!tbody) return;

    const filter = window.adminState.blogFilter;
    let posts = window.adminState.blogs;

    if (filter === 'published') posts = posts.filter(p => p.status !== 'draft');
    else if (filter === 'draft') posts = posts.filter(p => p.status === 'draft');

    if (posts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-secondary font-light">No articles found.</td></tr>`;
        return;
    }

    tbody.innerHTML = posts.map(post => {
        const isDraft = post.status === 'draft';
        const statusBadge = isDraft
            ? `<span class="badge-draft">&#9679; Draft</span>`
            : `<span class="badge-published">&#9679; Published</span>`;
        return `
        <tr class="border-b border-border hover:bg-surface transition-colors">
            <td class="p-4 font-bold text-primary max-w-xs truncate">${window.escapeHtml(post.title)}</td>
            <td class="p-4"><span class="px-2.5 py-1 bg-surface border border-border text-xs rounded-full uppercase tracking-wider text-secondary">${window.escapeHtml(post.category)}</span></td>
            <td class="p-4 text-secondary text-xs">${window.escapeHtml(post.author)}</td>
            <td class="p-4">${statusBadge}</td>
            <td class="p-4 text-secondary text-xs">${window.escapeHtml(formatLocalShortDate(post.date))}</td>
            <td class="p-4 text-right space-x-2">
                <button class="text-xs font-semibold text-primary hover:underline edit-blog-btn" data-id="${post.id}">Edit</button>
                <button class="text-xs font-semibold text-red-500 hover:underline delete-blog-btn" data-id="${post.id}">Delete</button>
            </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('.edit-blog-btn').forEach(btn => {
        btn.addEventListener('click', e => window.editBlogPost(e.currentTarget.getAttribute('data-id')));
    });
    tbody.querySelectorAll('.delete-blog-btn').forEach(btn => {
        btn.addEventListener('click', e => window.deleteBlogPost(e.currentTarget.getAttribute('data-id')));
    });
}

function initBlogFilterTabs() {
    document.querySelectorAll('.blog-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.blog-filter-btn').forEach(b => b.classList.remove('active-filter'));
            btn.classList.add('active-filter');
            window.adminState.blogFilter = btn.getAttribute('data-filter');
            renderBlogTable();
        });
    });
}

const editorPanel = document.getElementById('blog-editor-panel');
const editorContent = document.getElementById('blog-editor-content');

window.toggleBlogModal = function (show, isEdit = false) {
    if (!editorPanel || !editorContent) return;
    initQuill();
    if (show) {
        if (!isEdit) {
            document.getElementById('edit-post-id').value = '';
            document.getElementById('blog-title').value = '';
            document.getElementById('blog-category').value = '';
            document.getElementById('blog-author').value = '';
            document.getElementById('blog-summary').value = '';
            if (window.adminState.quill) window.adminState.quill.setContents([]);
            document.getElementById('blog-editor-title').innerText = 'Write New Article';
        }
        editorPanel.classList.remove('pointer-events-none');
        gsap.to(editorPanel, { opacity: 1, duration: 0.3 });
        gsap.to(editorContent, { x: 0, duration: 0.3, ease: 'power2.out' });
    } else {
        gsap.to(editorPanel, { opacity: 0, duration: 0.2 });
        gsap.to(editorContent, { x: '100%', duration: 0.2 });
        setTimeout(() => editorPanel.classList.add('pointer-events-none'), 200);
    }
};

window.editBlogPost = function (id) {
    const post = window.adminState.blogs.find(b => b.id == id);
    if (!post) return;
    initQuill();
    document.getElementById('edit-post-id').value = post.id;
    document.getElementById('blog-title').value = post.title;
    document.getElementById('blog-category').value = post.category;
    document.getElementById('blog-author').value = post.author;
    document.getElementById('blog-summary').value = post.summary;
    if (window.adminState.quill) window.adminState.quill.root.innerHTML = post.content || '';
    document.getElementById('blog-editor-title').innerText = 'Edit Article';
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

function getBlogFormValues() {
    return {
        id: document.getElementById('edit-post-id').value,
        title: document.getElementById('blog-title').value.trim(),
        category: document.getElementById('blog-category').value.trim(),
        author: document.getElementById('blog-author').value.trim(),
        summary: document.getElementById('blog-summary').value.trim(),
        content: window.adminState.quill ? window.adminState.quill.root.innerHTML : ''
    };
}

window.handleBlogSave = async function (e) {
    e.preventDefault();
    const fields = getBlogFormValues();
    const payload = { ...fields, status: 'published', _csrf_token: window.csrfToken };
    await window.backendReady;
    const res = await window.apiCall('save_blog', payload);
    if (res && res.success === true) {
        if (window.useSupabase) await window.fetchCSRFToken();
        alert('Blog post published successfully.');
        toggleBlogModal(false);
        await loadBlogData();
    } else {
        alert('Failed to save blog post.');
    }
};

window.handleBlogSaveAsDraft = async function () {
    const fields = getBlogFormValues();
    if (!fields.title) { alert('Please enter an article title before saving as draft.'); return; }
    const payload = { ...fields, status: 'draft', _csrf_token: window.csrfToken };
    await window.backendReady;
    const res = await window.apiCall('save_blog', payload);
    if (res && res.success === true) {
        if (window.useSupabase) await window.fetchCSRFToken();
        alert('Article saved as draft.');
        toggleBlogModal(false);
        await loadBlogData();
    } else {
        alert('Failed to save draft.');
    }
};

// ── Users Tab Logic ──────────────────────────────────────────────────
function parseUserJoinedDate(dateStr) {
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
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
    const targetTime = new Date(now.getTime() + (TARGET_TIMEZONE_OFFSET_MINUTES * 60000));
    return { year: targetTime.getUTCFullYear(), month: targetTime.getUTCMonth(), day: targetTime.getUTCDate() };
}

function getPresetDateRange(preset) {
    const targetYMD = getTargetTimezoneYMD();
    const startOfTodayUTC = new Date(Date.UTC(targetYMD.year, targetYMD.month, targetYMD.day));
    let start = null, end = startOfTodayUTC;
    switch (preset) {
        case 'today': start = startOfTodayUTC; break;
        case 'yesterday':
            const yesterday = new Date(startOfTodayUTC);
            yesterday.setUTCDate(startOfTodayUTC.getUTCDate() - 1);
            start = yesterday; end = yesterday; break;
        case 'last-7-days':
            const sevenDaysAgo = new Date(startOfTodayUTC);
            sevenDaysAgo.setUTCDate(startOfTodayUTC.getUTCDate() - 6);
            start = sevenDaysAgo; break;
        case 'last-30-days':
            const thirtyDaysAgo = new Date(startOfTodayUTC);
            thirtyDaysAgo.setUTCDate(startOfTodayUTC.getUTCDate() - 29);
            start = thirtyDaysAgo; break;
        case 'this-month':
            start = new Date(Date.UTC(targetYMD.year, targetYMD.month, 1)); break;
        case 'last-month':
            start = new Date(Date.UTC(targetYMD.year, targetYMD.month - 1, 1));
            end = new Date(Date.UTC(targetYMD.year, targetYMD.month, 0)); break;
        case 'all-time': default: return { startStr: '', endStr: '' };
    }
    const fmt = d => `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    return { startStr: fmt(start), endStr: fmt(end) };
}

function formatLocalShortDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr).substring(0, 10);
        const targetTime = new Date(d.getTime() + (TARGET_TIMEZONE_OFFSET_MINUTES * 60000));
        return `${targetTime.getUTCFullYear()}-${String(targetTime.getUTCMonth()+1).padStart(2,'0')}-${String(targetTime.getUTCDate()).padStart(2,'0')}`;
    } catch (e) { return String(dateStr).substring(0, 10); }
}

async function loadUserData() {
    if (window.adminState.isLoadingUsers) return;
    window.adminState.isLoadingUsers = true;
    await window.backendReady;

    const searchInput = document.getElementById('users-search-input');
    const query = searchInput ? searchInput.value.trim() : '';
    const startDateInput = document.getElementById('users-start-date');
    const endDateInput = document.getElementById('users-end-date');
    const startDateVal = startDateInput ? startDateInput.value : '';
    const endDateVal = endDateInput ? endDateInput.value : '';
    const startDate = getLocalDateBounds(startDateVal, false);
    const endDate = getLocalDateBounds(endDateVal, true);
    const startIso = startDate ? startDate.toISOString() : null;
    const endIso = endDate ? endDate.toISOString() : null;

    try {
        const res = await window.apiCall('get_filtered_users', { search: query, start_date: startIso, end_date: endIso });
        if (res && Array.isArray(res)) {
            window.adminState.usersList = res.map(u => ({
                name: u.name, email: u.email, date: u.date, status: u.status,
                rangeVisits: u.range_visits, totalVisits: u.total_visits
            }));
        } else {
            window.adminState.usersList = [];
        }
    } catch (e) {
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
    const year = parseInt(parts[0], 10), month = parseInt(parts[1], 10) - 1, day = parseInt(parts[2], 10);
    const utcMs = isEnd ? Date.UTC(year, month, day, 23, 59, 59, 999) : Date.UTC(year, month, day, 0, 0, 0, 0);
    return new Date(utcMs - (TARGET_TIMEZONE_OFFSET_MINUTES * 60000));
}

function filterAndRenderUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    const filteredUsers = deduplicateUsers(window.adminState.usersList);
    window.adminState.currentFilteredUsers = filteredUsers;
    window.currentFilteredUsers = filteredUsers;

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-secondary font-light">No clients found matching the search criteria.</td></tr>`;
        return;
    }
    const startDateInput = document.getElementById('users-start-date');
    const endDateInput = document.getElementById('users-end-date');
    const isFiltered = !!(startDateInput?.value || endDateInput?.value);

    tbody.innerHTML = filteredUsers.map(user => `
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
        btn.addEventListener('click', e => window.toggleUserStatus(e.currentTarget.getAttribute('data-email')));
    });
    tbody.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', e => window.deleteUser(e.currentTarget.getAttribute('data-email')));
    });
}

window.exportUsersPDF = function () {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) { alert('PDF library is still loading. Please try again in a moment.'); return; }
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(17, 17, 17);
    doc.text('DIGINIXIT.', 14, 20);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(102, 102, 102);
    doc.text('User Analytics & Engagement Report', 14, 26);

    const startDateVal = document.getElementById('users-start-date')?.value || '';
    const endDateVal = document.getElementById('users-end-date')?.value || '';
    let separatorY = 38, summaryY = 48;
    if (startDateVal || endDateVal) {
        doc.text(`Date Range: ${startDateVal || 'Beginning'} to ${endDateVal || 'End'}`, 14, 32);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);
        separatorY = 42; summaryY = 51;
    } else {
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
    }
    doc.setDrawColor(229, 229, 229);
    doc.line(14, separatorY, 196, separatorY);

    const filteredList = deduplicateUsers(window.adminState.currentFilteredUsers);
    const isFiltered = !!(startDateVal || endDateVal);
    const totalVisits = filteredList.reduce((sum, u) => sum + (Number(isFiltered ? u.rangeVisits : u.totalVisits) || 0), 0);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(17, 17, 17);
    doc.text(`Total Users: ${filteredList.length}`, 14, summaryY);
    doc.text(isFiltered ? `Selected Range Visits: ${totalVisits}` : `Total Recorded Visits: ${totalVisits}`, 80, summaryY);

    doc.autoTable({
        head: [['Client Name', 'Email Address', isFiltered ? 'Visits (Range / Total)' : 'Total Visits']],
        body: filteredList.map(u => [
            u.name || 'N/A', u.email || 'N/A',
            isFiltered ? `${u.rangeVisits || 0} / ${u.totalVisits || 0}` : String(u.totalVisits || 0)
        ]),
        startY: summaryY + 7, theme: 'striped',
        headStyles: { fillColor: [17, 17, 17], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, textColor: [51, 51, 51] },
        alternateRowStyles: { fillColor: [249, 249, 249] },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 90 }, 2: { cellWidth: 36, halign: 'right' } },
        margin: { top: 55, left: 14, right: 14 }
    });
    doc.save('diginixit_users_report.pdf');
};

window.toggleUserStatus = async function (email) {
    await window.backendReady;
    const res = await window.apiCall('update_user_status', { email, _csrf_token: window.csrfToken });
    if (res && res.success === true) {
        if (window.useSupabase) await window.fetchCSRFToken();
        await loadUserData();
    } else { alert('Failed to update user status.'); }
};

window.deleteUser = async function (email) {
    if (!confirm('Are you sure you want to delete this user profile?')) return;
    await window.backendReady;
    const res = await window.apiCall('delete_user', { email, _csrf_token: window.csrfToken });
    if (res && res.success === true) {
        if (window.useSupabase) await window.fetchCSRFToken();
        await loadUserData();
    } else { alert('Failed to delete user.'); }
};

// ── Settings Tab ─────────────────────────────────────────────────────
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
    const newSettings = {
        siteName: document.getElementById('settings-sitename').value.trim(),
        contactEmail: document.getElementById('settings-email').value.trim(),
        contactPhone: document.getElementById('settings-phone').value.trim(),
        maintenanceMode: document.getElementById('settings-maintenance').checked,
        linkedin: document.getElementById('settings-linkedin').value.trim(),
        instagram: document.getElementById('settings-instagram').value.trim(),
        twitter: document.getElementById('settings-twitter').value.trim(),
        facebook: document.getElementById('settings-facebook').value.trim(),
        youtube: document.getElementById('settings-youtube').value.trim(),
        _csrf_token: window.csrfToken
    };
    await window.backendReady;
    const res = await window.apiCall('save_settings', newSettings);
    if (res && res.success === true) {
        if (window.useSupabase) await window.fetchCSRFToken();
        document.querySelectorAll('.site-logo-text').forEach(el => { el.innerText = newSettings.siteName; });
        alert('System settings applied. Site configuration refreshed.');
    } else { alert('Failed to save settings.'); }
};

// ── Admin Sign Out ───────────────────────────────────────────────────
window.handleAdminSignOut = async function () {
    await window.backendReady;
    if (window.useSupabase) await window.supabase.auth.signOut();
    alert('Secure session terminated.');
    window.location.replace('admin_login.html');
};

// ── Realtime Subscription ─────────────────────────────────────────────
function subscribeToRealtime() {
    if (!window.useSupabase || !window.supabase) return null;
    const reloadActiveTab = () => {
        const t = window.adminState.activeTab;
        if (t === 'analytics') loadAnalyticsData();
        else if (t === 'blog') loadBlogData();
        else if (t === 'users') loadUserData();
        else if (t === 'settings') loadSettingsData();
    };
    return window.supabase.channel('admin-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'visit_logs' }, reloadActiveTab)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, reloadActiveTab)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stats' }, reloadActiveTab)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'blogs' }, reloadActiveTab)
        .subscribe();
}

// ── DOMContentLoaded Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await window.backendReady;
    initTabs();
    initAnalyticsPresets();
    initBlogFilterTabs();
    await loadAnalyticsData();
    subscribeToRealtime();

    // Users search
    const searchInput = document.getElementById('users-search-input');
    let searchDebounceTimeout = null;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimeout);
            searchDebounceTimeout = setTimeout(() => loadUserData(), 300);
        });
    }

    const startDateInput = document.getElementById('users-start-date');
    const endDateInput = document.getElementById('users-end-date');
    const clearDateBtn = document.getElementById('users-clear-date');
    const presetSelect = document.getElementById('users-date-preset');

    const resetPresetToCustom = () => {
        if (presetSelect) presetSelect.value = 'custom';
        loadUserData();
    };
    if (startDateInput) startDateInput.addEventListener('change', resetPresetToCustom);
    if (endDateInput) endDateInput.addEventListener('change', resetPresetToCustom);
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
