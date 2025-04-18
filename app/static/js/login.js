// API URL base
const API_BASE_URL = '/api';

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const token = sessionStorage.getItem('warehouseAuthToken');
    const userLogin = sessionStorage.getItem('warehouseUserLogin');

    if (token && userLogin) {
        // User is already logged in, redirect to inventory
        window.location.href = '/inventory';
        return;
    }

    // Password toggle functionality
    const togglePassword = document.getElementById('togglePassword');
    const password = document.getElementById('passwordInput');

    togglePassword.addEventListener('click', function() {
        // Toggle the password visibility
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);

        // Toggle the icon
        this.classList.toggle('bi-eye');
        this.classList.toggle('bi-eye-slash');
    });

    // Login form submission
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const login = document.getElementById('loginInput').value;
        const password = document.getElementById('passwordInput').value;

        // Show spinner and disable button
        const loginButton = document.getElementById('loginButton');
        const loginButtonText = document.getElementById('loginButtonText');
        const loginSpinner = document.getElementById('loginSpinner');

        loginButton.disabled = true;
        loginSpinner.classList.remove('d-none');
        loginButtonText.textContent = 'Выполняется вход...';

        try {
            // Authenticate user
            // First, get user by login
            const userResponse = await fetch(`${API_BASE_URL}/get_user_by_login/${login}`);

            if (!userResponse.ok) {
                // User not found
                showLoginError('Пользователь не найден');
                return;
            }

            const userData = await userResponse.json();

            // In a real application, we would verify the password on the server
            // For demo, we'll validate user existence and use a separate authentication endpoint

            // Create auth data
            const authData = {
                login: login,
                password: password
            };

            // Send authentication request
            const authResponse = await fetch(`${API_BASE_URL}/authenticate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(authData)
            });

            if (authResponse.ok) {
                // Authentication successful
                const authResult = await authResponse.json();

                // Store auth info in session storage
                sessionStorage.setItem('warehouseAuthToken', authResult.token);
                sessionStorage.setItem('warehouseUserLogin', login);
                sessionStorage.setItem('warehouseUserRole', userData.id_role);

                // If "remember me" is checked, store in local storage too
                if (document.getElementById('rememberMe').checked) {
                    localStorage.setItem('warehouseAuthToken', authResult.token);
                    localStorage.setItem('warehouseUserLogin', login);
                    localStorage.setItem('warehouseUserRole', userData.id_role);
                }

                // Redirect to inventory page
                window.location.href = '/inventory';
            } else {
                // Authentication failed
                const errorData = await authResponse.json();
                showLoginError(errorData.detail || 'Неверный логин или пароль');
            }
        } catch (error) {
            console.error('Login error:', error);
            // Fallback simplified auth for testing without auth endpoint
            // DO NOT USE IN PRODUCTION - this is just for demo
            try {
                const userResponse = await fetch(`${API_BASE_URL}/get_user_by_login/${login}`);
                if (userResponse.ok) {
                    const userData = await userResponse.json();

                    // Generate a simple demo token
                    const demoToken = btoa(`${login}:${Date.now()}`);

                    // Store auth info in session storage
                    sessionStorage.setItem('warehouseAuthToken', demoToken);
                    sessionStorage.setItem('warehouseUserLogin', login);
                    sessionStorage.setItem('warehouseUserRole', userData.id_role);

                    // If "remember me" is checked, store in local storage too
                    if (document.getElementById('rememberMe').checked) {
                        localStorage.setItem('warehouseAuthToken', demoToken);
                        localStorage.setItem('warehouseUserLogin', login);
                        localStorage.setItem('warehouseUserRole', userData.id_role);
                    }

                    // Redirect to inventory page
                    window.location.href = '/inventory';
                } else {
                    showLoginError('Пользователь не найден');
                }
            } catch (fallbackError) {
                showLoginError('Ошибка при входе в систему');
            }
        } finally {
            // Reset button state
            loginButton.disabled = false;
            loginSpinner.classList.add('d-none');
            loginButtonText.textContent = 'Войти';
        }
    });

    function showLoginError(message) {
        const errorElement = document.getElementById('loginError');
        errorElement.textContent = message || 'Неверный логин или пароль. Пожалуйста, попробуйте еще раз.';
        errorElement.style.display = 'block';

        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
    }
});