import { initHeader } from './club-componentes/club-header.js';
import { initNavigation } from './club-componentes/club-navegacion.js';
import { initCore, renderClub } from './club-componentes/club-core.js';
import { initLibrary } from './club-componentes/club-library.js';
import { initWidgets } from './club-componentes/club-widgets.js';
import { initBookModal } from './club-componentes/club-book.js';
import { initCommentsModal } from './club-componentes/club-modal-comments.js';
import { initHistoryModal } from './club-componentes/club-modal-history.js';
import { initInfoModals } from './club-componentes/club-modal-info.js';
import { initUtils, getClubId, getEstadoInfo, getEstadoLabel, formatTimeAgoReal, calcularDiasLectura, getAccionTexto, formatearMes } from './club-componentes/club-utils.js';
import { API_URL } from './env.js';
import { showLoader, hideLoader } from "../componentes/loader.js";
import { initClubVotingComponent } from './club-componentes/club-voting.js';
console.log("Cargando coordinador principal club.js...");


document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Content Loaded - Coordinador Principal");
    
    // Expose API_URL and loader functions globally
    window.API_URL = API_URL;
    window.showLoader = showLoader;
    window.hideLoader = hideLoader;
    
    // Initialize utilities first (they expose functions globally)
    initUtils();
    
    // Initialize shared variables for inter-module communication
    window.currentBookId = null;
    window.modalComentarios = document.getElementById("modalComentarios");
    
    // Inicializar todos los módulos
    initHeader();
    initNavigation();
    initCore();
    initLibrary();
    initClubVotingComponent();
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