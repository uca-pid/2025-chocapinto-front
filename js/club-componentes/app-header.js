const XP_PER_LEVEL = 500;

// URL del login (ajustar si es otra)
const LOGIN_URL = "/index.html";
const PROFILE_URL = "/html/perfil.html";

/**
 * Inicializa el header base dentro de #app-header.
 * options:
 *  - showBackButton: boolean
 *  - onBack: función callback opcional (si no, hace history.back())
 */
export function initAppHeader(options = {}) {
  const { showBackButton = false, onBack = null } = options;

  const headerRoot = document.getElementById("app-header");
  if (!headerRoot) {
    console.warn("⚠️ No se encontró #app-header en el DOM");
    return;
  }

  headerRoot.innerHTML = `
    <style>
    .user-avatar {
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0984e3, #74b9ff);
      border-radius: 50%;
      color: white;
      font-weight: 600;
      font-size: 16px;
      border: 2px solid #eaf6ff;
    }
    
    .user-avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      position: absolute;
      top: 0;
      left: 0;
    }
    
    #userInitials {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      text-transform: uppercase;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 14px; /* separación entre iconos */
    }

    .header-action-btn {
      background: transparent;
      border: none;
      padding: 0;
      margin: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      /* elimina cualquier estilo nativo */
      outline: none;
      box-shadow: none;
    }

    .header-action-icon {
      margin-right: 8px;
      font-size: 20px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
      
    .header-action-btn:hover .header-action-icon {
      transform: scale(1.15);
      opacity: 0.85;
    }

    .header-action-btn:active .header-action-icon {
      transform: scale(1.05);
    }

    .header-action-primary,
    .header-action-secondary,
    .header-action-ghost {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    /* Columna izquierda: nombre + estado */
    .user-info > div:first-child {
      display: flex;
      flex-direction: column;
    }

    /* Nombre */
    .username {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.2;
    }

    /* Estado */
    .user-status {
      font-size: 11px;
      opacity: 0.7;
    }

    .user-xp {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      min-width: 140px;
    }

    .user-level {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    /* Barra de progreso */
    .xp-progress-bar-bg {
      width: 120px;
      height: 6px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      overflow: hidden;
    }

    .xp-progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #00cec9, #0984e3);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .xp-progress-text {
      font-size: 10px;
      opacity: 0.7;
      margin-top: 2px;
    }

    .app-header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    /* Avatar + bloque de info en fila */
    .app-header-right .user-profile {
      display: flex !important;
      flex-direction: row !important;
      align-items: center;
      gap: 12px;
    }

    /* Dentro de user-info queremos:
      [  (nombre+estado)   ][   (nivel+barra)   ]  */
    .app-header-right .user-info {
      display: flex !important;
      flex-direction: row !important;
      align-items: flex-start;
      gap: 16px;
    }

    /* Columna izquierda: nombre + estado */
    .app-header-right .user-info > div:first-child {
      display: flex;
      flex-direction: column;
    }

    /* Columna derecha: nivel + barra */
    .app-header-right .user-xp {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      min-width: 140px;
    }

    /* Barra de progreso más visible sobre fondo blanco */
    .app-header-right .xp-progress-bar-bg {
      width: 120px;
      height: 6px;
      background: #eceff4; /* gris clarito para que se vea aunque el fill esté en 0 */
      border-radius: 4px;
      overflow: hidden;
    }

    .app-header-right .xp-progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #00cec9, #0984e3);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .app-header-right .xp-progress-text {
      font-size: 10px;
      opacity: 0.7;
      margin-top: 2px;
    }


    </style>
    
    <div class="app-header-inner">
      <div class="app-header-left">
        <button id="header-back-btn" class="header-icon-btn" style="display: ${
          showBackButton ? "flex" : "none"
        }">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <div id="header-context" class="header-context">
          <!-- Icono + título + subtítulo -->
        </div>
      </div>

      <div class="app-header-right">
        <div id="header-actions" class="header-actions">
          <!-- Botones específicos de cada pantalla -->
        </div>

        <div class="user-profile">
          <div class="user-avatar" id="userAvatarContainer">
            <img id="userAvatarImg" class="user-avatar-img" style="display: none;" alt="Avatar del usuario">
            <span id="userInitials">?</span>
          </div>
          <div class="user-info">
            <div>
              <span class="username" id="usernameDisplay">Cargando...</span>
              <span class="user-status" id="userRoleStatus">Miembro activo</span>
            </div>
            <div class="user-xp" id="userXpContainer">
              <div class="user-level" id="userLevelDisplay">Nivel 1</div>
              <div class="xp-progress">
                <div class="xp-progress-bar-bg">
                  <div class="xp-progress-bar-fill" id="xpProgressFill"></div>
                </div>
                <div class="xp-progress-text" id="xpProgressText">
                  0 / ${XP_PER_LEVEL} XP · Faltan ${XP_PER_LEVEL}
                </div>
              </div>
            </div>
          </div>
        </div>        
      </div>
    </div>
  `;

  // Botón de back
  const backBtn = document.getElementById("header-back-btn");
  if (backBtn && showBackButton) {
    backBtn.addEventListener("click", () => {
      if (typeof onBack === "function") {
        onBack();
      } else {
        window.history.back();
      }
    });
  }

  // Inicializar usuario + xp
  updateUsernameAndInitials();
  updateUserXpHeader();

  // Exponer para que otras partes (p. ej. concluir lectura) puedan refrescar XP
  window.updateUserXpHeader = updateUserXpHeader;

  // Click en todo el perfil -> ir a pantalla de perfil
  const userProfile = document.querySelector(".user-profile");
  if (userProfile) {
    userProfile.style.cursor = "pointer";

    userProfile.addEventListener("click", () => {
      window.location.href = PROFILE_URL;
    });
  }

}

/**
 * Define el contexto del header (icono + título + subtítulo)
 * Ej (club): icon: "📚", title: "Fans de Lovecraft", subtitle: "12 miembros"
 */
export function setHeaderContext({ icon = "📚", title = "", subtitle = "" } = {}) {
  const contextRoot = document.getElementById("header-context");
  if (!contextRoot) return;

  contextRoot.innerHTML = `
    <div class="header-context-icon">${icon}</div>
    <div class="header-context-text">
      <div class="header-context-title">${title}</div>
      ${
        subtitle
          ? `<div class="header-context-subtitle">${subtitle}</div>`
          : ""
      }
    </div>
  `;
}

/**
 * Agrega un botón de acción a la derecha del header
 * config:
 *  - id: string opcional
 *  - label: texto del botón
 *  - icon: string (emoji o SVG inline)
 *  - variant: "primary" | "secondary" | "ghost"
 *  - onClick: función
 */
export function addHeaderAction({
  id,
  label,
  icon = "",
  variant = "secondary",
  onClick,
}) {
  const actionsRoot = document.getElementById("header-actions");
  if (!actionsRoot) return;

  const btn = document.createElement("button");
  btn.className = `header-action-btn header-action-${variant}`;
  if (id) btn.id = id;

  btn.innerHTML = `
    ${
        `<span class="header-action-icon">${icon}</span>`
    }
  `;

  if (typeof onClick === "function") {
    btn.addEventListener("click", onClick);
  }

  actionsRoot.appendChild(btn);
  return btn;
}

// ================================
// Helpers internos
// ================================

function updateUsernameAndInitials() {
  const username = localStorage.getItem("username");
  const email = localStorage.getItem("email") || "";
  const usernameEl = document.getElementById("usernameDisplay");
  const initialsEl = document.getElementById("userInitials");

  if (!username) {
    console.error("❌ No se encontró 'username' en localStorage. Redirigiendo a login...");
    window.location.href = LOGIN_URL;
    return;
  }

  if (usernameEl) usernameEl.textContent = username;

  const base = email || username;
  const initials =
    base
      .split("@")[0]
      .split(/[.\s_-]+/)
      .filter(Boolean)
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "?";

  if (initialsEl) initialsEl.textContent = initials;
  
  // Cargar avatar del usuario
  loadUserAvatar();
}

/**
 * Carga el avatar del usuario desde el servidor
 */
function loadUserAvatar() {
  const username = localStorage.getItem("username");
  if (!username) return;

  fetch(`${window.API_URL}/user/${username}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.user && data.user.avatar) {
        const avatarImg = document.getElementById("userAvatarImg");
        const initialsEl = document.getElementById("userInitials");
        
        if (avatarImg && initialsEl) {
          avatarImg.src = data.user.avatar;
          avatarImg.style.display = 'block';
          initialsEl.style.display = 'none';
          
          // Si la imagen falla al cargar, mostrar iniciales
          avatarImg.onerror = function() {
            console.log('Error cargando avatar, mostrando iniciales');
            avatarImg.style.display = 'none';
            initialsEl.style.display = 'flex';
          };
        }
      }
    })
    .catch((error) => {
      console.log('Error obteniendo avatar del usuario:', error);
      // Mantener las iniciales si hay error
    });
}

/**
 * Carga nivel/XP del usuario actual y actualiza el HUD en el header.
 */
function updateUserXpHeader() {
  const levelEl = document.getElementById("userLevelDisplay");
  const xpTextEl = document.getElementById("xpProgressText");
  const xpFillEl = document.getElementById("xpProgressFill");

  const userId = localStorage.getItem("userId");

  // Todos deben estar logueados: si no hay userId -> error de sesión
  if (!userId) {
    console.error("❌ No se encontró 'userId' en localStorage. Redirigiendo a login...");
    window.location.href = LOGIN_URL;
    return;
  }

  fetch(`${window.API_URL}/user/${userId}`)
    .then((res) => res.json())
    .then((data) => {
      if (!data.success || !data.user) {
        console.error("No se pudo obtener usuario para XP:", data);
        return;
      }

      const xp = data.user.xp ?? 0;
      const level = data.user.level ?? 1;

      if (levelEl) {
        levelEl.textContent = `Nivel ${level}`;
      }

      const prevLevelXp = (level - 1) * XP_PER_LEVEL;
      const levelXp = Math.max(0, xp - prevLevelXp);
      const levelXpNeeded = XP_PER_LEVEL;
      const remaining = Math.max(0, levelXpNeeded - levelXp);
      const percent = Math.max(
        0,
        Math.min(100, (levelXp / levelXpNeeded) * 100)
      );

      if (xpTextEl) {
        xpTextEl.textContent = `${levelXp} / ${levelXpNeeded} XP · Faltan ${remaining}`;
      }

      if (xpFillEl) {
        xpFillEl.style.width = `${percent}%`;
      }
    })
    .catch((err) => {
      console.error("Error obteniendo XP de usuario:", err);
    });
}
