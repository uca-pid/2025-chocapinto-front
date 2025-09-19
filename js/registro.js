const API_URL = "http://127.0.0.1:5000"; // Express + Prisma (tu server.js)

const registerForm = document.getElementById("registerForm");
if (registerForm) {
    // Modal helpers
    function showModalError(msg) {
        const modal = document.getElementById("modalError");
        const modalMsg = document.getElementById("modalErrorMsg");
        modalMsg.textContent = msg;
        modal.style.display = "flex";
    }
    document.getElementById("closeModalError").onclick = function() {
        document.getElementById("modalError").style.display = "none";
    };

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
            showModalError("La contraseña debe tener al menos 8 caracteres y una mayúscula.");
            return;
        }
        if (password !== passwordRepeat) {
            showModalError("Las contraseñas no coinciden.");
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
                alert(result.message);
                window.location.href = '../html/login.html';
            } else {
                showModalError(result.message || "Error en el registro");
            }
        } catch (error) {
            console.error("Error en registro:", error);
            showModalError("Error de conexión con el servidor");
        }
    });
}