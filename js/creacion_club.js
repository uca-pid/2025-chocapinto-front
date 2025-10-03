import { API_URL } from "./env.js";
import { showNotification } from "../componentes/notificacion.js";

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
            const body = { name, description, ownerUsername, imagen };

            const res = await fetch(`${API_URL}/createClub`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
            });

            const data = await res.json();

            if (data.success) {
            showNotification("success","Club creado con éxito. Ahora eres moderador!");
            setTimeout(() => window.location.href = "main.html", 1500);
            } else {
            showNotification("error",data.message || "Error al crear club");
            }
        } catch (error) {
            showNotification("error","Error de conexión con el servidor");
        }
    });