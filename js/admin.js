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
            btn.setAttribute('data-state', match ? 'active' : 'inactive');
        });
        mobileBtns.forEach(btn => {
            const match = btn.getAttribute('data-tab') === tabId;
            if (match) {
                btn.classList.add('ui-btn-primary');
                btn.classList.remove('ui-btn-outline');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.add('ui-btn-outline');
                btn.classList.remove('ui-btn-primary');
                btn.setAttribute('aria-pressed', 'false');
            }
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

// ── Analytics: Main Load ─────────────────────────────────────────────
async function loadAnalyticsData() {
    await window.backendReady;

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

    let res = null;
    try {
        res = await window.apiCall('get_admin_analytics', {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
        });
    } catch (e) {
        console.error("Failed to load get_admin_analytics from backend:", e);
    }

    if (!res) {
        res = {
            total_visits: 0, active_users: 0, avg_session_duration: 0, articles_read: 0,
            prior_total_visits: 0, prior_active_users: 0, prior_avg_session_duration: 0, prior_articles_read: 0,
            devices: [], countries: [], pages: [], visits_trend: [], users_trend: [], retention_trend: [], recent_visitors: []
        };
    }

    // Sync Stats Row KPI UI
    const formatDuration = (s) => {
        if (s < 60) return `${s}s`;
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}m ${sec}s`;
    };

    document.getElementById('stat-users').innerText = Number(res.active_users || 0).toLocaleString();
    document.getElementById('stat-visits').innerText = Number(res.total_visits || 0).toLocaleString();
    document.getElementById('stat-session').innerText = `${res.avg_session_duration || 0}%`;
    document.getElementById('stat-reads').innerText = Number(res.articles_read || 0).toLocaleString();

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

    updateChangeLabel('stat-users-change', res.active_users, res.prior_active_users);
    updateChangeLabel('stat-visits-change', res.total_visits, res.prior_total_visits);
    updateChangeLabel('stat-session-change', res.avg_session_duration, res.prior_avg_session_duration);
    updateChangeLabel('stat-reads-change', res.articles_read, res.prior_articles_read);

    // Update traffic period label
    const trafficLabel = document.getElementById('traffic-period-label');
    if (trafficLabel) trafficLabel.textContent = getPresetLabel(preset);

    // Populate Buckets (Chart labels)
    const buckets = generateBuckets(startDate, endDate);
    buckets.forEach(bucket => {
        const matchingVisit = (res.visits_trend || []).find(item => {
            const itemTime = new Date(item.bucket_time);
            return itemTime >= bucket.start && itemTime <= bucket.end;
        });
        bucket.visits = matchingVisit ? Number(matchingVisit.count) : 0;

        const matchingUser = (res.users_trend || []).find(item => {
            const itemTime = new Date(item.bucket_time);
            return itemTime >= bucket.start && itemTime <= bucket.end;
        });
        bucket.signups = matchingUser ? Number(matchingUser.count) : 0;

        const matchingRetention = (res.retention_trend || []).find(item => {
            const itemTime = new Date(item.bucket_time);
            return itemTime >= bucket.start && itemTime <= bucket.end;
        });
        bucket.duration = matchingRetention ? Number(matchingRetention.avg_duration) : 0;
        bucket.articlesRead = matchingRetention ? Number(matchingRetention.articles_read) : 0;
    });

    const chartLabels = buckets.map(b => b.label);
    const visitHistoryData = buckets.map(b => b.visits);
    const signupHistoryData = buckets.map(b => b.signups);
    const retentionHistoryData = buckets.map(b => b.duration);
    const articlesReadHistoryData = buckets.map(b => b.articlesRead);

    // Device breakdown (Desktop, Mobile, Tablet)
    const devicesMap = { Desktop: 0, Mobile: 0, Tablet: 0 };
    (res.devices || []).forEach(d => {
        const lbl = d.label === 'Tablet' ? 'Tablet' : d.label === 'Mobile' ? 'Mobile' : 'Desktop';
        devicesMap[lbl] = (devicesMap[lbl] || 0) + Number(d.count);
    });
    const totalDevices = devicesMap.Desktop + devicesMap.Mobile + devicesMap.Tablet;
    const devicePct = totalDevices > 0 ? [
        Math.round((devicesMap.Desktop / totalDevices) * 100),
        Math.round((devicesMap.Mobile / totalDevices) * 100),
        Math.round((devicesMap.Tablet / totalDevices) * 100)
    ] : [100, 0, 0];

    // Top Pages
    const topPagesLabels = (res.pages || []).map(p => p.label);
    const topPagesData = (res.pages || []).map(p => Number(p.count));
    if (topPagesLabels.length === 0) {
        topPagesLabels.push('/home', '/blog', '/services');
        topPagesData.push(0, 0, 0);
    }

    // Visitor Locations
    const countryLabels = (res.countries || []).map(c => c.label);
    const countryData = (res.countries || []).map(c => Number(c.count));
    if (countryLabels.length === 0) {
        countryLabels.push('Pakistan', 'United States', 'United Kingdom');
        countryData.push(0, 0, 0);
    }

    renderAnalyticsCharts(
        chartLabels, signupHistoryData, visitHistoryData, retentionHistoryData, articlesReadHistoryData,
        devicePct, topPagesLabels, topPagesData, countryLabels, countryData
    );

    renderRecentVisitorsList(res.recent_visitors || []);
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
            try { window.adminState[key].destroy(); } catch (e) { }
            window.adminState[key] = null;
        }
    });
}

// ── Analytics: Render All 8 Charts (Solid Colors, No Gradients) ──────
function renderAnalyticsCharts(
    labels, userData, visitData, retentionData, articlesReadData,
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
                        label: 'Bounce Rate (%)',
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
                                    return ` ${ctx.parsed.y}% bounce rate`;
                                }
                                return null;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: '#f0f0f0', lineWidth: 1 },
                        border: { display: false },
                        ticks: {
                            color: '#888', font: { size: 10 },
                            callback: v => `${v}%`
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

    // ── Chart 7: Articles Read Trendline Curve (Solid) ─────────────────
    const ctxBounce = document.getElementById('adminBounceChart');
    if (ctxBounce) {
        window.adminState.bounceChartInstance = new Chart(ctxBounce, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Articles Read',
                    data: articlesReadData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
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
                        callbacks: { label: ctx => ` ${ctx.parsed.y.toLocaleString()} articles read` }
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
}

// ── Recent Visitors List (Real Data with relative times) ────────────
function renderRecentVisitorsList(sortedLogs) {
    const list = document.getElementById('recent-visitors-list');
    if (!list) return;

    if (sortedLogs.length === 0) {
        list.innerHTML = `<div class="p-8 text-center text-xs text-secondary">No visitor logs in this period.</div>`;
        return;
    }

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
            if (startInput) startInput.value = start.toISOString().slice(0, 10);
            if (endInput) endInput.value = end.toISOString().slice(0, 10);

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

// ── Blog Management Tab & Custom Rich Text Editor ─────────────────────

function updateToolbarActiveStates() {
    const editorArea = document.getElementById('article-editor-area');
    const toolbar = document.getElementById('msword-toolbar');
    if (!editorArea || !toolbar) return;

    const sel = window.getSelection();
    let node = null;
    if (sel && sel.rangeCount > 0) {
        node = sel.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }
    }

    let isBold = false, isItalic = false, isUnderline = false, isStrike = false, isSub = false, isSup = false;
    let isUl = false, isOl = false, isBlockquote = false, isCodeblock = false, isAccordion = false, isLink = false, isTable = false, isDiagram = false;
    let headingTag = 'p';
    let textAlign = '';

    if (node && editorArea.contains(node)) {
        let curr = node;
        while (curr && curr !== editorArea && curr.parentElement) {
            const tag = curr.tagName ? curr.tagName.toLowerCase() : '';
            if (tag === 'b' || tag === 'strong' || (curr.style && (curr.style.fontWeight === 'bold' || parseInt(curr.style.fontWeight) >= 600))) isBold = true;
            if (tag === 'i' || tag === 'em' || (curr.style && curr.style.fontStyle === 'italic')) isItalic = true;
            if (tag === 'u' || (curr.style && curr.style.textDecoration && curr.style.textDecoration.includes('underline'))) isUnderline = true;
            if (tag === 's' || tag === 'strike' || (curr.style && curr.style.textDecoration && curr.style.textDecoration.includes('line-through'))) isStrike = true;
            if (tag === 'sub') isSub = true;
            if (tag === 'sup') isSup = true;
            if (tag === 'ul') isUl = true;
            if (tag === 'ol') isOl = true;
            if (tag === 'blockquote') isBlockquote = true;
            if (tag === 'code' || tag === 'pre') {
                if (curr.classList && (curr.classList.contains('ascii-diagram') || curr.classList.contains('ql-diagram'))) {
                    isDiagram = true;
                } else {
                    isCodeblock = true;
                }
            }
            if (tag === 'details' || (curr.classList && curr.classList.contains('article-accordion'))) isAccordion = true;
            if (tag === 'a') isLink = true;
            if (tag === 'table' || tag === 'tr' || tag === 'td' || tag === 'th') isTable = true;

            if (['h1', 'h2', 'h3', 'h4', 'p'].includes(tag) && headingTag === 'p') {
                headingTag = tag;
            }
            if (curr.style && curr.style.textAlign && !textAlign) {
                textAlign = curr.style.textAlign.toLowerCase();
            }
            curr = curr.parentElement;
        }
    }

    const checkState = (cmd, domBool) => {
        try {
            return domBool || document.queryCommandState(cmd);
        } catch (e) {
            return domBool;
        }
    };

    const states = {
        'bold': checkState('bold', isBold),
        'italic': checkState('italic', isItalic),
        'underline': checkState('underline', isUnderline),
        'strikeThrough': checkState('strikeThrough', isStrike),
        'subscript': checkState('subscript', isSub),
        'superscript': checkState('superscript', isSup),
        'insertUnorderedList': checkState('insertUnorderedList', isUl),
        'insertOrderedList': checkState('insertOrderedList', isOl),
        'justifyLeft': textAlign === 'left' || checkState('justifyLeft', false),
        'justifyCenter': textAlign === 'center' || checkState('justifyCenter', false),
        'justifyRight': textAlign === 'right' || checkState('justifyRight', false),
        'justifyFull': textAlign === 'justify' || checkState('justifyFull', false),
        'blockquote': isBlockquote,
        'codeblock': isCodeblock,
        'accordion': isAccordion,
        'link': isLink,
        'table': isTable,
        'diagram': isDiagram
    };

    Object.keys(states).forEach(key => {
        const btn = toolbar.querySelector(`button[data-cmd="${key}"], button[data-tool="${key}"]`);
        if (btn) {
            if (states[key]) {
                btn.classList.add('active', 'bg-neutral-200', 'text-primary-deep', 'border-primary');
            } else {
                btn.classList.remove('active', 'bg-neutral-200', 'text-primary-deep', 'border-primary');
            }
        }
    });

    const blockFormat = document.getElementById('toolbar-block-format');
    if (blockFormat) {
        let val = headingTag;
        try {
            const cmdVal = document.queryCommandValue('formatBlock');
            if (cmdVal) {
                const lower = String(cmdVal).toLowerCase().replace(/[^a-z0-9]/g, '');
                if (['h1', 'h2', 'h3', 'h4', 'p'].includes(lower)) val = lower;
            }
        } catch (e) {}
        blockFormat.value = val;
    }
}

function initCustomRichEditor() {
    const editorArea = document.getElementById('article-editor-area');
    if (!editorArea || editorArea.getAttribute('data-editor-initialized') === 'true') return;
    editorArea.setAttribute('data-editor-initialized', 'true');

    const toolbar = document.getElementById('msword-toolbar');
    if (toolbar) {
        toolbar.querySelectorAll('button[data-cmd]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cmd = btn.getAttribute('data-cmd');
                if (cmd) {
                    document.execCommand(cmd, false, null);
                    editorArea.focus();
                    updateEditorWordCount();
                    updateToolbarActiveStates();
                }
            });
        });
    }

    const blockFormat = document.getElementById('toolbar-block-format');
    if (blockFormat) {
        blockFormat.addEventListener('change', (e) => {
            const tag = e.target.value;
            if (tag) {
                document.execCommand('formatBlock', false, `<${tag}>`);
                editorArea.focus();
                updateToolbarActiveStates();
            }
        });
    }

    const foreColor = document.getElementById('toolbar-forecolor');
    if (foreColor) {
        foreColor.addEventListener('input', (e) => {
            document.execCommand('foreColor', false, e.target.value);
            editorArea.focus();
        });
    }

    const backColor = document.getElementById('toolbar-backcolor');
    if (backColor) {
        backColor.addEventListener('input', (e) => {
            document.execCommand('hiliteColor', false, e.target.value) || document.execCommand('backColor', false, e.target.value);
            editorArea.focus();
        });
    }

    editorArea.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                document.execCommand('outdent', false, null);
            } else {
                document.execCommand('indent', false, null);
            }
            updateEditorWordCount();
            updateToolbarActiveStates();
        }
    });

    // Handle FAQ Deletion inside editor
    editorArea.addEventListener('click', (e) => {
        const delBtn = e.target.closest('.faq-delete-btn');
        if (delBtn) {
            e.preventDefault();
            e.stopPropagation();
            const accordion = delBtn.closest('details.article-accordion');
            if (accordion) {
                accordion.remove();
                updateEditorWordCount();
            }
        }
        updateToolbarActiveStates();
    });

    editorArea.addEventListener('input', () => {
        updateEditorWordCount();
        updateToolbarActiveStates();
    });
    editorArea.addEventListener('keyup', () => {
        updateEditorWordCount();
        updateToolbarActiveStates();
    });
    editorArea.addEventListener('mouseup', updateToolbarActiveStates);

    document.addEventListener('selectionchange', () => {
        const sel = window.getSelection();
        if (sel && sel.anchorNode && editorArea.contains(sel.anchorNode)) {
            updateToolbarActiveStates();
        }
    });

    updateEditorWordCount();
    updateToolbarActiveStates();
}

function updateEditorWordCount() {
    const editorArea = document.getElementById('article-editor-area');
    const wordCountEl = document.getElementById('editor-word-count');
    const charCountEl = document.getElementById('editor-char-count');
    if (!editorArea || !wordCountEl || !charCountEl) return;

    const text = editorArea.innerText || '';
    const cleanText = text.trim();
    const words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;

    wordCountEl.innerText = `${words} ${words === 1 ? 'word' : 'words'}`;
    charCountEl.innerText = `${chars} ${chars === 1 ? 'character' : 'characters'}`;
}

window.toggleEditorSourceMode = function () {
    const editorArea = document.getElementById('article-editor-area');
    const sourceArea = document.getElementById('article-source-area');
    const btn = document.getElementById('toggle-source-mode-btn');
    if (!editorArea || !sourceArea) return;

    if (sourceArea.classList.contains('hidden')) {
        sourceArea.value = editorArea.innerHTML;
        editorArea.classList.add('hidden');
        sourceArea.classList.remove('hidden');
        if (btn) btn.classList.add('active');
    } else {
        editorArea.innerHTML = sourceArea.value;
        sourceArea.classList.add('hidden');
        editorArea.classList.remove('hidden');
        if (btn) btn.classList.remove('active');
        updateEditorWordCount();
    }
};

window.editorInsertBlockquote = function () {
    const editorArea = document.getElementById('article-editor-area');
    if (!editorArea) return;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        let node = sel.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        const bq = node ? node.closest('blockquote') : null;
        if (bq && editorArea.contains(bq)) {
            // Already inside blockquote -> Toggle OFF (convert to paragraph)
            const p = document.createElement('p');
            p.innerHTML = bq.innerHTML;
            bq.parentNode.replaceChild(p, bq);
            editorArea.focus();
            updateEditorWordCount();
            updateToolbarActiveStates();
            return;
        }
    }

    // Toggle ON
    document.execCommand('formatBlock', false, '<blockquote>');
    editorArea.focus();
    updateEditorWordCount();
    updateToolbarActiveStates();
};

window.editorInsertCodeBlock = function () {
    const editorArea = document.getElementById('article-editor-area');
    if (!editorArea) return;

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    let node = sel.anchorNode;
    if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const pre = node ? node.closest('pre') : null;
    if (pre && editorArea.contains(pre)) {
        // Already inside code block -> Toggle OFF (convert to paragraph)
        const p = document.createElement('p');
        p.textContent = pre.textContent;
        pre.parentNode.replaceChild(p, pre);
        editorArea.focus();
        updateEditorWordCount();
        updateToolbarActiveStates();
        return;
    }

    // Toggle ON
    const range = sel.getRangeAt(0);
    const newPre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = sel.toString() || '// Code snippet goes here';
    newPre.appendChild(code);
    range.deleteContents();
    range.insertNode(newPre);
    editorArea.focus();
    updateEditorWordCount();
    updateToolbarActiveStates();
};

window.editorInsertAccordion = function () {
    const editorArea = document.getElementById('article-editor-area');
    if (!editorArea) return;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        let node = sel.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        const accordion = node ? node.closest('details.article-accordion') : null;
        if (accordion && editorArea.contains(accordion)) {
            // Already inside accordion -> Toggle OFF (Remove accordion)
            accordion.remove();
            editorArea.focus();
            updateEditorWordCount();
            updateToolbarActiveStates();
            return;
        }
    }

    // Toggle ON
    const question = prompt('Enter Question / FAQ Title:', 'What is DiginixIT?');
    if (!question || !question.trim()) return;
    const answer = prompt('Enter Answer / Explanation:', 'DiginixIT is a leading software & technology engineering agency...');
    if (!answer || !answer.trim()) return;

    const safeQ = window.escapeHtml ? window.escapeHtml(question.trim()) : question.trim();
    const safeA = window.escapeHtml ? window.escapeHtml(answer.trim()) : answer.trim();

    const accordionHtml = `<details class="article-accordion my-4 border border-hairline rounded-xl overflow-hidden bg-canvas-soft" open><summary class="flex items-center justify-between p-4 font-semibold text-ink cursor-pointer select-none"><span>${safeQ}</span><button type="button" class="faq-delete-btn text-[11px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-0.5 rounded transition-colors ml-3" title="Delete FAQ Block">✕ Remove FAQ</button></summary><div class="p-4 text-ink-mute border-t border-hairline bg-canvas"><p>${safeA}</p></div></details><p></p>`;
    document.execCommand('insertHTML', false, accordionHtml);
    editorArea.focus();
    updateEditorWordCount();
    updateToolbarActiveStates();
};

window.editorPromptLink = function () {
    const editorArea = document.getElementById('article-editor-area');
    if (!editorArea) return;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        let node = sel.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        const link = node ? node.closest('a') : null;
        if (link && editorArea.contains(link)) {
            // Already inside link -> Toggle OFF (Remove link)
            document.execCommand('unlink', false, null);
            editorArea.focus();
            updateEditorWordCount();
            updateToolbarActiveStates();
            return;
        }
    }

    // Toggle ON
    const url = prompt('Enter web address for link:', 'https://');
    if (url && url.trim()) {
        document.execCommand('createLink', false, url.trim());
        editorArea.focus();
        updateEditorWordCount();
        updateToolbarActiveStates();
    }
};

window.editorPromptImage = function () {
    const choice = prompt('Type 1 to insert Image URL, or Type 2 to Upload Image File:', '1');
    if (choice === '1') {
        const url = prompt('Enter Image URL:', 'https://');
        if (url && url.trim()) {
            document.execCommand('insertImage', false, url.trim());
        }
    } else if (choice === '2') {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.execCommand('insertImage', false, event.target.result);
                };
                reader.readAsDataURL(file);
            }
        };
        fileInput.click();
    }
};

window.editorPromptTable = function () {
    const rows = parseInt(prompt('Number of table rows:', '3') || '3', 10);
    const cols = parseInt(prompt('Number of table columns:', '3') || '3', 10);
    if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) return;

    let tableHtml = '<table><thead><tr>';
    for (let c = 0; c < cols; c++) {
        tableHtml += `<th>Header ${c + 1}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';
    for (let r = 0; r < rows; r++) {
        tableHtml += '<tr>';
        for (let c = 0; c < cols; c++) {
            tableHtml += `<td>Cell ${r + 1},${c + 1}</td>`;
        }
        tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p></p>';
    document.execCommand('insertHTML', false, tableHtml);
    updateEditorWordCount();
};

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

    const editorArea = document.getElementById('article-editor-area');
    if (editorArea) {
        const pre = document.createElement('pre');
        pre.className = 'ascii-diagram';
        pre.textContent = text;

        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && editorArea.contains(sel.anchorNode)) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(pre);
        } else {
            editorArea.appendChild(pre);
        }
    }
    window.closeDiagramModal();
    updateEditorWordCount();
};

// ── Blog: Load & Filter ──────────────────────────────────────────────
async function loadBlogData() {
    await window.backendReady;
    const res = await window.apiCall('get_admin_blogs');
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
        tbody.innerHTML = `<tr class="ui-tr"><td colspan="6" class="ui-td text-center py-8 text-ink-mute">No articles found.</td></tr>`;
        return;
    }

    tbody.innerHTML = posts.map(post => {
        const isDraft = post.status === 'draft';
        const statusBadge = isDraft
            ? `<span class="ui-badge ui-badge-outline">&#9679; Draft</span>`
            : `<span class="ui-badge ui-badge-emerald">&#9679; Published</span>`;
        return `
        <tr class="ui-tr">
            <td class="ui-td font-medium max-w-xs truncate">${window.escapeHtml(post.title)}</td>
            <td class="ui-td"><span class="ui-badge ui-badge-default">${window.escapeHtml(post.category)}</span></td>
            <td class="ui-td text-xs text-ink-mute">${window.escapeHtml(post.author)}</td>
            <td class="ui-td">${statusBadge}</td>
            <td class="ui-td text-xs text-ink-mute">${window.escapeHtml(formatLocalShortDate(post.date))}</td>
            <td class="ui-td text-right space-x-2">
                <button class="ui-btn ui-btn-outline ui-btn-sm edit-blog-btn" data-id="${post.id}">Edit</button>
                <button class="ui-btn ui-btn-danger ui-btn-sm delete-blog-btn" data-id="${post.id}">Delete</button>
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

window.openArticleEditor = function (id = null) {
    const contents = document.querySelectorAll('.admin-tab-content');
    contents.forEach(c => c.classList.remove('active'));

    const editorTab = document.getElementById('tab-article-editor');
    if (editorTab) editorTab.classList.add('active');

    window.adminState.activeTab = 'article-editor';
    initCustomRichEditor();

    const pageTitle = document.getElementById('article-editor-page-title');
    const editorArea = document.getElementById('article-editor-area');
    const sourceArea = document.getElementById('article-source-area');

    if (sourceArea && !sourceArea.classList.contains('hidden')) {
        toggleEditorSourceMode();
    }

    if (id) {
        const post = window.adminState.blogs.find(b => b.id == id);
        if (post) {
            document.getElementById('edit-post-id').value = post.id;
            document.getElementById('blog-title').value = post.title || '';
            document.getElementById('blog-category').value = post.category || '';
            document.getElementById('blog-author').value = post.author || '';
            document.getElementById('blog-summary').value = post.summary || '';
            if (editorArea) editorArea.innerHTML = post.content || '<p></p>';
            if (pageTitle) pageTitle.innerText = 'Edit Article';
        }
    } else {
        document.getElementById('edit-post-id').value = '';
        document.getElementById('blog-title').value = '';
        document.getElementById('blog-category').value = '';
        document.getElementById('blog-author').value = '';
        document.getElementById('blog-summary').value = '';
        if (editorArea) editorArea.innerHTML = '<p>Start writing your article here...</p>';
        if (pageTitle) pageTitle.innerText = 'Write New Article';
    }

    updateEditorWordCount();
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
};

window.closeArticleEditor = function () {
    const contents = document.querySelectorAll('.admin-tab-content');
    contents.forEach(c => c.classList.remove('active'));

    const blogTab = document.getElementById('tab-blog');
    if (blogTab) blogTab.classList.add('active');

    window.adminState.activeTab = 'blog';
    loadBlogData();
};

window.editBlogPost = function (id) {
    window.openArticleEditor(id);
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
    const editorArea = document.getElementById('article-editor-area');
    const sourceArea = document.getElementById('article-source-area');

    let htmlContent = '';
    if (sourceArea && !sourceArea.classList.contains('hidden')) {
        htmlContent = sourceArea.value;
    } else if (editorArea) {
        htmlContent = editorArea.innerHTML;
    }

    return {
        id: document.getElementById('edit-post-id').value,
        title: document.getElementById('blog-title').value.trim(),
        category: document.getElementById('blog-category').value.trim(),
        author: document.getElementById('blog-author').value.trim(),
        summary: document.getElementById('blog-summary').value.trim(),
        content: htmlContent
    };
}

window.handleBlogSave = async function (e) {
    if (e && e.preventDefault) e.preventDefault();
    const fields = getBlogFormValues();
    if (!fields.title) { alert('Please enter an article title.'); return; }
    const payload = { ...fields, status: 'published', _csrf_token: window.csrfToken };
    await window.backendReady;
    const res = await window.apiCall('save_blog', payload);
    if (res && res.success === true) {
        if (window.useSupabase) await window.fetchCSRFToken();
        alert('Blog post published successfully.');
        window.closeArticleEditor();
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
        window.closeArticleEditor();
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
    const fmt = d => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return { startStr: fmt(start), endStr: fmt(end) };
}

function formatLocalShortDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr).substring(0, 10);
        const targetTime = new Date(d.getTime() + (TARGET_TIMEZONE_OFFSET_MINUTES * 60000));
        return `${targetTime.getUTCFullYear()}-${String(targetTime.getUTCMonth() + 1).padStart(2, '0')}-${String(targetTime.getUTCDate()).padStart(2, '0')}`;
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
        tbody.innerHTML = `<tr class="ui-tr"><td colspan="6" class="ui-td text-center py-8 text-ink-mute">No clients found matching the search criteria.</td></tr>`;
        return;
    }
    const startDateInput = document.getElementById('users-start-date');
    const endDateInput = document.getElementById('users-end-date');
    const isFiltered = !!(startDateInput?.value || endDateInput?.value);

    tbody.innerHTML = filteredUsers.map(user => `
        <tr class="ui-tr">
            <td class="ui-td font-medium">${window.escapeHtml(user.name)}</td>
            <td class="ui-td text-xs font-mono text-ink-mute">${window.escapeHtml(user.email)}</td>
            <td class="ui-td text-xs text-ink-mute">${window.escapeHtml(formatLocalShortDate(user.date))}</td>
            <td class="ui-td text-xs font-medium text-ink">
                ${isFiltered ? `${user.rangeVisits || 0} <span class="text-ink-mute text-[10px]">/ ${user.totalVisits || 0}</span>` : (user.totalVisits || 0)}
            </td>
            <td class="ui-td">
                <span class="ui-badge ${user.status === 'Blocked' ? 'ui-badge-danger' : 'ui-badge-emerald'}">
                    ${window.escapeHtml(user.status || 'Active')}
                </span>
            </td>
            <td class="ui-td text-right space-x-2">
                <button class="ui-btn ui-btn-outline ui-btn-sm toggle-user-status-btn" data-email="${window.escapeHtml(user.email)}">
                    ${user.status === 'Blocked' ? 'Activate' : 'Block'}
                </button>
                <button class="ui-btn ui-btn-danger ui-btn-sm delete-user-btn" data-email="${window.escapeHtml(user.email)}">Delete</button>
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

    // Dynamic filename based on date/timeline range or generation date
    let filename = 'diginixit_users_report';
    if (startDateVal && endDateVal) {
        filename += `_${startDateVal}_to_${endDateVal}`;
    } else if (startDateVal) {
        filename += `_from_${startDateVal}`;
    } else if (endDateVal) {
        filename += `_until_${endDateVal}`;
    } else {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        filename += `_${yyyy}-${mm}-${dd}`;
    }
    filename += '.pdf';
    doc.save(filename);
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
    initCustomRichEditor();
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
