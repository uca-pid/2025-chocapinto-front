// --- LOGIN ---
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        login(username, password);
    });
}

async function login(username, password) {
    try {
        const response = await fetch("http://127.0.0.1:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem("username", username);
            localStorage.setItem("role", result.role);
            window.location.href = "main.html";
        } else {
            alert(result.message || "Usuario o contraseña incorrectos");
        }
    } catch (error) {
        console.error("Error en login:", error);
        alert("Error de conexión con el servidor");
    }
}

// --- REGISTRO ---
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;

        try {
            const response = await fetch("http://127.0.0.1:5000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, role })
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                window.location.href = "login.html";
            } else {
                document.getElementById("message").innerText = result.message || "Error en el registro";
            }
        } catch (error) {
            console.error("Error en registro:", error);
            document.getElementById("message").innerText = "Error de conexión con el servidor";
        }
    });
}

// --- MOSTRAR NOMBRE EN MAIN.HTML ---
document.addEventListener("DOMContentLoaded", () => {
    const username = localStorage.getItem("username");
    const usernameSpan = document.getElementById("usernameDisplay");
    if (username && usernameSpan) {
        usernameSpan.textContent = username;
    }
});

// --- LOGOUT ---
function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    window.location.href = "login.html";
}
