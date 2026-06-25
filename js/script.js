// DiginixIT — script.js
// Three.js, GSAP Animations, Lenis Smooth Scroll, Interactions

// --- Tailwind CSS Configuration ---
if (typeof tailwind !== 'undefined') {
    tailwind.config = {
        theme: {
            extend: {
                fontFamily: { sans: ['Inter', 'sans-serif'] },
                colors: {
                    canvas: '#ffffff',
                    'canvas-soft': '#fafafa',
                    'canvas-night': '#1c1c1c',
                    'canvas-night-soft': '#202020',
                    ink: '#171717',
                    'ink-secondary': '#212121',
                    'ink-mute': '#707070',
                    'ink-mute-2': '#9a9a9a',
                    'ink-faint': '#b2b2b2',
                    primary: '#3ecf8e',
                    'primary-deep': '#24b47e',
                    hairline: '#dfdfdf',
                    'hairline-strong': '#c7c7c7',
                    'hairline-cool': '#ededed'
                },
                letterSpacing: { tighter: '-0.04em', tight: '-0.02em', display: '-0.03em' }
            }
        }
    };
}

// --- Initialize Lucide Icons ---
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// --- Magnetic Buttons ---
function initMagneticButtons() {
    const magnets = document.querySelectorAll('.magnetic-wrap');
    magnets.forEach(magnet => {
        if (magnet.children.length > 0) {
            const btn = magnet.children[0];
            magnet.addEventListener('mousemove', (e) => {
                const rect = magnet.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                if (typeof gsap !== 'undefined') {
                    gsap.to(btn, {
                        x: x * 0.3,
                        y: y * 0.3,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }
            });
            magnet.addEventListener('mouseleave', () => {
                if (typeof gsap !== 'undefined') {
                    gsap.to(btn, {
                        x: 0,
                        y: 0,
                        duration: 0.5,
                        ease: "elastic.out(1, 0.3)"
                    });
                }
            });
        }
    });
}

// --- Lenis Smooth Scrolling ---
let lenis;
function initSmoothScroll() {
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }
}

// --- Three.js 3D Scene (Monochrome wireframe + emerald accent light) ---
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    if (!container || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- Main Geometry: Wireframe Icosahedron ---
    const icoGeometry = new THREE.IcosahedronGeometry(1.8, 1);
    const icoMaterial = new THREE.MeshBasicMaterial({
        color: 0x171717,
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });
    const icosahedron = new THREE.Mesh(icoGeometry, icoMaterial);
    scene.add(icosahedron);

    // --- Inner solid icosahedron (subtle) ---
    const innerGeo = new THREE.IcosahedronGeometry(1.2, 0);
    const innerMat = new THREE.MeshBasicMaterial({
        color: 0xededed,
        transparent: true,
        opacity: 0.3,
        wireframe: true
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // --- Floating particles ---
    const particleCount = 300;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 12;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particleMat = new THREE.PointsMaterial({
        size: 0.02,
        color: 0x171717,
        transparent: true,
        opacity: 0.3
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- Emerald accent dot (single point of color per design.md) ---
    const accentGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const accentMat = new THREE.MeshBasicMaterial({ color: 0x3ecf8e });
    const accentDot = new THREE.Mesh(accentGeo, accentMat);
    accentDot.position.set(2.2, 1.5, 0);
    scene.add(accentDot);

    // Mouse tracking
    let mouseX = 0;
    let mouseY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    });

    // Animation
    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // Gentle rotation
        icosahedron.rotation.y = elapsed * 0.15;
        icosahedron.rotation.x = elapsed * 0.08;
        
        innerMesh.rotation.y = -elapsed * 0.1;
        innerMesh.rotation.z = elapsed * 0.12;
        
        particles.rotation.y = elapsed * 0.03;

        // Accent dot orbit
        accentDot.position.x = Math.cos(elapsed * 0.5) * 2.5;
        accentDot.position.y = Math.sin(elapsed * 0.7) * 1.8;
        accentDot.position.z = Math.sin(elapsed * 0.3) * 0.5;

        // Mouse-reactive subtle rotation
        icosahedron.rotation.y += (mouseX * 0.3 - icosahedron.rotation.y) * 0.02;
        icosahedron.rotation.x += (mouseY * 0.2 - icosahedron.rotation.x) * 0.02;

        renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// --- GSAP Registration ---
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

// --- Home Page Animations ---
function initHomeAnimations() {
    if (typeof gsap === 'undefined') return;

    // Hero title word reveals (staggered)
    const titleWords = document.querySelectorAll('.hero-title-word');
    if (titleWords.length > 0) {
        gsap.to(titleWords, {
            y: 0,
            duration: 1.2,
            ease: "power4.out",
            stagger: 0.12,
            delay: 0.3
        });
    }

    // Hero subtitle fade
    const heroSub = document.querySelector('.hero-subtitle');
    if (heroSub) {
        gsap.to(heroSub, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            delay: 0.8
        });
    }

    // Hero buttons + scroll indicator
    const heroBtns = document.querySelectorAll('.hero-btns');
    if (heroBtns.length > 0) {
        gsap.to(heroBtns, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            delay: 1.1,
            stagger: 0.1
        });
    }

    // Scroll-triggered fade-up animations
    const fadeUps = document.querySelectorAll('.gsap-fade-up');
    fadeUps.forEach(elem => {
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.fromTo(elem, 
                { y: 40, opacity: 0 },
                { 
                    y: 0, 
                    opacity: 1, 
                    duration: 0.8, 
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: elem,
                        start: "top 88%",
                    }
                }
            );
        } else {
            gsap.fromTo(elem, 
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
            );
        }
    });

    // Step number color animation on scroll
    const stepItems = document.querySelectorAll('.step-item');
    stepItems.forEach(item => {
        if (typeof ScrollTrigger !== 'undefined') {
            const numberEl = item.querySelector('.step-number');
            if (numberEl) {
                gsap.to(numberEl, {
                    color: '#171717',
                    duration: 0.4,
                    scrollTrigger: {
                        trigger: item,
                        start: "top 80%",
                    }
                });
            }
        }
    });

    // Metric number count-up animation
    const metricNumbers = document.querySelectorAll('.metric-number');
    metricNumbers.forEach(el => {
        if (typeof ScrollTrigger !== 'undefined') {
            const text = el.textContent.trim();
            const numMatch = text.match(/(\d+)/);
            if (numMatch) {
                const target = parseInt(numMatch[1]);
                const suffix = text.replace(numMatch[1], '');
                const obj = { val: 0 };
                gsap.to(obj, {
                    val: target,
                    duration: 1.5,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 85%",
                    },
                    onUpdate: () => {
                        el.textContent = Math.round(obj.val) + suffix;
                    }
                });
            }
        }
    });
}

// --- Navbar Glass Effect on Scroll ---
function initNavScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const applyNavStyle = () => {
        if (window.scrollY > 20) {
            navbar.classList.add('nav-glass');
        } else {
            navbar.classList.remove('nav-glass');
        }
    };

    window.addEventListener('scroll', applyNavStyle, { passive: true });
    applyNavStyle();
}

// --- Initialize All ---
function initAll() {
    initMagneticButtons();
    initSmoothScroll();
    initNavScroll();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
} else {
    initAll();
}

// Run on window load (after layout computed)
window.addEventListener('load', () => {
    initThreeJS();
    initHomeAnimations();
});
