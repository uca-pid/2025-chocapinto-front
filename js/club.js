import { API_URL } from "./env.js";
import { showNotification } from "../componentes/notificacion.js";
import { showLoader, hideLoader } from "../componentes/loader.js";
import { mostrarConfirmacion, confirmarEliminacion } from "../componentes/confirmacion.js";

// Variable global para almacenar datos del club
window.clubData = null;

// ========== FUNCIONES DEL HEADER ==========

/**
 * Cierra sesión del usuario
 */
function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    window.location.href = "index.html";
}

/**
 * Configura el dropdown del perfil
 */
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
/**
 * Actualiza el display del username en el header
 */
function updateUsernameDisplay() {
    const username = localStorage.getItem("username");
    const usernameDisplay = document.getElementById("usernameDisplay");
    const usernameDisplayHover = document.getElementById("usernameDisplayHover");
    const userInitials = document.getElementById("userInitials");
    
    if (username) {
        // Actualizar displays antiguos si existen
        if (usernameDisplay) {
            usernameDisplay.textContent = username;
        }
        if (usernameDisplayHover) {
            usernameDisplayHover.textContent = username;
        }
        
        // Actualizar nuevo header
        if (userInitials) {
            // Sacar las iniciales del username (primera letra)
            userInitials.textContent = username.charAt(0).toUpperCase();
        }
    }
}

// Exponer funciones al ámbito global
window.logout = logout;

//inicializador de pagina
console.log("Cargando archivo club.js...");
console.log("API_URL:", API_URL);


showLoader("Cargando club...");
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Content Loaded");
    
    // Configurar header
    updateUsernameDisplay();
    configurarDropdownPerfil();
    // Configurar event listeners para cambio de tabs
    setupTabNavigation();
    
    // Configurar event listeners para botones
    setupButtonEventListeners();
    
    // Configurar modal de libros
    setupModalLibro();
    
    // Simular un pequeño delay para mostrar el loader
    setTimeout(() => {
        try {
            hideLoader();
            console.log("Loader ocultado, iniciando renderClub...");
            renderClub(); // Llamar renderClub después de ocultar el loader
        } catch (error) {
            console.error("Error en el timeout:", error);
            // Fallback simple sin loader
            document.getElementById('club-name').textContent = "Error de carga";
            document.getElementById('club-description').textContent = error.message;
        }
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

// Función para obtener información visual del estado del libro
function getEstadoInfo(estado) {
    switch(estado) {
        case 'leido':
            return {
                background: '#d1f2eb',
                color: '#00b894',
                border: '#00b894',
                icon: '✅',
                label: 'Leído'
            };
        case 'leyendo':
            return {
                background: '#d6eaf8',
                color: '#3498db',
                border: '#3498db',
                icon: '📖',
                label: 'Leyendo'
            };
        case 'por_leer':
        default:
            return {
                background: '#fef9e7',
                color: '#f39c12',
                border: '#f39c12',
                icon: '📚',
                label: 'Por leer'
            };
    }
}

// Función auxiliar para mostrar todos los libros
function mostrarTodosLosLibros() {
    console.log('Mostrar todos los libros');
    // Aquí iría la lógica para mostrar todos los libros
    // Se podría expandir la vista o navegar a una página de biblioteca completa
}

// Función para cambiar el estado de un libro
async function cambiarEstadoLibro(bookId, nuevoEstado) {
    const clubId = getClubId();
    const username = localStorage.getItem("username");
    
    if (!username) {
        showNotification("error", "Usuario no identificado");
        return;
    }

    showLoader("Cambiando estado del libro...");
    
    try {
        const res = await fetch(`${API_URL}/club/${clubId}/book/${bookId}/estado`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                estado: nuevoEstado,
                username: username 
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            hideLoader();
            showNotification("success", `Estado cambiado a: ${getEstadoLabel(nuevoEstado)}`);
            // Recargar los datos del club para actualizar las estadísticas
            renderClub();
            // Actualizar la sección de progreso de lectura
            if (typeof cargarProgresoLectura === 'function') {
                cargarProgresoLectura();
            }
        } else {
            hideLoader();
            showNotification("error", data.message || "Error al cambiar el estado");
        }
    } catch (error) {
        hideLoader();
        console.error("Error al cambiar estado:", error);
        showNotification("error", "Error de conexión al cambiar estado");
    }
}

// Función auxiliar para obtener el label del estado
function getEstadoLabel(estado) {
    switch(estado) {
        case 'leido': return '✅ Leído';
        case 'leyendo': return '📖 Leyendo';
        case 'por_leer': return '📚 Por leer';
        default: return estado;
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
    console.log("Club ID obtenido:", clubId);
    if (!clubId) {
        mostrarClubNoEncontrado("No se especificó el club.");
        return;
    }
    try {
        console.log("Haciendo fetch al club...");
        const res = await fetch(`${API_URL}/club/${clubId}`);
        const data = await res.json();
        console.log("Datos del club recibidos:", data);
        if (!res.ok || !data.success) {
            console.log("Error en la respuesta:", data.message);
            mostrarClubNoEncontrado(data.message || "No existe el club.");
            return;
        }
        // Almacenar datos del club globalmente
        window.clubData = data.club;
        
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
                aplicarFiltros(data.club, categoriasSeleccionadas);
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
                    aplicarFiltros(data.club, categoriasSeleccionadas);
                }
            }
            select.value = ""; // Reset del select
        };

        // Inicializar
        actualizarSelect();
        actualizarChips();
        aplicarFiltros(data.club, categoriasSeleccionadas);

        // Actualizar las secciones adicionales
        setTimeout(() => {
            if (typeof cargarProgresoLectura === 'function') {
                cargarProgresoLectura();
            }
            if (typeof cargarCategoriasClub === 'function') {
                cargarCategoriasClub();
            }
        }, 500);

    } catch (error) {
        console.error("Error al cargar el club:", error);
        hideLoader();
        mostrarClubNoEncontrado(`No se pudo cargar el club. Error: ${error.message}`);
    }
}


// Variables para filtros
let filtroTexto = '';
let filtroEstado = 'todos';


// Función principal de filtrado que combina búsqueda de texto, estado y categorías
function aplicarFiltros(club, categoriasSeleccionadas = []) {
    const librosList = document.getElementById('libros-leidos-list');
    librosList.innerHTML = "";
    const userId = localStorage.getItem("userId");
    const isOwner = club.id_owner == userId;
    
    // Actualizar estadísticas
    actualizarEstadisticas(club);
    
    let libros = club.readBooks || [];
    
    // Aplicar filtro de texto
    if (filtroTexto.trim()) {
        const texto = filtroTexto.toLowerCase();
        libros = libros.filter(libro => 
            libro.title.toLowerCase().includes(texto) ||
            (libro.author && libro.author.toLowerCase().includes(texto)) ||
            libro.categorias.some(cat => cat.nombre.toLowerCase().includes(texto))
        );
    }
    
    // Aplicar filtro de estado
    if (filtroEstado !== 'todos') {
        libros = libros.filter(libro => libro.estado === filtroEstado);
    }
    
    // Aplicar filtro de categorías (si se proporcionan)
    if (categoriasSeleccionadas.length > 0) {
        libros = libros.filter(libro => {
            // El libro debe tener AL MENOS UNA de las categorías seleccionadas
            return libro.categorias.some(catLibro => 
                categoriasSeleccionadas.some(catSel => catSel.id === catLibro.id)
            );
        });
    }
    
    // Mostrar libros filtrados
    if (libros.length > 0) {
        libros.forEach(libro => {
            const card = document.createElement('div');
            card.className = 'modern-book-card';
            
            // Generar rating aleatorio entre 3.5 y 5.0 para demo
            const rating = (Math.random() * 1.5 + 3.5).toFixed(1);
            
            // Obtener la primera categoría para mostrar como tag
            const primeraCategoria = libro.categorias && libro.categorias.length > 0 
                ? libro.categorias[0].nombre 
                : 'General';
            
            // Obtener información del estado
            const estadoInfo = getEstadoInfo(libro.estado);
            const estadoClass = `status-${libro.estado}`;
            
            card.innerHTML = `
                <div class="book-card-content">
                    <div class="book-cover-section">
                        <div class="book-cover-modern">
                            ${libro.portada 
                                ? `<img src="${libro.portada}" alt="${libro.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                                : ''
                            }
                            <div class="book-cover-placeholder" ${libro.portada ? 'style="display:none;"' : ''}>📚</div>
                        </div>
                    </div>
                    
                    <div class="book-info-section">
                        <h4 class="book-title-modern">${libro.title}</h4>
                        <p class="book-author-modern">${libro.author || 'Autor desconocido'}</p>
                        
                        <div class="book-rating">
                            <span class="rating-stars">⭐</span>
                            <span class="rating-number">${rating}</span>
                        </div>
                        
                        <div class="book-meta">
                            ${isOwner 
                                ? `<select class="book-status-badge estado-selector ${estadoClass}" data-bookid="${libro.id}">
                                    <option value="por_leer" ${libro.estado === 'por_leer' ? 'selected' : ''}>Por leer</option>
                                    <option value="leyendo" ${libro.estado === 'leyendo' ? 'selected' : ''}>Leyendo</option>
                                    <option value="leido" ${libro.estado === 'leido' ? 'selected' : ''}>Completado</option>
                                   </select>`
                                : `<span class="book-status-badge ${estadoClass}">${estadoInfo.label}</span>`
                            }
                            <span class="book-category-tag">${primeraCategoria}</span>
                        </div>
                    </div>
                </div>
                
                <div class="book-actions">
                    <button class="book-action-btn btn-comentarios" data-bookid="${libro.id}" title="Ver comentarios">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                    </button>
                    ${isOwner ? `
                        <button class="book-action-btn delete-btn-modern" data-bookid="${libro.id}" title="Eliminar libro">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="m19,6v14a2,2 0,0 1,-2,2H7a2,2 0,0 1,-2,-2V6m3,0V4a2,2 0,0 1,2,-2h4a2,2 0,0 1,2,2v2"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            `;
            
            librosList.appendChild(card);
        });
    } else {
        let mensaje = 'No hay libros aún.';
        let filtros = [];
        
        if (filtroTexto.trim()) filtros.push(`"${filtroTexto}"`);
        if (filtroEstado !== 'todos') filtros.push(`estado "${getEstadoLabel(filtroEstado)}"`);
        if (categoriasSeleccionadas.length > 0) {
            const categorias = categoriasSeleccionadas.map(cat => cat.nombre).join(', ');
            filtros.push(`categorías ${categorias}`);
        }
        
        if (filtros.length > 0) {
            mensaje = `No hay libros que coincidan con los filtros: ${filtros.join(', ')}.`;
        }
        
        librosList.innerHTML = `<div style="color:#636e72;text-align:center;padding:2rem;">${mensaje}</div>`;
    }
}

// Helpers

function mostrarClubNoEncontrado(msg) {
    console.log("Mostrando club no encontrado:", msg);
    hideLoader(); // Asegurar que el loader se oculte
    const nameElement = document.getElementById('club-name');
    const descElement = document.getElementById('club-description');
    
    if (nameElement) nameElement.textContent = "Club no encontrado";
    if (descElement) descElement.textContent = msg;
}

function mostrarDatosClub(club) {
    console.log("Mostrando datos del club:", club);
    const nameElement = document.getElementById('club-name');
    const imageElement = document.getElementById('club-imagen');
    const descElement = document.getElementById('club-description');
    
    // Elementos del sidebar para Principal y Notificaciones
    const sidebarNameElement = document.getElementById('sidebar-club-name');
    const sidebarImageElement = document.getElementById('sidebar-club-imagen');
    const sidebarDescElement = document.getElementById('sidebar-club-description');
    const sidebarNameElement2 = document.getElementById('sidebar-club-name-2');
    const sidebarImageElement2 = document.getElementById('sidebar-club-imagen-2');
    const sidebarDescElement2 = document.getElementById('sidebar-club-description-2');
    
    console.log("Elementos encontrados:", { nameElement, imageElement, descElement });
    
    const imageSrc = club.imagen || '../images/BooksyLogo.png';
    
    // Actualizar elementos principales (sección Club)
    if (nameElement) {
        nameElement.textContent = club.name;
        console.log("Nombre del club establecido:", club.name);
    }
    if (imageElement) {
        imageElement.src = imageSrc;
        console.log("Imagen del club establecida:", imageSrc);
        // Agregar un handler para errores de carga de imagen
        imageElement.onerror = function() {
            console.log("Error cargando imagen, usando fallback");
            this.src = '../images/BooksyLogo.png';
        };
    }
    if (descElement) {
        descElement.textContent = club.description;
        console.log("Descripción del club establecida:", club.description);
    }
    
    // Actualizar elementos del sidebar (sección Principal)
    if (sidebarNameElement) {
        sidebarNameElement.textContent = club.name;
    }
    if (sidebarImageElement) {
        if (club.imagen && club.imagen.trim() !== '') {
            sidebarImageElement.src = imageSrc;
            sidebarImageElement.style.display = 'block';
            sidebarImageElement.onerror = function() {
                this.style.display = 'none';
                this.parentElement.classList.add('no-image');
            };
            sidebarImageElement.parentElement.classList.remove('no-image');
        } else {
            sidebarImageElement.style.display = 'none';
            sidebarImageElement.parentElement.classList.add('no-image');
        }
    }
    if (sidebarDescElement) {
        sidebarDescElement.textContent = club.description;
    }
    
    // Actualizar elementos del sidebar (sección Notificaciones)
    if (sidebarNameElement2) {
        sidebarNameElement2.textContent = club.name;
    }
    if (sidebarImageElement2) {
        sidebarImageElement2.src = imageSrc;
        sidebarImageElement2.onerror = function() {
            this.src = '../images/BooksyLogo.png';
        };
    }
    if (sidebarDescElement2) {
        sidebarDescElement2.textContent = club.description;
    }
    
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
    
    // Actualizar contador de miembros en el badge
    const membersCountBadge = document.querySelector('.club-badge span');
    if (membersCountBadge) {
        membersCountBadge.textContent = club.members ? club.members.length : 0;
    }
    
    // Actualizar contador en sección Principal si existe
    const totalMembersCounter = document.getElementById('total-members');
    if (totalMembersCounter) {
        totalMembersCounter.textContent = club.members ? club.members.length : 0;
    }
    
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

function actualizarEstadisticas(club) {
    // Contadores por estado
    let librosLeidos = 0;
    let librosLeyendo = 0;
    let librosPorLeer = 0;
    
    // Actualizar contadores de libros por estado
    const totalBooksCounter = document.getElementById('total-books');
    const readingBooksCounter = document.getElementById('reading-books');
    const pendingBooksCounter = document.getElementById('pending-books');
    
    if (club.readBooks) {
        club.readBooks.forEach(libro => {
            if (libro.estado === 'leido') {
                librosLeidos++;
            } else if (libro.estado === 'leyendo') {
                librosLeyendo++;
            } else if (libro.estado === 'por_leer') {
                librosPorLeer++;
            }
        });
    }
    
    if (totalBooksCounter) {
        totalBooksCounter.textContent = librosLeidos;
    }
    if (readingBooksCounter) {
        readingBooksCounter.textContent = librosLeyendo;
    }
    if (pendingBooksCounter) {
        pendingBooksCounter.textContent = librosPorLeer;
    }
    
    // Actualizar contador de categorías (categorías únicas)
    const totalCategoriesCounter = document.getElementById('total-categories');
    if (totalCategoriesCounter) {
        const categoriesSet = new Set();
        if (club.readBooks) {
            club.readBooks.forEach(libro => {
                libro.categorias.forEach(cat => categoriesSet.add(cat.id));
            });
        }
        totalCategoriesCounter.textContent = categoriesSet.size;
    }
}

function mostrarLibrosLeidos(club) {
    // Usar la nueva función de filtrado
    aplicarFiltros(club);
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

// Función para configurar el modal de libros
function setupModalLibro() {
    const agregarLibroBtn = document.querySelector('.primary-action-btn');
    if (agregarLibroBtn && !agregarLibroBtn.hasAttribute('data-listener-added')) {
        // Marcar que ya se agregó el listener para evitar duplicados
        agregarLibroBtn.setAttribute('data-listener-added', 'true');
        
        agregarLibroBtn.addEventListener('click', () => {
            console.log("Botón agregar libro clickeado");
            document.getElementById('modalLibro').style.display = 'block';
            cargarCategorias();
            // Mostrar input de crear categoría solo si es owner
            const clubId = getClubId();
            if (clubId) {
                fetch(`${API_URL}/club/${clubId}`)
                    .then(res => res.json())
                    .then(data => {
                        const userId = localStorage.getItem("userId");
                        const isOwner = data.club && data.club.id_owner == userId;
                        const crearCategoriaBox = document.getElementById('crearCategoriaBox');
                        if (crearCategoriaBox) {
                            crearCategoriaBox.style.display = isOwner ? 'block' : 'none';
                        }
                    })
                    .catch(error => {
                        console.error("Error al verificar ownership:", error);
                    });
            }
        });
        console.log("Event listener agregado al botón de agregar libro");
    } else if (!agregarLibroBtn) {
        console.log("No se encontró el botón de agregar libro (.primary-action-btn)");
    }
}
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
    const username = localStorage.getItem("username");
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
            body: JSON.stringify({ title, author, thumbnail, id_api, username, categorias: categoriasSeleccionadas })
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
  if (e.target.classList.contains("btn-comentarios") || e.target.closest(".btn-comentarios")) {
    const button = e.target.classList.contains("btn-comentarios") ? e.target : e.target.closest(".btn-comentarios");
    currentBookId = button.dataset.bookid;
    const clubId = getClubId();
    modalComentarios.style.display = "flex";
    console.log("Cargando comentarios para libro ID:", currentBookId);
    await cargarComentarios(currentBookId, clubId);
  }
  
  if (e.target.classList.contains("delete-btn-modern") || e.target.closest(".delete-btn-modern")) {
    const button = e.target.classList.contains("delete-btn-modern") ? e.target : e.target.closest(".delete-btn-modern");
    const bookId = button.dataset.bookid;
    const clubId = getClubId();
    const username = localStorage.getItem("username");
    
    mostrarConfirmacion(
      "¿Eliminar este libro?",
      "El libro será removido del club y ya no aparecerá en la lista de libros leídos.",
      async () => {
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
  }
});

async function cargarComentarios(bookId, clubId) {
  comentariosList.innerHTML = "<div style='color:#636e72;text-align:center;padding:20px;'>Cargando comentarios...</div>";
  const commentsCount = document.getElementById('comments-count');
  
  try {
    const res = await fetch(`${API_URL}/comentario/book/${bookId}/club/${clubId}`);
    const data = await res.json();

    if (data.success && Array.isArray(data.comentarios)) {
      // Actualizar contador de comentarios
      if (commentsCount) {
        commentsCount.textContent = data.comentarios.length;
      }
      
      if (data.comentarios.length === 0) {
        comentariosList.innerHTML = "<div style='color:#636e72;text-align:center;padding:20px;'>No hay comentarios aún.</div>";
      } else {
        comentariosList.innerHTML = "";

        const userId = Number(localStorage.getItem("userId"));
        const clubRes = await fetch(`${API_URL}/club/${clubId}`);
        const clubData = await clubRes.json();
        const isOwner = clubData.club && clubData.club.id_owner == userId;

        data.comentarios.forEach(c => {
          const commentItem = document.createElement("div");
          commentItem.className = "comment-item";
          
          // Obtener la primera letra del username para el avatar
          const avatarLetter = c.user.username ? c.user.username.charAt(0).toUpperCase() : 'U';
          
          commentItem.innerHTML = `
            <div class="user">
              <div class="user-pic">
                ${avatarLetter}
              </div>
              <div class="user-info">
                <span>${c.user.username}</span>
                <p>Hace un momento</p>
              </div>
            </div>
            <p class="comment-content">${c.content}</p>
          `;

          // Mostrar botón de eliminar si sos dueño del comentario o moderador
          if (isOwner || c.userId === userId) {
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-comment";
            deleteBtn.innerHTML = "❌";
            deleteBtn.title = "Eliminar comentario";
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
            commentItem.appendChild(deleteBtn);
          }

          comentariosList.appendChild(commentItem);
        });
      }
    } else {
      comentariosList.innerHTML = "<div style='color:#d63031;text-align:center;padding:20px;'>Error al cargar comentarios</div>";
      if (commentsCount) commentsCount.textContent = '0';
    }
  } catch {
    comentariosList.innerHTML = "<div style='color:#d63031;text-align:center;padding:20px;'>Error de conexión</div>";
    if (commentsCount) commentsCount.textContent = '0';
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



// Event listener para el botón de enviar (ahora funciona como submit)
document.addEventListener('click', async (e) => {
  if (e.target.id === 'enviarComentarioBtn' || e.target.closest('#enviarComentarioBtn')) {
    e.preventDefault();
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
  }
});

// Event listener para cambiar el estado de los libros
document.addEventListener('change', async (e) => {
  if (e.target.classList.contains('estado-selector')) {
    const bookId = e.target.getAttribute('data-bookid');
    const nuevoEstado = e.target.value;
    await cambiarEstadoLibro(bookId, nuevoEstado);
  }
  
  // Event listener para el filtro de estado
  if (e.target.id === 'estado-filter') {
    filtroEstado = e.target.value;
    if (window.clubData) {
      aplicarFiltros(window.clubData);
    }
  }
});

// Event listener para el filtro de búsqueda de texto
document.addEventListener('input', (e) => {
  if (e.target.id === 'search-books') {
    filtroTexto = e.target.value;
    if (window.clubData) {
      aplicarFiltros(window.clubData);
    }
  }
});

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
                        try {
                            window.location.replace("main.html");
                        } catch (e) {
                            window.location.href = "main.html";
                        }
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
                        try {
                            window.location.replace("main.html");
                        } catch (e) {
                            window.location.href = "main.html";
                        }
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

// Función para configurar event listeners de botones
function setupButtonEventListeners() {
    console.log("Configurando event listeners de botones...");
    
    const eliminarBtn = document.getElementById('eliminarClubBtn');
    const salirBtn = document.getElementById('salirClubBtn');
    
    if (eliminarBtn) {
        eliminarBtn.addEventListener('click', eliminarClub);
        console.log("Event listener agregado a eliminarClubBtn");
    }
    
    if (salirBtn) {
        salirBtn.addEventListener('click', salirDelClub);
        console.log("Event listener agregado a salirClubBtn");
    }
    
    // Configurar event listeners para iconos del header
    const notificationBtn = document.getElementById('notificationBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            console.log("Botón de notificaciones clickeado");
            // Aquí se puede agregar la funcionalidad de notificaciones
            alert("Funcionalidad de notificaciones en desarrollo");
        });
        console.log("Event listener agregado a notificationBtn");
    }
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            console.log("Botón de configuración clickeado");
            // Aquí se puede agregar la funcionalidad de configuración
            alert("Funcionalidad de configuración en desarrollo");
        });
        console.log("Event listener agregado a settingsBtn");
    }
    
    // Configurar modal del gráfico
    configurarModalGrafico();
    
    // Configurar historial del club
    setupHistorialClubEventListeners();
}

// Función para configurar la navegación entre tabs
function setupTabNavigation() {
    console.log("Configurando navegación entre tabs...");
    
    // Detectar cambio de radio button
    const radioButtons = document.querySelectorAll('input[name="plan"]');
    console.log("Radio buttons encontrados:", radioButtons.length);
    
    radioButtons.forEach(radio => {
        radio.addEventListener('change', handleTabChange);
        radio.addEventListener('click', handleTabChange);
    });
    
    // También agregar listeners a las labels por si acaso
    const labels = document.querySelectorAll('label[for^="glass-"]');
    console.log("Labels encontradas:", labels.length);
    
    labels.forEach(label => {
        label.addEventListener('click', () => {
            console.log("Label clickeada:", label.getAttribute('for'));
            setTimeout(handleTabChange, 50); // Pequeño delay para que el radio se marque primero
        });
    });
    
    // Asegurar que la segunda tab (Principal) esté activa y visible por defecto
    const defaultTab = document.getElementById('glass-gold');
    const menuPrincipal = document.getElementById('menuPrincipal');
    
    if (defaultTab) {
        defaultTab.checked = true;
        console.log("Tab Principal marcada como checked por defecto");
    }
    
    if (menuPrincipal) {
        menuPrincipal.style.display = 'block';
        console.log("MenuPrincipal mostrado por defecto");
    }
    
    // Ocultar otras secciones por defecto
    const menuClub = document.getElementById('menuClub');
    const menuNotificaciones = document.getElementById('menuNotificaciones');
    
    if (menuClub) menuClub.style.display = 'none';
    if (menuNotificaciones) menuNotificaciones.style.display = 'none';
}

// Función separada para manejar el cambio de tabs
function handleTabChange() {
    console.log("Manejando cambio de tab...");
    
    // Ocultamos todos los menús
    document.querySelectorAll('.menu-section').forEach(menu => {
        menu.style.display = 'none';
    });

    // Mostramos el que corresponde
    const silverChecked = document.getElementById('glass-silver').checked;
    const goldChecked = document.getElementById('glass-gold').checked;
    const platinumChecked = document.getElementById('glass-platinum').checked;
    const historialChecked = document.getElementById('glass-historial').checked;
    
    console.log("Estados de tabs:", { silverChecked, goldChecked, platinumChecked, historialChecked });

    if (silverChecked) {
        console.log("Mostrando sección Club");
        document.getElementById('menuClub').style.display = 'block';
        // Re-renderizar el club si es necesario para actualizar datos
        if (window.clubData) {
            mostrarDatosClub(window.clubData);
            mostrarIntegrantes(window.clubData);
            mostrarSolicitudes(window.clubData);
        }
    } else if (goldChecked) {
        console.log("Mostrando sección Principal");
        document.getElementById('menuPrincipal').style.display = 'block';
        // Re-renderizar libros si es necesario
        if (window.clubData) {
            actualizarEstadisticas(window.clubData);
        }
        // Configurar el modal de libros cuando se muestra la sección Principal
        setupModalLibro();
    } else if (platinumChecked) {
        console.log("Mostrando sección Notificaciones");
        document.getElementById('menuNotificaciones').style.display = 'block';
        // Cargar notificaciones si es necesario
        cargarNotificaciones();
    } else if (historialChecked) {
        console.log("Mostrando sección Historial");
        document.getElementById('menuHistorial').style.display = 'block';
        // Actualizar información del club en la sidebar
        if (window.clubData) {
            actualizarInfoClubHistorial(window.clubData);
        }
        // Configurar event listeners para filtros del historial
        setupHistorialClubEventListeners();
        // Cargar historial del club
        cargarHistorialClub();
    }

}

// Función para cargar notificaciones (placeholder)
function cargarNotificaciones() {
    const notificationsList = document.getElementById('notifications-list');
    const emptyState = document.getElementById('notifications-empty-state');
    
    if (notificationsList) {
        // Por ahora mostramos el estado vacío
        notificationsList.innerHTML = '';
        if (emptyState) {
            emptyState.style.display = 'flex';
        }
        
        // Actualizar contadores
        const unreadCount = document.getElementById('unread-count');
        const totalNotifications = document.getElementById('total-notifications');
        if (unreadCount) unreadCount.textContent = '0';
        if (totalNotifications) totalNotifications.textContent = '0';
    }
}


// renderClub() se llama ahora desde el DOMContentLoaded

// Variables para el gráfico
let graficoInstancia = null;

// Variables para el historial
let historialClubData = [];
let currentView = 'timeline';
let clubStats = {};

// Configurar modal del gráfico
function configurarModalGrafico() {
    const chartBtn = document.getElementById('ver-grafico-btn');
    const modal = document.getElementById('modalGrafico');
    const closeBtn = document.getElementById('closeModalGrafico');
    const chartEstadoFilter = document.getElementById('chart-estado-filter');

    if (chartBtn) {
        chartBtn.addEventListener('click', () => {
            console.log('Botón de gráfico clickeado');
            modal.classList.add('show');
            modal.style.display = 'flex';
            generarGraficoGeneros('todos');
        });
    } else {
        console.error('No se encontró el botón ver-grafico-btn');
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
    }

    // Cerrar modal al hacer clic fuera
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    }

    // Event listener para el filtro de estado
    if (chartEstadoFilter) {
        chartEstadoFilter.addEventListener('change', (e) => {
            generarGraficoGeneros(e.target.value);
        });
    }
}

// Función para generar el gráfico de géneros
function generarGraficoGeneros(estadoFiltro = 'todos') {
    console.log('Generando gráfico con filtro:', estadoFiltro);
    console.log('window.clubData:', window.clubData);
    
    if (!window.clubData) {
        console.error('No hay datos del club');
        return;
    }
    
    if (!window.clubData.readBooks) {
        console.error('No hay libros en los datos del club');
        console.log('Propiedades disponibles en clubData:', Object.keys(window.clubData));
        return;
    }
    
    console.log('Cantidad de libros:', window.clubData.readBooks.length);

    // Obtener todos los libros del club
    console.log('Libros disponibles:', window.clubData.readBooks);
    
    // Para el gráfico, usamos todos los libros del club
    let todosLosLibros = window.clubData.readBooks;
    
    // Filtrar por estado directamente del libro
    let librosFiltrados;
    if (estadoFiltro === 'todos') {
        librosFiltrados = todosLosLibros;
    } else {
        // Filtrar libros por su estado directo
        librosFiltrados = todosLosLibros.filter(book => {
            return book.estado === estadoFiltro;
        });
    }
    
    console.log('Libros filtrados:', librosFiltrados);
    console.log(`Filtro aplicado: ${estadoFiltro}, Libros resultantes: ${librosFiltrados.length}`);
    
    // Debug: verificar estado directo de cada libro
    if (estadoFiltro !== 'todos') {
        console.log('=== DEBUG FILTRO POR ESTADO ===');
        todosLosLibros.forEach((book, index) => {
            console.log(`Libro ${index + 1}: ${book.title}`);
            console.log(`  Estado: ${book.estado}, Coincide con filtro (${estadoFiltro}): ${book.estado === estadoFiltro}`);
        });
    }

    // Contar libros por categoría usando la misma estructura que el filtro existente
    const conteoGeneros = {};
    
    librosFiltrados.forEach(book => {
        if (book.categorias && book.categorias.length > 0) {
            // Si el libro tiene categorías, contar cada una
            book.categorias.forEach(categoria => {
                const nombreCategoria = categoria.nombre || categoria.name || `Categoría ${categoria.id}`;
                conteoGeneros[nombreCategoria] = (conteoGeneros[nombreCategoria] || 0) + 1;
            });
        } else {
            // Si no tiene categorías, contar como "Sin categoría"
            conteoGeneros['Sin categoría'] = (conteoGeneros['Sin categoría'] || 0) + 1;
        }
        console.log(`Libro: ${book.title}, Categorías:`, book.categorias);
    });
    
    console.log('Conteo por géneros:', conteoGeneros);

    // Preparar datos para el gráfico
    const labels = Object.keys(conteoGeneros);
    const data = Object.values(conteoGeneros);
    const total = data.reduce((sum, value) => sum + value, 0);

    // Colores para el gráfico
    const colores = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];

    // Obtener canvas
    const canvas = document.getElementById('genreChart');
    if (!canvas) {
        console.error('No se encontró el canvas genreChart');
        return;
    }
    console.log('Canvas encontrado:', canvas);
    const ctx = canvas.getContext('2d');

    // Destruir gráfico anterior si existe
    if (graficoInstancia) {
        graficoInstancia.destroy();
    }

    // Crear nuevo gráfico
    if (labels.length === 0) {
        // Mostrar estado vacío más elegante
        const container = canvas.parentElement;
        container.innerHTML = `
            <div class="chart-no-data">
                <div class="no-data-icon">📊</div>
                <h4>No hay libros para mostrar</h4>
                <p>Selecciona un filtro diferente o agrega libros al club para ver la distribución por géneros.</p>
            </div>
        `;
        
        // Limpiar la leyenda también
        const leyenda = document.getElementById('chartLegend');
        if (leyenda) {
            leyenda.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📚</div>
                    <p>No hay datos para mostrar en la leyenda</p>
                </div>
            `;
        }
        return;
    }

    if (typeof Chart === 'undefined') {
        console.error('Chart.js no está cargado');
        return;
    }

    console.log('Creando gráfico con datos:', { labels, data });
    
    // Colores más vibrantes y gradientes para efecto 3D
    const colores3D = [
        'rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 205, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)',
        'rgba(199, 199, 199, 0.8)', 'rgba(83, 102, 255, 0.8)', 'rgba(255, 99, 255, 0.8)',
        'rgba(132, 255, 99, 0.8)'
    ];

    const coloresBorde = [
        'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 205, 86, 1)',
        'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
        'rgba(199, 199, 199, 1)', 'rgba(83, 102, 255, 1)', 'rgba(255, 99, 255, 1)',
        'rgba(132, 255, 99, 1)'
    ];
    
    graficoInstancia = new Chart(ctx, {
        type: 'doughnut', // Cambiado a doughnut para efecto más moderno
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colores3D.slice(0, labels.length),
                borderColor: coloresBorde.slice(0, labels.length),
                borderWidth: 3,
                hoverBackgroundColor: coloresBorde.slice(0, labels.length),
                hoverBorderWidth: 5,
                hoverOffset: 15, // Efecto 3D al hacer hover
                cutout: '40%', // Espacio interior del doughnut
                borderRadius: 8, // Bordes redondeados para look moderno
                spacing: 2 // Separación entre segmentos
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.2,
            interaction: {
                intersect: false,
                mode: 'nearest'
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1500,
                easing: 'easeInOutQuart'
            },
            elements: {
                arc: {
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 6
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    align: 'center',
                    labels: {
                        boxWidth: 20,
                        boxHeight: 20,
                        padding: 15,
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        color: '#333',
                        usePointStyle: true,
                        pointStyle: 'circle',
                        generateLabels: function(chart) {
                            const data = chart.data;
                            return data.labels.map((label, index) => {
                                const value = data.datasets[0].data[index];
                                const percentage = ((value / total) * 100).toFixed(1);
                                return {
                                    text: `${label} (${percentage}%)`,
                                    fillStyle: data.datasets[0].backgroundColor[index],
                                    strokeStyle: data.datasets[0].borderColor[index],
                                    lineWidth: 2,
                                    index: index
                                };
                            });
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                    cornerRadius: 12,
                    displayColors: true,
                    boxPadding: 6,
                    padding: 12,
                    titleFont: {
                        size: 16,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 14
                    },
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const value = context.parsed;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return [
                                `📚 ${value} libro${value !== 1 ? 's' : ''}`,
                                `📊 ${percentage}% del total`,
                                `🎯 ${total} libros en total`
                            ];
                        }
                    }
                }
            },
            layout: {
                padding: {
                    top: 20,
                    bottom: 20,
                    left: 20,
                    right: 20
                }
            },
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            }
        }
    });

    // Actualizar leyenda personalizada
    actualizarLeyendaGrafico(labels, data, colores.slice(0, labels.length), total);
}

// Función para actualizar la leyenda del gráfico
function actualizarLeyendaGrafico(labels, data, colores, total) {
    const leyenda = document.getElementById('chartLegend');
    if (!leyenda) return;

    leyenda.innerHTML = '';
    
    // Ordenar por cantidad (descendente) para mejor visualización
    const datosOrdenados = labels.map((label, index) => ({
        label,
        cantidad: data[index],
        color: colores[index],
        porcentaje: ((data[index] / total) * 100).toFixed(1)
    })).sort((a, b) => b.cantidad - a.cantidad);
    
    datosOrdenados.forEach((item, index) => {
        const itemLeyenda = document.createElement('div');
        itemLeyenda.className = 'legend-item';
        itemLeyenda.style.setProperty('--legend-color', item.color);
        itemLeyenda.style.animationDelay = `${index * 0.1}s`;
        
        // Determinar el emoji basado en el nombre de la categoría
        let emoji = '📖';
        const labelLower = item.label.toLowerCase();
        if (labelLower.includes('ficción') || labelLower.includes('novela')) emoji = '📚';
        else if (labelLower.includes('historia') || labelLower.includes('biografía')) emoji = '📜';
        else if (labelLower.includes('ciencia') || labelLower.includes('técnico')) emoji = '🔬';
        else if (labelLower.includes('arte') || labelLower.includes('cultura')) emoji = '🎨';
        else if (labelLower.includes('filosofía') || labelLower.includes('religión')) emoji = '🤔';
        else if (labelLower.includes('infantil') || labelLower.includes('juvenil')) emoji = '🧸';
        else if (labelLower.includes('misterio') || labelLower.includes('thriller')) emoji = '🔍';
        else if (labelLower.includes('romance') || labelLower.includes('amor')) emoji = '💕';
        else if (labelLower.includes('aventura') || labelLower.includes('acción')) emoji = '⚡';
        else if (labelLower.includes('fantasía') || labelLower.includes('magia')) emoji = '🧙‍♂️';
        
        itemLeyenda.innerHTML = `
            <div class="legend-color" style="background: linear-gradient(135deg, ${item.color}, ${item.color}dd);"></div>
            <div class="legend-info">
                <div class="legend-label">
                    ${emoji} ${item.label}
                    <span style="font-size: 12px; color: #666; font-weight: 400;">#${index + 1}</span>
                </div>
                <div class="legend-value">${item.cantidad} libro${item.cantidad !== 1 ? 's' : ''} • ${item.porcentaje}%</div>
            </div>
        `;
        
        // Agregar efectos hover dinámicos
        itemLeyenda.addEventListener('mouseenter', () => {
            itemLeyenda.style.transform = 'translateX(12px) scale(1.02)';
            itemLeyenda.style.zIndex = '10';
        });
        
        itemLeyenda.addEventListener('mouseleave', () => {
            itemLeyenda.style.transform = 'translateX(0) scale(1)';
            itemLeyenda.style.zIndex = '1';
        });
        
        leyenda.appendChild(itemLeyenda);
    });
    
    // Agregar animación de entrada
    const items = leyenda.querySelectorAll('.legend-item');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        setTimeout(() => {
            item.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// ==================== FUNCIONES DEL HISTORIAL DEL CLUB ====================

// Actualizar información del club en la sidebar del historial
function actualizarInfoClubHistorial(club) {
    console.log('Actualizando info del club en historial:', club);
    
    if (!club) {
        console.warn('No hay datos del club disponibles');
        return;
    }
    
    // Actualizar imagen del club
    const clubImagen = document.getElementById('sidebar-club-imagen-3');
    if (clubImagen) {
        if (club.imagen) {
            clubImagen.src = club.imagen;
            clubImagen.style.display = 'block';
        } else {
            // Imagen por defecto si no tiene
            clubImagen.src = '../images/BooksyLogo.png';
            clubImagen.style.display = 'block';
        }
    }
    
    // Actualizar nombre del club
    const clubNombre = document.getElementById('sidebar-club-name-3');
    if (clubNombre) {
        clubNombre.textContent = club.name || 'Club sin nombre';
    }
    
    // Actualizar descripción del club
    const clubDescripcion = document.getElementById('sidebar-club-description-3');
    if (clubDescripcion) {
        clubDescripcion.textContent = club.description || 'Sin descripción disponible';
    }
}

// Cargar historial del club
async function cargarHistorialClub(filtros = {}) {
    try {
        const clubId = getClubId();
        const params = new URLSearchParams(filtros);
        
        console.log('Cargando historial del club:', clubId);
        showLoader("Cargando historial del club...");
        
        // Llamada a la API real (cuando esté implementada)
        const response = await fetch(`${API_URL}/club/${clubId}/reading-history?${params}`);
        const data = await response.json();
        
        if (data.success) {
            // Guardar todos los datos en variable global
            window.historialClubData = data.historial || [];
            
            // Aplicar filtros localmente por ahora
            historialClubData = aplicarFiltrosLocal(window.historialClubData, filtros);
            
            // Cargar estadísticas
            await cargarEstadisticasClub(filtros);
            
            hideLoader();
            
            // Actualizar información del club si está disponible
            if (window.clubData) {
                actualizarInfoClubHistorial(window.clubData);
            }
            
            actualizarEstadisticasHistorialClub();
            actualizarVistaHistorialClub();
            poblarFiltroUsuarios();
            
            if (historialClubData.length > 0) {
                showNotification('success', 'Historial cargado correctamente');
            }
        } else {
            hideLoader();
            historialClubData = [];
            clubStats = {};
            
            // Actualizar información del club aunque no haya historial
            if (window.clubData) {
                actualizarInfoClubHistorial(window.clubData);
            }
            
            actualizarVistaHistorialClub();
            console.log('No hay historial disponible:', data.message);
        }
        
    } catch (error) {
        hideLoader();
        console.error('Error al cargar historial del club:', error);
        historialClubData = [];
        clubStats = {};
        
        // Actualizar información del club aunque haya error
        if (window.clubData) {
            actualizarInfoClubHistorial(window.clubData);
        }
        
        actualizarVistaHistorialClub();
        showNotification('error', 'Error al cargar el historial del club');
    }
}

// Cargar estadísticas del club
async function cargarEstadisticasClub(filtros = {}) {
    try {
        const clubId = getClubId();
        const params = new URLSearchParams(filtros);
        
        const response = await fetch(`${API_URL}/club/${clubId}/reading-stats?${params}`);
        const data = await response.json();
        
        if (data.success) {
            clubStats = data.stats || {};
        } else {
            clubStats = {};
        }
    } catch (error) {
        console.error('Error al cargar estadísticas del club:', error);
        clubStats = {};
    }
}



// Actualizar estadísticas del historial del club
function actualizarEstadisticasHistorialClub() {
    const totalLeidosEl = document.getElementById('club-total-leidos');
    const totalCambiosEl = document.getElementById('club-total-cambios');
    const usuarioActivoEl = document.getElementById('usuario-mas-activo');
    const promedioClubEl = document.getElementById('promedio-club');
    
    if (totalLeidosEl) totalLeidosEl.textContent = clubStats.totalLeidos || 0;
    if (totalCambiosEl) totalCambiosEl.textContent = clubStats.totalCambios || 0;
    if (usuarioActivoEl) usuarioActivoEl.textContent = clubStats.usuarioMasActivo || '-';
    if (promedioClubEl) promedioClubEl.textContent = clubStats.promedioLectura || 0;
}

// Poblar filtro de usuarios
function poblarFiltroUsuarios() {
    const usuarioFilter = document.getElementById('historial-usuario-filter');
    if (!usuarioFilter) return;
    
    // Usar datos globales para obtener todos los usuarios disponibles
    const datosCompletos = window.historialClubData || historialClubData || [];
    
    // Obtener usuarios únicos del historial
    const usuarios = [...new Set(datosCompletos.map(entry => entry.user?.username).filter(Boolean))];
    
    // Limpiar opciones existentes (excepto "Todos")
    usuarioFilter.innerHTML = '<option value="">Todos los usuarios</option>';
    
    // Agregar usuarios
    usuarios.forEach(username => {
        const option = document.createElement('option');
        option.value = username;
        option.textContent = username;
        usuarioFilter.appendChild(option);
    });
    
    console.log('Usuarios disponibles en el filtro:', usuarios);
}

// Actualizar vista según el modo seleccionado
function actualizarVistaHistorialClub() {
    const container = document.getElementById('historial-content');
    if (!container) return;
    
    switch (currentView) {
        case 'timeline':
            container.innerHTML = generarVistaTimelineClub();
            break;
        case 'list':
            container.innerHTML = generarVistaListaClub();
            break;
        case 'stats':
            container.innerHTML = generarVistaEstadisticasClub();
            break;
    }
}

// Generar vista timeline del club
function generarVistaTimelineClub() {
    if (historialClubData.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h4>No hay actividad aún</h4>
                <p>Cuando los miembros cambien el estado de los libros, aparecerá aquí</p>
            </div>
        `;
    }
    
    const timelineItems = historialClubData.map(entry => {
        const fecha = new Date(entry.fechaCambio).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const estadoInfo = getEstadoInfo(entry.estado);
        const accionTexto = getAccionTexto(entry.estado);
        
        return `
            <div class="timeline-item ${entry.estado}">
                <div class="timeline-marker" style="background: ${estadoInfo.color}">
                    ${estadoInfo.icon}
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h4>${entry.book.title}</h4>
                        <span class="timeline-date">${fecha}</span>
                    </div>
                    <p class="timeline-author">Por ${entry.book.author}</p>
                    <div class="timeline-action">
                        <div class="timeline-user">
                            <span class="user-avatar">${entry.user.username.charAt(0).toUpperCase()}</span>
                            <span class="user-name">${entry.user.username}</span>
                        </div>
                        <span class="action-text">${accionTexto}</span>
                        <span class="estado-badge" style="background: ${estadoInfo.color}">
                            ${estadoInfo.icon} ${estadoInfo.label}
                        </span>
                    </div>
                    ${entry.fechaInicio && entry.fechaFin && entry.estado === 'leido' ? 
                        `<div class="reading-duration">
                            ⏱️ Tiempo de lectura: ${calcularDiasLectura(entry.fechaInicio, entry.fechaFin)} días
                        </div>` : ''
                    }
                </div>
            </div>
        `;
    }).join('');
    
    return `<div class="timeline-container">${timelineItems}</div>`;
}

// Generar vista de lista del club
function generarVistaListaClub() {
    if (historialClubData.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h4>No hay actividad aún</h4>
                <p>Cuando los miembros cambien el estado de los libros, aparecerá aquí</p>
            </div>
        `;
    }
    
    const listItems = historialClubData.map(entry => {
        const fecha = new Date(entry.fechaCambio).toLocaleDateString('es-ES');
        const estadoInfo = getEstadoInfo(entry.estado);
        const accionTexto = getAccionTexto(entry.estado);
        
        return `
            <div class="list-item">
                <div class="list-content">
                    <div class="list-header">
                        <h4>${entry.book.title}</h4>
                        <span class="list-date">${fecha}</span>
                    </div>
                    <p class="list-author">Por ${entry.book.author}</p>
                    <div class="list-action">
                        <span class="user-name">${entry.user.username}</span>
                        <span class="action-text">${accionTexto}</span>
                        <span class="estado-badge" style="background: ${estadoInfo.color}">
                            ${estadoInfo.icon} ${estadoInfo.label}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    return `<div class="list-container">${listItems}</div>`;
}

// Generar vista de estadísticas del club
function generarVistaEstadisticasClub() {
    const porGenero = clubStats.porGenero || {};
    const porUsuario = clubStats.porUsuario || {};
    const porMes = clubStats.porMes || {};
    
    // Verificar si hay datos
    const hayDatos = Object.keys(porGenero).length > 0 || Object.keys(porUsuario).length > 0 || Object.keys(porMes).length > 0;
    
    if (!hayDatos) {
        return `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h4>No hay estadísticas disponibles</h4>
                <p>Cuando haya actividad en el club, aparecerán las estadísticas aquí</p>
            </div>
        `;
    }
    
    return `
        <div class="stats-dashboard">
            <div class="stats-row">
                <div class="stats-card">
                    <h4>📊 Libros por Género</h4>
                    <div class="stats-list">
                        ${Object.keys(porGenero).length > 0 
                            ? Object.entries(porGenero)
                                .sort(([,a], [,b]) => b - a)
                                .map(([genero, cantidad]) => `
                                    <div class="stats-item">
                                        <span class="stats-label">${genero}</span>
                                        <span class="stats-value">${cantidad}</span>
                                    </div>
                                `).join('')
                            : '<p class="no-data">No hay datos disponibles</p>'
                        }
                    </div>
                </div>
                
                <div class="stats-card">
                    <h4>👥 Actividad por Usuario</h4>
                    <div class="stats-list">
                        ${Object.keys(porUsuario).length > 0
                            ? Object.entries(porUsuario)
                                .sort(([,a], [,b]) => b - a)
                                .map(([usuario, cantidad]) => `
                                    <div class="stats-item">
                                        <span class="stats-label">${usuario}</span>
                                        <span class="stats-value">${cantidad} libros</span>
                                    </div>
                                `).join('')
                            : '<p class="no-data">No hay datos disponibles</p>'
                        }
                    </div>
                </div>
            </div>
            
            <div class="stats-card full-width">
                <h4>📅 Actividad por Mes</h4>
                <div class="stats-list">
                    ${Object.keys(porMes).length > 0
                        ? Object.entries(porMes)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .slice(0, 12)
                            .map(([mes, cantidad]) => `
                                <div class="stats-item">
                                    <span class="stats-label">${formatearMes(mes)}</span>
                                    <span class="stats-value">${cantidad} cambios</span>
                                </div>
                            `).join('')
                        : '<p class="no-data">No hay datos disponibles</p>'
                    }
                </div>
            </div>
        </div>
    `;
}

// Funciones helper
function getAccionTexto(estado) {
    const acciones = {
        'por_leer': 'agregó a su lista por leer',
        'leyendo': 'empezó a leer',
        'leido': 'terminó de leer'
    };
    return acciones[estado] || 'cambió el estado de';
}

function formatearMes(mesISO) {
    const [año, mes] = mesISO.split('-');
    const fecha = new Date(año, mes - 1);
    return fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function calcularDiasLectura(fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    return Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
}

// Event listeners para el historial del club
let historialEventListenersConfigured = false;
function setupHistorialClubEventListeners() {
    if (historialEventListenersConfigured) {
        console.log('Event listeners del historial ya configurados, omitiendo...');
        return;
    }
    
    console.log('Configurando event listeners del historial...');
    
    // Cambio de vista
    document.querySelectorAll('.view-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.view-toggle').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentView = e.target.dataset.view;
            actualizarVistaHistorialClub();
        });
    });
    
    // Filtros
    const estadoFilter = document.getElementById('historial-estado-filter');
    if (estadoFilter) {
        estadoFilter.addEventListener('change', (e) => {
            console.log('Filtro de estado cambiado:', e.target.value);
            const filtros = obtenerFiltrosHistorialClub();
            cargarHistorialClub(filtros);
        });
    }
    
    const usuarioFilter = document.getElementById('historial-usuario-filter');
    if (usuarioFilter) {
        usuarioFilter.addEventListener('change', (e) => {
            console.log('Filtro de usuario cambiado:', e.target.value);
            const filtros = obtenerFiltrosHistorialClub();
            cargarHistorialClub(filtros);
        });
    }
    
    const desdeFilter = document.getElementById('historial-desde');
    if (desdeFilter) {
        desdeFilter.addEventListener('change', (e) => {
            console.log('Filtro desde cambiado:', e.target.value);
            const filtros = obtenerFiltrosHistorialClub();
            cargarHistorialClub(filtros);
        });
    }
    
    const hastaFilter = document.getElementById('historial-hasta');
    if (hastaFilter) {
        hastaFilter.addEventListener('change', (e) => {
            console.log('Filtro hasta cambiado:', e.target.value);
            const filtros = obtenerFiltrosHistorialClub();
            cargarHistorialClub(filtros);
        });
    }
    
    // Período predefinido
    const periodoFilter = document.getElementById('historial-periodo-filter');
    if (periodoFilter) {
        periodoFilter.addEventListener('change', (e) => {
            const periodo = e.target.value;
            if (periodo) {
                const { desde, hasta } = obtenerFechasPeriodo(periodo);
                const desdeInput = document.getElementById('historial-desde');
                const hastaInput = document.getElementById('historial-hasta');
                if (desdeInput) desdeInput.value = desde;
                if (hastaInput) hastaInput.value = hasta;
            }
        });
    }
    
    // Exportar historial
    const exportarBtn = document.getElementById('exportar-historial-btn');
    if (exportarBtn) {
        exportarBtn.addEventListener('click', exportarHistorialClub);
    }
    
    // Limpiar filtros
    const limpiarFiltrosBtn = document.getElementById('limpiar-filtros-btn');
    if (limpiarFiltrosBtn) {
        limpiarFiltrosBtn.addEventListener('click', () => {
            // Limpiar todos los filtros
            document.getElementById('historial-estado-filter').value = '';
            document.getElementById('historial-usuario-filter').value = '';
            document.getElementById('historial-desde').value = '';
            document.getElementById('historial-hasta').value = '';
            
            // Recargar historial sin filtros
            cargarHistorialClub();
            console.log('Filtros limpiados y historial recargado');
        });
    }
    
    historialEventListenersConfigured = true;
    console.log('Event listeners del historial configurados correctamente');
}

// Obtener fechas para períodos predefinidos
function obtenerFechasPeriodo(periodo) {
    const ahora = new Date();
    let desde, hasta;
    
    switch (periodo) {
        case 'semana':
            desde = new Date(ahora - 7 * 24 * 60 * 60 * 1000);
            hasta = ahora;
            break;
        case 'mes':
            desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            hasta = ahora;
            break;
        case 'trimestre':
            desde = new Date(ahora - 90 * 24 * 60 * 60 * 1000);
            hasta = ahora;
            break;
        case 'año':
            desde = new Date(ahora.getFullYear(), 0, 1);
            hasta = ahora;
            break;
        default:
            desde = new Date(ahora - 30 * 24 * 60 * 60 * 1000);
            hasta = ahora;
    }
    
    return {
        desde: desde.toISOString().split('T')[0],
        hasta: hasta.toISOString().split('T')[0]
    };
}

// Exportar historial del club
function exportarHistorialClub() {
    if (historialClubData.length === 0) {
        showNotification('warning', 'No hay datos para exportar');
        return;
    }
    
    const csv = [
        ['Fecha', 'Usuario', 'Libro', 'Autor', 'Acción', 'Estado', 'Días de lectura'].join(','),
        ...historialClubData.map(entry => [
            new Date(entry.fechaCambio).toLocaleDateString('es-ES'),
            `"${entry.user.username}"`,
            `"${entry.book.title}"`,
            `"${entry.book.author}"`,
            `"${getAccionTexto(entry.estado)}"`,
            entry.estado,
            entry.fechaInicio && entry.fechaFin ? calcularDiasLectura(entry.fechaInicio, entry.fechaFin) : ''
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial-club-${window.clubData?.name || 'club'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showNotification('success', 'Historial del club exportado correctamente');
}

// Obtener filtros actuales del club
function obtenerFiltrosHistorialClub() {
    console.log('🔍 Obteniendo filtros del historial...');
    const filtros = {};
    
    const estado = document.getElementById('historial-estado-filter')?.value;
    if (estado) {
        filtros.estado = estado;
        console.log('✅ Aplicando filtro de estado:', estado);
    } else {
        console.log('❌ Sin filtro de estado');
    }
    
    const usuario = document.getElementById('historial-usuario-filter')?.value;
    if (usuario && window.historialClubData) {
        // Convertir username a userId buscando en los datos del historial
        const userEntry = window.historialClubData.find(entry => entry.user && entry.user.username === usuario);
        if (userEntry) {
            filtros.userId = userEntry.user.id;
            console.log('✅ Aplicando filtro de usuario:', usuario, 'ID:', userEntry.user.id);
        } else {
            console.log('❌ Usuario no encontrado en datos:', usuario);
        }
    } else {
        console.log('❌ Sin filtro de usuario o sin datos');
    }
    
    const desde = document.getElementById('historial-desde')?.value;
    if (desde) {
        filtros.desde = desde;
        console.log('✅ Aplicando filtro desde:', desde);
    } else {
        console.log('❌ Sin filtro desde');
    }
    
    const hasta = document.getElementById('historial-hasta')?.value;
    if (hasta) {
        filtros.hasta = hasta;
        console.log('✅ Aplicando filtro hasta:', hasta);
    } else {
        console.log('❌ Sin filtro hasta');
    }
    
    console.log('📋 Filtros finales:', filtros);
    return filtros;
}

// Aplicar filtros localmente a los datos del historial
function aplicarFiltrosLocal(data, filtros) {
    console.log('🔄 Aplicando filtros localmente...');
    console.log('📊 Datos originales:', data ? data.length : 0, 'elementos');
    console.log('🎯 Filtros a aplicar:', filtros);
    
    if (!data || data.length === 0) {
        console.log('❌ No hay datos para filtrar');
        return data;
    }
    
    let datosFiltrados = [...data];
    
    // Filtro por estado
    if (filtros.estado) {
        const estadoInicial = datosFiltrados.length;
        datosFiltrados = datosFiltrados.filter(item => item.estado === filtros.estado);
        console.log(`🎚️ Filtro de estado "${filtros.estado}": ${estadoInicial} → ${datosFiltrados.length} elementos`);
    }
    
    // Filtro por usuario
    if (filtros.userId) {
        const usuarioInicial = datosFiltrados.length;
        datosFiltrados = datosFiltrados.filter(item => item.user && item.user.id.toString() === filtros.userId.toString());
        console.log(`👤 Filtro de usuario ID "${filtros.userId}": ${usuarioInicial} → ${datosFiltrados.length} elementos`);
    }
    
    // Filtro por fecha desde
    if (filtros.desde) {
        const fechaInicial = datosFiltrados.length;
        const fechaDesde = new Date(filtros.desde);
        datosFiltrados = datosFiltrados.filter(item => {
            const fechaItem = new Date(item.fechaInicio || item.createdAt);
            return fechaItem >= fechaDesde;
        });
        console.log(`📅 Filtro desde "${filtros.desde}": ${fechaInicial} → ${datosFiltrados.length} elementos`);
    }
    
    // Filtro por fecha hasta
    if (filtros.hasta) {
        const hastaInicial = datosFiltrados.length;
        const fechaHasta = new Date(filtros.hasta);
        fechaHasta.setHours(23, 59, 59, 999); // Incluir todo el día
        datosFiltrados = datosFiltrados.filter(item => {
            const fechaItem = new Date(item.fechaFin || item.updatedAt || item.createdAt);
            return fechaItem <= fechaHasta;
        });
        console.log(`📅 Filtro hasta "${filtros.hasta}": ${hastaInicial} → ${datosFiltrados.length} elementos`);
    }
    
    console.log('✅ Filtrado completado:', datosFiltrados.length, 'elementos finales');
    return datosFiltrados;
}

// Función para mostrar el modal de ranking
async function mostrarRanking() {
    const clubId = getClubId();
    const modal = document.getElementById('modalRanking');
    const loader = document.getElementById('rankingLoader');
    const lista = document.getElementById('rankingList');
    const empty = document.getElementById('rankingEmpty');

    // Mostrar modal y loader
    modal.classList.add('show');
    modal.style.display = 'flex';
    loader.style.display = 'block';
    lista.style.display = 'none';
    empty.style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/api/ranking/club/${clubId}/ranking`);
        const data = await response.json();

        if (data.success && data.ranking && data.ranking.length > 0) {
            // Mostrar ranking
            mostrarListaRanking(data.ranking, data.club);
            loader.style.display = 'none';
            lista.style.display = 'block';
        } else {
            // Mostrar estado vacío
            loader.style.display = 'none';
            empty.style.display = 'block';
        }
    } catch (error) {
        console.error('Error al cargar ranking:', error);
        loader.style.display = 'none';
        empty.style.display = 'block';
        
        // Cambiar el mensaje de error
        const emptyTitle = empty.querySelector('h3');
        const emptyText = empty.querySelector('p');
        emptyTitle.textContent = 'Error al cargar ranking';
        emptyText.textContent = 'No se pudo conectar al servidor. Intenta nuevamente.';
    }
}

// Función para renderizar la lista de ranking
function mostrarListaRanking(ranking, club) {
    const lista = document.getElementById('rankingList');
    
    const html = ranking.map((usuario, index) => {
        const positionClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        const initials = usuario.username.charAt(0).toUpperCase();
        
        return `
            <li>
                <div class="ranking-position ${positionClass}">${index + 1}</div>
                <div class="ranking-avatar">${initials}</div>
                <div class="ranking-info">
                    <h4 class="ranking-name">
                        ${usuario.username}
                        ${index < 3 ? `<span class="ranking-badge">${index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}</span>` : ''}
                    </h4>
                    <p class="ranking-stats">
                        <span>💬 ${usuario.commentsCount} comentarios</span>
                        <span>📚 ${usuario.booksAddedCount} libros</span>
                    </p>
                </div>
                <div class="ranking-score">
                    ${usuario.totalScore}
                    <span>pts</span>
                </div>
            </li>
        `;
    }).join('');
    
    lista.innerHTML = html;
}

// Hacer la función global para que funcione el onclick
window.mostrarRanking = mostrarRanking;

// Función para mostrar el modal de miembros
async function mostrarMiembros() {
    const modal = document.getElementById('modalMiembros');
    const loader = document.getElementById('membersLoader');
    const lista = document.getElementById('membersList');
    const empty = document.getElementById('membersEmpty');

    // Mostrar modal y loader
    modal.classList.add('show');
    modal.style.display = 'flex';
    loader.style.display = 'block';
    lista.style.display = 'none';
    empty.style.display = 'none';

    try {
        // Usar los datos del club que ya están cargados
        if (window.clubData && window.clubData.members && window.clubData.members.length > 0) {
            // Mostrar miembros
            mostrarListaMiembros(window.clubData.members, window.clubData);
            loader.style.display = 'none';
            lista.style.display = 'block';
        } else {
            // Mostrar estado vacío
            loader.style.display = 'none';
            empty.style.display = 'block';
        }
    } catch (error) {
        console.error('Error al cargar miembros:', error);
        loader.style.display = 'none';
        empty.style.display = 'block';
        
        // Cambiar el mensaje de error
        const emptyTitle = empty.querySelector('h3');
        const emptyText = empty.querySelector('p');
        emptyTitle.textContent = 'Error al cargar miembros';
        emptyText.textContent = 'No se pudieron cargar los miembros del club.';
    }
}

// Función para renderizar la lista de miembros
function mostrarListaMiembros(miembros, club) {
    const lista = document.getElementById('membersList');
    const currentUserId = localStorage.getItem("userId");
    
    const html = miembros.map((miembro) => {
        const initials = miembro.username.charAt(0).toUpperCase();
        const isOwner = club.id_owner == miembro.id;
        const isCurrentUser = currentUserId == miembro.id;
        
        // Calcular tiempo como miembro (simulado)
        const joinDate = new Date(miembro.createdAt || Date.now());
        const joinDateStr = joinDate.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short' 
        });
        
        return `
            <li>
                <div class="member-avatar">${initials}</div>
                <div class="member-info">
                    <h4 class="member-name">
                        ${miembro.username}
                        ${isCurrentUser ? '<span style="color: #666; font-size: 12px;">(Tú)</span>' : ''}
                        ${isOwner ? '<span class="member-badge owner">Moderador</span>' : '<span class="member-badge"> Miembro</span>'}
                    </h4>
                    <p class="member-role">
                        ${isOwner ? '🛡️ Administrador del club' : '📖 Lector activo'}
                    </p>
                </div>
                <div class="member-stats">
                    <div class="member-join-date">Desde ${joinDateStr}</div>
                    <div class="member-activity">${isOwner ? 'Fundador' : 'Activo'}</div>
                </div>
            </li>
        `;
    }).join('');
    
    lista.innerHTML = html;
}

// Hacer las funciones globales para que funcionen los onclick
window.mostrarMiembros = mostrarMiembros;

// Función para mostrar el modal de historial completo
async function mostrarHistorialCompleto() {
    console.log("🚀 Mostrando historial completo");
    
    const modal = document.getElementById('modalHistorial');
    const loader = document.getElementById('historialModalLoader');
    const content = document.getElementById('historialModalContent');
    const empty = document.getElementById('historialModalEmpty');
    
    // Verificar que los elementos existan
    if (!modal) {
        console.error('❌ Modal de historial no encontrado');
        return;
    }
    
    // Mostrar modal y loader
    modal.style.display = 'flex';
    if (loader) loader.style.display = 'flex';
    if (content) content.style.display = 'none';
    if (empty) empty.style.display = 'none';
    
    try {
        console.log('📊 Datos disponibles:', (window.historialClubData || historialClubData || []).length, 'elementos');
        
        // Cargar filtros de usuarios
        await cargarFiltrosUsuariosModal();
        
        // Si no hay datos del historial, intentar cargarlos
        if ((!window.historialClubData || window.historialClubData.length === 0) && 
            (!historialClubData || historialClubData.length === 0)) {
            console.log('📡 Intentando cargar historial del club...');
            await cargarHistorialClub();
        }
        
        // Configurar event listeners para filtros del modal
        configurarFiltrosHistorialModal();
        
        // Configurar view toggles del modal
        configurarViewTogglesModal();
        
        // Limpiar filtros para mostrar todos los datos inicialmente
        limpiarFiltrosHistorialModal();
        
        console.log('✅ Modal configurado correctamente');
        
    } catch (error) {
        console.error('❌ Error al cargar historial:', error);
        if (loader) loader.style.display = 'none';
        if (empty) {
            empty.style.display = 'flex';
            // Mostrar mensaje de error
            const emptyTitle = empty.querySelector('h3');
            const emptyText = empty.querySelector('p');
            if (emptyTitle) emptyTitle.textContent = 'Error al cargar historial';
            if (emptyText) emptyText.textContent = 'No se pudo cargar el historial del club. Intenta nuevamente.';
        }
    }
}

// Función para cargar filtros de usuarios del modal
async function cargarFiltrosUsuariosModal() {
    const userFilter = document.getElementById('modal-historial-usuario-filter');
    
    if (!userFilter) {
        console.warn('⚠️ Filtro de usuario del modal no encontrado');
        return;
    }
    
    console.log('👥 Cargando usuarios en filtro del modal...');
    
    // Obtener datos del historial
    const datosCompletos = window.historialClubData || historialClubData || [];
    console.log('📊 Datos disponibles para filtro:', datosCompletos.length);
    
    // Obtener usuarios únicos del historial
    const usuarios = [...new Set(datosCompletos.map(entry => {
        // Verificar diferentes propiedades donde puede estar el username
        return entry.user?.username || entry.username || entry.usuario;
    }).filter(Boolean))];
    
    console.log('👤 Usuarios únicos encontrados:', usuarios);
    
    // Limpiar opciones existentes (excepto "Todos los usuarios")
    userFilter.innerHTML = '<option value="">Todos los usuarios</option>';
    
    // Agregar usuarios
    usuarios.forEach(username => {
        const option = document.createElement('option');
        option.value = username;
        option.textContent = username;
        userFilter.appendChild(option);
    });
    
    console.log('✅ Usuarios cargados en filtro del modal:', usuarios.length, 'usuarios');
}

// Función para actualizar vista del historial en el modal
function actualizarVistaHistorialModal() {
    const datosOriginales = window.historialClubData || historialClubData || [];
    actualizarVistaHistorialModalConDatos(datosOriginales);
}

// Función para actualizar vista del historial en el modal con datos específicos
function actualizarVistaHistorialModalConDatos(datos) {
    const content = document.getElementById('historialModalContent');
    const empty = document.getElementById('historialModalEmpty');
    
    if (!content) return;
    
    console.log('🎨 Actualizando vista modal con', datos?.length || 0, 'elementos');
    
    // Verificar si hay datos
    if (!datos || datos.length === 0) {
        content.style.display = 'none';
        if (empty) {
            empty.style.display = 'flex';
            // Restaurar mensaje por defecto
            const emptyTitle = empty.querySelector('h3');
            const emptyText = empty.querySelector('p');
            if (emptyTitle) emptyTitle.textContent = 'No hay actividad registrada';
            if (emptyText) emptyText.textContent = 'Aún no hay actividad en este club con los filtros seleccionados.';
        }
        return;
    }
    
    // Temporalmente reemplazar los datos para generar la vista
    const datosOriginales = historialClubData;
    historialClubData = datos;
    
    try {
        // Generar vista usando las funciones existentes
        switch (currentView) {
            case 'timeline':
                content.innerHTML = generarVistaTimelineClub();
                break;
            case 'list':
                content.innerHTML = generarVistaListaClub();
                break;
            case 'stats':
                content.innerHTML = generarVistaEstadisticasClub();
                break;
            default:
                content.innerHTML = generarVistaTimelineClub();
        }
        
        console.log('✅ Vista actualizada exitosamente');
        content.style.display = 'block';
        if (empty) empty.style.display = 'none';
        
    } catch (error) {
        console.error('❌ Error al generar vista:', error);
        content.style.display = 'none';
        if (empty) empty.style.display = 'flex';
    } finally {
        // Restaurar datos originales
        historialClubData = datosOriginales;
    }
}

// Función para configurar filtros del historial en el modal
function configurarFiltrosHistorialModal() {
    const estadoFilter = document.getElementById('modal-historial-estado-filter');
    const usuarioFilter = document.getElementById('modal-historial-usuario-filter');
    const periodoFilter = document.getElementById('modal-historial-periodo-filter');
    const desdeInput = document.getElementById('modal-historial-desde');
    const hastaInput = document.getElementById('modal-historial-hasta');
    const limpiarBtn = document.getElementById('modal-limpiar-filtros-btn');
    
    // Event listeners para filtros usando las funciones existentes
    [estadoFilter, usuarioFilter, periodoFilter, desdeInput, hastaInput].forEach(element => {
        if (element) {
            element.addEventListener('change', aplicarFiltrosHistorialModal);
        }
    });
    
    // Event listener para limpiar filtros
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', limpiarFiltrosHistorialModal);
    }
    
    // Período predefinido
    if (periodoFilter) {
        periodoFilter.addEventListener('change', (e) => {
            const periodo = e.target.value;
            if (periodo) {
                const { desde, hasta } = obtenerFechasPeriodo(periodo);
                if (desdeInput) desdeInput.value = desde;
                if (hastaInput) hastaInput.value = hasta;
                aplicarFiltrosHistorialModal();
            }
        });
    }
}

// Función para aplicar filtros en el modal
function aplicarFiltrosHistorialModal() {
    console.log('🔍 Aplicando filtros en modal...');
    
    const filtros = obtenerFiltrosHistorialModal();
    console.log('📋 Filtros obtenidos:', filtros);
    
    // Mostrar loader
    const loader = document.getElementById('historialModalLoader');
    const content = document.getElementById('historialModalContent');
    const empty = document.getElementById('historialModalEmpty');
    
    if (loader) loader.style.display = 'flex';
    if (content) content.style.display = 'none';
    if (empty) empty.style.display = 'none';
    
    // Usar setTimeout para simular carga asíncrona
    setTimeout(() => {
        try {
            // Obtener datos originales
            const datosOriginales = window.historialClubData || historialClubData || [];
            console.log('📊 Datos originales:', datosOriginales.length, 'elementos');
            
            if (datosOriginales.length === 0) {
                console.log('❌ No hay datos para filtrar');
                if (loader) loader.style.display = 'none';
                if (empty) empty.style.display = 'flex';
                return;
            }
            
            // Aplicar filtros localmente
            const datosFiltrados = aplicarFiltrosModalCustom(datosOriginales, filtros);
            console.log('✅ Datos filtrados:', datosFiltrados.length, 'elementos');
            
            // Actualizar vista con datos filtrados
            actualizarVistaHistorialModalConDatos(datosFiltrados);
            
            // Mostrar contenido o estado vacío
            if (datosFiltrados.length > 0) {
                if (loader) loader.style.display = 'none';
                if (content) content.style.display = 'block';
                if (empty) empty.style.display = 'none';
            } else {
                if (loader) loader.style.display = 'none';
                if (content) content.style.display = 'none';
                if (empty) {
                    empty.style.display = 'flex';
                    // Actualizar mensaje para filtros sin resultados
                    const emptyTitle = empty.querySelector('h3');
                    const emptyText = empty.querySelector('p');
                    if (emptyTitle) emptyTitle.textContent = 'No hay resultados';
                    if (emptyText) emptyText.textContent = 'No se encontraron actividades con los filtros seleccionados. Intenta ajustar los criterios de búsqueda.';
                }
            }
            
        } catch (error) {
            console.error('❌ Error al aplicar filtros:', error);
            if (loader) loader.style.display = 'none';
            if (empty) empty.style.display = 'flex';
        }
    }, 300);
}

// Función para aplicar filtros personalizada para el modal
function aplicarFiltrosModalCustom(datos, filtros) {
    console.log('🔄 Aplicando filtros personalizados...');
    console.log('📊 Datos originales:', datos ? datos.length : 0, 'elementos');
    console.log('🎯 Filtros a aplicar:', filtros);
    
    if (!datos || datos.length === 0) {
        console.log('❌ No hay datos para filtrar');
        return [];
    }
    
    let datosFiltrados = [...datos];
    
    // Filtro por estado
    if (filtros.estado) {
        const estadoInicial = datosFiltrados.length;
        datosFiltrados = datosFiltrados.filter(item => {
            // Verificar diferentes propiedades donde puede estar el estado
            const estado = item.estado || item.status || item.state;
            return estado === filtros.estado;
        });
        console.log(`🎚️ Filtro de estado "${filtros.estado}": ${estadoInicial} → ${datosFiltrados.length} elementos`);
    }
    
    // Filtro por usuario (por username, más flexible)
    if (filtros.usuario) {
        const usuarioInicial = datosFiltrados.length;
        datosFiltrados = datosFiltrados.filter(item => {
            const username = item.user?.username || item.username || item.usuario;
            return username === filtros.usuario;
        });
        console.log(`👤 Filtro de usuario "${filtros.usuario}": ${usuarioInicial} → ${datosFiltrados.length} elementos`);
    }
    
    // Filtro por fecha desde
    if (filtros.desde) {
        const fechaInicial = datosFiltrados.length;
        const fechaDesde = new Date(filtros.desde);
        datosFiltrados = datosFiltrados.filter(item => {
            // Verificar diferentes propiedades de fecha
            const fechaItem = new Date(
                item.fechaCambio || 
                item.fechaInicio || 
                item.createdAt || 
                item.created_at ||
                item.date ||
                item.fecha
            );
            return !isNaN(fechaItem.getTime()) && fechaItem >= fechaDesde;
        });
        console.log(`📅 Filtro desde "${filtros.desde}": ${fechaInicial} → ${datosFiltrados.length} elementos`);
    }
    
    // Filtro por fecha hasta
    if (filtros.hasta) {
        const hastaInicial = datosFiltrados.length;
        const fechaHasta = new Date(filtros.hasta);
        fechaHasta.setHours(23, 59, 59, 999); // Incluir todo el día
        datosFiltrados = datosFiltrados.filter(item => {
            // Verificar diferentes propiedades de fecha
            const fechaItem = new Date(
                item.fechaCambio || 
                item.fechaFin || 
                item.updatedAt || 
                item.updated_at ||
                item.createdAt || 
                item.created_at ||
                item.date ||
                item.fecha
            );
            return !isNaN(fechaItem.getTime()) && fechaItem <= fechaHasta;
        });
        console.log(`📅 Filtro hasta "${filtros.hasta}": ${hastaInicial} → ${datosFiltrados.length} elementos`);
    }
    
    console.log('✅ Filtrado completado:', datosFiltrados.length, 'elementos finales');
    return datosFiltrados;
}

// Función para obtener filtros del modal
function obtenerFiltrosHistorialModal() {
    const filtros = {};
    
    const estado = document.getElementById('modal-historial-estado-filter')?.value;
    if (estado) {
        filtros.estado = estado;
        console.log('✅ Filtro de estado:', estado);
    }
    
    const usuario = document.getElementById('modal-historial-usuario-filter')?.value;
    if (usuario) {
        filtros.usuario = usuario; // Usar directamente el username
        console.log('✅ Filtro de usuario:', usuario);
    }
    
    const desde = document.getElementById('modal-historial-desde')?.value;
    if (desde) {
        filtros.desde = desde;
        console.log('✅ Filtro desde:', desde);
    }
    
    const hasta = document.getElementById('modal-historial-hasta')?.value;
    if (hasta) {
        filtros.hasta = hasta;
        console.log('✅ Filtro hasta:', hasta);
    }
    
    console.log('📋 Filtros finales del modal:', filtros);
    return filtros;
}

// Función para limpiar filtros del modal
function limpiarFiltrosHistorialModal() {
    console.log('🧹 Limpiando filtros del modal...');
    
    // Limpiar todos los filtros
    const estadoFilter = document.getElementById('modal-historial-estado-filter');
    const usuarioFilter = document.getElementById('modal-historial-usuario-filter');
    const periodoFilter = document.getElementById('modal-historial-periodo-filter');
    const desdeInput = document.getElementById('modal-historial-desde');
    const hastaInput = document.getElementById('modal-historial-hasta');
    
    if (estadoFilter) estadoFilter.value = '';
    if (usuarioFilter) usuarioFilter.value = '';
    if (periodoFilter) periodoFilter.value = '';
    if (desdeInput) desdeInput.value = '';
    if (hastaInput) hastaInput.value = '';
    
    console.log('✅ Filtros limpiados, aplicando vista sin filtros...');
    
    // Aplicar filtros (que ahora estarán vacíos, mostrando todos los datos)
    aplicarFiltrosHistorialModal();
}

// Función para configurar view toggles del modal
function configurarViewTogglesModal() {
    const toggles = document.querySelectorAll('#modalHistorial .view-toggle');
    
    console.log('🔧 Configurando view toggles del modal:', toggles.length, 'toggles encontrados');
    
    toggles.forEach((toggle, index) => {
        // Remover listeners anteriores si existen
        toggle.replaceWith(toggle.cloneNode(true));
    });
    
    // Obtener los nuevos elementos después del cloning
    const newToggles = document.querySelectorAll('#modalHistorial .view-toggle');
    
    newToggles.forEach((toggle, index) => {
        toggle.addEventListener('click', (e) => {
            console.log('👆 View toggle clickeado:', e.target.dataset.view);
            
            // Remover active de todos
            newToggles.forEach(t => t.classList.remove('active'));
            // Agregar active al clickeado
            e.target.classList.add('active');
            
            const view = e.target.dataset.view;
            currentView = view;
            
            console.log('🔄 Cambiando vista a:', view);
            
            // Aplicar filtros para actualizar la vista con la nueva configuración
            aplicarFiltrosHistorialModal();
        });
    });
    
    // Asegurar que timeline esté activo por defecto
    const timelineToggle = document.querySelector('#modalHistorial .view-toggle[data-view="timeline"]');
    if (timelineToggle) {
        timelineToggle.classList.add('active');
        currentView = 'timeline';
    }
}



window.mostrarHistorialCompleto = mostrarHistorialCompleto;

// Función global para mostrar modal de agregar libro
function mostrarModalAgregarLibro() {
    console.log("Mostrando modal agregar libro");
    document.getElementById('modalLibro').style.display = 'flex';
    document.getElementById('modalLibro').style.zIndex = '1000';
    cargarCategorias();
    
    // Mostrar input de crear categoría solo si es owner
    const clubId = getClubId();
    if (clubId) {
        fetch(`${API_URL}/club/${clubId}`)
            .then(res => res.json())
            .then(data => {
                const userId = localStorage.getItem("userId");
                const isOwner = data.club && data.club.id_owner == userId;
                const crearCategoriaBox = document.getElementById('crearCategoriaBox');
                if (crearCategoriaBox) {
                    crearCategoriaBox.style.display = isOwner ? 'block' : 'none';
                }
            })
            .catch(error => {
                console.error("Error al verificar ownership:", error);
            });
    }
}

// Hacer la función global
window.mostrarModalAgregarLibro = mostrarModalAgregarLibro;

// ==================== CATEGORIES DISPLAY FUNCTIONS ====================
async function cargarCategoriasClub() {
    try {
        // Usar los datos del club que ya están cargados
        if (window.clubData && window.clubData.readBooks) {
            const categoriasStats = calcularEstadisticasCategorias(window.clubData.readBooks);
            mostrarCategoriasDisplay(categoriasStats);
        } else {
            // Si no hay datos del club, intentar cargarlos
            const clubId = getClubId();
            if (!clubId) {
                mostrarCategoriasVacio();
                return;
            }

            const response = await fetch(`${API_URL}/club/${clubId}`);
            const data = await response.json();
            
            if (data.success && data.club && data.club.readBooks) {
                const categoriasStats = calcularEstadisticasCategorias(data.club.readBooks);
                mostrarCategoriasDisplay(categoriasStats);
            } else {
                mostrarCategoriasVacio();
            }
        }
    } catch (error) {
        console.error('Error al cargar categorías del club:', error);
        mostrarCategoriasVacio();
    }
}

function calcularEstadisticasCategorias(libros) {
    const categoriasCount = {};
    let totalLibros = 0;
    
    // Contar libros por categoría
    libros.forEach(libro => {
        if (libro.categorias && Array.isArray(libro.categorias)) {
            libro.categorias.forEach(categoria => {
                const nombreCat = categoria.nombre || categoria;
                categoriasCount[nombreCat] = (categoriasCount[nombreCat] || 0) + 1;
                totalLibros++;
            });
        }
    });
    
    // Convertir a array y ordenar por cantidad
    const categoriasArray = Object.entries(categoriasCount)
        .map(([nombre, count]) => ({ nombre, count }))
        .sort((a, b) => b.count - a.count);
    
    // Agregar porcentajes
    categoriasArray.forEach(cat => {
        cat.porcentaje = totalLibros > 0 ? (cat.count / totalLibros) * 100 : 0;
    });
    
    return categoriasArray;
}

function mostrarCategoriasDisplay(categorias) {
    const container = document.getElementById('categories-display-list');
    
    if (!categorias || categorias.length === 0) {
        mostrarCategoriasVacio();
        return;
    }
    
    // Colores para las categorías (igual que en la imagen)
    const colores = [
        '#4a90e2', // Azul
        '#17a2b8', // Teal
        '#28a745', // Verde
        '#fd7e14', // Naranja
        '#e83e8c', // Rosa
        '#6f42c1', // Púrpura
        '#20c997', // Verde menta
        '#ffc107'  // Amarillo
    ];
    
    const html = categorias.map((categoria, index) => {
        const color = colores[index % colores.length];
        const maxPorcentaje = Math.max(...categorias.map(c => c.porcentaje));
        const anchoBarra = maxPorcentaje > 0 ? (categoria.porcentaje / maxPorcentaje) * 100 : 0;
        
        return `
            <div class="category-item-display">
                <div class="category-info">
                    <span class="category-name">${categoria.nombre}</span>
                    <span class="category-count">${categoria.count}</span>
                </div>
                <div class="category-progress-bar">
                    <div class="category-progress-fill" style="width: ${anchoBarra}%; background-color: ${color};"></div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function mostrarCategoriasVacio() {
    const container = document.getElementById('categories-display-list');
    container.innerHTML = `
        <div class="category-item-display">
            <div class="category-info">
                <span class="category-name">No hay categorías disponibles</span>
                <span class="category-count">0</span>
            </div>
            <div class="category-progress-bar">
                <div class="category-progress-fill" style="width: 0%; background-color: #4a90e2;"></div>
            </div>
        </div>
    `;
}

// Función para actualizar las categorías cuando se modifique el club
function actualizarCategoriasDisplay() {
    cargarCategoriasClub();
}

// Agregar la función a la inicialización del club
document.addEventListener('DOMContentLoaded', function() {
    // Cargar categorías después de que se cargue el club
    setTimeout(() => {
        cargarCategoriasClub();
    }, 2000);
});

// Hacer la función global para actualizaciones
window.actualizarCategoriasDisplay = actualizarCategoriasDisplay;

// ==================== READING PROGRESS FUNCTIONS ====================
async function cargarProgresoLectura() {
    try {
        const clubId = getClubId();
        if (!clubId) {
            console.log('No se encontró clubId para cargar progreso de lectura');
            mostrarProgresoVacio();
            return;
        }

        console.log('Cargando progreso de lectura para club:', clubId);
        const response = await fetch(`${API_URL}/club/${clubId}`);
        const data = await response.json();
        
        if (data.success && data.club && data.club.readBooks) {
            console.log('Libros recibidos:', data.club.readBooks.length);
            // Filtrar solo los libros que están siendo leídos actualmente
            const librosLeyendo = data.club.readBooks.filter(libro => {
                console.log(`Libro: ${libro.title}, Estado: ${libro.estado}`);
                return libro.estado === 'leyendo';
            });
            console.log('Libros con estado "leyendo":', librosLeyendo.length, librosLeyendo);
            mostrarProgresoLectura(librosLeyendo);
        } else {
            console.log('No se recibieron libros o la respuesta no fue exitosa');
            mostrarProgresoVacio();
        }
    } catch (error) {
        console.error('Error al cargar progreso de lectura:', error);
        mostrarProgresoVacio();
    }
}

function mostrarProgresoLectura(libros) {
    const container = document.getElementById('progress-list');
    const counter = document.getElementById('active-books-count');
    
    if (!libros || libros.length === 0) {
        mostrarProgresoVacio();
        return;
    }
    
    // Actualizar el contador
    counter.textContent = `${libros.length} libro${libros.length !== 1 ? 's' : ''} activo${libros.length !== 1 ? 's' : ''}`;
    
    const html = libros.map(libro => {
        // Calcular progreso usando la estructura correcta
        const paginaActual = libro.paginaActual || 0;
        const totalPaginas = libro.totalPages || libro.pages || 0;
        const porcentaje = totalPaginas > 0 ? Math.round((paginaActual / totalPaginas) * 100) : 0;
        
        return `
            <div class="progress-item" data-libro-id="${libro.id}">
                <div class="book-thumbnail">
                    <img src="${libro.portada || '../images/book-placeholder.jpg'}" 
                         alt="${libro.title}" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="book-placeholder" style="display:none;">📖</div>
                </div>
                <div class="book-info">
                    <h4>${libro.title || 'Título no disponible'}</h4>
                    <p>${libro.author || 'Autor desconocido'}</p>
                    <div class="progress-details">
                        <span>${paginaActual} de ${totalPaginas} páginas</span>
                        <span>${porcentaje}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${porcentaje}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function mostrarProgresoVacio() {
    const container = document.getElementById('progress-list');
    const counter = document.getElementById('active-books-count');
    
    counter.textContent = '0 libros activos';
    
    container.innerHTML = `
        <div class="progress-empty">
            <div class="progress-empty-icon">📚</div>
            <h4>No hay libros en progreso</h4>
            <p>Los libros que estés leyendo aparecerán aquí con su progreso</p>
        </div>
    `;
}

// Función para actualizar el progreso cuando se modifique un libro
function actualizarProgresoLectura() {
    cargarProgresoLectura();
}

// Agregar la función a la inicialización del club
document.addEventListener('DOMContentLoaded', function() {
    // Cargar progreso de lectura después de que se cargue el club
    setTimeout(() => {
        cargarProgresoLectura();
    }, 1500);
});

// Hacer la función global para actualizaciones
window.actualizarProgresoLectura = actualizarProgresoLectura;

