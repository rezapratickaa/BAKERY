// ============================================
// CART MANAGEMENT (LOCALSTORAGE + BADGE)
// ============================================
const CART_STORAGE_KEY = 'bakery_cart';

function getCart() {
    try {
        const data = localStorage.getItem(CART_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error('Gagal menyimpan cart', e);
    }
    updateCartBadge();
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
}

function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge, #navbarCartBadge');
    if (!badges.length) return;

    const cart = getCart();
    const totalCount = cart.reduce((sum, item) => sum + (parseInt(item.qty, 10) || 1), 0);

    badges.forEach(badge => {
        if (totalCount > 0) {
            badge.textContent = totalCount > 99 ? '99+' : totalCount;
            badge.hidden = false;
            badge.style.display = 'flex';
        } else {
            badge.hidden = true;
            badge.style.display = 'none';
        }
    });
}

function addToCart(productId, qty = 1) {
    const count = parseInt(qty, 10) || 1;
    let product = null;
    if (typeof PRODUCTS_DATA !== 'undefined') {
        product = PRODUCTS_DATA.find(p => p.id === productId);
    }

    if (!product) {
        console.warn('Produk tidak ditemukan:', productId);
        return;
    }

    const cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === productId);

    if (existingIndex > -1) {
        cart[existingIndex].qty = (parseInt(cart[existingIndex].qty, 10) || 1) + count;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            rawPrice: product.rawPrice,
            image: product.image,
            qty: count,
            checked: true
        });
    }

    saveCart(cart);
}

function showToast(message) {
    let toast = document.getElementById('globalCartToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'globalCartToast';
        toast.className = 'cart-toast';
        toast.innerHTML = `<i class="fa-solid fa-circle-check" aria-hidden="true"></i><span class="toast-text"></span>`;
        document.body.appendChild(toast);
    }

    const textEl = toast.querySelector('.toast-text');
    if (textEl) textEl.textContent = message;

    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

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
                if (filePath.includes('navbar')) {
                    const currentPage = window.location.pathname.split('/').pop() || 'home.html';
                    const navLinks = componentElement.querySelectorAll('.center-nav a');
                    navLinks.forEach(link => {
                        const href = link.getAttribute('href');
                        if (href === currentPage || (currentPage === '' && href === 'home.html')) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    });
                    updateCartBadge();
                    syncUserAuthUI();
                }
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

// Testimonials Slider (Auto-Slide + Touch Swipe)
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
                goToSlide(currentIndex >= maxIndex() ? 0 : currentIndex + 1);
            } else {
                goToSlide(currentIndex === 0 ? maxIndex() : currentIndex - 1); 
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

// Filter Tab Daftar Menu (Makanan | Minuman)
function initMenuFilter() {
    const tabBtns = document.querySelectorAll('.menu-tab-btn');
    const categories = document.querySelectorAll('.menu-category');
    if (tabBtns.length === 0 || categories.length === 0) return;

    function applyFilter(selected) {
        categories.forEach(cat => {
            const catType = cat.getAttribute('data-category');
            if (selected === 'all' || selected === catType) {
                cat.style.display = 'block';
            } else {
                cat.style.display = 'none';
            }
        });
    }

    // Terapkan filter awal sesuai tombol aktif
    const activeBtn = document.querySelector('.menu-tab-btn.active');
    if (activeBtn) {
        applyFilter(activeBtn.getAttribute('data-category'));
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const selected = btn.getAttribute('data-category');
            applyFilter(selected);
        });
    });
}

// Card Component Loader (Dinamis dari PRODUCTS_DATA atau data-card)
let _cardTpl = null;
function loadCardComponents() {
    const containers = document.querySelectorAll('[data-render-category]');
    const legacyEls = document.querySelectorAll('[data-card]');

    if (!containers.length && !legacyEls.length) return Promise.resolve();

    const loadTpl = _cardTpl
        ? Promise.resolve(_cardTpl)
        : fetch('assets/components/card.html').then(r => r.text()).then(t => { _cardTpl = t; return t; });

    return loadTpl.then(tpl => {
        // 1. Render dinamis dari array PRODUCTS_DATA ke dalam container
        if (typeof PRODUCTS_DATA !== 'undefined' && containers.length > 0) {
            containers.forEach(container => {
                const category = container.getAttribute('data-render-category');
                const limit = parseInt(container.getAttribute('data-limit'), 10);
                let list = category === 'all' ? PRODUCTS_DATA : PRODUCTS_DATA.filter(p => p.category === category);
                if (limit > 0) list = list.slice(0, limit);

                container.innerHTML = list.map(p => {
                    const imageHtml = p.image
                        ? `<img src="${p.image}" alt="${p.name}">`
                        : `<div class="menu-img-placeholder"><i class="fa-solid fa-bread-slice"></i></div>`;

                    return tpl
                        .replaceAll('{{id}}', p.id)
                        .replace('{{name}}', p.name)
                        .replace('{{price}}', p.price)
                        .replace('{{rating}}', p.rating)
                        .replace('{{sold}}', p.sold)
                        .replace('{{image}}', imageHtml);
                }).join('');
            });
        }

        // 2. Dukungan jika masih ada elemen [data-card] manual
        if (legacyEls.length > 0) {
            legacyEls.forEach(el => {
                const id = el.dataset.id || (el.dataset.name ? el.dataset.name.toLowerCase().replace(/\s+/g, '-') : 'product');
                const img = el.dataset.img;
                const icon = el.dataset.icon || 'fa-bread-slice';
                const imageHtml = img
                    ? `<img src="${img}" alt="${el.dataset.name}">`
                    : `<div class="menu-img-placeholder"><i class="fa-solid ${icon}"></i></div>`;

                el.outerHTML = tpl
                    .replaceAll('{{id}}', id)
                    .replace('{{name}}', el.dataset.name || '')
                    .replace('{{price}}', el.dataset.price || '')
                    .replace('{{rating}}', el.dataset.rating || '5,0')
                    .replace('{{sold}}', el.dataset.sold || '0 Sold')
                    .replace('{{image}}', imageHtml);
            });
        }
    });
}
// Sync User Auth state in Navbar (shows username if logged in)
function syncUserAuthUI() {
    try {
        const raw = localStorage.getItem('bakery_user');
        if (!raw) return;
        const u = JSON.parse(raw);
        if (u && u.isLoggedIn) {
            const btns = document.querySelectorAll('#openAuthModalBtn');
            btns.forEach(btn => {
                const span = btn.querySelector('span');
                const displayName = (u.user || 'Akun Saya').split('@')[0];
                if (span) {
                    span.textContent = displayName.length > 9 ? displayName.slice(0, 9) + '..' : displayName;
                }
                btn.title = `Pesanan & Profil: ${u.user || 'User'}`;
                btn.setAttribute('aria-label', `Buka pesanan ${u.user || 'User'}`);
            });
        }
    } catch (e) {}
}

// Register & Login Modal Dialog (Native <dialog> + Backdrop Blur + Sliding Image)
document.addEventListener('click', (e) => {
    const openBtn = e.target.closest('#openAuthModalBtn, [data-open-register], a[href="#register"], a[href="register.html"]');
    if (openBtn) {
        e.preventDefault();
        // Jika user sudah login, langsung bawa ke my_order.html
        try {
            const raw = localStorage.getItem('bakery_user');
            if (raw) {
                const u = JSON.parse(raw);
                if (u && u.isLoggedIn) {
                    window.location.href = 'my_order.html';
                    return;
                }
            }
        } catch (err) {}

        const dialog = document.getElementById('registerModal');
        if (dialog) {
            const href = openBtn.getAttribute('href') || '';
            if (href.includes('register') || openBtn.dataset.openRegister !== undefined) {
                dialog.classList.add('show-register');
            } else {
                dialog.classList.remove('show-register');
            }
            dialog.showModal();
        }
        return;
    }

    // Klik tombol Masuk Sekarang (karena tanpa database, langsung masuk ke my_order.html)
    const loginSubmitBtn = e.target.closest('.login-panel .dialog-submit-btn');
    if (loginSubmitBtn) {
        e.preventDefault();
        const dialog = document.getElementById('registerModal');
        const emailInput = dialog ? dialog.querySelector('#login-email') : null;
        const userVal = emailInput && emailInput.value.trim() ? emailInput.value.trim() : 'Ujang Merdeka';

        localStorage.setItem('bakery_user', JSON.stringify({
            isLoggedIn: true,
            user: userVal,
            email: userVal.includes('@') ? userVal : `${userVal.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
            loginTime: new Date().toISOString()
        }));

        if (dialog) dialog.close();
        window.location.href = 'my_order.html';
        return;
    }

    const toReg = e.target.closest('#toRegisterBtn');
    const toLog = e.target.closest('#toLoginBtn');
    const dialog = document.getElementById('registerModal');
    if (toReg && dialog) {
        e.preventDefault();
        dialog.classList.add('show-register');
        return;
    }
    if (toLog && dialog) {
        e.preventDefault();
        dialog.classList.remove('show-register');
        return;
    }

    const closeBtn = e.target.closest('#closeRegisterModal');
    if (closeBtn) {
        e.preventDefault();
        if (dialog) dialog.close();
    } else if (dialog && e.target === dialog) {
        dialog.close();
    }
});

// Tangani submit form login & register secara langsung ke my_order.html
document.addEventListener('submit', (e) => {
    const loginForm = e.target.closest('#loginForm, .login-panel form');
    if (loginForm) {
        e.preventDefault();
        const emailInput = loginForm.querySelector('#login-email, input[type="text"], input[type="email"]');
        const userVal = emailInput && emailInput.value.trim() ? emailInput.value.trim() : 'Ujang Merdeka';

        localStorage.setItem('bakery_user', JSON.stringify({
            isLoggedIn: true,
            user: userVal,
            email: userVal.includes('@') ? userVal : `${userVal.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
            loginTime: new Date().toISOString()
        }));

        const dialog = document.getElementById('registerModal');
        if (dialog) dialog.close();
        window.location.href = 'my_order.html';
        return;
    }

    const regForm = e.target.closest('#registerForm, .register-panel form');
    if (regForm) {
        e.preventDefault();
        const usernameInput = regForm.querySelector('#reg-username');
        const emailInput = regForm.querySelector('#reg-email');
        const userVal = usernameInput && usernameInput.value.trim() ? usernameInput.value.trim() : 'Ujang Merdeka';
        const emailVal = emailInput && emailInput.value.trim() ? emailInput.value.trim() : 'ujang@gmail.com';

        localStorage.setItem('bakery_user', JSON.stringify({
            isLoggedIn: true,
            user: userVal,
            email: emailVal,
            loginTime: new Date().toISOString()
        }));

        const dialog = document.getElementById('registerModal');
        if (dialog) dialog.close();
        window.location.href = 'my_order.html';
        return;
    }
});

window.toggleDialogPass = function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const isPass = el.type === 'password';
    el.type = isPass ? 'text' : 'password';
    const icon = el.parentElement.querySelector('.btn-toggle-eye i');
    if (icon) {
        icon.className = isPass ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    }
};

// Promo Banner Carousel (Auto-Slide + Controls + Touch Swipe)
function initPromoCarousel() {
    const track = document.querySelector('.promo-carousel-track');
    const slides = document.querySelectorAll('.promo-carousel-slide');
    const prevBtn = document.querySelector('.promo-prev');
    const nextBtn = document.querySelector('.promo-next');
    const dotsContainer = document.querySelector('.promo-dots');
    if (!track || slides.length === 0) return;

    let currentIndex = 0;
    const totalSlides = slides.length;

    function renderDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = `promo-dot ${i === currentIndex ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Slide Promo ${i + 1}`);
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    function updateDots() {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.promo-dot');
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = (index + totalSlides) % totalSlides;
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateDots();
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
    }

    renderDots();

    let autoTimer = setInterval(() => goToSlide(currentIndex + 1), 3800);
    const container = document.querySelector('.promo-carousel-container');
    if (container) {
        container.addEventListener('mouseenter', () => clearInterval(autoTimer));
        container.addEventListener('mouseleave', () => {
            clearInterval(autoTimer);
            autoTimer = setInterval(() => goToSlide(currentIndex + 1), 3800);
        });

        let startX = 0;
        container.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
        }, { passive: true });
        container.addEventListener('touchend', e => {
            const diffX = e.changedTouches[0].clientX - startX;
            if (Math.abs(diffX) > 40) {
                if (diffX < 0) goToSlide(currentIndex + 1);
                else goToSlide(currentIndex - 1);
            }
        }, { passive: true });
    }
}

// Jalankan saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    autoLoadComponents();
    loadCardComponents().then(() => initMenuFilter());
    initTestimonialsSlider();
    initPromoCarousel();
    updateCartBadge();
    syncUserAuthUI();
    window.addEventListener('storage', () => {
        updateCartBadge();
        syncUserAuthUI();
    });

    if (document.getElementById('navbar') && !document.querySelector('[data-component*="navbar"]')) {
        loadComponent('#navbar', 'assets/components/navbar.html');
    }

    if (window.location.search.includes('register=true') || window.location.hash === '#register') {
        setTimeout(() => {
            const d = document.getElementById('registerModal');
            if (d) d.showModal();
        }, 300);
    }
});
