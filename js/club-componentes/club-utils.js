import { API_URL } from "./env.js";
import { showNotification } from "../componentes/notificacion.js";
import { showLoader, hideLoader } from "../componentes/loader.js";
import { mostrarConfirmacion, confirmarEliminacion } from "../componentes/confirmacion.js";

function getClubId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('clubId');
}

function getEstadoInfo(estado) {
    switch(estado) {
        case 'leido':
            return {
                background: '#d1f2eb',
                color: '#00b894',
                border: '#00b894',
                icon: '✅',
                label: 'Leído'
            };
        case 'leyendo':
            return {
                background: '#d6eaf8',
                color: '#3498db',
                border: '#3498db',
                icon: '📖',
                label: 'Leyendo'
            };
        case 'por_leer':
        default:
            return {
                background: '#fef9e7',
                color: '#f39c12',
                border: '#f39c12',
                icon: '📚',
                label: 'Por leer'
            };
    }
}

function getEstadoLabel(estado) {
    switch(estado) {
        case 'leido': return '✅ Leído';
        case 'leyendo': return '📖 Leyendo';
        case 'por_leer': return '📚 Por leer';
        default: return estado;
    }
}

function formatTimeAgoReal(dateString) {
    if (!dateString) return 'Fecha desconocida';
    
    const now = new Date();
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    }
    if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `Hace ${days} día${days !== 1 ? 's' : ''}`;
    }
    if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `Hace ${weeks} semana${weeks !== 1 ? 's' : ''}`;
    }
    
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

function calcularDiasLectura(fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    return Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
}

function getAccionTexto(estado) {
    const acciones = {
        'por_leer': 'agregó a por leer',
        'leyendo': 'se está leyendo',
        'leido': 'se terminó de leer'
    };
    return acciones[estado] || 'cambió el estado de';
}

function formatearMes(mesISO) {
    const [año, mes] = mesISO.split('-');
    const fecha = new Date(año, mes - 1);
    return fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}