function loadComponent(targetSelector, filePath) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Gagal memuat ${filePath} (Status: ${response.status})`);
            }
            return response.text();
        })
        .then(html => {
            const target = document.querySelector(targetSelector);
            if (!target) return;

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const componentElement = doc.body.firstElementChild;

            if (componentElement) {
                target.replaceWith(componentElement);
            } else {
                target.innerHTML = html;
            }
        })
        .catch(err => console.error(err));
}

function autoLoadComponents() {
    const elements = document.querySelectorAll('[data-component]');
    elements.forEach(el => {
        const componentPath = el.getAttribute('data-component');
        loadComponent(`[data-component="${componentPath}"]`, componentPath);
    });
}

// ==========================================
// Testimonials Slider (Auto-Slide + Touch Swipe)
// ==========================================
function initTestimonialsSlider() {
    const track = document.querySelector('.testimonials-track');
    const cards = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    const dotsContainer = document.querySelector('.slider-dots');
    if (!track || cards.length === 0) return;

    let currentIndex = 0;
    const getVisibleCards = () => window.innerWidth <= 768 ? 1 : (window.innerWidth <= 1024 ? 2 : 3);
    const maxIndex = () => Math.max(0, cards.length - getVisibleCards());

    function renderDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        const totalDots = maxIndex() + 1;
        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement('button');
            dot.className = `slider-dot ${i === currentIndex ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Slide ${i + 1}`);
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    function updateDots() {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.slider-dot');
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = Math.max(0, Math.min(index, maxIndex()));
        const cardWidth = cards[0].offsetWidth + 30; // 30 is gap
        track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
        updateDots();
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            goToSlide(currentIndex === 0 ? maxIndex() : currentIndex - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToSlide(currentIndex >= maxIndex() ? 0 : currentIndex + 1);
        });
    }

    renderDots();

    // Auto-slide setiap 3.5 detik (pause saat hover)
    let autoSlide = setInterval(() => {
        goToSlide(currentIndex >= maxIndex() ? 0 : currentIndex + 1);
    }, 3500);

    const sliderWrapper = document.querySelector('.testimonials-slider-wrapper');
    if (sliderWrapper) {
        sliderWrapper.addEventListener('mouseenter', () => clearInterval(autoSlide));
        sliderWrapper.addEventListener('mouseleave', () => {
            clearInterval(autoSlide);
            autoSlide = setInterval(() => {
                goToSlide(currentIndex >= maxIndex() ? 0 : currentIndex + 1);
            }, 3500);
        });
    }

    // Touch Swipe untuk HP/Tablet
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchEndX = touchStartX;
        clearInterval(autoSlide);
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
        touchEndX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', () => {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 40) {
            if (diff > 0) {
                goToSlide(currentIndex >= maxIndex() ? 0 : currentIndex + 1); // Swipe kiri -> slide berikutnya
            } else {
                goToSlide(currentIndex === 0 ? maxIndex() : currentIndex - 1); // Swipe kanan -> slide sebelumnya
            }
        }
        clearInterval(autoSlide);
        autoSlide = setInterval(() => {
            goToSlide(currentIndex >= maxIndex() ? 0 : currentIndex + 1);
        }, 3500);
    });

    window.addEventListener('resize', () => {
        renderDots();
        goToSlide(currentIndex);
    });
}

// ==========================================
// Filter Tab Daftar Menu (Semua | Makanan | Minuman)
// ==========================================
function initMenuFilter() {
    const tabBtns = document.querySelectorAll('.menu-tab-btn');
    const categories = document.querySelectorAll('.menu-category');
    if (tabBtns.length === 0 || categories.length === 0) return;

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const selected = btn.getAttribute('data-category');
            categories.forEach(cat => {
                const catType = cat.getAttribute('data-category');
                if (selected === 'all' || selected === catType) {
                    cat.style.display = 'block';
                } else {
                    cat.style.display = 'none';
                }
            });
        });
    });
}


// Card Component Loader
let _cardTpl = null;
function loadCardComponents() {
    const els = document.querySelectorAll('[data-card]');
    if (!els.length) return Promise.resolve();
    const load = _cardTpl ? Promise.resolve(_cardTpl)
        : fetch('components/card.html').then(r => r.text()).then(t => { _cardTpl = t; return t; });
    return load.then(tpl => {
        els.forEach(el => {
            const img = el.dataset.img;
            const icon = el.dataset.icon || 'fa-bread-slice';
            const imageHtml = img
                ? `<img src="${img}" alt="${el.dataset.name}">`
                : `<div class="menu-img-placeholder"><i class="fa-solid ${icon}"></i></div>`;
            el.outerHTML = tpl
                .replace('{{name}}', el.dataset.name || '')
                .replace('{{price}}', el.dataset.price || '')
                .replace('{{rating}}', el.dataset.rating || '5,0')
                .replace('{{sold}}', el.dataset.sold || '0 Sold')
                .replace('{{image}}', imageHtml);
        });
    });
}
// Jalankan saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    autoLoadComponents();
    loadCardComponents().then(() => initMenuFilter());
    initTestimonialsSlider();

    if (document.getElementById('navbar') && !document.querySelector('[data-component*="navbar"]')) {
        loadComponent('#navbar', 'components/navbar.html');
    }
});
