const BAKERY_ORDERS_KEY = 'bakery_orders';

// Demo fallback orders jika belum pernah checkout
const demoOrders = [
  {
    id: 1,
    orderNumber: 1,
    status: "active",
    statusText: "In progress",
    date: "2 June 2023 2:40 PM",
    delivery: "8 June 2023",
    payment: "Cash on delivery",
    product: "Macha",
    productImage: "assets/image/card_image/roti_pizza.png",
    emoji: "🍵",
    qty: 1,
    total: "Rp 25.000",
    recipient: "Ujang Merdeka",
    address: "Jl. Roti Lezat No. 12, Bandung",
    items: [
      { name: "Macha Pastry", qty: 1, price: "Rp 25.000" }
    ]
  },
  {
    id: 2,
    orderNumber: 2,
    status: "active",
    statusText: "Shipped",
    date: "2 June 2023 2:40 PM",
    delivery: "8 June 2023",
    payment: "Transfer Bank",
    product: "Roti Madu",
    productImage: "assets/image/card_image/roti_abon.png",
    emoji: "🍞",
    qty: 1,
    total: "Rp 18.000",
    recipient: "Ujang Merdeka",
    address: "Jl. Roti Lezat No. 12, Bandung",
    items: [
      { name: "Roti Madu", qty: 1, price: "Rp 18.000" }
    ]
  },
  {
    id: 3,
    orderNumber: 3,
    status: "completed",
    statusText: "Completed",
    date: "1 June 2023 9:30 AM",
    delivery: "4 June 2023",
    payment: "QRIS",
    product: "Croissant",
    productImage: "assets/image/card_image/croissant.png",
    emoji: "🥐",
    qty: 2,
    total: "Rp 36.000",
    recipient: "Ujang Merdeka",
    address: "Ambil di Toko (Pickup)",
    items: [
      { name: "Butter Croissant", qty: 2, price: "Rp 18.000" }
    ]
  },
  {
    id: 4,
    orderNumber: 4,
    status: "cancelled",
    statusText: "Cancelled",
    date: "28 May 2023 11:20 AM",
    delivery: "-",
    payment: "Cash on delivery",
    product: "Roti Cokelat",
    productImage: "assets/image/card_image/roti_coklat.png",
    emoji: "🥯",
    qty: 1,
    total: "Rp 12.000",
    recipient: "Ujang Merdeka",
    address: "Jl. Roti Lezat No. 12, Bandung",
    items: [
      { name: "Roti Cokelat", qty: 1, price: "Rp 12.000" }
    ]
  }
];

function getOrders() {
  try {
    const raw = localStorage.getItem(BAKERY_ORDERS_KEY);
    const stored = raw ? JSON.parse(raw) : [];
    if (stored && stored.length > 0) {
      // Gabungkan pesanan checkout terbaru pengguna dengan beberapa demo status lainnya
      return [...stored, ...demoOrders.filter(d => !stored.some(s => s.id === d.id))];
    }
  } catch (e) {
    console.error("Gagal membaca bakery_orders", e);
  }
  return demoOrders;
}

const ordersList = document.getElementById("ordersList");
const emptyMessage = document.getElementById("emptyMessage");
const tabs = document.querySelectorAll(".tab");
const searchInput = document.getElementById("searchInput");


let currentStatus = "active";

function renderOrders() {
  const allOrders = getOrders();
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const filteredOrders = allOrders.filter(order => {
    const sameStatus = order.status === currentStatus;
    const matchesSearch =
      (order.product && order.product.toLowerCase().includes(keyword)) ||
      String(order.id).toLowerCase().includes(keyword) ||
      (order.statusText && order.statusText.toLowerCase().includes(keyword));

    return sameStatus && matchesSearch;
  });

  if (!ordersList) return;
  ordersList.innerHTML = "";

  if (emptyMessage) {
    emptyMessage.hidden = filteredOrders.length !== 0;
  }

  filteredOrders.forEach(order => {
    const card = document.createElement("article");
    card.className = "order-card";

    const imageHtml = order.productImage
      ? `<img src="${order.productImage}" alt="${order.product}" onerror="this.onerror=null;this.parentElement.innerHTML='${order.emoji || '🥖'}';">`
      : (order.emoji || '🥖');

    card.innerHTML = `
      <div class="order-heading">
        <div>
          <h2>Order No ${order.orderNumber || order.id}</h2>
          <p><strong>Order Date :</strong> ${order.date}</p>
          <p><strong>Estimated Delivery Date :</strong> ${order.delivery}</p>
        </div>
        <div class="order-meta">
          <p><strong>Order Status :</strong> <span class="status-pill status-${order.status}">${order.statusText}</span></p>
          <p><strong>Payment Method :</strong> ${order.payment}</p>
        </div>
      </div>
      <div class="product-row">
        <div class="product-picture" aria-hidden="true">${imageHtml}</div>
        <div class="product-info">
          <h3>${order.product}</h3>
          <p><strong>Qty :</strong> ${order.qty} pcs</p>
          <p><strong>Total :</strong> ${order.total}</p>
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

// Initial render
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
