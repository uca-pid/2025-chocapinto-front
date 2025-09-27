import { API_URL } from "./env.js";

    document.getElementById("crearClubForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value.trim();
        const description = document.getElementById("description").value.trim();
        const ownerUsername = localStorage.getItem("username");
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
            const res = await fetch(`${API_URL}/createClub`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description, ownerUsername })
            });

            const data = await res.json();

            if (data.success) {
                msg.textContent = "Club creado con éxito. Ahora eres moderador!";
                msg.style.background = "#eaf6ff";
                msg.style.color = "#0984e3";
                msg.style.borderRadius = "8px";
                msg.style.padding = "14px";
                msg.style.margin = "18px 0";
                msg.style.fontWeight = "bold";
                msg.style.display = "block";
                msg.style.boxShadow = "0 2px 12px #0984e340";
                msg.style.transition = "all 0.3s";
                setTimeout(() => window.location.href = "main.html", 1500);
            } else {
                msg.textContent = data.message || "Error al crear club";
                msg.style.background = "#ffeaea";
                msg.style.color = "#d63031";
                msg.style.borderRadius = "8px";
                msg.style.padding = "12px";
                msg.style.margin = "16px 0";
                msg.style.fontWeight = "bold";
                msg.style.display = "block";
                msg.style.boxShadow = "0 2px 12px #d6303140";
                msg.style.transition = "all 0.3s";
            }
        } catch (error) {
            msg.textContent = "Error de conexión con el servidor";
            msg.style.background = "#ffeaea";
            msg.style.color = "#d63031";
            msg.style.borderRadius = "8px";
            msg.style.padding = "12px";
            msg.style.margin = "16px 0";
            msg.style.fontWeight = "bold";
            msg.style.display = "block";
            msg.style.boxShadow = "0 2px 12px #d6303140";
            msg.style.transition = "all 0.3s";
        }
    });