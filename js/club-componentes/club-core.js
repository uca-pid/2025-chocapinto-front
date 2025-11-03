window.clubData = null;

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
    
    // obtenerDatosOwner(club.id_owner); // Comentado: elemento club-owner no existe en HTML
    mostrarBotonesAccion(club);
}

function mostrarBotonesAccion(club) {
    const userId = localStorage.getItem("userId");
    console.log('🔧 mostrarBotonesAccion - userId:', userId, 'club.id_owner:', club.id_owner);
    
    // Botones del header
    const eliminarBtnHeader = document.getElementById("eliminarClubBtnHeader");
    const salirBtnHeader = document.getElementById("salirClubBtnHeader");
    const requestsBtn = document.getElementById("requestsBtn");
    
    console.log('🔍 Elementos encontrados:', {
        eliminarBtnHeader: !!eliminarBtnHeader,
        salirBtnHeader: !!salirBtnHeader,
        requestsBtn: !!requestsBtn
    });
    
    // Botones del cuerpo (mantener para compatibilidad)
    
    
    if (club.id_owner == userId) {
        console.log('✅ Usuario es OWNER del club');
        
        // Mostrar botón de eliminar en header
        if (eliminarBtnHeader) {
            eliminarBtnHeader.style.display = "inline-flex";
        }
        // Ocultar botón de salir en header
        if (salirBtnHeader) {
            salirBtnHeader.style.display = "none";
        }
        
        // Mostrar botón de solicitudes para owners
        if (requestsBtn) {
            requestsBtn.style.display = "inline-flex";
            console.log('✅ Botón de solicitudes mostrado');
        } else {
            console.error('❌ No se encontró el botón requestsBtn');
        }
        
        // Mantener compatibilidad con botones del cuerpo
       
        // Actualizar badge de solicitudes para owners
        actualizarBadgeSolicitudes(club);
    } else {
        console.log('❌ Usuario NO es owner del club');
        
        // Mostrar botón de salir en header
        if (salirBtnHeader) {
            salirBtnHeader.style.display = "inline-flex";
        }
        // Ocultar botón de eliminar en header
        if (eliminarBtnHeader) {
            eliminarBtnHeader.style.display = "none";
        }
        // Mantener compatibilidad con botones del cuerpo
        if (salirBtn) {
            salirBtn.style.display = "inline-block";
        }
        if (eliminarBtn) {
            eliminarBtn.style.display = "none";
        }
        // Ocultar botón de solicitudes si no es owner
        if (requestsBtn) {
            requestsBtn.style.display = "none";
            console.log('🚫 Botón de solicitudes ocultado (no es owner)');
        }
        // Ocultar badge para no-owners
        const requestsBadge = document.getElementById('requestsBadge');
        if (requestsBadge) {
            requestsBadge.style.display = 'none';
        }
    }
}

function actualizarBadgeSolicitudes(club) {
    const requestsBadge = document.getElementById('requestsBadge');
    const userId = localStorage.getItem("userId");
    const isOwner = club.id_owner == userId;
    
    if (!requestsBadge) return;
    
    if (isOwner && club.solicitudes && club.solicitudes.length > 0) {
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
    console.log("Configurando event listeners de botones...");
    
    
    
    // Configurar event listeners para botones del header
    const eliminarBtnHeader = document.getElementById('eliminarClubBtnHeader');
    const salirBtnHeader = document.getElementById('salirClubBtnHeader');
    
    if (eliminarBtnHeader) {
        eliminarBtnHeader.addEventListener('click', eliminarClub);
        console.log("Event listener agregado a eliminarClubBtnHeader");
    }
    
    if (salirBtnHeader) {
        salirBtnHeader.addEventListener('click', salirDelClub);
        console.log("Event listener agregado a salirClubBtnHeader");
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
    
    const requestsBtn = document.getElementById('requestsBtn');
    if (requestsBtn) {
        requestsBtn.addEventListener('click', function() {
            console.log("Botón de solicitudes clickeado");
            mostrarSolicitudesModal();
        });
        console.log("Event listener agregado a requestsBtn");
    }
    
    // Note: configurarModalGrafico() and setupHistorialClubEventListeners() 
    // are now called from their respective init functions
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

// ========== INICIALIZACIÓN ==========
function initCore() {
    console.log('🎯 Inicializando core...');
    
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
    
    console.log('✅ Core inicializado correctamente');
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
        console.log(`Contador de miembros actualizado: ${cantidadMiembros}`);
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