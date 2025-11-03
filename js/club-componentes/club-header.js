
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

// ========== INICIALIZACIÓN ==========
function initHeader() {
    console.log('🏠 Inicializando header...');
    
    // Actualizar username al cargar
    updateUsernameDisplay();
    
    // Exponer funciones globalmente para HTML
    window.logout = logout;
    window.updateUsernameDisplay = updateUsernameDisplay;
    
    console.log('✅ Header inicializado correctamente');
}

// Exportar función de inicialización
window.initHeader = initHeader;

// Export for ES6 modules
export { initHeader };