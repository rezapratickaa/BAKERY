const WISHLIST_STORAGE_KEY = 'bakery_wishlist';
const DEFAULT_WISHLIST_SEED = ['roti-pizza', 'roti-pisang-coklat', 'roti-gulung-abon'];

function getWishlistIds() {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (raw === null) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(DEFAULT_WISHLIST_SEED));
      return [...DEFAULT_WISHLIST_SEED];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveWishlistIds(ids) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Gagal menyimpan wishlist:', error);
  }
  window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { ids } }));
}

function resolveProduct(id) {
  if (typeof PRODUCTS_DATA !== 'undefined' && Array.isArray(PRODUCTS_DATA)) {
    return PRODUCTS_DATA.find(p => p.id === id) || null;
  }
  return null;
}

function renderWishlist() {
  const grid = document.getElementById('wishlistGrid');
  const emptyState = document.getElementById('emptyWishlistState');
  const countBadge = document.getElementById('wishlistCountBadge');
  const clearBtn = document.getElementById('clearWishlistBtn');

  if (!grid || !emptyState) return;

  const ids = getWishlistIds();
  const products = ids.map(id => resolveProduct(id)).filter(Boolean);

  if (countBadge) {
    countBadge.textContent = `${products.length} Produk`;
  }

  if (clearBtn) {
    clearBtn.hidden = products.length === 0;
  }

  if (products.length === 0) {
    grid.innerHTML = '';
    grid.hidden = true;
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  grid.hidden = false;

  grid.innerHTML = products.map(product => `
    <article class="wishlist-card" data-id="${product.id}">
      <div class="wishlist-card-media">
        <a href="detail_product.html?id=${encodeURIComponent(product.id)}" aria-label="Lihat detail ${product.name}">
          <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='assets/image/card_image/roti_pizza.png';">
        </a>
        <span class="wishlist-category-pill">${product.category || 'Roti'}</span>
        <button type="button" class="btn-remove-wishlist" data-action="remove" data-id="${product.id}" title="Hapus dari wishlist" aria-label="Hapus ${product.name} dari wishlist">
          <i class="fa-solid fa-heart" aria-hidden="true"></i>
        </button>
      </div>

      <div class="wishlist-card-body">
        <a href="detail_product.html?id=${encodeURIComponent(product.id)}" class="wishlist-card-title">
          ${product.name}
        </a>

        <div class="wishlist-card-meta">
          <span class="wishlist-rating"><i class="fa-solid fa-star" aria-hidden="true"></i> ${product.rating || '4.8'}</span>
          <span class="wishlist-sold">· ${product.sold || 'Terlaris'}</span>
        </div>

        <div class="wishlist-card-price">${product.price}</div>

        <div class="wishlist-card-footer">
          <button type="button" class="btn-add-cart" data-action="add-cart" data-id="${product.id}">
            <i class="fa-solid fa-cart-shopping" aria-hidden="true"></i> Tambah ke Keranjang
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

function handleRemove(productId) {
  const current = getWishlistIds();
  const updated = current.filter(id => id !== productId);
  saveWishlistIds(updated);

  const product = resolveProduct(productId);
  const name = product ? product.name : 'Produk';
  if (typeof showToast === 'function') {
    showToast(`${name} dihapus dari wishlist.`);
  }

  renderWishlist();
}

function handleAddToCart(productId) {
  if (typeof addToCart === 'function') {
    addToCart(productId, 1);
  }

  const product = resolveProduct(productId);
  const name = product ? product.name : 'Produk';
  if (typeof showToast === 'function') {
    showToast(`${name} berhasil ditambahkan ke keranjang!`);
  }
}

function handleClear() {
  if (!confirm('Apakah Anda yakin ingin mengosongkan wishlist?')) {
    return;
  }
  saveWishlistIds([]);
  if (typeof showToast === 'function') {
    showToast('Wishlist berhasil dikosongkan.');
  }
  renderWishlist();
}

function initWishlistPage() {
  const grid = document.getElementById('wishlistGrid');
  if (grid) {
    grid.addEventListener('click', event => {
      const removeBtn = event.target.closest('[data-action="remove"]');
      if (removeBtn) {
        event.preventDefault();
        event.stopPropagation();
        handleRemove(removeBtn.dataset.id);
        return;
      }

      const addBtn = event.target.closest('[data-action="add-cart"]');
      if (addBtn) {
        event.preventDefault();
        event.stopPropagation();
        handleAddToCart(addBtn.dataset.id);
      }
    });
  }

  const clearBtn = document.getElementById('clearWishlistBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', handleClear);
  }

  const signOutBtn = document.getElementById('wishlistSignOut');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', event => {
      event.preventDefault();
      localStorage.removeItem('bakery_user');
      if (typeof showToast === 'function') {
        showToast('Anda telah berhasil keluar.');
      }
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 500);
    });
  }

  renderWishlist();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWishlistPage);
} else {
  initWishlistPage();
}
