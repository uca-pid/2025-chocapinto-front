import { mostrarConfirmacion } from '../../componentes/confirmacion.js';
const XP_PER_LEVEL = 500;

// URL del login (ajustar si es otra)
const LOGIN_URL = "../html/index.html";
const PROFILE_URL = "../html/perfil.html";

/**
 * Inicializa el header base dentro de #app-header.
 * @param {Object} options - Opciones de configuración (actualmente no utilizado)
 */
export function initAppHeader(options = {}) {
  const headerRoot = document.getElementById("app-header");
  if (!headerRoot) return;

  headerRoot.innerHTML = `
    <style>
    /* =========================
   CONTENEDOR GENERAL HEADER
========================= */

#app-header {
  width: 100%;
  background: #ffffff;
  border-bottom: 1px solid #eaf0f6;
  position: sticky;
  top: 0;
  z-index: 100;
  overflow-x: hidden;
}

.app-header-inner {
  width: 100%;
  padding: 14px 32px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

/* =========================
   BLOQUE IZQUIERDO
========================= */

.app-header-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

/* Logo app */
.app-logo-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.app-logo-img {
  height: 65px;
  object-fit: contain;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.app-logo-container:hover .app-logo-img {
  transform: scale(1.05);
  opacity: 0.9;
}

/* Contexto del club */
.header-context {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-context-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.header-context-icon-image img {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  border: 2px solid #1172faff;
}

.header-context-text {
  display: flex;
  flex-direction: column;
}

.header-context-title {
  font-weight: 600;
  font-size: 15px;
}

.header-context-subtitle {
  font-size: 12px;
  opacity: 0.7;
}

/* =========================
   BLOQUE DERECHO
========================= */

.app-header-right {
  display: flex;
  align-items: center;
  gap: 26px;
}

/* =========================
   ACCIONES (ICONOS)
========================= */

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-action-btn {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  position: relative;
}

.header-action-icon {
  font-size: 20px;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.header-action-btn:hover .header-action-icon {
  transform: scale(1.15);
  opacity: 0.85;
}

.header-action-btn:active .header-action-icon {
  transform: scale(1.05);
}

.header-notification-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #e53935;
  color: white;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 0 0 2px #fff;
}

/* =========================
   BLOQUE USUARIO
========================= */

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

/* Avatar */
.user-avatar {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #0984e3, #74b9ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  border: 2px solid #eaf6ff;
}

.user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  position: absolute;
  top: 0;
  left: 0;
}

#userInitials {
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
}

/* =========================
   INFO USUARIO + XP
========================= */

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

/* Username */
.username {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

/* XP */
.user-xp {
  display: flex;
  flex-direction: column;
  min-width: 160px;
}

.user-level {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 2px;
}

.xp-progress-bar-bg {
  width: 150px;
  height: 6px;
  background: #eceff4;
  border-radius: 4px;
  overflow: hidden;
}

.xp-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00cec9, #0984e3);
  transition: width 0.3s ease;
}

.xp-progress-text {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 2px;
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 768px) {
  .header-context-text {
    display: none;
  }
  
  .user-info {
    display: none;
  }
  
  .app-header-inner {
    padding: 14px 16px;
    gap: 12px;
  }
  
  .app-header-left {
    gap: 12px;
  }
  
  .app-header-right {
    gap: 16px;
  }
  
  .header-actions {
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .app-logo-img {
    height: 30px;
  }
  
  .header-context-icon-image img {
    width: 36px;
    height: 36px;
  }
  
  .user-avatar {
    width: 50px;
    height: 50px;
  }
}





    </style>
    
    <div class="app-header-inner">
      <div class="app-header-left">
        <div class="app-logo-container" id="appLogoBtn">
          <img src="../images/BooksyLogo.png" alt="Logo App" class="app-logo-img" />
        </div>
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

  const appLogoBtn = document.getElementById("appLogoBtn");
  if (appLogoBtn) {
    appLogoBtn.addEventListener("click", () => {
      window.location.href = "../html/main.html"; // ajustá si tu home está en otra ruta
    });
  }
  addHeaderAction({
  id: "logoutBtn",
  icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>`,
  onClick: () => {
    mostrarConfirmacion(
      "Cerrar sesión",
      "¿Estás seguro de que querés cerrar sesión?",
      () => {
        // Confirmado - cerrar sesión
        localStorage.clear();
        window.location.href = "../html/index.html";
      },
      null, // onCancel (no hace nada)
      {
        confirmText: "Cerrar sesión",
        cancelText: "Cancelar",
        confirmClass: "red-btn",
        cancelClass: "green-btn"
      }
    );
  }
});


}

/**
 * Define el contexto del header (icono + título + subtítulo).
 * @param {Object} options - Configuración del contexto
 * @param {string} options.icon - URL de imagen o emoji
 * @param {string} options.title - Título principal
 * @param {string} options.subtitle - Subtítulo opcional
 */
export function setHeaderContext({ icon = "📚", title = "", subtitle = "" } = {}) {
  const contextRoot = document.getElementById("header-context");
  if (!contextRoot) return;

  let iconHtml = "";
  if (icon) {
    const isUrl =
      typeof icon === "string" &&
      (icon.startsWith("http://") ||
       icon.startsWith("https://") ||
       icon.startsWith("/"));

    if (isUrl) {
      iconHtml = `
        <div class="header-context-icon header-context-icon-image">
          <img src="${icon}" alt="${title}" onerror="this.style.display='none'; this.closest('.header-context-icon').textContent='📚';" />
        </div>
      `;
    } else {
      iconHtml = `<div class="header-context-icon">${icon}</div>`;
    }
  }

  contextRoot.innerHTML = `
    ${iconHtml}
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
 * Agrega un botón de acción a la derecha del header.
 * @param {Object} config - Configuración del botón
 * @param {string} config.id - ID opcional del botón
 * @param {string} config.label - Texto del botón
 * @param {string} config.icon - Emoji o SVG inline
 * @param {string} config.variant - Variante visual (primary/secondary/ghost)
 * @param {Function} config.onClick - Callback al hacer click
 * @returns {HTMLElement} Elemento del botón creado
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
        `<span class="header-action-icon">${icon}</span>
        <span class="header-notification-badge" style="display:none;"></span>`
    }
  `;

  if (typeof onClick === "function") {
    btn.addEventListener("click", onClick);
  }

  btn.setBadge = function (value) {
  const badge = btn.querySelector(".header-notification-badge");
  if (!badge) return;

  if (!value || value <= 0) {
    badge.style.display = "none";
  } else {
    badge.textContent = value > 99 ? "99+" : value;
    badge.style.display = "flex";
  }
};

  actionsRoot.appendChild(btn);
  return btn;
}

/**
 * Actualiza el username y las iniciales del usuario en el header.
 * Redirige al login si no hay sesión activa.
 */
function updateUsernameAndInitials() {
  const username = localStorage.getItem("username");
  const email = localStorage.getItem("email") || "";
  const usernameEl = document.getElementById("usernameDisplay");
  const initialsEl = document.getElementById("userInitials");

  if (!username) {
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
  
  loadUserAvatar();
}

/**
 * Carga el avatar del usuario desde el servidor.
 * Muestra la imagen si existe, o fallback a iniciales.
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
            avatarImg.style.display = 'none';
            initialsEl.style.display = 'flex';
          };
        }
      }
    })
    .catch(() => {});
}

/**
 * Carga nivel/XP del usuario actual y actualiza el HUD en el header.
 */
function updateUserXpHeader() {
  const levelEl = document.getElementById("userLevelDisplay");
  const xpTextEl = document.getElementById("xpProgressText");
  const xpFillEl = document.getElementById("xpProgressFill");

  const userId = localStorage.getItem("userId");

  if (!userId) {
    window.location.href = LOGIN_URL;
    return;
  }

  fetch(`${window.API_URL}/user/${userId}`)
    .then((res) => res.json())
    .then((data) => {
      if (!data.success || !data.user) return;

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
    .catch(() => {});
}
