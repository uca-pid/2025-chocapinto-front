import { API_URL } from "./env.js";
import { showNotification } from "../componentes/notificacion.js";
import { showLoader, hideLoader } from "../componentes/loader.js";
import { mostrarConfirmacion, confirmarEliminacion } from "../componentes/confirmacion.js";

//inicializador de pagina
showLoader("Cargando club...");
document.addEventListener("DOMContentLoaded", () => {
    // Simular un pequeño delay para mostrar el loader
    setTimeout(() => {
        hideLoader();
    }, 800);
});

// Gestionar solicitud: aceptar o rechazar
async function gestionarSolicitud(solicitudId, aceptar) {
    const clubId = getClubId();
    showLoader(aceptar ? "Aceptando solicitud..." : "Rechazando solicitud...");
    try {
        const res = await fetch(`${API_URL}/club/${clubId}/solicitud/${solicitudId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ aceptar })
        });
        const data = await res.json();
        if (data.success) {
            showNotification("success", data.message || (aceptar ? "Solicitud aceptada" : "Solicitud rechazada"));
            renderClub();
        } else {
            hideLoader();
            showNotification("error", data.message || "No se pudo procesar la solicitud");
        }
    } catch (error) {
        hideLoader();
        showNotification("error", "Error de conexión al gestionar solicitud");
    }
}

async function eliminarUsuarioDelClub(userId, clubId) {
    confirmarEliminacion("este usuario del club", async () => {
        showLoader("Eliminando usuario del club...");
        try {
            const res = await fetch(`${API_URL}/club/${clubId}/removeMember/${userId}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.success) {
                showNotification("success", "Usuario eliminado");
                renderClub();
            } else {
                hideLoader();
                showNotification("error", data.message || "No se pudo eliminar el usuario");
            }
        } catch (error) {
            hideLoader();
            showNotification("error", "Error de conexión");
        }
    });
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
async function cargarCategorias() {
    try {
        const res = await fetch(`${API_URL}/categorias`);
        const data = await res.json();
        if (data.success && Array.isArray(data.categorias)) {
            categoriasDisponibles = data.categorias;
            renderCategoriasCheckboxes();
        }
    } catch (error) {
        categoriasContainer.innerHTML = '<span style="color:#d63031;">Error al cargar categorías</span>';
    }
}
// Función para determinar si una categoría es predeterminada
function esCategoriasPredeterminada(nombreCategoria) {
    const categoriasPredeterminadas = [
        'Ficción',
        'No Ficción', 
        'Ciencia Ficción',
        'Fantasía',
        'Ensayo',
    ];
    return categoriasPredeterminadas.includes(nombreCategoria);
}

function renderCategoriasCheckboxes() {
  categoriasContainer.innerHTML = '';
  if (categoriasDisponibles.length === 0) {
    categoriasContainer.innerHTML = '<span style="color:#636e72;">No hay categorías aún.</span>';
    return;
  }

  const userId = localStorage.getItem("userId");
  const clubId = getClubId();

  fetch(`${API_URL}/club/${clubId}`)
    .then(res => res.json())
    .then(data => {
      const isOwner = data.club && data.club.id_owner == userId;

      categoriasDisponibles.forEach(cat => {
        const label = document.createElement('label');
        label.style.marginRight = '12px';
        label.style.fontWeight = '500';
        label.style.color = '#2c5a91';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = cat.id;
        checkbox.className = 'categoria-checkbox';

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + cat.nombre));

        // Si sos moderador y la categoría NO es predeterminada, mostrar opciones de editar/eliminar
        if (isOwner && !esCategoriasPredeterminada(cat.nombre)) {
            const editBtn = document.createElement("span");
            editBtn.textContent = " ✏️";
            editBtn.style.cursor = "pointer";
            editBtn.title = "Editar categoría";
            editBtn.onclick = () => editarCategoria(cat.id, cat.nombre);
            label.appendChild(editBtn);

            const deleteBtn = document.createElement("span");
            deleteBtn.textContent = " 🗑️";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.title = "Eliminar categoría";
            deleteBtn.onclick = () => eliminarCategoria(cat.id);
            label.appendChild(deleteBtn);
        }

        categoriasContainer.appendChild(label);
      });
    });
}
function eliminarCategoria(categoriaId) {
  confirmarEliminacion("esta categoría", () => {
    showLoader("Eliminando categoría...");
    fetch(`${API_URL}/categorias/${categoriaId}`, {
      method: "DELETE"
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // quitar de la lista en memoria y volver a renderizar
          categoriasDisponibles = categoriasDisponibles.filter(c => c.id !== categoriaId);
          renderCategoriasCheckboxes();
          hideLoader();
          showNotification("success", "Categoría eliminada");
        } else {
          hideLoader();
          showNotification("error", data.message || "Error al eliminar categoría");
        }
      })
      .catch(() => {
        hideLoader();
        showNotification("error", "Error de conexión al eliminar categoría");
      });
  });
}


function editarCategoria(categoriaId, nombreActual) {
  const nuevoNombre = prompt("Nuevo nombre para la categoría:", nombreActual);
  if (!nuevoNombre || nuevoNombre.trim() === "") return;

  showLoader("Editando categoría...");
  fetch(`${API_URL}/categorias/${categoriaId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: nuevoNombre.trim() })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // actualizar lista en memoria y volver a renderizar
        const index = categoriasDisponibles.findIndex(c => c.id === categoriaId);
        if (index !== -1) {
          categoriasDisponibles[index].nombre = data.categoria.nombre;
        }
        renderCategoriasCheckboxes();
        hideLoader();
        showNotification("success", "Categoría editada");
      } else {
        hideLoader();
        showNotification("error", data.message || "Error al editar categoría");
      }
    })
    .catch(() => {
      hideLoader();
      showNotification("error", "Error de conexión al editar categoría");
    });
}

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
function getClubId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('clubId');
    }
async function renderClub() {
    const clubId = getClubId();
    if (!clubId) {
        mostrarClubNoEncontrado("No se especificó el club.");
        return;
    }
    try {
        const res = await fetch(`${API_URL}/club/${clubId}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
            mostrarClubNoEncontrado(data.message || "No existe el club.");
            return;
        }
        mostrarDatosClub(data.club);
        mostrarIntegrantes(data.club);
        mostrarSolicitudes(data.club);

        // --- FILTRO MÚLTIPLE POR CATEGORÍAS ---
        const filtroContainerId = "filtro-categorias-leidos";
        let filtroContainer = document.getElementById(filtroContainerId);
        if (!filtroContainer) {
            filtroContainer = document.createElement("div");
            filtroContainer.id = filtroContainerId;
            filtroContainer.style.margin = "18px 0 8px 0";
            
            // Container principal del filtro
            const filtroMainContainer = document.createElement("div");
            filtroMainContainer.style.display = "flex";
            filtroMainContainer.style.flexDirection = "column";
            filtroMainContainer.style.gap = "10px";
            
            // Primera fila: selector
            const selectorRow = document.createElement("div");
            selectorRow.style.display = "flex";
            selectorRow.style.alignItems = "center";
            selectorRow.style.gap = "10px";
            
            const label = document.createElement("label");
            label.textContent = "Filtrar por categorías:";
            label.style.fontWeight = "500";
            label.style.color = "#2c5a91";
            selectorRow.appendChild(label);

            const select = document.createElement("select");
            select.id = "selectFiltroCategoria";
            select.style.padding = "6px 12px";
            select.style.borderRadius = "8px";
            select.style.border = "1px solid #eaf6ff";
            select.style.background = "#fff";
            select.style.fontWeight = "500";
            select.style.color = "#2c5a91";
            selectorRow.appendChild(select);
            
            // Segunda fila: chips de categorías seleccionadas
            const chipsContainer = document.createElement("div");
            chipsContainer.id = "categoriasChipsContainer";
            chipsContainer.style.display = "flex";
            chipsContainer.style.flexWrap = "wrap";
            chipsContainer.style.gap = "8px";
            chipsContainer.style.minHeight = "24px";
            
            filtroMainContainer.appendChild(selectorRow);
            filtroMainContainer.appendChild(chipsContainer);
            filtroContainer.appendChild(filtroMainContainer);

            // Insertar antes de la lista de libros leídos
            const librosList = document.getElementById('libros-leidos-list');
            librosList.parentNode.insertBefore(filtroContainer, librosList);
        }

        // Obtener todas las categorías disponibles
        const select = document.getElementById("selectFiltroCategoria");
        const chipsContainer = document.getElementById("categoriasChipsContainer");
        const todasCategorias = [];
        if (data.club.readBooks && data.club.readBooks.length > 0) {
            data.club.readBooks.forEach(libro => {
                libro.categorias.forEach(cat => {
                    if (!todasCategorias.some(c => c.id === cat.id)) {
                        todasCategorias.push(cat);
                    }
                });
            });
        }

        // Array para almacenar categorías seleccionadas
        let categoriasSeleccionadas = [];

        // Función para actualizar el select
        function actualizarSelect() {
            select.innerHTML = "";
            const optionDefault = document.createElement("option");
            optionDefault.value = "";
            optionDefault.textContent = "Seleccionar categoría...";
            select.appendChild(optionDefault);
            
            todasCategorias.forEach(cat => {
                // Solo mostrar categorías que no estén ya seleccionadas
                if (!categoriasSeleccionadas.some(sel => sel.id === cat.id)) {
                    const opt = document.createElement("option");
                    opt.value = cat.id;
                    opt.textContent = cat.nombre;
                    select.appendChild(opt);
                }
            });
        }

        // Función para crear un chip de categoría
        function crearChipCategoria(categoria) {
            const chip = document.createElement("div");
            chip.style.cssText = "background:#eaf6ff;color:#2c5a91;padding:4px 8px;border-radius:16px;font-size:0.85rem;font-weight:500;display:flex;align-items:center;gap:6px;border:1px solid #5fa8e9;";
            
            const texto = document.createElement("span");
            texto.textContent = categoria.nombre;
            chip.appendChild(texto);
            
            const closeBtn = document.createElement("span");
            closeBtn.textContent = "×";
            closeBtn.style.cssText = "cursor:pointer;color:#d63031;font-weight:700;font-size:1.1rem;";
            closeBtn.title = "Quitar filtro";
            closeBtn.onclick = () => {
                // Quitar de categorías seleccionadas
                categoriasSeleccionadas = categoriasSeleccionadas.filter(cat => cat.id !== categoria.id);
                actualizarChips();
                actualizarSelect();
                mostrarLibrosLeidosMultipleFiltro(data.club, categoriasSeleccionadas);
            };
            chip.appendChild(closeBtn);
            
            return chip;
        }

        // Función para actualizar los chips
        function actualizarChips() {
            chipsContainer.innerHTML = "";
            categoriasSeleccionadas.forEach(cat => {
                chipsContainer.appendChild(crearChipCategoria(cat));
            });
            
            // Mostrar mensaje si no hay filtros
            if (categoriasSeleccionadas.length === 0) {
                const placeholder = document.createElement("span");
                placeholder.textContent = "Sin filtros aplicados";
                placeholder.style.cssText = "color:#636e72;font-style:italic;font-size:0.85rem;";
                chipsContainer.appendChild(placeholder);
            }
        }

        // Event listener para el select
        select.onchange = function() {
            const categoriaId = parseInt(select.value);
            if (categoriaId) {
                const categoria = todasCategorias.find(cat => cat.id === categoriaId);
                if (categoria && !categoriasSeleccionadas.some(sel => sel.id === categoria.id)) {
                    categoriasSeleccionadas.push(categoria);
                    actualizarChips();
                    actualizarSelect();
                    mostrarLibrosLeidosMultipleFiltro(data.club, categoriasSeleccionadas);
                }
            }
            select.value = ""; // Reset del select
        };

        // Inicializar
        actualizarSelect();
        actualizarChips();
        mostrarLibrosLeidosMultipleFiltro(data.club, categoriasSeleccionadas);

    } catch (error) {
        mostrarClubNoEncontrado("No se pudo cargar el club.");
    }
}

// Nueva función para mostrar libros filtrados
function mostrarLibrosLeidosFiltrados(club, filtroCategoriaId) {
    const librosList = document.getElementById('libros-leidos-list');
    librosList.innerHTML = "";
    const userId = localStorage.getItem("userId");
    const isOwner = club.id_owner == userId;
    let libros = club.readBooks || [];
    if (filtroCategoriaId) {
        libros = libros.filter(libro =>
            libro.categorias.some(cat => String(cat.id) === String(filtroCategoriaId))
        );
    }
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
            card.style.minHeight = '320px';
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
                        <button class="btn-comentarios" data-bookid="${libro.id}" style="background:#eaf6ff;color:#2c5a91;border:none;border-radius:8px;padding:0.4rem 0.8rem;font-weight:600;cursor:pointer;margin-top:10px;">💬 Comentarios</button>
                    </div>
                </div>
            `;

            if (isOwner) {
                agregarBotonEliminarLibro(card, libro.id);
            }

            librosList.appendChild(card);
        });
    } else {
        librosList.innerHTML = '<div style="color:#636e72;">No hay libros leídos en esta categoría.</div>';
    }
}

// Nueva función para mostrar libros con filtros múltiples
function mostrarLibrosLeidosMultipleFiltro(club, categoriasSeleccionadas) {
    const librosList = document.getElementById('libros-leidos-list');
    librosList.innerHTML = "";
    const userId = localStorage.getItem("userId");
    const isOwner = club.id_owner == userId;
    let libros = club.readBooks || [];
    
    // Si hay categorías seleccionadas, filtrar libros
    if (categoriasSeleccionadas.length > 0) {
        libros = libros.filter(libro => {
            // El libro debe tener AL MENOS UNA de las categorías seleccionadas
            return libro.categorias.some(catLibro => 
                categoriasSeleccionadas.some(catSel => catSel.id === catLibro.id)
            );
        });
    }
    
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
            card.style.minHeight = '320px';
            card.style.position = 'relative';

            const categoriasHTML = libro.categorias
                .map(cat => {
                    // Destacar categorías que están siendo filtradas
                    const isFiltered = categoriasSeleccionadas.some(catSel => catSel.id === cat.id);
                    const bgColor = isFiltered ? '#5fa8e9' : '#eaf6ff';
                    const textColor = isFiltered ? '#fff' : '#2c5a91';
                    return `<span style="background:${bgColor};color:${textColor};padding:2px 6px;border-radius:8px;font-size:0.8rem;margin-right:4px;font-weight:${isFiltered ? '600' : '500'};">${cat.nombre}</span>`;
                })
                .join(" ");

            card.innerHTML = `
                <div style='width:100%;display:flex;flex-direction:column;align-items:center;'>
                    ${libro.portada ? `<img src='${libro.portada}' style='width:100%;height:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0, 0, 0, 0.1);margin-bottom:1rem;'>` : `<div style='width:100%;height:150px;background:#eaf6ff;border-radius:8px;margin-bottom:1rem;'></div>`}
                    <div style='text-align:center;'>
                        <strong style='color:#2c5a91;font-size:1.1rem;'>${libro.title}</strong>
                        ${libro.author ? `<br><span style="color:#636e72;font-size:0.9rem;">de ${libro.author}</span>` : ''}
                        <div style="margin-top:6px;">${categoriasHTML}</div>
                        <button class="btn-comentarios" data-bookid="${libro.id}" style="background:#eaf6ff;color:#2c5a91;border:none;border-radius:8px;padding:0.4rem 0.8rem;font-weight:600;cursor:pointer;margin-top:10px;">💬 Comentarios</button>
                    </div>
                </div>
            `;

            if (isOwner) {
                agregarBotonEliminarLibro(card, libro.id);
            }

            librosList.appendChild(card);
        });
    } else {
        const mensaje = categoriasSeleccionadas.length > 0 
            ? `No hay libros que coincidan con los filtros seleccionados.`
            : `No hay libros leídos aún.`;
        librosList.innerHTML = `<div style="color:#636e72;">${mensaje}</div>`;
    }
}

// Helpers

function mostrarClubNoEncontrado(msg) {
    document.getElementById('club-name').textContent = "Club no encontrado";
    document.getElementById('club-description').textContent = msg;
}

function mostrarDatosClub(club) {
    document.getElementById('club-name').textContent = club.name;
    document.getElementById('club-imagen').src = club.imagen || '../images/BooksyLogo.png'; // Imagen por defecto
    document.getElementById('club-description').textContent = club.description;
    obtenerDatosOwner(club.id_owner);
    mostrarBotonesAccion(club);
}

function mostrarBotonesAccion(club) {
    const userId = localStorage.getItem("userId");
    const eliminarBtn = document.getElementById("eliminarClubBtn");
    const salirBtn = document.getElementById("salirClubBtn");
    if (club.id_owner == userId) {
        eliminarBtn.style.display = "inline-block";
    } else {
        salirBtn.style.display = "inline-block";
    }
}

function mostrarIntegrantes(club) {
    const membersList = document.getElementById('club-members-list');
    membersList.innerHTML = "";
    const userId = localStorage.getItem("userId");
    const isOwner = club.id_owner == userId;
    if (club.members && club.members.length > 0) {
        club.members.forEach(m => {
            const li = document.createElement('li');
            li.textContent = m.username;
            li.style.cssText = 'padding:0.5em 0;color:#2c5a91;font-weight:500;border-bottom:1px solid #eaf6ff;';
            if (isOwner && m.id != userId) {
                const btn = document.createElement('button');
                btn.textContent = 'Eliminar';
                btn.style.cssText = 'margin-left:10px;background:#d63031;color:#fff;border:none;border-radius:8px;padding:0.3rem 0.8rem;font-weight:600;cursor:pointer;';
                btn.onclick = async () => { await eliminarUsuarioDelClub(m.id, club.id); };
                li.appendChild(btn);
            }
            membersList.appendChild(li);
        });
    } else {
        membersList.innerHTML = '<li style="color:#636e72;">No hay integrantes aún.</li>';
    }
}

function mostrarSolicitudes(club) {
    const solicitudesContainer = document.getElementById('solicitudes-container');
    const solicitudesList = document.getElementById('solicitudes-list');
    const userId = localStorage.getItem("userId");
    const isOwner = club.id_owner == userId;
    if (isOwner && club.solicitudes && club.solicitudes.length > 0) {
        const pendientes = club.solicitudes.filter(s => s.estado === "pendiente");
        if (pendientes.length > 0) {
            solicitudesContainer.style.display = 'block';
            solicitudesList.innerHTML = '';
            pendientes.forEach(solicitud => {
                const item = document.createElement('div');
                item.style.cssText = 'background:#eaf6ff;padding:1rem 1.2rem;border-radius:10px;display:flex;align-items:center;justify-content:space-between;';
                item.innerHTML = `<span style='color:#2c5a91;font-weight:600;'>${solicitud.username}</span> <span style='color:#636e72;'>quiere unirse</span>`;
                const btns = document.createElement('div');
                btns.style.display = 'flex';
                btns.style.gap = '10px';
                const aceptarBtn = document.createElement('button');
                aceptarBtn.textContent = 'Aceptar';
                aceptarBtn.style.cssText = 'background:#0984e3;color:#fff;border:none;border-radius:8px;padding:0.5rem 1.2rem;font-weight:600;cursor:pointer;';
                aceptarBtn.onclick = async () => { await gestionarSolicitud(solicitud.id, true); };
                const rechazarBtn = document.createElement('button');
                rechazarBtn.textContent = 'Rechazar';
                rechazarBtn.style.cssText = 'background:#d63031;color:#fff;border:none;border-radius:8px;padding:0.5rem 1.2rem;font-weight:600;cursor:pointer;';
                rechazarBtn.onclick = async () => { await gestionarSolicitud(solicitud.id, false); };
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
}

function mostrarLibrosLeidos(club) {
    const librosList = document.getElementById('libros-leidos-list');
    librosList.innerHTML = "";
    const userId = localStorage.getItem("userId");
    const isOwner = club.id_owner == userId;
    if (club.readBooks && club.readBooks.length > 0) {
        club.readBooks.forEach(libro => {
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
            const categoriasHTML = libro.categorias
                .map(cat => `<span style="background:#eaf6ff;color:#2c5a91;padding:2px 6px;border-radius:8px;font-size:0.8rem;margin-right:4px;">${cat.nombre}</span>`)
                .join(" ");
            card.innerHTML = `
                <div style='width:100%;display:flex;align-items:center;gap:10px;'>
                    ${libro.portada ? `<img src='${libro.portada}' style='width:48px;height:auto;border-radius:6px;'>` : ` ... `}
                    <div>
                        <strong style='color:#2c5a91;font-size:1.15rem;'>${libro.title}</strong>
                        ${libro.author ? '<br><span style="color:#636e72;">de ' + libro.author + '</span>' : ''}
                        <div style="margin-top:10px;">
   <button class="btn-comentarios" data-bookid="${libro.id}" style="background:#eaf6ff;color:#2c5a91;border:none;border-radius:8px;padding:0.4rem 0.8rem;font-weight:600;cursor:pointer;">💬 Comentarios</button>
</div>

                        <div style="margin-top:6px;">${categoriasHTML}</div>
                    </div>
                </div>
            `;
            if (isOwner) {
                agregarBotonEliminarLibro(card, libro.id);
            }
            librosList.appendChild(card);
        });
    } else {
        librosList.innerHTML = '<div style="color:#636e72;">No hay libros leídos aún.</div>';
    }
}

function agregarBotonEliminarLibro(card, bookId) {
    const deleteBtn = document.createElement('span');
    deleteBtn.textContent = '❌';
    deleteBtn.style.cssText = 'color:#d63031;cursor:pointer;font-size:1.3rem;position:absolute;top:10px;right:14px;';
    deleteBtn.title = 'Eliminar libro';
    deleteBtn.onclick = () => {
        mostrarConfirmacion(
            "¿Eliminar este libro?",
            "El libro será removido del club y ya no aparecerá en la lista de libros leídos.",
            async () => {
                const clubId = getClubId();
                const username = localStorage.getItem("username");
                await eliminarLibro(bookId, clubId, username);
                renderClub();
            },
            null,
            {
                confirmText: "Eliminar Libro",
                cancelText: "Cancelar",
                confirmClass: "red-btn",
                cancelClass: "green-btn"
            }
        );
    };
    card.appendChild(deleteBtn);
}

async function eliminarLibro(bookId, clubId, username) {
    showLoader("Eliminando libro...");
    try {
        const res = await fetch(`${API_URL}/club/${clubId}/deleteBook/${bookId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            hideLoader();
            showNotification("error", data.message || "Error al eliminar libro");
        } else {
            showNotification("success", "Libro eliminado");
            hideLoader();
        }
    } catch (error) {
        hideLoader();
        showNotification("error", "Error de conexión al eliminar libro");
    }
}


// --- CATEGORÍAS ---
let categoriasDisponibles = [];
const categoriasContainer = document.getElementById("categoriasContainer");
const nuevaCategoriaInput = document.getElementById("nuevaCategoriaInput");
const agregarCategoriaBtn = document.getElementById("agregarCategoriaBtn");

agregarCategoriaBtn.addEventListener('click', async () => {
    const nombre = nuevaCategoriaInput.value.trim();
    if (!nombre) return;
    // Evitar duplicados
    if (categoriasDisponibles.some(cat => cat.nombre.toLowerCase() === nombre.toLowerCase())) {
        showNotification("warning", "La categoría ya existe");
        return;
    }
    showLoader("Creando categoría...");
    try {
        const res = await fetch(`${API_URL}/categorias`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre })
        });
        const data = await res.json();
        if (data.success && data.categoria) {
            categoriasDisponibles.push(data.categoria);
            renderCategoriasCheckboxes();
            nuevaCategoriaInput.value = '';
            hideLoader();
            showNotification("success", "Categoría creada");
        } else {
            hideLoader();
            showNotification("error", "Error al crear categoría");
        }
    } catch (error) {
        hideLoader();
        showNotification("error", "Error al crear categoría");
    }
});

// Cargar categorías al abrir modal
document.querySelector('.agregar-libro-btn').addEventListener('click', () => {
        document.getElementById('modalLibro').style.display = 'block';
        cargarCategorias();
        // Mostrar input de crear categoría solo si es owner
        const clubId = getClubId();
        fetch(`${API_URL}/club/${clubId}`)
            .then(res => res.json())
            .then(data => {
                const userId = localStorage.getItem("userId");
                const isOwner = data.club && data.club.id_owner == userId;
                document.getElementById('crearCategoriaBox').style.display = isOwner ? 'block' : 'none';
            });
});
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
        console.log(libro);
        div.onclick = () => {
            // Restablecer el estilo de todos los elementos
            document.querySelectorAll(".busqueda-libro-item").forEach(item => {
                item.style.background = "#eaf6ff";
                item.style.border = "2px solid #5fa8e9";
            });

            // Resaltar el libro seleccionado
            div.style.background = "#d1e7ff";
            div.style.border = "2px solid #0984e3";

            // Mostrar datos del libro seleccionado en la consola
            console.log("Libro seleccionado:", libro);

            // Actualizar los valores del formulario
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
    // Obtener categorías seleccionadas
    const categoriasSeleccionadas = Array.from(document.querySelectorAll('.categoria-checkbox:checked')).map(cb => cb.value);
    if (categoriasSeleccionadas.length === 0) {
        msg.textContent = "Seleccioná al menos una categoría";
        msg.style.background = "#ffeaea";
        msg.style.color = "#d63031";
        msg.style.display = "block";
        return;
    }
    showLoader("Agregando libro al club...");
    try {
        const res = await fetch(`${API_URL}/club/${clubId}/addBook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, author, thumbnail, id_api, categorias: categoriasSeleccionadas })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            hideLoader();
            msg.textContent = "Libro agregado con éxito";
            msg.style.background = "#eaf6ff";
            msg.style.color = "#0984e3";
            msg.style.display = "block";
            setTimeout(() => { document.getElementById('modalLibro').style.display='none'; renderClub(); }, 1200);
        } else {
            hideLoader();
            msg.textContent = data.message || "Error al agregar libro";
            msg.style.background = "#ffeaea";
            msg.style.color = "#d63031";
            msg.style.display = "block";
        }
    } catch (error) {
        hideLoader();
        msg.textContent = "Error de conexión con el servidor";
        msg.style.background = "#ffeaea";
        msg.style.color = "#d63031";
        msg.style.display = "block";
    }
});







// --- COMENTARIOS ---
const modalComentarios = document.getElementById("modalComentarios");
const closeModalComentarios = document.getElementById("closeModalComentarios");
const comentariosList = document.getElementById("comentariosList");
const nuevoComentario = document.getElementById("nuevoComentario");
const enviarComentarioBtn = document.getElementById("enviarComentarioBtn");
let currentBookId = null;

closeModalComentarios.onclick = () => { modalComentarios.style.display = "none"; };

document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-comentarios")) {
    currentBookId = e.target.dataset.bookid;
    const clubId = getClubId();
    modalComentarios.style.display = "flex";
    await cargarComentarios(currentBookId, clubId);
  }
});

async function cargarComentarios(bookId, clubId) {
  comentariosList.innerHTML = "<span style='color:#636e72;'>Cargando comentarios...</span>";
  try {
    const res = await fetch(`${API_URL}/comentario/book/${bookId}/club/${clubId}`);
    const data = await res.json();

    if (data.success && Array.isArray(data.comentarios)) {
      if (data.comentarios.length === 0) {
        comentariosList.innerHTML = "<span style='color:#636e72;'>No hay comentarios aún.</span>";
      } else {
        comentariosList.innerHTML = "";

        const userId = Number(localStorage.getItem("userId"));
        const clubRes = await fetch(`${API_URL}/club/${clubId}`);
        const clubData = await clubRes.json();
        const isOwner = clubData.club && clubData.club.id_owner == userId;

        data.comentarios.forEach(c => {
          const div = document.createElement("div");
          div.style.cssText = "background:#f5f9ff;padding:0.6rem;border-radius:8px;color:#2c5a91;position:relative;";

          div.innerHTML = `<strong>${c.user.username}</strong>: ${c.content}`;

          // Mostrar ❌ si sos dueño del comentario o moderador
          if (isOwner || c.userId === userId) {
            const deleteBtn = document.createElement("span");
            deleteBtn.textContent = "❌";
            deleteBtn.title = "Eliminar comentario";
            deleteBtn.style.cssText = "position:absolute;top:6px;right:8px;cursor:pointer;color:#d63031;font-size:1rem;";
            deleteBtn.onclick = async () => {
              mostrarConfirmacion(
                "¿Eliminar este comentario?",
                "El comentario será eliminado permanentemente y no se podrá recuperar.",
                async () => {
                  await eliminarComentario(c.id, bookId, clubId);
                },
                null,
                {
                  confirmText: "Eliminar",
                  cancelText: "Cancelar",
                  confirmClass: "red-btn",
                  cancelClass: "green-btn"
                }
              );
            };
            div.appendChild(deleteBtn);
          }

          comentariosList.appendChild(div);
        });
      }
    } else {
      comentariosList.innerHTML = "<span style='color:#d63031;'>Error al cargar comentarios</span>";
    }
  } catch {
    comentariosList.innerHTML = "<span style='color:#d63031;'>Error de conexión</span>";
  }
}

async function eliminarComentario(comentarioId, bookId, clubId) {
  showLoader("Eliminando comentario...");
  try {
    const res = await fetch(`${API_URL}/comentario/${comentarioId}`, {
      method: "DELETE"
    });
    const data = await res.json();
    if (data.success) {
      await cargarComentarios(bookId, clubId);
      hideLoader();
      showNotification("success", "Comentario eliminado");
    } else {
      hideLoader();
      showNotification("error", data.message || "No se pudo eliminar el comentario");
    }
  } catch {
    hideLoader();
    showNotification("error", "Error de conexión al eliminar comentario");
  }
}



enviarComentarioBtn.onclick = async () => {
  const texto = nuevoComentario.value.trim();
  if (!texto) return;
  showLoader("Enviando comentario...");
  try {
    const userId = localStorage.getItem("userId");
    const clubId = getClubId();
    const res = await fetch(`${API_URL}/comentario`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, bookId: currentBookId, clubId, content: texto })
    });
    const data = await res.json();
    if (data.success) {
      nuevoComentario.value = "";
      await cargarComentarios(currentBookId, clubId);
      hideLoader();
      showNotification("success", "Comentario enviado");
    } else {
      hideLoader();
      showNotification("error", data.message || "No se pudo enviar el comentario");
    }
  } catch {
    hideLoader();
    showNotification("error", "Error de conexión");
  }
};

async function eliminarClub(){
    mostrarConfirmacion(
        "¿Eliminar este club?",
        "Esta acción no se puede deshacer. Se eliminará el club y toda su información.",
        async () => {
            const clubId = getClubId();
            showLoader("Eliminando club...");
            try {
                const res = await fetch(`${API_URL}/deleteClub/${clubId}`, {
                    method: "DELETE"
                });
                const data = await res.json();
                if (data.success) {
                    showLoader("Club eliminado! Redirigiendo...");
                    showNotification("success", "Club eliminado con éxito");
                    setTimeout(() => {
                        window.location.href = "main.html";
                    }, 1500);
                } else {
                    hideLoader();
                    showNotification("error", data.message || "No se pudo eliminar el club");
                }
            } catch {
                hideLoader();
                showNotification("error", "Error de conexión");
            }
        },
        null,
        {
            confirmText: "Eliminar Club",
            cancelText: "Cancelar",
            confirmClass: "red-btn",
            cancelClass: "green-btn"
        }
    );
}

async function salirDelClub(){
    mostrarConfirmacion(
        "¿Salir de este club?",
        "Ya no serás miembro y perderás acceso a los contenidos del club.",
        async () => {
            const clubId = getClubId();
            const userId = localStorage.getItem("userId");
            showLoader("Saliendo del club...");
            try {
                const res = await fetch(`${API_URL}/club/${clubId}/leave`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId })
                });
                const data = await res.json();
                if (data.success) {
                    showLoader("Has salido del club! Redirigiendo...");
            showNotification("success", "Has salido del club");
            setTimeout(() => {
                window.location.href = "main.html";
            }, 1500);
                } else {
                    hideLoader();
                    showNotification("error", data.message || "No se pudo salir del club");
                }
            } catch {
                hideLoader();
                showNotification("error", "Error de conexión");
            }
        },
        null,
        {
            confirmText: "Salir del Club",
            cancelText: "Cancelar",
            confirmClass: "red-btn",
            cancelClass: "green-btn"
        }
    );
}

// Event listeners para los botones
document.addEventListener('DOMContentLoaded', () => {
    const eliminarBtn = document.getElementById('eliminarClubBtn');
    const salirBtn = document.getElementById('salirClubBtn');
    
    if (eliminarBtn) {
        eliminarBtn.addEventListener('click', eliminarClub);
    }
    
    if (salirBtn) {
        salirBtn.addEventListener('click', salirDelClub);
    }
});

renderClub();