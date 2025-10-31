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