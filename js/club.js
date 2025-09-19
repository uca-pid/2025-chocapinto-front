// --- AGREGAR LIBRO ---
document.getElementById("formLibro").addEventListener("submit", async function(e) {
    e.preventDefault();
    const title = document.getElementById("tituloLibro").value;
    const author = document.getElementById("autorLibro").value;
    const clubId = getClubId();
    const msg = document.getElementById("msgLibro");
    msg.textContent = "";
    msg.style.display = "none";
    try {
        const res = await fetch(`${API_URL}/club/${clubId}/addBook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, author })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            msg.textContent = "Libro agregado con éxito";
            msg.style.background = "#eaf6ff";
            msg.style.color = "#0984e3";
            msg.style.borderRadius = "8px";
            msg.style.padding = "12px";
            msg.style.margin = "12px 0";
            msg.style.fontWeight = "bold";
            msg.style.display = "block";
            msg.style.boxShadow = "0 2px 12px #0984e340";
            msg.style.transition = "all 0.3s";
            setTimeout(() => { document.getElementById('modalLibro').style.display='none'; }, 1200);
        } else {
            msg.textContent = data.message || "Error al agregar libro";
            msg.style.background = "#ffeaea";
            msg.style.color = "#d63031";
            msg.style.borderRadius = "8px";
            msg.style.padding = "12px";
            msg.style.margin = "12px 0";
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
    msg.style.margin = "12px 0";
    msg.style.fontWeight = "bold";
    msg.style.display = "block";
    msg.style.boxShadow = "0 2px 12px #d6303140";
    msg.style.transition = "all 0.3s";
    }
});
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
            // Mostrar libros leídos
            const librosList = document.getElementById('libros-leidos-list');
            librosList.innerHTML = "";
            const username = localStorage.getItem("username");
            const userId = localStorage.getItem("userId");
            const isOwner = data.club.id_owner == userId;
            // console.log(data.club.id_owner, userId, isOwner);
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
                    card.innerHTML = `<strong style='color:#2c5a91;font-size:1.15rem;'>${libro.title}</strong>${libro.author ? '<br><span style=\"color:#636e72;\">de ' + libro.author + '</span>' : ''}`;
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