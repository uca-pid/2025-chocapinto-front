import { API_URL } from "../env.js";
import { getClubId } from "./club-utils.js";

async function cargarProgresoLectura() {
    try {
        const clubId = getClubId();
        if (!clubId) {
            console.log('No se encontró clubId para cargar progreso de lectura');
            mostrarProgresoVacio();
            return;
        }

        console.log('Cargando progreso de lectura para club:', clubId);
        
        // Obtener información del período activo y libros del club
        const [clubResponse, estadoResponse] = await Promise.all([
            fetch(`${API_URL}/club/${clubId}`),
            fetch(`${API_URL}/api/club/${clubId}/estado-actual`)
        ]);
        
        const clubData = await clubResponse.json();
        const estadoData = await estadoResponse.json();
        
        if (clubData.success && clubData.club && clubData.club.readBooks) {
            console.log('Libros recibidos:', clubData.club.readBooks.length);
            // Filtrar solo los libros que están siendo leídos actualmente
            const librosLeyendo = clubData.club.readBooks.filter(libro => {
                console.log(`Libro: ${libro.title}, Estado: ${libro.estado}`);
                return libro.estado === 'leyendo';
            });
            console.log('Libros con estado "leyendo":', librosLeyendo.length, librosLeyendo);
            
            // Pasar la información del período activo si existe
            const periodoActivo = estadoData.success && estadoData.estado === 'LEYENDO' ? estadoData.periodo : null;
            mostrarProgresoLectura(librosLeyendo, periodoActivo);
        } else {
            console.log('No se recibieron libros o la respuesta no fue exitosa');
            mostrarProgresoVacio();
        }
    } catch (error) {
        console.error('Error al cargar progreso de lectura:', error);
        mostrarProgresoVacio();
    }
}

function mostrarProgresoLectura(libros, periodoActivo = null) {
    const container = document.getElementById('progress-list');
    const counter = document.getElementById('active-books-count');
    
    if (!libros || libros.length === 0) {
        mostrarProgresoVacio();
        return;
    }
    
    // Actualizar el contador
    counter.textContent = `${libros.length} libro${libros.length !== 1 ? 's' : ''} activo${libros.length !== 1 ? 's' : ''}`;
    
    const html = libros.map(libro => {
        let porcentaje = 0;
        let detalleProgreso = '';
        
        if (periodoActivo && periodoActivo.fechaFinLectura) {
            // Calcular progreso basado en tiempo restante del período de lectura
            const fechaInicio = new Date(periodoActivo.createdAt || periodoActivo.updatedAt);
            const fechaFin = new Date(periodoActivo.fechaFinLectura);
            const ahora = new Date();
            
            // Calcular días totales del período y días transcurridos
            const diasTotales = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
            const diasTranscurridos = Math.ceil((ahora - fechaInicio) / (1000 * 60 * 60 * 24));
            const diasRestantes = Math.max(0, Math.ceil((fechaFin - ahora) / (1000 * 60 * 60 * 24)));
            
            // Calcular porcentaje de tiempo transcurrido
            porcentaje = diasTotales > 0 ? Math.min(100, Math.max(0, Math.round((diasTranscurridos / diasTotales) * 100))) : 0;
            
            // Detalle del progreso basado en tiempo
            if (diasRestantes > 0) {
                detalleProgreso = `${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}`;
            } else {
                detalleProgreso = 'Período finalizado';
                porcentaje = 100;
            }
        } else {
            // Fallback al sistema anterior de páginas si no hay período activo
            const paginaActual = libro.paginaActual || 0;
            const totalPaginas = libro.totalPages || libro.pages || 0;
            porcentaje = totalPaginas > 0 ? Math.round((paginaActual / totalPaginas) * 100) : 0;
            detalleProgreso = `${paginaActual} de ${totalPaginas} páginas`;
        }
        
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
                        <span>${detalleProgreso}</span>
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

function actualizarProgresoLectura() {
    cargarProgresoLectura();
}

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
        '#6f42c1', // Púrpura - color para "otros"
    ];
    
    // Procesar categorías: top 5 + otros
    let categoriasParaMostrar = [];
    
    if (categorias.length <= 5) {
        // Si hay 5 o menos categorías, mostrar todas
        categoriasParaMostrar = [...categorias];
    } else {
        // Tomar las top 5
        const top5 = categorias.slice(0, 5);
        
        // Agrupar el resto como "otros"
        const restoCategorias = categorias.slice(5);
        const countOtros = restoCategorias.reduce((sum, cat) => sum + cat.count, 0);
        const porcentajeOtros = restoCategorias.reduce((sum, cat) => sum + cat.porcentaje, 0);
        
        categoriasParaMostrar = [...top5];
        
        if (countOtros > 0) {
            const nombresOtros = restoCategorias.map(cat => cat.nombre).join(', ');
            categoriasParaMostrar.push({
                nombre: 'Otros',
                count: countOtros,
                porcentaje: porcentajeOtros,
                tooltip: `Incluye: ${nombresOtros}`
            });
        }
    }
    
    const maxPorcentaje = Math.max(...categoriasParaMostrar.map(c => c.porcentaje));
    
    const html = categoriasParaMostrar.map((categoria, index) => {
        const color = colores[index % colores.length];
        const anchoBarra = maxPorcentaje > 0 ? (categoria.porcentaje / maxPorcentaje) * 100 : 0;
        
        return `
            <div class="category-item-display" ${categoria.tooltip ? `title="${categoria.tooltip}"` : ''}>
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

function actualizarCategoriasDisplay() {
    cargarCategoriasClub();
}

async function cargarActividadReciente() {
    const activityList = document.getElementById('recent-activity-list');
    
    if (!activityList) {
        console.warn('❌ Elemento recent-activity-list no encontrado');
        return;
    }

    try {
        console.log('📡 Generando actividad reciente desde datos locales...');
        
        // Generar actividades desde los datos del club actual
        const actividadesGeneradas = await generarActividadDesdeClubData();
        
        if (actividadesGeneradas && actividadesGeneradas.length > 0) {
            console.log('✅ Actividades generadas:', actividadesGeneradas.length, 'elementos');
            
            // Tomar solo las últimas 6 actividades (ordenadas por fecha más reciente)
            const actividadesRecientes = actividadesGeneradas
                .sort((a, b) => new Date(b.fechaCambio) - new Date(a.fechaCambio))
                .slice(0, 6);
            
            activityList.innerHTML = '';
            
            // Crear elementos de actividad usando los datos generados
            actividadesRecientes.forEach(activity => {
                const activityItem = crearItemActividadReal(activity);
                activityList.appendChild(activityItem);
            });
            
            console.log('✅ Actividad reciente cargada exitosamente');
            
        } else {
            console.warn('⚠️ No se generaron actividades');
            mostrarActividadVacia(activityList);
        }
        
    } catch (error) {
        console.error('❌ Error generando actividad reciente:', error);
        
        // Fallback: intentar cargar desde API
        try {
            console.log('🔄 Fallback: intentando cargar desde API...');
            const clubId = getClubId();
            const res = await fetch(`${API_URL}/club/${clubId}/reading-history`);
            const data = await res.json();
            
            if (data.success && data.historial) {
                console.log('✅ Historial recibido de API:', data.historial.length, 'elementos');
                
                // Tomar solo las últimas 6 actividades (ordenadas por fecha más reciente)
                const actividadesRecientes = data.historial
                    .sort((a, b) => new Date(b.fechaCambio) - new Date(a.fechaCambio))
                    .slice(0, 6);
                
                activityList.innerHTML = '';
                
                if (actividadesRecientes.length === 0) {
                    mostrarActividadVacia(activityList);
                    return;
                }
                
                // Crear elementos de actividad usando los datos reales
                actividadesRecientes.forEach(activity => {
                    const activityItem = crearItemActividadReal(activity);
                    activityList.appendChild(activityItem);
                });
                
                console.log('✅ Actividad reciente cargada desde API');
                
            } else {
                console.warn('⚠️ No se pudo obtener historial de API:', data.message);
                mostrarActividadVacia(activityList);
            }
        } catch (apiError) {
            console.warn('⚠️ Error con API, mostrando actividad vacía');
            mostrarActividadError(activityList);
        }
    }
}

/**
 * Genera actividad reciente desde los datos actuales del club
 */
async function generarActividadDesdeClubData() {
    console.log('📊 Generando actividad reciente desde datos del club...');
    
    if (!window.clubData) {
        console.warn('⚠️ No hay datos del club disponibles');
        return [];
    }
    
    const eventos = [];
    const club = window.clubData;
    
    // Eventos de libros agregados al club
    if (club.readBooks && Array.isArray(club.readBooks)) {
        club.readBooks.forEach(clubBook => {
            // Buscar información del usuario que agregó el libro
            const usuario = club.members ? 
                club.members.find(member => member.username === clubBook.addedBy) : 
                { id: 0, username: clubBook.addedBy || 'Usuario desconocido' };
            
            // Evento de libro agregado
            eventos.push({
                id: `libro-agregado-${clubBook.id}`,
                tipo: 'libro_agregado',
                estado: 'por_leer',
                fechaCambio: clubBook.addedAt || new Date().toISOString(),
                book: {
                    id: clubBook.id,
                    title: clubBook.title,
                    author: clubBook.author,
                    thumbnail: clubBook.portada || ''
                },
                user: usuario,
                descripcion: `Agregó el libro "${clubBook.title}" al club`
            });
            
            // Si el libro está en estado "leyendo" o "leido", agregar esos eventos también
            if (clubBook.estado === 'leyendo' || clubBook.estado === 'leido') {
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
    
    console.log('✅ Actividad generada:', eventos.length, 'eventos');
    return eventos;
}

function crearItemActividadReal(activity) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    
    const { icon, text, color } = getActivityDisplayReal(activity);
    const timeAgo = formatTimeAgoReal(activity.fechaCambio);
    
    item.innerHTML = `
        <div class="activity-icon ${color}">
            ${icon}
        </div>
        <div class="activity-content">
            <div class="activity-text">${text}</div>
            
        </div>
    `;
    
    return item;
}

function getActivityDisplayReal(activity) {
    const username = activity.user?.username || 'Usuario desconocido';
    const bookTitle = activity.book?.title || 'Libro desconocido';
    const bookAuthor = activity.book?.author ? ` de ${activity.book.author}` : '';
    
    // Usar el tipo de evento si está disponible, sino usar el estado
    const tipoEvento = activity.tipo || activity.estado;
    
    switch (tipoEvento) {
        case 'libro_agregado':
        case 'por_leer':
            return {
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>`,
                text: `<strong>${username}</strong> agregó "${bookTitle}"${bookAuthor} al club`,
                color: 'book'
            };
            
        case 'lectura_iniciada':
        case 'leyendo':
            return {
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>`,
                text: `<strong>${username}</strong> comenzó a leer "${bookTitle}"${bookAuthor}`,
                color: 'star'
            };
            
        case 'lectura_completada':
        case 'leido':
            const diasLectura = activity.fechaInicio && activity.fechaFin ? 
                calcularDiasLectura(activity.fechaInicio, activity.fechaFin) : null;
            
            const duracionTexto = diasLectura && diasLectura > 0 ? ` en ${diasLectura} día${diasLectura !== 1 ? 's' : ''}` : '';
            
            return {
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                    <path d="M4 22h16"/>
                    <path d="M10 14.66V17c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2.34"/>
                    <path d="M2 14h20v-2c0-4.4-3.6-8-8-8H10c-4.4 0-8 3.6-8 8v2z"/>
                </svg>`,
                text: `<strong>${username}</strong> completó "${bookTitle}"${bookAuthor}${duracionTexto}`,
                color: 'trophy'
            };
            
        default:
            return {
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>`,
                text: `<strong>${username}</strong> realizó una acción con "${bookTitle}"${bookAuthor}`,
                color: 'user'
            };
    }
}

function mostrarActividadVacia(container) {
    container.innerHTML = `
        <div class="activity-item">
            <div class="activity-icon book">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
            </div>
            <div class="activity-content">
                <div class="activity-text">No hay actividad registrada</div>
                <div class="activity-time">Los cambios de estado aparecerán aquí</div>
            </div>
        </div>
    `;
    
    // Actualizar contador
    const activityCount = document.getElementById('activity-count');
    if (activityCount) {
        activityCount.textContent = '0 actividades';
    }
}

function mostrarActividadError(container) {
    container.innerHTML = `
        <div class="activity-item">
            <div class="activity-icon" style="color: #ef4444;">⚠️</div>
            <div class="activity-content">
                <div class="activity-text">Error cargando actividad</div>
                <div class="activity-time">Intenta recargar la página</div>
            </div>
        </div>
    `;
    
    // Actualizar contador
    const activityCount = document.getElementById('activity-count');
    if (activityCount) {
        activityCount.textContent = 'Error';
    }
}

// ========== FUNCIONES AUXILIARES PARA ACTIVIDAD RECIENTE ==========

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
    fecha.setDate(fecha.getDate() + Math.floor(Math.random() * 21) + 7); // Entre 7-28 días para más variación
    return fecha.toISOString();
}

/**
 * Calcula días de lectura entre dos fechas
 */
function calcularDiasLectura(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) return 0;
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = Math.abs(fin - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

/**
 * Formatea el tiempo transcurrido desde una fecha
 */
function formatTimeAgoReal(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    
    
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    if (diffWeeks < 4) return `Hace ${diffWeeks} semana${diffWeeks !== 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short'
    });
}

/**
 * Función de prueba para generar datos de ejemplo del club
 * Úsala para probar la funcionalidad sin backend
 */
window.probarActividadRecienteConDatos = function() {
    console.log('🧪 Generando datos de prueba para actividad reciente...');
    
    // Crear datos de club de ejemplo
    window.clubData = {
        id: 1,
        nombre: "Club de Lectura Test",
        members: [
            { id: 1, username: "Juan", email: "juan@test.com" },
            { id: 2, username: "María", email: "maria@test.com" },
            { id: 3, username: "Carlos", email: "carlos@test.com" },
            { id: 4, username: "Ana", email: "ana@test.com" }
        ],
        readBooks: [
            {
                id: 1,
                title: "Cien años de soledad",
                author: "Gabriel García Márquez",
                portada: "",
                estado: "leido",
                addedBy: "Juan",
                addedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // hace 5 días
            },
            {
                id: 2,
                title: "El Quijote",
                author: "Miguel de Cervantes",
                portada: "",
                estado: "leyendo",
                addedBy: "María", 
                addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // hace 3 días
            },
            {
                id: 3,
                title: "1984",
                author: "George Orwell",
                portada: "",
                estado: "por_leer",
                addedBy: "Carlos",
                addedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // hace 1 día
            },
            {
                id: 4,
                title: "Rayuela",
                author: "Julio Cortázar",
                portada: "",
                estado: "leido",
                addedBy: "Ana",
                addedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() // hace 8 días
            },
            {
                id: 5,
                title: "El Túnel",
                author: "Ernesto Sabato",
                portada: "",
                estado: "leyendo",
                addedBy: "Juan",
                addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // hace 2 días
            }
        ]
    };
    
    // Cargar la actividad reciente con estos datos
    cargarActividadReciente();
    
    console.log('✅ Datos de prueba generados y actividad cargada');
};

// ========== INICIALIZACIÓN ==========
function initWidgets() {
    console.log('🔧 Inicializando widgets...');
    
    // No necesita event listeners específicos por ahora
    // Las funciones se llaman desde club-core.js según sea necesario
    
    // Exponer funciones globalmente
    window.cargarProgresoLectura = cargarProgresoLectura;
    window.cargarCategoriasClub = cargarCategoriasClub;
    window.cargarActividadReciente = cargarActividadReciente;
    window.mostrarRanking = mostrarRanking;
    window.mostrarMiembros = mostrarMiembros;
    
    console.log('✅ Widgets inicializados correctamente');
}

// Exportar función de inicialización
window.initWidgets = initWidgets;

// Export for ES6 modules
export { initWidgets };