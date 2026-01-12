import { API_URL } from "./env.js";
import { showNotification } from "../componentes/notificacion.js";
import { showLoader, hideLoader } from "../componentes/loader.js";
import { initNotificaciones } from "./club-componentes/notificaciones-alertas.js";
import { addHeaderAction } from "./club-componentes/app-header.js";
import { initSessionManager } from "./sessionManager.js";

function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    window.location.href = "index.html";
}

function configurarDropdownPerfil() {
    const dropdownBtn = document.getElementById("profileDropdownBtn");
    const dropdownContent = document.getElementById("profileDropdownContent");
    
    if (dropdownBtn && dropdownContent) {
        dropdownBtn.addEventListener("mouseenter", () => {
            dropdownContent.style.display = "block";
        });
        
        dropdownBtn.addEventListener("mouseleave", () => {
            setTimeout(() => {
                if (!dropdownContent.matches(':hover')) {
                    dropdownContent.style.display = "none";
                }
            }, 100);
        });
        
        dropdownContent.addEventListener("mouseleave", () => {
            dropdownContent.style.display = "none";
        });
        
        dropdownContent.addEventListener("mouseenter", () => {
            dropdownContent.style.display = "block";
        });
    }
}

function updateUsernameDisplay() {
    const username = localStorage.getItem("username");
    const usernameDisplay = document.getElementById("usernameDisplay");
    const usernameDisplayHover = document.getElementById("usernameDisplayHover");
    
    if (username && usernameDisplay && usernameDisplayHover) {
        usernameDisplay.textContent = username;
        usernameDisplayHover.textContent = username;
    }
}

window.logout = logout;

function mostrarModalNotificaciones() {
    const modal = document.getElementById("modalNotificaciones");
    if (modal) {
        modal.style.display = "flex";
    }
}

function cerrarModalNotificaciones() {
    const modal = document.getElementById("modalNotificaciones");
    if (modal) {
        modal.style.display = "none";
    }
}

async function marcarTodasLeidas() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    
    try {
        const response = await fetch(`${API_URL}/notificaciones/marcar-todas-leidas/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Error al marcar notificaciones como leídas:', error);
    }
}

window.mostrarModalNotificaciones = mostrarModalNotificaciones;
window.cerrarModalNotificaciones = cerrarModalNotificaciones;
window.marcarTodasLeidas = marcarTodasLeidas;

showLoader("Cargando formulario...");
document.addEventListener("DOMContentLoaded", () => {
    initSessionManager();
    updateUsernameDisplay();
    configurarDropdownPerfil();
    
    const userId = localStorage.getItem("userId");
    if (userId) {
        initNotificaciones(userId);
    }
    
    addHeaderAction({
        id: "notificacionesBtn",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>`,
        variant: "secondary",
        onClick: () => {
            mostrarModalNotificaciones();
        }
    });
    
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
            showLoader("Creando club...");
            
            const body = { name, description, ownerUsername, imagen };

            const res = await fetch(`${API_URL}/createClub`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (data.success) {
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