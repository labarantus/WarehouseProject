// API URL base
const API_BASE_URL = '/api';

// Transaction types
const TRANSACTION_TYPES = {
    SALE: 1,
    PURCHASE: 2,
    WRITE_OFF: 3
};

// Current active tab
let activeTab = 'products';

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing app...');

    // Initialize navigation
    setupNavigation();

    // Initialize modals
    initializeModals();

    // Check authentication
    checkAuthentication();

    // Load initial data
    loadProductsData();

    // Setup buttons and form handlers
    setupButtons();
});

// Setup navigation
function setupNavigation() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.sidebar .nav-link');

    // Add click event to each link
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();

            // Get tab ID
            const tabId = this.getAttribute('data-tab');

            // Update active tab
            activeTab = tabId;

            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Hide all tabs
            document.querySelectorAll('.tab-pane').forEach(tab => {
                tab.classList.remove('active');
            });

            // Show selected tab
            const selectedTab = document.getElementById(tabId);
            if (selectedTab) {
                selectedTab.classList.add('active');

                // Load tab data
                loadTabData(tabId);
            }
        });
    });
}

// Initialize Bootstrap modals
function initializeModals() {
    window.productModal = new bootstrap.Modal(document.getElementById('addProductModal'));
    window.purchaseModal = new bootstrap.Modal(document.getElementById('addPurchaseModal'));
    window.saleModal = new bootstrap.Modal(document.getElementById('addSaleModal'));
    window.writeoffModal = new bootstrap.Modal(document.getElementById('addWriteoffModal'));
}

// Check if user is authenticated
function checkAuthentication() {
    const userLogin = sessionStorage.getItem('warehouseUserLogin') || localStorage.getItem('warehouseUserLogin');

    if (userLogin) {
        // Set username
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            usernameElement.textContent = userLogin;
        }
    } else {
        // Redirect to login
        window.location.href = '/login';
    }
}

// Load data for the active tab
function loadTabData(tabId) {
    console.log(`Loading data for tab: ${tabId}`);

    switch (tabId) {
        case 'products':
            loadProductsData();
            break;
        case 'purchases':
            loadPurchasesData();
            break;
        case 'sales':
            loadSalesData();
            break;
        case 'writeoffs':
            loadWriteoffsData();
            break;
    }
}

// Setup buttons and form handlers
// Setup buttons and form handlers
function setupButtons() {
    // Add product button in the Products tab header
    const addProductButton = document.getElementById('addProductButton');
    if (addProductButton) {
        addProductButton.addEventListener('click', function() {
            // Reset form
            const form = document.getElementById('addProductForm');
            if (form) form.reset();

            // Load categories
            loadCategories();

            // Show modal
            window.productModal.show();
        });
    }

    // Save product button
    const saveProductButton = document.getElementById('saveProductButton');
    if (saveProductButton) {
        saveProductButton.addEventListener('click', saveProduct);
    }

    // Add purchase button
    const addPurchaseButton = document.getElementById('addPurchaseButton');
    if (addPurchaseButton) {
        addPurchaseButton.addEventListener('click', function() {
            // Reset form
            const form = document.getElementById('addPurchaseForm');
            if (form) form.reset();

            // Load products and warehouses
            loadProductsForPurchase();
            loadWarehousesForPurchase();

            // Show modal
            window.purchaseModal.show();
        });
    }

    // Save purchase button
    const savePurchaseButton = document.getElementById('savePurchaseButton');
    if (savePurchaseButton) {
        savePurchaseButton.addEventListener('click', savePurchase);
    }

    // Add sale button
    const addSaleButton = document.getElementById('addSaleButton');
    if (addSaleButton) {
        addSaleButton.addEventListener('click', function() {
            // Reset form
            const form = document.getElementById('addSaleForm');
            if (form) form.reset();

            // Load products with stock
            loadProductsForSale();

            // Show modal
            window.saleModal.show();
        });
    }

    // Sale product selection change handler
    const saleProduct = document.getElementById('saleProduct');
    if (saleProduct) {
        saleProduct.addEventListener('change', updateSaleProductDetails);
    }

    // Sale quantity change handler
    const saleQuantity = document.getElementById('saleQuantity');
    if (saleQuantity) {
        saleQuantity.addEventListener('input', updateSaleTotal);
    }

    // Sale price change handler
    const salePrice = document.getElementById('salePrice');
    if (salePrice) {
        salePrice.addEventListener('input', updateSaleTotal);
    }

    // Save sale button
    const saveSaleButton = document.getElementById('saveSaleButton');
    if (saveSaleButton) {
        saveSaleButton.addEventListener('click', saveSale);
    }

    // Add writeoff button
    const addWriteoffButton = document.getElementById('addWriteoffButton');
    if (addWriteoffButton) {
        addWriteoffButton.addEventListener('click', function() {
            // Reset form
            const form = document.getElementById('addWriteoffForm');
            if (form) form.reset();

            // Load products with stock
            loadProductsForWriteoff();

            // Show modal
            window.writeoffModal.show();
        });
    }

    // Writeoff product selection change handler
    const writeoffProduct = document.getElementById('writeoffProduct');
    if (writeoffProduct) {
        writeoffProduct.addEventListener('change', updateWriteoffProductDetails);
    }

    // Writeoff quantity change handler
    const writeoffQuantity = document.getElementById('writeoffQuantity');
    if (writeoffQuantity) {
        writeoffQuantity.addEventListener('input', updateWriteoffTotal);
    }

    // Save writeoff button
    const saveWriteoffButton = document.getElementById('saveWriteoffButton');
    if (saveWriteoffButton) {
        saveWriteoffButton.addEventListener('click', saveWriteoff);
    }

    // Logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Clear session storage
            sessionStorage.removeItem('warehouseAuthToken');
            sessionStorage.removeItem('warehouseUserLogin');
            localStorage.removeItem('warehouseAuthToken');
            localStorage.removeItem('warehouseUserLogin');

            // Redirect to login
            window.location.href = '/login';
        });
    }

    // Search button
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                const searchTerm = searchInput.value.toLowerCase();
                filterTableBySearchTerm(searchTerm);
            }
        });
    }
}
// Load products data
async function loadProductsData() {
    const tableBody = document.getElementById('productsTableBody');
    if (!tableBody) return;

    // Show loading message
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Загрузка данных...</td></tr>';

    try {
        // Fetch products
        const response = await fetch(`${API_BASE_URL}/get_product_all`);
        if (!response.ok) throw new Error('Не удалось загрузить товары');

        const products = await response.json();

        if (!products || products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Нет товаров</td></tr>';
            return;
        }

        // Clear table
        tableBody.innerHTML = '';

        // Add each product to the table
        for (const product of products) {
            // Get category name
            let categoryName = 'Не указано';
            try {
                const categoryResponse = await fetch(`${API_BASE_URL}/get_category_by_id/${product.id_category}`);
                if (categoryResponse.ok) {
                    const category = await categoryResponse.json();
                    categoryName = category.name;
                }
            } catch (error) {
                console.error('Ошибка при загрузке категории:', error);
            }

            // Get total count
            let totalCount = product.total_count || 0;

            try {
                const purchasesResponse = await fetch(`${API_BASE_URL}/get_purchase_by_product/${product.id}`);
                if (purchasesResponse.ok) {
                    const purchases = await purchasesResponse.json();

                    if (purchases && purchases.length > 0) {
                        // Calculate total count
                        totalCount = purchases.reduce((sum, purchase) => sum + (purchase.current_count || 0), 0);
                    }
                }
            } catch (error) {
                console.error('Ошибка при загрузке закупок:', error);
            }

            // Create row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${categoryName}</td>
                <td>${totalCount}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-success me-1" onclick="showSaleModal(${product.id})">
                            <i class="bi bi-cash-coin"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="showWriteoffModal(${product.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Ошибка при загрузке товаров:', error);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Ошибка: ${error.message}</td></tr>`;
    }
}
/// Load purchases data
async function loadPurchasesData() {
    const tableBody = document.getElementById('purchasesTableBody');
    if (!tableBody) return;

    // Show loading message
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Загрузка данных закупок...</td></tr>';

    try {
        // Get all products
        const productsResponse = await fetch(`${API_BASE_URL}/get_product_all`);
        if (!productsResponse.ok) throw new Error('Не удалось загрузить товары');

        const products = await productsResponse.json();
        const productsMap = {};
        products.forEach(product => {
            productsMap[product.id] = product;
        });

        // Get warehouses
        const warehousesMap = {};
        try {
            const warehousesResponse = await fetch(`${API_BASE_URL}/get_warehouses`);
            if (warehousesResponse.ok) {
                const warehouses = await warehousesResponse.json();
                warehouses.forEach(warehouse => {
                    warehousesMap[warehouse.id] = warehouse;
                });
            }
        } catch (error) {
            console.warn('Не удалось загрузить данные о складах:', error);
        }

        // Get all purchases for all products
        const allPurchases = [];

        for (const product of products) {
            try {
                const purchasesResponse = await fetch(`${API_BASE_URL}/get_purchase_by_product/${product.id}`);
                if (purchasesResponse.ok) {
                    const purchases = await purchasesResponse.json();
                    if (purchases && purchases.length > 0) {
                        // Add product info to each purchase
                        const enhancedPurchases = purchases.map(purchase => ({
                            ...purchase,
                            product_name: product.name,
                            product_id: product.id
                        }));
                        allPurchases.push(...enhancedPurchases);
                    }
                }
            } catch (error) {
                console.error(`Ошибка при загрузке закупок для товара ${product.id}:`, error);
            }
        }

        if (allPurchases.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Нет закупок</td></tr>';
            return;
        }

        // Sort purchases by date (newest first)
        allPurchases.sort((a, b) => new Date(b.created_on) - new Date(a.created_on));

        // Clear table
        tableBody.innerHTML = '';

        // Add each purchase to the table
        for (const purchase of allPurchases) {
            const product = productsMap[purchase.id_product] || { name: purchase.product_name || 'Неизвестный товар' };
            const warehouse = warehousesMap[purchase.id_warehouse] || { name: 'Склад ' + (purchase.id_warehouse || 'Неизвестный') };

            // Format date
            const purchaseDate = new Date(purchase.created_on).toLocaleDateString('ru-RU');

            // Format prices
            const purchasePrice = parseFloat(purchase.purchase_price).toFixed(2);
            const sellingPrice = parseFloat(purchase.selling_price).toFixed(2);

            // Create row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${purchase.id}</td>
                <td>${product.name}</td>
                <td>${purchaseDate}</td>
                <td>${purchasePrice} ₽</td>
                <td>${sellingPrice} ₽</td>
                <td>${warehouse.name}</td>
                <td>${purchase.count || 0}</td>
                <td>${purchase.current_count || 0}</td>
            `;

            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Ошибка при загрузке закупок:', error);
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Ошибка: ${error.message}</td></tr>`;
    }
}

// Load sales data
async function loadSalesData() {
    const tableBody = document.getElementById('salesTableBody');
    if (!tableBody) return;

    // Show loading message
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Загрузка данных реализаций...</td></tr>';

    try {
        // Get all transactions of type SALE
        const response = await fetch(`${API_BASE_URL}/get_transactions_by_type/${TRANSACTION_TYPES.SALE}`);
        if (!response.ok) throw new Error('Не удалось загрузить данные о реализациях');

        const transactions = await response.json();

        if (!transactions || transactions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Нет реализаций</td></tr>';
            return;
        }

        // Get products and purchases info
        const productsMap = {};
        const purchasesMap = {};

        // Get all products
        const productsResponse = await fetch(`${API_BASE_URL}/get_product_all`);
        if (productsResponse.ok) {
            const products = await productsResponse.json();

            for (const product of products) {
                productsMap[product.id] = product;

                // Get purchases for this product
                try {
                    const purchasesResponse = await fetch(`${API_BASE_URL}/get_purchase_by_product/${product.id}`);
                    if (purchasesResponse.ok) {
                        const purchases = await purchasesResponse.json();
                        purchases.forEach(purchase => {
                            purchasesMap[purchase.id] = {
                                ...purchase,
                                product_name: product.name,
                                product_id: product.id
                            };
                        });
                    }
                } catch (error) {
                    console.error(`Ошибка при загрузке закупок для товара ${product.id}:`, error);
                }
            }
        }

        // Clear table
        tableBody.innerHTML = '';

        // Sort transactions by date (newest first)
        transactions.sort((a, b) => new Date(b.created_on) - new Date(a.created_on));

        // Add each transaction to the table
        for (const transaction of transactions) {
            // Get purchase and product info
            const purchase = purchasesMap[transaction.id_purchase] || {};
            const productName = purchase.product_name || 'Неизвестный товар';

            // Calculate amount
            const amount = (purchase.selling_price || 0) * transaction.amount;

            // Format date
            const date = new Date(transaction.created_on).toLocaleString('ru-RU');

            // Create row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.id}</td>
                <td>${date}</td>
                <td>${productName}</td>
                <td>${transaction.amount}</td>
                <td>${parseFloat(purchase.selling_price || 0).toFixed(2)} ₽</td>
                <td>${amount.toFixed(2)} ₽</td>
                <td>Пользователь ${transaction.id_user}</td>
            `;

            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Ошибка при загрузке реализаций:', error);
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Ошибка: ${error.message}</td></tr>`;
    }
}

// Load writeoffs data
async function loadWriteoffsData() {
    const tableBody = document.getElementById('writeoffsTableBody');
    if (!tableBody) return;

    // Show loading message
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Загрузка данных списаний...</td></tr>';

    try {
        // Get all transactions of type WRITE_OFF
        const response = await fetch(`${API_BASE_URL}/get_transactions_by_type/${TRANSACTION_TYPES.WRITE_OFF}`);
        if (!response.ok) throw new Error('Не удалось загрузить данные о списаниях');

        const transactions = await response.json();

        if (!transactions || transactions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Нет списаний</td></tr>';
            return;
        }

        // Get products and purchases info
        const productsMap = {};
        const purchasesMap = {};

        // Get all products
        const productsResponse = await fetch(`${API_BASE_URL}/get_product_all`);
        if (productsResponse.ok) {
            const products = await productsResponse.json();

            for (const product of products) {
                productsMap[product.id] = product;

                // Get purchases for this product
                try {
                    const purchasesResponse = await fetch(`${API_BASE_URL}/get_purchase_by_product/${product.id}`);
                    if (purchasesResponse.ok) {
                        const purchases = await purchasesResponse.json();
                        purchases.forEach(purchase => {
                            purchasesMap[purchase.id] = {
                                ...purchase,
                                product_name: product.name,
                                product_id: product.id
                            };
                        });
                    }
                } catch (error) {
                    console.error(`Ошибка при загрузке закупок для товара ${product.id}:`, error);
                }
            }
        }

        // Clear table
        tableBody.innerHTML = '';

        // Sort transactions by date (newest first)
        transactions.sort((a, b) => new Date(b.created_on) - new Date(a.created_on));

        // Add each transaction to the table
        for (const transaction of transactions) {
            // Get purchase and product info
            const purchase = purchasesMap[transaction.id_purchase] || {};
            const productName = purchase.product_name || 'Неизвестный товар';

            // Calculate loss amount
            const lossAmount = (purchase.purchase_price || 0) * transaction.amount;

            // Format date
            const date = new Date(transaction.created_on).toLocaleString('ru-RU');

            // Create row (now without reason column)
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.id}</td>
                <td>${date}</td>
                <td>${productName}</td>
                <td>${transaction.amount}</td>
                <td>${lossAmount.toFixed(2)} ₽</td>
                <td>Пользователь ${transaction.id_user}</td>
            `;

            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Ошибка при загрузке списаний:', error);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Ошибка: ${error.message}</td></tr>`;
    }
}
// Load categories for product form
async function loadCategories() {
    try {
        const categorySelect = document.getElementById('productCategory');
        if (!categorySelect) return;

        // Clear existing options except the first one
        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }

        // Fetch categories
        const response = await fetch(`${API_BASE_URL}/get_categories`);

        if (!response.ok) {
            throw new Error('Не удалось загрузить категории');
        }

        const categories = await response.json();

        // Add categories to select
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });

        // Select first category by default
        if (categorySelect.options.length > 1) {
            categorySelect.selectedIndex = 1;
        }
    } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
        // Add default category in case of error
        const categorySelect = document.getElementById('productCategory');
        if (categorySelect) {
            const option = document.createElement('option');
            option.value = "1";
            option.textContent = "Концтовары";
            categorySelect.appendChild(option);
        }
    }
}

// Save new product
async function saveProduct() {
    const productNameInput = document.getElementById('productName');
    const categorySelect = document.getElementById('productCategory');

    if (!productNameInput || !categorySelect) return;

    const productName = productNameInput.value.trim();
    const categoryId = parseInt(categorySelect.value);

    if (!productName) {
        alert('Введите наименование товара');
        return;
    }

    if (isNaN(categoryId)) {
        alert('Выберите категорию');
        return;
    }

    // Disable save button and show spinner
    const saveButton = document.getElementById('saveProductButton');
    if (!saveButton) return;

    const originalText = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Сохранение...';

    try {
        // Create product data
        const productData = {
            name: productName,
            id_category: categoryId
        };

        // Send request
        const response = await fetch(`${API_BASE_URL}/create_product`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) throw new Error('Не удалось создать товар');

        // Success
        alert('Товар успешно добавлен');

        // Reset form and close modal
        const form = document.getElementById('addProductForm');
        if (form) form.reset();

        window.productModal.hide();

        // Reload products
        if (activeTab === 'products') {
            loadProductsData();
        }
    } catch (error) {
        console.error('Ошибка при сохранении товара:', error);
        alert(`Ошибка: ${error.message}`);
    } finally {
        // Re-enable save button
        saveButton.disabled = false;
        saveButton.innerHTML = originalText;
    }
}

// Load products for purchase
async function loadProductsForPurchase() {
    const productSelect = document.getElementById('purchaseProduct');
    if (!productSelect) return;

    // Clear options
    while (productSelect.options.length > 1) {
        productSelect.remove(1);
    }

    try {
        // Fetch products
        const response = await fetch(`${API_BASE_URL}/get_product_all`);
        if (!response.ok) throw new Error('Не удалось загрузить товары');

        const products = await response.json();

        if (!products || products.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'Нет доступных товаров';
            option.disabled = true;
            productSelect.appendChild(option);
            return;
        }

        // Add products to dropdown
        for (const product of products) {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            productSelect.appendChild(option);
        }

        // Select first product
        if (productSelect.options.length > 1) {
            productSelect.selectedIndex = 1;
        }
    } catch (error) {
        console.error('Ошибка при загрузке товаров для закупки:', error);
        const option = document.createElement('option');
        option.textContent = 'Ошибка загрузки товаров';
        option.disabled = true;
        productSelect.appendChild(option);
    }
}

// Load warehouses for purchase
async function loadWarehousesForPurchase() {
    const warehouseSelect = document.getElementById('purchaseWarehouse');
    if (!warehouseSelect) return;

    // Clear options
    while (warehouseSelect.options.length > 1) {
        warehouseSelect.remove(1);
    }

    try {
        // Try to load warehouses from API
        let warehouses = [];
        try {
            const response = await fetch(`${API_BASE_URL}/get_warehouses`);
            if (response.ok) {
                warehouses = await response.json();
            }
        } catch (error) {
            console.warn('Не удалось загрузить список складов через API:', error);
            // If API unavailable, add default warehouses
            warehouses = [
                { id: 1, name: 'Склад 1', address: 'Карла Маркса, 16' },
                { id: 2, name: 'Склад 2', address: 'Заки Валиди, 32' }
            ];
        }

        if (!warehouses || warehouses.length === 0) {
            const option = document.createElement('option');
            option.value = "1";
            option.textContent = 'Склад 1';
            warehouseSelect.appendChild(option);
            return;
        }

        // Add warehouses to dropdown
        warehouses.forEach(warehouse => {
            const option = document.createElement('option');
            option.value = warehouse.id;
            option.textContent = warehouse.name;
            warehouseSelect.appendChild(option);
        });

        // Select first warehouse
        if (warehouseSelect.options.length > 1) {
            warehouseSelect.selectedIndex = 1;
        }
    } catch (error) {
        console.error('Ошибка при загрузке складов:', error);
        // Add default warehouse in case of error
        const option = document.createElement('option');
        option.value = "1";
        option.textContent = 'Склад 1';
        warehouseSelect.appendChild(option);
    }
}

// Save purchase
async function savePurchase() {
    // Get form values
    const productId = parseInt(document.getElementById('purchaseProduct').value);
    const purchasePrice = parseFloat(document.getElementById('purchasePrice').value);
    const quantity = parseInt(document.getElementById('purchaseQuantity').value);
    const warehouseId = parseInt(document.getElementById('purchaseWarehouse').value);

    // Validate form
    if (isNaN(productId)) {
        alert('Выберите товар');
        return;
    }

    if (isNaN(purchasePrice) || purchasePrice <= 0) {
        alert('Укажите корректную закупочную цену');
        return;
    }

    if (isNaN(quantity) || quantity <= 0) {
        alert('Укажите корректное количество товара');
        return;
    }

    if (isNaN(warehouseId)) {
        alert('Выберите склад');
        return;
    }

    // Get user ID
    const userId = parseInt(sessionStorage.getItem('warehouseUserId')) || 1;

    // Disable save button and show spinner
    const saveButton = document.getElementById('savePurchaseButton');
    const originalText = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Сохранение...';

    try {
        // Create purchase data
        const purchaseData = {
            id_product: productId,
            purchase_price: purchasePrice,
            id_warehouse: warehouseId,
            count: quantity,
            id_user: userId
        };

        // Send request
        const response = await fetch(`${API_BASE_URL}/add_purchase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(purchaseData)
        });

        if (!response.ok) throw new Error('Не удалось создать закупку');

        // Success
        alert('Закупка успешно добавлена');

        // Reset form and close modal
        const form = document.getElementById('addPurchaseForm');
        if (form) form.reset();

        window.purchaseModal.hide();

        // Reload data based on active tab
        loadTabData(activeTab);
    } catch (error) {
        console.error('Ошибка при сохранении закупки:', error);
        alert(`Ошибка: ${error.message}`);
    } finally {
        // Re-enable save button
        saveButton.disabled = false;
        saveButton.innerHTML = originalText;
    }
}

// Load products for sale
async function loadProductsForSale() {
    const productSelect = document.getElementById('saleProduct');
    if (!productSelect) return;

    // Clear options
    while (productSelect.options.length > 1) {
        productSelect.remove(1);
    }

    try {
        // Fetch products
        const response = await fetch(`${API_BASE_URL}/get_product_all`);
        if (!response.ok) throw new Error('Не удалось загрузить товары');

        const products = await response.json();

        if (!products || products.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'Нет доступных товаров';
            option.disabled = true;
            productSelect.appendChild(option);
            return;
        }

        // Filter products with stock and add to dropdown
        let hasProductsWithStock = false;

        for (const product of products) {
            try {
                const purchasesResponse = await fetch(`${API_BASE_URL}/get_purchase_by_product/${product.id}`);
                if (purchasesResponse.ok) {
                    const purchases = await purchasesResponse.json();

                    // Calculate total available quantity
                    const totalAvailable = purchases.reduce((sum, purchase) => sum + (purchase.current_count || 0), 0);

                    // Only add products with available stock
                    if (totalAvailable > 0) {
                        hasProductsWithStock = true;

                        const option = document.createElement('option');
                        option.value = product.id;
                        option.textContent = product.name;
                        option.dataset.availableQuantity = totalAvailable;

                        // Store the latest purchase ID and price for this product
                        if (purchases.length > 0) {
                            const latestPurchase = purchases.reduce((latest, purchase) => {
                                return new Date(purchase.created_on) > new Date(latest.created_on) ? purchase : latest;
                            }, purchases[0]);

                            option.dataset.purchaseId = latestPurchase.id;
                            option.dataset.sellingPrice = latestPurchase.selling_price;
                        }

                        productSelect.appendChild(option);
                    }
                }
            } catch (error) {
                console.error(`Ошибка при загрузке закупок для товара ${product.id}:`, error);
            }
        }

        if (!hasProductsWithStock) {
            const option = document.createElement('option');
            option.textContent = 'Нет товаров с доступным количеством';
            option.disabled = true;
            productSelect.appendChild(option);
            return;
        }

        // Select first product and update details
        if (productSelect.options.length > 1) {
            productSelect.selectedIndex = 1;
            updateSaleProductDetails();
        }
    } catch (error) {
        console.error('Ошибка при загрузке товаров для реализации:', error);
        const option = document.createElement('option');
        option.textContent = 'Ошибка загрузки товаров';
        option.disabled = true;
        productSelect.appendChild(option);
    }
}

// Update sale product details
function updateSaleProductDetails() {
    const productSelect = document.getElementById('saleProduct');
    if (!productSelect || productSelect.selectedIndex <= 0) return;

    const selectedOption = productSelect.options[productSelect.selectedIndex];

    // Update available quantity
    const availableQuantity = parseInt(selectedOption.dataset.availableQuantity) || 0;
    const availableQuantityElement = document.getElementById('saleAvailableQuantity');
    if (availableQuantityElement) {
        availableQuantityElement.textContent = availableQuantity;
    }

    // Update price
    const sellingPrice = parseFloat(selectedOption.dataset.sellingPrice) || 0;
    const salePriceInput = document.getElementById('salePrice');
    if (salePriceInput) {
        salePriceInput.value = sellingPrice.toFixed(2);
    }

    // Update quantity max value
    const saleQuantityInput = document.getElementById('saleQuantity');
    if (saleQuantityInput) {
        saleQuantityInput.max = availableQuantity;

        // Ensure quantity is not greater than available
        if (parseInt(saleQuantityInput.value) > availableQuantity) {
            saleQuantityInput.value = availableQuantity;
        }
    }

    // Update total
    updateSaleTotal();
}

// Update sale total
function updateSaleTotal() {
    const productSelect = document.getElementById('saleProduct');
    if (!productSelect || productSelect.selectedIndex <= 0) return;

    const quantityInput = document.getElementById('saleQuantity');
    const priceInput = document.getElementById('salePrice');
    const totalElement = document.getElementById('saleTotal');

    if (!quantityInput || !priceInput || !totalElement) return;

    const quantity = parseInt(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;

    const total = quantity * price;
    totalElement.textContent = `${total.toFixed(2)} ₽`;
}

// Save sale
async function saveSale() {
    // Get form values
    const productSelect = document.getElementById('saleProduct');
    if (!productSelect || productSelect.selectedIndex <= 0) {
        alert('Выберите товар');
        return;
    }

    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const purchaseId = parseInt(selectedOption.dataset.purchaseId);

    if (isNaN(purchaseId)) {
        alert('Не удалось определить закупку для данного товара');
        return;
    }

    const quantityInput = document.getElementById('saleQuantity');
    const quantity = parseInt(quantityInput?.value) || 0;
    const availableQuantity = parseInt(selectedOption.dataset.availableQuantity) || 0;

    if (quantity <= 0) {
        alert('Укажите количество больше нуля');
        return;
    }

    if (quantity > availableQuantity) {
        alert(`Доступно только ${availableQuantity} единиц товара`);
        return;
    }

    // Get user ID
    const userId = parseInt(sessionStorage.getItem('warehouseUserId')) || 1;

    // Disable save button and show spinner
    const saveButton = document.getElementById('saveSaleButton');
    const originalText = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Оформление...';

    try {
        // Create transaction data
        const transactionData = {
            id_type: TRANSACTION_TYPES.SALE,
            id_purchase: purchaseId,
            amount: quantity,
            id_user: userId
        };

        // Send request
        const response = await fetch(`${API_BASE_URL}/add_transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });

        if (!response.ok) throw new Error('Не удалось создать реализацию');

        // Success
        alert('Реализация успешно оформлена');

        // Reset form and close modal
        const form = document.getElementById('addSaleForm');
        if (form) form.reset();

        window.saleModal.hide();

        // Reload data based on active tab
        loadTabData(activeTab);
    } catch (error) {
        console.error('Ошибка при сохранении реализации:', error);
        alert(`Ошибка: ${error.message}`);
    } finally {
        // Re-enable save button
        saveButton.disabled = false;
        saveButton.innerHTML = originalText;
    }
}

// Load products for writeoff
async function loadProductsForWriteoff() {
    const productSelect = document.getElementById('writeoffProduct');
    if (!productSelect) return;

    // Clear options
    while (productSelect.options.length > 1) {
        productSelect.remove(1);
    }

    try {
        // Fetch products
        const response = await fetch(`${API_BASE_URL}/get_product_all`);
        if (!response.ok) throw new Error('Не удалось загрузить товары');

        const products = await response.json();

        if (!products || products.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'Нет доступных товаров';
            option.disabled = true;
            productSelect.appendChild(option);
            return;
        }

        // Filter products with stock and add to dropdown
        let hasProductsWithStock = false;

        for (const product of products) {
            try {
                const purchasesResponse = await fetch(`${API_BASE_URL}/get_purchase_by_product/${product.id}`);
                if (purchasesResponse.ok) {
                    const purchases = await purchasesResponse.json();

                    // Calculate total available quantity
                    const totalAvailable = purchases.reduce((sum, purchase) => sum + (purchase.current_count || 0), 0);

                    // Only add products with available stock
                    if (totalAvailable > 0) {
                        hasProductsWithStock = true;

                        const option = document.createElement('option');
                        option.value = product.id;
                        option.textContent = product.name;
                        option.dataset.availableQuantity = totalAvailable;

                        // Store the latest purchase ID and price for this product
                        if (purchases.length > 0) {
                            const latestPurchase = purchases.reduce((latest, purchase) => {
                                return new Date(purchase.created_on) > new Date(latest.created_on) ? purchase : latest;
                            }, purchases[0]);

                            option.dataset.purchaseId = latestPurchase.id;
                            option.dataset.purchasePrice = latestPurchase.purchase_price;
                        }

                        productSelect.appendChild(option);
                    }
                }
            } catch (error) {
                console.error(`Ошибка при загрузке закупок для товара ${product.id}:`, error);
            }
        }

        if (!hasProductsWithStock) {
            const option = document.createElement('option');
            option.textContent = 'Нет товаров с доступным количеством';
            option.disabled = true;
            productSelect.appendChild(option);
            return;
        }

        // Select first product and update details
        if (productSelect.options.length > 1) {
            productSelect.selectedIndex = 1;
            updateWriteoffProductDetails();
        }
    } catch (error) {
        console.error('Ошибка при загрузке товаров для списания:', error);
        const option = document.createElement('option');
        option.textContent = 'Ошибка загрузки товаров';
        option.disabled = true;
        productSelect.appendChild(option);
    }
}

// Update writeoff product details
function updateWriteoffProductDetails() {
    const productSelect = document.getElementById('writeoffProduct');
    if (!productSelect || productSelect.selectedIndex <= 0) return;

    const selectedOption = productSelect.options[productSelect.selectedIndex];

    // Update available quantity
    const availableQuantity = parseInt(selectedOption.dataset.availableQuantity) || 0;
    const availableQuantityElement = document.getElementById('writeoffAvailableQuantity');
    if (availableQuantityElement) {
        availableQuantityElement.textContent = availableQuantity;
    }

    // Update quantity max value
    const writeoffQuantityInput = document.getElementById('writeoffQuantity');
    if (writeoffQuantityInput) {
        writeoffQuantityInput.max = availableQuantity;

        // Ensure quantity is not greater than available
        if (parseInt(writeoffQuantityInput.value) > availableQuantity) {
            writeoffQuantityInput.value = availableQuantity;
        }
    }

    // Update total loss
    updateWriteoffTotal();
}

// Update writeoff total
function updateWriteoffTotal() {
    const productSelect = document.getElementById('writeoffProduct');
    if (!productSelect || productSelect.selectedIndex <= 0) return;

    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const quantityInput = document.getElementById('writeoffQuantity');
    const totalElement = document.getElementById('writeoffTotal');

    if (!quantityInput || !totalElement) return;

    const quantity = parseInt(quantityInput.value) || 0;
    const price = parseFloat(selectedOption.dataset.purchasePrice) || 0;

    const total = quantity * price;
    totalElement.textContent = `${total.toFixed(2)} ₽`;
}

// Save writeoff
async function saveWriteoff() {
    // Get form values
    const productSelect = document.getElementById('writeoffProduct');
    if (!productSelect || productSelect.selectedIndex <= 0) {
        alert('Выберите товар');
        return;
    }

    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const purchaseId = parseInt(selectedOption.dataset.purchaseId);

    if (isNaN(purchaseId)) {
        alert('Не удалось определить закупку для данного товара');
        return;
    }

    const quantityInput = document.getElementById('writeoffQuantity');
    const quantity = parseInt(quantityInput?.value) || 0;
    const availableQuantity = parseInt(selectedOption.dataset.availableQuantity) || 0;

    if (quantity <= 0) {
        alert('Укажите количество больше нуля');
        return;
    }

    if (quantity > availableQuantity) {
        alert(`Доступно только ${availableQuantity} единиц товара`);
        return;
    }

    // Get user ID
    const userId = parseInt(sessionStorage.getItem('warehouseUserId')) || 1;

    // Disable save button and show spinner
    const saveButton = document.getElementById('saveWriteoffButton');
    const originalText = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Оформление...';

    try {
        // Create transaction data
        const transactionData = {
            id_type: TRANSACTION_TYPES.WRITE_OFF,
            id_purchase: purchaseId,
            amount: quantity,
            id_user: userId
        };

        // Send request
        const response = await fetch(`${API_BASE_URL}/add_transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });

        if (!response.ok) throw new Error('Не удалось создать списание');

        // Success
        alert('Списание успешно оформлено');

        // Reset form and close modal
        const form = document.getElementById('addWriteoffForm');
        if (form) form.reset();

        window.writeoffModal.hide();

        // Reload data based on active tab
        loadTabData(activeTab);
    } catch (error) {
        console.error('Ошибка при сохранении списания:', error);
        alert(`Ошибка: ${error.message}`);
    } finally {
        // Re-enable save button
        saveButton.disabled = false;
        saveButton.innerHTML = originalText;
    }
}
// Helper function to filter table by search term
function filterTableBySearchTerm(searchTerm) {
    if (!searchTerm) return;

    let tableBody;
    let cellSelector;

    switch (activeTab) {
        case 'products':
            tableBody = document.getElementById('productsTableBody');
            cellSelector = 'td:nth-child(2)'; // Product name column
            break;
        case 'purchases':
            tableBody = document.getElementById('purchasesTableBody');
            cellSelector = 'td:nth-child(2)'; // Product name column
            break;
        case 'sales':
            tableBody = document.getElementById('salesTableBody');
            cellSelector = 'td:nth-child(3)'; // Product name column
            break;
        case 'writeoffs':
            tableBody = document.getElementById('writeoffsTableBody');
            cellSelector = 'td:nth-child(3)'; // Product name column
            break;
        default:
            return;
    }

    if (!tableBody) return;

    const rows = tableBody.querySelectorAll('tr');
    const lowerSearchTerm = searchTerm.toLowerCase().trim();

    rows.forEach(row => {
        const cell = row.querySelector(cellSelector);
        if (!cell) return;

        const text = cell.textContent.toLowerCase();
        if (text.includes(lowerSearchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Show sale modal for a specific product
function showSaleModal(productId) {
    // Reset form
    const form = document.getElementById('addSaleForm');
    if (form) form.reset();

    // Load products and set the specific product
    loadProductsForSale().then(() => {
        const productSelect = document.getElementById('saleProduct');
        if (productSelect) {
            // Find and select the option with the given product ID
            for (let i = 0; i < productSelect.options.length; i++) {
                if (parseInt(productSelect.options[i].value) === productId) {
                    productSelect.selectedIndex = i;
                    updateSaleProductDetails();
                    break;
                }
            }
        }

        // Show modal
        window.saleModal.show();
    });
}

// Show writeoff modal for a specific product
function showWriteoffModal(productId) {
    // Reset form
    const form = document.getElementById('addWriteoffForm');
    if (form) form.reset();

    // Load products and set the specific product
    loadProductsForWriteoff().then(() => {
        const productSelect = document.getElementById('writeoffProduct');
        if (productSelect) {
            // Find and select the option with the given product ID
            for (let i = 0; i < productSelect.options.length; i++) {
                if (parseInt(productSelect.options[i].value) === productId) {
                    productSelect.selectedIndex = i;
                    updateWriteoffProductDetails();
                    break;
                }
            }
        }

        // Show modal
        window.writeoffModal.show();
    });
}

// View details placeholders
function viewProductDetails(productId) {
    alert(`Просмотр деталей товара с ID ${productId} - функция в разработке`);
}

function viewPurchaseDetails(purchaseId) {
    alert(`Просмотр деталей закупки с ID ${purchaseId} - функция в разработке`);
}

function viewSaleDetails(saleId) {
    alert(`Просмотр деталей реализации с ID ${saleId} - функция в разработке`);
}

function viewWriteoffDetails(writeoffId) {
    alert(`Просмотр деталей списания с ID ${writeoffId} - функция в разработке`);
}