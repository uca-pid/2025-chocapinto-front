
// ========== CONFIGURACIÓN ==========

const API_URL = window.API_URL || "http://localhost:5000";

function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    window.location.href = "index.html";
}

function updateUsernameDisplay() {
    const username = localStorage.getItem("username");
    const usernameDisplay = document.getElementById("usernameDisplay");
    const usernameDisplayHover = document.getElementById("usernameDisplayHover");
    const userInitials = document.getElementById("userInitials");
    
    if (username) {
        // Actualizar displays antiguos si existen
        if (usernameDisplay) {
            usernameDisplay.textContent = username;
        }
        if (usernameDisplayHover) {
            usernameDisplayHover.textContent = username;
        }
        
        // Actualizar nuevo header
        if (userInitials) {
            // Sacar las iniciales del username (primera letra)
            userInitials.textContent = username.charAt(0).toUpperCase();
        }
    }
}

/**
 * Actualiza el rol del usuario en el header basándose en ClubMember
 */
function actualizarRolEnHeader(club) {
    const userRoleStatus = document.getElementById("userRoleStatus");
    
    if (!userRoleStatus) return;
    
    if (!club) {
        userRoleStatus.textContent = "Cargando...";
        return;
    }
    
    const userId = localStorage.getItem("userId");
    
    try {
        const userRole = getUserRoleInClub(club, userId);
        
        // Configurar texto y estilo según el rol
        const roleConfig = getRoleConfig(userRole.role);
        
        userRoleStatus.textContent = roleConfig.displayText;
        userRoleStatus.className = "user-status";
        userRoleStatus.title = roleConfig.tooltip;
        
        userRoleStatus.classList.add(`role-${userRole.role.toLowerCase()}`);
        
    } catch (error) {
        userRoleStatus.textContent = "Error";
        userRoleStatus.className = "user-status error";
    }
}

/**
 * Obtiene la configuración de display para cada rol
 */
function getRoleConfig(role) {
    const configs = {
        'OWNER': {
            displayText: 'Owner',
            className: '',
            tooltip: 'Propietario del club - Todos los permisos'
        },
        'MODERADOR': {
            displayText: 'Moderador',
            className: '', 
            tooltip: 'Moderador del club - Puede gestionar contenido'
        },
        'LECTOR': {
            displayText: 'Lector',
            className: '',
            tooltip: 'Miembro lector del club'
        },
        'ERROR': {
            displayText: 'Error',
            className: '',
            tooltip: 'Error al cargar información del rol'
        }
    };
    
    return configs[role] || configs['ERROR'];
}

function initHeader() {
    updateUsernameDisplay();
    
    window.logout = logout;
    window.updateUsernameDisplay = updateUsernameDisplay;
    window.actualizarRolEnHeader = actualizarRolEnHeader;
}

// Exportar función de inicialización
window.initHeader = initHeader;

// Export for ES6 modules
export { initHeader };