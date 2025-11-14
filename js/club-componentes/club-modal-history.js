// History Modal Initialization
function initHistoryModal() {
    console.log("Initializing History Modal");
    
    // Setup event listeners and expose global functions
    setupHistorialClubEventListeners();
    
    // Expose necessary functions globally for HTML compatibility
    window.mostrarHistorialCompleto = mostrarHistorialCompleto;
    // Note: View toggling and modal closing are handled by setupHistorialClubEventListeners
}

// Variables para el historial
let historialClubData = [];
let currentView = 'timeline';
let clubStats = {};
let historialEventListenersConfigured = false;


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
    
    // ESPERAR A QUE EL MODAL SE RENDERICE COMPLETAMENTE
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
        console.log('📊 Datos disponibles:', (window.historialClubData || historialClubData || []).length, 'elementos');
        
        // Cargar filtros de usuarios DESPUÉS de que el modal esté visible
        await cargarFiltrosUsuariosModal();
        
        // Si no hay datos del historial, intentar cargarlos
        if ((!window.historialClubData || window.historialClubData.length === 0) && 
            (!historialClubData || historialClubData.length === 0)) {
            console.log('📡 Intentando cargar historial del club...');
            await cargarHistorialClub();
        }
        
        // Configurar event listeners DESPUÉS de cargar datos
        configurarFiltrosHistorialModal();
        
        // Configurar view toggles del modal DESPUÉS de que todo esté listo
        configurarViewTogglesModal();
        
        // Limpiar filtros para mostrar todos los datos inicialmente
        limpiarFiltrosHistorialModal();
        
        // Inicializar filtros como colapsados por defecto para dar más espacio
        const filtersContainer = document.getElementById('historial-modal-filters');
        const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
        if (filtersContainer && toggleFiltersBtn) {
            filtersContainer.classList.add('collapsed');
            toggleFiltersBtn.classList.add('collapsed');
            toggleFiltersBtn.title = 'Mostrar Filtros';
            console.log('📁 Filtros inicializados como colapsados');
        }
        
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

async function cargarHistorialClub(filtros = {}) {
    try {
        console.log('🚀 Cargando historial del club desde datos locales...');
        showLoader("Generando historial del club...");
        
        // Generar historial desde los datos del club actual
        const historialGenerado = await generarHistorialDesdeClubData();
        
        // Guardar todos los datos en variable global
        window.historialClubData = historialGenerado;
        
        // Aplicar filtros localmente
        historialClubData = aplicarFiltrosLocal(window.historialClubData, filtros);
        
        // Generar estadísticas desde los datos locales
        clubStats = generarEstadisticasDesdeHistorial(historialClubData);
        
        hideLoader();
        
        // Actualizar información del club si está disponible
        if (window.clubData) {
            actualizarInfoClubHistorial(window.clubData);
        }
        
        actualizarEstadisticasHistorialClub();
        actualizarVistaHistorialClub();
        poblarFiltroUsuarios();
        
        console.log('✅ Historial generado exitosamente:', historialClubData.length, 'eventos');
        
    } catch (error) {
        hideLoader();
        console.error('❌ Error al generar historial del club:', error);
        
        // Fallback: intentar cargar desde API
        try {
            console.log('🔄 Intentando cargar desde API como fallback...');
            const clubId = getClubId();
            const params = new URLSearchParams(filtros);
            
            const response = await fetch(`${API_URL}/club/${clubId}/reading-history?${params}`);
            const data = await response.json();
            
            if (data.success) {
                window.historialClubData = data.historial || [];
                historialClubData = aplicarFiltrosLocal(window.historialClubData, filtros);
                await cargarEstadisticasClub(filtros);
            } else {
                throw new Error('API no disponible');
            }
        } catch (apiError) {
            console.log('⚠️ API no disponible, mostrando estado vacío');
            historialClubData = [];
            clubStats = {};
        }
        
        // Actualizar información del club aunque haya error
        if (window.clubData) {
            actualizarInfoClubHistorial(window.clubData);
        }
        
        actualizarVistaHistorialClub();
        poblarFiltroUsuarios();
    }
}

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

// ========== NUEVAS FUNCIONES PARA GENERAR HISTORIAL DESDE DATOS LOCALES ==========

/**
 * Genera el historial de cambios basado en los datos actuales del club
 * @returns {Array} Array de eventos de historial
 */
async function generarHistorialDesdeClubData() {
    console.log('📊 Generando historial desde datos del club...');
    
    if (!window.clubData) {
        console.warn('⚠️ No hay datos del club disponibles');
        return [];
    }
    
    const eventos = [];
    const club = window.clubData;
    
    // 1. Eventos de libros agregados al club
    if (club.readBooks && Array.isArray(club.readBooks)) {
        club.readBooks.forEach(clubBook => {
            // Buscar información del usuario que agregó el libro
            const usuario = club.members ? 
                club.members.find(member => member.username === clubBook.addedBy) : 
                { id: 0, username: clubBook.addedBy || 'Usuario desconocido' };
            
            eventos.push({
                id: `libro-agregado-${clubBook.id}`,
                tipo: 'libro_agregado',
                estado: 'agregado',
                fechaCambio: clubBook.addedAt || new Date().toISOString(),
                book: {
                    id: clubBook.id,
                    title: clubBook.title,
                    author: clubBook.author,
                    thumbnail: clubBook.portada || '',
                    categorias: clubBook.categorias || []
                },
                user: usuario,
                descripcion: `Agregó el libro "${clubBook.title}" al club`
            });
            
            // Si el libro está en estado "leyendo" o "leido", agregar esos eventos también
            if (clubBook.estado === 'leyendo' || clubBook.estado === 'leido') {
                // Evento de inicio de lectura
                eventos.push({
                    id: `lectura-iniciada-${clubBook.id}`,
                    tipo: 'lectura_iniciada', 
                    estado: 'leyendo',
                    fechaCambio: calcularFechaInicioLectura(clubBook.addedAt),
                    fechaInicio: calcularFechaInicioLectura(clubBook.addedAt),
                    book: {
                        id: clubBook.id,
                        title: clubBook.title,
                        author: clubBook.author,
                        thumbnail: clubBook.portada || ''
                    },
                    user: usuario,
                    descripcion: `Comenzó a leer "${clubBook.title}"`
                });
            }
            
            // Si el libro está completado
            if (clubBook.estado === 'leido') {
                const fechaFin = calcularFechaFinLectura(clubBook.addedAt);
                eventos.push({
                    id: `lectura-completada-${clubBook.id}`,
                    tipo: 'lectura_completada',
                    estado: 'leido', 
                    fechaCambio: fechaFin,
                    fechaInicio: calcularFechaInicioLectura(clubBook.addedAt),
                    fechaFin: fechaFin,
                    book: {
                        id: clubBook.id,
                        title: clubBook.title,
                        author: clubBook.author,
                        thumbnail: clubBook.portada || ''
                    },
                    user: usuario,
                    descripcion: `Completó la lectura de "${clubBook.title}"`
                });
            }
        });
    }
    
    // 2. Intentar cargar eventos de períodos de lectura si están disponibles
    try {
        const eventosPeridos = await obtenerEventosPeriodosLectura();
        eventos.push(...eventosPeridos);
    } catch (error) {
        console.warn('⚠️ No se pudieron cargar eventos de períodos:', error.message);
    }
    
    // 3. Ordenar eventos por fecha (más recientes primero)
    eventos.sort((a, b) => new Date(b.fechaCambio) - new Date(a.fechaCambio));
    
    console.log('✅ Historial generado:', eventos.length, 'eventos');
    return eventos;
}

/**
 * Obtiene eventos desde los períodos de lectura del club
 */
async function obtenerEventosPeriodosLectura() {
    try {
        const clubId = getClubId();
        const response = await fetch(`${API_URL}/club/${clubId}/periodos/historial`);
        const data = await response.json();
        
        if (data.success && data.historial) {
            const eventosPeridos = [];
            
            data.historial.forEach(periodo => {
                if (periodo.libroGanador && periodo.libroGanador.book) {
                    const libro = periodo.libroGanador.book;
                    
                    // Evento de inicio de período
                    eventosPeridos.push({
                        id: `periodo-iniciado-${periodo.id}`,
                        tipo: 'periodo_iniciado',
                        estado: 'leyendo',
                        fechaCambio: periodo.fechaInicioLectura || periodo.fechaInicio,
                        fechaInicio: periodo.fechaInicioLectura || periodo.fechaInicio,
                        book: {
                            id: libro.id,
                            title: libro.title,
                            author: libro.author,
                            thumbnail: libro.portada || ''
                        },
                        user: { username: 'Club', id: 0 },
                        descripcion: `Inició el período de lectura de "${libro.title}"`,
                        periodo: {
                            id: periodo.id,
                            fechaInicio: periodo.fechaInicio,
                            fechaFinLectura: periodo.fechaFinLectura,
                            totalVotos: periodo.opciones ? periodo.opciones.reduce((sum, op) => sum + (op._count?.votos || 0), 0) : 0
                        }
                    });
                    
                    // Evento de finalización si está cerrado
                    if (periodo.estado === 'CERRADO' && periodo.fechaFinLectura) {
                        eventosPeridos.push({
                            id: `periodo-completado-${periodo.id}`,
                            tipo: 'periodo_completado',
                            estado: 'leido',
                            fechaCambio: periodo.fechaFinLectura,
                            fechaInicio: periodo.fechaInicioLectura || periodo.fechaInicio,
                            fechaFin: periodo.fechaFinLectura,
                            book: {
                                id: libro.id,
                                title: libro.title,
                                author: libro.author,
                                thumbnail: libro.portada || ''
                            },
                            user: { username: 'Club', id: 0 },
                            descripcion: `Completó el período de lectura de "${libro.title}"`,
                            periodo: {
                                id: periodo.id,
                                fechaInicio: periodo.fechaInicio,
                                fechaFinLectura: periodo.fechaFinLectura,
                                totalVotos: periodo.opciones ? periodo.opciones.reduce((sum, op) => sum + (op._count?.votos || 0), 0) : 0
                            }
                        });
                    }
                }
            });
            
            return eventosPeridos;
        }
    } catch (error) {
        console.log('📝 Períodos de lectura no disponibles, continuando...');
    }
    
    return [];
}

/**
 * Calcula una fecha estimada de inicio de lectura
 */
function calcularFechaInicioLectura(fechaAgregado) {
    const fecha = new Date(fechaAgregado);
    fecha.setDate(fecha.getDate() + 1); // Un día después de agregado
    return fecha.toISOString();
}

/**
 * Calcula una fecha estimada de finalización de lectura
 */
function calcularFechaFinLectura(fechaAgregado) {
    const fecha = new Date(fechaAgregado);
    fecha.setDate(fecha.getDate() + 14); // 2 semanas después por defecto
    return fecha.toISOString();
}

/**
 * Genera estadísticas desde el historial local
 */
function generarEstadisticasDesdeHistorial(historial) {
    const stats = {
        totalLeidos: 0,
        totalCambios: historial.length,
        usuarioMasActivo: '-',
        promedioLectura: 0,
        porGenero: {},
        porUsuario: {},
        porMes: {}
    };
    
    if (!historial || historial.length === 0) {
        return stats;
    }
    
    const usuariosActividad = {};
    const librosPorGenero = {};
    const actividadPorMes = {};
    let totalDiasLectura = 0;
    let librosCompletados = 0;
    
    historial.forEach(evento => {
        // Contar actividad por usuario
        if (evento.user && evento.user.username !== 'Club') {
            usuariosActividad[evento.user.username] = (usuariosActividad[evento.user.username] || 0) + 1;
        }
        
        // Contar libros completados
        if (evento.estado === 'leido') {
            stats.totalLeidos++;
            librosCompletados++;
            
            // Calcular días de lectura si hay fechas
            if (evento.fechaInicio && evento.fechaFin) {
                const dias = calcularDiasLectura(evento.fechaInicio, evento.fechaFin);
                totalDiasLectura += dias;
            }
        }
        
        // Agrupar por mes
        const fecha = new Date(evento.fechaCambio);
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        actividadPorMes[mesKey] = (actividadPorMes[mesKey] || 0) + 1;
        
        // Categorías/géneros de libros
        if (evento.book && evento.book.categorias && Array.isArray(evento.book.categorias)) {
            evento.book.categorias.forEach(cat => {
                librosPorGenero[cat.nombre || cat] = (librosPorGenero[cat.nombre || cat] || 0) + 1;
            });
        }
    });
    
    // Usuario más activo
    if (Object.keys(usuariosActividad).length > 0) {
        stats.usuarioMasActivo = Object.entries(usuariosActividad)
            .sort(([,a], [,b]) => b - a)[0][0];
    }
    
    // Promedio de días de lectura
    if (librosCompletados > 0) {
        stats.promedioLectura = Math.round(totalDiasLectura / librosCompletados);
    }
    
    stats.porGenero = librosPorGenero;
    stats.porUsuario = usuariosActividad;
    stats.porMes = actividadPorMes;
    
    return stats;
}

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
        
        const estadoInfo = getEstadoInfoMejorado(entry);
        const accionTexto = getAccionTextoMejorado(entry);
        
        return `
            <div class="timeline-item ${entry.estado} ${entry.tipo || ''}">
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
                            <span class="user-avatar" style="background: ${getUserAvatarColor(entry.user.username)}">
                                ${entry.user.username.charAt(0).toUpperCase()}
                            </span>
                            <span class="user-name">${entry.user.username}</span>
                        </div>
                        <span class="action-text">${accionTexto}</span>
                        <span class="estado-badge" style="background: ${estadoInfo.color}">
                            ${estadoInfo.icon} ${estadoInfo.label}
                        </span>
                    </div>
                    ${entry.fechaInicio && entry.fechaFin && (entry.estado === 'leido' || entry.tipo === 'lectura_completada') ? 
                        `<div class="reading-duration">
                            ⏱️ Tiempo de lectura: ${calcularDiasLectura(entry.fechaInicio, entry.fechaFin)} días
                        </div>` : ''
                    }
                    ${entry.periodo ? 
                        `<div class="timeline-extra-info">
                            📊 Período de lectura • ${entry.periodo.totalVotos || 0} votos totales
                        </div>` : ''
                    }
                    ${entry.book.categorias && entry.book.categorias.length > 0 ? 
                        `<div class="timeline-categories">
                            🏷️ ${entry.book.categorias.map(cat => cat.nombre || cat).join(', ')}
                        </div>` : ''
                    }
                </div>
            </div>
        `;
    }).join('');
    
    return `<div class="timeline-container">${timelineItems}</div>`;
}

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
        const estadoInfo = getEstadoInfoMejorado(entry);
        const accionTexto = getAccionTextoMejorado(entry);
        
        return `
            <div class="list-item ${entry.tipo || ''}">
                <div class="list-book-cover">
                    ${entry.book.thumbnail ? 
                        `<img src="${entry.book.thumbnail}" alt="Portada" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                         <div class="list-cover-placeholder" style="display: none;">📖</div>` :
                        `<div class="list-cover-placeholder">📖</div>`
                    }
                </div>
                <div class="list-content">
                    <div class="list-header">
                        <h4>${entry.book.title}</h4>
                        <span class="list-date">${fecha}</span>
                    </div>
                    <p class="list-author">Por ${entry.book.author}</p>
                    <div class="list-action">
                        <div class="list-user">
                            <span class="user-avatar-small" style="background: ${getUserAvatarColor(entry.user.username)}">
                                ${entry.user.username.charAt(0).toUpperCase()}
                            </span>
                            <span class="user-name">${entry.user.username}</span>
                        </div>
                        <span class="action-text">${accionTexto}</span>
                        <span class="estado-badge" style="background: ${estadoInfo.color}">
                            ${estadoInfo.icon} ${estadoInfo.label}
                        </span>
                    </div>
                    ${entry.book.categorias && entry.book.categorias.length > 0 ? 
                        `<div class="list-categories">
                            ${entry.book.categorias.slice(0, 3).map(cat => `<span class="category-tag">${cat.nombre || cat}</span>`).join('')}
                            ${entry.book.categorias.length > 3 ? `<span class="category-more">+${entry.book.categorias.length - 3}</span>` : ''}
                        </div>` : ''
                    }
                </div>
            </div>
        `;
    }).join('');
    
    return `<div class="list-container">${listItems}</div>`;
}

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
    
    // Botón de toggle de filtros
    const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
    const filtersContainer = document.getElementById('historial-modal-filters');
    
    if (toggleFiltersBtn && filtersContainer) {
        toggleFiltersBtn.addEventListener('click', () => {
            const isCollapsed = filtersContainer.classList.contains('collapsed');
            
            if (isCollapsed) {
                // Expandir filtros
                filtersContainer.classList.remove('collapsed');
                toggleFiltersBtn.classList.remove('collapsed');
                toggleFiltersBtn.title = 'Ocultar Filtros';
            } else {
                // Colapsar filtros
                filtersContainer.classList.add('collapsed');
                toggleFiltersBtn.classList.add('collapsed');
                toggleFiltersBtn.title = 'Mostrar Filtros';
            }
        });
    }
    
    historialEventListenersConfigured = true;
    console.log('Event listeners del historial configurados correctamente');
}

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

function configurarFiltrosHistorialModal() {
    console.log('🔧 Configurando filtros del modal historial...');
    
    const estadoFilter = document.getElementById('modal-historial-estado-filter');
    const usuarioFilter = document.getElementById('modal-historial-usuario-filter');
    const periodoFilter = document.getElementById('modal-historial-periodo-filter');
    const desdeInput = document.getElementById('modal-historial-desde');
    const hastaInput = document.getElementById('modal-historial-hasta');
    const limpiarBtn = document.getElementById('modal-limpiar-filtros-btn');
    
    console.log('📋 Elementos encontrados:', {
        estadoFilter: !!estadoFilter,
        usuarioFilter: !!usuarioFilter,
        periodoFilter: !!periodoFilter,
        desdeInput: !!desdeInput,
        hastaInput: !!hastaInput,
        limpiarBtn: !!limpiarBtn
    });
    
    // Remover event listeners existentes y configurar nuevos
    [estadoFilter, usuarioFilter, desdeInput, hastaInput].forEach(element => {
        if (element) {
            // Clonar elemento para remover todos los event listeners
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Agregar nuevo event listener
            newElement.addEventListener('change', aplicarFiltrosHistorialModal);
            console.log(`✅ Event listener configurado para: ${newElement.id}`);
        }
    });
    
    // Event listener para limpiar filtros
    if (limpiarBtn) {
        // Clonar para remover listeners existentes
        const newLimpiarBtn = limpiarBtn.cloneNode(true);
        limpiarBtn.parentNode.replaceChild(newLimpiarBtn, limpiarBtn);
        
        newLimpiarBtn.addEventListener('click', limpiarFiltrosHistorialModal);
        console.log('✅ Event listener configurado para limpiar filtros');
    }

    // Event listener para toggle de filtros - CONFIGURAR CON DELAY
    setTimeout(() => {
        const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
        const filtersContainer = document.getElementById('historial-modal-filters');
        
        console.log('🔄 Configurando toggle de filtros:', {
            toggleBtn: !!toggleFiltersBtn,
            container: !!filtersContainer
        });
        
        if (toggleFiltersBtn && filtersContainer) {
            // Remover listener existente
            const newToggleBtn = toggleFiltersBtn.cloneNode(true);
            toggleFiltersBtn.parentNode.replaceChild(newToggleBtn, toggleFiltersBtn);
            
            newToggleBtn.addEventListener('click', () => {
                const isCollapsed = filtersContainer.classList.contains('collapsed');
                
                console.log(`🎚️ Toggle filtros - Estado actual: ${isCollapsed ? 'colapsado' : 'expandido'}`);
                
                if (isCollapsed) {
                    // Expandir filtros
                    filtersContainer.classList.remove('collapsed');
                    newToggleBtn.classList.remove('collapsed');
                    newToggleBtn.title = 'Ocultar Filtros';
                    console.log('📂 Filtros expandidos');
                } else {
                    // Colapsar filtros
                    filtersContainer.classList.add('collapsed');
                    newToggleBtn.classList.add('collapsed');
                    newToggleBtn.title = 'Mostrar Filtros';
                    console.log('📁 Filtros colapsados');
                }
            });
            
            console.log('✅ Toggle de filtros configurado correctamente');
        } else {
            console.error('❌ No se encontraron elementos para toggle de filtros');
        }
    }, 200); // Dar tiempo extra para que el DOM se estabilice
    
    // Período predefinido - configurar con delay
    setTimeout(() => {
        const periodoFilterNew = document.getElementById('modal-historial-periodo-filter');
        const desdeInputNew = document.getElementById('modal-historial-desde');
        const hastaInputNew = document.getElementById('modal-historial-hasta');
        
        if (periodoFilterNew) {
            periodoFilterNew.addEventListener('change', (e) => {
                const periodo = e.target.value;
                console.log('📅 Período seleccionado:', periodo);
                
                if (periodo) {
                    const { desde, hasta } = obtenerFechasPeriodo(periodo);
                    if (desdeInputNew) desdeInputNew.value = desde;
                    if (hastaInputNew) hastaInputNew.value = hasta;
                    aplicarFiltrosHistorialModal();
                }
            });
            console.log('✅ Event listener de período configurado');
        }
    }, 300);
    
    console.log('🎯 Configuración de filtros completada');
}

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

// ========== FUNCIONES DE UTILIDAD MEJORADAS ==========

/**
 * Obtiene información de estado mejorada para los nuevos tipos de eventos
 */
function getEstadoInfoMejorado(entry) {
    // Si es un evento de tipo específico, usar esa información
    if (entry.tipo) {
        switch (entry.tipo) {
            case 'libro_agregado':
                return {
                    color: '#28a745',
                    icon: '➕',
                    label: 'Agregado'
                };
            case 'lectura_iniciada':
            case 'periodo_iniciado':
                return {
                    color: '#ffc107',
                    icon: '📖',
                    label: 'Leyendo'
                };
            case 'lectura_completada':
            case 'periodo_completado':
                return {
                    color: '#17a2b8',
                    icon: '✅',
                    label: 'Completado'
                };
            default:
                // Fallback al estado normal
                break;
        }
    }
    
    // Usar la función original si está disponible, sino fallback
    if (typeof getEstadoInfo === 'function') {
        return getEstadoInfo(entry.estado);
    }
    
    // Fallback manual
    switch (entry.estado) {
        case 'agregado':
            return { color: '#28a745', icon: '➕', label: 'Agregado' };
        case 'leyendo':
            return { color: '#ffc107', icon: '📖', label: 'Leyendo' };
        case 'leido':
            return { color: '#17a2b8', icon: '✅', label: 'Completado' };
        default:
            return { color: '#6c757d', icon: '❓', label: 'Desconocido' };
    }
}

/**
 * Obtiene texto de acción mejorado para los nuevos tipos de eventos
 */
function getAccionTextoMejorado(entry) {
    if (entry.descripcion) {
        return entry.descripcion;
    }
    
    // Si es un evento de tipo específico
    if (entry.tipo) {
        switch (entry.tipo) {
            case 'libro_agregado':
                return `agregó "${entry.book.title}" al club`;
            case 'lectura_iniciada':
                return `comenzó a leer "${entry.book.title}"`;
            case 'periodo_iniciado':
                return `inició el período de lectura de "${entry.book.title}"`;
            case 'lectura_completada':
                return `completó la lectura de "${entry.book.title}"`;
            case 'periodo_completado':
                return `finalizó el período de lectura de "${entry.book.title}"`;
            default:
                break;
        }
    }
    
    // Usar la función original si está disponible
    if (typeof getAccionTexto === 'function') {
        return getAccionTexto(entry.estado);
    }
    
    // Fallback manual
    switch (entry.estado) {
        case 'agregado':
            return `agregó "${entry.book.title}"`;
        case 'leyendo':
            return `comenzó a leer "${entry.book.title}"`;
        case 'leido':
            return `completó la lectura de "${entry.book.title}"`;
        default:
            return 'realizó una acción';
    }
}

/**
 * Genera color de avatar basado en el username
 */
function getUserAvatarColor(username) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
        '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
        '#10AC84', '#EE5A24', '#0652DD', '#9C88FF', '#FFC312'
    ];
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
}

/**
 * Calcula días de lectura entre dos fechas (fallback local)
 */
function calcularDiasLecturaLocal(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) return 0;
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diferencia = fin.getTime() - inicio.getTime();
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    
    return dias > 0 ? dias : 0;
}

/**
 * Wrapper para calcularDiasLectura que usa la función global si existe
 */
function calcularDiasLectura(fechaInicio, fechaFin) {
    if (typeof window.calcularDiasLectura === 'function') {
        return window.calcularDiasLectura(fechaInicio, fechaFin);
    }
    return calcularDiasLecturaLocal(fechaInicio, fechaFin);
}
window.mostrarHistorialCompleto = mostrarHistorialCompleto;

// ========== FUNCIÓN DE PRUEBA Y DEBUG ==========

/**
 * Función para probar el historial con datos simulados
 */
function probarHistorialConDatosDePrueba() {
    console.log('🧪 Probando historial con datos de prueba...');
    
    // Datos de prueba simulados
    window.clubData = {
        id: 1,
        name: "Club de Prueba",
        description: "Club para probar el historial",
        members: [
            { id: 1, username: "usuario1" },
            { id: 2, username: "usuario2" },
            { id: 3, username: "usuario3" }
        ],
        readBooks: [
            {
                id: 1,
                title: "El Quijote",
                author: "Miguel de Cervantes",
                portada: "",
                estado: "leido",
                addedAt: "2024-10-01T10:00:00Z",
                addedBy: "usuario1",
                categorias: [{ nombre: "Clásicos" }, { nombre: "Literatura" }]
            },
            {
                id: 2,
                title: "Cien años de soledad",
                author: "Gabriel García Márquez",
                portada: "",
                estado: "leyendo",
                addedAt: "2024-10-15T14:30:00Z",
                addedBy: "usuario2",
                categorias: [{ nombre: "Realismo Mágico" }]
            },
            {
                id: 3,
                title: "1984",
                author: "George Orwell",
                portada: "",
                estado: "agregado",
                addedAt: "2024-11-01T09:15:00Z",
                addedBy: "usuario3",
                categorias: [{ nombre: "Distopía" }, { nombre: "Ficción" }]
            }
        ]
    };
    
    // Mostrar el modal
    mostrarHistorialCompleto();
}

// Exponer función de prueba globalmente
window.probarHistorialConDatosDePrueba = probarHistorialConDatosDePrueba;

// Export for ES6 modules
export { initHistoryModal };