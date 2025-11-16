const XP_PER_LEVEL = 500;

// URL del login (ajustar si es otra)
const LOGIN_URL = "/index.html";

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
          <div class="user-avatar">
            <span id="userInitials">?</span>
          </div>
          <div class="user-info">
            <span class="username" id="usernameDisplay">Cargando...</span>
            <span class="user-status" id="userRoleStatus">Miembro activo</span>

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
      icon
        ? `<span class="header-action-icon">${icon}</span>`
        : ""
    }
    <span>${label}</span>
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
