window.clubData = null;

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

// Make actualizarEstadisticas globally available immediately
window.actualizarEstadisticas = actualizarEstadisticas;

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
        // Almacenar datos del club globalmente
        window.clubData = data.club;
        
        mostrarDatosClub(data.club);
        actualizarContadorMiembros(data.club);
        
        

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

        // Cargar actividad reciente con datos reales
        await cargarActividadReciente();

        // Ocultar loader una vez que todo esté cargado
        hideLoader();

        // Inicializar el sistema de botón dinámico de votación ahora que los datos están listos
        if (typeof window.initBotonDinamico === 'function') {
            
            window.initBotonDinamico();
        }

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

function mostrarClubNoEncontrado(msg) {
    
    hideLoader(); // Asegurar que el loader se oculte
    const nameElement = document.getElementById('club-name');
    const descElement = document.getElementById('club-description');
    
    if (nameElement) nameElement.textContent = "Club no encontrado";
    if (descElement) descElement.textContent = msg;
}

function mostrarDatosClub(club) {
    
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
    
    
    
    const imageSrc = club.imagen || '../images/BooksyLogo.png';
    
    // Actualizar elementos principales (sección Club)
    if (nameElement) {
        nameElement.textContent = club.name;
        
    }
    if (imageElement) {
        imageElement.src = imageSrc;
        
        // Agregar un handler para errores de carga de imagen
        imageElement.onerror = function() {
            
            this.src = '../images/BooksyLogo.png';
        };
    }
    if (descElement) {
        descElement.textContent = club.description;
        
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
    
    // obtenerDatosOwner(club.id_owner); // Comentado: elemento club-owner no existe en HTML
    mostrarBotonesAccion(club);
    
    // Actualizar rol en header basándose en ClubMember
    if (typeof actualizarRolEnHeader === 'function') {
        actualizarRolEnHeader(club);
    } else {
        console.warn('⚠️ Función actualizarRolEnHeader no disponible');
    }
}

function mostrarBotonesAccion(club) {
    const userId = localStorage.getItem("userId");
    
    // Usar el nuevo sistema basado en ClubMember
    const userRole = getUserRoleInClub(club, userId);
    const canManage = canUserManageClub(club, userId);
    const canDelete = canUserDeleteClub(club, userId);
    const canManageRequests = canUserManageRequests(club, userId);
    
  
    // Botones del header
    const eliminarBtnHeader = document.getElementById("eliminarClubBtnHeader");
    const salirBtnHeader = document.getElementById("salirClubBtnHeader");
    const requestsBtn = document.getElementById("requestsBtn");
    
    
    
    // Mostrar/ocultar botón de eliminar club (solo owner)
    if (eliminarBtnHeader) {
        eliminarBtnHeader.style.display = canDelete ? "inline-flex" : "none";
        
    }
    
    // Mostrar/ocultar botón de salir del club (moderadores y lectores pueden salir)
    if (salirBtnHeader) {
        // Solo el OWNER no puede salir del club, moderadores y lectores sí pueden
        const canLeave = !canDelete; // Si no puede eliminar (no es owner), puede salir
        salirBtnHeader.style.display = canLeave ? "inline-flex" : "none";
        
    }
    
    // Mostrar/ocultar botón de solicitudes (owner y moderadores)
    if (requestsBtn) {
        if (canManageRequests) {
            requestsBtn.style.display = "inline-flex";
            
        } else {
            requestsBtn.style.display = "none";
            
        }
    } else {
        console.warn('⚠️ Botón requestsBtn no encontrado en el DOM - puede que no esté implementado en esta página');
    }
    
    // Actualizar badge de solicitudes
    actualizarBadgeSolicitudes(club);
    
    // Configurar permisos adicionales de la UI
    configurarPermisos(club);
}

function actualizarBadgeSolicitudes(club) {
    const requestsBadge = document.getElementById('requestsBadge');
    const userId = localStorage.getItem("userId");
    const canManageRequests = canUserManageRequests(club, userId);
    
    if (!requestsBadge) return;
    
    if (canManageRequests && club.solicitudes && club.solicitudes.length > 0) {
        const pendientes = club.solicitudes.filter(s => s.estado === "pendiente");
        
        if (pendientes.length > 0) {
            requestsBadge.textContent = pendientes.length;
            requestsBadge.style.display = 'flex';
            
        } else {
            requestsBadge.style.display = 'none';
            
        }
    } else {
        requestsBadge.style.display = 'none';
        
    }
}

function configurarPermisos(club) {
    const userId = localStorage.getItem("userId");
    const userRole = getUserRoleInClub(club, userId);
    
    
    
    // Botones de acciones rápidas
    const agregarLibroBtn = document.querySelector('.quick-action-btn.primary'); // Botón "Agregar Libro"
    const votacionesBtn = document.querySelector('.quick-action-btn.secondary'); // Botón "Votaciones"
    
    // Otros elementos que requieren permisos
    const quickActionsCard = document.querySelector('.quick-actions-card');
    
   
    
    // Si el usuario no puede gestionar nada, ocultar toda la card de acciones rápidas para lectores
    const canDoAnyAction = canUserManageClub(club, userId) || canUserManageBooks(club, userId);
    if (quickActionsCard) {
        if (canDoAnyAction) {
            quickActionsCard.style.display = 'block';
            
        } else {
            // Para lectores, mostrar solo algunas acciones
            quickActionsCard.style.display = 'block'; // Mantener visible pero con botones limitados
            
        }
    }
}

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
                const res = await fetch(`${API_URL}/club/${clubId}/removeMember/${userId}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" }
                });
                const data = await res.json();
                if (data.success) {
                    showNotification("success", "Has salido del club");
                    hideLoader();
                    // Redirigir inmediatamente después de confirmar el éxito
                    setTimeout(() => {
                        window.location.href = "main.html";
                    }, 1000);
                } else {
                    hideLoader();
                    showNotification("error", data.message || "No se pudo salir del club");
                }
            } catch (error) {
                hideLoader();
                console.error("Error al salir del club:", error);
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

function setupButtonEventListeners() {
    
    
    
    
    // Configurar event listeners para botones del header
    const eliminarBtnHeader = document.getElementById('eliminarClubBtnHeader');
    const salirBtnHeader = document.getElementById('salirClubBtnHeader');
    
    if (eliminarBtnHeader) {
        eliminarBtnHeader.addEventListener('click', eliminarClub);
        
    } else {
        console.warn('⚠️ Botón eliminarClubBtnHeader no encontrado - funcionalidad no disponible');
    }
    
    if (salirBtnHeader) {
        salirBtnHeader.addEventListener('click', salirDelClub);
        
    } else {
        console.warn('⚠️ Botón salirClubBtnHeader no encontrado - funcionalidad no disponible');
    }
    
    // Configurar event listeners para iconos del header
    const notificationBtn = document.getElementById('notificationBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            
            // Aquí se puede agregar la funcionalidad de notificaciones
            alert("Funcionalidad de notificaciones en desarrollo");
        });
        
    }
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            
            // Aquí se puede agregar la funcionalidad de configuración
            alert("Funcionalidad de configuración en desarrollo");
        });
        
    }
    
    const requestsBtn = document.getElementById('requestsBtn');
    if (requestsBtn) {
        requestsBtn.addEventListener('click', function() {
            
            mostrarSolicitudesModal();
        });
        
    } else {
        console.warn('⚠️ Botón requestsBtn no encontrado - funcionalidad de solicitudes no disponible');
    }
    
    // Note: configurarModalGrafico() and setupHistorialClubEventListeners() 
    // are now called from their respective init functions
}



// ========== INICIALIZACIÓN ==========
function initCore() {
    
    
    // Configurar event listeners
    setupButtonEventListeners();
    
    // Exponer funciones globalmente para HTML
    window.renderClub = renderClub;
    window.mostrarDatosClub = mostrarDatosClub;
    window.mostrarBotonesAccion = mostrarBotonesAccion;
    window.gestionarSolicitud = gestionarSolicitud;
    window.eliminarClub = eliminarClub;
    window.salirDelClub = salirDelClub;
    window.actualizarEstadisticas = actualizarEstadisticas;
    
    
}

// Función para actualizar el contador de miembros en el botón
function actualizarContadorMiembros(clubData) {
    const miembrosCountElement = document.getElementById('miembros-count');
    if (miembrosCountElement) {
        let cantidadMiembros = 0;
        if (clubData && clubData.members && Array.isArray(clubData.members)) {
            cantidadMiembros = clubData.members.length;
        }
        miembrosCountElement.textContent = cantidadMiembros;
        
    } else {
        console.warn('Elemento miembros-count no encontrado en el DOM');
    }
}


// Exportar funciones de inicialización
window.initCore = initCore;
window.renderClub = renderClub;
window.actualizarContadorMiembros = actualizarContadorMiembros;

// Export for ES6 modules
export { initCore, renderClub, actualizarContadorMiembros };