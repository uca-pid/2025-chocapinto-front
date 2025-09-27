const API_URL = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", () => {
    const currentUsername = localStorage.getItem("username");
    if (!currentUsername) {
        window.location.href = "index.html";
        return;
    }
    document.getElementById("username").value = currentUsername;
    // Obtener email actual del backend
   
    fetch(`${API_URL}/user/${currentUsername}`)
        .then(res => res.json())
        .then(data => {
            console.log(data);
            if (data.success && data.user.email) {
                document.getElementById("email").value = data.user.email;
            } else {
                document.getElementById("email").value = "";
            }
        })
        .catch(() => {
            document.getElementById("email").value = "";
        });
});

document.getElementById("perfilForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentUsername = localStorage.getItem("username");
    const newUsername = document.getElementById("username").value;
    const newPassword = document.getElementById("password").value;

    // Modal helpers
    function showPerfilModalError(msg) {
        const modal = document.getElementById("modalPerfilError");
        const modalMsg = document.getElementById("modalPerfilErrorMsg");
        modalMsg.textContent = msg;
        modal.style.display = "flex";
    }
    document.getElementById("closeModalPerfilError").onclick = function() {
        document.getElementById("modalPerfilError").style.display = "none";
    };

    // Validar contraseña si se quiere cambiar
    if (newPassword) {
        const minLength = newPassword.length >= 8;
        const hasUpper = /[A-Z]/.test(newPassword);
        if (!minLength || !hasUpper) {
            showPerfilModalError("La nueva contraseña debe tener al menos 8 caracteres y una mayúscula.");
            return;
        }
    }

    try {
        const res = await fetch(`${API_URL}/updateUser`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentUsername, newUsername, newPassword })
        });

        const data = await res.json();

        if (data.success) {
            // Modal de éxito
            function showPerfilModalSuccess(msg) {
                const modal = document.getElementById("modalPerfilSuccess");
                const modalMsg = document.getElementById("modalPerfilSuccessMsg");
                modalMsg.textContent = msg;
                modal.style.display = "flex";
            }
            document.getElementById("closeModalPerfilSuccess").onclick = function() {
                document.getElementById("modalPerfilSuccess").style.display = "none";
                window.location.href = "main.html";
            };
            localStorage.setItem("username", data.user.username);
            showPerfilModalSuccess("Datos actualizados con éxito");
        } else {
            showPerfilModalError(data.message || "Error al actualizar");
        }
    } catch (error) {
        console.error("Error al actualizar:", error);
        alert("Error de conexión con el servidor");
    }
});

// Eliminar cuenta
document.getElementById("deleteAccountBtn").addEventListener("click", async () => {
    if (!confirm("¿Seguro que querés eliminar tu cuenta? Esta acción no se puede deshacer.")) return;
    const username = localStorage.getItem("username");
    try {
        const res = await fetch(`${API_URL}/deleteUser`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
        const data = await res.json();
        if (data.success) {
            alert("Cuenta eliminada correctamente");
            localStorage.removeItem("username");
            localStorage.removeItem("role");
            window.location.href = "index.html";
        } else {
            alert(data.message || "No se pudo eliminar la cuenta");
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Error de conexión con el servidor");
    }
});
