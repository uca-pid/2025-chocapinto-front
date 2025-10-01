import { API_URL } from "./env.js";

        function logout() {
            localStorage.removeItem("username");
            localStorage.removeItem("role");
            window.location.href = "index.html";
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
                window.location.href = "index.html";
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
                    card.style.background = "rgba(255,255,255,0.15)";
                    card.style.backdropFilter = "blur(8px)";
                    card.style.boxShadow = "0 8px 32px 0 rgba(44,90,145,0.12)";
                    card.style.borderRadius = "18px";
                    card.style.padding = "1rem";
                    card.style.display = "flex";
                    card.style.flexDirection = "column";
                    card.style.alignItems = "center";
                    card.style.justifyContent = "flex-start";
                    card.style.width = "100%";
                    card.style.maxWidth = "200px";
                    card.style.minHeight = "280px";
                    card.style.position = "relative";
                    card.style.border = "1px solid rgba(44,90,145,0.08)";
                    card.innerHTML = `
                        <div style="width:100%;display:flex;justify-content:center;margin-bottom:14px;">
                            <img src="${libro.portada ? libro.portada : '../images/BooksyLogo.png'}" alt="Portada del libro" style="width:90px;height:130px;object-fit:cover;object-position:center;border-radius:10px;box-shadow:0 4px 24px rgba(44,90,145,0.10);background:rgba(245,246,250,0.7);">
                        </div>
                        <h4 style="margin:0 0 6px 0;font-size:1.08rem;color:#2c5a91;text-align:center;line-height:1.2;text-shadow:0 2px 12px rgba(44,90,145,0.10);">${libro.title}</h4>
                        <p style="margin:0 0 8px 0;font-size:0.97rem;color:#636e72;text-align:center;text-shadow:0 2px 12px rgba(44,90,145,0.08);">${libro.author ? libro.author : "Autor desconocido"}</p>
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

function mostrarLibros(libros) {
    const librosList = document.getElementById('libros-list');
    librosList.innerHTML = "";

    if (libros.length > 0) {
        libros.forEach(libro => {
            const card = document.createElement('div');
            card.className = 'libro-card';
            card.style.background = '#fff';
            card.style.borderRadius = '16px';
            card.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
            card.style.padding = '1rem';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'center';
            card.style.justifyContent = 'flex-start';
            card.style.border = '1px solid #eaf6ff';
            card.style.width = '100%';
            card.style.maxWidth = '200px';
            card.style.minHeight = '300px';
            card.style.position = 'relative';

            const categoriasHTML = libro.categorias
                .map(cat => `<span style="background:#eaf6ff;color:#2c5a91;padding:2px 6px;border-radius:8px;font-size:0.8rem;margin-right:4px;">${cat.nombre}</span>`)
                .join(" ");

            card.innerHTML = `
                <div style='width:100%;display:flex;flex-direction:column;align-items:center;'>
                    ${libro.portada ? `<img src='${libro.portada}' style='width:100%;height:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0, 0, 0, 0.1);margin-bottom:1rem;'>` : `<div style='width:100%;height:150px;background:#eaf6ff;border-radius:8px;margin-bottom:1rem;'></div>`}
                    <div style='text-align:center;'>
                        <strong style='color:#2c5a91;font-size:1.1rem;'>${libro.title}</strong>
                        ${libro.author ? `<br><span style="color:#636e72;font-size:0.9rem;">de ${libro.author}</span>` : ''}
                        <div style="margin-top:6px;">${categoriasHTML}</div>
                    </div>
                </div>
            `;

            librosList.appendChild(card);
        });
    } else {
        librosList.innerHTML = '<div style="color:#636e72;">No hay libros disponibles.</div>';
    }
}