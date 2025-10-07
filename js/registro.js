import { API_URL } from "./env.js"; // Express + Prisma (tu server.js)
import { showNotification } from "../componentes/notificacion.js";


const registerForm = document.getElementById("registerForm");
if (registerForm) {

  
   
   

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
    const username = document.getElementById("reg-username").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const passwordRepeat = document.getElementById("reg-password-repeat").value;
        const passwordMsg = document.getElementById("registerPasswordMsg");
        passwordMsg.style.display = "none";

        // Validación: mínimo 8 caracteres y una mayúscula
        const minLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        if (!minLength || !hasUpper) {
            showNotification("error", "La contraseña debe tener al menos 8 caracteres y una mayúscula.");
            return;
        }
        if (password !== passwordRepeat) {
            showNotification("error", "Las contraseñas no coinciden.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });
            const result = await response.json();
            if (result.success) {
                showNotification("success", result.message || "¡Usuario creado exitosamente!");
            } else {
                showNotification("error", result.message || "Error en el registro");
            }
        } catch (error) {
            
            showNotification("error", "Error de conexión con el servidor");
        }
    });
}