

import { initHeader } from './club-header.js';
import { initNavigation } from './club-navigation.js';
import { initCore, renderClub } from './club-core.js';
import { initLibrary } from './club-library.js';
import { initWidgets } from './club-widgets.js';
import { initBookModal } from './club-modal-book.js';
import { initCommentsModal } from './club-modal-comments.js';
import { initHistoryModal } from './club-modal-history.js';
import { initInfoModals } from './club-modal-info.js';
import { hideLoader, showLoader } from './club-utils.js'; // Importar desde utils

console.log("Cargando coordinador principal club.js...");


document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Content Loaded - Coordinador Principal");
    
    // Inicializar todos los módulos
    initHeader();
    initNavigation();
    initCore();
    initLibrary();
    initWidgets();
    initBookModal();
    initCommentsModal();
    initHistoryModal();
    initInfoModals();

    
    showLoader("Cargando club...");
    setTimeout(() => {
        try {
            hideLoader();
            renderClub(); // Llama a la función principal desde club-core.js
        } catch (error) {
            console.error("Error en la carga inicial:", error);
        }
    }, 800);
});