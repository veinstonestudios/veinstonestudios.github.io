document.addEventListener('DOMContentLoaded', () => {
    const scrollContainer = document.getElementById('scroll-container');
    const customScrollbar = document.getElementById('custom-scrollbar');
    const header = document.querySelector('header');

    scrollContainer.addEventListener('scroll', () => {
        // Header scroll effect
        if (scrollContainer.scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Custom scrollbar update
        const scrollPercentage = scrollContainer.scrollTop / (scrollContainer.scrollHeight - scrollContainer.clientHeight);
        customScrollbar.style.setProperty('--scroll-top', `${scrollPercentage * (scrollContainer.clientHeight - 12)}px`); // 12 is the height of the thumb
    });

    // Instant navigation links
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('href');
            
            // Only handle anchor links (starting with #), allow external links to work normally
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - header.offsetHeight;
                    scrollContainer.scrollTo({
                        top: offsetTop,
                        behavior: 'auto' // Instant jump
                    });
                }
            }
            // External links (like presskit.html) will navigate normally
        });
    });

    // Hero button instant scroll
    const heroButton = document.querySelector('#hero .btn');
    heroButton.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            const offsetTop = targetSection.offsetTop - header.offsetHeight;
            scrollContainer.scrollTo({
                top: offsetTop,
                behavior: 'auto' // Instant jump
            });
        }
    });

    // Animate elements on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { root: scrollContainer, threshold: 0.2 });

    const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
    elementsToAnimate.forEach(el => {
        observer.observe(el);
    });

    // Horizontal parallax scrolling for sections
    const parallaxSections = document.querySelectorAll('.parallax-section');
    parallaxSections.forEach((section, index) => {
        const bg = section.querySelector('.parallax-bg');
        let direction = index % 2 === 0 ? -1 : 1; // Alternate direction

        gsap.fromTo(bg, {
            x: direction * 200
        }, {
            x: direction * -200,
            ease: "none",
            scrollTrigger: {
                trigger: section,
                scroller: scrollContainer, // Use the container for scroll trigger
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });
});