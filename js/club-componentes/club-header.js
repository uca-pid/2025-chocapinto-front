
// ========== CONFIGURACIÓN ==========

// Fallback para API_URL si no está disponible globalmente
const API_URL = window.API_URL || "http://localhost:5000";

// ========== UTILIDADES ==========

/**
 * Obtiene el ID del club actual desde la URL
 */


// ========== FUNCIONES HEADER ==========

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
    
    if (!userRoleStatus) {
        console.warn('Elemento userRoleStatus no encontrado');
        return;
    }
    
    if (!club) {
        console.warn('No hay datos de club para actualizar el rol');
        userRoleStatus.textContent = "Cargando...";
        return;
    }
    
    const userId = localStorage.getItem("userId");
    console.log('🔄 Actualizando rol en header basándose en ClubMember...');
    
    try {
        // Usar el sistema de permisos basado en ClubMember
        const userRole = getUserRoleInClub(club, userId);
        
        // Configurar texto y estilo según el rol
        const roleConfig = getRoleConfig(userRole.role);
        
        userRoleStatus.textContent = roleConfig.displayText;
        userRoleStatus.className = "user-status";
        userRoleStatus.title = roleConfig.tooltip;
        
        // Agregar clase CSS específica para el rol
        userRoleStatus.classList.add(`role-${userRole.role.toLowerCase()}`);
        
        console.log(`👤 ✅ Rol actualizado en header (ClubMember): ${userRole.role} -> "${roleConfig.displayText}"`);
        
    } catch (error) {
        console.error('❌ Error al actualizar rol en header:', error);
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

// ========== INICIALIZACIÓN ==========
function initHeader() {
    console.log('🏠 Inicializando header...');
    
    // Actualizar username al cargar
    updateUsernameDisplay();
    
  
    
    // Exponer funciones globalmente para HTML
    window.logout = logout;
    window.updateUsernameDisplay = updateUsernameDisplay;
    window.actualizarRolEnHeader = actualizarRolEnHeader;
    
    console.log('✅ Header inicializado correctamente');
}

// Exportar función de inicialización
window.initHeader = initHeader;

// Export for ES6 modules
export { initHeader };