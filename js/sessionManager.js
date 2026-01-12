// sessionManager.js - Sistema de cierre de sesión automático por inactividad

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos en milisegundos
const WARNING_BEFORE_LOGOUT = 2 * 60 * 1000; // Advertencia 2 minutos antes

let inactivityTimer = null;
let warningTimer = null;
let warningShown = false;

/**
 * Cierra la sesión del usuario
 */
function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    window.location.href = "index.html";
}

/**
 * Muestra advertencia de cierre de sesión inminente
 */
function showWarning() {
    if (warningShown) return;
    warningShown = true;
    
    // Si tienes el sistema de notificaciones
    if (typeof showNotification === 'function') {
        showNotification("warning", "Tu sesión expirará en 2 minutos por inactividad");
    } else {
        alert("Tu sesión expirará en 2 minutos por inactividad. Mueve el mouse o presiona una tecla para continuar.");
    }
}

/**
 * Reinicia los temporizadores de inactividad
 */
function resetInactivityTimer() {
    warningShown = false;
    
    // Limpiar temporizadores existentes
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    if (warningTimer) {
        clearTimeout(warningTimer);
    }
    
    // Configurar advertencia
    warningTimer = setTimeout(() => {
        showWarning();
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);
    
    // Configurar logout automático
    inactivityTimer = setTimeout(() => {
        logout();
    }, INACTIVITY_TIMEOUT);
}

/**
 * Inicializa el sistema de auto-logout
 */
export function initSessionManager() {
    // Solo inicializar si hay un usuario logueado
    const userId = localStorage.getItem("userId");
    if (!userId) {
        return;
    }
    
    // Eventos que resetean el temporizador
    const events = [
        'mousedown',
        'mousemove',
        'keypress',
        'scroll',
        'touchstart',
        'click'
    ];
    
    // Agregar listeners a todos los eventos
    events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });
    
    // Iniciar el temporizador
    resetInactivityTimer();
    
    console.log('Sistema de auto-logout inicializado (5 minutos de inactividad)');
}

/**
 * Detiene el sistema de auto-logout (útil al hacer logout manual)
 */
export function stopSessionManager() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    if (warningTimer) {
        clearTimeout(warningTimer);
    }
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
    });
}