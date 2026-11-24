/* Order Page Logic */
(function () {
    'use strict';

    let orderItems = [];

    function init() {
        loadFromStorage();
        render();
        bindGlobalEvents();

        // Sinkronisasi jika ada tab atau script lain yang mengupdate cart
        window.addEventListener('cartUpdated', () => {
            loadFromStorage();
            render();
        });
        window.addEventListener('storage', (e) => {
            if (e.key === 'bakery_cart') {
                loadFromStorage();
                render();
            }
        });
    }

    function loadFromStorage() {
        if (typeof getCart === 'function') {
            orderItems = getCart();
        } else {
            try {
                const data = localStorage.getItem('bakery_cart');
                orderItems = data ? JSON.parse(data) : [];
            } catch (e) {
                orderItems = [];
            }
        }

        orderItems.forEach(item => {
            if (item.checked === undefined) item.checked = true;
            if (!item.qty || item.qty < 1) item.qty = 1;
        });
    }

    function persistCart() {
        if (typeof saveCart === 'function') {
            saveCart(orderItems);
        } else {
            try {
                localStorage.setItem('bakery_cart', JSON.stringify(orderItems));
            } catch (e) {
                console.error('Gagal menyimpan cart', e);
            }
        }
    }

    function formatRupiah(num) {
        return 'Rp' + Number(num || 0).toLocaleString('id-ID');
    }

    function render() {
        const list = document.getElementById('orderItemsList');
        const empty = document.getElementById('orderEmpty');
        const bottomBar = document.getElementById('orderBottomBar');
        const tableHead = document.querySelector('.order-table-head');
        if (!list) return;

        if (orderItems.length === 0) {
            list.innerHTML = '';
            if (empty) empty.hidden = false;
            if (bottomBar) bottomBar.style.display = 'none';
            if (tableHead) tableHead.style.display = 'none';
            return;
        }

        if (empty) empty.hidden = true;
        if (bottomBar) bottomBar.style.display = '';
        if (tableHead) tableHead.style.display = '';

        list.innerHTML = orderItems.map((item, idx) => {
            const rawPrice = item.rawPrice || (parseInt(String(item.price).replace(/[^0-9]/g, ''), 10) || 0);
            const sub = rawPrice * item.qty;
            const catLabel = item.category === 'makanan' ? 'Makanan' : (item.category === 'minuman' ? 'Minuman' : 'Produk');
            const displayPrice = item.price || formatRupiah(rawPrice);

            return `
            <div class="order-item ${item.checked ? 'selected' : ''}" data-idx="${idx}">
                <label class="order-item-check" aria-label="Pilih ${item.name}">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} data-action="check" data-idx="${idx}" />
                </label>
                <div class="order-product-info">
                    <img src="${item.image}" alt="${item.name}" class="order-product-img" width="72" height="72" loading="lazy" />
                    <div>
                        <p class="order-product-name">${item.name}</p>
                        <span class="order-product-category">${catLabel}</span>
                    </div>
                </div>
                <span class="order-unit-price">${displayPrice}</span>
                <div class="order-qty-stepper">
                    <button type="button" data-action="dec" data-idx="${idx}" aria-label="${item.qty <= 1 ? 'Hapus produk' : 'Kurangi jumlah'}" title="${item.qty <= 1 ? 'Hapus dari keranjang' : 'Kurangi jumlah'}">−</button>
                    <span class="order-qty-val">${item.qty}</span>
                    <button type="button" data-action="inc" data-idx="${idx}" aria-label="Tambah jumlah" title="Tambah jumlah">+</button>
                </div>
                <span class="order-subtotal">${formatRupiah(sub)}</span>
                <div class="order-action-col">
                    <button type="button" class="order-remove-btn" data-action="remove" data-idx="${idx}">Hapus</button>
                    <a href="product.html" class="order-similar-link">Produk Serupa ›</a>
                </div>
            </div>`;
        }).join('');

        updateSummary();
    }

    function updateSummary() {
        const checked = orderItems.filter(i => i.checked);
        const total = checked.reduce((sum, i) => {
            const rawPrice = i.rawPrice || (parseInt(String(i.price).replace(/[^0-9]/g, ''), 10) || 0);
            return sum + (rawPrice * i.qty);
        }, 0);

        const countEl = document.getElementById('totalItemCount');
        const selectedEl = document.getElementById('selectedCount');
        const priceEl = document.getElementById('totalPrice');
        const checkAllEl = document.getElementById('checkAll');

        if (countEl) countEl.textContent = orderItems.length;
        if (selectedEl) selectedEl.textContent = checked.length;
        if (priceEl) priceEl.textContent = formatRupiah(total);
        if (checkAllEl) checkAllEl.checked = orderItems.length > 0 && checked.length === orderItems.length;
    }

    function bindGlobalEvents() {
        const list = document.getElementById('orderItemsList');
        if (list) {
            list.addEventListener('click', function (e) {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;
                const action = btn.dataset.action;
                const idx = parseInt(btn.dataset.idx, 10);

                if (action === 'inc') {
                    orderItems[idx].qty++;
                    persistCart();
                    render();
                } else if (action === 'dec') {
                    if (orderItems[idx].qty > 1) {
                        orderItems[idx].qty--;
                        persistCart();
                        render();
                    } else {
                        // Kuantitas adalah 1, klik minus langsung menghapus produk dari keranjang
                        orderItems.splice(idx, 1);
                        persistCart();
                        render();
                    }
                } else if (action === 'remove') {
                    orderItems.splice(idx, 1);
                    persistCart();
                    render();
                }
            });

            list.addEventListener('change', function (e) {
                const cb = e.target.closest('[data-action="check"]');
                if (!cb) return;
                const idx = parseInt(cb.dataset.idx, 10);
                orderItems[idx].checked = cb.checked;
                persistCart();
                render();
            });
        }

        const checkAllEl = document.getElementById('checkAll');
        if (checkAllEl) {
            checkAllEl.addEventListener('change', function () {
                const val = checkAllEl.checked;
                orderItems.forEach(i => i.checked = val);
                persistCart();
                render();
            });
        }

        const deleteBtn = document.getElementById('deleteSelectedBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function () {
                const before = orderItems.length;
                orderItems = orderItems.filter(i => !i.checked);
                if (orderItems.length < before) {
                    persistCart();
                    render();
                }
            });
        }

        // CHECKOUT & WHATSAPP MODAL LOGIC
        const checkoutModal = document.getElementById('checkoutModal');
        const closeCheckoutModal = document.getElementById('closeCheckoutModal');
        const checkoutForm = document.getElementById('checkoutForm');
        const addressFieldGroup = document.getElementById('addressFieldGroup');
        const customerAddressInput = document.getElementById('orderCustomerAddress');
        const modalSummaryItems = document.getElementById('modalSummaryItems');
        const modalSummaryTotal = document.getElementById('modalSummaryTotal');

        if (checkoutBtn && checkoutModal) {
            checkoutBtn.addEventListener('click', function () {
                const checked = orderItems.filter(i => i.checked);
                if (checked.length === 0) {
                    alert('Pilih minimal 1 produk di keranjang sebelum checkout.');
                    return;
                }

                const total = checked.reduce((sum, i) => {
                    const rawPrice = i.rawPrice || (parseInt(String(i.price).replace(/[^0-9]/g, ''), 10) || 0);
                    return sum + (rawPrice * i.qty);
                }, 0);

                const totalPcs = checked.reduce((s, i) => s + (i.qty || 1), 0);
                if (modalSummaryItems) modalSummaryItems.textContent = `${checked.length} varian (${totalPcs} pcs)`;
                if (modalSummaryTotal) modalSummaryTotal.textContent = formatRupiah(total);

                checkoutModal.showModal();
            });
        }

        if (closeCheckoutModal && checkoutModal) {
            closeCheckoutModal.addEventListener('click', function () {
                checkoutModal.close();
            });

            checkoutModal.addEventListener('click', function (e) {
                if (e.target === checkoutModal) {
                    checkoutModal.close();
                }
            });
        }

        // Toggle Delivery vs Pickup
        const deliveryRadios = document.querySelectorAll('input[name="deliveryMethod"]');
        deliveryRadios.forEach(radio => {
            radio.addEventListener('change', function () {
                if (radio.value === 'pickup') {
                    if (addressFieldGroup) addressFieldGroup.style.display = 'none';
                    if (customerAddressInput) customerAddressInput.removeAttribute('required');
                } else {
                    if (addressFieldGroup) addressFieldGroup.style.display = 'block';
                    if (customerAddressInput) customerAddressInput.setAttribute('required', 'required');
                }
            });
        });

        // Submit Form to WhatsApp (+62 822-2970-9664)
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', function (e) {
                e.preventDefault();

                const checked = orderItems.filter(i => i.checked);
                if (checked.length === 0) {
                    alert('Keranjang tidak memiliki produk yang dipilih.');
                    if (checkoutModal) checkoutModal.close();
                    return;
                }

                const nameInput = document.getElementById('orderCustomerName');
                const phoneInput = document.getElementById('orderCustomerPhone');
                const name = nameInput ? nameInput.value.trim() : '';
                const phone = phoneInput ? phoneInput.value.trim() : '';
                const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked')?.value || 'delivery';
                const address = customerAddressInput ? customerAddressInput.value.trim() : '';
                const paymentMethod = document.getElementById('orderPaymentMethod')?.value || 'Transfer Bank';
                const notesInput = document.getElementById('orderNotes');
                const notes = notesInput ? notesInput.value.trim() : '';

                if (!name) {
                    alert('Mohon isi nama lengkap Anda.');
                    if (nameInput) nameInput.focus();
                    return;
                }

                if (!phone) {
                    alert('Mohon isi nomor WhatsApp Anda.');
                    if (phoneInput) phoneInput.focus();
                    return;
                }

                if (deliveryMethod === 'delivery' && !address) {
                    alert('Mohon isi alamat pengiriman lengkap Anda.');
                    if (customerAddressInput) customerAddressInput.focus();
                    return;
                }

                const total = checked.reduce((sum, i) => {
                    const rawPrice = i.rawPrice || (parseInt(String(i.price).replace(/[^0-9]/g, ''), 10) || 0);
                    return sum + (rawPrice * i.qty);
                }, 0);

                const itemsListText = checked.map(item => {
                    const rawPrice = item.rawPrice || (parseInt(String(item.price).replace(/[^0-9]/g, ''), 10) || 0);
                    return `• ${item.qty}x ${item.name} (${formatRupiah(rawPrice * item.qty)})`;
                }).join('\n');

                const deliveryText = deliveryMethod === 'pickup'
                    ? '• Pengiriman: Ambil di Toko (Pickup)'
                    : `• Pengiriman: Antar ke Alamat (Delivery)\n• Alamat: ${address}`;

                const notesSection = notes ? `\n• Catatan: ${notes}` : '';

                const waMessage = 
`Halo Admin TEFA Bakery, saya ingin memesan:

📋 *Detail Pesanan:*
${itemsListText}
----------------------------------
*Total: ${formatRupiah(total)}*

👤 *Data Pemesan:*
• Nama: ${name}
• No. WhatsApp: ${phone}
${deliveryText}
• Pembayaran: ${paymentMethod}${notesSection}

Mohon konfirmasi ketersediaan dan proses pesanan saya ya, terima kasih!`;

                const waPhone = '6282229709664';
                const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;

                // Simpan ke riwayat pesanan (bakery_orders)
                const now = new Date();
                const dateFormatted = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                const deliveryDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

                let existingOrders = [];
                try {
                    existingOrders = JSON.parse(localStorage.getItem('bakery_orders') || '[]');
                } catch (err) {
                    existingOrders = [];
                }

                const orderNum = existingOrders.length + 1;
                const firstItem = checked[0];
                const otherCount = checked.length - 1;
                const productName = firstItem.name + (otherCount > 0 ? ` (+${otherCount} produk lainnya)` : '');
                const totalQty = checked.reduce((sum, item) => sum + (parseInt(item.qty, 10) || 1), 0);

                const newOrder = {
                    id: orderNum,
                    orderNumber: orderNum,
                    status: 'active',
                    statusText: 'In progress',
                    date: dateFormatted,
                    delivery: deliveryDate,
                    payment: paymentMethod,
                    recipient: name,
                    phone: phone,
                    deliveryMethod: deliveryMethod,
                    address: deliveryMethod === 'pickup' ? 'Ambil di Toko (Pickup)' : address,
                    notes: notes,
                    product: productName,
                    productImage: firstItem.image || 'assets/image/card_image/roti_pizza.png',
                    emoji: '🥖',
                    qty: totalQty,
                    total: formatRupiah(total),
                    rawTotal: total,
                    items: checked.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        rawPrice: item.rawPrice || (parseInt(String(item.price).replace(/[^0-9]/g, ''), 10) || 0),
                        qty: parseInt(item.qty, 10) || 1,
                        image: item.image || ''
                    }))
                };

                existingOrders.unshift(newOrder);
                localStorage.setItem('bakery_orders', JSON.stringify(existingOrders));

                // Buka WhatsApp di tab baru
                window.open(waUrl, '_blank');

                // Bersihkan item yang sudah dipesan dari keranjang
                orderItems = orderItems.filter(i => !i.checked);
                persistCart();
                render();

                if (checkoutModal) checkoutModal.close();
                checkoutForm.reset();

                if (typeof showToast === 'function') {
                    showToast('Pesanan berhasil dibuat! Mengalihkan ke Pesanan Saya...');
                }

                setTimeout(() => {
                    window.location.href = 'my_order.html';
                }, 800);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
