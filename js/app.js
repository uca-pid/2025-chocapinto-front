// --- LOGIN ---
// async function login(username, password) {
//     try {
//         const response = await fetch("http://127.0.0.1:5000/login", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ username, password })
//         });

//         const result = await response.json();

//         if (result.success) {
//             localStorage.setItem("username", username);
//             localStorage.setItem("role", result.role);
//             window.location.href = "main.html"; // redirige al main
//         } else {
//             alert("Usuario o contraseña incorrectos");
//         }
//     } catch (error) {
//         console.error("Error en login:", error);
//     }
// }

// Evento submit del login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        // Para debug: mostrar usuario y contraseña en consola
        console.log("Iniciando sesión:");
        console.log("Username:", username);
        console.log("Password:", password);

        // Llamada al backend
        login(username, password);
    });
}

// Función de login
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
            console.log("Sesión iniciada correctamente:", username, result.role);
            window.location.href = "main.html";
        } else {
            alert("Usuario o contraseña incorrectos");
        }
    } catch (error) {
        console.error("Error en login:", error);
    }
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
