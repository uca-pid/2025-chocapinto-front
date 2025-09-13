const API_URL = "http://127.0.0.1:5000"; // Flask local

    document.getElementById("loginForm").addEventListener("submit", async function(e) {
        e.preventDefault(); // evita que recargue la página

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            const data = await res.json();
            console.log(data);

            // Guardar el usuario en localStorage (para usarlo en main.html)
            localStorage.setItem("username", username);
            localStorage.setItem("role", data.role);

            // Redirigir al main
            window.location.href = "main.html";
        } else {
            document.getElementById("errorMsg").style.display = "block";
        }
    });


// --- REGISTRO ---


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
    
    window.location.href = "login.html";
}
