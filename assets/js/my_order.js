const BAKERY_ORDERS_KEY = 'bakery_orders';

function getOrders() {
  try {
    const raw = localStorage.getItem(BAKERY_ORDERS_KEY);
    const stored = raw ? JSON.parse(raw) : [];
    return Array.isArray(stored) ? stored : [];
  } catch (e) {
    console.error("Gagal membaca bakery_orders", e);
    return [];
  }
}

const ordersList = document.getElementById("ordersList");
const emptyMessage = document.getElementById("emptyMessage");
const emptyTitle = document.getElementById("emptyTitle");
const emptySubtext = document.getElementById("emptySubtext");
const emptyActionBtn = document.getElementById("emptyActionBtn");
const tabs = document.querySelectorAll(".tab");
const searchInput = document.getElementById("searchInput");

let currentStatus = "active";

function renderOrders() {
  const allOrders = getOrders();
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const filteredOrders = allOrders.filter(order => {
    const sameStatus = (order.status || 'active') === currentStatus;
    const matchesSearch =
      !keyword ||
      (order.product && order.product.toLowerCase().includes(keyword)) ||
      String(order.id).toLowerCase().includes(keyword) ||
      (order.statusText && order.statusText.toLowerCase().includes(keyword));

    return sameStatus && matchesSearch;
  });

  if (!ordersList) return;
  ordersList.innerHTML = "";

  if (emptyMessage) {
    if (filteredOrders.length === 0) {
      emptyMessage.hidden = false;
      if (allOrders.length === 0) {
        if (emptyTitle) emptyTitle.textContent = "Belum Ada Pesanan";
        if (emptySubtext) emptySubtext.textContent = "Anda belum memiliki riwayat pesanan roti atau minuman. Silakan pesan melalui menu produk kami.";
        if (emptyActionBtn) emptyActionBtn.hidden = false;
      } else {
        if (emptyTitle) emptyTitle.textContent = "Tidak Ada Pesanan";
        if (emptySubtext) emptySubtext.textContent = `Tidak ada pesanan pada status "${currentStatus}".`;
        if (emptyActionBtn) emptyActionBtn.hidden = true;
      }
    } else {
      emptyMessage.hidden = true;
    }
  }

  filteredOrders.forEach(order => {
    const card = document.createElement("article");
    card.className = "order-card";

    const imageHtml = order.productImage
      ? `<img src="${order.productImage}" alt="${order.product || 'Produk'}" onerror="this.onerror=null;this.parentElement.innerHTML='${order.emoji || '🥖'}';">`
      : (order.emoji || '🥖');

    card.innerHTML = `
      <div class="order-heading">
        <div>
          <h2>Order No ${order.orderNumber || order.id}</h2>
          <p><strong>Order Date :</strong> ${order.date || '-'}</p>
          <p><strong>Estimated Delivery Date :</strong> ${order.delivery || '-'}</p>
        </div>
        <div class="order-meta">
          <p><strong>Order Status :</strong> <span class="status-pill status-${order.status || 'active'}">${order.statusText || 'In progress'}</span></p>
          <p><strong>Payment Method :</strong> ${order.payment || '-'}</p>
        </div>
      </div>
      <div class="product-row">
        <div class="product-picture" aria-hidden="true">${imageHtml}</div>
        <div class="product-info">
          <h3>${order.product || 'Pesanan Roti'}</h3>
          <p><strong>Qty :</strong> ${order.qty || 1} pcs</p>
          <p><strong>Total :</strong> ${order.total || 'Rp 0'}</p>
        </div>
        <div class="order-actions-group">
          <a href="status_order.html?id=${encodeURIComponent(order.id)}" class="status-link-btn" title="Cek status pengiriman pesanan">
            Status Pesanan &rarr;
          </a>
        </div>
      </div>
    `;

    ordersList.appendChild(card);
  });
}

if (tabs) {
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      currentStatus = tab.dataset.status;

      tabs.forEach(item => {
        const isActive = item === tab;
        item.classList.toggle("active", isActive);
        item.setAttribute("aria-selected", String(isActive));
      });

      renderOrders();
    });
  });
}

if (searchInput) {
  searchInput.addEventListener("input", renderOrders);
}

document.addEventListener("DOMContentLoaded", renderOrders);
renderOrders();

const orderSignOutBtn = document.getElementById("orderSignOut");
if (orderSignOutBtn) {
  orderSignOutBtn.addEventListener("click", event => {
    event.preventDefault();
    if (confirm("Apakah Anda yakin ingin sign out dari akun Anda?")) {
      localStorage.removeItem("bakery_user");
      window.location.href = "home.html";
    }
  });
}
