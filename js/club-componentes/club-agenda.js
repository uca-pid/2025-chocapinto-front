import { API_URL } from "../env.js";
import { showNotification } from "../../componentes/notificacion.js";
import { showLoader, hideLoader } from "../../componentes/loader.js";
import { mostrarConfirmacion } from "../../componentes/confirmacion.js";



let sesionesData = [];
let clubIdActual = null;
let userRole = null;
let actualizacionInterval = null;
let calendar = null;

/**
 * Inicializa el módulo de agenda
 */
export function initAgenda(clubId, role) {
  clubIdActual = clubId;
  userRole = role;
  
  // Mostrar botón de crear sesión solo para moderadores/owner
  const btnCrearSesion = document.getElementById("btnCrearSesion");
  if (btnCrearSesion && (role === "OWNER" || role === "MODERADOR")) {
    btnCrearSesion.style.display = "block";
  }
  
  // Iniciar verificación periódica de sesiones (cada minuto)
  iniciarActualizacionAutomatica();
}

/**
 * Inicia la actualización automática de sesiones
 */
function iniciarActualizacionAutomatica() {
  // Limpiar intervalo anterior si existe
  if (actualizacionInterval) {
    clearInterval(actualizacionInterval);
  }
  
  // Verificar cada minuto si hay sesiones que cambiar de estado
  actualizacionInterval = setInterval(() => {
    // Solo actualizar si el modal de agenda está abierto
    const modal = document.getElementById("modalAgenda");
    if (modal && modal.style.display === "flex") {
      verificarYActualizarSesiones();
    }
  }, 60000); // 60 segundos
}

/**
 * Verifica si alguna sesión debe cambiar de estado
 */
function verificarYActualizarSesiones() {
  if (sesionesData.length === 0) return;
  
  const ahora = new Date();
  let hayActualizacion = false;
  
  sesionesData.forEach(sesion => {
    const fechaSesionString = sesion.fechaHora.replace('Z', '');
    const fechaSesion = new Date(fechaSesionString);
    
    // Si la sesión ya pasó y está como PROGRAMADA, necesita actualización
    if (fechaSesion <= ahora && sesion.estado === "PROGRAMADA") {
      hayActualizacion = true;
    }
  });
  
  // Si hay sesiones que necesitan actualización, recargar
  if (hayActualizacion) {
    // Detectar qué vista está activa
    const btnPasadas = document.getElementById("btnSesionesPasadas");
    const tipoActual = btnPasadas && btnPasadas.classList.contains("active") ? "pasadas" : "proximas";
    cargarSesiones(tipoActual);
  }
}

/**
 * Muestra el modal de agenda
 */
export function mostrarAgenda() {
  const modal = document.getElementById("modalAgenda");
  if (modal) {
    modal.style.display = "flex";
    
    // En móviles mostrar lista, en desktop calendario
    const esMobile = window.innerWidth <= 768;
    cambiarVistaAgenda(esMobile ? 'lista' : 'calendario');
  }
}

/**
 * Cierra el modal de agenda
 */
export function cerrarModalAgenda() {
  const modal = document.getElementById("modalAgenda");
  if (modal) {
    modal.style.display = "none";
  }
  
  // Detener actualización automática al cerrar
  if (actualizacionInterval) {
    clearInterval(actualizacionInterval);
    actualizacionInterval = null;
  }
  
  // Destruir calendario al cerrar
  if (calendar) {
    calendar.destroy();
    calendar = null;
  }
}

/**
 * Carga todas las sesiones del club
 */
async function cargarSesiones(tipo = "proximas") {
  try {
    showLoader("Cargando sesiones...");
    
    
    const response = await fetch(`${API_URL}/api/sesiones/club/${clubIdActual}?tipo=${tipo}`

    );

    const data = await response.json();
    
    if (data.success) {
      sesionesData = data.sesiones;
      renderizarSesiones(tipo);
    } else {
      showNotification("error", data.message || "Error al cargar sesiones");
    }
  } catch (error) {
    showNotification("error", "Error al cargar las sesiones");
  } finally {
    hideLoader();
  }
}

/**
 * Renderiza las sesiones en el DOM
 */
function renderizarSesiones(tipo) {
  const container = document.getElementById("sesionesContainer");
  
  if (!container) return;

  if (sesionesData.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <p>No hay sesiones ${tipo === "proximas" ? "próximas" : "pasadas"}</p>
        ${userRole === "OWNER" || userRole === "MODERADOR" ? 
          `<button class="btn-primary" onclick="window.mostrarModalCrearSesion()">Crear primera sesión</button>` : 
          ""}
      </div>
    `;
    return;
  }

  const html = sesionesData.map(sesion => crearTarjetaSesion(sesion, tipo)).join("");
  container.innerHTML = html;
}

/**
 * Crea el HTML de una tarjeta de sesión
 */
function crearTarjetaSesion(sesion, tipo) {
  // Parsear fecha sin conversión UTC - remover la Z y tratarla como local
  const fechaString = sesion.fechaHora.replace('Z', '');
  const fecha = new Date(fechaString);
  
  const fechaFormateada = fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const horaFormateada = fecha.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const username = localStorage.getItem("username");
  const confirmacionUsuario = sesion.confirmaciones.find(c => c.user.username === username);
  const estadoUsuario = confirmacionUsuario ? confirmacionUsuario.estado : null;

  const isPasada = tipo === "pasadas" || sesion.estado === "COMPLETADA";

  return `
    <div class="sesion-card ${isPasada ? "sesion-pasada" : ""}" data-sesion-id="${sesion.id}">
      <div class="sesion-card-header" onclick="toggleSesionCard(${sesion.id})">
        <div class="sesion-card-left">
          <div class="sesion-fecha-badge">
            <div class="fecha-dia">${fecha.getDate()}</div>
            <div class="fecha-mes">${fecha.toLocaleDateString("es-AR", { month: "short" }).toUpperCase()}</div>
          </div>
          <div class="sesion-header-info">
            <h3 class="sesion-titulo">${sesion.titulo}</h3>
            <div class="sesion-meta">
              <span class="sesion-hora">🕐 ${horaFormateada}</span>
              <span class="sesion-lugar-mini">📍 ${sesion.lugar}</span>
            </div>
          </div>
        </div>
        <div class="sesion-card-right">
          ${userRole === "OWNER" || userRole === "MODERADOR" ? `
            <div class="sesion-actions" onclick="event.stopPropagation()">
              ${!isPasada ? `
                <button class="btn-icon" onclick="window.editarSesion(${sesion.id})" title="Editar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              ` : ""}
              <button class="btn-icon btn-danger" onclick="window.eliminarSesion(${sesion.id})" title="Eliminar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          ` : ""}
          <div class="toggle-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      <div class="sesion-card-body" style="display: none;">
        ${sesion.clubBook ? `
          <div class="sesion-libro">
            <img src="${sesion.clubBook.book.portada || "../images/BooksyLogo.png"}" alt="${sesion.clubBook.book.title}">
            <div>
              <div class="libro-titulo">${sesion.clubBook.book.title}</div>
              <div class="libro-autor">${sesion.clubBook.book.author || "Autor desconocido"}</div>
            </div>
          </div>
        ` : ""}

        ${sesion.descripcion ? `
          <div class="sesion-descripcion">${sesion.descripcion}</div>
        ` : ""}

        <div class="sesion-detalles-grid">
          <div class="detalle-item">
            <strong>📍 Lugar:</strong>
            <span>${sesion.lugar}</span>
          </div>
          <div class="detalle-item">
            <strong>📅 Fecha completa:</strong>
            <span>${fechaFormateada}</span>
          </div>
        </div>

        ${!isPasada ? `
          <div class="sesion-confirmaciones">
            <div class="confirmaciones-resumen">
              <span class="confirmacion-badge confirmacion-asistire">
                ✓ ${sesion.contadores.asistire} Asistirán
              </span>
              <span class="confirmacion-badge confirmacion-talvez">
                ? ${sesion.contadores.talVez} Tal vez
              </span>
              <span class="confirmacion-badge confirmacion-novoy">
                ✗ ${sesion.contadores.noVoy} No van
              </span>
            </div>

            <div class="confirmacion-usuario">
              <button class="btn-confirmacion ${estadoUsuario === "ASISTIRE" ? "active" : ""}" 
                      onclick="window.confirmarAsistenciaSesion(${sesion.id}, 'ASISTIRE')">
                ✓ Asistiré
              </button>
              <button class="btn-confirmacion ${estadoUsuario === "TAL_VEZ" ? "active" : ""}"
                      onclick="window.confirmarAsistenciaSesion(${sesion.id}, 'TAL_VEZ')">
                ? Tal vez
              </button>
              <button class="btn-confirmacion ${estadoUsuario === "NO_VOY" ? "active" : ""}"
                      onclick="window.confirmarAsistenciaSesion(${sesion.id}, 'NO_VOY')">
                ✗ No voy
              </button>
            </div>
          </div>
        ` : `
          <div class="sesion-asistencia-real">
            <div class="asistencia-titulo">Asistieron (${sesion.contadores.asistenciaReal}):</div>
            <div class="asistentes-lista">
              ${sesion.asistencias.map(a => `
                <div class="asistente-avatar" title="${a.user.username}">
                  ${a.user.avatar ? 
                    `<img src="${a.user.avatar}" alt="${a.user.username}">` :
                    `<div class="avatar-inicial">${a.user.username[0].toUpperCase()}</div>`
                  }
                </div>
              `).join("")}
            </div>
            ${userRole === "OWNER" || userRole === "MODERADOR" ? `
              <button class="btn-secondary" onclick="window.registrarAsistenciaSesion(${sesion.id})">
                Registrar asistencia
              </button>
            ` : ""}
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * Muestra el modal para crear sesión
 */
export function mostrarModalCrearSesion() {
  const modal = document.getElementById("modalCrearSesion");
  if (modal) {
    modal.style.display = "flex";
    cargarLibrosParaSesion();
  }
}

/**
 * Cierra el modal de crear sesión
 */
export function cerrarModalCrearSesion() {
  const modal = document.getElementById("modalCrearSesion");
  if (modal) {
    modal.style.display = "none";
    document.getElementById("formCrearSesion").reset();
  }
}

/**
 * Carga los libros del club para seleccionar en la sesión
 */
async function cargarLibrosParaSesion() {
  try {
    const response = await fetch(`${API_URL}/club/${clubIdActual}`);

    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById("sesionLibroId");
      if (select) {
        select.innerHTML = '<option value="">Sesión general (sin libro específico)</option>';
        
        // Filtrar solo libros en estado "leyendo"
        const librosLeyendo = data.club.readBooks.filter(cb => cb.estado === "leyendo");
        
        librosLeyendo.forEach(cb => {
          const option = document.createElement("option");
          option.value = cb.clubBookId;
          option.textContent = cb.title;
          select.appendChild(option);
        });
      }
    }
  } catch (error) {}
}

/**
 * Carga los libros del club para el modal de editar
 */
async function cargarLibrosParaEditar() {
  try {
    const response = await fetch(`${API_URL}/club/${clubIdActual}`);
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById("editSesionLibroId");
      if (select) {
        select.innerHTML = '<option value="">Sesión general (sin libro específico)</option>';
        
        // Filtrar solo libros en estado "leyendo"
        const librosLeyendo = data.club.readBooks.filter(cb => cb.estado === "leyendo");
        
        librosLeyendo.forEach(cb => {
          const option = document.createElement("option");
          option.value = cb.clubBookId;
          option.textContent = cb.title;
          select.appendChild(option);
        });
      }
    }
  } catch (error) {}
}

/**
 * Crea una nueva sesión
 */
export async function crearSesion(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  
  // Obtener fecha local y construir ISO manualmente sin conversión
  const fechaHoraLocal = formData.get("fechaHora"); // "2024-12-08T15:00"
  // Agregar segundos, milisegundos y Z para que el backend lo tome como UTC
  // pero en realidad es la hora local que queremos guardar
  const fechaISO = fechaHoraLocal + ":00.000Z";
  
  const datos = {
    clubId: clubIdActual,
    clubBookId: formData.get("clubBookId") || null,
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    fechaHora: fechaISO,
    lugar: formData.get("lugar"),
    username: localStorage.getItem("username")
  };

  try {
    showLoader("Creando sesión...");
    
    const response = await fetch(`${API_URL}/api/sesiones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)
    });

    const data = await response.json();
    
    if (data.success) {
      showNotification("success", "Sesión creada exitosamente");
      cerrarModalCrearSesion();
      cargarSesiones();
    } else {
      showNotification("error", data.message || "Error al crear sesión");
    }
  } catch (error) {
    showNotification("error", "Error al crear la sesión");
  } finally {
    hideLoader();
  }
}

/**
 * Confirma asistencia a una sesión
 */
export async function confirmarAsistenciaSesion(sesionId, estado) {
  try {
    const response = await fetch(`${API_URL}/api/sesiones/${sesionId}/confirmar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        estado,
        username: localStorage.getItem("username")
      })
    });

    const data = await response.json();
    
    if (data.success) {
      showNotification("success", "Confirmación registrada");
      cargarSesiones();
      
      // Recargar eventos del calendario si está activo
      if (calendar) {
        calendar.refetchEvents();
      }
    } else {
      showNotification("error", data.message || "Error al confirmar asistencia");
    }
  } catch (error) {
    showNotification("error", "Error al confirmar asistencia");
  }
}

/**
 * Confirma asistencia desde el modal del calendario
 */
window.confirmarAsistenciaDesdeCalendario = async function(sesionId, estado) {
  await confirmarAsistenciaSesion(sesionId, estado);
};

/**
 * Renderiza el calendario con FullCalendar
 */
async function renderizarCalendario() {
  const container = document.getElementById("calendarioContainer");
  if (!container) return;

  try {
    showLoader("Cargando calendario...");
    
    // Destruir calendario anterior si existe
    if (calendar) {
      calendar.destroy();
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear instancia de FullCalendar
    calendar = new FullCalendar.Calendar(container, {
      initialView: 'dayGridMonth',
      locale: 'es',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,dayGridWeek'
      },
      buttonText: {
        today: 'Hoy',
        month: 'Mes',
        week: 'Semana'
      },
      height: 'auto',
      aspectRatio: 1.5,
      firstDay: 1,
      dayMaxEvents: 3,
      eventMaxStack: 2,
      fixedWeekCount: false,
      
      events: async function(info, successCallback, failureCallback) {
        try {
          const eventos = await cargarEventosParaCalendario(info.start, info.end);
          successCallback(eventos);
        } catch (error) {
          failureCallback(error);
        }
      },
      
      eventClick: function(info) {
        // Solo mostrar detalles para sesiones, no para períodos de fondo
        if (info.event.extendedProps.tipo === 'sesion') {
          mostrarDetallesEvento(info.event);
        }
      },
      
      dateClick: function(info) {
        if (userRole === "OWNER" || userRole === "MODERADOR") {
          const fechaLocal = info.dateStr + 'T12:00';
          document.getElementById("sesionFechaHora").value = fechaLocal;
          mostrarModalCrearSesion();
        }
      },
      
      eventDidMount: function(info) {
        if (info.event.extendedProps.descripcion) {
          info.el.title = info.event.extendedProps.descripcion;
        }
        // Hacer períodos de fondo no clickeables
        if (info.event.extendedProps.tipo === 'periodo') {
          info.el.style.pointerEvents = 'none';
        }
        // Agregar cursor pointer solo a sesiones
        if (info.event.extendedProps.tipo === 'sesion') {
          info.el.style.cursor = 'pointer';
        }
      }
    });
    
    calendar.render();
    
    // Forzar actualización de tamaño después de renderizar
    setTimeout(() => {
      if (calendar) {
        calendar.updateSize();
      }
    }, 100);
    
  } catch (error) {
    showNotification("error", "Error al cargar el calendario");
  } finally {
    hideLoader();
  }
}

/**
 * Genera un color llamativo basado en un ID
 */
function generarColorPorLibro(libroId) {
  const colores = [
    { normal: '#e74c3c', completada: '#e8a398' }, // Rojo
    { normal: '#9b59b6', completada: '#c9a9d3' }, // Púrpura
    { normal: '#3498db', completada: '#9cc4e4' }, // Azul
    { normal: '#1abc9c', completada: '#8dd8ca' }, // Turquesa
    { normal: '#f39c12', completada: '#f8c471' }, // Naranja
    { normal: '#e67e22', completada: '#f0b27a' }, // Naranja oscuro
    { normal: '#2ecc71', completada: '#82e0aa' }, // Verde
    { normal: '#c0392b', completada: '#d98880' }, // Rojo oscuro
    { normal: '#8e44ad', completada: '#bb8fce' }, // Púrpura oscuro
    { normal: '#16a085', completada: '#7fb3d5' }, // Verde azulado
    { normal: '#d35400', completada: '#e59866' }, // Calabaza
    { normal: '#27ae60', completada: '#7dcea0' }, // Verde esmeralda
  ];
  
  if (!libroId) {
    return { normal: '#95a5a6', completada: '#bdc3c7' }; // Gris para sesiones sin libro
  }
  
  return colores[libroId % colores.length];
}

/**
 * Carga eventos (sesiones y períodos) para el calendario
 */
async function cargarEventosParaCalendario(start, end) {
  try {
    const [sesionesRes, estadoRes, historialRes] = await Promise.all([
      fetch(`${API_URL}/api/sesiones/club/${clubIdActual}?tipo=todas`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }),
      fetch(`${API_URL}/api/club/${clubIdActual}/estado-actual`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }),
      fetch(`${API_URL}/api/club/${clubIdActual}/periodos/historial`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
    ]);
    
    const sesionesData = await sesionesRes.json();
    const estadoData = await estadoRes.json();
    const historialData = await historialRes.json();
    
    const eventos = [];
    
    // Agregar sesiones como eventos puntuales
    if (sesionesData.success && sesionesData.sesiones) {
      sesionesData.sesiones.forEach(sesion => {
        const libroId = sesion.clubBook?.book?.id || sesion.clubBook?.bookId || sesion.bookId;
        const colores = generarColorPorLibro(libroId);
        const color = sesion.estado === 'COMPLETADA' ? colores.completada : colores.normal;
        
        eventos.push({
          id: `sesion-${sesion.id}`,
          title: sesion.titulo,
          start: sesion.fechaHora,
          backgroundColor: color,
          borderColor: color,
          textColor: '#ffffff',
          extendedProps: {
            tipo: 'sesion',
            data: sesion,
            descripcion: `${sesion.titulo} - ${sesion.lugar}`
          }
        });
      });
    }
    
    // Agregar período activo si existe
    if (estadoData.success && estadoData.periodo) {
      const periodo = estadoData.periodo;
      const esVotacion = estadoData.estado === 'VOTACION';
      eventos.push({
        id: `periodo-${periodo.id}`,
        title: esVotacion ? '📊 Votación' : '📖 Lectura',
        start: periodo.fechaInicio,
        end: periodo.fechaCierre,
        backgroundColor: esVotacion ? '#f39c12' : '#27ae60',
        borderColor: esVotacion ? '#e67e22' : '#229954',
        display: 'background',
        extendedProps: {
          tipo: 'periodo',
          data: periodo,
          descripcion: `Período de ${esVotacion ? 'votación' : 'lectura'}: ${periodo.nombre || ''}`
        }
      });
    }
    
    // Agregar períodos del historial como eventos de fondo
    if (historialData.success && historialData.historial) {
      historialData.historial.forEach(periodo => {
        eventos.push({
          id: `periodo-${periodo.id}`,
          title: '📚 Concluido',
          start: periodo.fechaInicio,
          end: periodo.fechaCierre,
          backgroundColor: '#95a5a6',
          borderColor: '#7f8c8d',
          display: 'background',
          extendedProps: {
            tipo: 'periodo',
            data: periodo,
            descripcion: `Período concluido: ${periodo.nombre || ''}`
          }
        });
      });
    }
    
    return eventos;
  } catch (error) {
    return [];
  }
}

/**
 * Muestra los detalles de un evento clickeado
 */
function mostrarDetallesEvento(event) {
  const props = event.extendedProps;
  
  if (props.tipo === 'sesion') {
    const sesion = props.data;
    const fechaHora = new Date(sesion.fechaHora.replace('Z', '')).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Determinar confirmación del usuario actual
    const userId = parseInt(localStorage.getItem('userId'));
    const confirmacion = sesion.confirmaciones?.find(c => c.userId === userId);
    const yaConfirmo = confirmacion?.estado === 'ASISTIRE';
    const yaTalVez = confirmacion?.estado === 'TAL_VEZ';
    const yaRechazó = confirmacion?.estado === 'NO_VOY';
    
    const detallesHTML = `
      <div class="evento-detalle-modal" onclick="if(event.target === this) this.remove()">
        <div class="evento-detalle-content">
          <div class="evento-detalle-header">
            <h3>${sesion.titulo}</h3>
            <button onclick="this.closest('.evento-detalle-modal').remove()" class="evento-detalle-close">×</button>
          </div>
          <div class="evento-detalle-info">
            <div class="evento-info-item">
              <strong>📍 Lugar:</strong>
              <span>${sesion.lugar}</span>
            </div>
            <div class="evento-info-item">
              <strong>🕐 Fecha:</strong>
              <span>${fechaHora}</span>
            </div>
            ${sesion.descripcion ? `
              <div class="evento-info-item">
                <strong>📝 Descripción:</strong>
                <span>${sesion.descripcion}</span>
              </div>
            ` : ''}
            ${sesion.clubBook ? `
              <div class="evento-info-item">
                <strong>📚 Libro:</strong>
                <span>${sesion.clubBook.book.title}</span>
              </div>
            ` : ''}
            <div class="evento-info-item">
              <strong>📊 Estado:</strong>
              <span>${sesion.estado === 'COMPLETADA' ? '✅ Completada' : '⏳ PROGRAMADA'}</span>
            </div>
          </div>
          
          ${sesion.estado !== 'COMPLETADA' ? `
            <div class="confirmacion-buttons" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
              <p style="margin-bottom: 0.75rem; font-weight: 600; color: #2c5a91;">¿Vas a asistir?</p>
              <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                <button 
                  onclick="window.confirmarAsistenciaDesdeCalendario(${sesion.id}, 'ASISTIRE'); this.closest('.evento-detalle-modal').remove();" 
                  class="${yaConfirmo ? 'btn-confirmado' : 'btn-confirmar'}"
                  ${yaConfirmo ? 'disabled' : ''}>
                  ${yaConfirmo ? '✓ Confirmado' : '✓ Asistiré'}
                </button>
                <button 
                  onclick="window.confirmarAsistenciaDesdeCalendario(${sesion.id}, 'TAL_VEZ'); this.closest('.evento-detalle-modal').remove();" 
                  class="${yaTalVez ? 'btn-talvez-activo' : 'btn-talvez'}"
                  ${yaTalVez ? 'disabled' : ''}>
                  ${yaTalVez ? '? Tal vez' : '? Tal vez'}
                </button>
                <button 
                  onclick="window.confirmarAsistenciaDesdeCalendario(${sesion.id}, 'NO_VOY'); this.closest('.evento-detalle-modal').remove();" 
                  class="${yaRechazó ? 'btn-rechazado' : 'btn-rechazar'}"
                  ${yaRechazó ? 'disabled' : ''}>
                  ${yaRechazó ? '✗ No asistiré' : '✗ No asistiré'}
                </button>
              </div>
            </div>
          ` : ''}
          
          <div class="evento-detalle-actions">
            <button onclick="window.cambiarVistaAgenda('lista'); this.closest('.evento-detalle-modal').remove();" class="btn-secondary">
              📋 Ver en lista
            </button>
            ${(userRole === 'OWNER' || userRole === 'MODERADOR') && sesion.estado !== 'COMPLETADA' ? `
              <button onclick="window.editarSesion(${sesion.id}); this.closest('.evento-detalle-modal').remove();" class="btn-editar-evento">
                ✏️ Editar
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    const existingModal = document.querySelector('.evento-detalle-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', detallesHTML);
  }
}

/**
 * Cambia entre vista de calendario y lista
 */
export function cambiarVistaAgenda(tipo) {
  const btnCalendario = document.getElementById("btnVistaCalendario");
  const btnLista = document.getElementById("btnVistaLista");
  const calendarioContainer = document.getElementById("calendarioContainer");
  const listaContainer = document.getElementById("listaContainer");
  
  if (tipo === "calendario") {
    btnCalendario?.classList.add("active");
    btnLista?.classList.remove("active");
    
    if (calendarioContainer) calendarioContainer.style.display = "block";
    if (listaContainer) listaContainer.style.display = "none";
    
    renderizarCalendario();
  } else if (tipo === "lista") {
    btnLista?.classList.add("active");
    btnCalendario?.classList.remove("active");
    
    if (listaContainer) listaContainer.style.display = "block";
    if (calendarioContainer) calendarioContainer.style.display = "none";
    
    cargarSesiones("proximas");
  } else {
    // Mantener compatibilidad con llamadas antiguas (proximas/pasadas)
    const btnProximas = document.getElementById("btnSesionesProximas");
    const btnPasadas = document.getElementById("btnSesionesPasadas");
    
    if (tipo === "proximas") {
      btnProximas?.classList.add("active");
      btnPasadas?.classList.remove("active");
    } else {
      btnPasadas?.classList.add("active");
      btnProximas?.classList.remove("active");
    }
    
    cargarSesiones(tipo);
  }
}

/**
 * Elimina una sesión
 */
export async function eliminarSesion(sesionId) {
  mostrarConfirmacion(
    "Eliminar sesión",
    "¿Estás seguro de que deseas eliminar esta sesión?<br><br><strong>Esta acción no se puede deshacer.</strong>",
    async () => {
      try {
        showLoader("Eliminando sesión...");
        
        const response = await fetch(`${API_URL}/api/sesiones/${sesionId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username: localStorage.getItem("username")
          })
        });

        const data = await response.json();
        
        if (data.success) {
          showNotification("success", "Sesión eliminada exitosamente");
          cargarSesiones();
        } else {
          showNotification("error", data.message || "Error al eliminar sesión");
        }
      } catch (error) {
        showNotification("error", "Error al eliminar la sesión");
      } finally {
        hideLoader();
      }
    },
    null,
    {
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      confirmClass: "red-btn"
    }
  );
}

/**
 * Editar una sesión
 */
export async function editarSesion(sesionId) {
  try {
    showLoader("Cargando sesión...");
    
    // Obtener datos de la sesión
    const response = await fetch(`${API_URL}/api/sesiones/${sesionId}`);
    const data = await response.json();
    
    if (data.success) {
      const sesion = data.sesion;
      
      // Cargar libros en el select
      await cargarLibrosParaEditar();
      
      // Llenar el formulario con los datos actuales
      document.getElementById("editSesionId").value = sesion.id;
      document.getElementById("editSesionTitulo").value = sesion.titulo;
      document.getElementById("editSesionLibroId").value = sesion.clubBookId || "";
      
      // Convertir fecha ISO a formato datetime-local (YYYY-MM-DDTHH:MM)
      // La fecha viene en formato ISO: "2024-12-08T15:00:00.000Z"
      // Solo tomamos los primeros 16 caracteres para datetime-local
      const fechaISO = sesion.fechaHora;
      document.getElementById("editSesionFechaHora").value = fechaISO.slice(0, 16);
      
      document.getElementById("editSesionLugar").value = sesion.lugar;
      document.getElementById("editSesionDescripcion").value = sesion.descripcion || "";
      
      // Mostrar modal
      const modal = document.getElementById("modalEditarSesion");
      if (modal) {
        modal.style.display = "flex";
      }
    } else {
      showNotification("error", data.message || "Error al cargar sesión");
    }
  } catch (error) {
    showNotification("error", "Error al cargar la sesión");
  } finally {
    hideLoader();
  }
}

/**
 * Cierra el modal de editar sesión
 */
export function cerrarModalEditarSesion() {
  const modal = document.getElementById("modalEditarSesion");
  if (modal) {
    modal.style.display = "none";
    document.getElementById("formEditarSesion").reset();
  }
}

/**
 * Guarda los cambios de una sesión editada
 */
export async function editarSesionSubmit(event) {
  event.preventDefault();
  
  const sesionId = document.getElementById("editSesionId").value;
  const formData = new FormData(event.target);
  const fechaHoraLocal = formData.get("fechaHora");
  const fechaISO = fechaHoraLocal + ":00.000Z";
  
  const datos = {
    titulo: formData.get("titulo"),
    clubBookId: formData.get("clubBookId") ? parseInt(formData.get("clubBookId")) : null,
    fechaHora: fechaISO,
    lugar: formData.get("lugar"),
    descripcion: formData.get("descripcion"),
    username: localStorage.getItem("username")
  };

  try {
    showLoader("Guardando cambios...");
    
    const response = await fetch(`${API_URL}/api/sesiones/${sesionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)
    });

    const data = await response.json();
    
    if (data.success) {
      showNotification("success", "Sesión actualizada exitosamente");
      cerrarModalEditarSesion();
      cargarSesiones();
    } else {
      showNotification("error", data.message || "Error al actualizar sesión");
    }
  } catch (error) {
    showNotification("error", "Error al actualizar la sesión");
  } finally {
    hideLoader();
  }
}

/**
 * Registrar asistencia real - Abre modal con lista de confirmados
 */
export async function registrarAsistenciaSesion(sesionId) {
  try {
    showLoader("Cargando datos de la sesión...");
    
    // Obtener datos de la sesión con confirmaciones y asistencias ya registradas
    const response = await fetch(`${API_URL}/api/sesiones/${sesionId}`);
    const data = await response.json();
    
    if (data.success) {
      const sesion = data.sesion;
      
      // Guardar ID de sesión
      document.getElementById("asistenciaSesionId").value = sesionId;
      
      // Obtener usuarios que confirmaron "ASISTIRE" o "TAL_VEZ"
      const confirmados = sesion.confirmaciones.filter(
        c => c.estado === "ASISTIRE" || c.estado === "TAL_VEZ"
      );
      
      // Obtener IDs de usuarios que ya tienen asistencia registrada
      const asistentesRegistrados = sesion.asistencias.map(a => a.userId);
      
      // Renderizar lista de confirmados con checkboxes
      const listaHTML = confirmados.map(conf => {
        const yaRegistrado = asistentesRegistrados.includes(conf.userId);
        return `
          <div class="confirmado-item" style="display: flex; align-items: center; padding: 12px; border: 1px solid #eaf6ff; border-radius: 8px; margin-bottom: 8px;">
            <input 
              type="checkbox" 
              name="asistentes" 
              value="${conf.userId}" 
              id="asistente_${conf.userId}"
              ${yaRegistrado ? 'checked' : ''}
              style="margin-right: 12px; width: 18px; height: 18px; cursor: pointer;"
            >
            <label for="asistente_${conf.userId}" style="display: flex; align-items: center; flex: 1; cursor: pointer; margin: 0;">
              ${conf.user.avatar ? 
                `<img src="${conf.user.avatar}" alt="${conf.user.username}" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 12px; object-fit: cover;">` :
                `<div style="width: 32px; height: 32px; border-radius: 50%; background: #2c5a91; color: white; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold;">${conf.user.username[0].toUpperCase()}</div>`
              }
              <div>
                <div style="font-weight: 500;">${conf.user.username}</div>
                <div style="font-size: 12px; color: #636e72;">Confirmó: ${conf.estado === "ASISTIRE" ? "Asistiré" : "Tal vez"}</div>
              </div>
            </label>
          </div>
        `;
      }).join("");
      
      const container = document.getElementById("listaConfirmados");
      if (confirmados.length === 0) {
        container.innerHTML = '<p style="color: #636e72; text-align: center; padding: 20px;">No hay personas que hayan confirmado asistencia</p>';
      } else {
        container.innerHTML = listaHTML;
      }
      
      // Mostrar modal
      const modal = document.getElementById("modalRegistrarAsistencia");
      if (modal) {
        modal.style.display = "flex";
      }
    } else {
      showNotification("error", data.message || "Error al cargar datos de la sesión");
    }
  } catch (error) {
    showNotification("error", "Error al cargar los datos");
  } finally {
    hideLoader();
  }
}

/**
 * Cierra el modal de registrar asistencia
 */
export function cerrarModalRegistrarAsistencia() {
  const modal = document.getElementById("modalRegistrarAsistencia");
  if (modal) {
    modal.style.display = "none";
  }
}

/**
 * Guarda las asistencias reales marcadas
 */
export async function registrarAsistenciaSubmit(event) {
  event.preventDefault();
  
  const sesionId = document.getElementById("asistenciaSesionId").value;
  const checkboxes = document.querySelectorAll('input[name="asistentes"]:checked');
  const usuariosPresentes = Array.from(checkboxes).map(cb => parseInt(cb.value));
  
  try {
    showLoader("Guardando asistencias...");
    
    const response = await fetch(`${API_URL}/api/sesiones/${sesionId}/asistencia`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usuariosPresentes,
        username: localStorage.getItem("username")
      })
    });

    const data = await response.json();
    
    if (data.success) {
      showNotification("success", "Asistencias registradas exitosamente");
      cerrarModalRegistrarAsistencia();
      cargarSesiones("pasadas"); // Recargar historial
      
      // Actualizar XP en el header
      if (typeof window.updateUserXpHeader === 'function') {
        window.updateUserXpHeader();
      }
    } else {
      showNotification("error", data.message || "Error al registrar asistencias");
    }
  } catch (error) {
    showNotification("error", "Error al registrar las asistencias");
  } finally {
    hideLoader();
  }
}

// Exportar funciones globales
if (typeof window !== "undefined") {
  window.mostrarAgenda = mostrarAgenda;
  window.cerrarModalAgenda = cerrarModalAgenda;
  window.mostrarModalCrearSesion = mostrarModalCrearSesion;
  window.cerrarModalCrearSesion = cerrarModalCrearSesion;
  window.crearSesion = crearSesion;
  window.confirmarAsistenciaSesion = confirmarAsistenciaSesion;
  window.cambiarVistaAgenda = cambiarVistaAgenda;
  window.eliminarSesion = eliminarSesion;
  window.editarSesion = editarSesion;
  window.cerrarModalEditarSesion = cerrarModalEditarSesion;
  window.editarSesionSubmit = editarSesionSubmit;
  window.registrarAsistenciaSesion = registrarAsistenciaSesion;
  window.cerrarModalRegistrarAsistencia = cerrarModalRegistrarAsistencia;
  window.registrarAsistenciaSubmit = registrarAsistenciaSubmit;
  window.toggleSesionCard = toggleSesionCard;
}

/**
 * Toggle para expandir/colapsar tarjetas de sesión
 */
function toggleSesionCard(sesionId) {
  const card = document.querySelector(`.sesion-card[data-sesion-id="${sesionId}"]`);
  if (!card) return;
  
  const body = card.querySelector('.sesion-card-body');
  const icon = card.querySelector('.toggle-icon svg');
  
  if (body.style.display === 'none' || body.style.display === '') {
    body.style.display = 'block';
    icon.style.transform = 'rotate(180deg)';
    card.classList.add('expanded');
  } else {
    body.style.display = 'none';
    icon.style.transform = 'rotate(0deg)';
    card.classList.remove('expanded');
  }
}
