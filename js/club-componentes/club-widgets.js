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
    const clubId = getClubId();
    const activityList = document.getElementById('recent-activity-list');
    
    if (!activityList) {
        console.warn('❌ Elemento recent-activity-list no encontrado');
        return;
    }

    try {
        console.log('📡 Cargando actividad reciente para club:', clubId);
        
        // Usar la ruta existente de historial
        const res = await fetch(`${API_URL}/club/${clubId}/reading-history`);
        const data = await res.json();
        
        if (data.success && data.historial) {
            console.log('✅ Historial recibido:', data.historial.length, 'elementos');
            
            // Tomar solo las últimas 8 actividades (ordenadas por fecha más reciente)
            const actividadesRecientes = data.historial
                .sort((a, b) => new Date(b.fechaCambio) - new Date(a.fechaCambio))
                .slice(0, 8);
            
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
            
            // Actualizar contador de actividades
            const activityCount = document.getElementById('activity-count');
            if (activityCount) {
                activityCount.textContent = `${actividadesRecientes.length} actividad${actividadesRecientes.length !== 1 ? 'es' : ''}`;
            }
            
            console.log('✅ Actividad reciente cargada exitosamente');
            
        } else {
            console.warn('⚠️ No se pudo obtener historial:', data.message);
            mostrarActividadVacia(activityList);
        }
    } catch (error) {
        console.error('❌ Error cargando actividad reciente:', error);
        mostrarActividadError(activityList);
    }
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
            <div class="activity-time">${timeAgo}</div>
        </div>
    `;
    
    return item;
}

function getActivityDisplayReal(activity) {
    const username = activity.user?.username || 'Usuario desconocido';
    const bookTitle = activity.book?.title || 'Libro desconocido';
    const bookAuthor = activity.book?.author ? ` de ${activity.book.author}` : '';
    
    switch (activity.estado) {
        case 'por_leer':
            return {
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>`,
                text: `<strong>${username}</strong> agregó a por leer "${bookTitle}"${bookAuthor} `,
                color: 'book'
            };
            
        case 'leyendo':
            return {
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>`,
                text: `<strong>${username}</strong> cambio el estado a leyendo "${bookTitle}"${bookAuthor}`,
                color: 'star'
            };
            
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
                text: `<strong>${username}</strong> cambio estado a leido "${bookTitle}"${bookAuthor}${duracionTexto}`,
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