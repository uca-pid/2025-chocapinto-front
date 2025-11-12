function setupTabNavigation() {
    const defaultTab = document.getElementById('glass-gold');
    const menuPrincipal = document.getElementById('menuPrincipal');
    
    if (defaultTab) {
        defaultTab.checked = true;
        console.log("Tab Principal marcada como checked por defecto");
    }
    
    if (menuPrincipal) {
        menuPrincipal.style.display = 'block';
        console.log("MenuPrincipal mostrado por defecto");
    }
}

// ========== INICIALIZACIÓN ==========
function initNavigation() {
    console.log('🧭 Inicializando navegación...');
    
    // Configurar navegación por tabs
    setupTabNavigation();
    
    // Exponer funciones globalmente
    window.setupTabNavigation = setupTabNavigation;
    
    console.log('✅ Navegación inicializada correctamente');
}

// Exportar función de inicialización
window.initNavigation = initNavigation;

// Export for ES6 modules
export { initNavigation };