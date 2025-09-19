const API_URL = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", () => {
    const currentUsername = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!currentUsername) {
        window.location.href = "login.html";
        return;
    }

    // Mostrar datos actuales
    document.getElementById("username").value = currentUsername;
    document.getElementById("role").value = role;
});

document.getElementById("perfilForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentUsername = localStorage.getItem("username"); // username actual
    const newUsername = document.getElementById("username").value;
    const newPassword = document.getElementById("password").value;

    try {
        const res = await fetch(`${API_URL}/updateUser`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentUsername, newUsername, newPassword })
        });

        const data = await res.json();

        if (data.success) {
            alert("Datos actualizados con éxito");
            localStorage.setItem("username", data.user.username); // actualizar localStorage
            // No se toca el role
            window.location.href = "main.html";
        } else {
            alert(data.message || "Error al actualizar");
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
            window.location.href = "login.html";
        } else {
            alert(data.message || "No se pudo eliminar la cuenta");
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Error de conexión con el servidor");
    }
});
