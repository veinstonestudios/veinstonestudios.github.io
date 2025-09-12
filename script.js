document.addEventListener('DOMContentLoaded', () => {

    // Header scroll effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Instant navigation links
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.currentTarget.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - header.offsetHeight;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'auto' // Instant jump
                });
            }
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
            window.scrollTo({
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
    }, { threshold: 0.2 });

    const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
    elementsToAnimate.forEach(el => {
        observer.observe(el);
    });

    // Hero parallax effect (This is for the vertical parallax on the main hero image, not the horizontal ones)
    // Note: The original hero section does not have the parallax-bg div, so this might not be doing anything.
    // I'm keeping it in case you want to add a background to the hero section later.
    const hero = document.querySelector('#hero');
    window.addEventListener('scroll', () => {
        const scrollPosition = window.pageYOffset;
        // This will only work if the hero section has a background image set in CSS
        hero.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
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
                start: "top bottom",
                end: "bottom top",
                scrub: true // This removes the inertia
            }
        });
    });

});