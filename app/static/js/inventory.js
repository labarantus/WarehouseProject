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


// Глобальные переменные для хранения кэшированных данных
let cachedRevenueData = null;
let cachedExpensesData = null;
let cachedProfitData = null;
let cachedCategorySalesData = null;
let cachedTopProductsData = null;
let cachedABCAnalysis = null;
let cachedForecastData = null;


// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing app...');

    // Initialize navigation
    setupNavigation();

    // Initialize modals
    initializeModals();

    // Check authentication
    checkAuthentication();

    setupWriteoffEventHandlers();

    // Load initial data
    loadProductsData();
    // Load user management data.
    initializeUserManagement();

    // Setup buttons and form handlers
    setupButtons();
    setupRevexpPeriodButtons();
    setupProfitPeriodButtons();
    setupTopProductsButtons();
    setupForecastButtons();

    // Обработчик для кнопки применения фильтра дат
    const analyticsApplyButton = document.getElementById('analyticsApplyDateRange');
    if (analyticsApplyButton) {
        analyticsApplyButton.addEventListener('click', loadAnalyticsData);
    }

    // Интеграция с существующей навигацией
    const existingSetupNavigation = window.setupNavigation;

    window.setupNavigation = function () {
        if (typeof existingSetupNavigation === 'function') {
            existingSetupNavigation();
        }

        // Получаем все навигационные ссылки
        const navLinks = document.querySelectorAll('.sidebar .nav-link');

        // Добавляем обработчик для вкладки аналитики
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                const tabId = this.getAttribute('data-tab');

                if (tabId === 'analytics') {
                    // Скрываем поиск на вкладке аналитики
                    const searchBar = document.querySelector('.search-bar');
                    if (searchBar) {
                        searchBar.style.display = 'none';
                    }

                    // Загружаем данные аналитики
                    loadAnalyticsData();
                    // Загружаем канвасы аналитики
                    ensureCanvasElements();
                }
            });
        });
    };

    // Вызываем обновленную функцию setupNavigation, если страница уже загружена
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        window.setupNavigation();
    }

    // Проверяем, нужно ли подключать Chart.js
    if (!window.Chart) {
        // Если Chart.js не загружен, добавляем его динамически
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = function () {
            console.log('Chart.js загружен успешно');

            // Если текущая вкладка - аналитика, загружаем данные
            const analyticsTab = document.getElementById('analytics');
            if (analyticsTab && analyticsTab.classList.contains('active')) {
                loadAnalyticsData();
            }
        };
        document.head.appendChild(script);
    }
});


// Setup navigation
function setupNavigation() {
    // Получаем все навигационные ссылки
    const navLinks = document.querySelectorAll('.sidebar .nav-link');

    // Добавляем обработчик события для каждой ссылки
    navLinks.forEach(link => {
        link.addEventListener('click', function (event) {
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
    console.log(activeTab);
    if (activeTab) {
        const tabId = activeTab.getAttribute('data-tab');
        toggleSearchVisibility(tabId);
    }
}

// 1. Доходы/Расходы
function setupRevexpPeriodButtons() {
    const revexpPeriodButtons = document.querySelectorAll('.btn-group[role="group"] button[data-target="revexp"]');
    revexpPeriodButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Обновляем глобальную переменную периода
            revexpPeriod = this.getAttribute('data-period');

            // Обновляем активную кнопку
            revexpPeriodButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Используем сохраненные данные
            if (cachedRevenueData && cachedExpensesData) {
                createRevenueExpensesChart(cachedRevenueData, cachedExpensesData, revexpPeriod);
            }
        });
    });
}

// 2. Чистая прибыль
function setupProfitPeriodButtons() {
    const profitPeriodButtons = document.querySelectorAll('.btn-group[role="group"] button[data-target="profit"]');
    profitPeriodButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Обновляем глобальную переменную периода
            profitPeriod = this.getAttribute('data-period');

            // Обновляем активную кнопку
            profitPeriodButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Используем сохраненные данные
            if (cachedProfitData) {
                createNetProfitChart(cachedProfitData, profitPeriod);
            }
        });
    });
}

// 3. Топ товаров (сортировка)
function setupTopProductsButtons() {
    const topProductsSortButtons = document.querySelectorAll('.btn-group[role="group"] button[data-sort]');
    topProductsSortButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Обновляем глобальную переменную сортировки
            topProductsSort = this.getAttribute('data-sort');

            // Обновляем активную кнопку
            topProductsSortButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Используем сохраненные данные
            if (cachedTopProductsData) {
                createTopProductsChart(cachedTopProductsData, topProductsSort);
            }
        });
    });
}

// 4. Прогноз продаж
function setupForecastButtons() {
    const forecastButtons = document.querySelectorAll('.btn-group[role="group"] button[data-forecast]');
    forecastButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Обновляем глобальную переменную дней прогноза
            forecastDays = parseInt(this.getAttribute('data-forecast'));

            // Обновляем активную кнопку
            forecastButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Используем сохраненные данные
            if (cachedForecastData) {
                createForecastChart(cachedForecastData, forecastDays);
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
    const userRole = parseInt(sessionStorage.getItem('warehouseUserRole')) || localStorage.getItem('warehouseUserRole' || "0");


    if (userLogin) {
        // Set username
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            usernameElement.textContent = userLogin;
        }
        // Проверяем роль пользователя и ограничиваем доступ к аналитике и редакту пользователей
        if (userRole !== 1) {
            const analyticsMenuItem = document.querySelector('.nav-link[data-tab="analytics"]');
            const usersMenuItem = document.querySelector('.nav-link[data-tab="users"]');
            if (analyticsMenuItem) {
                analyticsMenuItem.parentElement.style.display = 'none';
            }
            if (usersMenuItem) {
                usersMenuItem.parentElement.style.display = 'none';
            }

            // Скрываем вкладку аналитики, если она существует
            const analyticsTab = document.getElementById('analytics');
            if (analyticsTab) {
                analyticsTab.style.display = 'none';
            }

        }
    } else {
        // Redirect to login
        window.location.href = '/login';
    }
}

// Load data for the active tab
function loadTabData(tabId) {
    console.log(`Loading data for tab: ${tabId}`);
    activeTab = tabId;
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
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'users':
            loadUsersData();
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
            console.log("Нажата кнопка поиска");
            const searchTerm = searchInput.value.toLowerCase();
            console.log("Фраза для поиска: ", searchTerm);
            filterTableBySearchTerm(searchTerm);
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                const searchTerm = this.value.toLowerCase().trim();
                filterTableBySearchTerm(searchTerm);
            }
        });
    }
}

// Загрузка данных о пользователях
async function loadUsersData() {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;

    // Показываем сообщение о загрузке
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Загрузка данных...</td></tr>';

    try {
        // Загружаем список пользователей через API
        const response = await fetch(`${API_BASE_URL}/get_all_users`);

        if (!response.ok) {
            throw new Error('Не удалось загрузить пользователей');
        }

        const users = await response.json();

        if (!users || users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Нет пользователей</td></tr>';
            return;
        }

        // Очищаем таблицу
        tableBody.innerHTML = '';

        // Добавляем каждого пользователя в таблицу
        for (const user of users) {
            // Получаем название роли
            let roleName = 'Неизвестно';
            switch (user.id_role) {
                case 1:
                    roleName = 'Администратор';
                    break;
                case 2:
                    roleName = 'Продавец';
                    break;
            }
            // Делаем проверку на то, может ли пользователь редактировать себя сам (НЕ МОЖЕТ!)
            const currentUserLogin = sessionStorage.getItem('warehouseUserLogin') || localStorage.getItem('warehouseUserLogin');
            const canEdit = user.login !== currentUserLogin;
            // Создаем строку
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.login}</td>
                <td>${roleName}</td>
                <td>
                    ${canEdit ?
                    `<button class="btn btn-sm btn-outline-primary" onclick="showChangeRoleModal(${user.id}, '${user.login}', ${user.id_role}, '${roleName}')">
                        <i class="bi bi-shield"></i> Изменить роль
                    </button>` : ``}
                </td>
            `;

            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Ошибка: ${error.message}</td></tr>`;
    }
}

// Функция для отображения модального окна изменения роли
function showChangeRoleModal(userId, userLogin, roleId, roleName) {
    // Заполняем данные пользователя
    document.getElementById('userIdForRole').value = userId;
    document.getElementById('userLoginDisplay').textContent = userLogin;
    document.getElementById('currentRoleDisplay').textContent = roleName;

    // Устанавливаем текущую роль в выпадающем списке
    const roleSelect = document.getElementById('newUserRole');
    roleSelect.value = roleId;

    // Показываем модальное окно
    window.changeRoleModal.show();
}

// Функция для сохранения новой роли пользователя
async function saveUserRole() {
    // Получаем данные из формы
    const userId = document.getElementById('userIdForRole').value;
    const userLogin = document.getElementById('userLoginDisplay').textContent;
    const newRoleId = document.getElementById('newUserRole').value;

    // Проверка выбора роли
    if (!newRoleId) {
        alert('Пожалуйста, выберите новую роль');
        return;
    }

    try {
        // Отправляем запрос на обновление роли
        const response = await fetch(`${API_BASE_URL}/update_user_role/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                new_role_id: parseInt(newRoleId),
                user_login: userLogin
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Ошибка API:", errorText);
            throw new Error(`Не удалось обновить роль пользователя: ${errorText}`);
        }

        // Закрываем модальное окно
        window.changeRoleModal.hide();

        // Обновляем таблицу пользователей
        loadUsersData();

        // Показываем сообщение об успешном обновлении
        alert(`Роль пользователя ${userLogin} успешно обновлена`);
    } catch (error) {
        console.error('Ошибка при обновлении роли:', error);
        alert(`Ошибка: ${error.message}`);
    }
}

// Инициализация модальных окон и обработчиков событий
function initializeUserManagement() {
    // Инициализация модального окна для изменения роли
    window.changeRoleModal = new bootstrap.Modal(document.getElementById('changeRoleModal'));

    // Обработчик кнопки сохранения роли
    const saveRoleButton = document.getElementById('saveRoleButton');
    if (saveRoleButton) {
        saveRoleButton.addEventListener('click', saveUserRole);
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
    console.log("Поиск по фразе: ", searchTerm);
    if (!searchTerm){
        loadTabData(activeTab);
        return;
    }
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
        case 'users':
            tableBody = document.getElementById('usersTableBody');
            cellSelector = 'td:nth-child(2)'; // Product name column
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


// Глобальные переменные для графиков
let revenueExpensesChart = null;
let profitStructureChart = null;
let netProfitChart = null;
let categorySalesChart = null;
let topProductsChart = null;
let abcPieChart = null;
let forecastChart = null;

// Глобальные переменные для настроек
let revexpPeriod = 'day';
let profitPeriod = 'day';
let topProductsSort = 'profit';
let forecastDays = 30;

// Загрузка данных аналитики при выборе вкладки
function loadAnalyticsData() {
    // Установка дат по умолчанию, если они не были установлены
    if (!document.getElementById('analyticsStartDate').value) {
        // Установка начальной даты (30 дней назад)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        document.getElementById('analyticsStartDate').value = formatDate(startDate);
    }

    if (!document.getElementById('analyticsEndDate').value) {
        // Установка конечной даты (сегодня)
        document.getElementById('analyticsEndDate').value = formatDate(new Date());
    }

    // Получение выбранного периода дат
    const startDate = document.getElementById('analyticsStartDate').value;
    const endDate = document.getElementById('analyticsEndDate').value;

    // НЕ показываем спиннеры загрузки - УДАЛЕНО: showLoadingSpinners();

    fetchAnalyticsData(startDate, endDate)
        .then(data => {
            // Сохраняем данные в глобальные переменные
            cachedRevenueData = data.revenueByDay;
            cachedExpensesData = data.expensesByDay;

            // Отображаем данные
            displayAnalyticsData(data);
        })
        .catch(error => {
            console.error('Ошибка при загрузке аналитических данных:', error);
        });
}


// Показать ошибку загрузки
function showLoadingError() {
    const chartContainers = [
        'revenueExpensesChart',
        'profitStructureChart',
        'netProfitChart',
        'categorySalesChart',
        'topProductsChart',
        'abcPieChart',
        'forecastChart'
    ];

    chartContainers.forEach(id => {
        const container = document.getElementById(id).parentNode;
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Ошибка при загрузке данных. Пожалуйста, попробуйте позже.
            </div>
        `;
    });
}

// Функция получения аналитических данных
async function fetchAnalyticsData(startDate, endDate) {
    try {
        // Здесь будет запрос к вашему API для получения аналитических данных
        // Для демонстрации возвращаем сгенерированные данные

        // Получаем транзакции продаж (доходы)
        const salesResponse = await fetch(`${API_BASE_URL}/get_transactions_by_type/1`);
        let salesTransactions = [];
        if (salesResponse.ok) {
            salesTransactions = await salesResponse.json();
        }

        // Получаем транзакции закупок (расходы)
        const purchasesResponse = await fetch(`${API_BASE_URL}/get_transactions_by_type/2`);
        let purchaseTransactions = [];
        if (purchasesResponse.ok) {
            purchaseTransactions = await purchasesResponse.json();
        }

        // Получаем транзакции списаний
        const writeoffsResponse = await fetch(`${API_BASE_URL}/get_transactions_by_type/3`);
        let writeoffTransactions = [];
        if (writeoffsResponse.ok) {
            writeoffTransactions = await writeoffsResponse.json();
        }

        // Получение всех товаров
        const productsResponse = await fetch(`${API_BASE_URL}/get_product_all`);
        let products = [];
        if (productsResponse.ok) {
            products = await productsResponse.json();
        }

        // Получение всех категорий
        const categoriesResponse = await fetch(`${API_BASE_URL}/get_categories`);
        let categories = [];
        if (categoriesResponse.ok) {
            categories = await categoriesResponse.json();
        }

        // Функция для получения детальной информации о закупке
        const getPurchaseDetails = async (purchaseId) => {
            try {
                const response = await fetch(`${API_BASE_URL}/get_purchase_by_id/${purchaseId}`);
                if (response.ok) {
                    return await response.json();
                }
            } catch (e) {
                console.warn(`Не удалось получить детали закупки ${purchaseId}`);
            }
            return null;
        };

        // Фильтрация по датам
        const filterByDateRange = (transactions) => {
            return transactions.filter(transaction => {
                const transactionDate = new Date(transaction.created_on);
                return transactionDate >= new Date(startDate) &&
                    transactionDate <= new Date(endDate + 'T23:59:59');
            });
        };

        // Фильтруем транзакции по выбранному диапазону дат
        const filteredSales = filterByDateRange(salesTransactions);
        const filteredPurchases = filterByDateRange(purchaseTransactions);
        const filteredWriteoffs = filterByDateRange(writeoffTransactions);

        // Обогащаем данные о транзакциях информацией о товарах и закупках
        const enrichedSales = [];
        for (const sale of filteredSales) {
            const purchase = await getPurchaseDetails(sale.id_purchase);
            if (purchase) {
                const product = products.find(p => p.id === purchase.id_product);
                const category = product ? categories.find(c => c.id === product.id_category) : null;

                enrichedSales.push({
                    ...sale,
                    purchase,
                    product,
                    category,
                    revenue: purchase.selling_price * sale.amount,
                    cost: purchase.purchase_price * sale.amount,
                    profit: (purchase.selling_price - purchase.purchase_price) * sale.amount,
                    margin: ((purchase.selling_price - purchase.purchase_price) / purchase.selling_price * 100).toFixed(2)
                });
            }
        }

        // Расчет KPI
        const totalRevenue = enrichedSales.reduce((sum, sale) => sum + sale.revenue, 0);
        const totalCost = enrichedSales.reduce((sum, sale) => sum + sale.cost, 0);
        const totalProfit = enrichedSales.reduce((sum, sale) => sum + sale.profit, 0);
        const averageMargin = enrichedSales.length > 0 ?
            enrichedSales.reduce((sum, sale) => sum + parseFloat(sale.margin), 0) / enrichedSales.length : 0;

        // Формирование данных по доходам/расходам по дням
        const revenueByDay = {};
        const expensesByDay = {};
        const profitByDay = {};

        // Группировка данных о продажах по дням
        enrichedSales.forEach(sale => {
            const date = sale.created_on.split('T')[0];
            if (!revenueByDay[date]) revenueByDay[date] = 0;
            if (!expensesByDay[date]) expensesByDay[date] = 0; // Инициализируем расходы для этого дня
            if (!profitByDay[date]) profitByDay[date] = 0;

            revenueByDay[date] += sale.revenue;
            expensesByDay[date] += sale.cost; // Добавляем себестоимость проданного товара
            profitByDay[date] += sale.profit;
        });

        // Группировка данных о закупках по дням
        for (const purchase of filteredPurchases) {
            const date = purchase.created_on.split('T')[0];

            if (!expensesByDay[date]) expensesByDay[date] = 0;

            const purchaseDetails = await getPurchaseDetails(purchase.id_purchase);
            if (purchaseDetails) {
                expensesByDay[date] += purchaseDetails.purchase_price * purchase.amount;
            }
        }

        // Данные по продажам в разрезе категорий
        const salesByCategory = {};
        enrichedSales.forEach(sale => {
            const categoryName = sale.category ? sale.category.name : 'Без категории';

            if (!salesByCategory[categoryName]) {
                salesByCategory[categoryName] = {
                    revenue: 0,
                    profit: 0,
                    count: 0
                };
            }

            salesByCategory[categoryName].revenue += sale.revenue;
            salesByCategory[categoryName].profit += sale.profit;
            salesByCategory[categoryName].count += sale.amount;
        });

        // Данные о продуктах для ABC-анализа и топ товаров
        const productSales = {};
        enrichedSales.forEach(sale => {
            const productId = sale.product ? sale.product.id : null;
            if (!productId) return;

            if (!productSales[productId]) {
                productSales[productId] = {
                    id: productId,
                    name: sale.product.name,
                    revenue: 0,
                    profit: 0,
                    quantity: 0,
                    margin: 0
                };
            }

            productSales[productId].revenue += sale.revenue;
            productSales[productId].profit += sale.profit;
            productSales[productId].quantity += sale.amount;
        });

        // Рассчитываем маржу для каждого продукта
        Object.values(productSales).forEach(product => {
            product.margin = product.revenue > 0 ? (product.profit / product.revenue * 100) : 0;
        });

        // ABC-анализ
        const abcAnalysis = calculateABCAnalysis(Object.values(productSales));

        // Сортированный массив товаров для топ-10
        const topProductsByProfit = Object.values(productSales)
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 10);

        const topProductsBySales = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        const topProductsByMargin = Object.values(productSales)
            .sort((a, b) => b.margin - a.margin)
            .filter(p => p.quantity > 0) // Отфильтровываем товары без продаж
            .slice(0, 10);

        // Данные для прогноза
        const forecastData = generateImprovedForecastData(revenueByDay, 90); // Прогноз на 90 дней

        // Активные товары (с продажами в выбранном периоде)
        const activeProductsCount = Object.keys(productSales).length;

        // Средний чек
        const transactionCount = enrichedSales.length;
        const averageCheck = transactionCount > 0 ? totalRevenue / transactionCount : 0;

        // Оборачиваемость запасов (упрощенно)
        const stockTurnover = totalCost > 0 ? totalRevenue / totalCost : 0;

        // Формируем итоговый объект аналитических данных
        return {
            kpi: {
                totalRevenue,
                totalCost,
                totalProfit,
                averageMargin,
                activeProductsCount,
                averageCheck,
                stockTurnover,
                transactionCount
            },
            revenueByDay,
            expensesByDay,
            profitByDay,
            salesByCategory,
            productSales,
            abcAnalysis,
            topProducts: {
                byProfit: topProductsByProfit,
                bySales: topProductsBySales,
                byMargin: topProductsByMargin
            },
            forecastData
        };
    } catch (error) {
        console.error('Ошибка при получении аналитических данных:', error);
        throw error;
    }
}

function displayAnalyticsData(data) {
    if (!data) {
        console.error('Получены пустые аналитические данные');
        return;
    }

    // Обновляем KPI карточки
    if (data.kpi) {
        updateKPICards(data.kpi);
    }

    // Создаем графики, не изменяя структуру DOM
    try {
        if (data.revenueByDay && data.expensesByDay) {
            cachedRevenueData = data.revenueByDay;
            cachedExpensesData = data.expensesByDay;
            createRevenueExpensesChart(data.revenueByDay, data.expensesByDay, revexpPeriod);
        }

        if (data.kpi) {
            createProfitStructureChart(data.kpi);
        }

        if (data.profitByDay) {
            cachedProfitData = data.profitByDay;
            createNetProfitChart(data.profitByDay, profitPeriod);
        }

        if (data.salesByCategory) {
            cachedCategorySalesData = data.salesByCategory;
            createCategorySalesChart(data.salesByCategory);
        }

        if (data.topProducts) {
            cachedTopProductsData = data.topProducts;
            createTopProductsChart(data.topProducts, topProductsSort);
        }

        if (data.abcAnalysis) {
            cachedABCAnalysis = data.abcAnalysis;
            createABCPieChart(data.abcAnalysis);
            updateABCAnalysisTable(data.abcAnalysis);
        }

        if (data.forecastData) {
            cachedForecastData = data.forecastData;
            createForecastChart(data.forecastData, forecastDays);
        }

        // Генерируем рекомендации
        if (data.forecastData) {
            generateRecommendations(data);
        }
    } catch (error) {
        console.error('Ошибка при отображении данных:', error);
    }
}

// Обновление KPI карточек
function updateKPICards(kpi) {
    // Форматирование валюты
    const formatCurrency = (value) => {
        return '₽' + value.toLocaleString('ru-RU', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    // Форматирование процентов
    const formatPercent = (value) => {
        return parseFloat(value).toFixed(1) + '%';
    };

    // Валовая прибыль
    document.getElementById('grossProfit').textContent = formatCurrency(kpi.totalProfit);

    // Маржинальность
    document.getElementById('marginPercent').textContent = formatPercent(kpi.averageMargin);

    // Оборачиваемость запасов
    document.getElementById('stockTurnover').textContent = kpi.stockTurnover.toFixed(2) + 'x';

    // Активные товары
    document.getElementById('activeProducts').textContent = kpi.activeProductsCount;

    // Средний чек
    document.getElementById('averageCheck').textContent = formatCurrency(kpi.averageCheck);


    // TODO: Добавить тренды (для этого нужны данные предыдущего периода)
    // Пока устанавливаем нейтральные значения
    document.querySelectorAll('.trend').forEach(trend => {
        trend.innerHTML = '<i class="bi bi-arrow-right"></i> <span>0%</span>';
        trend.classList.remove('up', 'down');
    });
}

// Функция createRevenueExpensesChart в inventory.js (строка 2816)
function createRevenueExpensesChart(revenueData, expensesData, period) {
    // Сохраняем данные в кэш
    cachedRevenueData = revenueData;
    cachedExpensesData = expensesData;

    if (!revenueData || !expensesData) {
        console.error('Отсутствуют данные для графика доходов и расходов');
        return;
    }

    // Получаем существующий canvas
    const canvas = document.getElementById('revenueExpensesChart');
    if (!canvas) {
        console.error('Элемент revenueExpensesChart не найден в DOM');
        return;
    }

    // Получаем контекст рисования
    const ctx = canvas.getContext('2d');

    // Важно: проверяем существование chart и destroy
    if (typeof window.revenueExpensesChart !== 'undefined' &&
        window.revenueExpensesChart &&
        typeof window.revenueExpensesChart.destroy === 'function') {
        window.revenueExpensesChart.destroy();
    }

    // Подготовка данных с агрегацией по периоду
    const aggregatedData = aggregateFinancialData(revenueData, expensesData, period);

    // Создаем новый график
    window.revenueExpensesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: aggregatedData.labels,
            datasets: [
                {
                    label: 'Доходы',
                    data: aggregatedData.revenueValues,
                    backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Расходы',
                    data: aggregatedData.expensesValues,
                    backgroundColor: 'rgba(244, 67, 54, 0.7)',
                    borderColor: 'rgba(244, 67, 54, 1)',
                    borderWidth: 1
                }
            ]
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
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ₽' + context.raw.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Структура прибыли (круговая диаграмма)
function createProfitStructureChart(kpi) {
    // Создаем новый canvas
    const chartContainer = document.getElementById('profitStructureChart').parentNode;
    chartContainer.innerHTML = '<canvas id="profitStructureChart"></canvas>';
    const ctx = document.getElementById('profitStructureChart').getContext('2d');

    // Уничтожаем старый график, если он существует
    if (profitStructureChart) {
        profitStructureChart.destroy();
    }

    // Расчет данных для диаграммы
    const totalRevenue = kpi.totalRevenue;
    const totalCost = kpi.totalCost;
    const grossProfit = kpi.totalProfit;

    // Создаем новый график
    profitStructureChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Себестоимость', 'Прибыль'],
            datasets: [{
                data: [totalCost, grossProfit],
                backgroundColor: [
                    'rgba(244, 67, 54, 0.7)',
                    'rgba(76, 175, 80, 0.7)'
                ],
                borderColor: [
                    'rgba(244, 67, 54, 1)',
                    'rgba(76, 175, 80, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.raw;
                            const percent = ((value / totalRevenue) * 100).toFixed(1);
                            return context.label + ': ₽' + value.toLocaleString() + ' (' + percent + '%)';
                        }
                    }
                }
            }
        }
    });
}

// График чистой прибыли
function createNetProfitChart(profitData, period) {
    // Сохраняем данные в кэш
    cachedProfitData = profitData;

    // Подготовка данных с агрегацией по периоду
    const aggregatedData = aggregateChartData(profitData, period);

    // Получаем существующий canvas
    const canvas = document.getElementById('netProfitChart');
    if (!canvas) {
        console.error('Элемент netProfitChart не найден в DOM');
        return;
    }

    // Получаем контекст рисования
    const ctx = canvas.getContext('2d');

    // Уничтожаем старый график, если он существует
    if (typeof window.netProfitChart !== 'undefined' &&
        window.netProfitChart &&
        typeof window.netProfitChart.destroy === 'function') {
        window.netProfitChart.destroy();
    }

    // Вычисляем скользящее среднее для тренда
    const movingAverage = calculateMovingAverage(aggregatedData.values, 3);

    // Создаем новый график
    window.netProfitChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: aggregatedData.labels,
            datasets: [
                {
                    label: 'Чистая прибыль',
                    data: aggregatedData.values,
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(33, 150, 243, 1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Тренд (скользящее среднее)',
                    data: movingAverage,
                    borderColor: 'rgba(103, 58, 183, 1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: false,
                    borderDash: [5, 5]
                }
            ]
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
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ₽' + context.raw.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// График продаж по категориям
function createCategorySalesChart(salesByCategory) {
    // Подготовка данных
    const categories = Object.keys(salesByCategory);
    const revenue = categories.map(category => salesByCategory[category].revenue);
    const profit = categories.map(category => salesByCategory[category].profit);

    // Создаем новый canvas
    const chartContainer = document.getElementById('categorySalesChart').parentNode;
    chartContainer.innerHTML = '<canvas id="categorySalesChart"></canvas>';
    const ctx = document.getElementById('categorySalesChart').getContext('2d');

    // Уничтожаем старый график, если он существует
    if (categorySalesChart) {
        categorySalesChart.destroy();
    }

    // Создаем новый график
    categorySalesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Выручка',
                    data: revenue,
                    backgroundColor: 'rgba(33, 150, 243, 0.7)',
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Прибыль',
                    data: profit,
                    backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1
                }
            ]
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
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ₽' + context.raw.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Топ товаров
function createTopProductsChart(topProducts, sortType) {
    // Сохраняем данные в кэш
    cachedTopProductsData = topProducts;

    // Выбор данных в зависимости от типа сортировки
    let data;
    let labelSuffix;

    switch (sortType) {
        case 'profit':
            data = topProducts.byProfit;
            labelSuffix = ' (прибыль)';
            break;
        case 'sales':
            data = topProducts.bySales;
            labelSuffix = ' (выручка)';
            break;
        case 'margin':
            data = topProducts.byMargin;
            labelSuffix = ' (маржа)';
            break;
        default:
            data = topProducts.byProfit;
            labelSuffix = ' (прибыль)';
    }

    // Подготовка данных для графика
    const labels = data.map(product => product.name);
    let values;

    if (sortType === 'margin') {
        values = data.map(product => parseFloat(product.margin));
    } else {
        values = data.map(product => sortType === 'profit' ? product.profit : product.revenue);
    }

    try {
        // Получаем canvas элемент
        const canvas = document.getElementById('topProductsChart');
        if (!canvas) {
            console.error('Canvas элемент для топ товаров не найден');
            return;
        }

        // Получаем контекст для рисования
        const ctx = canvas.getContext('2d');

        // Уничтожаем предыдущий график, если он существует
        if (typeof window.topProductsChart !== 'undefined' &&
            window.topProductsChart &&
            typeof window.topProductsChart.destroy === 'function') {
            window.topProductsChart.destroy();
        }

        // Цвета в зависимости от типа сортировки
        const backgroundColor = sortType === 'profit' ?
            'rgba(76, 175, 80, 0.7)' :
            (sortType === 'sales' ? 'rgba(33, 150, 243, 0.7)' : 'rgba(255, 193, 7, 0.7)');

        const borderColor = sortType === 'profit' ?
            'rgba(76, 175, 80, 1)' :
            (sortType === 'sales' ? 'rgba(33, 150, 243, 1)' : 'rgba(255, 193, 7, 1)');

        // Создаем новый график - используем type: 'bar' с indexAxis: 'y'
        window.topProductsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Топ товаров' + labelSuffix,
                    data: values,
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y', // Для горизонтального bar chart
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                if (sortType === 'margin') {
                                    return value.toFixed(1) + '%';
                                } else {
                                    return '₽' + value.toLocaleString();
                                }
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                if (sortType === 'margin') {
                                    return context.dataset.label + ': ' + context.raw.toFixed(1) + '%';
                                } else {
                                    return context.dataset.label + ': ₽' + context.raw.toLocaleString();
                                }
                            }
                        }
                    }
                }
            }
        });

        console.log("График топ товаров успешно создан");
    } catch (error) {
        console.error("Ошибка при создании графика топ товаров:", error);
    }
}

// ABC-анализ (круговая диаграмма)
function createABCPieChart(abcAnalysis) {
    // Создаем новый canvas
    const chartContainer = document.getElementById('abcPieChart').parentNode;
    chartContainer.innerHTML = '<canvas id="abcPieChart"></canvas>';
    const ctx = document.getElementById('abcPieChart').getContext('2d');

    // Уничтожаем старый график, если он существует
    if (abcPieChart) {
        abcPieChart.destroy();
    }

    // Создаем новый график
    abcPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Группа A', 'Группа B', 'Группа C'],
            datasets: [{
                data: [
                    abcAnalysis.A.profitPercent,
                    abcAnalysis.B.profitPercent,
                    abcAnalysis.C.profitPercent
                ],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(158, 158, 158, 0.7)'
                ],
                borderColor: [
                    'rgba(76, 175, 80, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(158, 158, 158, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.raw;
                            return context.label + ': ' + value.toFixed(1) + '% прибыли';
                        }
                    }
                }
            }
        }
    });
}

// Прогноз продаж
function createForecastChart(forecastData, days) {
    // Сохраняем данные в кэш
    cachedForecastData = forecastData;

    // Фильтруем данные по выбранному количеству дней
    const filteredData = {
        labels: forecastData.labels.slice(0, days),
        actualValues: forecastData.actualValues.slice(0, days),
        forecastValues: forecastData.forecastValues.slice(0, days),
        confidenceLower: forecastData.confidenceLower.slice(0, days),
        confidenceUpper: forecastData.confidenceUpper.slice(0, days)
    };

    // Получаем canvas элемент
    const canvas = document.getElementById('forecastChart');
    if (!canvas) {
        console.error('Canvas элемент для прогноза не найден');
        return;
    }

    // Получаем контекст для рисования
    const ctx = canvas.getContext('2d');

    // Уничтожаем предыдущий график, если он существует
    if (typeof window.forecastChart !== 'undefined' &&
        window.forecastChart &&
        typeof window.forecastChart.destroy === 'function') {
        window.revenueExforecastChartpensesChart.destroy();
    }

    // Создаем новый график
    window.forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: filteredData.labels,
            datasets: [
                {
                    label: 'Фактические продажи',
                    data: filteredData.actualValues,
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(33, 150, 243, 1)',
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Прогноз',
                    data: filteredData.forecastValues,
                    backgroundColor: 'rgba(156, 39, 176, 0.2)',
                    borderColor: 'rgba(156, 39, 176, 1)',
                    borderWidth: 2,
                    pointRadius: 2,
                    pointBackgroundColor: 'rgba(156, 39, 176, 1)',
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Нижняя граница',
                    data: filteredData.confidenceLower,
                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    borderColor: 'rgba(156, 39, 176, 0.5)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.3,
                    fill: '+1'
                },
                {
                    label: 'Верхняя граница',
                    data: filteredData.confidenceUpper,
                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    borderColor: 'rgba(156, 39, 176, 0.5)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.3,
                    fill: false
                }
            ]
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
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ₽' + context.raw.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Обновление таблицы ABC-анализа
function updateABCAnalysisTable(abcAnalysis) {
    document.getElementById('groupACount').textContent = abcAnalysis.A.count;
    document.getElementById('groupBCount').textContent = abcAnalysis.B.count;
    document.getElementById('groupCCount').textContent = abcAnalysis.C.count;

    document.getElementById('groupAPercent').textContent = abcAnalysis.A.profitPercent.toFixed(1) + '%';
    document.getElementById('groupBPercent').textContent = abcAnalysis.B.profitPercent.toFixed(1) + '%';
    document.getElementById('groupCPercent').textContent = abcAnalysis.C.profitPercent.toFixed(1) + '%';
}

// Генерация рекомендаций
function generateRecommendations(data) {
    const recommendationElement = document.getElementById('forecastRecommendation');

    // Анализ тренда продаж
    const lastValues = data.forecastData.forecastValues.slice(0, 30);
    const firstHalf = lastValues.slice(0, 15);
    const secondHalf = lastValues.slice(15);

    const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const growthRate = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    let recommendation = '';

    if (growthRate > 10) {
        recommendation = 'Ожидается значительный рост продаж. Рекомендуется увеличить запасы наиболее популярных товаров из категории А и инвестировать в маркетинг для поддержания тренда.';
    } else if (growthRate > 3) {
        recommendation = 'Ожидается умеренный рост продаж. Рекомендуется поддерживать оптимальный уровень запасов и сосредоточиться на товарах с высокой маржинальностью.';
    } else if (growthRate >= -3) {
        recommendation = 'Прогнозируются стабильные продажи. Рекомендуется оптимизировать ассортимент, сократив долю товаров категории C и увеличив предложение товаров категории A и B.';
    } else if (growthRate >= -10) {
        recommendation = 'Ожидается небольшое снижение продаж. Рекомендуется сократить закупки и провести акции для стимулирования спроса.';
    } else {
        recommendation = 'Прогнозируется значительное снижение продаж. Рекомендуется минимизировать закупки, пересмотреть ценовую политику и провести анализ конкурентов.';
    }

    recommendationElement.textContent = recommendation;
}

// Вспомогательные функции

// ABC-анализ товаров (принцип Парето 20/80)
function calculateABCAnalysis(products) {
    // Сортируем товары по прибыли (от большей к меньшей)
    const sortedProducts = [...products].sort((a, b) => b.profit - a.profit);

    // Рассчитываем общую прибыль
    const totalProfit = sortedProducts.reduce((sum, product) => sum + product.profit, 0);

    // Инициализируем группы
    const groups = {
        A: {products: [], profit: 0, count: 0, profitPercent: 0},
        B: {products: [], profit: 0, count: 0, profitPercent: 0},
        C: {products: [], profit: 0, count: 0, profitPercent: 0}
    };

    // Распределяем товары по группам
    let cumulativePercent = 0;

    for (const product of sortedProducts) {
        const profitPercent = (product.profit / totalProfit) * 100;
        cumulativePercent += profitPercent;

        if (cumulativePercent <= 70) {
            // Группа A: топ товары, приносящие 70% прибыли
            groups.A.products.push(product);
            groups.A.profit += product.profit;
        } else if (cumulativePercent <= 90) {
            // Группа B: товары, приносящие следующие 20% прибыли
            groups.B.products.push(product);
            groups.B.profit += product.profit;
        } else {
            // Группа C: товары, приносящие последние 10% прибыли
            groups.C.products.push(product);
            groups.C.profit += product.profit;
        }
    }

    // Вычисляем проценты и количество товаров в каждой группе
    groups.A.count = groups.A.products.length;
    groups.B.count = groups.B.products.length;
    groups.C.count = groups.C.products.length;

    groups.A.profitPercent = (groups.A.profit / totalProfit) * 100;
    groups.B.profitPercent = (groups.B.profit / totalProfit) * 100;
    groups.C.profitPercent = (groups.C.profit / totalProfit) * 100;

    return groups;
}

// Агрегация финансовых данных по периодам
function aggregateFinancialData(revenueData, expensesData, period) {
    const result = {
        labels: [],
        revenueValues: [],
        expensesValues: []
    };

    if (period === 'day') {
        // Для дневного представления возвращаем данные как есть
        const allDates = [...new Set([...Object.keys(revenueData), ...Object.keys(expensesData)])].sort();

        result.labels = allDates.map(date => formatDateForDisplay(date));
        result.revenueValues = allDates.map(date => revenueData[date] || 0);
        result.expensesValues = allDates.map(date => expensesData[date] || 0);

        return result;
    }

    // Для недельного и месячного представлений агрегируем данные
    const groupedRevenue = aggregateByPeriod(revenueData, period);
    const groupedExpenses = aggregateByPeriod(expensesData, period);

    // Объединяем ключи из обоих наборов данных
    const allPeriods = [...new Set([...Object.keys(groupedRevenue), ...Object.keys(groupedExpenses)])].sort();

    result.labels = allPeriods.map(key => {
        if (period === 'week') {
            return 'Неделя ' + key;
        } else if (period === 'month') {
            const [year, month] = key.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            return getMonthName(date.getMonth()) + ' ' + year;
        }
        return key;
    });

    result.revenueValues = allPeriods.map(key => groupedRevenue[key] || 0);
    result.expensesValues = allPeriods.map(key => groupedExpenses[key] || 0);

    return result;
}

// Агрегация данных для одного набора значений
function aggregateChartData(data, period) {
    const result = {
        labels: [],
        values: []
    };

    if (period === 'day') {
        // Для дневного представления возвращаем данные как есть
        const allDates = Object.keys(data).sort();

        result.labels = allDates.map(date => formatDateForDisplay(date));
        result.values = allDates.map(date => data[date] || 0);

        return result;
    }

    // Для недельного и месячного представлений агрегируем данные
    const groupedData = aggregateByPeriod(data, period);

    // Сортируем ключи
    const sortedKeys = Object.keys(groupedData).sort();

    result.labels = sortedKeys.map(key => {
        if (period === 'week') {
            return 'Неделя ' + key;
        } else if (period === 'month') {
            const [year, month] = key.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            return getMonthName(date.getMonth()) + ' ' + year;
        }
        return key;
    });

    result.values = sortedKeys.map(key => groupedData[key] || 0);

    return result;
}

// Агрегация данных по периодам (неделя/месяц)
function aggregateByPeriod(data, period) {
    const result = {};

    // Перебираем все даты и агрегируем по выбранному периоду
    Object.entries(data).forEach(([dateStr, value]) => {
        const date = new Date(dateStr);
        let key;

        if (period === 'week') {
            // Получаем номер недели в году
            const weekNumber = getWeekNumber(date);
            key = `${date.getFullYear()}-${weekNumber}`;
        } else if (period === 'month') {
            // Используем год и месяц как ключ
            key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        }

        if (!result[key]) {
            result[key] = 0;
        }

        result[key] += value;
    });

    return result;
}

// Получение номера недели в году
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Вычисление скользящего среднего
function calculateMovingAverage(values, windowSize) {
    const result = [];

    for (let i = 0; i < values.length; i++) {
        if (i < windowSize - 1) {
            // Для начальных точек, где недостаточно предыдущих значений,
            // используем то же значение, что и в исходном массиве
            result.push(values[i]);
        } else {
            // Вычисляем среднее для окна
            let sum = 0;
            for (let j = 0; j < windowSize; j++) {
                sum += values[i - j];
            }
            result.push(sum / windowSize);
        }
    }

    return result;
}

/**
 * Расширенный алгоритм прогнозирования продаж с использованием нескольких методов
 * и учетом сезонности, трендов и выбросов
 */

// Функция для генерации улучшенного прогноза продаж
function generateImprovedForecastData(historicalData, forecastDays = 90) {
    // Проверка наличия исторических данных
    if (!historicalData || Object.keys(historicalData).length === 0) {
        console.error('Отсутствуют исторические данные для прогноза');
        return null;
    }

    // 1. Подготовка и очистка данных
    const preparedData = prepareHistoricalData(historicalData);

    if (preparedData.dates.length < 14) {
        console.warn('Недостаточно исторических данных для точного прогноза');
    }

    // 2. Обнаружение и обработка выбросов
    const cleanedData = detectAndHandleOutliers(preparedData);

    // 3. Декомпозиция временного ряда для выявления:
    // - Тренда
    // - Сезонности
    // - Остаточного шума
    const decomposition = timeSeriesDecomposition(cleanedData);

    // 4. Генерация прогноза с использованием выявленных компонентов
    return generateForecast(decomposition, forecastDays);
}

/**
 * Подготовка исторических данных в формат, удобный для анализа
 */
function prepareHistoricalData(historicalData) {
    // Преобразование данных из объекта в массивы дат и значений
    const dates = Object.keys(historicalData).sort();
    const values = dates.map(date => historicalData[date] || 0);

    // Заполнение пропущенных дней
    const filledData = fillMissingDates(dates, values);

    return filledData;
}

/**
 * Заполнение пропущенных дат интерполированными значениями
 */
function fillMissingDates(dates, values) {
    if (dates.length <= 1) return {dates, values};

    const allDates = [];
    const allValues = [];

    // Создаем временную шкалу с полными датами
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[dates.length - 1]);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        allDates.push(dateStr);

        const index = dates.indexOf(dateStr);
        if (index !== -1) {
            allValues.push(values[index]);
        } else {
            // Если дата отсутствует, используем интерполяцию
            // Для простоты берем среднее между ближайшими известными значениями
            const prevDate = new Date(d);
            prevDate.setDate(prevDate.getDate() - 1);
            const prevDateStr = prevDate.toISOString().split('T')[0];
            const prevIndex = dates.indexOf(prevDateStr);

            const nextDate = new Date(d);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextDateStr = nextDate.toISOString().split('T')[0];
            const nextIndex = dates.indexOf(nextDateStr);

            if (prevIndex !== -1 && nextIndex !== -1) {
                allValues.push((values[prevIndex] + values[nextIndex]) / 2);
            } else if (prevIndex !== -1) {
                allValues.push(values[prevIndex]);
            } else if (nextIndex !== -1) {
                allValues.push(values[nextIndex]);
            } else {
                // Если не можем найти соседние значения, используем среднее по всем данным
                const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
                allValues.push(avg);
            }
        }
    }

    return {dates: allDates, values: allValues};
}

/**
 * Обнаружение и обработка выбросов в данных
 */
function detectAndHandleOutliers(data) {
    const {dates, values} = data;
    const cleanedValues = [...values];

    // Расчет квартилей для метода межквартильного размаха (IQR)
    const sortedValues = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sortedValues.length * 0.25);
    const q3Index = Math.floor(sortedValues.length * 0.75);
    const q1 = sortedValues[q1Index];
    const q3 = sortedValues[q3Index];
    const iqr = q3 - q1;

    // Определение границ выбросов
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    // Замена выбросов на медианные значения ближайших непроблемных точек
    for (let i = 0; i < values.length; i++) {
        if (values[i] < lowerBound || values[i] > upperBound) {
            // Найдем ближайшие непроблемные точки
            const surroundingValues = [];
            for (let j = Math.max(0, i - 3); j < Math.min(values.length, i + 4); j++) {
                if (j !== i && values[j] >= lowerBound && values[j] <= upperBound) {
                    surroundingValues.push(values[j]);
                }
            }

            if (surroundingValues.length > 0) {
                // Используем медиану окружающих значений
                surroundingValues.sort((a, b) => a - b);
                const medianIndex = Math.floor(surroundingValues.length / 2);
                cleanedValues[i] = surroundingValues[medianIndex];
            } else {
                // Если нет подходящих окружающих значений, используем граничное значение
                cleanedValues[i] = values[i] > upperBound ? upperBound : lowerBound;
            }
        }
    }

    return {dates, values: cleanedValues};
}

/**
 * Декомпозиция временного ряда на тренд, сезонность и остатки
 */
function timeSeriesDecomposition(data) {
    const {dates, values} = data;

    // 1. Определение тренда с помощью скользящего среднего
    const trendWindow = Math.min(7, Math.floor(values.length / 4)); // Для недельного скользящего среднего
    const trend = calculateMovingAverage(values, trendWindow);

    // 2. Выделение сезонного паттерна (еженедельный)
    const seasonalPeriod = 7; // Предполагаем недельную сезонность
    const seasonal = detectSeasonality(values, trend, seasonalPeriod);

    // 3. Вычисление остатка (шума)
    const residuals = [];
    for (let i = 0; i < values.length; i++) {
        residuals.push(values[i] - (trend[i] || 0) - (seasonal[i % seasonalPeriod] || 0));
    }

    // 4. Анализ автокорреляции для выявления других закономерностей
    const autocorrelation = calculateAutocorrelation(residuals, 14); // Проверяем корреляцию до 2 недель

    return {
        dates,
        values,
        trend,
        seasonal,
        seasonalPeriod,
        residuals,
        autocorrelation
    };
}

/**
 * Расчет скользящего среднего
 */
function calculateMovingAverage(values, window) {
    const result = [];

    // Дополняем края массива
    const paddedValues = [];
    const halfWindow = Math.floor(window / 2);

    // Левый край
    for (let i = 0; i < halfWindow; i++) {
        paddedValues.push(values[0]);
    }

    // Основные значения
    paddedValues.push(...values);

    // Правый край
    for (let i = 0; i < halfWindow; i++) {
        paddedValues.push(values[values.length - 1]);
    }

    // Вычисляем скользящее среднее
    for (let i = 0; i < values.length; i++) {
        let sum = 0;
        for (let j = 0; j < window; j++) {
            sum += paddedValues[i + j];
        }
        result.push(sum / window);
    }

    return result;
}

/**
 * Определение сезонных паттернов
 */
function detectSeasonality(values, trend, period) {
    // Вычисляем сезонные отклонения
    const seasonalDeviations = [];
    for (let i = 0; i < values.length; i++) {
        if (trend[i] !== undefined) {
            seasonalDeviations.push(values[i] - trend[i]);
        } else {
            seasonalDeviations.push(0);
        }
    }

    // Группируем отклонения по позиции в сезонном периоде
    const seasonalIndices = Array(period).fill(0).map(() => []);
    for (let i = 0; i < seasonalDeviations.length; i++) {
        const seasonPos = i % period;
        seasonalIndices[seasonPos].push(seasonalDeviations[i]);
    }

    // Вычисляем средние отклонения для каждой позиции в периоде
    const seasonalPattern = seasonalIndices.map(deviations => {
        if (deviations.length === 0) return 0;
        return deviations.reduce((sum, val) => sum + val, 0) / deviations.length;
    });

    // Нормализуем сезонность, чтобы сумма была равна нулю
    const seasonalSum = seasonalPattern.reduce((sum, val) => sum + val, 0);
    const normalizedSeasonalPattern = seasonalPattern.map(val => val - seasonalSum / period);

    return normalizedSeasonalPattern;
}

/**
 * Вычисление автокорреляции временного ряда
 */
function calculateAutocorrelation(values, maxLag) {
    const result = [];
    const n = values.length;

    // Вычисляем среднее значение ряда
    const mean = values.reduce((sum, val) => sum + val, 0) / n;

    // Вычисляем дисперсию
    let variance = 0;
    for (let i = 0; i < n; i++) {
        variance += Math.pow(values[i] - mean, 2);
    }
    variance /= n;

    // Вычисляем автокорреляцию для каждого лага
    for (let lag = 0; lag <= maxLag; lag++) {
        let numerator = 0;
        for (let i = 0; i < n - lag; i++) {
            numerator += (values[i] - mean) * (values[i + lag] - mean);
        }
        numerator /= (n - lag);

        const correlation = numerator / variance;
        result.push(correlation);
    }

    return result;
}

/**
 * Генерация прогноза на основе декомпозиции временного ряда
 */
function generateForecast(decomposition, forecastDays) {
    const {dates, values, trend, seasonal, seasonalPeriod, residuals, autocorrelation} = decomposition;

    // Определяем конечные даты для прогноза
    const lastDate = new Date(dates[dates.length - 1]);
    const forecastDates = [];
    const actualValues = [...values];
    const forecastValues = [];

    // Определяем направление тренда
    let trendSlope = 0;
    if (trend.length >= 14) {
        // Используем линейную регрессию на последних двух неделях для определения тренда
        const recentTrend = trend.slice(-14);
        trendSlope = calculateTrendSlope(recentTrend);
    } else {
        // Если данных мало, используем простую разницу между последним и первым значением
        trendSlope = (trend[trend.length - 1] - trend[0]) / (trend.length - 1);
    }

    // Определяем среднюю волатильность остатков
    const avgResidualMagnitude = residuals.reduce((sum, val) => sum + Math.abs(val), 0) / residuals.length;

    // Выявляем недельный паттерн покупок
    const dayOfWeekPattern = identifyDayOfWeekPattern(dates, values);

    // Создаем даты для прогноза
    for (let i = 1; i <= forecastDays; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + i);
        forecastDates.push(nextDate.toISOString().split('T')[0]);
    }

    // Генерируем значения прогноза
    for (let i = 0; i < forecastDays; i++) {
        // Базовый тренд (последнее значение тренда + прогнозируемый рост)
        const lastTrendValue = trend[trend.length - 1];
        const forecastTrend = lastTrendValue + trendSlope * (i + 1);

        // Сезонная составляющая
        const seasonalIndex = (values.length + i) % seasonalPeriod;
        const seasonalComponent = seasonal[seasonalIndex];

        // Корректировка по дню недели
        const forecastDate = new Date(forecastDates[i]);
        const dayOfWeek = forecastDate.getDay();
        const dayAdjustment = dayOfWeekPattern[dayOfWeek];

        // Случайная компонента (с затухающим влиянием автокорреляции)
        let randomComponent = 0;
        if (i < 14) {
            // Учитываем автокорреляцию для ближайших периодов прогноза
            for (let lag = 1; lag <= Math.min(14, i + 1); lag++) {
                if (i - lag >= 0 && autocorrelation[lag] && Math.abs(autocorrelation[lag]) > 0.2) {
                    // Фактор затухания автокорреляции со временем
                    const decayFactor = Math.pow(0.9, lag);
                    randomComponent += (forecastValues[i - lag] - (lastTrendValue + trendSlope * (i - lag + 1)) - seasonal[(values.length + i - lag) % seasonalPeriod]) * autocorrelation[lag] * decayFactor;
                }
            }
        }

        // Добавляем немного случайного шума, уменьшающегося с расстоянием
        const noiseFactor = Math.pow(0.98, i); // Шум уменьшается с каждым шагом прогноза
        const noise = (Math.random() - 0.5) * 2 * avgResidualMagnitude * noiseFactor;

        // Суммируем все компоненты
        const forecastValue = Math.max(0, forecastTrend + seasonalComponent + dayAdjustment + randomComponent + noise);
        forecastValues.push(forecastValue);
    }

    // Расчет доверительных интервалов
    const confidenceLower = [];
    const confidenceUpper = [];

    for (let i = 0; i < forecastDays; i++) {
        // Расширяем доверительный интервал с увеличением горизонта прогноза
        const confidenceWidth = avgResidualMagnitude * (1 + i / 30);
        confidenceLower.push(Math.max(0, forecastValues[i] - confidenceWidth * 2));
        confidenceUpper.push(forecastValues[i] + confidenceWidth * 2);
    }

    // Заполняем нулями массивы для отображения на графике
    const nullArray = Array(values.length).fill(null);
    const extendedForecastValues = [...nullArray, ...forecastValues];
    const extendedConfidenceLower = [...nullArray, ...confidenceLower];
    const extendedConfidenceUpper = [...nullArray, ...confidenceUpper];

    // Формируем объект с результатами
    return {
        labels: [...dates, ...forecastDates],
        actualValues: [...actualValues, ...Array(forecastDays).fill(null)],
        forecastValues: extendedForecastValues,
        confidenceLower: extendedConfidenceLower,
        confidenceUpper: extendedConfidenceUpper,
        trendSlope,
        seasonalPattern: seasonal,
        dayOfWeekPattern
    };
}

/**
 * Расчет наклона тренда с помощью линейной регрессии
 */
function calculateTrendSlope(trendValues) {
    const n = trendValues.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += trendValues[i];
        sumXY += i * trendValues[i];
        sumX2 += i * i;
    }

    // Расчет коэффициента наклона линейной регрессии
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
}

/**
 * Выявление паттернов продаж по дням недели
 */
function identifyDayOfWeekPattern(dates, values) {
    // Инициализация массивов для подсчета отклонений по дням недели
    const dayDeviations = Array(7).fill(0).map(() => []);

    // Получаем отклонения от тренда для каждого дня недели
    for (let i = 0; i < dates.length; i++) {
        const date = new Date(dates[i]);
        const dayOfWeek = date.getDay(); // 0 - Воскресенье, 1 - Понедельник, ...

        // Определяем соседние дни для вычисления локального тренда
        const neighbors = [];
        for (let j = Math.max(0, i - 3); j <= Math.min(values.length - 1, i + 3); j++) {
            if (j !== i) {
                neighbors.push(values[j]);
            }
        }

        if (neighbors.length > 0) {
            const avgNeighbors = neighbors.reduce((sum, val) => sum + val, 0) / neighbors.length;
            dayDeviations[dayOfWeek].push(values[i] - avgNeighbors);
        }
    }

    // Вычисляем средние отклонения для каждого дня недели
    const dayOfWeekPattern = dayDeviations.map(deviations => {
        if (deviations.length === 0) return 0;
        return deviations.reduce((sum, val) => sum + val, 0) / deviations.length;
    });

    return dayOfWeekPattern;
}

/**
 * Обновленная функция для создания графика прогноза продаж
 */
function createForecastChart(forecastData, days) {
    // Сохраняем данные в кэш
    cachedForecastData = forecastData;

    // Фильтруем данные по выбранному количеству дней
    const filteredData = {
        labels: forecastData.labels.slice(0, forecastData.actualValues.length + days),
        actualValues: forecastData.actualValues.slice(0, forecastData.actualValues.length + days),
        forecastValues: forecastData.forecastValues.slice(0, forecastData.actualValues.length + days),
        confidenceLower: forecastData.confidenceLower.slice(0, forecastData.actualValues.length + days),
        confidenceUpper: forecastData.confidenceUpper.slice(0, forecastData.actualValues.length + days)
    };

    // Получаем canvas элемент
    const canvas = document.getElementById('forecastChart');
    if (!canvas) {
        console.error('Canvas элемент для прогноза не найден');
        return;
    }

    // Получаем контекст для рисования
    const ctx = canvas.getContext('2d');

    // Уничтожаем предыдущий график, если он существует
    if (typeof window.forecastChart !== 'undefined' &&
        window.forecastChart &&
        typeof window.forecastChart.destroy === 'function') {
        window.forecastChart.destroy();
    }

    // Создаем новый график
    window.forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: filteredData.labels,
            datasets: [
                {
                    label: 'Фактические продажи',
                    data: filteredData.actualValues,
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(33, 150, 243, 1)',
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Прогноз',
                    data: filteredData.forecastValues,
                    backgroundColor: 'rgba(156, 39, 176, 0.2)',
                    borderColor: 'rgba(156, 39, 176, 1)',
                    borderWidth: 2,
                    pointRadius: 2,
                    pointBackgroundColor: 'rgba(156, 39, 176, 1)',
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Нижняя граница',
                    data: filteredData.confidenceLower,
                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    borderColor: 'rgba(156, 39, 176, 0.5)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.3,
                    fill: '+1'
                },
                {
                    label: 'Верхняя граница',
                    data: filteredData.confidenceUpper,
                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    borderColor: 'rgba(156, 39, 176, 0.5)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.3,
                    fill: false
                }
            ]
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
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ₽' + context.raw.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Обновляем рекомендации на основе результатов прогноза
    generateEnhancedRecommendations(forecastData);
}

/**
 * Расширенные рекомендации на основе результатов прогноза
 */
function generateEnhancedRecommendations(forecastData) {
    const recommendationElement = document.getElementById('forecastRecommendation');
    if (!recommendationElement) return;

    // Анализ тренда продаж
    const trendSlope = forecastData.trendSlope;
    const growthRate = trendSlope * 30 / (forecastData.actualValues.filter(v => v !== null).reduce((sum, val) => sum + val, 0) / forecastData.actualValues.filter(v => v !== null).length) * 100;

    // Анализ недельного паттерна
    const dayOfWeekPattern = forecastData.dayOfWeekPattern;
    const maxDayIndex = dayOfWeekPattern.indexOf(Math.max(...dayOfWeekPattern));
    const minDayIndex = dayOfWeekPattern.indexOf(Math.min(...dayOfWeekPattern));

    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const bestDay = dayNames[maxDayIndex];
    const worstDay = dayNames[minDayIndex];

    // Формирование рекомендаций
    let recommendation = '';
    let inventoryStrategy = '';
    let pricingStrategy = '';
    let marketingStrategy = '';

    // Рекомендации по тренду
    if (growthRate > 10) {
        recommendation = 'Ожидается значительный рост продаж (' + growthRate.toFixed(1) + '% в месяц).';
        inventoryStrategy = 'Увеличьте запасы популярных товаров категории A на 15-20%.';
        pricingStrategy = 'Возможно постепенное повышение цен на 3-5% для товаров с высоким спросом.';
        marketingStrategy = 'Сфокусируйтесь на удержании клиентов и повышении среднего чека.';
    } else if (growthRate > 3) {
        recommendation = 'Прогнозируется умеренный рост продаж (' + growthRate.toFixed(1) + '% в месяц).';
        inventoryStrategy = 'Поддерживайте оптимальный уровень запасов, слегка увеличив категории A и B.';
        pricingStrategy = 'Сохраняйте текущий уровень цен, возможны точечные повышения на 1-2%.';
        marketingStrategy = 'Балансируйте между привлечением новых клиентов и работой с постоянными.';
    } else if (growthRate >= -3) {
        recommendation = 'Продажи прогнозируются на стабильном уровне (' + growthRate.toFixed(1) + '% в месяц).';
        inventoryStrategy = 'Оптимизируйте ассортимент, сократив товары категории C на 10-15%.';
        pricingStrategy = 'Рассмотрите акции для увеличения оборота низколиквидных товаров.';
        marketingStrategy = 'Повышайте эффективность маркетинга с акцентом на лояльность клиентов.';
    } else if (growthRate >= -10) {
        recommendation = 'Прогнозируется небольшое снижение продаж (' + growthRate.toFixed(1) + '% в месяц).';
        inventoryStrategy = 'Сократите закупки на 5-10%, особенно в категории C.';
        pricingStrategy = 'Проведите временные акции для стимулирования спроса.';
        marketingStrategy = 'Усильте активности по удержанию существующих клиентов.';
    } else {
        recommendation = 'Прогнозируется значительное снижение продаж (' + growthRate.toFixed(1) + '% в месяц).';
        inventoryStrategy = 'Минимизируйте закупки, распродайте излишки товаров категории C.';
        pricingStrategy = 'Рассмотрите временное снижение цен на 5-10% для стимулирования спроса.';
        marketingStrategy = 'Проведите анализ конкурентов и пересмотрите маркетинговую стратегию.';
    }

    // Добавляем рекомендации по дням недели
    const weekdayRecommendation = `Лучший день для продаж: ${bestDay}, худший: ${worstDay}. `;
    const staffingRecommendation = `Рекомендуется увеличить персонал в ${bestDay} и оптимизировать в ${worstDay}.`;

// Формируем итоговую рекомендацию
    const fullRecommendation = `${recommendation} ${weekdayRecommendation}
<br><br>
<b>Управление запасами:</b> ${inventoryStrategy}<br>
<b>Ценовая политика:</b> ${pricingStrategy}<br>
<b>Маркетинг:</b> ${marketingStrategy}<br>
<b>Управление персоналом:</b> ${staffingRecommendation}`;

    recommendationElement.innerHTML = fullRecommendation;
}

/**
 * Интеграция улучшенного прогноза с существующей функцией fetchAnalyticsData
 */
async function fetchAnalyticsData(startDate, endDate) {
    try {
        // Получаем транзакции продаж (доходы)
        const salesResponse = await fetch(`${API_BASE_URL}/get_transactions_by_type/1`);
        let salesTransactions = [];
        if (salesResponse.ok) {
            salesTransactions = await salesResponse.json();
        }

        // Получаем транзакции закупок (расходы)
        const purchasesResponse = await fetch(`${API_BASE_URL}/get_transactions_by_type/2`);
        let purchaseTransactions = [];
        if (purchasesResponse.ok) {
            purchaseTransactions = await purchasesResponse.json();
        }

        // Получаем транзакции списаний
        const writeoffsResponse = await fetch(`${API_BASE_URL}/get_transactions_by_type/3`);
        let writeoffTransactions = [];
        if (writeoffsResponse.ok) {
            writeoffTransactions = await writeoffsResponse.json();
        }

        // Получение всех товаров
        const productsResponse = await fetch(`${API_BASE_URL}/get_product_all`);
        let products = [];
        if (productsResponse.ok) {
            products = await productsResponse.json();
        }

        // Получение всех категорий
        const categoriesResponse = await fetch(`${API_BASE_URL}/get_categories`);
        let categories = [];
        if (categoriesResponse.ok) {
            categories = await categoriesResponse.json();
        }

        // Функция для получения детальной информации о закупке
        const getPurchaseDetails = async (purchaseId) => {
            try {
                const response = await fetch(`${API_BASE_URL}/get_purchase_by_id/${purchaseId}`);
                if (response.ok) {
                    return await response.json();
                }
            } catch (e) {
                console.warn(`Не удалось получить детали закупки ${purchaseId}`);
            }
            return null;
        };

        // Фильтрация по датам
        const filterByDateRange = (transactions) => {
            return transactions.filter(transaction => {
                const transactionDate = new Date(transaction.created_on);
                return transactionDate >= new Date(startDate) &&
                    transactionDate <= new Date(endDate + 'T23:59:59');
            });
        };

        // Фильтруем транзакции по выбранному диапазону дат
        const filteredSales = filterByDateRange(salesTransactions);
        const filteredPurchases = filterByDateRange(purchaseTransactions);
        const filteredWriteoffs = filterByDateRange(writeoffTransactions);

        // Инициализируем массив для обогащенных данных о продажах
        const enrichedSales = [];

        // Обогащаем данные о транзакциях информацией о товарах и закупках
        for (const sale of filteredSales) {
            const purchase = await getPurchaseDetails(sale.id_purchase);
            if (purchase) {
                const product = products.find(p => p.id === purchase.id_product);
                const category = product ? categories.find(c => c.id === product.id_category) : null;

                enrichedSales.push({
                    ...sale,
                    purchase,
                    product,
                    category,
                    revenue: purchase.selling_price * sale.amount,
                    cost: purchase.purchase_price * sale.amount,
                    profit: (purchase.selling_price - purchase.purchase_price) * sale.amount,
                    margin: ((purchase.selling_price - purchase.purchase_price) / purchase.selling_price * 100).toFixed(2)
                });
            }
        }

        // Расчет KPI
        const totalRevenue = enrichedSales.reduce((sum, sale) => sum + sale.revenue, 0);
        const totalCost = enrichedSales.reduce((sum, sale) => sum + sale.cost, 0);
        const totalProfit = enrichedSales.reduce((sum, sale) => sum + sale.profit, 0);
        const averageMargin = enrichedSales.length > 0 ?
            enrichedSales.reduce((sum, sale) => sum + parseFloat(sale.margin), 0) / enrichedSales.length : 0;

        // Формирование данных по доходам/расходам по дням
        const revenueByDay = {};
        const expensesByDay = {};
        const profitByDay = {};

        // Группировка данных о продажах по дням
        enrichedSales.forEach(sale => {
            const date = sale.created_on.split('T')[0];

            if (!revenueByDay[date]) revenueByDay[date] = 0;
            if (!expensesByDay[date]) expensesByDay[date] = 0;
            if (!profitByDay[date]) profitByDay[date] = 0;

            revenueByDay[date] += sale.revenue;
            expensesByDay[date] += sale.cost;
            profitByDay[date] += sale.profit;
        });

        // Данные по продажам в разрезе категорий
        const salesByCategory = {};
        enrichedSales.forEach(sale => {
            const categoryName = sale.category ? sale.category.name : 'Без категории';

            if (!salesByCategory[categoryName]) {
                salesByCategory[categoryName] = {
                    revenue: 0,
                    profit: 0,
                    count: 0
                };
            }

            salesByCategory[categoryName].revenue += sale.revenue;
            salesByCategory[categoryName].profit += sale.profit;
            salesByCategory[categoryName].count += sale.amount;
        });

        // Данные о продуктах для ABC-анализа и топ товаров
        const productSales = {};
        enrichedSales.forEach(sale => {
            const productId = sale.product ? sale.product.id : null;
            if (!productId) return;

            if (!productSales[productId]) {
                productSales[productId] = {
                    id: productId,
                    name: sale.product.name,
                    revenue: 0,
                    profit: 0,
                    quantity: 0,
                    margin: 0
                };
            }

            productSales[productId].revenue += sale.revenue;
            productSales[productId].profit += sale.profit;
            productSales[productId].quantity += sale.amount;
        });

        // Рассчитываем маржу для каждого продукта
        Object.values(productSales).forEach(product => {
            product.margin = product.revenue > 0 ? (product.profit / product.revenue * 100) : 0;
        });

        // ABC-анализ
        const abcAnalysis = calculateABCAnalysis(Object.values(productSales));

        // Сортированный массив товаров для топ-10
        const topProductsByProfit = Object.values(productSales)
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 10);

        const topProductsBySales = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        const topProductsByMargin = Object.values(productSales)
            .sort((a, b) => b.margin - a.margin)
            .filter(p => p.quantity > 0) // Отфильтровываем товары без продаж
            .slice(0, 10);

        // Данные для прогноза
        const forecastData = generateImprovedForecastData(revenueByDay, 90); // Прогноз на 90 дней

        // Активные товары (с продажами в выбранном периоде)
        const activeProductsCount = Object.keys(productSales).length;

        // Средний чек
        const transactionCount = enrichedSales.length;
        const averageCheck = transactionCount > 0 ? totalRevenue / transactionCount : 0;

        // Оборачиваемость запасов (упрощенно)
        const stockTurnover = totalCost > 0 ? totalRevenue / totalCost : 0;

        // Формируем итоговый объект аналитических данных
        return {
            kpi: {
                totalRevenue,
                totalCost,
                totalProfit,
                averageMargin,
                activeProductsCount,
                averageCheck,
                stockTurnover,
                transactionCount
            },
            revenueByDay,
            expensesByDay,
            profitByDay,
            salesByCategory,
            productSales,
            abcAnalysis,
            topProducts: {
                byProfit: topProductsByProfit,
                bySales: topProductsBySales,
                byMargin: topProductsByMargin
            },
            forecastData
        };
    } catch (error) {
        console.error('Ошибка при получении аналитических данных:', error);
        throw error;
    }
}

/**
 * Расширенная версия функции для отображения аналитических данных
 */
function displayAnalyticsData(data) {
    if (!data) {
        console.error('Получены пустые аналитические данные');
        return;
    }

    // Обновляем KPI карточки
    if (data.kpi) {
        updateKPICards(data.kpi);
    }

    // Создаем графики, не изменяя структуру DOM
    try {
        if (data.revenueByDay && data.expensesByDay) {
            cachedRevenueData = data.revenueByDay;
            cachedExpensesData = data.expensesByDay;
            createRevenueExpensesChart(data.revenueByDay, data.expensesByDay, revexpPeriod);
        }

        if (data.kpi) {
            createProfitStructureChart(data.kpi);
        }

        if (data.profitByDay) {
            cachedProfitData = data.profitByDay;
            createNetProfitChart(data.profitByDay, profitPeriod);
        }

        if (data.salesByCategory) {
            cachedCategorySalesData = data.salesByCategory;
            createCategorySalesChart(data.salesByCategory);
        }

        if (data.topProducts) {
            cachedTopProductsData = data.topProducts;
            createTopProductsChart(data.topProducts, topProductsSort);
        }

        if (data.abcAnalysis) {
            cachedABCAnalysis = data.abcAnalysis;
            createABCPieChart(data.abcAnalysis);
            updateABCAnalysisTable(data.abcAnalysis);
        }

        if (data.forecastData) {
            cachedForecastData = data.forecastData;
            createForecastChart(data.forecastData, forecastDays);

            // Отображаем дополнительные метрики прогноза в отдельной панели
            if (document.getElementById('forecast-metrics')) {
                displayForecastMetrics(data.forecastData);
            } else {
                // Создаем панель метрик прогноза, если она не существует
                createForecastMetricsPanel(data.forecastData);
            }
        }
    } catch (error) {
        console.error('Ошибка при отображении данных:', error);
    }
}

/**
 * Создание панели с дополнительными метриками прогноза
 */
function createForecastMetricsPanel(forecastData) {
    const forecastCard = document.getElementById('forecastChart').closest('.card');
    if (!forecastCard) return;

    // Создаем элемент для метрик после основного графика
    const metricsPanel = document.createElement('div');
    metricsPanel.id = 'forecast-metrics';
    metricsPanel.className = 'mt-3 p-3 border rounded bg-light';

    // Добавляем заголовок
    const title = document.createElement('h6');
    title.className = 'mb-3';
    title.textContent = 'Дополнительные показатели прогноза';
    metricsPanel.appendChild(title);

    // Создаем содержимое для метрик
    metricsPanel.innerHTML += `<div class="row" id="forecast-metrics-content"></div>`;

    // Добавляем панель после графика но перед footer
    const cardFooter = forecastCard.querySelector('.card-footer');
    if (cardFooter) {
        forecastCard.insertBefore(metricsPanel, cardFooter);
    } else {
        forecastCard.querySelector('.card-body').appendChild(metricsPanel);
    }

    // Заполняем метриками
    displayForecastMetrics(forecastData);
}

/**
 * Отображение дополнительных метрик прогноза
 */
function displayForecastMetrics(forecastData) {
    const metricsContent = document.getElementById('forecast-metrics-content');
    if (!metricsContent) return;

    // Расчет метрик
    // 1. Средний прогнозируемый объем продаж
    const forecastValues = forecastData.forecastValues.filter(v => v !== null);
    const avgForecast = forecastValues.reduce((sum, val) => sum + val, 0) / forecastValues.length;

    // 2. Прогнозируемый месячный объем
    const nextMonthForecast = forecastValues.slice(0, 30).reduce((sum, val) => sum + val, 0);

    // 3. День недели с максимальными продажами
    const dayOfWeekPattern = forecastData.dayOfWeekPattern || [0, 0, 0, 0, 0, 0, 0];
    const maxDayIndex = dayOfWeekPattern.indexOf(Math.max(...dayOfWeekPattern));
    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const bestDay = dayNames[maxDayIndex];

    // Отображаем метрики (без сезонного отклонения)
    metricsContent.innerHTML = `
        <div class="col-md-4">
            <div class="metric">
                <div class="metric-title">Средний дневной прогноз</div>
                <div class="metric-value">₽${Math.round(avgForecast).toLocaleString()}</div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="metric">
                <div class="metric-title">Прогноз на 30 дней</div>
                <div class="metric-value">₽${Math.round(nextMonthForecast).toLocaleString()}</div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="metric">
                <div class="metric-title">Лучший день продаж</div>
                <div class="metric-value">${bestDay}</div>
            </div>
        </div>
    `;
    if (!document.getElementById('forecast-metrics-style')) {
        const style = document.createElement('style');
        style.id = 'forecast-metrics-style';
        style.textContent = `
            .metric {
                text-align: center;
                padding: 10px;
            }
            .metric-title {
                font-size: 0.8rem;
                color: #6c757d;
                margin-bottom: 5px;
            }
            .metric-value {
                font-size: 1.1rem;
                font-weight: 600;
                color: #212529;
            }
        `;
        document.head.appendChild(style);
    }
}

// Форматирование даты для отображения
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

// Форматирование даты для input type="date"
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// Получение названия месяца
function getMonthName(monthIndex) {
    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[monthIndex];
}

// Обеспечиваем наличие canvas элементов
function ensureCanvasElements() {
    const canvasIds = [
        'revenueExpensesChart',
        'profitStructureChart',
        'netProfitChart',
        'categorySalesChart',
        'topProductsChart',
        'abcPieChart',
        'forecastChart'
    ];

    canvasIds.forEach(id => {
        // Находим контейнер для canvas
        const containerSelector = `.card-body:has(#${id})`;
        const containerSelector2 = `.card-body`;

        let container = document.querySelector(containerSelector);

        // Если не можем найти контейнер с помощью :has (может не поддерживаться в старых браузерах)
        if (!container) {
            // Находим все .card-body и ищем подходящий
            const allContainers = document.querySelectorAll(containerSelector2);
            for (const cont of allContainers) {
                if (cont.querySelector(`#${id}`) || (!cont.children.length && !container)) {
                    container = cont;
                    break;
                }
            }
        }

        // Если нашли контейнер и в нём ещё нет canvas
        if (container && !document.getElementById(id)) {
            const canvas = document.createElement('canvas');
            canvas.id = id;
            container.innerHTML = ''; // Очищаем контейнер от спиннеров и сообщений об ошибке
            container.appendChild(canvas);
            console.log(`Создан canvas с id ${id}`);
        }
    });
}
