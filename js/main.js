document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile Menu Toggle ---
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('nav-active');
            // Toggle hamburger icon between ☰ and ✕
            if (navLinks.classList.contains('nav-active')) {
                mobileMenuBtn.innerHTML = '✕';
            } else {
                mobileMenuBtn.innerHTML = '☰';
            }
        });
    }

    // --- Sticky Navbar on Scroll ---
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Active Link Highlighting based on current page ---
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // --- Intersection Observer for Scroll Animations ---
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Optional: Stop observing once animated
                // observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => scrollObserver.observe(el));

    // --- Stats Counter Animation ---
    const statsCounters = document.querySelectorAll('[data-target]');
    let hasCounted = false;

    const runCounters = () => {
        statsCounters.forEach(counter => {
            counter.innerText = '0';
            const updateCounter = () => {
                const target = +counter.getAttribute('data-target');
                const c = +counter.innerText;
                const increment = target / 200; // Adjust speed

                if (c < target) {
                    counter.innerText = `${Math.ceil(c + increment)}`;
                    setTimeout(updateCounter, 10);
                } else {
                    counter.innerText = target;
                }
            };
            updateCounter();
        });
    }

    const statsSection = document.querySelector('.stats-bar');
    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry.isIntersecting && !hasCounted) {
                runCounters();
                hasCounted = true;
            }
        }, { threshold: 0.5 });
        
        statsObserver.observe(statsSection);
    }

    // --- Testimonial Carousel ---
    const track = document.querySelector('.testimonial-track');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    let currentIndex = 0;

    if (track && dots.length > 0) {
        const updateCarousel = (index) => {
            track.style.transform = `translateX(-${index * 100}%)`;
            dots.forEach(d => d.classList.remove('active'));
            dots[index].classList.add('active');
        };

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentIndex = index;
                updateCarousel(currentIndex);
            });
        });

        // Auto rotate
        setInterval(() => {
            currentIndex = (currentIndex + 1) % dots.length;
            updateCarousel(currentIndex);
        }, 5000);
    }

    // --- Portfolio Filtering ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioCards = document.querySelectorAll('.portfolio-card');

    if (filterBtns.length > 0 && portfolioCards.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('btn-primary'));
                filterBtns.forEach(b => b.classList.add('btn-outline'));
                btn.classList.add('btn-primary');
                btn.classList.remove('btn-outline');

                const filterValue = btn.getAttribute('data-filter');

                portfolioCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    if (filterValue === 'all' || filterValue === category) {
                        card.style.display = 'flex';
                        // Add a small animation effect
                        card.style.animation = 'float 0.5s ease-out';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // --- FAQ Accordion ---
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            // Toggle current item
            item.classList.toggle('active');
        });
    });

});
