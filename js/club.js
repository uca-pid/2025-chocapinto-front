// Gestionar solicitud: aceptar o rechazar
async function gestionarSolicitud(solicitudId, aceptar) {
    const clubId = getClubId();
    try {
        const res = await fetch(`${API_URL}/club/${clubId}/solicitud/${solicitudId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ aceptar })
        });
        const data = await res.json();
        if (data.success) {
            alert(data.message || (aceptar ? "Solicitud aceptada" : "Solicitud rechazada"));
            renderClub();
        } else {
            alert(data.message || "No se pudo procesar la solicitud");
        }
    } catch (error) {
        alert("Error de conexión al gestionar solicitud");
    }
}
async function eliminarUsuarioDelClub(userId, clubId) {
    if (!confirm("¿Seguro que quieres eliminar este usuario del club?")) return;
    try {
        const res = await fetch(`${API_URL}/club/${clubId}/removeMember/${userId}`, {
            method: "DELETE"
        });
        const data = await res.json();
        if (data.success) {
            alert("Usuario eliminado");
            renderClub();
        } else {
            alert(data.message || "No se pudo eliminar el usuario");
        }
    } catch (error) {
        alert("Error de conexión");
    }
}
async function obtenerDatosOwner(id_owner){
    try {
        const res = await fetch(`${API_URL}/user/${id_owner}`);
        const data = await res.json();
        if (data.success && data.user && data.user.username) {
            document.getElementById('club-owner').textContent = `Moderador: ${data.user.username}`;
        } else {
            document.getElementById('club-owner').textContent = "Moderador: desconocido";
        }
    } catch (error) {
        document.getElementById('club-owner').textContent = "Moderador: error de datos";
    }
}
// --- AGREGAR LIBRO ---
// --- CAMBIO: Buscador Google Books y guardar libro seleccionado ---
const buscadorLibro = document.getElementById("buscadorLibro");
const resultadosBusquedaLibro = document.getElementById("resultadosBusquedaLibro");
const tituloLibro = document.getElementById("tituloLibro");
const autorLibro = document.getElementById("autorLibro");

buscadorLibro.addEventListener("input", async function () {
    const query = buscadorLibro.value.trim();
    resultadosBusquedaLibro.innerHTML = "";
    if (query.length < 2) return;
    const libros = await buscarLibrosGoogleBooksAPI(query);
    if (libros.length === 0) {
        resultadosBusquedaLibro.innerHTML = "<div style='padding:0.5rem;color:#636e72;'>No se encontraron libros.</div>";
        return;
    }
    libros.forEach(libro => {
        const div = document.createElement("div");
        div.className = "busqueda-libro-item";
        div.innerHTML = `<div style='display:flex;align-items:center;gap:10px;'>${libro.thumbnail ? `<img src='${libro.thumbnail}' style='width:40px;height:auto;border-radius:4px;'>` : ""}<div><strong>${libro.title}</strong> <span style='color:#636e72;font-size:0.95em;'>${libro.author}</span></div></div>`;
        div.style.cursor = "pointer";
        div.style.marginBottom = "12px";
        div.style.borderRadius = "14px";
        div.style.border = "2px solid #5fa8e9";
        div.style.background = "#eaf6ff";
        div.style.padding = "10px 14px";
        div.onclick = () => {
            tituloLibro.value = libro.title;
            autorLibro.value = libro.author;
            portadaLibro.value = libro.thumbnail || "";
            buscadorLibro.value = libro.title;
            resultadosBusquedaLibro.innerHTML = `<div style='color:#0984e3;padding:0.5rem;display:flex;align-items:center;gap:10px;margin-bottom:0.5rem;border:2px solid #0984e3;border-radius:8px;background:#eaf6ff;'>${libro.thumbnail ? `<img src='${libro.thumbnail}' style='width:40px;height:auto;border-radius:4px;margin-bottom:0.5rem;'>` : ""}Libro seleccionado: <strong>${libro.title}</strong></div>`;
        };
        resultadosBusquedaLibro.appendChild(div);
    });
});

document.getElementById("formLibro").addEventListener("submit", async function(e) {
    e.preventDefault();
    const title = tituloLibro.value;
    const author = autorLibro.value;
    const thumbnail = portadaLibro.value;
    const id_api = document.getElementById("idApiLibro").value;
    const clubId = getClubId();
    const msg = document.getElementById("msgLibro");
    msg.textContent = "";
    msg.style.display = "none";
    if (!title) {
        msg.textContent = "Seleccioná un libro de la búsqueda";
        msg.style.background = "#ffeaea";
        msg.style.color = "#d63031";
        msg.style.display = "block";
        return;
    }
    try {
        const res = await fetch(`${API_URL}/club/${clubId}/addBook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, author, thumbnail, id_api })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            msg.textContent = "Libro agregado con éxito";
            msg.style.background = "#eaf6ff";
            msg.style.color = "#0984e3";
            msg.style.display = "block";
            setTimeout(() => { document.getElementById('modalLibro').style.display='none'; renderClub(); }, 1200);
        } else {
            msg.textContent = data.message || "Error al agregar libro";
            msg.style.background = "#ffeaea";
            msg.style.color = "#d63031";
            msg.style.display = "block";
        }
    } catch (error) {
        msg.textContent = "Error de conexión con el servidor";
        msg.style.background = "#ffeaea";
        msg.style.color = "#d63031";
        msg.style.display = "block";
    }
});

// --- Función para buscar libros en Google Books ---
async function buscarLibrosGoogleBooksAPI(query) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!data.items) return [];
        const libros = data.items.map(item => ({
            title: item.volumeInfo.title || "Sin título",
            author: (item.volumeInfo.authors && item.volumeInfo.authors.join(", ")) || "Autor desconocido",
            thumbnail: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : ""
        }));
        return libros;
    } catch (error) {
        return [];
    }
}
const API_URL = "http://127.0.0.1:5000";
    function getClubId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('clubId');
    }
async function renderClub() {
    const clubId = getClubId();
    
    if (!clubId) {
        document.getElementById('club-name').textContent = "Club no encontrado";
        document.getElementById('club-description').textContent = "No se especificó el club.";
        return;
    }
    try {
        const res = await fetch(`${API_URL}/club/${clubId}`);
        
        const data = await res.json();

        
        if (res.ok && data.success) {
            

           
            
            
            document.getElementById('club-name').textContent = data.club.name;
            document.getElementById('club-description').textContent = data.club.description;
            obtenerDatosOwner(data.club.id_owner);
            
            
            
            // Mostrar integrantes
            const membersList = document.getElementById('club-members-list');
            membersList.innerHTML = "";
            if (data.club.members && data.club.members.length > 0) {
                // Ensure userId and isOwner are defined
                const userId = localStorage.getItem("userId");
                const isOwner = data.club.id_owner == userId;
                data.club.members.forEach(m => {
                    const li = document.createElement('li');
                    li.textContent = m.username;
                    li.style.cssText = 'padding:0.5em 0;color:#2c5a91;font-weight:500;border-bottom:1px solid #eaf6ff;';
                    if (isOwner && m.id != userId) {
                        const btn= document.createElement('button');
                        btn.textContent = 'Eliminar';
                        btn.style.cssText = 'margin-left:10px;background:#d63031;color:#fff;border:none;border-radius:8px;padding:0.3rem 0.8rem;font-weight:600;cursor:pointer;';
                        btn.onclick = async () => { await eliminarUsuarioDelClub(m.id, clubId); };
                        li.appendChild(btn);
                    }
                    membersList.appendChild(li);
                });
            } else {
                membersList.innerHTML = '<li style="color:#636e72;">No hay integrantes aún.</li>';
            }
            // Mostrar libros leídos
            const librosList = document.getElementById('libros-leidos-list');
            librosList.innerHTML = "";
            const username = localStorage.getItem("username");
            const userId = localStorage.getItem("userId");
            const isOwner = data.club.id_owner == userId;
            // Mostrar solicitudes solo si es owner
            const solicitudesContainer = document.getElementById('solicitudes-container');
            const solicitudesList = document.getElementById('solicitudes-list');
            
            if (isOwner && data.club.solicitudes && data.club.solicitudes.length > 0) {
                const pendientes = data.club.solicitudes.filter(s => s.estado === "pendiente");
                if (pendientes.length > 0) {
                    solicitudesContainer.style.display = 'block';
                    solicitudesList.innerHTML = '';
                    pendientes.forEach(solicitud => {
                        console.log('Solicitud:', solicitud);
                        const item = document.createElement('div');
                        item.style.cssText = 'background:#eaf6ff;padding:1rem 1.2rem;border-radius:10px;display:flex;align-items:center;justify-content:space-between;';
                        item.innerHTML = `<span style='color:#2c5a91;font-weight:600;'>${solicitud.username}</span> <span style='color:#636e72;'>quiere unirse</span>`;
                        // Botones aceptar/rechazar
                        const btns = document.createElement('div');
                        btns.style.display = 'flex';
                        btns.style.gap = '10px';
                        const aceptarBtn = document.createElement('button');
                        aceptarBtn.textContent = 'Aceptar';
                        aceptarBtn.style.cssText = 'background:#0984e3;color:#fff;border:none;border-radius:8px;padding:0.5rem 1.2rem;font-weight:600;cursor:pointer;';
                        aceptarBtn.onclick = async () => {
                            await gestionarSolicitud(solicitud.id, true);
                        };
                        const rechazarBtn = document.createElement('button');
                        rechazarBtn.textContent = 'Rechazar';
                        rechazarBtn.style.cssText = 'background:#d63031;color:#fff;border:none;border-radius:8px;padding:0.5rem 1.2rem;font-weight:600;cursor:pointer;';
                        rechazarBtn.onclick = async () => {
                            await gestionarSolicitud(solicitud.id, false);
                        };
                        btns.appendChild(aceptarBtn);
                        btns.appendChild(rechazarBtn);
                        item.appendChild(btns);
                        solicitudesList.appendChild(item);
                    });
                } else {
                    solicitudesContainer.style.display = 'none';
                }
            } else if (solicitudesContainer) {
                solicitudesContainer.style.display = 'none';
            }
            if (data.club.readBooks && data.club.readBooks.length > 0) {
                librosList.innerHTML = "";
                data.club.readBooks.forEach(libro => {
                    const card = document.createElement('div');
                    card.className = 'libro-card';
                    card.style.background = '#fff';
                    card.style.borderRadius = '16px';
                    card.style.boxShadow = '0 2px 16px #2c5a9140';
                    card.style.padding = '1.2rem 1.2rem';
                    card.style.display = 'flex';
                    card.style.flexDirection = 'column';
                    card.style.alignItems = 'flex-start';
                    card.style.justifyContent = 'flex-start';
                    card.style.border = '1px solid #eaf6ff';
                    card.style.width = '100%';
                    card.style.maxWidth = '260px';
                    card.style.minHeight = '120px';
                    card.style.position = 'relative';
                    card.innerHTML = `
                        <div style='width:100%;display:flex;align-items:center;gap:10px;'>
                            ${libro.portada ? `<img src='${libro.portada}' style='width:48px;height:auto;border-radius:6px;'>` : `
                                <svg width='48' height='48' viewBox='0 0 48 48' fill='none'>
                                    <rect x='8' y='12' width='16' height='28' rx='4' fill='#2c5a91'/>
                                    <rect x='28' y='12' width='12' height='28' rx='4' fill='#5fa8e9'/>
                                    <rect x='24' y='12' width='4' height='28' fill='#e6eafc'/>
                                </svg>
                            `}
                            <div>
                                <strong style='color:#2c5a91;font-size:1.15rem;'>${libro.title}</strong>
                                ${libro.author ? '<br><span style="color:#636e72;">de ' + libro.author + '</span>' : ''}
                            </div>
                        </div>
                    `;
                    if (isOwner) {
                        const deleteBtn = document.createElement('span');
                        deleteBtn.textContent = '❌';
                        deleteBtn.style.cssText = 'color:#d63031;cursor:pointer;font-size:1.3rem;position:absolute;top:10px;right:14px;';
                        deleteBtn.title = 'Eliminar libro';
                        deleteBtn.onclick = () => {
                            // Mostrar modal de confirmación
                            const modal = document.getElementById('modalEliminarLibro');
                            modal.style.display = 'flex';
                            // Guardar id del libro a eliminar
                            modal.dataset.bookId = libro.id;
                        };
                        card.appendChild(deleteBtn);
                    }
// Modal de confirmación para eliminar libro
const modalEliminar = document.getElementById('modalEliminarLibro');
const closeModalEliminar = document.getElementById('closeModalEliminar');
const confirmEliminarBtn = document.getElementById('confirmEliminarBtn');
const cancelEliminarBtn = document.getElementById('cancelEliminarBtn');

if (closeModalEliminar) closeModalEliminar.onclick = () => { modalEliminar.style.display = 'none'; };
if (cancelEliminarBtn) cancelEliminarBtn.onclick = () => { modalEliminar.style.display = 'none'; };
if (confirmEliminarBtn) confirmEliminarBtn.onclick = async () => {
    const clubId = getClubId();
    const username = localStorage.getItem("username");
    const bookId = modalEliminar.dataset.bookId;
    if (bookId) {
        await eliminarLibro(bookId, clubId, username);
        modalEliminar.style.display = 'none';
        renderClub();
    }
};
                    librosList.appendChild(card);
                });
            } else {
                librosList.innerHTML = '<div style="color:#636e72;">No hay libros leídos aún.</div>';
            }
        } else {
            document.getElementById('club-name').textContent = "Club no encontrado";
            document.getElementById('club-description').textContent = data.message || "No existe el club.";
        }
    } catch (error) {
        document.getElementById('club-name').textContent = "Error de conexión";
        document.getElementById('club-description').textContent = "No se pudo cargar el club.";
    }
}

async function eliminarLibro(bookId, clubId, username) {
    try {
        const res = await fetch(`${API_URL}/club/${clubId}/deleteBook/${bookId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            alert(data.message || "Error al eliminar libro");
        }
    } catch (error) {
        alert("Error de conexión al eliminar libro");
    }
}
renderClub();