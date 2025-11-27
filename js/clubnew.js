// Nuevo header reutilizable
import { initAppHeader, setHeaderContext, addHeaderAction } from './club-componentes/app-header.js';

// Resto de módulos
import { initNavigation } from './club-componentes/club-navegacion.js';
import { initCore, renderClub } from './club-componentes/club-core.js';
import { initLibrary } from './club-componentes/club-library.js';
import { initWidgets } from './club-componentes/club-widgets.js';
import { initBookModal } from './club-componentes/club-book.js';
import { initCommentsModal } from './club-componentes/club-modal-comments.js';
import { initHistoryModal } from './club-componentes/club-modal-history.js';
import { initInfoModals } from './club-componentes/club-modal-info.js';
import { initUtils } from './club-componentes/club-utils.js';

import { API_URL } from './env.js';
import { showLoader, hideLoader } from "../componentes/loader.js";
import { initClubVotingComponent } from './club-componentes/club-voting.js';
import { initPeriodosHistoryComponent } from './club-componentes/club-periodos-history.js';

console.log("Cargando coordinador principal club.js...");

document.addEventListener("DOMContentLoaded", async () => {

  console.log("DOM Content Loaded - Coordinador Principal");

  // Variables globales
  window.API_URL = API_URL;
  window.showLoader = showLoader;
  window.hideLoader = hideLoader;

  initUtils();
  window.currentBookId = null;
  window.modalComentarios = document.getElementById("modalComentarios");

  // =======================
  // 1) HEADER BASE
  // =======================
  initAppHeader();

  // =======================
  // 2) Inicializar módulos UI
  // =======================
  initNavigation();
  initLibrary();
  initClubVotingComponent();
  initPeriodosHistoryComponent();
  initWidgets();
  initBookModal();
  initCommentsModal();
  initHistoryModal();
  initInfoModals();

  // =======================
  // 3) Cargar club
  // =======================
  showLoader("Cargando club...");

  setTimeout(async () => {
    try {
      await renderClub(); // → carga club y setea window.clubData

      hideLoader();

      if (window.clubData) {
        const clubData = window.clubData;

        const clubLogo = clubData.imagen || null; // viene del campo imagen del esquema

        setHeaderContext({
          icon: clubLogo || "📚",   // si no hay imagen, cae al emoji
          title: clubData.name || "Club de lectura",
          subtitle: `${clubData.members?.length || 0} miembros`,
        });
     }


      const userId = parseInt(localStorage.getItem("userId"));
      const esAdmin = window.canUserManageClub
        ? window.canUserManageClub(clubData, userId)
        : false;

      console.log("¿Es admin?", esAdmin);

      // ========================
      // 6) SOLO SI ES ADMIN, CREAR LOS BOTONES
      // ========================
      if (esAdmin) {

        // ELIMINAR CLUB
        addHeaderAction({
          id: "eliminarClubBtnHeader",
          label: "Eliminar club",
          icon: "🗑️",
          variant: "primary",
          // sin onClick, lo conecta club-core.js
        });

        // SOLICITUDES
        const solicitudesBtn = addHeaderAction({
          id: "requestsBtn",
          label: "Solicitudes",
          icon: "👥",
          variant: "secondary",
        });

        // badge
        if (solicitudesBtn) {
          const badge = document.createElement("span");
          badge.id = "requestsBadge";
          badge.className = "requests-badge";
          badge.style.display = "none";
          solicitudesBtn.appendChild(badge);
        }
      }

      // ========================
      // 7) SIEMPRE (admin o no), botón salir
      // ========================
      addHeaderAction({
        id: "salirClubBtnHeader",
        label: "Salir del club",
        icon: "🚪",
        variant: "ghost",
      });

      // ========================
      // 8) AHORA que los botones existen → conectar listeners
      // ========================
      initCore();

    } catch (error) {
      hideLoader();
      console.error("Error en la carga inicial:", error);
    }
  }, 800);
});
