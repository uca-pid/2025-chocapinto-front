// Variables para filtros
let filtroTexto = '';
let filtroEstado = 'todos';


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
    
    // Actualizar contador de biblioteca
    const bibliotecaCount = document.getElementById('biblioteca-count');
    if (bibliotecaCount) {
        const totalLibros = libros.length;
        const librosAMostrar = Math.min(totalLibros, 12);
        if (totalLibros > 12) {
            bibliotecaCount.textContent = `Mostrando ${librosAMostrar} de ${totalLibros} libros`;
        } else {
            bibliotecaCount.textContent = `${totalLibros} libro${totalLibros !== 1 ? 's' : ''}`;
        }
    }

    // Mostrar libros filtrados (limitado a 12 para biblioteca reciente)
    if (libros.length > 0) {
        const librosLimitados = libros.slice(0, 12);
        librosLimitados.forEach(libro => {
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

                        

                        <div class="book-meta">
                            <span class="book-status-badge ${estadoClass}" title="Estado automático - No editable">${estadoInfo.label}</span>
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
        // Actualizar contador cuando no hay libros
        const bibliotecaCount = document.getElementById('biblioteca-count');
        if (bibliotecaCount) {
            bibliotecaCount.textContent = '0 libros';
        }
        
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


async function cambiarEstadoLibro(bookId, nuevoEstado) {
    const clubId = getClubId();
    const username = localStorage.getItem("username");
    
    if (!username) {
        showNotification("error", "Usuario no identificado");
        return;
    }

    showLoader("Actualizando estado del libro...");
    
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
            console.log(`📚 Estado del libro actualizado automáticamente a: ${getEstadoLabel(nuevoEstado)}`);
            // Recargar los datos del club para actualizar las estadísticas
            renderClub();
            // Actualizar la sección de progreso de lectura
            if (typeof cargarProgresoLectura === 'function') {
                cargarProgresoLectura();
            }
            // Actualizar actividad reciente después de cambiar estado
            cargarActividadReciente();
        } else {
            hideLoader();
            console.error("Error al cambiar estado automáticamente:", data.message);
        }
    } catch (error) {
        hideLoader();
        console.error("Error al cambiar estado automáticamente:", error);
    }
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

document.addEventListener('input', (e) => {
  if (e.target.id === 'search-books') {
    filtroTexto = e.target.value;
    if (window.clubData) {
      aplicarFiltros(window.clubData);
    }
  }
});

document.addEventListener('change', async (e) => {
  // Event listener para el filtro de estado
  if (e.target.id === 'estado-filter') {
    filtroEstado = e.target.value;
    if (window.clubData) {
      aplicarFiltros(window.clubData);
    }
  }
});

document.addEventListener("click", async (e) => {
  // Note: btn-comentarios event handling moved to club-modal-comments.js to avoid duplicates
  
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

// ========== INICIALIZACIÓN ==========
function initLibrary() {
    console.log('📚 Inicializando library...');
    
    // Configurar event listeners para filtros
    setupLibraryEventListeners();
    
    // Exponer funciones globalmente para HTML
    window.aplicarFiltros = aplicarFiltros;
    window.eliminarLibro = eliminarLibro;
    
    console.log('✅ Library inicializado correctamente');
}

function setupLibraryEventListeners() {
    // Event listeners para búsqueda y filtros
    const searchInput = document.getElementById('search-books');
    const estadoFilter = document.getElementById('estado-filter');
    const clearSearch = document.getElementById('clear-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filtroTexto = e.target.value;
            if (window.clubData) {
                aplicarFiltros(window.clubData, []);
            }
            
            // Mostrar/ocultar botón de limpiar
            if (clearSearch) {
                clearSearch.style.display = filtroTexto ? 'flex' : 'none';
            }
        });
    }
    
    if (estadoFilter) {
        estadoFilter.addEventListener('change', (e) => {
            filtroEstado = e.target.value;
            if (window.clubData) {
                aplicarFiltros(window.clubData, []);
            }
        });
    }
    
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                filtroTexto = '';
                clearSearch.style.display = 'none';
                if (window.clubData) {
                    aplicarFiltros(window.clubData, []);
                }
            }
        });
    }
}

// Exportar función de inicialización
window.initLibrary = initLibrary;

// Export for ES6 modules
export { initLibrary };