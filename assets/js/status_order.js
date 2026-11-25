const productBox = document.getElementById("productBox");
const totalPrice = document.getElementById("totalPrice");
const orderNoTitle = document.getElementById("orderNoTitle");
const orderPlacedDate = document.getElementById("orderPlacedDate");
const statusTime = document.getElementById("statusTime");
const statusDesc = document.getElementById("statusDesc");
const orderSummaryBox = document.getElementById("orderSummaryBox");
const orderTimeline = document.getElementById("orderTimeline");
const orderStatusMessage = document.getElementById("orderStatusMessage");
const noOrderAlert = document.getElementById("noOrderAlert");

const stepPlaced = document.getElementById("stepPlaced");
const stepProgress = document.getElementById("stepProgress");
const stepShipped = document.getElementById("stepShipped");
const stepDelivered = document.getElementById("stepDelivered");

function formatRupiah(num) {
    if (typeof num === 'string' && num.includes('Rp')) return num;
    const n = parseInt(String(num).replace(/[^0-9]/g, ''), 10) || 0;
    return 'Rp ' + n.toLocaleString('id-ID');
}

function updateTimeline(statusText, status) {
    const text = (statusText || '').toLowerCase();
    const st = (status || '').toLowerCase();

    const resetSteps = () => {
        [stepPlaced, stepProgress, stepShipped, stepDelivered].forEach(s => {
            if (s) {
                s.className = "step pending";
            }
        });
    };

    resetSteps();

    if (text.includes('delivered') || text.includes('selesai') || st === 'completed') {
        if (stepPlaced) stepPlaced.className = "step done";
        if (stepProgress) stepProgress.className = "step done";
        if (stepShipped) stepShipped.className = "step done";
        if (stepDelivered) stepDelivered.className = "step done";
    } else if (text.includes('shipped') || text.includes('dikirim')) {
        if (stepPlaced) stepPlaced.className = "step done";
        if (stepProgress) stepProgress.className = "step done";
        if (stepShipped) stepShipped.className = "step current";
    } else if (text.includes('cancelled') || st === 'cancelled') {
        if (stepPlaced) stepPlaced.className = "step done";
        if (stepProgress) stepProgress.className = "step pending";
    } else {
        if (stepPlaced) stepPlaced.className = "step done";
        if (stepProgress) stepProgress.className = "step current";
    }
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
        targetOrder = orders[0];
    }

    if (!targetOrder) {
        if (orderSummaryBox) orderSummaryBox.hidden = true;
        if (orderTimeline) orderTimeline.hidden = true;
        if (orderStatusMessage) orderStatusMessage.hidden = true;
        if (productBox) productBox.hidden = true;
        if (noOrderAlert) noOrderAlert.hidden = false;
        return;
    }

    if (noOrderAlert) noOrderAlert.hidden = true;
    if (orderSummaryBox) orderSummaryBox.hidden = false;
    if (orderTimeline) orderTimeline.hidden = false;
    if (orderStatusMessage) orderStatusMessage.hidden = false;
    if (productBox) productBox.hidden = false;

    if (orderNoTitle) {
        orderNoTitle.textContent = `#${targetOrder.orderNumber || targetOrder.id}`;
    }
    if (orderPlacedDate) {
        orderPlacedDate.textContent = `Placed On ${targetOrder.date || '-'}`;
    }
    if (totalPrice) {
        totalPrice.textContent = targetOrder.total || 'Rp 0';
    }
    if (statusTime) {
        statusTime.textContent = targetOrder.date || '-';
    }
    if (statusDesc) {
        const text = targetOrder.statusText || 'In progress';
        statusDesc.textContent = `Pesanan Anda (${text}) sedang diproses oleh dapur TEFA Bakery.`;
    }

    updateTimeline(targetOrder.statusText, targetOrder.status);

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
                <div class="product-thumb">
                    <img src="${img}" alt="${item.name || 'Produk'}" onerror="this.onerror=null;this.parentElement.innerHTML='🥖';">
                </div>
                <div class="product-info">
                    <h3>${item.name || 'Produk Roti'}</h3>
                    <p style="color:#7A6559; font-size:13px;">Kategori: Roti &amp; Pastry Fresh</p>
                </div>
                <p class="product-qty">Qty : <span>${item.qty || 1}</span></p>
                <p class="product-price"><strong>${formatRupiah(item.price || item.rawPrice || targetOrder.total)}</strong></p>
            `;
            productBox.appendChild(row);
        });

        if (targetOrder.recipient || targetOrder.address) {
            const deliveryCard = document.createElement("div");
            deliveryCard.style.cssText = "margin-top: 20px; padding: 18px; background: #FAF7F2; border-radius: 12px; border: 1px solid #EBD8BB; font-size: 13.5px; line-height: 1.6; color: #2B1810;";
            deliveryCard.innerHTML = `
                <h4 style="font-size: 14.5px; font-weight: 700; color: #522C1A; margin-bottom: 8px;">Informasi Pengiriman &amp; Penerima:</h4>
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

document.addEventListener("DOMContentLoaded", loadOrderStatus);
loadOrderStatus();
