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

    if (!window.Chart) {
        // Если Chart.js не загружен, добавляем его динамически
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = function () {
            console.log('Chart.js загружен успешно');
        };
        document.head.appendChild(script);
    }

    // Initialize navigation
    setupNavigation();

    // Initialize modals
    initializeModals();

    // Check authentication
    checkAuthentication();

    setupWriteoffEventHandlers();

    // Load initial data
    loadProductsData();

    // Setup buttons and form handlers
    setupButtons();


});

// Setup navigation
function setupNavigation() {
    // Получаем все навигационные ссылки
    const navLinks = document.querySelectorAll('.sidebar .nav-link');

    // Добавляем обработчик события для каждой ссылки
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();

            // Получаем идентификатор вкладки
            const tabId = this.getAttribute('data-tab');

            // Обновляем активную ссылку
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Скрываем все вкладки
            document.querySelectorAll('.tab-pane').forEach(tab => {
                tab.classList.remove('active');
            });

            // Показываем выбранную вкладку
            const selectedTab = document.getElementById(tabId);
            if (selectedTab) {
                selectedTab.classList.add('active');

                // Управляем видимостью поиска
                toggleSearchVisibility(tabId);

                // Загружаем данные вкладки
                loadTabData(tabId);
            }
        });
    });

    // Инициализация видимости поиска на основе активной вкладки при загрузке
    const activeTab = document.querySelector('.sidebar .nav-link.active');
    if (activeTab) {
        const tabId = activeTab.getAttribute('data-tab');
        toggleSearchVisibility(tabId);
    }
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
        addProductButton.addEventListener('click', function () {
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
        addPurchaseButton.addEventListener('click', function () {
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
        addSaleButton.addEventListener('click', function () {
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
        addWriteoffButton.addEventListener('click', function () {
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
        logoutButton.addEventListener('click', function () {
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
        searchButton.addEventListener('click', function () {
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
            const product = productsMap[purchase.id_product] || {name: purchase.product_name || 'Неизвестный товар'};
            const warehouse = warehousesMap[purchase.id_warehouse] || {name: 'Склад ' + (purchase.id_warehouse || 'Неизвестный')};

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
                {id: 1, name: 'Склад 1', address: 'Карла Маркса, 16'},
                {id: 2, name: 'Склад 2', address: 'Заки Валиди, 32'}
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
                            // Сортируем закупки от старых к новым
                            const sortedPurchases = purchases
                                .filter(purchase => purchase.current_count > 0)  // Только с ненулевым остатком
                                .sort((a, b) => new Date(a.created_on) - new Date(b.created_on));

                            if (sortedPurchases.length > 0) {
                                const oldestPurchase = sortedPurchases[0];  // Берем самую старую
                                option.dataset.purchaseId = oldestPurchase.id;
                                option.dataset.sellingPrice = oldestPurchase.selling_price;
                            }
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
async function updateSaleTotal() {
    const productSelect = document.getElementById('saleProduct');
    if (!productSelect || productSelect.selectedIndex <= 0) return;

    const productId = parseInt(productSelect.value);
    const quantityInput = document.getElementById('saleQuantity');
    const totalElement = document.getElementById('saleTotal');

    if (!quantityInput || !totalElement) return;

    let requestedQuantity = parseInt(quantityInput.value) || 0;
    if (requestedQuantity <= 0) {
        totalElement.textContent = "0.00 ₽";
        return;
    }

    try {
        // Получаем все доступные партии данного товара
        const purchasesResponse = await fetch(`${API_BASE_URL}/get_purchase_by_product/${productId}`);
        if (!purchasesResponse.ok) throw new Error('Не удалось загрузить партии товара');

        const purchases = await purchasesResponse.json();

        // Сортируем партии от старых к новым (FIFO)
        const sortedPurchases = purchases
            .filter(purchase => purchase.current_count > 0)
            .sort((a, b) => new Date(a.created_on) - new Date(b.created_on));

        let remainingQuantity = requestedQuantity;
        let totalPrice = 0;

        // Проходим по партиям, начиная с самой старой
        for (const purchase of sortedPurchases) {
            if (remainingQuantity <= 0) break;

            // Количество, которое возьмем из текущей партии
            const quantityFromPurchase = Math.min(purchase.current_count, remainingQuantity);

            // Добавляем стоимость товаров из этой партии
            totalPrice += quantityFromPurchase * purchase.selling_price;

            // Уменьшаем оставшееся количество
            remainingQuantity -= quantityFromPurchase;
        }

        // Если не смогли распределить всё количество по партиям
        if (remainingQuantity > 0) {
            totalElement.textContent = `Недостаточно товара (не хватает ${remainingQuantity})`;
            return;
        }

        totalElement.textContent = `${totalPrice.toFixed(2)} ₽`;

        // Сохраняем распределение по партиям в виде дополнительных данных
        // Это поможет при сохранении транзакции, но не изменит текущую логику создания транзакций
        const distributionData = sortedPurchases
            .filter(purchase => {
                const qFromPurchase = Math.min(purchase.current_count, requestedQuantity);
                requestedQuantity -= qFromPurchase;
                return qFromPurchase > 0;
            })
            .map(purchase => ({
                id: purchase.id,
                quantity: Math.min(purchase.current_count, requestedQuantity + Math.min(purchase.current_count, requestedQuantity)),
                price: purchase.selling_price
            }));

        // Можно сохранить эти данные для использования при отправке формы
        productSelect.dataset.purchaseDistribution = JSON.stringify(distributionData);
    } catch (error) {
        console.error('Ошибка при расчете стоимости:', error);
        totalElement.textContent = "Ошибка расчета";
    }
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

    // Очищаем список партий
    const purchaseSelect = document.getElementById('writeoffPurchase');
    if (purchaseSelect) {
        while (purchaseSelect.options.length > 1) {
            purchaseSelect.remove(1);
        }
        purchaseSelect.options[0].text = "Сначала выберите товар";
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

        // Фильтруем товары с ненулевым остатком
        let hasProductsWithStock = false;

        for (const product of products) {
            try {
                const purchasesResponse = await fetch(`${API_BASE_URL}/get_purchase_by_product/${product.id}`);
                if (purchasesResponse.ok) {
                    const purchases = await purchasesResponse.json();

                    // Проверяем, есть ли партии с ненулевым остатком
                    const purchasesWithStock = purchases.filter(purchase =>
                        purchase.current_count && purchase.current_count > 0);

                    // Только добавляем товар, если есть хотя бы одна партия с остатком
                    if (purchasesWithStock.length > 0) {
                        hasProductsWithStock = true;

                        const option = document.createElement('option');
                        option.value = product.id;
                        option.textContent = product.name;

                        // Сохраняем общее доступное количество
                        const totalAvailable = purchasesWithStock.reduce(
                            (sum, purchase) => sum + purchase.current_count, 0);
                        option.dataset.availableQuantity = totalAvailable;

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

        // Select first product and load its purchases
        if (productSelect.options.length > 1) {
            productSelect.selectedIndex = 1;
            loadPurchasesForWriteoff(productSelect.value);
        }
    } catch (error) {
        console.error('Ошибка при загрузке товаров для списания:', error);
        const option = document.createElement('option');
        option.textContent = 'Ошибка загрузки товаров';
        option.disabled = true;
        productSelect.appendChild(option);
    }
}

// Update writeoff details based on selected purchase
function updateWriteoffDetails() {
    const purchaseSelect = document.getElementById('writeoffPurchase');
    if (!purchaseSelect || purchaseSelect.selectedIndex <= 0) return;

    const selectedOption = purchaseSelect.options[purchaseSelect.selectedIndex];

    // Update available quantity from selected purchase
    const availableQuantity = parseInt(selectedOption.dataset.currentCount) || 0;
    const availableQuantityElement = document.getElementById('writeoffAvailableQuantity');
    if (availableQuantityElement) {
        availableQuantityElement.textContent = availableQuantity;
    }

    // Update quantity input max value
    const writeoffQuantityInput = document.getElementById('writeoffQuantity');
    if (writeoffQuantityInput) {
        writeoffQuantityInput.max = availableQuantity;

        // Если выбранное количество больше доступного, корректируем
        if (parseInt(writeoffQuantityInput.value) > availableQuantity) {
            writeoffQuantityInput.value = availableQuantity;
        }

        // Минимум 1
        if (parseInt(writeoffQuantityInput.value) < 1) {
            writeoffQuantityInput.value = 1;
        }
    }

    // Update total
    updateWriteoffTotal();
}


// Setup event handlers
function setupWriteoffEventHandlers() {
    // Product selection change handler
    const writeoffProduct = document.getElementById('writeoffProduct');
    if (writeoffProduct) {
        writeoffProduct.addEventListener('change', function () {
            loadPurchasesForWriteoff(this.value);
        });
    }

    // Purchase selection change handler
    const writeoffPurchase = document.getElementById('writeoffPurchase');
    if (writeoffPurchase) {
        writeoffPurchase.addEventListener('change', updateWriteoffDetails);
    }

    // Quantity change handler
    const writeoffQuantity = document.getElementById('writeoffQuantity');
    if (writeoffQuantity) {
        writeoffQuantity.addEventListener('input', updateWriteoffTotal);
    }
}


// Load purchases for selected product in writeoff form
async function loadPurchasesForWriteoff(productId) {
    const purchaseSelect = document.getElementById('writeoffPurchase');
    if (!purchaseSelect) return;

    // Clear options
    while (purchaseSelect.options.length > 1) {
        purchaseSelect.remove(1);
    }
    purchaseSelect.options[0].text = "Выберите партию";

    if (!productId) return;

    try {
        // Fetch purchases for this product
        const response = await fetch(`${API_BASE_URL}/get_purchase_by_product/${productId}`);
        if (!response.ok) throw new Error('Не удалось загрузить партии товара');

        const purchases = await response.json();

        // Фильтруем партии с ненулевым остатком
        const purchasesWithStock = purchases.filter(purchase =>
            purchase.current_count && purchase.current_count > 0);

        if (purchasesWithStock.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'Нет доступных партий';
            option.disabled = true;
            purchaseSelect.appendChild(option);
            return;
        }

        // Добавляем партии в выпадающий список, сортируя по дате (от новых к старым для удобства)
        purchasesWithStock
            .sort((a, b) => new Date(b.created_on) - new Date(a.created_on))
            .forEach(purchase => {
                const purchaseDate = new Date(purchase.created_on).toLocaleDateString();

                const option = document.createElement('option');
                option.value = purchase.id;
                option.textContent = `Партия от ${purchaseDate} (${purchase.current_count} шт)`;
                option.dataset.currentCount = purchase.current_count;
                option.dataset.purchasePrice = purchase.purchase_price;
                purchaseSelect.appendChild(option);
            });

        // Выбираем первую партию и обновляем данные
        if (purchaseSelect.options.length > 1) {
            purchaseSelect.selectedIndex = 1;
            updateWriteoffDetails();
        }
    } catch (error) {
        console.error('Ошибка при загрузке партий для списания:', error);
        const option = document.createElement('option');
        option.textContent = 'Ошибка загрузки партий';
        option.disabled = true;
        purchaseSelect.appendChild(option);
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

// Update writeoff total cost
function updateWriteoffTotal() {
    const purchaseSelect = document.getElementById('writeoffPurchase');
    if (!purchaseSelect || purchaseSelect.selectedIndex <= 0) return;

    const selectedOption = purchaseSelect.options[purchaseSelect.selectedIndex];
    const quantityInput = document.getElementById('writeoffQuantity');
    const totalElement = document.getElementById('writeoffTotal');

    if (!quantityInput || !totalElement) return;

    const quantity = parseInt(quantityInput.value) || 0;
    const price = parseFloat(selectedOption.dataset.purchasePrice) || 0;
    const availableQuantity = parseInt(selectedOption.dataset.currentCount) || 0;

    // Проверяем, не превышает ли количество доступное
    if (quantity > availableQuantity) {
        totalElement.textContent = `Превышено доступное количество. Максимум: ${availableQuantity} шт.`;
        return;
    }

    const total = quantity * price;
    totalElement.textContent = `${total.toFixed(2)} ₽`;
}

// Save writeoff
async function saveWriteoff() {
    // Get form values
    const purchaseSelect = document.getElementById('writeoffPurchase');
    if (!purchaseSelect || purchaseSelect.selectedIndex <= 0) {
        alert('Выберите партию товара');
        return;
    }

    const purchaseId = parseInt(purchaseSelect.value);
    if (isNaN(purchaseId)) {
        alert('Не удалось определить партию для списания');
        return;
    }

    const selectedOption = purchaseSelect.options[purchaseSelect.selectedIndex];
    const availableQuantity = parseInt(selectedOption.dataset.currentCount) || 0;

    const quantityInput = document.getElementById('writeoffQuantity');
    const quantity = parseInt(quantityInput?.value) || 0;

    if (quantity <= 0) {
        alert('Укажите количество больше нуля');
        return;
    }

    if (quantity > availableQuantity) {
        alert(`Доступно только ${availableQuantity} единиц товара в выбранной партии`);
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

    // Load products for writeoff
    loadProductsForWriteoff().then(() => {
        const productSelect = document.getElementById('writeoffProduct');
        if (productSelect) {
            // Find and select the option with the given product ID
            for (let i = 0; i < productSelect.options.length; i++) {
                if (parseInt(productSelect.options[i].value) === productId) {
                    productSelect.selectedIndex = i;

                    // Загружаем партии для выбранного товара
                    loadPurchasesForWriteoff(productId).then(() => {
                        // После загрузки партий обновляем детали списания
                        updateWriteoffDetails();

                        setupWriteoffEventHandlers();
                    });

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


// Глобальные переменные для графиков
let revenueChart = null;
let expensesChart = null;

// Загрузка данных доходов при выборе вкладки
function loadRevenueData() {
    // Установка дат по умолчанию, если они не были установлены
    if (!document.getElementById('revenueStartDate').value) {
        // Установка начальной даты (30 дней назад)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        document.getElementById('revenueStartDate').value = formatDate(startDate);
    }

    if (!document.getElementById('revenueEndDate').value) {
        // Установка конечной даты (сегодня)
        document.getElementById('revenueEndDate').value = formatDate(new Date());
    }

    // Получение выбранного периода дат
    const startDate = document.getElementById('revenueStartDate').value;
    const endDate = document.getElementById('revenueEndDate').value;

    // Проверяем, что контейнер для графика существует
    const chartContainer = document.querySelector('#revenue .card-body');
    if (!chartContainer) {
        console.error('Контейнер для графика не найден');
        return;
    }

    // Показываем спиннер загрузки
    chartContainer.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Загрузка...</span>
            </div>
            <p class="mt-2">Загрузка данных...</p>
        </div>
    `;

    // Асинхронная загрузка данных
    fetchRevenueData(startDate, endDate)
        .then(data => {
            // Создаем canvas для графика
            chartContainer.innerHTML = '<canvas id="revenueChart" width="400" height="200"></canvas>';
            // Отображаем данные
            displayRevenueData(data);
        })
        .catch(error => {
            console.error('Ошибка при загрузке данных о доходах:', error);
            chartContainer.innerHTML = '<div class="alert alert-danger">Ошибка при загрузке данных. Пожалуйста, попробуйте позже.</div>';
        });
}

// Загрузка данных расходов при выборе вкладки
function loadExpensesData() {
    // Проверяем, что контейнер для графика существует
    const chartContainer = document.querySelector('#expenses .card-body');
    if (!chartContainer) {
        console.error('Контейнер для графика не найден');
        return;
    }

    // Показываем спиннер загрузки
    chartContainer.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Загрузка...</span>
            </div>
            <p class="mt-2">Загрузка данных...</p>
        </div>
    `;

    // Установка дат по умолчанию, если они не были установлены
    if (!document.getElementById('expensesStartDate').value) {
        // Установка начальной даты (30 дней назад)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        document.getElementById('expensesStartDate').value = formatDate(startDate);
    }

    if (!document.getElementById('expensesEndDate').value) {
        // Установка конечной даты (сегодня)
        document.getElementById('expensesEndDate').value = formatDate(new Date());
    }

    // Получение выбранного периода дат
    const startDate = document.getElementById('expensesStartDate').value;
    const endDate = document.getElementById('expensesEndDate').value;

    // Асинхронная загрузка данных расходов за период
    fetchExpensesData(startDate, endDate)
        .then(data => {
            // Создаем canvas для графика
            chartContainer.innerHTML = '<canvas id="expensesChart" width="400" height="200"></canvas>';
            // Отображаем данные
            displayExpensesData(data);
        })
        .catch(error => {
            console.error('Ошибка при загрузке данных о расходах:', error);
            chartContainer.innerHTML = '<div class="alert alert-danger">Ошибка при загрузке данных. Пожалуйста, попробуйте позже.</div>';
        });
}

// Функция для запроса данных о доходах
async function fetchRevenueData(startDate, endDate) {
    try {
        // В реальном приложении здесь был бы запрос к API
        // Для демонстрации возвращаем тестовые данные
        const response = await fetch(`${API_BASE_URL}/get_transactions_by_type/1`);
        if (!response.ok) throw new Error('Не удалось загрузить данные о реализациях');

        const transactions = await response.json();

        // Фильтрация транзакций по периоду дат
        const filteredTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.created_on);
            return transactionDate >= new Date(startDate) &&
                transactionDate <= new Date(endDate + 'T23:59:59');
        });

        // Группировка по дням и подсчет сумм
        const revenueByDay = {};

        for (const transaction of filteredTransactions) {
            // Для получения закупки, чтобы узнать цену
            const purchaseResponse = await fetch(`${API_BASE_URL}/get_purchase_by_id/${transaction.id_purchase}`);
            if (!purchaseResponse.ok) continue;

            const purchase = await purchaseResponse.json();

            // Расчет выручки
            const revenue = purchase.selling_price * transaction.amount;

            // Получение даты (только день)
            const date = transaction.created_on.split('T')[0];

            if (!revenueByDay[date]) {
                revenueByDay[date] = 0;
            }

            revenueByDay[date] += revenue;
        }

        // Сортировка дат и формирование итогового массива данных
        const sortedDates = Object.keys(revenueByDay).sort();

        const chartData = {
            labels: sortedDates.map(date => formatDateForDisplay(date)),
            values: sortedDates.map(date => revenueByDay[date]),
            total: Object.values(revenueByDay).reduce((sum, value) => sum + value, 0),
            mostProfitableDay: sortedDates.length > 0 ?
                sortedDates.reduce((a, b) => revenueByDay[a] > revenueByDay[b] ? a : b) : null,
            averageDaily: sortedDates.length > 0 ?
                Object.values(revenueByDay).reduce((sum, value) => sum + value, 0) / sortedDates.length : 0
        };

        return chartData;
    } catch (error) {
        console.error('Ошибка при получении данных о доходах:', error);
        throw error;
    }
}

// Функция для запроса данных о расходах
async function fetchExpensesData(startDate, endDate) {
    try {
        // В реальном приложении здесь был бы запрос к API
        // Для демонстрации возвращаем тестовые данные
        const response = await fetch(`${API_BASE_URL}/get_transactions_by_type/2`);
        if (!response.ok) throw new Error('Не удалось загрузить данные о закупках');

        const transactions = await response.json();

        // Фильтрация транзакций по периоду дат
        const filteredTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.created_on);
            return transactionDate >= new Date(startDate) &&
                transactionDate <= new Date(endDate + 'T23:59:59');
        });

        // Группировка по дням и подсчет сумм
        const expensesByDay = {};

        for (const transaction of filteredTransactions) {
            // Для получения закупки, чтобы узнать цену
            const purchaseResponse = await fetch(`${API_BASE_URL}/get_purchase_by_id/${transaction.id_purchase}`);
            if (!purchaseResponse.ok) continue;

            const purchase = await purchaseResponse.json();

            // Расчет расходов
            const expense = purchase.purchase_price * transaction.amount;

            // Получение даты (только день)
            const date = transaction.created_on.split('T')[0];

            if (!expensesByDay[date]) {
                expensesByDay[date] = 0;
            }

            expensesByDay[date] += expense;
        }

        // Сортировка дат и формирование итогового массива данных
        const sortedDates = Object.keys(expensesByDay).sort();

        const chartData = {
            labels: sortedDates.map(date => formatDateForDisplay(date)),
            values: sortedDates.map(date => expensesByDay[date]),
            total: Object.values(expensesByDay).reduce((sum, value) => sum + value, 0),
            highestExpenseDay: sortedDates.length > 0 ?
                sortedDates.reduce((a, b) => expensesByDay[a] > expensesByDay[b] ? a : b) : null,
            averageDaily: sortedDates.length > 0 ?
                Object.values(expensesByDay).reduce((sum, value) => sum + value, 0) / sortedDates.length : 0
        };

        return chartData;
    } catch (error) {
        console.error('Ошибка при получении данных о расходах:', error);
        throw error;
    }
}

// Отображение данных доходов
function displayRevenueData(data) {
    // Обновление элемента canvas для графика
    const aggregatedData = aggregateDataByPeriod(data, revenuePeriod);
    const chartContainer = document.getElementById('revenueChart').parentNode;
    chartContainer.innerHTML = '<canvas id="revenueChart" width="400" height="200"></canvas>';

    // Создание графика
    const ctx = document.getElementById('revenueChart').getContext('2d');

    if (revenueChart) {
        revenueChart.destroy();
    }

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Доходы (₽)',
                data: data.values,
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderColor: 'rgba(76, 175, 80, 1)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: 'rgba(76, 175, 80, 1)',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '₽' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return 'Доход: ₽' + context.raw.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Обновление сводки
    document.getElementById('totalRevenue').textContent = '₽' + data.total.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    if (data.mostProfitableDay) {
        document.getElementById('mostProfitableDay').textContent = formatDateForDisplay(data.mostProfitableDay) +
            ' (₽' + Math.round(data.values[data.labels.indexOf(formatDateForDisplay(data.mostProfitableDay))]).toLocaleString() + ')';
    } else {
        document.getElementById('mostProfitableDay').textContent = 'Нет данных';
    }

    document.getElementById('averageDailyRevenue').textContent = '₽' + data.averageDaily.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Отображение данных расходов
function displayExpensesData(data) {
    // Обновление элемента canvas для графика
    const chartContainer = document.getElementById('expensesChart').parentNode;
    chartContainer.innerHTML = '<canvas id="expensesChart" width="400" height="200"></canvas>';

    // Создание графика
    const ctx = document.getElementById('expensesChart').getContext('2d');

    if (expensesChart) {
        expensesChart.destroy();
    }

    expensesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Расходы (₽)',
                data: data.values,
                backgroundColor: 'rgba(244, 67, 54, 0.2)',
                borderColor: 'rgba(244, 67, 54, 1)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: 'rgba(244, 67, 54, 1)',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '₽' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return 'Расход: ₽' + context.raw.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Обновление сводки
    document.getElementById('totalExpenses').textContent = '₽' + data.total.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    if (data.highestExpenseDay) {
        document.getElementById('highestExpenseDay').textContent = formatDateForDisplay(data.highestExpenseDay) +
            ' (₽' + Math.round(data.values[data.labels.indexOf(formatDateForDisplay(data.highestExpenseDay))]).toLocaleString() + ')';
    } else {
        document.getElementById('highestExpenseDay').textContent = 'Нет данных';
    }

    document.getElementById('averageDailyExpenses').textContent = '₽' + data.averageDaily.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Вспомогательная функция форматирования даты для input type="date"
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// Форматирование даты для отображения
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

// Добавление обработчиков событий для вкладок и фильтров
document.addEventListener('DOMContentLoaded', function () {
    // Обработчики для кнопок применения фильтра дат
    const revenueApplyButton = document.getElementById('revenueApplyDateRange');
    if (revenueApplyButton) {
        revenueApplyButton.addEventListener('click', loadRevenueData);
    }

    const expensesApplyButton = document.getElementById('expensesApplyDateRange');
    if (expensesApplyButton) {
        expensesApplyButton.addEventListener('click', loadExpensesData);
    }

    // Модифицируем existing setupNavigation или добавляем обработчики вкладок
    const existingSetupNavigation = window.setupNavigation;

    window.setupNavigation = function () {
        if (typeof existingSetupNavigation === 'function') {
            existingSetupNavigation();
        }

        // Получаем все ссылки навигации
        const navLinks = document.querySelectorAll('.sidebar .nav-link');

        // Добавляем обработчики для финансовых вкладок
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                const tabId = this.getAttribute('data-tab');

                if (tabId === 'revenue') {
                    loadRevenueData();
                } else if (tabId === 'expenses') {
                    loadExpensesData();
                }
            });
        });
    };

    // Вызываем обновленную функцию setupNavigation, если страница уже загружена
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        window.setupNavigation();
    }
});

// Глобальные переменные для хранения текущего периода агрегации
let revenuePeriod = 'day';
let expensesPeriod = 'day';

// Функции для агрегации данных по разным периодам
function aggregateDataByPeriod(rawData, period) {
    if (!rawData || !rawData.labels || !rawData.values || rawData.labels.length === 0) {
        return rawData;
    }

    // Если выбраны дни, возвращаем исходные данные
    if (period === 'day') {
        return rawData;
    }

    const aggregatedData = {
        labels: [],
        values: [],
        total: rawData.total,
        averageDaily: rawData.averageDaily
    };

    // Преобразуем даты из формата "DD.MM.YYYY" в объекты Date
    const dates = rawData.labels.map(label => {
        const parts = label.split('.');
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    });

    // Создаем объект для группировки данных
    const groupedData = {};

    for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        let key = '';

        if (period === 'week') {
            // Получаем начало недели (понедельник)
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1); // поправка для воскресенья
            const monday = new Date(date);
            monday.setDate(diff);

            key = `${monday.getDate().toString().padStart(2, '0')}.${(monday.getMonth() + 1).toString().padStart(2, '0')}.${monday.getFullYear()}`;
        } else if (period === 'month') {
            // Используем месяц и год как ключ
            key = `${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
        }

        if (!groupedData[key]) {
            groupedData[key] = {
                sum: 0,
                count: 0,
                label: period === 'month' ? getMonthName(date.getMonth()) + ' ' + date.getFullYear() : 'Неделя с ' + key
            };
        }

        groupedData[key].sum += rawData.values[i];
        groupedData[key].count++;
    }

    // Сортируем ключи по дате
    const sortedKeys = Object.keys(groupedData).sort((a, b) => {
        if (period === 'month') {
            const [monthA, yearA] = a.split('.');
            const [monthB, yearB] = b.split('.');

            if (yearA !== yearB) {
                return parseInt(yearA) - parseInt(yearB);
            }
            return parseInt(monthA) - parseInt(monthB);
        }

        // Для недель используем сортировку по дате
        const partsA = a.split('.');
        const partsB = b.split('.');

        const dateA = new Date(parseInt(partsA[2]), parseInt(partsA[1]) - 1, parseInt(partsA[0]));
        const dateB = new Date(parseInt(partsB[2]), parseInt(partsB[1]) - 1, parseInt(partsB[0]));

        return dateA - dateB;
    });

    // Создаем итоговые агрегированные данные
    aggregatedData.labels = sortedKeys.map(key => groupedData[key].label);
    aggregatedData.values = sortedKeys.map(key => groupedData[key].sum);

    // Находим наиболее прибыльный/затратный период
    const maxIndex = aggregatedData.values.indexOf(Math.max(...aggregatedData.values));

    if (period === 'week') {
        aggregatedData.mostProfitableDay = 'Неделя с ' + sortedKeys[maxIndex];
        aggregatedData.highestExpenseDay = 'Неделя с ' + sortedKeys[maxIndex];
    } else if (period === 'month') {
        const [month, year] = sortedKeys[maxIndex].split('.');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        aggregatedData.mostProfitableDay = getMonthName(date.getMonth()) + ' ' + date.getFullYear();
        aggregatedData.highestExpenseDay = getMonthName(date.getMonth()) + ' ' + date.getFullYear();
    }

    return aggregatedData;
}

// Вспомогательная функция для получения названия месяца
function getMonthName(monthIndex) {
    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[monthIndex];
}

// Добавьте эту функцию для управления видимостью поиска
function toggleSearchVisibility(tabId) {
    const searchBar = document.querySelector('.search-bar');
    if (!searchBar) return;

    // Скрываем поиск на вкладках доходов и расходов
    if (tabId === 'revenue' || tabId === 'expenses') {
        searchBar.style.display = 'none';
    } else {
        searchBar.style.display = 'flex';  // или 'block', в зависимости от вашего CSS
    }
}

// Модифицируем существующую функцию setupNavigation
// или добавим код в обработчик переключения вкладок

