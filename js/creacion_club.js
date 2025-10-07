import { API_URL } from "./env.js";
import { showNotification } from "../componentes/notificacion.js";
import { showLoader, hideLoader } from "../componentes/loader.js";

// ========== INICIALIZACIÓN ==========
// Mostrar loader al cargar la página
showLoader("Cargando formulario...");

// Ocultar loader cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
    // Simular un pequeño delay para mostrar el loader
    setTimeout(() => {
        hideLoader();
    }, 800);
});

const fileInput = document.getElementById("imagenClubUrl");
const previewImg = document.getElementById("previewClubImg");
fileInput.addEventListener("change", () => {
  const url = fileInput.value.trim();
  if (url) {
    previewImg.src = url;
  }
});
    document.getElementById("crearClubForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value.trim();
        const description = document.getElementById("description").value.trim();
        const ownerUsername = localStorage.getItem("username");
        const imagen = document.getElementById("imagenClubUrl").value.trim();
        const msg = document.getElementById("crearClubMsg");
        msg.textContent = "";
        msg.style.display = "none";

        if (!ownerUsername) {
            msg.textContent = "Debes iniciar sesión primero";
            msg.style.background = "#ffeaea";
            msg.style.color = "#d63031";
            msg.style.borderRadius = "8px";
            msg.style.padding = "12px";
            msg.style.margin = "16px 0";
            msg.style.fontWeight = "bold";
            msg.style.display = "block";
            return;
        }

        try {
            // Mostrar loader durante la creación
            showLoader("Creando club...");
            
            const body = { name, description, ownerUsername, imagen };

            const res = await fetch(`${API_URL}/createClub`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (data.success) {
                // Cambiar mensaje del loader
                showLoader("Club creado! Redirigiendo...");
                showNotification("success","Club creado con éxito. Ahora eres moderador!");
                setTimeout(() => {
                    hideLoader();
                    window.location.href = "main.html";
                }, 1500);
            } else {
                hideLoader();
                showNotification("error", data.message || "Error al crear club");
            }
        } catch (error) {
            hideLoader();
            showNotification("error", "Error de conexión con el servidor");
        }
    });