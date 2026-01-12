import { API_URL } from "../env.js";
import { showNotification } from "../../componentes/notificacion.js";

let notificacionesInterval = null;
let notificacionesNoLeidas = 0;

export function initNotificaciones(userId) {
  if (!userId) {
    return;
  }

  cargarNotificaciones(userId);

  if (notificacionesInterval) {
    clearInterval(notificacionesInterval);
  }
  
  notificacionesInterval = setInterval(() => {
    cargarContadorNoLeidas(userId);
  }, 30000);
}

async function cargarContadorNoLeidas(userId) {
  try {
    const response = await fetch(`${API_URL}/api/notificaciones/${userId}/no-leidas/count`);
    const data = await response.json();
    
    if (data.success) {
      notificacionesNoLeidas = data.count;
      actualizarBadgeNotificaciones(data.count);
    }
  } catch (error) {
  }
}

function actualizarBadgeNotificaciones(count) {
  const notifBtn = document.getElementById("notificacionesBtn");
  if (!notifBtn) return;

  if (typeof notifBtn.setBadge === 'function') {
    notifBtn.setBadge(count);
  }
}

async function cargarNotificaciones(userId) {
  try {
    const response = await fetch(`${API_URL}/api/notificaciones/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      renderizarNotificaciones(data.notificaciones);
      notificacionesNoLeidas = data.notificaciones.filter(n => !n.leida).length;
      actualizarBadgeNotificaciones(notificacionesNoLeidas);
    } else {
      mostrarErrorNotificaciones("No se pudieron cargar las notificaciones");
    }
  } catch (error) {
    mostrarErrorNotificaciones("Error de conexión con el servidor");
  }
}

function mostrarErrorNotificaciones(mensaje) {
  const container = document.getElementById("notificacionesLista");
  if (!container) return;

  container.innerHTML = `
    <div class="notificaciones-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="12" y1="20" x2="12.01" y2="20"></line>
      </svg>
      <p style="color: #e74c3c;">${mensaje}</p>
      <small style="color: #95a5a6;">Intenta recargar la página</small>
    </div>
  `;
}

function renderizarNotificaciones(notificaciones) {
  const container = document.getElementById("notificacionesLista");
  if (!container) return;

  if (notificaciones.length === 0) {
    container.innerHTML = `
      <div class="notificaciones-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <p>No tienes notificaciones</p>
      </div>
    `;
    return;
  }

  const html = notificaciones.map(n => crearTarjetaNotificacion(n)).join("");
  container.innerHTML = html;
}

function crearTarjetaNotificacion(notif) {
  const fecha = new Date(notif.createdAt);
  const tiempoTranscurrido = calcularTiempoTranscurrido(fecha);
  
  let iconoHTML = '';
  let colorClase = '';
  
  switch(notif.tipo) {
    case 'SESION_CREADA':
      iconoHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>`;
      colorClase = 'notif-sesion';
      break;
    case 'SESION_PROXIMA':
      iconoHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>`;
      colorClase = 'notif-urgente';
      break;
    case 'VOTACION_ABIERTA':
    case 'VOTACION_INICIADA':
      iconoHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 11H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"/>
        <polyline points="9,11 12,8 15,11"/>
      </svg>`;
      colorClase = 'notif-votacion';
      break;
    case 'VOTACION_POR_VENCER':
      iconoHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
        <path d="M12 2 L12 4"/>
        <path d="M12 20 L12 22"/>
        <path d="M4.93 4.93 L6.34 6.34"/>
        <path d="M17.66 17.66 L19.07 19.07"/>
      </svg>`;
      colorClase = 'notif-urgente';
      break;
    case 'VOTACION_CERRADA':
      iconoHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>`;
      colorClase = 'notif-success';
      break;
    case 'SOLICITUD_ACEPTADA':
      iconoHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>`;
      colorClase = 'notif-success';
      break;
    case 'SOLICITUD_RECHAZADA':
      iconoHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>`;
      colorClase = 'notif-error';
      break;
    case 'LIBRO_AGREGADO':
      iconoHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>`;
      colorClase = 'notif-libro';
      break;
    case 'LECTURA_FINALIZADA':
      iconoHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        <polyline points="9 10 12 13 16 9"/>
      </svg>`;
      colorClase = 'notif-success';
      break;
    case 'NIVEL_SUBIDO':
      iconoHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>`;
      colorClase = 'notif-logro';
      break;
    default:
      iconoHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>`;
      colorClase = 'notif-general';
  }

  const datos = notif.datos || {};
  const clickHandler = datos.sesionId ? `onclick="window.abrirSesionDesdeNotificacion(${datos.sesionId})"` : '';

  return `
    <div class="notificacion-item ${!notif.leida ? 'notif-no-leida' : ''} ${colorClase}" 
         data-notif-id="${notif.id}" ${clickHandler}>
      <div class="notif-icono">${iconoHTML}</div>
      <div class="notif-contenido">
        <div class="notif-header">
          <h4 class="notif-titulo">${notif.titulo}</h4>
          ${!notif.leida ? '<span class="notif-badge-nueva">Nueva</span>' : ''}
        </div>
        <p class="notif-mensaje">${notif.mensaje}</p>
        <div class="notif-footer">
          <span class="notif-tiempo">${tiempoTranscurrido}</span>
          ${!notif.leida ? `
            <button class="btn-marcar-leida" onclick="event.stopPropagation(); window.marcarNotificacionLeida(${notif.id})">
              Marcar como leída
            </button>
          ` : ''}
        </div>
      </div>
      ${!notif.leida ? '<div class="notif-punto-azul"></div>' : ''}
    </div>
  `;
}

function calcularTiempoTranscurrido(fecha) {
  const ahora = new Date();
  const diferencia = ahora - fecha;
  const minutos = Math.floor(diferencia / 60000);
  const horas = Math.floor(diferencia / 3600000);
  const dias = Math.floor(diferencia / 86400000);

  if (minutos < 1) return "Hace un momento";
  if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
  if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
  return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
}

export function mostrarModalNotificaciones() {
  const modal = document.getElementById("modalNotificaciones");
  if (modal) {
    modal.style.display = "flex";
    
    const userId = localStorage.getItem("userId");
    if (userId) {
      cargarNotificaciones(userId);
    }
  }
}

export function cerrarModalNotificaciones() {
  const modal = document.getElementById("modalNotificaciones");
  if (modal) {
    modal.style.display = "none";
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const modal = document.getElementById('modalNotificaciones');
    if (modal && e.target === modal) {
      cerrarModalNotificaciones();
    }
  });
}

export async function marcarNotificacionLeida(notifId) {
  try {
    const response = await fetch(`${API_URL}/api/notificaciones/${notifId}/leer`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" }
    });

    const data = await response.json();
    
    if (data.success) {
      const userId = localStorage.getItem("userId");
      if (userId) {
        cargarNotificaciones(userId);
      }
    }
  } catch (error) {
  }
}

export async function marcarTodasLeidas() {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const response = await fetch(`${API_URL}/api/notificaciones/${userId}/leer-todas`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" }
    });

    const data = await response.json();
    
    if (data.success) {
      showNotification("success", "Todas las notificaciones marcadas como leídas");
      cargarNotificaciones(userId);
    }
  } catch (error) {
  }
}

export function abrirSesionDesdeNotificacion(sesionId) {
  const notifElement = document.querySelector(`[data-notif-id]`);
  if (notifElement) {
    const notifId = notifElement.getAttribute('data-notif-id');
    marcarNotificacionLeida(notifId);
  }

  cerrarModalNotificaciones();

  if (typeof window.mostrarAgenda === 'function') {
    window.mostrarAgenda();
  }
}

export function detenerActualizacionesNotificaciones() {
  if (notificacionesInterval) {
    clearInterval(notificacionesInterval);
    notificacionesInterval = null;
  }
}

if (typeof window !== "undefined") {
  window.mostrarModalNotificaciones = mostrarModalNotificaciones;
  window.cerrarModalNotificaciones = cerrarModalNotificaciones;
  window.marcarNotificacionLeida = marcarNotificacionLeida;
  window.marcarTodasLeidas = marcarTodasLeidas;
  window.abrirSesionDesdeNotificacion = abrirSesionDesdeNotificacion;
}