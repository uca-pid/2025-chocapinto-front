// 2025-chocapinto-front/js/app.js
import { API_URL } from "./env.js";

let isLoggingIn = false;

document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    if (isLoggingIn) return;
    isLoggingIn = true;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';
    submitBtn.style.cursor = 'not-allowed';
    submitBtn.textContent = 'Iniciando sesión...';
    
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            const data = await res.json();

            // Guardar el JWT token
            localStorage.setItem("token", data.token);  // ← NUEVO
            localStorage.setItem("username", username);
            localStorage.setItem("role", data.role);
            localStorage.setItem("userId", data.id);

            submitBtn.textContent = '✓ Redirigiendo...';
            window.location.href = "main.html";
        } else {
            const errorData = await res.json();
            const errorMsg = document.getElementById("errorMsg");
            errorMsg.textContent = errorData.message || "Credenciales inválidas";
            errorMsg.style.display = "block";
            
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            submitBtn.textContent = originalText;
            isLoggingIn = false;
        }
    } catch (error) {
        document.getElementById("errorMsg").textContent = "Error de conexión con el servidor";
        document.getElementById("errorMsg").style.display = "block";
        
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        submitBtn.textContent = originalText;
        isLoggingIn = false;
    }
});