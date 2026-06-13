// Initialize all features once DOM is fully parsed
function initAll() {
    if (window.initialized) return;
    window.initialized = true;
    
    // Initialize Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Initialize Magnetic Buttons
    initMagneticButtons();

    // Initialize Smooth Scroll
    initSmoothScroll();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
} else {
    initAll();
}

// Magnetic Buttons
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

// Lenis Smooth Scrolling Setup
let lenis;
function initSmoothScroll() {
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-like ease
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


// --- Three.js Cinematic Background ---
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    if (!container || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Particles (Abstract node map representing "digital network")
    const geometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 100;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const material = new THREE.PointsMaterial({
        size: 0.1,
        color: 0x111111, // Dark particles on white background
        transparent: true,
        opacity: 0.4
    });

    const particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    });

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Gentle rotation
        particlesMesh.rotation.y = elapsedTime * 0.05;
        particlesMesh.rotation.x = elapsedTime * 0.02;

        // Mouse follow easing
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;

        particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
        particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);

        renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// --- Growing Network Tree Visualizer Timeline ---
function initNetworkAnimation() {
    const container = document.getElementById('network-visual-container');
    const svg = container ? container.querySelector('.network-svg') : null;
    if (!container || !svg) return;

    // Build repeating GSAP Timeline
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });

    // Set initial states: faint gray nodes and lines, nodes centered
    gsap.set(".network-node", { fill: "#e5e5e5", scale: 1, transformOrigin: "center" });
    gsap.set(".network-line", { stroke: "#e5e5e5", strokeWidth: 1.5 });

    // Generation 0: Root Node lights up in black
    tl.to(".gen-0-node", { fill: "#111111", scale: 1.3, duration: 0.4, ease: "power2.out" })
      .to(".gen-0-node", { scale: 1, duration: 0.2, ease: "power2.inOut" });

    // Generation 1: Lines draw and nodes light up
    tl.to(".gen-1-line", { stroke: "#111111", strokeWidth: 2, duration: 0.4, ease: "power1.inOut" }, "-=0.1")
      .to(".gen-1-node", { fill: "#111111", scale: 1.3, duration: 0.4, ease: "power2.out", stagger: 0.1 })
      .to(".gen-1-node", { scale: 1, duration: 0.2, ease: "power2.inOut", stagger: 0.1 }, "-=0.2");

    // Generation 2: Lines draw and nodes light up
    tl.to(".gen-2-line", { stroke: "#111111", strokeWidth: 2, duration: 0.4, ease: "power1.inOut", stagger: 0.05 }, "-=0.1")
      .to(".gen-2-node", { fill: "#111111", scale: 1.3, duration: 0.4, ease: "power2.out", stagger: 0.05 })
      .to(".gen-2-node", { scale: 1, duration: 0.2, ease: "power2.inOut", stagger: 0.05 }, "-=0.2");

    // Generation 3: Lines draw and nodes light up
    tl.to(".gen-3-line", { stroke: "#111111", strokeWidth: 2, duration: 0.4, ease: "power1.inOut", stagger: 0.03 }, "-=0.1")
      .to(".gen-3-node", { fill: "#111111", scale: 1.3, duration: 0.4, ease: "power2.out", stagger: 0.03 })
      .to(".gen-3-node", { scale: 1, duration: 0.2, ease: "power2.inOut", stagger: 0.03 }, "-=0.2");

    // Generation 4: Lines draw and nodes light up
    tl.to(".gen-4-line", { stroke: "#111111", strokeWidth: 2, duration: 0.4, ease: "power1.inOut", stagger: 0.02 }, "-=0.1")
      .to(".gen-4-node", { fill: "#111111", scale: 1.3, duration: 0.4, ease: "power2.out", stagger: 0.02 })
      .to(".gen-4-node", { scale: 1, duration: 0.2, ease: "power2.inOut", stagger: 0.02 }, "-=0.2");

    // Fade out elements slowly to reset/loop
    tl.to(".network-node", { fill: "#e5e5e5", duration: 0.8, ease: "power2.inOut", delay: 1.5 })
      .to(".network-line", { stroke: "#e5e5e5", strokeWidth: 1.5, duration: 0.8, ease: "power2.inOut" }, "-=0.8");

    // Parallax tilt on mousemove
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        // Max drift angles: 20 degrees
        const rotateX = y * 20;
        const rotateY = x * -20;

        if (typeof gsap !== 'undefined') {
            gsap.to(svg, {
                rotateX: rotateX,
                rotateY: rotateY,
                duration: 0.8,
                ease: "power2.out",
                overwrite: "auto"
            });
        }
    });

    container.addEventListener('mouseleave', () => {
        if (typeof gsap !== 'undefined') {
            gsap.to(svg, {
                rotateX: 0,
                rotateY: 0,
                duration: 1.2,
                ease: "power2.out",
                overwrite: "auto"
            });
        }
    });

    // Touch support for mobile parallax
    container.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            const rect = container.getBoundingClientRect();
            const x = (e.touches[0].clientX - rect.left) / rect.width - 0.5;
            const y = (e.touches[0].clientY - rect.top) / rect.height - 0.5;

            const rotateX = y * 15;
            const rotateY = x * -15;

            if (typeof gsap !== 'undefined') {
                gsap.to(svg, {
                    rotateX: rotateX,
                    rotateY: rotateY,
                    duration: 0.8,
                    ease: "power2.out",
                    overwrite: "auto"
                });
            }
        }
    }, { passive: true });

    container.addEventListener('touchend', () => {
        if (typeof gsap !== 'undefined') {
            gsap.to(svg, {
                rotateX: 0,
                rotateY: 0,
                duration: 1.2,
                ease: "power2.out",
                overwrite: "auto"
            });
        }
    });
}

// Wait for DOM to init scripts
function initAllAnimations() {
    if (window.animationsInitialized) return;
    window.animationsInitialized = true;
    initThreeJS();
    initNetworkAnimation();
    initHomeAnimations();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllAnimations);
} else {
    initAllAnimations();
}

// --- GSAP Animations ---
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}


function initHomeAnimations() {
    if (typeof gsap === 'undefined') return;

    // Hero text reveal
    if (document.querySelector(".hero-title")) {
        gsap.fromTo(".hero-title",
            { y: 150, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.5, ease: "power4.out", delay: 0.2 }
        );
    }
    if (document.querySelector(".hero-subtitle")) {
        gsap.fromTo(".hero-subtitle",
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.5, ease: "power4.out", delay: 0.4 }
        );
    }
    if (document.querySelector(".hero-btns")) {
        gsap.fromTo(".hero-btns",
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.8 }
        );
    }

    // Scroll animations for sections
    const fadeUps = document.querySelectorAll('.gsap-fade-up');
    fadeUps.forEach(elem => {
        gsap.fromTo(elem,
            { y: 50, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: elem,
                    start: "top 85%",
                }
            }
        );
    });
}
