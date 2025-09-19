// --- AGREGAR LIBRO ---
document.getElementById("formLibro").addEventListener("submit", async function(e) {
    e.preventDefault();
    const title = document.getElementById("tituloLibro").value;
    const author = document.getElementById("autorLibro").value;
    const clubId = getClubId();
    const msg = document.getElementById("msgLibro");
    msg.textContent = "";
    try {
        const res = await fetch(`${API_URL}/club/${clubId}/addBook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, author })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            msg.style.color = '#00b894';
            msg.textContent = "Libro agregado con éxito";
            setTimeout(() => { document.getElementById('modalLibro').style.display='none'; }, 1200);
        } else {
            msg.style.color = '#d63031';
            msg.textContent = data.message || "Error al agregar libro";
        }
    } catch (error) {
        msg.style.color = '#d63031';
        msg.textContent = "Error de conexión con el servidor";
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
                data.club.readBooks.forEach(libro => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${libro.title}</strong>${libro.author ? ' <span style=\"color:#636e72;\">de ' + libro.author + '</span>' : ''}`;
                    // Mostrar cruz si es owner
                    if (isOwner) {
                        const deleteBtn = document.createElement('span');
                        deleteBtn.textContent = '❌';
                        deleteBtn.style.cssText = 'color:#d63031;cursor:pointer;margin-left:10px;font-size:1.2rem;';
                        deleteBtn.title = 'Eliminar libro';
                        deleteBtn.onclick = async () => {
                            if (confirm('¿Seguro que querés eliminar este libro?')) {
                                await eliminarLibro(libro.id, clubId, username);
                                renderClub();
                            }
                        };
                        li.appendChild(deleteBtn);
                    }
                    librosList.appendChild(li);
                });
            } else {
                librosList.innerHTML = '<li style="color:#636e72;">No hay libros leídos aún.</li>';
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