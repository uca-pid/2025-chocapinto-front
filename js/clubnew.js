// Nuevo header reutilizable
import { initAppHeader, setHeaderContext, addHeaderAction } from './club-componentes/app-header.js';
import { initNotificaciones, mostrarModalNotificaciones } from './club-componentes/notificaciones-alertas.js';
import { showNotification } from '../componentes/notificacion.js';
import{initSessionManager} from './sessionManager.js';

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
import { initAgenda } from './club-componentes/club-agenda.js';

import { API_URL } from './env.js';
import { showLoader, hideLoader } from "../componentes/loader.js";
import { initClubVotingComponent } from './club-componentes/club-voting.js';
import { initPeriodosHistoryComponent } from './club-componentes/club-periodos-history.js';

document.addEventListener("DOMContentLoaded", async () => {
  initSessionManager();
  // Variables globales
  window.API_URL = API_URL;
  window.showLoader = showLoader;
  window.hideLoader = hideLoader;

  initUtils();
  window.currentBookId = null;
  window.modalComentarios = document.getElementById("modalComentarios");

  initAppHeader();

  initNavigation();
  initLibrary();
  initClubVotingComponent();
  initPeriodosHistoryComponent();
  initWidgets();
  initBookModal();
  initCommentsModal();
  initHistoryModal();
  initInfoModals();

  showLoader("Cargando club...");

  setTimeout(async () => {
    try {
await renderClub();
      
      hideLoader();
      if (!window.clubData) {
        showNotification("error", "El club no existe o no se pudo cargar");
        setTimeout(() => {
          window.location.href = "main.html";
        }, 2000);
        return;
      }
      
      if (window.clubData) {
        const clubData = window.clubData;
        const userId = parseInt(localStorage.getItem("userId"));
        
        // VERIFICACIÓN DE ACCESO AL CLUB
        if (!userId) {
          showNotification("error", "Debes iniciar sesión para acceder");
          setTimeout(() => {
            window.location.href = "index.html";
          }, 1500);
          return;
        }
        
        // Verificar si el usuario es miembro o owner
        const isMember = clubData.members?.some(member => member.id === userId);
        const isOwner = clubData.id_owner === userId;
        
        if (!isMember && !isOwner) {
          showNotification("error", "No tienes permiso para acceder a este club");
          setTimeout(() => {
            window.location.href = "main.html";
          }, 2000);
          return;
        }
        
        // Si llegó aquí, tiene acceso - continuar normal
        const clubLogo = clubData.imagen || null;

        setHeaderContext({
          icon: clubLogo || "📚",
          title: clubData.name || "Club de lectura",
          subtitle: `${clubData.members?.length || 0} miembros`,
        });
        
        // Obtener el rol del usuario
        const userRoleInfo = window.getUserRoleInClub
          ? window.getUserRoleInClub(clubData, userId)
          : { role: 'LECTOR', isOwner: false, isModerator: false };

        const isModerador = userRoleInfo.isModerator;
        const isLector = userRoleInfo.role === 'LECTOR';

        addHeaderAction({
          id: "notificacionesBtn",
          icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>`,
          variant: "secondary",
          onClick: () => {
            mostrarModalNotificaciones();
          }
        });

        if (isOwner) {
          addHeaderAction({
            id: "eliminarClubBtnHeader",
            label: "Eliminar club",
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>`,
            variant: "primary",
          });
        }

        if (isOwner || isModerador) {
          const solicitudesBtn = addHeaderAction({
            id: "requestsBtn",
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <path d="M17 11l2 2 4-4"/>
            </svg>`,   
            variant: "secondary",
            onClick: () => {
              if (window.abrirModalSolicitudes) {
                window.abrirModalSolicitudes();
              }
            }
          });
        }

        if (isModerador || isLector) {
          addHeaderAction({
            id: "salirClubBtnHeader",
            label: "Salir del club",
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>`,
            variant: "ghost",
          });
        }

        initCore();
        
        if (window.clubData && window.clubData.id) {
          initAgenda(window.clubData.id, userRoleInfo.role);
        }

        if (typeof window.actualizarBadgeSolicitudes === 'function') {
          window.actualizarBadgeSolicitudes(clubData);
        }
        if (userId) {
          initNotificaciones(userId);
        }
      }

    } catch (error) {
      hideLoader();
    }
  }, 800);
});
