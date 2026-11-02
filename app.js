// URLs con artículos de casa y decoración colocados de PRIMEROS en el arreglo
const CATEGORY_URLS = [
    'https://dummyjson.com/products/category/home-decoration', // 1. Artículos de casa (Lámparas, relojes de pared, etc.)
    'https://dummyjson.com/products/category/laptops',         // 2. Tecnología (Laptops)
    'https://dummyjson.com/products/category/smartphones',     // 3. Tecnología (Smartphones)
    'https://dummyjson.com/products/category/fragrances',      // 4. Perfumes
    'https://dummyjson.com/products/category/mens-shirts',     // 5. Ropa
    'https://dummyjson.com/products/category/vehicle'          // 6. Bicicletas / Vehículos
];

let products = [];
let cart = JSON.parse(localStorage.getItem('multiitems_cart')) || [];
let activeProductModal = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartUI();

    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
});

// 1. Consumir APIs en el orden exacto establecido
async function fetchProducts() {
    const loader = document.getElementById('loader');

    try {
        const promises = CATEGORY_URLS.map(url => fetch(url).then(res => res.json()));
        const results = await Promise.all(promises);
        
        products = [];
        results.forEach(data => {
            if (data.products) {
                products = products.concat(data.products);
            }
        });

        loader.style.display = 'none';
        renderProducts(products);
    } catch (error) {
        loader.innerHTML = '<p class="text-danger">Error al cargar los productos. Asegúrate de abrirlo con Live Server.</p>';
        console.error('Error fetching API:', error);
    }
}

function renderProducts(items) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';

    items.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col-sm-6 col-md-4 col-lg-3';
        col.innerHTML = `
            <div class="product-card h-100 d-flex flex-column">
                <div class="product-img-box">
                    <img src="${product.thumbnail}" alt="${product.title}">
                </div>
                <div class="card-body p-3 d-flex flex-column flex-grow-1">
                    <span class="badge bg-light text-dark border mb-1 align-self-start text-uppercase" style="font-size: 0.65rem;">${product.category}</span>
                    <h6 class="card-title text-truncate fw-semibold mb-2 text-dark" title="${product.title}">${product.title}</h6>
                    
                    <div class="d-flex justify-content-between align-items-center mt-auto pt-2">
                        <span class="fw-bold fs-5 text-primary">$${product.price.toFixed(2)}</span>
                        <button class="btn btn-primary btn-sm rounded-circle d-flex align-items-center justify-content-center shadow-sm" style="width: 36px; height: 36px;" onclick="addToCart(products.find(p => p.id === ${product.id}), 1)" title="Agregar al carrito">
                            <i class="fa-solid fa-cart-shopping fs-6"></i>
                        </button>
                    </div>

                    <!-- Línea divisoria elegante antes de las valoraciones -->
                    <div class="d-flex align-items-center mt-3 pt-2 border-top" style="border-color: #f1f5f9 !important;">
                        <span class="text-warning small me-1"><i class="fa-solid fa-star"></i></span>
                        <span class="small text-muted fw-semibold">${product.rating || '4.7'}</span>
                        <button class="btn btn-link btn-sm text-decoration-none ms-auto p-0 small text-muted" onclick="openProductModal(${product.id})">Ver más</button>
                    </div>
                </div>
            </div>
        `;
        productList.appendChild(col);
    });
}

// 2. Modal de Detalles
function openProductModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    activeProductModal = product;
    document.getElementById('modal-product-title').innerText = product.title;
    document.getElementById('modal-product-img').src = product.thumbnail;
    document.getElementById('modal-product-category').innerText = product.category;
    document.getElementById('modal-product-desc').innerText = product.description;
    document.getElementById('modal-product-price').innerText = `$${product.price.toFixed(2)}`;
    document.getElementById('modal-quantity').value = 1;

    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

document.getElementById('modal-btn-add').addEventListener('click', () => {
    if (!activeProductModal) return;
    const qty = parseInt(document.getElementById('modal-quantity').value) || 1;
    const cartProduct = {
        id: activeProductModal.id,
        title: activeProductModal.title,
        price: activeProductModal.price,
        image: activeProductModal.thumbnail
    };
    addToCart(cartProduct, qty);

    const modalEl = document.getElementById('productModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
});

// 3. Carrito de Compras y LocalStorage
function addToCart(product, quantity) {
    const prodObj = {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.thumbnail || product.image
    };

    const existingIndex = cart.findIndex(item => item.id === prodObj.id);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({ ...prodObj, quantity });
    }
    saveCart();
    updateCartUI();
}

function updateCartItemQuantity(id, newQty) {
    const qty = parseInt(newQty);
    if (qty <= 0) {
        removeFromCart(id);
        return;
    }
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity = qty;
        saveCart();
        updateCartUI();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('multiitems_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const counter = document.getElementById('cart-counter');
    const totalEl = document.getElementById('cart-total');
    const btnCheckout = document.getElementById('btn-checkout');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    counter.innerText = totalItems;

    if (cart.length === 0) {
        container.innerHTML = '<p class="text-muted text-center my-4">Tu carrito está vacío 🛍️</p>';
        totalEl.innerText = '$0.00';
        btnCheckout.disabled = true;
        return;
    }

    btnCheckout.disabled = false;
    container.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const div = document.createElement('div');
        div.className = 'd-flex align-items-center justify-content-between mb-3 border-bottom pb-2';
        div.innerHTML = `
            <img src="${item.image}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: contain;" class="me-2">
            <div class="flex-grow-1 px-2">
                <h6 class="mb-0 fs-6 text-truncate" style="max-width: 140px;">${item.title}</h6>
                <small class="text-muted">$${item.price.toFixed(2)} x 
                    <input type="number" value="${item.quantity}" min="1" style="width: 45px;" onchange="updateCartItemQuantity(${item.id}, this.value)">
                </small>
            </div>
            <div class="text-end">
                <span class="fw-bold fs-6 d-block">$${itemTotal.toFixed(2)}</span>
                <button class="btn btn-sm text-danger p-0" onclick="removeFromCart(${item.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        container.appendChild(div);
    });

    totalEl.innerText = `$${total.toFixed(2)}`;
}

// 4 & 5. Pasarela de Pago y Generación de Ticket Térmico en PDF con jsPDF
function handleCheckout(e) {
    e.preventDefault();
    const clientName = document.getElementById('client-name').value;
    
    // Generar PDF tipo recibo térmico
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 150] // Ancho de recibo térmico estándar (80mm)
    });

    doc.setFont('courier', 'normal');
    doc.setFontSize(10);

    let y = 10;
    doc.text('================================', 4, y);
    y += 5;
    doc.text('          MULTI-ITEMS           ', 4, y);
    y += 5;
    doc.text('    TIENDA VIRTUAL OFICIAL      ', 4, y);
    y += 5;
    doc.text('================================', 4, y);
    y += 6;

    const now = new Date();
    doc.text(`Fecha: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 4, y);
    y += 5;
    doc.text(`Cliente: ${clientName}`, 4, y);
    y += 5;
    doc.text('--------------------------------', 4, y);
    y += 5;

    let grandTotal = 0;
    cart.forEach(item => {
        const lineTotal = item.price * item.quantity;
        grandTotal += lineTotal;
        doc.text(`${item.quantity}x ${item.title.substring(0, 22)}`, 4, y);
        y += 5;
        doc.text(`   $${item.price.toFixed(2)} c/u = $${lineTotal.toFixed(2)}`, 4, y);
        y += 5;
    });

    doc.text('--------------------------------', 4, y);
    y += 5;
    doc.text(`TOTAL FINAL: $${grandTotal.toFixed(2)}`, 4, y);
    y += 6;
    doc.text('================================', 4, y);
    y += 5;
    doc.text('     ¡GRACIAS POR SU COMPRA!    ', 4, y);
    y += 5;
    doc.text('================================', 4, y);

    // Descargar PDF
    doc.save(`Ticket_${clientName.replace(/\s+/g, '_')}.pdf`);

    // Limpiar carrito y cerrar modales
    cart = [];
    saveCart();
    updateCartUI();

    const checkoutModalEl = document.getElementById('checkoutModal');
    const checkoutModal = bootstrap.Modal.getInstance(checkoutModalEl);
    checkoutModal.hide();

    const cartOffcanvasEl = document.getElementById('cartOffcanvas');
    const cartOffcanvas = bootstrap.Offcanvas.getInstance(cartOffcanvasEl);
    cartOffcanvas.hide();

    document.getElementById('checkout-form').reset();
    alert('✅ ¡Pago procesado con éxito y ticket descargado!');
}