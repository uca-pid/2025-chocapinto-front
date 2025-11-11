/**
 * Componente para manejar el historial de períodos de lectura
 */

function initPeriodosHistoryComponent() {
    console.log("Inicializando componente de historial de períodos...");
    
    // Agregar event listener al botón
    const historialBtn = document.getElementById('btn-historial-periodos');
    if (historialBtn) {
        historialBtn.addEventListener('click', mostrarHistorialPeriodos);
        console.log("Event listener agregado al botón de historial de períodos");
    } else {
        console.error("No se encontró el botón btn-historial-periodos");
    }
    
    // Exponer función globalmente
    window.mostrarHistorialPeriodos = mostrarHistorialPeriodos;
    
    console.log("Componente de historial de períodos inicializado correctamente");
}

/**
 * Muestra el modal con el historial de períodos de lectura
 */
async function mostrarHistorialPeriodos() {
    console.log("Mostrando historial de períodos de lectura...");
    
    const modal = document.getElementById('modalPeriodosLectura');
    const loader = document.getElementById('periodosLoader');
    const content = document.getElementById('periodosList');
    const empty = document.getElementById('periodosEmpty');
    
    if (!modal) {
        console.error("No se encontró el modal de períodos");
        return;
    }
    
    // Mostrar modal y loader
    modal.style.display = 'flex';
    loader.style.display = 'flex';
    content.style.display = 'none';
    empty.style.display = 'none';
    
    try {
        const clubId = window.getClubId();
        if (!clubId) {
            throw new Error("No se pudo obtener el ID del club");
        }
        
        console.log(`Cargando períodos para el club ${clubId}...`);
        
        const response = await fetch(`${window.API_URL}/api/club/${clubId}/periodos/historial`);
        const data = await response.json();
        
        console.log("Respuesta del servidor:", data);
        
        if (response.ok && data.success) {
            if (data.historial && data.historial.length > 0) {
                mostrarPeriodos(data.historial);
            } else {
                mostrarEstadoVacio();
            }
        } else {
            throw new Error(data.message || 'Error al cargar períodos');
        }
        
    } catch (error) {
        console.error("Error cargando períodos:", error);
        mostrarError("Error al cargar el historial de períodos. Intenta de nuevo.");
    }
}

/**
 * Muestra la lista de períodos en el modal
 */
function mostrarPeriodos(periodos) {
    console.log(`Mostrando ${periodos.length} períodos...`);
    
    const loader = document.getElementById('periodosLoader');
    const content = document.getElementById('periodosList');
    
    // Ordenar períodos por fecha de creación (más recientes primero)
    periodos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const periodosHTML = periodos.map(periodo => {
        const fechaCreacion = new Date(periodo.createdAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        const fechaFinVotacion = new Date(periodo.fechaFinVotacion).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
        
        const fechaFinLectura = new Date(periodo.fechaFinLectura).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
        
        const fechaCierre = new Date(periodo.updatedAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        let statusClass = 'completado';
        let statusText = 'Completado';
        
        if (periodo.estado === 'CERRADO') {
            statusClass = 'completado';
            statusText = 'Completado';
        } else if (periodo.estado === 'VOTACION') {
            statusClass = 'activo';
            statusText = 'En Votación';
        } else if (periodo.estado === 'LEYENDO') {
            statusClass = 'activo';
            statusText = 'Leyendo';
        } else if (periodo.estado === 'CANCELADO') {
            statusClass = 'cancelado';
            statusText = 'Cancelado';
        }
        
        const libroGanador = periodo.libroGanador;
        
        return `
            <div class="periodo-card">
                <div class="periodo-header">
                    <div class="periodo-info">
                        <h4>${periodo.nombre}</h4>
                        <div class="periodo-dates">
                            <span>📅 Creado: ${fechaCreacion}</span>
                            <span>🗳️ Votación hasta: ${fechaFinVotacion}</span>
                            <span>📖 Lectura hasta: ${fechaFinLectura}</span>
                            ${periodo.estado === 'CERRADO' ? `<span>✅ Cerrado: ${fechaCierre}</span>` : ''}
                        </div>
                    </div>
                    <div class="periodo-status ${statusClass}">${statusText}</div>
                </div>
                
                <div class="periodo-body">
                    ${libroGanador ? `
                        <div class="libro-ganador">
                            <div class="libro-portada-pequena">
                                ${libroGanador.book?.portada ? `
                                    <img src="${libroGanador.book.portada}" 
                                         alt="Portada de ${libroGanador.book.title}" 
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                    <div class="placeholder-portada-pequena" style="display: none;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                                        </svg>
                                    </div>
                                ` : `
                                    <div class="placeholder-portada-pequena">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                                        </svg>
                                    </div>
                                `}
                            </div>
                            <div class="libro-detalles">
                                <h5>${libroGanador.book?.title || 'Libro no disponible'}</h5>
                                <p>${libroGanador.book?.author || 'Autor desconocido'}</p>
                            </div>
                        </div>
                    ` : `
                        <div class="libro-ganador">
                            <div class="libro-portada-pequena">
                                <div class="placeholder-portada-pequena">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                                    </svg>
                                </div>
                            </div>
                            <div class="libro-detalles">
                                <h5>Sin libro ganador</h5>
                                <p>Período no completado</p>
                            </div>
                        </div>
                    `}
                    
                    <div class="periodo-stats">
                        <div class="votos-total">${periodo.totalVotosEmitidos || 0}</div>
                        <div class="votos-label">Votos Totales</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    content.innerHTML = periodosHTML;
    
    // Ocultar loader y mostrar contenido
    loader.style.display = 'none';
    content.style.display = 'block';
}

/**
 * Muestra el estado vacío cuando no hay períodos
 */
function mostrarEstadoVacio() {
    console.log("No hay períodos para mostrar");
    
    const loader = document.getElementById('periodosLoader');
    const empty = document.getElementById('periodosEmpty');
    
    loader.style.display = 'none';
    empty.style.display = 'block';
}

/**
 * Muestra un mensaje de error
 */
function mostrarError(mensaje) {
    console.error("Error en períodos:", mensaje);
    
    const loader = document.getElementById('periodosLoader');
    loader.style.display = 'none';
    
    // Mostrar notificación de error
    if (window.showNotification) {
        window.showNotification("error", mensaje);
    } else {
        alert(mensaje);
    }
    
    // Cerrar modal
    document.getElementById('modalPeriodosLectura').style.display = 'none';
}

// Exportar para uso en otros módulos
export { initPeriodosHistoryComponent };