// Tailwind CSS Custom Configuration
if (typeof tailwind !== 'undefined') {
    tailwind.config = {
        theme: {
            extend: {
                fontFamily: { sans: ['Inter', 'sans-serif'] },
                colors: {
                    black: '#000000',
                    white: '#FFFFFF',
                    surface: '#FAFAFA',
                    card: '#F5F5F5',
                    primary: '#111111',
                    secondary: '#666666',
                    border: '#E5E5E5'
                },
                letterSpacing: { tighter: '-0.04em', tight: '-0.02em' }
            }
        }
    };
}

// Initialize Icons
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// Magnetic Buttons
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

// --- Lenis Smooth Scrolling Setup ---
let lenis;
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

// --- Three.js Rotating Globe inside About Section ---
function initRotatingGlobe() {
    const container = document.getElementById('globe-container');
    if (!container || typeof THREE === 'undefined') return;

    // Grab hand styling cues to signify interaction availability
    container.style.cursor = 'grab';
    container.addEventListener('mousedown', () => { container.style.cursor = 'grabbing'; });
    container.addEventListener('mouseup', () => { container.style.cursor = 'grab'; });

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();

    const initialAspect = width / height;
    const camera = new THREE.PerspectiveCamera(45, initialAspect, 0.1, 1000);
    camera.position.z = 14 / Math.min(1, initialAspect);

    // Lights (Required for textured mesh reflection)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Load Earth Texture Map with local wireframe backup loader
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
        (texture) => {
            const geometry = new THREE.SphereGeometry(4, 32, 32);
            const material = new THREE.MeshPhongMaterial({
                map: texture,
                shininess: 12
            });
            const globeMesh = new THREE.Mesh(geometry, material);
            globeGroup.add(globeMesh);
        },
        undefined,
        (error) => {
            console.warn("DiginixIT: Failed to load online Earth texture map. Loading offline wireframe fallback:", error);
            const geometry = new THREE.SphereGeometry(4, 24, 24);
            const material = new THREE.MeshBasicMaterial({
                color: 0x111111,
                wireframe: true,
                transparent: true,
                opacity: 0.15
            });
            const globeMesh = new THREE.Mesh(geometry, material);
            globeGroup.add(globeMesh);
        }
    );

    // Interactive drag coordinates tracking
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = {
            x: e.clientX,
            y: e.clientY
        };
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };

        // Smooth rotation modification
        globeGroup.rotation.y += deltaMove.x * 0.006;
        globeGroup.rotation.x += deltaMove.y * 0.006;

        previousMousePosition = {
            x: e.clientX,
            y: e.clientY
        };
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Touch Support for Mobile Dragging
    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
    });

    document.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
            const clientX = e.touches[0].clientX;
            const clientY = e.touches[0].clientY;

            const deltaMove = {
                x: clientX - previousMousePosition.x,
                y: clientY - previousMousePosition.y
            };

            globeGroup.rotation.y += deltaMove.x * 0.006;
            globeGroup.rotation.x += deltaMove.y * 0.006;

            previousMousePosition = {
                x: clientX,
                y: clientY
            };
        }
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        // Resume slow idle spin when user is not actively dragging it
        if (!isDragging) {
            globeGroup.rotation.y += 0.0015;
            globeGroup.rotation.x += 0.0002;
        }

        renderer.render(scene, camera);
    }
    animate();

    // Resize observer to scale the globe context correctly
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const w = entry.contentRect.width;
            const h = entry.contentRect.height;
            const aspect = w / h;
            camera.aspect = aspect;
            camera.position.z = 14 / Math.min(1, aspect);
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
    });
    resizeObserver.observe(container);
}

// Wait for DOM to init scripts
window.addEventListener('load', () => {
    initThreeJS();
    initRotatingGlobe();
    initHomeAnimations();
});

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
