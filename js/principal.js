const API_URL = "http://127.0.0.1:5000";

        function logout() {
            localStorage.removeItem("username");
            localStorage.removeItem("role");
            window.location.href = "login.html";
        }

        async function cargarClubes() {
            const username = localStorage.getItem("username");
            const misClubesGrid = document.querySelector(".mis-clubes-grid");
            const clubesGrid = document.getElementById("clubesGrid");

            misClubesGrid.innerHTML = "";
            clubesGrid.innerHTML = "";

            try {
                const res = await fetch(`${API_URL}/clubs`);
                const data = await res.json();
                if (!data.success) return;

                data.clubs.forEach(club => {
                    const esMiembro = club.members.some(m => m.username === username);
                    const img= club.imagen || '../images/BooksyLogo.png';
                     const esCreador = club.ownerUsername === username; // <-- compara con el creador
                    const clubCard = document.createElement("div");
                    clubCard.className = "section-card club-card";
                    clubCard.innerHTML = `<div class="club-logo club-logo-default" style="width:70px;height:70px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f5f6fa;border-radius:50%;margin:0 auto 10px auto;">
                        <img src="${img}" alt="Logo del club" style="width:100%;height:100%;object-fit:contain;object-position:center;display:block;">
                    </div>
                    <h3>${club.name}</h3>
                    <p>${club.description}</p>
                    ${esMiembro ? '<span style="color:#0984e3;font-weight:700;">Ya eres miembro</span>' : '<button class="unirme-btn">Unirme</button>'}
                    ${esCreador ? '<button class="editar-btn">Editar</button>' : ''}
                    `;
                    if (esMiembro) {
        document.querySelector(".mis-clubes-grid").appendChild(clubCard);
        // 👉 si soy miembro, al hacer click en toda la tarjeta voy al club
        clubCard.addEventListener("click", (e) => {
            // evitar que el click al botón editar dispare la redirección
            if (!e.target.classList.contains("editar-btn")) {
                window.location.href = `club_lectura.html?clubId=${club.id}`;
            }
        });
    } else {
        document.getElementById("clubesGrid").appendChild(clubCard);
    }

                    if (!esMiembro) {
                        clubCard.querySelector(".unirme-btn").addEventListener("click", async () => {
            console.log('Unirme clickeado', { clubId: club.id, username });
            // Crear solicitud de ingreso al club
            const res = await fetch(`${API_URL}/clubSolicitud`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clubId: club.id, username })
            });
            const data = await res.json();
            console.log('Respuesta clubSolicitud:', data);
            if (data.success) {
                alert("Solicitud enviada. Espera la aprobación del moderador.");
                cargarClubes();
            } else {
                alert(data.message || "No se pudo enviar la solicitud.");
            }
        });
                    }
                    if (esCreador) {
        clubCard.querySelector(".editar-btn").addEventListener("click", () => {
            window.location.href = `editar_club.html?clubId=${club.id}`;
        });
    }
                });
            } catch (error) {
                console.error("Error al cargar clubes:", error);
            }
        }

        document.addEventListener("DOMContentLoaded", () => {
            const username = localStorage.getItem("username");
            const usernameDisplay = document.getElementById("usernameDisplay");

            if (username && usernameDisplay) {
                usernameDisplay.textContent = username;
            } else {
                window.location.href = "login.html";
            }

            cargarClubes();
            cargarLibrosRecomendados();

            // Dropdown funcionalidad
            const dropdownBtn = document.getElementById("profileDropdownBtn");
            const dropdownContent = document.getElementById("profileDropdownContent");
            if (dropdownBtn && dropdownContent) {
                dropdownBtn.addEventListener("mouseenter", () => { dropdownContent.style.display = "block"; });
                dropdownBtn.addEventListener("mouseleave", () => { setTimeout(() => { if (!dropdownContent.matches(':hover')) dropdownContent.style.display = "none"; }, 100); });
                dropdownContent.addEventListener("mouseleave", () => { dropdownContent.style.display = "none"; });
                dropdownContent.addEventListener("mouseenter", () => { dropdownContent.style.display = "block"; });
            }

            // CAMBIO: Mostrar libros en tiempo real debajo del buscador
            const input = document.getElementById("busquedaLibro");
            const resultados = document.getElementById("resultadosBusquedaLibros");
            let lastQuery = "";
            input.addEventListener("input", async function () {
                const query = input.value.trim();
                resultados.innerHTML = "";
                if (query.length < 2) return;
                lastQuery = query;
                const libros = await buscarLibrosGoogleBooksAPI(query);
                // Si el usuario siguió escribiendo, no mostrar resultados viejos
                if (lastQuery !== input.value.trim()) return;
                if (libros.length === 0) {
                    resultados.innerHTML = "<div style='padding:0.5rem;color:#636e72;'>No se encontraron libros.</div>";
                    return;
                }
                libros.forEach(libro => {
                    const div = document.createElement("div");
                    div.className = "busqueda-libro-item";
                    div.innerHTML = `<strong>${libro.title}</strong> <span style='color:#636e72;font-size:0.95em;'>${libro.author}</span>`;
                    resultados.appendChild(div);
                });
            });
        });

        async function cargarLibrosRecomendados() {
            const grid = document.getElementById("recomendacionesGrid");
            grid.innerHTML = "";
            try {
                const res = await fetch(`${API_URL}/books`);
                const data = await res.json();
                if (!data.success || !data.books) {
                    grid.innerHTML = '<p style="color:#636e72;">No hay libros recomendados.</p>';
                    return;
                }
                data.books.forEach(libro => {
                    const card = document.createElement("div");
                    
                    card.className = "recomendacion-card";
                    card.innerHTML = `
                        <div style="width:100%;display:flex;justify-content:center;margin-bottom:10px;">
                            <img src="${libro.portada ? libro.portada : '../images/BooksyLogo.png'}" alt="Portada del libro" style="width:100px;height:auto;object-fit:contain;object-position:center;border-radius:4px;">
                        </div>
                        <h4>${libro.title}</h4>
                        <p>${libro.author ? libro.author : "Autor desconocido"}</p>
                    `;
                    grid.appendChild(card);
                });
            } catch (error) {
                grid.innerHTML = '<p style="color:#d63031;">Error al cargar libros.</p>';
            }
        }
        async function buscarLibrosGoogleBooks(event) {
    event.preventDefault(); // Evita recarga
    const query = document.getElementById("busquedaLibro").value.trim();
    const resultadosDiv = document.getElementById("resultadosBusquedaLibros");
    resultadosDiv.innerHTML = ""; // Limpia resultados previos

    if (!query) return;

    const libros = await buscarLibrosGoogleBooksAPI(query);

    if (libros.length === 0) {
        resultadosDiv.innerHTML = "<p style='color:#636e72;'>No se encontraron libros.</p>";
        return;
    }

    libros.forEach(libro => {
        const card = document.createElement("div");
        card.className = "libro-busqueda-card";
        card.innerHTML = `
            <div style="display:flex;gap:12px;">
                ${libro.thumbnail ? `<img src="${libro.thumbnail}" alt="Portada" style="width:60px;height:auto;border-radius:4px;">` : ""}
                <div>
                    <h4 style="margin:0 0 4px 0;">${libro.title}</h4>
                    <p style="margin:0 0 4px 0;font-size:0.95em;color:#636e72;">${libro.author}</p>
                    <p style="margin:0;font-size:0.9em;">${libro.description ? libro.description.substring(0, 120) + "..." : ""}</p>
                </div>
            </div>
        `;
        resultadosDiv.appendChild(card);
    });
}

// Renombra tu función original para evitar conflicto de nombres
async function buscarLibrosGoogleBooksAPI(query) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!data.items) return [];
        const libros = data.items.map(item => ({
            title: item.volumeInfo.title || "Sin título",
            author: (item.volumeInfo.authors && item.volumeInfo.authors.join(", ")) || "Autor desconocido",
            description: item.volumeInfo.description || "",
            thumbnail: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : ""
        }));
        return libros;
    } catch (error) {
        console.error("Error al buscar libros en Google Books:", error);
        return [];
    }
}