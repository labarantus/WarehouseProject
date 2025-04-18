// API URL base
const API_BASE_URL = '/api';

document.addEventListener('DOMContentLoaded', function() {
    // Password toggle functionality for password field
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

    // Password toggle functionality for confirm password field
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPassword = document.getElementById('confirmPasswordInput');

    toggleConfirmPassword.addEventListener('click', function() {
        // Toggle the password visibility
        const type = confirmPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPassword.setAttribute('type', type);

        // Toggle the icon
        this.classList.toggle('bi-eye');
        this.classList.toggle('bi-eye-slash');
    });

    // Register form submission
    const registerForm = document.getElementById('registerForm');

    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const login = document.getElementById('loginInput').value;
        const password = document.getElementById('passwordInput').value;
        const confirmPassword = document.getElementById('confirmPasswordInput').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            showError('Пароли не совпадают!');
            return;
        }

        // Show spinner and disable button
        const registerButton = document.getElementById('registerButton');
        const registerButtonText = document.getElementById('registerButtonText');
        const registerSpinner = document.getElementById('registerSpinner');

        registerButton.disabled = true;
        registerSpinner.classList.remove('d-none');
        registerButtonText.textContent = 'Регистрация...';

        try {
            // Check if user already exists - modified to handle 404 correctly
            try {
                const checkResponse = await fetch(`${API_BASE_URL}/get_user_by_login/${login}`);

                // User exists if status is 200 OK
                if (checkResponse.ok) {
                    const userData = await checkResponse.json();
                    // Additional check to make sure we have valid user data
                    if (userData && userData.login) {
                        showError('Пользователь с таким логином уже существует!');
                        return;
                    }
                }
            } catch (checkError) {
                // For this endpoint, an error might mean the user doesn't exist
                // We'll continue with registration
                console.log('User check error (expected if user does not exist):', checkError);
            }

            // Create new user (default role id for regular users is 2)
            const userData = {
                login: login,
                password: password,
                id_role: 2 // Regular user role
            };

            const registerResponse = await fetch(`${API_BASE_URL}/create_user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (registerResponse.status === 201) {
                // Registration successful
                showSuccess();

                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                // Try to get detailed error message
                try {
                    const errorData = await registerResponse.json();
                    showError(`Ошибка регистрации: ${errorData.detail || 'Неизвестная ошибка'}`);
                } catch (e) {
                    showError(`Ошибка регистрации. Код: ${registerResponse.status}`);
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            showError('Ошибка при регистрации. Пожалуйста, попробуйте позже.');
        } finally {
            // Reset button state
            registerButton.disabled = false;
            registerSpinner.classList.add('d-none');
            registerButtonText.textContent = 'Зарегистрироваться';
        }
    });

    function showError(message) {
        const errorElement = document.getElementById('registerError');
        errorElement.textContent = message;
        errorElement.style.display = 'block';

        // Hide error after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }

    function showSuccess() {
        document.getElementById('registerSuccess').style.display = 'block';
        document.getElementById('registerForm').reset();
    }
});