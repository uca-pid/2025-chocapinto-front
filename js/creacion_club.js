const API_URL = "http://127.0.0.1:5000";

    document.getElementById("crearClubForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value.trim();
        const description = document.getElementById("description").value.trim();
        const ownerUsername = localStorage.getItem("username");
        const msg = document.getElementById("crearClubMsg");
        msg.textContent = "";

        if (!ownerUsername) {
            msg.textContent = "Debes iniciar sesión primero";
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
                msg.style.color = "#0984e3";
                msg.textContent = "Club creado con éxito. Ahora eres moderador!";
                setTimeout(() => window.location.href = "main.html", 1200);
            } else {
                msg.style.color = "#d63031";
                msg.textContent = data.message || "Error al crear club";
            }
        } catch (error) {
            msg.style.color = "#d63031";
            msg.textContent = "Error de conexión con el servidor";
        }
    });