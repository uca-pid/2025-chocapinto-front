function setupTabNavigation() {
    const defaultTab = document.getElementById('glass-gold');
    const menuPrincipal = document.getElementById('menuPrincipal');
    
    if (defaultTab) {
        defaultTab.checked = true;
    }
    
    if (menuPrincipal) {
        menuPrincipal.style.display = 'block';
    }
}

function initNavigation() {
    setupTabNavigation();
    window.setupTabNavigation = setupTabNavigation;
}

window.initNavigation = initNavigation;

export { initNavigation };