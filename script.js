// Mobile Navigation Toggle
const hamburger = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a nav link
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    const navbar = document.querySelector('.navbar');
    const heroLogo = document.querySelector('.hero-logo');
    const navLogo = document.querySelector('.nav-logo a');
    const heroName = document.querySelector('.hero-name');
    const heroAvatar = document.getElementById('hero-avatar');
    const heroSection = document.getElementById('home');
    const heroRoleText = document.querySelector('.hero-logo-role');
    const heroInnerScroller = document.getElementById('hero-scroller');

    // Initialize floating icons inside the skills section
    function initSkillsFloaters() {
        const section = document.querySelector('#experience .skills-section');
        const layer = document.querySelector('.skills-floaters');
        const iconNodes = Array.from(section.querySelectorAll('.skills-grid .skill-item i'));
        if (!section || !layer || iconNodes.length === 0) return;

        const rect = () => layer.getBoundingClientRect();
        const floaters = [];

        iconNodes.forEach((icon, idx) => {
            const floater = document.createElement('div');
            floater.className = 'skills-floater';
            const cloneIcon = icon.cloneNode(true);
            floater.appendChild(cloneIcon);
            layer.appendChild(floater);

            const box = rect();
            const x = Math.random() * (box.width - 60) + 10;
            const y = Math.random() * (box.height - 60) + 10;
            const vx = (Math.random() * 60 + 30) * (Math.random() < 0.5 ? -1 : 1); // px/s
            const vy = (Math.random() * 60 + 30) * (Math.random() < 0.5 ? -1 : 1);
            floater.style.left = `${x}px`;
            floater.style.top = `${y}px`;

            floaters.push({ el: floater, target: icon, x, y, vx, vy });
        });

        let running = true;
        let last = performance.now();
        function tick(now) {
            if (!running) return;
            const dt = Math.min(0.04, (now - last) / 1000); // cap delta
            last = now;
            const box = rect();
            floaters.forEach(f => {
                f.x += f.vx * dt;
                f.y += f.vy * dt;
                if (f.x <= 4 || f.x >= box.width - 56) { f.vx *= -1; f.x = Math.max(4, Math.min(f.x, box.width - 56)); }
                if (f.y <= 4 || f.y >= box.height - 56) { f.vy *= -1; f.y = Math.max(4, Math.min(f.y, box.height - 56)); }
                f.el.style.left = `${f.x}px`;
                f.el.style.top = `${f.y}px`;
            });
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);

        // Collect to targets when section is in view
        let collected = false;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && !collected) {
                    collected = true;
                    running = false; // stop bouncing
                    floaters.forEach(f => {
                        const layerBox = rect();
                        const tgtBox = f.target.getBoundingClientRect();
                        const containerBox = layer.getBoundingClientRect();
                        const left = tgtBox.left - containerBox.left + tgtBox.width/2 - 26;
                        const top = tgtBox.top - containerBox.top + tgtBox.height/2 - 26;

                        f.el.style.left = `${left}px`;
                        f.el.style.top = `${top}px`;
                        f.el.style.transform = 'scale(1.1)';

                        f.el.addEventListener('transitionend', () => {
                            const cell = f.target.closest('.skill-item');
                            if (cell) {
                                // Add shine layer once
                                if (!cell.querySelector('.shine')) {
                                    const shine = document.createElement('span');
                                    shine.className = 'shine';
                                    cell.appendChild(shine);
                                }
                                cell.classList.add('collide','shine-run');
                                setTimeout(() => cell.classList.remove('collide'), 400);
                                setTimeout(() => cell.classList.remove('shine-run'), 700);
                            }
                            f.el.style.opacity = '0';
                            setTimeout(() => f.el.remove(), 300);
                        }, { once: true });
                    });
                }
            });
        }, { threshold: 0.25, rootMargin: '0px 0px -35% 0px' });
        io.observe(section);
    }

    initSkillsFloaters();

    // Avatar tilt (no spin) with smoothed rAF interpolation
    if (heroAvatar) {
        // Cache-bust the avatar in local dev so updates appear immediately
        const img = heroAvatar.querySelector('.avatar-img');
        if (img && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
            img.src = img.src.split('?')[0] + '?v=' + Date.now();
        }

        const tiltMax = 12; // degrees
        let targetX = 0, targetY = 0; // desired angles
        let curX = 0, curY = 0;       // current rendered angles
        let animId = null;

        function animateTilt() {
            // ease toward target (lerp)
            curX += (targetX - curX) * 0.18;
            curY += (targetY - curY) * 0.18;
            heroAvatar.style.transform = `perspective(900px) rotateX(${curX}deg) rotateY(${curY}deg)`;
            if (Math.abs(targetX - curX) > 0.05 || Math.abs(targetY - curY) > 0.05) {
                animId = requestAnimationFrame(animateTilt);
            } else {
                animId = null;
            }
        }

        function setTargetFromEvent(e) {
            const rect = heroAvatar.getBoundingClientRect();
            let x = (e.clientX - rect.left) / rect.width;  // may be outside 0..1
            let y = (e.clientY - rect.top) / rect.height;  // may be outside 0..1
            // Clamp to avoid extreme rotations or flip-like effects
            x = Math.max(0, Math.min(1, x));
            y = Math.max(0, Math.min(1, y));
            targetY = (x - 0.5) * tiltMax * 2; // -tilt..tilt (Y axis)
            targetX = (0.5 - y) * tiltMax * 2; // -tilt..tilt (X axis)
            if (!animId) animId = requestAnimationFrame(animateTilt);
        }

        heroAvatar.addEventListener('mousemove', setTargetFromEvent);
        // If the hero internal scroller overlaps the avatar, forward its mouse moves
        if (heroInnerScroller) {
            heroInnerScroller.addEventListener('mousemove', setTargetFromEvent);
            heroInnerScroller.addEventListener('mouseleave', () => {
                targetX = 0; targetY = 0; if (!animId) animId = requestAnimationFrame(animateTilt);
            });
        }
        heroAvatar.addEventListener('mouseleave', () => {
            targetX = 0;
            targetY = 0;
            if (!animId) animId = requestAnimationFrame(animateTilt);
        });

        // Ensure spin is off if previously toggled
        heroAvatar.classList.remove('spinning');
    }

    // Background title changes while scrolling through hero
    if (heroSection && heroRoleText) {
        const titles = [
            'SOFTWARE DEVELOPER',
            'FULL‑STACK DEVELOPER',
            'BACKEND DEVELOPER',
            'DATABASE MANAGER',
            'API DEVELOPER',
            'CLOUD ENGINEER',
            'PRODUCT DEVELOPER'
        ];

        let currentIndex = 0;
        let rafId = null;

        function computeIndexFromWindow() {
            const start = heroSection.offsetTop;
            const height = Math.max(1, heroSection.offsetHeight);
            const y = window.scrollY;
            const progress = Math.min(0.999, Math.max(0, (y - start) / height));
            const idx = Math.min(titles.length - 1, Math.floor(progress * titles.length));
            return idx;
        }

        function applyTitle(idx) {
            if (idx === currentIndex) return;
            currentIndex = idx;
            heroRoleText.classList.add('swap');
            setTimeout(() => {
                heroRoleText.textContent = titles[currentIndex];
                heroRoleText.classList.remove('swap');
            }, 180);
        }

        // Initialize text
        heroRoleText.textContent = titles[0];

        if (heroInnerScroller) {
            // Use internal scroller progress instead of window
            const content = heroInnerScroller.querySelector('.hero-scroller-content');
            const stepPx = 250; // reduced from 420 for closer transitions
            const setHeight = () => { if (content) content.style.height = `${stepPx * titles.length}px`; };
            setHeight();
            window.addEventListener('resize', setHeight);

            let advanced = false;
            function onInnerScroll() {
                const max = heroInnerScroller.scrollHeight - heroInnerScroller.clientHeight;
                const progress = max > 0 ? heroInnerScroller.scrollTop / max : 0;
                const idx = Math.min(titles.length - 1, Math.floor(progress * titles.length));
                if (rafId) return;
                rafId = requestAnimationFrame(() => {
                    rafId = null;
                    applyTitle(idx);
                });

                if (!advanced && heroInnerScroller.scrollTop >= max - 2) {
                    advanced = true;
                    // Release scroll to page and auto-advance to next section
                    heroInnerScroller.style.overscrollBehavior = 'auto';
                    const next = document.getElementById('about');
                    if (next) {
                        window.scrollTo({ top: next.offsetTop - 60, behavior: 'smooth' });
                    }
                }
            }
            heroInnerScroller.addEventListener('scroll', onInnerScroll);
        } else {
            function onScrollTitles() {
                if (rafId) return;
                rafId = requestAnimationFrame(() => {
                    rafId = null;
                    applyTitle(computeIndexFromWindow());
                });
            }
            window.addEventListener('scroll', onScrollTitles);
        }
    }

    // Work section: stacked scroll — expand next, collapse previous
    const workStack = document.getElementById('work-stack');
    if (workStack) {
        const cards = Array.from(workStack.querySelectorAll('.work-card'));

        // Reveal on view (kept simple)
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('revealed'); });
        }, { threshold: 0.1, rootMargin: '-15% 0px -15% 0px' });
        cards.forEach(c => io.observe(c));

        let stickyTops = [];
        let step = Math.max(400, window.innerHeight * 0.9);
        let thresholds = [];

        const recompute = () => {
            // Increased step size for slower transitions between tiles
            step = Math.max(400, window.innerHeight * 0.8);
            stickyTops = cards.map(c => parseFloat(getComputedStyle(c).top) || 0);
            const base = Math.min(...stickyTops);
            const biases = stickyTops.map(t => t - base);
            thresholds = cards.map((_, i) => i * step + biases[i]);

            // Container height so last card fully shows, with minimal tail gap
            const last = cards[cards.length - 1];
            const lastHeight = last ? last.offsetHeight : 600;
            const total = thresholds[thresholds.length - 1] + lastHeight + 24;
            workStack.style.height = `${Math.max(total, window.innerHeight + 100)}px`;
        };
        recompute();
        window.addEventListener('resize', recompute);

        let raf = null;
        const onScroll = () => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                raf = null;
                // Determine active card using scroll progress through threshold bands.
                const y = window.scrollY - workStack.offsetTop;
                
                // Larger enter bias for slower, more deliberate transitions
                const enterBias = Math.max(60, Math.min(120, Math.round(window.innerHeight * 0.12)));
                
                let idx = 0;
                for (let i = 0; i < thresholds.length; i++) {
                    if (y >= thresholds[i] - enterBias) idx = i;
                }

                // Toggle active header state
                cards.forEach((c, i) => c.classList.toggle('active', i === idx));

                // Apply smooth opening animation to all cards with buffer zones
                cards.forEach((card, i) => {
                    card.style.removeProperty('--open');
                    
                    let open = 0;
                    
                    if (i === idx) {
                        // Current active card - always prioritized
                        if (i < thresholds.length - 1) {
                            const start = thresholds[i] - enterBias;
                            const end = thresholds[i + 1] - enterBias;
                            const range = end - start;
                            const progress = Math.max(0, Math.min(1, (y - start) / range));
                            
                            // Smooth easing for active card
                            const easeInOut = (t) => {
                                return t < 0.5 
                                    ? 4 * t * t * t 
                                    : 1 - Math.pow(-2 * t + 2, 3) / 2;
                            };
                            
                            // Extended open phase with longer buffer for slower transitions
                            if (progress <= 0.25) {
                                // Slower, more gradual open phase
                                open = easeInOut(progress / 0.25);
                            } else if (progress <= 0.9) {
                                // Stay fully open - much longer buffer zone
                                open = 1;
                            } else {
                                // Very gentle close phase - only at the very end
                                open = 1 - easeInOut((progress - 0.9) / 0.1);
                            }
                        } else {
                            // Last card - stays open
                            open = 1;
                        }
                    } else if (i === idx - 1 && idx > 0) {
                        // Previous card - stays open longer for smooth handoff
                        const currentStart = thresholds[idx] - enterBias;
                        const currentEnd = thresholds[idx + 1] ? thresholds[idx + 1] - enterBias : currentStart + (window.innerHeight * 0.6);
                        const currentRange = currentEnd - currentStart;
                        const currentProgress = Math.max(0, Math.min(1, (y - currentStart) / currentRange));
                        
                        // Only start closing when next card is very well established (70% buffer)
                        if (currentProgress <= 0.7) {
                            // Stay fully open during extended buffer zone
                            open = 1;
                        } else {
                            // Very gentle fade out after extended buffer
                            const fadeProgress = (currentProgress - 0.7) / 0.3;
                            open = Math.max(0, 1 - (fadeProgress * fadeProgress * fadeProgress)); // Slower ease-out curve
                        }
                    } else if (i === idx + 1 && y > thresholds[i] - enterBias - (window.innerHeight * 0.4)) {
                        // Next card - start opening even earlier for slower preview
                        const previewStart = thresholds[i] - enterBias - (window.innerHeight * 0.4);
                        const previewRange = window.innerHeight * 0.4;
                        const previewProgress = Math.max(0, Math.min(1, (y - previewStart) / previewRange));
                        
                        // Very gentle preview opening
                        open = previewProgress * 0.2; // Max 20% open as gentle preview
                    }
                    
                    card.style.setProperty('--open', Math.max(0, Math.min(1, open)).toFixed(3));
                });
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }
    console.log('Elements found:', {
        navbar: !!navbar,
        heroLogo: !!heroLogo,
        navLogo: !!navLogo
    });
    
    // Logo Animation and Navbar on scroll
    function handleScroll() {
        const scrollY = window.scrollY;
        
        // Trigger animation when scrolled more than 100px
        if (scrollY > 100) {
            if (navbar) navbar.classList.add('scrolled');
            if (heroLogo) heroLogo.classList.add('scrolled');
            if (heroName) heroName.classList.add('scrolled');
            if (navLogo) navLogo.style.opacity = '1';
        } else {
            if (navbar) navbar.classList.remove('scrolled');
            if (heroLogo) heroLogo.classList.remove('scrolled');
            if (heroName) heroName.classList.remove('scrolled');
            if (navLogo) navLogo.style.opacity = '0';
        }
    }
    
    window.addEventListener('scroll', handleScroll);
    
    // Call once to set initial state
    handleScroll();
});

// Active navigation link highlighting
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function highlightNavLink() {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', highlightNavLink);

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.skill-category, .project-card, .stat');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Night sky starfield in hero section
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('hero-particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let w = 0, h = 0; // logical CSS pixels
    let stars = [];
    let rafId = null;

    function makeStar() {
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            z: Math.random() * 0.8 + 0.2, // depth 0.2..1
            r: Math.random() * 1.1 + 0.25, // base radius
            tw: Math.random() * 0.9 + 0.2, // twinkle speed
            t: Math.random() * Math.PI * 2, // twinkle phase
            vx: (Math.random() * 0.06 - 0.03), // subtle drift X
            vy: (Math.random() * 0.06 - 0.03)  // subtle drift Y
        };
    }

    function resize() {
        // Size to the full hero section, not just the canvas rect
        const host = canvas.parentElement || canvas;
        const rect = (host === canvas) ? canvas.getBoundingClientRect() : host.getBoundingClientRect();

        // Apply CSS size explicitly so getBoundingClientRect reflects hero size
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';

        // Handle high-DPI displays
        const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels

        w = Math.max(1, Math.floor(rect.width));
        h = Math.max(1, Math.floor(rect.height));

        // Maintain star density relative to area
        const density = 0.0012; // stars per pixel (CSS px)
        const target = Math.min(1000, Math.floor(w * h * density));
        if (stars.length > target) {
            stars.length = target;
        } else {
            while (stars.length < target) stars.push(makeStar());
        }
    }

    function clearAll() {
        // Clear using device pixel dims to avoid partial clears with scaled context
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Restore CSS pixel scale
        const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
        clearAll();
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const s of stars) {
            // Motion
            s.x += s.vx;
            s.y += s.vy;
            // Wrap around edges
            if (s.x < -5) s.x = w + 5; else if (s.x > w + 5) s.x = -5;
            if (s.y < -5) s.y = h + 5; else if (s.y > h + 5) s.y = -5;
            // Twinkle
            s.t += s.tw * 0.03;
            const alpha = 0.45 + 0.55 * Math.sin(s.t);
            const radius = s.r * (0.6 + s.z * 0.9);

            // Soft glow using radial gradient
            const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, radius * 3);
            glow.addColorStop(0, `rgba(255,255,255,${0.9 * alpha})`);
            glow.addColorStop(1, 'rgba(160,180,255,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        rafId = requestAnimationFrame(draw);
    }

    // Observe the hero section for size changes to keep coverage full
    const host = canvas.parentElement || canvas;
    const ro = new ResizeObserver(() => resize());
    ro.observe(host);

    // Pause rendering when out of view to save battery
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (!e.isIntersecting) {
                if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            } else if (!rafId) {
                rafId = requestAnimationFrame(draw);
            }
        });
    }, { threshold: 0 });
    io.observe(host);

    // Initial kick-off
    resize();
    rafId = requestAnimationFrame(draw);
});

// Contact form handling
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        // Get form data for validation
        const formData = new FormData(this);
        const name = formData.get('name');
        const email = formData.get('_replyto');
        const subject = formData.get('_subject');
        const message = formData.get('message');
        
        // Simple validation
        if (!name || !email || !subject || !message) {
            e.preventDefault();
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            e.preventDefault();
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // If validation passes, show loading message and let form submit naturally to Formspree
        showNotification('Sending message...', 'info');
        
        // The form will now submit to Formspree automatically
        // No preventDefault() - let the browser handle the submission
    });
}

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 10000;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    `;
    
    notification.querySelector('.notification-close').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Typing animation for hero subtitle
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize typing animation when page loads
document.addEventListener('DOMContentLoaded', () => {
    const subtitle = document.querySelector('.hero-subtitle');
    if (subtitle) {
        const originalText = subtitle.textContent;
        setTimeout(() => {
            typeWriter(subtitle, originalText, 80);
        }, 1000);
    }
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.hero');
    
    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Skills animation on scroll
function animateSkillBars() {
    const skillItems = document.querySelectorAll('.skill-item');
    
    skillItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0) scale(1)';
        }, index * 100);
    });
}

// Counter animation for stats
function animateCounters() {
    const counters = document.querySelectorAll('.stat h3');
    
    counters.forEach(counter => {
        const target = parseInt(counter.textContent);
        const increment = target / 100;
        let count = 0;
        
        const timer = setInterval(() => {
            count += increment;
            if (count >= target) {
                counter.textContent = target + (counter.textContent.includes('+') ? '+' : '') + (counter.textContent.includes('%') ? '%' : '');
                clearInterval(timer);
            } else {
                counter.textContent = Math.ceil(count) + (counter.textContent.includes('+') ? '+' : '') + (counter.textContent.includes('%') ? '%' : '');
            }
        }, 20);
    });
}

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.addEventListener('DOMContentLoaded', () => {
    const statsSection = document.querySelector('.about-stats');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }
});

// Project card hover effects
document.addEventListener('DOMContentLoaded', () => {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
});

// Smooth reveal animation for sections
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        revealObserver.observe(section);
    });
    
    // Add CSS for revealed state
    const style = document.createElement('style');
    style.textContent = `
        .revealed {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
});

// Back to top button
function createBackToTopButton() {
    const button = document.createElement('button');
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    button.className = 'back-to-top';
    button.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: var(--primary-color, #667eea);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    `;
    
    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    document.body.appendChild(button);
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            button.style.opacity = '1';
            button.style.visibility = 'visible';
        } else {
            button.style.opacity = '0';
            button.style.visibility = 'hidden';
        }
    });
}

document.addEventListener('DOMContentLoaded', createBackToTopButton);

// Developer Terminal Functionality
document.addEventListener('DOMContentLoaded', () => {
    const devModeToggle = document.getElementById('dev-mode-toggle');
    const devModeToggleMobile = document.getElementById('dev-mode-toggle-mobile');
    const devTerminal = document.getElementById('dev-terminal');
    const terminalBackdrop = document.getElementById('terminal-backdrop');
    const terminalClose = document.getElementById('terminal-close');
    const terminalInput = document.getElementById('terminal-input');
    const terminalContent = document.getElementById('terminal-content');

    let commandHistory = [];
    let historyIndex = -1;

    // Terminal commands
    const commands = {
        help: {
            description: 'Show available commands',
            action: () => `Available commands:
${Object.keys(commands).map(cmd => `  ${cmd.padEnd(15)} - ${commands[cmd].description}`).join('\n')}`
        },
        about: {
            description: 'About Rakesh Surampalli',
            action: () => `👨‍💻 Rakesh Surampalli
🎓 Software Developer & Full-Stack Engineer
🌟 Passionate about creating innovative web solutions
📍 Currently working on modern web applications
💼 Experienced in React, Node.js, Python, and more`
        },
        skills: {
            description: 'Technical skills and expertise',
            action: () => `🔧 Technical Skills:
Frontend: React, Vue.js, JavaScript, HTML5, CSS3, Sass
Backend: Node.js, Python, PHP, Express.js
Database: MongoDB, MySQL, PostgreSQL
Tools: Git, Docker, AWS, VS Code, Figma
Architecture: REST APIs, Microservices, CI/CD`
        },
        experience: {
            description: 'Work experience and roles',
            action: () => `💼 Work Experience:
[01] Software Developer • Company A (2024 - Present)
     Built responsive web apps and optimized performance
     
[02] Frontend Engineer • Company B (2023 - 2024)
     Delivered component libraries and design systems
     
[03] Full-Stack Intern • Company C (2021 - 2023)
     Assisted with feature development and testing`
        },
        projects: {
            description: 'Featured projects and work',
            action: () => `🚀 Featured Projects:
• E-Commerce Platform - Full-featured shopping solution
• Task Management App - Collaborative project management
• Weather Dashboard - Real-time weather application
• Blog Platform - Modern content management system

Type 'github' to visit my GitHub profile`
        },
        contact: {
            description: 'Contact information',
            action: () => `📧 Contact Information:
Email: your.email@example.com
Phone: +1 (555) 123-4567
Location: Your City, Country
LinkedIn: https://www.linkedin.com/in/rakeshsurampalli27/
GitHub: https://github.com/rakeshsurampalli

Feel free to reach out for opportunities!`
        },
        github: {
            description: 'Open GitHub profile',
            action: () => {
                window.open('https://github.com/rakeshsurampalli', '_blank');
                return '🔗 Opening GitHub profile...';
            }
        },
        linkedin: {
            description: 'Open LinkedIn profile',
            action: () => {
                window.open('https://www.linkedin.com/in/rakeshsurampalli27/', '_blank');
                return '🔗 Opening LinkedIn profile...';
            }
        },
        resume: {
            description: 'View/Download resume',
            action: () => {
                // Close terminal first, then open resume viewer
                const terminalBackdrop = document.getElementById('terminal-backdrop');
                const devTerminal = document.getElementById('dev-terminal');
                const resumeBackdrop = document.getElementById('resume-backdrop');
                const resumeViewer = document.getElementById('resume-viewer');
                
                if (terminalBackdrop && devTerminal) {
                    terminalBackdrop.classList.remove('active');
                    devTerminal.classList.remove('active');
                }
                
                // Small delay to ensure terminal closes first
                setTimeout(() => {
                    if (resumeBackdrop && resumeViewer) {
                        resumeBackdrop.classList.add('active');
                        resumeViewer.classList.add('active');
                    }
                }, 150);
                
                return '📄 Opening resume viewer...';
            }
        },
        clear: {
            description: 'Clear terminal screen',
            action: () => {
                terminalContent.innerHTML = '';
                return '';
            }
        },
        whoami: {
            description: 'Current user information',
            action: () => 'rakesh@portfolio'
        },
        pwd: {
            description: 'Print working directory',
            action: () => '/home/rakesh/portfolio'
        },
        ls: {
            description: 'List directory contents',
            action: () => `about.txt  skills.txt  experience.txt  projects.txt  contact.txt`
        },
        date: {
            description: 'Show current date and time',
            action: () => new Date().toString()
        },
        echo: {
            description: 'Display a line of text',
            action: (args) => args.join(' ')
        }
    };

    // Function to open terminal (shared by both buttons)
    function openTerminal() {
        terminalBackdrop.classList.add('active');
        devTerminal.classList.add('active');
        setTimeout(() => terminalInput.focus(), 300);
        
        // Close mobile menu if open
        const navMenu = document.getElementById('nav-menu');
        const hamburger = document.getElementById('nav-toggle');
        if (navMenu && hamburger) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        }
    }

    // Open terminal - Desktop button
    devModeToggle?.addEventListener('click', openTerminal);
    
    // Open terminal - Mobile button
    devModeToggleMobile?.addEventListener('click', openTerminal);

    // Close terminal
    terminalClose?.addEventListener('click', () => {
        terminalBackdrop.classList.remove('active');
        devTerminal.classList.remove('active');
    });

    // Close terminal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && devTerminal.classList.contains('active')) {
            terminalBackdrop.classList.remove('active');
            devTerminal.classList.remove('active');
        }
    });

    // Handle terminal input
    terminalInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const input = terminalInput.value.trim();
            if (input) {
                executeCommand(input);
                commandHistory.unshift(input);
                historyIndex = -1;
            }
            terminalInput.value = '';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                terminalInput.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                terminalInput.value = commandHistory[historyIndex];
            } else if (historyIndex === 0) {
                historyIndex = -1;
                terminalInput.value = '';
            }
        }
    });

    function executeCommand(input) {
        // Add command to terminal
        addTerminalLine(`rakesh@portfolio:~$`, input, 'terminal-command');

        const parts = input.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (commands[command]) {
            const result = commands[command].action(args);
            if (result) {
                addTerminalLine('', result, command === 'clear' ? '' : 'terminal-text');
            }
        } else {
            addTerminalLine('', `Command not found: ${command}. Type 'help' for available commands.`, 'terminal-error');
        }

        // Scroll to bottom
        terminalContent.scrollTop = terminalContent.scrollHeight;
    }

    function addTerminalLine(prompt, text, className = 'terminal-text') {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        
        if (prompt) {
            const promptSpan = document.createElement('span');
            promptSpan.className = 'terminal-prompt';
            promptSpan.textContent = prompt;
            line.appendChild(promptSpan);
        }
        
        const textSpan = document.createElement('span');
        textSpan.className = className;
        textSpan.textContent = text;
        line.appendChild(textSpan);
        
        terminalContent.appendChild(line);
    }

    // Click backdrop to close terminal
    terminalBackdrop?.addEventListener('click', () => {
        terminalBackdrop.classList.remove('active');
        devTerminal.classList.remove('active');
    });

    // Prevent terminal from closing when clicking inside terminal
    devTerminal?.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});

// Modern geometric shape animations
document.addEventListener('DOMContentLoaded', () => {
    const shapes = document.querySelectorAll('.shape');
    
    shapes.forEach((shape, index) => {
        shape.addEventListener('mouseenter', () => {
            shape.style.transform = 'scale(1.2) rotate(45deg)';
            shape.style.opacity = '0.8';
        });
        
        shape.addEventListener('mouseleave', () => {
            shape.style.transform = 'scale(1) rotate(0deg)';
            shape.style.opacity = '0.6';
        });
    });
    
    // Add parallax effect to shapes
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.1;
            shape.style.transform = `translateY(${rate * speed}px)`;
        });
    });
});

// Resume Viewer Functionality
document.addEventListener('DOMContentLoaded', () => {
    const resumeToggle = document.getElementById('resume-toggle');
    const resumeToggleMobile = document.getElementById('resume-toggle-mobile');
    const resumeBackdrop = document.getElementById('resume-backdrop');
    const resumeViewer = document.getElementById('resume-viewer');
    const resumeClose = document.getElementById('resume-close');
    const resumeDownload = document.getElementById('resume-download');
    const resumeFrame = document.getElementById('resume-frame');

    // Function to open resume viewer
    function openResumeViewer() {
        resumeBackdrop.classList.add('active');
        resumeViewer.classList.add('active');
        
        // Close mobile menu if open
        const navMenu = document.getElementById('nav-menu');
        const hamburger = document.getElementById('nav-toggle');
        if (navMenu && hamburger) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        }
        
        // Try to load the PDF, if it fails, show error message
        const iframe = resumeFrame;
        iframe.onload = function() {
            console.log('PDF loaded successfully');
        };
        iframe.onerror = function() {
            console.log('PDF failed to load, trying alternative path');
            // Try alternative path
            iframe.src = '../RAKESH_Resume_Product_Developer.pdf';
        };
    }

    // Open resume viewer - Desktop button
    resumeToggle?.addEventListener('click', (e) => {
        e.preventDefault();
        openResumeViewer();
    });
    
    // Open resume viewer - Mobile button
    resumeToggleMobile?.addEventListener('click', (e) => {
        e.preventDefault();
        openResumeViewer();
    });

    // Close resume viewer
    resumeClose?.addEventListener('click', () => {
        resumeBackdrop.classList.remove('active');
        resumeViewer.classList.remove('active');
    });

    // Close resume viewer with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && resumeViewer.classList.contains('active')) {
            resumeBackdrop.classList.remove('active');
            resumeViewer.classList.remove('active');
        }
    });

    // Download resume with multiple path attempts
    resumeDownload?.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = './RAKESH_Resume_Product_Developer.pdf';
        link.download = 'Rakesh_Surampalli_Resume.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Click backdrop to close resume viewer
    resumeBackdrop?.addEventListener('click', () => {
        resumeBackdrop.classList.remove('active');
        resumeViewer.classList.remove('active');
    });

    // Prevent resume viewer from closing when clicking inside viewer
    resumeViewer?.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});
