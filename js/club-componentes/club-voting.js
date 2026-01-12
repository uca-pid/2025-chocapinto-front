import { showNotification } from "../../componentes/notificacion.js";

function formatearFechaLocal(fecha) {
  const offset = fecha.getTimezoneOffset() * 60000;
  const localDate = new Date(fecha.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
}
function initClubVotingComponent() {
    const modal = document.getElementById('modalCrearVotacion');
    const openBtn = document.getElementById('btn-crear-votacion');
    
    initCrearVotacionModal();
    
    window.abrirModalCrearVotacion = abrirModalCrearVotacion;
    window.initBotonDinamico = initBotonDinamico;
    window.actualizarBotonDinamico = actualizarBotonDinamico;
}

export function initCrearVotacionModal() {
  const modal = document.getElementById('modalCrearVotacion');
  const openBtn = document.getElementById('btn-crear-votacion');
  const closeBtn = document.getElementById('modal-crear-votacion-close');
  const form = document.getElementById('form-crear-votacion');
  
  if (openBtn) {
    openBtn.addEventListener('click', abrirModalCrearVotacion);
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

function abrirModalCrearVotacion() {
  const tienePermisos = esModeradorOOwner();
  if (!tienePermisos) {
    if (window.showNotification) {
      window.showNotification("error", "Solo los moderadores y owners pueden crear votaciones.");
    } else {
      showNotification("error", "Solo los moderadores y owners pueden crear votaciones.");
    }
    return;
  }
  
  const modal = document.getElementById('modalCrearVotacion');
  const form = document.getElementById('form-crear-votacion');
  const bookListContainer = document.getElementById('votacion-lista-libros');
  
  if (form) {
    form.reset();
    
    const now = new Date();
    const fechaVotacion = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fechaLectura = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const inputNombre = document.getElementById('votacion-nombre');
    const inputFechaVotacion = document.getElementById('votacion-fin-votacion');
    const inputFechaLectura = document.getElementById('votacion-fin-lectura');
    
    if (inputNombre) inputNombre.value = `Lectura ${fechaVotacion.toLocaleDateString()}`;
    if (inputFechaVotacion) inputFechaVotacion.value = formatearFechaLocal(fechaVotacion);
    if (inputFechaLectura) inputFechaLectura.value = formatearFechaLocal(fechaLectura);
  } 
  
  if (bookListContainer) {
    bookListContainer.innerHTML = '<div class="loader-simple">Cargando libros...</div>';
  }
  
  if (modal) {
    modal.style.display = 'flex';
  }
  
  cargarLibrosPorLeer();
}

function cerrarModalCrearVotacion() {
  const modal = document.getElementById('modalCrearVotacion');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function cargarLibrosPorLeer() {
  const bookListContainer = document.getElementById('votacion-lista-libros');
  
  try {
    const clubId = window.getClubId();
    
   
    const debugRes = await fetch(`${window.API_URL}/api/club/${clubId}/libros-debug`);
    const debugData = await debugRes.json();
    
    
    if (debugData.success && debugData.libros) {
      const librosPorLeer = debugData.libros.filter(libro => libro.estado === 'por_leer');
      
      if (librosPorLeer.length > 0) {
        bookListContainer.innerHTML = librosPorLeer.map(libro => {
          const clubBookId = libro.id;
          
          return `
            <div class="book-checkbox-item">
              <input type="checkbox" name="clubBookIds" value="${clubBookId}" id="book-${clubBookId}">
              <div class="book-cover">
                ${libro.portada ? `
                  <img src="${libro.portada}" alt="Portada de ${libro.titulo}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                  <div class="placeholder-cover" style="display: none;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                  </div>
                ` : `
                  <div class="placeholder-cover">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                  </div>
                `}
              </div>
              <label for="book-${clubBookId}">
                <div class="book-info">
                  <strong>${libro.titulo}</strong>
                  <small class="book-author">${libro.autor || 'Autor desconocido'}</small>
                </div>
              </label>
            </div>
          `;
        }).join('');
      } else {
        bookListContainer.innerHTML = '<p class="empty-text">No hay libros en estado "Por Leer" para proponer como opciones de votación. Agrega algunos libros al club primero.</p>';
      }
    } else {
      bookListContainer.innerHTML = '<p class="error-text">Error al cargar los libros del club.</p>';
    }
    
  } catch (error) {
    bookListContainer.innerHTML = '<p class="error-text">Error al cargar los libros. Intenta de nuevo.</p>';
  }
}

async function handleCrearVotacion(e) {
  e.preventDefault();
  
  const form = document.getElementById('form-crear-votacion');
  
  if (!form) {
    showNotification("error", "Error: No se pudo encontrar el formulario");
    return;
  }
  
  const formData = new FormData(form);
  
  const username = localStorage.getItem('username') || 'usuario_test';
  
  const data = {
    nombre: formData.get('votacion-nombre'),
    fechaFinVotacion: formData.get('votacion-fin-votacion'),
    fechaFinLectura: formData.get('votacion-fin-lectura'),
    clubBookIds: formData.getAll('clubBookIds').map(id => parseInt(id)),
    username: username
  };

  if (data.clubBookIds.length === 0) {
    showNotification("alert", "Debes seleccionar al menos un libro para la votación.");
    return;
  }
  if (!data.nombre || !data.fechaFinVotacion || !data.fechaFinLectura) {
    showNotification("alert", `Por favor, completa todos los campos:
- Nombre: ${data.nombre}
- Fecha fin votación: ${data.fechaFinVotacion}
- Fecha fin lectura: ${data.fechaFinLectura}`);
    return;
  }

  try {
    window.showLoader("Creando votación...");
    const clubId = window.getClubId();
    
    const res = await fetch(`${window.API_URL}/api/club/${clubId}/periodos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const resultado = await res.json();
    
    window.hideLoader();
    
    if (res.ok && resultado.success) {
      if (window.showNotification) {
        window.showNotification("success", "¡Votación creada con éxito!");
      } else {
        showNotification("success", "¡Votación creada con éxito!");
      }
      cerrarModalCrearVotacion();
      
      actualizarBotonDinamico();
      
      if (typeof window.renderClub === 'function') {
        setTimeout(() => {
          window.renderClub();
        }, 500);
      }
    } else {
      showNotification("error", `Error: ${resultado.message || 'Error al crear la votación'}`);
    }
    
  } catch (error) {
    window.hideLoader();
    showNotification("error", "Error de conexión con el servidor.");
  }
}

function initBotonDinamico() {
    actualizarBotonDinamico();
    setInterval(actualizarBotonDinamico, 15000);
}

async function actualizarBotonDinamico() {
    try {
        const clubId = window.getClubId();
        if (!clubId) {
            return;
        }
        
        const estadoAnterior = window.ultimoEstadoClub || null;
        
        const url = `${window.API_URL}/api/club/${clubId}/estado-actual`;
        
        const res = await fetch(url);
        
        if (!res.ok) {
            return;
        }
        
        const data = await res.json();
        
        if (data.success) {
            detectarCambiosAutomaticos(estadoAnterior, data);
            
            window.ultimoEstadoClub = {
                estado: data.estado,
                periodoId: data.periodo?.id || null,
                timestamp: new Date()
            };
            
            actualizarBotonSegunEstado(data.estado, data.periodo);
        }
        
    } catch (error) {
    }
}

function actualizarBotonSegunEstado(estado, periodo) {
    const botonContainer = document.getElementById('btn-crear-votacion');
    if (!botonContainer) {
        return;
    }
    
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
    }
}

function configurarBotonInactivo(boton) {
    const tienePermisos = esModeradorOOwner();
    
    if (!tienePermisos) {
        boton.style.display = 'none';
        return;
    }
    
    boton.style.display = 'flex';
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

function configurarBotonVotacion(boton, periodo) {
    const totalVotos = periodo?.totalVotosEmitidos || 0;
    
    const nuevoHTML = `
        <div class="action-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c.552 0 1-.448 1-1V8c0-.552-.448-1-1-1h-1V6c0-2.761-2.239-5-5-5H8C5.239 1 3 3.239 3 6v1H2c-.552 0-1 .448-1 1v3c0 .552.448 1 1 1h1v1c0 2.761 2.239 5 5 5h8c2.761 0 5-2.239 5-5v-1z"/>
            </svg>
        </div>
        <span>Ver Votación (${totalVotos} votos)</span>
    `;
    
    boton.innerHTML = nuevoHTML;
    boton.className = 'quick-action-btn secondary voting-active';
    boton.onclick = () => abrirModalVotacionActiva(periodo);
}

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

function abrirModalVotacionActiva(periodo) {
    crearModalVotacionActiva(periodo);
}

function abrirModalLectura(periodo) {
    crearModalLectura(periodo);
}

function crearModalVotacionActiva(periodo) {
    let modal = document.getElementById('modalVotacionActiva');
    if (modal) {
        modal.remove();
    }
    
    const tienePermisos = esModeradorOOwner();
    modal = document.createElement('div');
    modal.id = 'modalVotacionActiva';
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    
    const fechaFinalizacion = new Date(periodo.fechaFinVotacion);
    const ahora = new Date();
    const tiempoRestante = Math.max(0, Math.ceil((fechaFinalizacion - ahora) / (1000 * 60 * 60 * 24)));
    
    modal.innerHTML = `
        <div class="modal-content modal-votacion-activa">
            <div class="modal-header-votacion">
                <div class="header-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12l2 2 4-4"/>
                        <path d="M21 12c.552 0 1-.448 1-1V8c0-.552-.448-1-1-1h-1V6c0-2.761-2.239-5-5-5H8C5.239 1 3 3.239 3 6v1H2c-.552 0-1 .448-1 1v3c0 .552.448 1 1 1h1v1c0 2.761 2.239 5 5 5h8c2.761 0 5-2.239 5-5v-1z"/>
                    </svg>
                </div>
                <div class="header-content">
                    <h2>Votación en Progreso</h2>
                    <span class="period-badge">${periodo.nombre}</span>
                </div>
                <button class="modal-close-btn-votacion" onclick="this.closest('.modal-backdrop').remove()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <div class="modal-body-votacion">
                <div class="votacion-stats">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">${periodo.totalVotosEmitidos || 0}</span>
                            <span class="stat-label">Votos Emitidos</span>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number ${tiempoRestante <= 1 ? 'warning' : ''}">${tiempoRestante}</span>
                            <span class="stat-label">${tiempoRestante === 1 ? 'Día restante' : 'Días restantes'}</span>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">${periodo.opciones.length}</span>
                            <span class="stat-label">Opciones</span>
                        </div>
                    </div>
                </div>

                <div class="votacion-opciones-container">
                    <h3>Opciones de Votación</h3>
                    <div class="opciones-votacion-grid">
                        ${periodo.opciones.map(opcion => `
                            <div class="opcion-card">
                                <div class="opcion-portada">
                                    ${opcion.clubBook.book.portada ? `
                                        <img src="${opcion.clubBook.book.portada}" alt="Portada de ${opcion.clubBook.book.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                        <div class="placeholder-portada" style="display: none;">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                                            </svg>
                                        </div>
                                    ` : `
                                        <div class="placeholder-portada">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                                            </svg>
                                        </div>
                                    `}
                                </div>
                                <div class="opcion-content">
                                    <h4>${opcion.clubBook.book.title}</h4>
                                    <p class="opcion-autor">${opcion.clubBook.book.author || 'Autor desconocido'}</p>
                                    <div class="votos-info">
                                        <span class="votos-numero">${opcion.totalVotos || 0}</span>
                                        <span class="votos-texto">${(opcion.totalVotos || 0) === 1 ? 'voto' : 'votos'}</span>
                                    </div>
                                    <button class="btn-votar" onclick="votar(${opcion.id}, '${opcion.clubBook.book.title.replace(/'/g, "\\'")}')">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M9 12l2 2 4-4"/>
                                        </svg>
                                        Votar por este libro
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${tienePermisos ? `
                    <div class="admin-section-votacion">
                        <div class="admin-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <circle cx="12" cy="16" r="1"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                            <span>Acciones de Moderador</span>
                        </div>
                        <button class="btn-cerrar-votacion-admin" onclick="cerrarVotacion(${periodo.id})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
                                <circle cx="12" cy="16" r="1"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                            Cerrar Votación
                        </button>
                        <p class="admin-note">⚠️ En caso de empate, se elegirá un ganador automáticamente al azar.</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function crearModalLectura(periodo) {
    let modal = document.getElementById('modalLectura');
    if (modal) {
        modal.remove();
    }
    
    const tienePermisos = esModeradorOOwner();
    
    modal = document.createElement('div');
    modal.id = 'modalLectura';
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    
    const libro = periodo.libroGanador?.book;
    const fechaFinalizacion = new Date(periodo.fechaFinLectura);
    const diasRestantes = Math.ceil((fechaFinalizacion - new Date()) / (1000 * 60 * 60 * 24));
    
    modal.innerHTML = `
        <div class="modal-content modal-lectura">
            <div class="modal-header-lectura">
                <div class="header-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                </div>
                <div class="header-content">
                    <h2>Leyendo Actualmente</h2>
                    <span class="period-badge">${periodo.nombre}</span>
                </div>
                <button class="modal-close-btn-lectura" onclick="this.closest('.modal-backdrop').remove()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <div class="modal-body-lectura">
                <div class="libro-card">
                    <div class="libro-cover">
                        ${libro?.portada ? `
                            <img src="${libro.portada}" alt="Portada del libro" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="placeholder-cover" style="display: none;">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                                </svg>
                            </div>
                        ` : `
                            <div class="placeholder-cover">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                                </svg>
                            </div>
                        `}
                    </div>
                    
                    <div class="libro-info">
                        <h3 class="libro-title">${libro?.title || 'Título no disponible'}</h3>
                        <p class="libro-author">por ${libro?.author || 'Autor desconocido'}</p>
                        
                        <div class="reading-progress">
                            <div class="progress-item">
                                <span class="label">Estado</span>
                                <span class="value active">En Lectura</span>
                            </div>
                            <div class="progress-item">
                                <span class="label">Finaliza</span>
                                <span class="value">${fechaFinalizacion.toLocaleDateString('es-ES', { 
                                    day: 'numeric', 
                                    month: 'long', 
                                    year: 'numeric' 
                                })}</span>
                            </div>
                            <div class="progress-item">
                                <span class="label">Tiempo restante</span>
                                <span class="value ${diasRestantes <= 7 ? 'warning' : ''}">${diasRestantes > 0 ? `${diasRestantes} días` : 'Vencido'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${tienePermisos ? `
                    <div class="admin-section">
                        <div class="admin-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <circle cx="12" cy="16" r="1"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                            <span>Acciones de Moderador</span>
                        </div>
                        <button class="btn-concluir-lectura" onclick="concluirLectura(${periodo.id})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9,11 12,14 22,4"/>
                                <path d="M21,12v7a2,2 0 0,1 -2,2H5a2,2 0 0,1 -2,-2V5a2,2 0 0,1 2,-2h11"/>
                            </svg>
                            Concluir Lectura
                        </button>
                        <p class="admin-note">Al concluir, el libro se marcará como leído y el club volverá al estado inactivo.</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function votar(opcionId, libroTitulo) {
    try {
        const username = localStorage.getItem('username');
        const clubId = window.getClubId();
        
        const estadoRes = await fetch(`${window.API_URL}/api/club/${clubId}/estado-actual`);
        const estadoData = await estadoRes.json();
        const periodoId = estadoData.periodo?.id;
        
        if (!periodoId) {
            showNotification("error", 'Error: No se pudo obtener el período activo');
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
            showNotification("success", `¡Voto registrado por "${libroTitulo}"!`);
            document.getElementById('modalVotacionActiva')?.remove();
            actualizarBotonDinamico();
            
            if (typeof window.updateUserXpHeader === 'function') {
                window.updateUserXpHeader();
            }
        } else {
            showNotification("error", `Error: ${resultado.message || 'No se pudo registrar el voto'}`);
        }
        
    } catch (error) {
        window.hideLoader();
        showNotification("error",'Error de conexión al votar');
    }
}

async function cerrarVotacion(periodoId) {
    const tienePermisos = esModeradorOOwner();
    if (!tienePermisos) {
        if (window.showNotification) {
            window.showNotification("error", "Solo los moderadores y owners pueden cerrar votaciones.");
        } else {
            showNotification("error", '❌ Solo los moderadores y owners pueden cerrar votaciones.');
        }
        return;
    }
    
    // Usar modal de confirmación personalizado
    window.mostrarConfirmacion(
        "¿Cerrar la votación?",
        "Esta acción cerrará la votación y determinará el libro ganador. En caso de empate, se elegirá un ganador al azar automáticamente.",
        async () => {
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
                        `¡Votación cerrada! Hubo empate y se eligió al azar: "${resultado.ganador.libro.title}"` :
                        `¡Votación cerrada! Ganador: "${resultado.ganador.libro.title}"`;
                    
                    if (window.showNotification) {
                        window.showNotification("success", mensaje);
                    } else {
                        showNotification("alert",mensaje);
                    }
                    
                    document.getElementById('modalVotacionActiva')?.remove();
                    actualizarBotonDinamico();
                } else {
                    const errorMsg = `Error: ${resultado.message || 'No se pudo cerrar la votación'}`;
                    if (window.showNotification) {
                        window.showNotification("error", errorMsg);
                    } else {
                        showNotification("error", errorMsg);
                    }
                }
                
            } catch (error) {
                window.hideLoader();
                if (window.showNotification) {
                    window.showNotification("error", "Error de conexión al cerrar la votación");
                } else {
                    showNotification("error", 'Error de conexión');
                }
            }
        },
        null,
        {
            confirmText: "Cerrar Votación",
            cancelText: "Cancelar",
            confirmClass: "red-btn",
            cancelClass: "green-btn"
        }
    );
}

async function concluirLectura(periodoId) {
    const tienePermisos = esModeradorOOwner();
    if (!tienePermisos) {
        if (window.showNotification) {
            window.showNotification("error", "Solo los moderadores y owners pueden concluir períodos de lectura.");
        } else {
            showNotification("alert",'❌ Solo los moderadores y owners pueden concluir períodos de lectura.');
        }
        return;
    }
    
    // Usar modal de confirmación personalizado
    window.mostrarConfirmacion(
        "¿Concluir período de lectura?",
        "Esta acción marcará el libro como leído y el club volverá al estado inactivo. Los miembros podrán crear una nueva votación.",
        async () => {
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
                    const mensaje = `¡Lectura concluida! "${resultado.libroLeido?.title}" marcado como leído.`;
                    if (window.showNotification) {
                        window.showNotification("success", mensaje);
                    } else {
                        showNotification("success", mensaje);
                    }
                    
                    if (typeof window.updateUserXpHeader === 'function') {
                        window.updateUserXpHeader();
                    }
                    
                    document.getElementById('modalLectura')?.remove();
                    actualizarBotonDinamico();
                } else {
                    const errorMsg = `Error: ${resultado.message || 'No se pudo concluir la lectura'}`;
                    if (window.showNotification) {
                        window.showNotification("error", errorMsg);
                    } else {
                        showNotification("error", errorMsg);
                    }
                }
                
            } catch (error) {
                window.hideLoader();
                if (window.showNotification) {
                    window.showNotification("error", "Error de conexión al concluir la lectura");
                } else {
                    showNotification("error", 'Error de conexión');
                }
            }
        },
        null,
        {
            confirmText: "Concluir Lectura",
            cancelText: "Cancelar",
            confirmClass: "green-btn",
            cancelClass: "orange-btn"
        }
    );
}

function esModeradorOOwner() {
    try {
        if (!window.clubData) {
            return false;
        }
        
        const userId = localStorage.getItem('userId');
        if (!userId) {
            return false;
        }
        
        if (typeof window.canUserManageClub === 'function') {
            const canManage = window.canUserManageClub(window.clubData, userId);
            return canManage;
        } else {
            
            // Fallback: verificación manual si no están las funciones disponibles
            const userIdNum = parseInt(userId);
            
            if (window.clubData.members && Array.isArray(window.clubData.members)) {
                const userMember = window.clubData.members.find(member => member.id == userIdNum);
                
                if (userMember && userMember.role) {
                    const isOwnerOrModerator = userMember.role === 'OWNER' || userMember.role === 'MODERADOR';
                    return isOwnerOrModerator;
                }
            }
            
            if (window.clubData.id_owner == userIdNum) {
                return true;
            }
            
            return false;
        }
        
    } catch (error) {
        return false;
    }
}

function detectarCambiosAutomaticos(estadoAnterior, estadoActual) {
    if (!estadoAnterior) return;
    
    const estadoAnteriorTipo = estadoAnterior.estado;
    const estadoActualTipo = estadoActual.estado;
    
    if (estadoAnteriorTipo === 'VOTACION' && estadoActualTipo === 'LEYENDO') {
        const libroGanador = estadoActual.periodo?.libroGanador?.book?.title || 'libro seleccionado';
        mostrarNotificacionCierreAutomatico(
            '🗳️ Votación cerrada automáticamente',
            `El tiempo de votación expiró. Comenzando lectura de "${libroGanador}"`
        );
    }
    
    else if (estadoAnteriorTipo === 'LEYENDO' && estadoActualTipo === 'INACTIVO') {
        mostrarNotificacionCierreAutomatico(
            '📚 Lectura concluida automáticamente', 
            `El período de lectura ha finalizado. El club está listo para una nueva votación.`
        );
    }
    
    else if (estadoAnteriorTipo === 'VOTACION' && estadoActualTipo === 'INACTIVO') {
        mostrarNotificacionCierreAutomatico(
            '⚠️ Votación cerrada sin votos',
            'El tiempo de votación expiró sin recibir votos. Inicia una nueva votación.'
        );
    }
}

function mostrarNotificacionCierreAutomatico(titulo, mensaje) {
    if (window.showNotification) {
        window.showNotification("info", `${titulo}\n${mensaje}`);
    } else if (typeof showNotification !== 'undefined') {
        showNotification("info", `${titulo}\n${mensaje}`);
    } else {
        alert(`${titulo}\n\n${mensaje}`);
    }
    
    if (window.cargarProgresoLectura) {
        setTimeout(() => {
            window.cargarProgresoLectura();
        }, 1000);
    }
}

window.votar = votar;
window.cerrarVotacion = cerrarVotacion;
window.concluirLectura = concluirLectura;

export { initClubVotingComponent };