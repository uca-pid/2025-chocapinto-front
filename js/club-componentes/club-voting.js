function initClubVotingComponent() {
    console.log("Inicializando componente de votación del club...");
    
    // Verificar si los elementos existen en el DOM
    const modal = document.getElementById('modalCrearVotacion');
    const openBtn = document.getElementById('btn-crear-votacion');
    
    console.log("Modal encontrado:", !!modal);
    console.log("Botón encontrado:", !!openBtn);
    
    // Inicializar el modal de crear votación
    initCrearVotacionModal();
    
    // El sistema dinámico se inicializará cuando los datos del club estén listos
    // Se llamará desde club-core.js después de cargar window.clubData
    
    // Exponer funciones globalmente si es necesario
    window.abrirModalCrearVotacion = abrirModalCrearVotacion;
    window.initBotonDinamico = initBotonDinamico; // Exponer para llamada externa
    
    console.log("Componente de votación inicializado correctamente");
}

export function initCrearVotacionModal() {
  console.log("Configurando modal de crear votación...");
  
  const modal = document.getElementById('modalCrearVotacion');
  const openBtn = document.getElementById('btn-crear-votacion');
  const closeBtn = document.getElementById('modal-crear-votacion-close');
  const form = document.getElementById('form-crear-votacion');
  
  if (openBtn) {
    openBtn.addEventListener('click', abrirModalCrearVotacion);
    console.log("Event listener agregado al botón crear votación");
  } else {
    console.error("No se encontró el botón btn-crear-votacion");
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', cerrarModalCrearVotacion);
  }
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      // Si se hace clic en el fondo oscuro
      if (e.target === modal) { 
        cerrarModalCrearVotacion();
      }
    });
  }
  
  if (form) {
    form.addEventListener('submit', handleCrearVotacion);
  }
}

/**
 * Abre el modal y carga los libros "Por Leer"
 */
function abrirModalCrearVotacion() {
  console.log("Abriendo modal para crear votación...");
  
  const modal = document.getElementById('modalCrearVotacion');
  const form = document.getElementById('form-crear-votacion');
  const bookListContainer = document.getElementById('votacion-lista-libros');
  
  // Limpiar formulario (por si se abre de nuevo)
  if (form) {
    form.reset();
    
    // Establecer fechas por defecto para facilitar las pruebas
    const now = new Date();
    const fechaVotacion = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 días desde ahora
    const fechaLectura = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días desde ahora
    
    const inputNombre = document.getElementById('votacion-nombre');
    const inputFechaVotacion = document.getElementById('votacion-fin-votacion');
    const inputFechaLectura = document.getElementById('votacion-fin-lectura');
    
    if (inputNombre) inputNombre.value = `Lectura ${fechaVotacion.toLocaleDateString()}`;
    if (inputFechaVotacion) inputFechaVotacion.value = fechaVotacion.toISOString().slice(0, 16);
    if (inputFechaLectura) inputFechaLectura.value = fechaLectura.toISOString().slice(0, 16);
  }
  
  if (bookListContainer) {
    bookListContainer.innerHTML = '<div class="loader-simple">Cargando libros...</div>';
  }
  
  if (modal) {
    modal.style.display = 'flex';
  }
  
  // Cargar los libros
  cargarLibrosPorLeer();
}

/**
 * Cierra el modal
 */
function cerrarModalCrearVotacion() {
  const modal = document.getElementById('modalCrearVotacion');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Carga los libros con estado "por leer" desde la API
 */
async function cargarLibrosPorLeer() {
  const bookListContainer = document.getElementById('votacion-lista-libros');
  
  try {
    const clubId = window.getClubId(); // Usar la función global
    
    console.log("Cargando libros por leer del club:", clubId);
    
    // Usar el endpoint de debug que tiene los IDs correctos
    console.log("🐞 Usando endpoint de debug que tiene los ClubBook IDs correctos...");
    const debugRes = await fetch(`${window.API_URL}/api/club/${clubId}/libros-debug`);
    const debugData = await debugRes.json();
    console.log("🐞 DEBUG - Respuesta completa:", debugData);
    
    if (debugData.success && debugData.libros) {
      // Filtrar solo libros en estado "por_leer"
      const librosPorLeer = debugData.libros.filter(libro => libro.estado === 'por_leer');
      
      console.log(`Libros por leer encontrados: ${librosPorLeer.length}`);
      console.log('🔍 Estructura completa del primer libro:', JSON.stringify(librosPorLeer[0], null, 2));
      console.log('Libros:', librosPorLeer.map(l => `ID:${l.id} - ${l.title}`));
      
      if (librosPorLeer.length > 0) {
        bookListContainer.innerHTML = librosPorLeer.map(libro => {
          // El endpoint debug tiene la estructura correcta con ClubBook ID
          console.log('📚 Libro desde debug endpoint:', {
            clubBookId: libro.id, // Este es el ClubBook ID correcto
            titulo: libro.titulo,
            autor: libro.autor,
            estado: libro.estado
          });
          
          // Usar el ID del debug endpoint (que es el ClubBook ID correcto)
          const clubBookId = libro.id;
          console.log(`✅ Libro: ${libro.titulo} - ClubBook ID correcto: ${clubBookId}`);
          
          return `
            <div class="book-checkbox-item">
              <input type="checkbox" name="clubBookIds" value="${clubBookId}" id="book-${clubBookId}">
              <label for="book-${clubBookId}">
                <div class="book-info">
                  <strong>${libro.titulo}</strong>
                  <br><small style="color: #6b7280;">${libro.autor || 'Autor desconocido'}</small>
                  <br><small style="color: #94a3b8;">✅ ClubBook ID: ${clubBookId}</small>
                </div>
              </label>
            </div>
          `;
        }).join('');
      } else {
        bookListContainer.innerHTML = '<p class="empty-text">No hay libros en estado "Por Leer" para proponer como opciones de votación. Agrega algunos libros al club primero.</p>';
      }
    } else {
      console.error("Error en la respuesta:", debugData);
      bookListContainer.innerHTML = '<p class="error-text">Error al cargar los libros del club.</p>';
    }
    
  } catch (error) {
    console.error("Error cargando libros por leer:", error);
    bookListContainer.innerHTML = '<p class="error-text">Error al cargar los libros. Intenta de nuevo.</p>';
  }
}

/**
 * Maneja el envío del formulario de creación de votación
 */
async function handleCrearVotacion(e) {
  e.preventDefault(); // Evita que la página se recargue
  console.log("Creando votación...");
  
  const form = document.getElementById('form-crear-votacion');
  
  if (!form) {
    console.error("Formulario no encontrado");
    alert("Error: No se pudo encontrar el formulario");
    return;
  }
  
  // 1. Recolectar datos del formulario
  const formData = new FormData(form);
  
  // Debug: Ver todos los datos del form
  console.log("FormData entries:");
  for (let [key, value] of formData.entries()) {
    console.log(key, value);
  }
  
  // Obtener el username del usuario logueado
  const username = localStorage.getItem('username') || 'usuario_test';
  
  const data = {
    nombre: formData.get('votacion-nombre'),
    fechaFinVotacion: formData.get('votacion-fin-votacion'),
    fechaFinLectura: formData.get('votacion-fin-lectura'),
    clubBookIds: formData.getAll('clubBookIds').map(id => parseInt(id)), // Array de IDs
    username: username // Requerido por el backend
  };

  console.log("Datos recolectados:", data);

  // 2. Validar
  if (data.clubBookIds.length === 0) {
    alert("Debes seleccionar al menos un libro para la votación.");
    return;
  }
  if (!data.nombre || !data.fechaFinVotacion || !data.fechaFinLectura) {
    alert(`Por favor, completa todos los campos:
- Nombre: ${data.nombre}
- Fecha fin votación: ${data.fechaFinVotacion}
- Fecha fin lectura: ${data.fechaFinLectura}`);
    return;
  }

  console.log("Enviando al backend:", data);

  // 3. LLAMADA A LA API
  try {
    window.showLoader("Creando votación...");
    const clubId = window.getClubId();
    
    console.log("🌐 URL:", `${window.API_URL}/api/club/${clubId}/periodos`);
    console.log("📊 ClubId:", clubId);
    console.log("📄 Payload completo:", JSON.stringify(data, null, 2));
    
    const res = await fetch(`${window.API_URL}/api/club/${clubId}/periodos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    console.log("📡 Response status:", res.status);
    console.log("📡 Response ok:", res.ok);
    
    const resultado = await res.json();
    console.log("📄 Response completa:", resultado);
    
    window.hideLoader();
    
    if (res.ok && resultado.success) {
      if (window.showNotification) {
        window.showNotification("success", "¡Votación creada con éxito!");
      } else {
        alert("¡Votación creada con éxito!");
      }
      cerrarModalCrearVotacion();
      // Actualizar el botón en lugar de recargar toda la página
      setTimeout(() => {
        actualizarBotonDinamico(true); // Forzar refresh porque se creó una votación
      }, 500);
    } else {
      console.error("❌ Error del servidor:", resultado);
      alert(`Error: ${resultado.message || 'Error al crear la votación'}`);
    }
    
  } catch (error) {
    console.error("❌ Error de red:", error);
    window.hideLoader();
    alert("Error de conexión con el servidor.");
  }
}

// ========== SISTEMA DE BOTÓN DINÁMICO ==========

/**
 * Inicializa el sistema de botón dinámico que cambia según el estado del club
 */
function initBotonDinamico() {
    console.log("🔄 Inicializando botón dinámico...");
    
    // Actualizar el botón inmediatamente usando datos ya cargados
    actualizarBotonDinamico();
    
    // No más polling constante - solo actualizaremos cuando sea necesario
    console.log("✅ Botón dinámico inicializado sin polling automático");
}

/**
 * Actualiza el botón según el estado actual del club
 * Ahora optimizado para usar datos ya cargados
 */
async function actualizarBotonDinamico(forceRefresh = false) {
    try {
        const clubId = window.getClubId();
        if (!clubId) return;
        
        let estadoData;
        
        if (forceRefresh) {
            // Solo hacer fetch si se solicita explícitamente
            console.log("� Actualizando estado del club (forzado)...");
            const res = await fetch(`${window.API_URL}/api/club/${clubId}/estado-actual`);
            estadoData = await res.json();
        } else {
            // Intentar usar datos ya cargados primero
            console.log("📋 Usando datos locales para determinar estado...");
            estadoData = obtenerEstadoDesdeClubData();
            
            // Si no hay datos locales suficientes, entonces hacer fetch
            if (!estadoData.success) {
                console.log("🌐 Datos locales insuficientes, consultando servidor...");
                const res = await fetch(`${window.API_URL}/api/club/${clubId}/estado-actual`);
                estadoData = await res.json();
            }
        }
        
        console.log("📊 Estado del club:", estadoData);
        
        if (estadoData.success) {
            actualizarBotonSegunEstado(estadoData.estado, estadoData.periodo);
        } else {
            console.error("Error al obtener estado:", estadoData);
            // Mostrar botón por defecto
            mostrarBotonPorDefecto();
        }
        
    } catch (error) {
        console.error("Error actualizando botón dinámico:", error);
        mostrarBotonPorDefecto();
    }
}

/**
 * Intenta determinar el estado del club usando los datos ya cargados
 */
function obtenerEstadoDesdeClubData() {
    if (!window.clubData) {
        return { success: false, message: "No hay datos del club cargados" };
    }
    
    // Por ahora, si no tenemos información de períodos en clubData,
    // asumimos estado INACTIVO como seguro
    // Esto evita requests innecesarios para la mayoría de casos
    
    console.log("📋 Determinando estado desde datos locales...");
    
    // Si hay alguna indicación de período activo en clubData, podríamos usarla aquí
    // Por ahora, defaulteamos a INACTIVO que es el estado más común
    
    return {
        success: true,
        estado: 'INACTIVO',
        periodo: null,
        source: 'local-default'
    };
}

/**
 * Muestra el botón en estado por defecto cuando no hay datos
 */
function mostrarBotonPorDefecto() {
    const boton = document.getElementById('btn-crear-votacion');
    if (boton) {
        configurarBotonInactivo(boton);
        console.log("🎯 Botón configurado en estado por defecto (INACTIVO)");
    }
}

/**
 * Actualiza la interfaz del botón según el estado
 */
function actualizarBotonSegunEstado(estado, periodo) {
    const botonContainer = document.getElementById('btn-crear-votacion');
    if (!botonContainer) return;
    
    console.log(`🎯 Actualizando botón para estado: ${estado}`);
    
    // Limpiar eventos anteriores
    const nuevoBoton = botonContainer.cloneNode(true);
    botonContainer.parentNode.replaceChild(nuevoBoton, botonContainer);
    
    switch (estado) {
        case 'INACTIVO':
            configurarBotonInactivo(nuevoBoton);
            break;
        case 'VOTACION':
            configurarBotonVotacion(nuevoBoton, periodo);
            break;
        case 'LEYENDO':
            configurarBotonLeyendo(nuevoBoton, periodo);
            break;
        default:
            console.warn("Estado desconocido:", estado);
    }
}

/**
 * Configura el botón para estado INACTIVO (crear nueva votación)
 */
function configurarBotonInactivo(boton) {
    boton.innerHTML = `
        <div class="action-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"/>
                <polyline points="9,11 12,8 15,11"/>
                <line x1="12" y1="8" x2="12" y2="21"/>
            </svg>
        </div>
        <span>Crear Votación</span>
    `;
    boton.className = 'quick-action-btn primary';
    boton.onclick = abrirModalCrearVotacion;
}

/**
 * Configura el botón para estado VOTACION (ver votación activa)
 */
function configurarBotonVotacion(boton, periodo) {
    const totalVotos = periodo?.totalVotosEmitidos || 0;
    
    boton.innerHTML = `
        <div class="action-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c.552 0 1-.448 1-1V8c0-.552-.448-1-1-1h-1V6c0-2.761-2.239-5-5-5H8C5.239 1 3 3.239 3 6v1H2c-.552 0-1 .448-1 1v3c0 .552.448 1 1 1h1v1c0 2.761 2.239 5 5 5h8c2.761 0 5-2.239 5-5v-1z"/>
            </svg>
        </div>
        <span>Ver Votación (${totalVotos} votos)</span>
    `;
    boton.className = 'quick-action-btn secondary voting-active';
    boton.onclick = () => abrirModalVotacionActiva(periodo);
}

/**
 * Configura el botón para estado LEYENDO (mostrar libro actual)
 */
function configurarBotonLeyendo(boton, periodo) {
    const libroTitulo = periodo?.libroGanador?.book?.title || 'Libro Actual';
    
    boton.innerHTML = `
        <div class="action-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
        </div>
        <span>Leyendo: ${libroTitulo.substring(0, 20)}${libroTitulo.length > 20 ? '...' : ''}</span>
    `;
    boton.className = 'quick-action-btn secondary reading-active';
    boton.onclick = () => abrirModalLectura(periodo);
}

/**
 * Abre el modal de votación activa
 */
function abrirModalVotacionActiva(periodo) {
    console.log("🗳️ Abriendo modal de votación activa:", periodo);
    
    // Crear modal dinámicamente si no existe
    crearModalVotacionActiva(periodo);
}

/**
 * Abre el modal de lectura actual
 */
function abrirModalLectura(periodo) {
    console.log("📚 Abriendo modal de lectura:", periodo);
    
    // Crear modal dinámicamente si no existe
    crearModalLectura(periodo);
}

/**
 * Crea el modal de votación activa
 */
function crearModalVotacionActiva(periodo) {
    // Verificar si ya existe
    let modal = document.getElementById('modalVotacionActiva');
    if (modal) {
        modal.remove();
    }
    
    // Verificar permisos de moderador/owner
    const tienePermisos = esModeradorOOwner();
    
    // Crear nuevo modal
    modal = document.createElement('div');
    modal.id = 'modalVotacionActiva';
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🗳️ Votación Activa: ${periodo.nombre}</h3>
                <button class="modal-close-btn" onclick="this.closest('.modal-backdrop').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="votacion-info">
                    <p><strong>Total de votos:</strong> ${periodo.totalVotosEmitidos || 0}</p>
                    <p><strong>Finaliza:</strong> ${new Date(periodo.fechaFinVotacion).toLocaleString()}</p>
                </div>
                
                <div class="votacion-actions">
                    ${tienePermisos ? `
                        <button class="btn-cerrar-votacion" onclick="cerrarVotacion(${periodo.id})">
                            🔒 Cerrar Votación
                        </button>
                    ` : ''}
                    <small class="empate-info">⚠️ En caso de empate, se elegirá un ganador al azar</small>
                </div>

                <h4>Opciones disponibles:</h4>
                <div class="opciones-votacion" id="opcionesVotacion">
                    ${periodo.opciones.map(opcion => `
                        <div class="opcion-item">
                            <button class="opcion-btn" onclick="votar(${opcion.id}, '${opcion.clubBook.book.title}')">
                                <div class="opcion-info">
                                    <strong>${opcion.clubBook.book.title}</strong>
                                    <small>${opcion.clubBook.book.author || 'Autor desconocido'}</small>
                                </div>
                                <div class="votos-count">${opcion.totalVotos || 0} votos</div>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Crea el modal de lectura
 */
function crearModalLectura(periodo) {
    // Similar al modal de votación pero para estado de lectura
    let modal = document.getElementById('modalLectura');
    if (modal) {
        modal.remove();
    }
    
    // Verificar permisos de moderador/owner
    const tienePermisos = esModeradorOOwner();
    
    modal = document.createElement('div');
    modal.id = 'modalLectura';
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    
    const libro = periodo.libroGanador?.book;
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📚 Leyendo Actualmente</h3>
                <button class="modal-close-btn" onclick="this.closest('.modal-backdrop').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="libro-actual">
                    <h4>${libro?.title || 'Título no disponible'}</h4>
                    <p><strong>Autor:</strong> ${libro?.author || 'Autor desconocido'}</p>
                    <p><strong>Período:</strong> ${periodo.nombre}</p>
                    <p><strong>Finaliza:</strong> ${new Date(periodo.fechaFinLectura).toLocaleString()}</p>
                </div>
                
                ${tienePermisos ? `
                    <div class="moderador-actions">
                        <button class="btn-submit" onclick="concluirLectura(${periodo.id})">
                            🔒 Concluir Lectura (Moderador)
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Función para votar por una opción
 */
async function votar(opcionId, libroTitulo) {
    try {
        const username = localStorage.getItem('username');
        const clubId = window.getClubId();
        
        // Obtener el periodoId del estado actual
        const estadoRes = await fetch(`${window.API_URL}/api/club/${clubId}/estado-actual`);
        const estadoData = await estadoRes.json();
        const periodoId = estadoData.periodo?.id;
        
        if (!periodoId) {
            alert('Error: No se pudo obtener el período activo');
            return;
        }
        
        window.showLoader('Registrando voto...');
        
        const res = await fetch(`${window.API_URL}/api/periodo/${periodoId}/votar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ opcionId, username })
        });
        
        const resultado = await res.json();
        window.hideLoader();
        
        if (res.ok && resultado.success) {
            alert(`¡Voto registrado por "${libroTitulo}"!`);
            // Cerrar modal y actualizar (forzar refresh porque cambió el estado)
            document.getElementById('modalVotacionActiva')?.remove();
            actualizarBotonDinamico(true);
        } else {
            alert(`Error: ${resultado.message || 'No se pudo registrar el voto'}`);
        }
        
    } catch (error) {
        console.error('Error al votar:', error);
        window.hideLoader();
        alert('Error de conexión al votar');
    }
}

/**
 * Función para cerrar votación (solo moderadores/owners)
 */
async function cerrarVotacion(periodoId) {
    // Verificar permisos primero
    const tienePermisos = esModeradorOOwner();
    if (!tienePermisos) {
        alert('❌ Solo los moderadores y owners pueden cerrar votaciones.');
        return;
    }
    
    if (!confirm('¿Estás seguro de cerrar la votación?\n\n⚠️ En caso de empate, se elegirá un ganador al azar automáticamente.')) return;
    
    try {
        const username = localStorage.getItem('username');
        
        window.showLoader('Cerrando votación...');
        
        const res = await fetch(`${window.API_URL}/api/periodo/${periodoId}/cerrar-votacion`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        
        const resultado = await res.json();
        window.hideLoader();
        
        if (res.ok && resultado.success) {
            const mensaje = resultado.empate ? 
                `¡Votación cerrada!\n\n🎲 Hubo empate y se eligió al azar:\n"${resultado.ganador.libro.title}"` :
                `¡Votación cerrada!\n\n🏆 Ganador: "${resultado.ganador.libro.title}"`;
            
            alert(mensaje);
            document.getElementById('modalVotacionActiva')?.remove();
            actualizarBotonDinamico(true); // Forzar refresh porque cambió el estado
        } else {
            alert(`Error: ${resultado.message || 'No se pudo cerrar la votación'}`);
        }
        
    } catch (error) {
        console.error('Error al cerrar votación:', error);
        window.hideLoader();
        alert('Error de conexión');
    }
}

/**
 * Función para concluir lectura (solo moderadores/owners)
 */
async function concluirLectura(periodoId) {
    // Verificar permisos primero
    const tienePermisos = esModeradorOOwner();
    if (!tienePermisos) {
        alert('❌ Solo los moderadores y owners pueden concluir períodos de lectura.');
        return;
    }
    
    if (!confirm('¿Estás seguro de concluir este período de lectura?')) return;
    
    try {
        const username = localStorage.getItem('username');
        
        window.showLoader('Concluyendo lectura...');
        
        const res = await fetch(`${window.API_URL}/api/periodo/${periodoId}/concluir-lectura`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        
        const resultado = await res.json();
        window.hideLoader();
        
        if (res.ok && resultado.success) {
            alert(`¡Lectura concluida! "${resultado.libroLeido?.title}" marcado como leído.`);
            document.getElementById('modalLectura')?.remove();
            actualizarBotonDinamico(true); // Forzar refresh porque cambió el estado
        } else {
            alert(`Error: ${resultado.message || 'No se pudo concluir la lectura'}`);
        }
        
    } catch (error) {
        console.error('Error al concluir lectura:', error);
        window.hideLoader();
        alert('Error de conexión');
    }
}

/**
 * Verifica si el usuario actual es moderador u owner del club
 * Usa la misma lógica que club-core.js basada en ClubMember
 */
function esModeradorOOwner() {
    try {
        console.log("🔒 Verificando permisos de moderador/owner...");
        
        // Usar los datos del club ya cargados en window.clubData
        if (!window.clubData) {
            console.log("❌ No hay datos del club cargados en window.clubData");
            return false;
        }
        
        const userId = localStorage.getItem('userId');
        if (!userId) {
            console.log("❌ No hay userId en localStorage");
            return false;
        }
        
        console.log(`🔍 Verificando permisos para userId: ${userId}`);
        console.log(`🏠 Club: ${window.clubData.name} (ID: ${window.clubData.id})`);
        
        // Usar las funciones existentes de club-utils.js
        if (typeof window.canUserManageClub === 'function') {
            const canManage = window.canUserManageClub(window.clubData, userId);
            console.log(`🔒 Función canUserManageClub disponible - Resultado: ${canManage}`);
            return canManage;
        } else {
            console.log("⚠️ Función canUserManageClub no disponible, usando fallback manual");
            
            // Fallback: verificación manual si no están las funciones disponibles
            const userIdNum = parseInt(userId);
            
            // Verificar en ClubMember
            if (window.clubData.members && Array.isArray(window.clubData.members)) {
                console.log(`👥 Verificando en ${window.clubData.members.length} miembros...`);
                
                const userMember = window.clubData.members.find(member => member.id == userIdNum);
                
                if (userMember && userMember.role) {
                    const isOwnerOrModerator = userMember.role === 'OWNER' || userMember.role === 'MODERADOR';
                    console.log(`✅ Usuario encontrado en ClubMember - Rol: ${userMember.role}, Puede gestionar: ${isOwnerOrModerator}`);
                    return isOwnerOrModerator;
                } else {
                    console.log(`❌ Usuario no encontrado en ClubMember con ID ${userIdNum}`);
                }
            } else {
                console.log("❌ No hay array de members o está vacío");
            }
            
            // Verificar owner legacy
            if (window.clubData.id_owner == userIdNum) {
                console.log("✅ Verificación legacy - Usuario es owner por id_owner");
                return true;
            }
            
            console.log("❌ Usuario no tiene permisos de moderador/owner");
            return false;
        }
        
    } catch (error) {
        console.error("❌ Error verificando permisos:", error);
        return false;
    }
}

/**
 * Función pública para refrescar el estado del botón manualmente
 */
function refrescarEstadoVotacion() {
    console.log("🔄 Refrescando estado de votación manualmente...");
    return actualizarBotonDinamico(true);
}

// Exponer funciones globalmente para onclick handlers
window.votar = votar;
window.cerrarVotacion = cerrarVotacion;
window.concluirLectura = concluirLectura;
window.refrescarEstadoVotacion = refrescarEstadoVotacion;

export { initClubVotingComponent, refrescarEstadoVotacion };