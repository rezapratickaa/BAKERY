const productBox = document.getElementById("productBox");
const totalPrice = document.getElementById("totalPrice");
const orderNoTitle = document.querySelector(".order-summary h2");
const orderPlacedDate = document.querySelector(".order-summary p");
const statusMessageTime = document.querySelector(".status-message time");
const statusMessageText = document.querySelector(".status-message p");

function formatRupiah(num) {
    if (typeof num === 'string' && num.includes('Rp')) return num;
    const n = parseInt(String(num).replace(/[^0-9]/g, ''), 10) || 0;
    return 'Rp ' + n.toLocaleString('id-ID');
}

function loadOrderStatus() {
    let orders = [];
    try {
        const raw = localStorage.getItem("bakery_orders");
        if (raw) orders = JSON.parse(raw);
    } catch (e) {
        orders = [];
    }

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("id");

    let targetOrder = null;
    if (orderId && orders.length > 0) {
        targetOrder = orders.find(o => String(o.id) === String(orderId));
    }
    if (!targetOrder && orders.length > 0) {
        targetOrder = orders[0]; // Ambil pesanan terakhir
    }

    if (targetOrder) {
        if (orderNoTitle) {
            orderNoTitle.textContent = `Order No: #${targetOrder.orderNumber || targetOrder.id}`;
        }
        if (orderPlacedDate) {
            orderPlacedDate.textContent = `Placed On ${targetOrder.date}`;
        }
        if (totalPrice) {
            totalPrice.textContent = targetOrder.total;
        }
        if (statusMessageTime) {
            statusMessageTime.textContent = targetOrder.date;
        }
        if (statusMessageText) {
            statusMessageText.textContent = `Pesanan Anda (${targetOrder.statusText}) sedang diproses oleh dapur TEFA Bakery.`;
        }

        if (productBox) {
            productBox.innerHTML = "";
            const items = targetOrder.items && targetOrder.items.length > 0 
                ? targetOrder.items 
                : [{
                    name: targetOrder.product,
                    qty: targetOrder.qty || 1,
                    price: targetOrder.total,
                    rawPrice: targetOrder.rawTotal || 0,
                    image: targetOrder.productImage
                }];

            items.forEach(item => {
                const row = document.createElement("article");
                row.className = "product-row";
                const img = item.image || targetOrder.productImage || 'assets/image/card_image/roti_pizza.png';

                row.innerHTML = `
                    <div class="product-thumb" style="width:55px; height:55px; flex-shrink:0; border-radius:8px; overflow:hidden; background:#eee; display:flex; align-items:center; justify-content:center; font-size:24px;">
                        <img src="${img}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null;this.parentElement.innerHTML='🥖';">
                    </div>
                    <div class="product-info" style="flex:1;">
                        <h3>${item.name}</h3>
                        <p style="color:#777; font-size:13px;">Kategori: Roti &amp; Pastry Fresh</p>
                    </div>
                    <p class="product-qty">Qty : <span>${item.qty}</span></p>
                    <p class="product-price"><strong>${formatRupiah(item.price || item.rawPrice || targetOrder.total)}</strong></p>
                `;
                productBox.appendChild(row);
            });

            // Tambahkan rincian pengiriman & penerima jika ada
            if (targetOrder.recipient || targetOrder.address) {
                const deliveryCard = document.createElement("div");
                deliveryCard.style.cssText = "margin-top: 20px; padding: 16px; background: #faf7f2; border-radius: 8px; border: 1px solid #ebd8bb; font-size: 13.5px; line-height: 1.6; color: #444;";
                deliveryCard.innerHTML = `
                    <h4 style="font-size: 14px; color: #522c1a; margin-bottom: 8px;">Informasi Pengiriman &amp; Penerima:</h4>
                    <p><strong>Penerima:</strong> ${targetOrder.recipient || '-'} (${targetOrder.phone || '-'})</p>
                    <p><strong>Metode Pengiriman:</strong> ${targetOrder.deliveryMethod === 'pickup' ? 'Ambil di Toko (Pickup)' : 'Antar ke Alamat (Delivery)'}</p>
                    <p><strong>Alamat:</strong> ${targetOrder.address || '-'}</p>
                    <p><strong>Metode Pembayaran:</strong> ${targetOrder.payment || '-'}</p>
                    ${targetOrder.notes ? `<p><strong>Catatan:</strong> <em>${targetOrder.notes}</em></p>` : ''}
                `;
                productBox.appendChild(deliveryCard);
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", loadOrderStatus);
loadOrderStatus();

const statusSignOutBtn = document.getElementById("statusSignOut");
if (statusSignOutBtn) {
    statusSignOutBtn.addEventListener("click", function(event) {
        event.preventDefault();
        if (confirm("Apakah Anda yakin ingin sign out dari akun Anda?")) {
            localStorage.removeItem("bakery_user");
            window.location.href = "home.html";
        }
    });
}
