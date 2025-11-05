import { API_URL } from "./env.js";

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
            if (data.id) {
                localStorage.setItem("userId", data.id);
            }

            // Redirigir al main
            window.location.href = "/html/main.html";
        } else {
            document.getElementById("errorMsg").style.display = "block";
        }
    });
