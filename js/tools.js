// DiginixIT Tools JS

const toolsData = [
    // SEO
    { id: 1, name: "Technical SEO Analyzer", category: "SEO", isPro: false, icon: "search-check" },
    { id: 2, name: "Keyword Difficulty", category: "SEO", isPro: true, icon: "key" },
    { id: 3, name: "Meta Tag Generator", category: "SEO", isPro: false, icon: "tags" },
    { id: 4, name: "Schema Markup Gen", category: "SEO", isPro: true, icon: "code" },
    { id: 5, name: "Robots.txt Generator", category: "SEO", isPro: false, icon: "file-text" },
    { id: 6, name: "Sitemap Generator", category: "SEO", isPro: false, icon: "map" },
    { id: 7, name: "SERP Position", category: "SEO", isPro: true, icon: "bar-chart" },
    // Website
    { id: 8, name: "Website Speed", category: "Website", isPro: false, icon: "zap" },
    { id: 9, name: "Core Web Vitals", category: "Website", isPro: true, icon: "activity" },
    { id: 10, name: "Accessibility Check", category: "Website", isPro: false, icon: "eye" },
    { id: 11, name: "Responsive Preview", category: "Website", isPro: false, icon: "smartphone" },
    { id: 12, name: "CSS Minifier", category: "Website", isPro: false, icon: "minimize" },
    { id: 13, name: "HTML Minifier", category: "Website", isPro: false, icon: "minimize-2" },
    { id: 14, name: "Color Palette Gen", category: "Website", isPro: false, icon: "palette" },
    // UX/UI
    { id: 15, name: "Contrast Checker", category: "UX/UI", isPro: false, icon: "contrast" },
    { id: 16, name: "Typography Scale", category: "UX/UI", isPro: false, icon: "type" },
    { id: 17, name: "Design System Gen", category: "UX/UI", isPro: true, icon: "layers" },
    { id: 18, name: "User Flow Generator", category: "UX/UI", isPro: true, icon: "git-merge" },
    { id: 19, name: "Wireframe Generator", category: "UX/UI", isPro: true, icon: "layout-template" },
    { id: 20, name: "Persona Generator", category: "UX/UI", isPro: true, icon: "users" }
];

let activeCategory = "All";
let searchQuery = "";

// Load elements
const toolsGrid = document.getElementById('tools-grid');
const searchInput = document.getElementById('tools-search-input');
const filterContainer = document.getElementById('category-filter-container');

function renderTools() {
    if (!toolsGrid) return;
    
    const filteredTools = toolsData.filter(tool => {
        const matchesCategory = (activeCategory === "All" || tool.category === activeCategory);
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             tool.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filteredTools.length === 0) {
        toolsGrid.innerHTML = `
            <div class="col-span-full text-center py-16 bg-white border border-border rounded-2xl">
                <i data-lucide="info" class="w-12 h-12 text-secondary mx-auto mb-4"></i>
                <h3 class="text-xl font-bold mb-1">No tools found</h3>
                <p class="text-secondary text-sm">Try expanding your search query or switching categories.</p>
            </div>
        `;
    } else {
        toolsGrid.innerHTML = filteredTools.map(tool => `
            <div class="bg-white border border-border p-6 rounded-2xl hover:border-primary transition-colors cursor-pointer group" onclick="openToolModal(${tool.id})">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-12 h-12 bg-surface rounded-xl flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white transition-colors">
                        <i data-lucide="${tool.icon}" class="w-5 h-5"></i>
                    </div>
                    ${tool.isPro ? '<span class="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Pro</span>' : '<span class="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Free</span>'}
                </div>
                <h3 class="font-bold text-lg mb-1">${tool.name}</h3>
                <p class="text-sm text-secondary">${tool.category} Tool</p>
            </div>
        `).join('');
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Sidebar Category Binding
if (filterContainer) {
    const buttons = filterContainer.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => {
                b.className = "w-full text-left px-4 py-2.5 rounded-xl text-secondary hover:bg-surface hover:text-primary transition-colors font-medium";
            });
            btn.className = "w-full text-left px-4 py-2.5 rounded-xl bg-primary text-white font-medium transition-colors";
            activeCategory = btn.getAttribute('data-category');
            renderTools();
        });
    });
}

// Search Input Binding
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderTools();
    });
}

// Modal Runner
const toolModal = document.getElementById('tool-modal');
const modalContent = document.getElementById('tool-modal-content');

window.openToolModal = async function(id) {
    const tool = toolsData.find(t => t.id === id);
    if (!tool || !toolModal || !modalContent) return;

    const titleEl = document.getElementById('modal-title');
    const catEl = document.getElementById('modal-category');
    const iconEl = document.getElementById('modal-icon');
    const proLockEl = document.getElementById('modal-pro-lock');
    const interfaceEl = document.getElementById('modal-interface');

    if (titleEl) titleEl.innerText = tool.name;
    if (catEl) catEl.innerText = tool.category + " Tool";
    if (iconEl) iconEl.innerHTML = `<i data-lucide="${tool.icon}" class="w-6 h-6"></i>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Check auth status & plan
    let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    // Sync plan dynamically from the database
    if (currentUser && window.useSupabase) {
        try {
            await window.backendReady;
            const { data: { session } } = await window.supabase.auth.getSession();
            if (session && session.user) {
                const { data: profile, error } = await window.supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                if (!error && profile) {
                    const freshUser = {
                        id: session.user.id,
                        name: profile.name,
                        email: session.user.email,
                        plan: profile.plan,
                        status: profile.status,
                        visits: profile.visits,
                        date: profile.date
                    };
                    localStorage.setItem('currentUser', JSON.stringify(freshUser));
                    currentUser = freshUser;
                }
            }
        } catch (e) {
            console.warn("Failed to verify subscription status with database:", e);
        }
    }

    const isUserPro = currentUser && (currentUser.plan === 'Pro' || currentUser.isAdmin === true);

    if (tool.isPro && !isUserPro) {
        // Show Pro Lock
        proLockEl.classList.remove('hidden');
        interfaceEl.innerHTML = '';
        interfaceEl.classList.add('hidden');
    } else {
        // Render Tool Interface
        proLockEl.classList.add('hidden');
        interfaceEl.classList.remove('hidden');
        setupToolInterface(tool, interfaceEl);
    }

    toolModal.classList.remove('pointer-events-none');
    if (typeof gsap !== 'undefined') {
        gsap.to(toolModal, { opacity: 1, duration: 0.3 });
        gsap.to(modalContent, { scale: 1, duration: 0.3, ease: "back.out(1.5)" });
    }
};

window.closeToolModal = function() {
    if (!toolModal || !modalContent) return;
    if (typeof gsap !== 'undefined') {
        gsap.to(toolModal, { opacity: 0, duration: 0.2 });
        gsap.to(modalContent, { scale: 0.95, duration: 0.2 });
    }
    setTimeout(() => {
        toolModal.classList.add('pointer-events-none');
    }, 200);
};

// Custom interactive forms inside modal
function setupToolInterface(tool, container) {
    if (tool.id === 12) {
        // CSS Minifier
        container.innerHTML = `
            <div class="space-y-4">
                <p class="text-sm text-secondary">Compress your raw CSS files instantly.</p>
                <textarea id="css-input" aria-label="CSS input code" class="premium-input h-32 text-xs font-mono" placeholder="body {\n  background: #ffffff;\n  color: #000000;\n}"></textarea>
                <button onclick="runCssMinifier()" class="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-black transition-colors">Minify CSS</button>
                <div id="css-output-container" class="hidden space-y-2">
                    <div class="flex justify-between items-center text-xs text-secondary">
                        <span>Minified Output</span>
                        <button onclick="copyToClipboard('css-output')" class="hover:text-primary">Copy Code</button>
                    </div>
                    <textarea id="css-output" aria-label="CSS minified output" readonly class="premium-input h-20 text-xs font-mono bg-surface cursor-text"></textarea>
                </div>
            </div>
        `;
    } else if (tool.id === 3) {
        // Meta Tag Generator
        container.innerHTML = `
            <div class="space-y-4">
                <p class="text-sm text-secondary">Enter your SEO details to generate meta tags.</p>
                <div>
                    <label for="meta-title" class="text-xs font-bold text-secondary block mb-1">Page Title</label>
                    <input type="text" id="meta-title" class="premium-input" placeholder="Page Title (e.g. DiginixIT)">
                </div>
                <div>
                    <label for="meta-desc" class="text-xs font-bold text-secondary block mb-1">Meta Description</label>
                    <textarea id="meta-desc" class="premium-input h-20" placeholder="Meta Description (e.g. Premium web layouts)"></textarea>
                </div>
                <button onclick="runMetaGenerator()" class="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-black transition-colors">Generate Meta Tags</button>
                <div id="meta-output-container" class="hidden space-y-2">
                    <div class="flex justify-between items-center text-xs text-secondary">
                        <span>Generated HTML</span>
                        <button onclick="copyToClipboard('meta-output')" class="hover:text-primary">Copy tags</button>
                    </div>
                    <textarea id="meta-output" aria-label="Generated HTML output" readonly class="premium-input h-24 text-xs font-mono bg-surface cursor-text"></textarea>
                </div>
            </div>
        `;
    } else if (tool.id === 15) {
        // Contrast Checker
        container.innerHTML = `
            <div class="space-y-4">
                <p class="text-sm text-secondary">Compare text and background color to check WCAG compliance.</p>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="contrast-color-1" class="text-xs text-secondary block mb-1">Text Color</label>
                        <input type="color" id="contrast-color-1" value="#111111" class="w-full h-12 rounded-xl cursor-pointer bg-white p-1 border border-border" oninput="runContrastCheck()">
                    </div>
                    <div>
                        <label for="contrast-color-2" class="text-xs text-secondary block mb-1">Background Color</label>
                        <input type="color" id="contrast-color-2" value="#ffffff" class="w-full h-12 rounded-xl cursor-pointer bg-white p-1 border border-border" oninput="runContrastCheck()">
                    </div>
                </div>
                <div id="contrast-preview" class="p-6 rounded-2xl border border-border text-center text-lg font-bold" style="color: #111111; background-color: #ffffff;">
                    Preview Text
                </div>
                <div class="flex justify-between items-center p-4 bg-surface rounded-xl border border-border">
                    <span class="text-sm font-medium">Contrast Ratio: <strong id="contrast-ratio">21:1</strong></span>
                    <span id="contrast-badge" class="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">AAA Pass</span>
                </div>
            </div>
        `;
    } else {
        // Default Mock Tool
        container.innerHTML = `
            <div class="space-y-4">
                <p class="text-sm text-secondary">Enter parameters to run the analysis.</p>
                <input type="text" id="mock-input" aria-label="Mock Input Parameters" class="premium-input" placeholder="Enter target URL or parameters...">
                <button onclick="runMockAnalysis()" class="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-black transition-colors" id="btn-run-mock">Run Analysis</button>
                <div id="mock-loader" class="hidden flex justify-center items-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
                <div id="mock-report" class="hidden p-6 bg-surface border border-border rounded-2xl space-y-3">
                    <h4 class="font-bold text-sm text-primary">Analysis Complete</h4>
                    <div class="grid grid-cols-2 gap-4 text-xs">
                        <div class="p-3 bg-white border border-border rounded-xl">
                            <div class="text-secondary mb-1">Performance</div>
                            <div class="text-lg font-bold text-green-500">98/100</div>
                        </div>
                        <div class="p-3 bg-white border border-border rounded-xl">
                            <div class="text-secondary mb-1">SEO Health</div>
                            <div class="text-lg font-bold text-primary">Excellent</div>
                        </div>
                    </div>
                    <p class="text-xs text-secondary leading-relaxed">No high-severity warnings detected. Schema config matches industry standards.</p>
                </div>
            </div>
        `;
    }
}

// Global script functions for tools logic
window.runCssMinifier = function() {
    const input = document.getElementById('css-input').value;
    const output = input
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
        .replace(/\s+/g, " ")             // Compress whitespace
        .replace(/ ?{ ?/g, "{")
        .replace(/ ?} ?/g, "}")
        .replace(/ ?; ?/g, ";")
        .replace(/ ?;}/g, "}")
        .trim();
    
    document.getElementById('css-output').value = output;
    document.getElementById('css-output-container').classList.remove('hidden');
};

window.runMetaGenerator = function() {
    const title = document.getElementById('meta-title').value || "DIGINIXIT";
    const desc = document.getElementById('meta-desc').value || "Elite Digital Web Agency";
    const tags = `<!-- SEO Meta Tags -->\n<title>${title}</title>\n<meta name="description" content="${desc}">\n<meta name="robots" content="index, follow">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">`;
    
    document.getElementById('meta-output').value = tags;
    document.getElementById('meta-output-container').classList.remove('hidden');
};

window.runContrastCheck = function() {
    const c1 = document.getElementById('contrast-color-1').value; // text
    const c2 = document.getElementById('contrast-color-2').value; // bg
    
    const preview = document.getElementById('contrast-preview');
    preview.style.color = c1;
    preview.style.backgroundColor = c2;

    // Relative luminance calc
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : null;
    }

    function lum(color) {
        const rgb = hexToRgb(color);
        if (!rgb) return 0;
        const a = [rgb.r, rgb.g, rgb.b].map(v => {
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    const l1 = lum(c1);
    const l2 = lum(c2);
    
    const ratio = l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);
    const ratioFormatted = ratio.toFixed(2) + ":1";
    
    document.getElementById('contrast-ratio').innerText = ratioFormatted;

    const badge = document.getElementById('contrast-badge');
    if (ratio >= 7) {
        badge.innerText = "AAA Pass";
        badge.className = "px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase";
    } else if (ratio >= 4.5) {
        badge.innerText = "AA Pass";
        badge.className = "px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase";
    } else {
        badge.innerText = "Fail";
        badge.className = "px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase";
    }
};

window.runMockAnalysis = function() {
    const btn = document.getElementById('btn-run-mock');
    const loader = document.getElementById('mock-loader');
    const report = document.getElementById('mock-report');
    
    btn.classList.add('hidden');
    loader.classList.remove('hidden');
    report.classList.add('hidden');
    
    setTimeout(() => {
        loader.classList.add('hidden');
        btn.classList.remove('hidden');
        report.classList.remove('hidden');
    }, 1500);
};

window.copyToClipboard = function(id) {
    const copyText = document.getElementById(id);
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
    alert("Copied successfully!");
};

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    renderTools();
});
