import { API_URL } from "./env.js";
import { showNotification } from "../componentes/notificacion.js";
import { showLoader, hideLoader } from "../componentes/loader.js";

const LOGIN_URL = "index.html";

// Configuración de avatares por nivel
const AVATARS_POR_NIVEL = {
    1: ['DetectiveHombre.jpg', 'DetectiveMujer.jpg'], // Nivel 1: Solo los dos grandes
    2: ['DetectiveHombre.jpg', 'DetectiveMujer.jpg', 'AventureroFantasia.jpg', 'Exploradora.jpg'], // Nivel 2: Los 5 grandes
    3: ['DetectiveHombre.jpg', 'DetectiveMujer.jpg', 'AventureroFantasia.jpg', 'Exploradora.jpg', 'Filosofo.jpg'],
    4: ['DetectiveHombre.jpg', 'DetectiveMujer.jpg', 'AventureroFantasia.jpg', 'Exploradora.jpg', 'Filosofo.jpg', 'ElfaArquera.jpg'],
    5: ['DetectiveHombre.jpg', 'DetectiveMujer.jpg', 'AventureroFantasia.jpg', 'Exploradora.jpg', 'Filosofo.jpg', 'ElfaArquera.jpg', 'Hechizera2.jpg', 'Mago.jpg'],
    6: ['DetectiveHombre.jpg', 'DetectiveMujer.jpg', 'AventureroFantasia.jpg', 'Exploradora.jpg', 'Filosofo.jpg', 'ElfaArquera.jpg', 'Hechizera2.jpg', 'Mago.jpg', 'Vampiro.jpg', 'Hechizera.jpg'],
    7: ['DetectiveHombre.jpg', 'DetectiveMujer.jpg', 'AventureroFantasia.jpg', 'Exploradora.jpg', 'Filosofo.jpg', 'ElfaArquera.jpg', 'Hechizera2.jpg', 'Mago.jpg', 'Vampiro.jpg', 'Hechizera.jpg', 'Cyborg.jpg', 'Filosofo.jpg'],
    8: ['DetectiveHombre.jpg', 'DetectiveMujer.jpg', 'AventureroFantasia.jpg', 'Exploradora.jpg', 'Filosofo.jpg', 'ElfaArquera.jpg', 'Hechizera2.jpg', 'Mago.jpg', 'Vampiro.jpg', 'Hechizera.jpg', 'Cyborg.jpg', 'Filosofo.jpg', 'Reina.jpg'],
    9: ['DetectiveHombre.jpg', 'DetectiveMujer.jpg', 'AventureroFantasia.jpg', 'Exploradora.jpg', 'Filosofo.jpg', 'ElfaArquera.jpg', 'Hechizera2.jpg', 'Mago.jpg', 'Vampiro.jpg', 'Hechizera.jpg', 'Cyborg.jpg', 'Filosofo.jpg', 'Reina.jpg', 'SilverShroud.jpg'],
};

//Inicializador de pagina - mostrar loader inicial
showLoader("Iniciando perfil...");


// --- 2. MANEJO DE SECCIONES (Editar Perfil / Cambiar Contraseña / Mis Clubes) ---

function switchSection(targetId) {
    // Oculta todas las secciones
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    // Desactiva todos los botones de navegación
    document.querySelectorAll('.sidebar-actions button').forEach(btn => {
        btn.classList.remove('active-btn');
    });

    // Muestra la sección deseada
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }
    
    // Activa el botón de navegación correspondiente
    // NOTA: Asegúrate de que todos los botones tengan el atributo data-target
    const navButton = document.querySelector(`.sidebar-actions button[data-target="${targetId}"]`);
    if (navButton) {
        navButton.classList.add('active-btn');
    }

    // NUEVA LÓGICA: Si es la sección de clubes, carga los datos.
    if (targetId === 'my-clubs') {
        loadMyClubs();
    }
    
    // Limpia el formulario de contraseña al cambiar de sección
    if (targetId === 'edit-profile') {
        document.getElementById('passwordForm').reset();
    }
}

// Event listeners para los botones de la barra lateral
document.getElementById('showEditProfileBtn').addEventListener('click', () => switchSection('edit-profile'));
document.getElementById('showChangePasswordBtn').addEventListener('click', () => switchSection('change-password'));
document.getElementById('showMyClubsBtn').addEventListener('click', () => switchSection('my-clubs')); // <--- NUEVO EVENT LISTENER

// Event listener para el botón Cancelar de cambiar contraseña
document.getElementById('cancelPasswordBtn').addEventListener('click', () => switchSection('edit-profile'));


// --- 3. LÓGICA DE CARGA DE DATOS INICIALES ---

document.addEventListener("DOMContentLoaded", async () => {
    const currentUsername = localStorage.getItem("username");
    if (!currentUsername) {
        hideLoader();
        window.location.href = "LOGIN_URL";
        return;
    }
    
    // Al cargar, siempre mostrar la sección de edición por defecto
    switchSection('edit-profile');

    try {
        // Cambiar mensaje del loader para carga de datos
        showLoader("Cargando datos del perfil...");
        
        const res = await fetch(`${API_URL}/user/${currentUsername}`);
        const data = await res.json();
        
        console.log(data);
        if (data.success && data.user) {
            const username = data.user.username;
            const email = data.user.email || "Email no disponible";
            const role = data.user.role || "No asignado";
            
            // Guardar userId en localStorage si no existe
            if (data.user.id && !localStorage.getItem("userId")) {
                localStorage.setItem("userId", data.user.id.toString());
            }
            
            // Sidebar
            document.getElementById("sidebar-name").textContent = username; 
            document.getElementById("info-role").textContent = role;
            document.getElementById("info-email").textContent = email;

            // Formulario de Edición
            document.getElementById("username").value = username;
            document.getElementById("email").value = email;
            
            // Cargar avatar actual
            await cargarAvatarActual();
            
            // Simular un pequeño delay para mejor UX
            setTimeout(() => {
                hideLoader();
            }, 500);
        } else {
            hideLoader();
            showNotification("error", data.message || "Error al cargar los datos del perfil.");
        }
    } catch (error) {
        hideLoader();
        showNotification("error", "Error de conexión al cargar datos del perfil.");
    }
});


// --- 4. LÓGICA DE ACTUALIZACIÓN DE PERFIL (Solo Username) ---

// Se eliminó la lógica de contraseña de este formulario, ya que debe estar separada.
document.getElementById("perfilForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentUsername = localStorage.getItem("username");
    const newUsername = document.getElementById("username").value;

    try {
        // Mostrar loader durante la actualización
        showLoader("Actualizando perfil...");
        
        const res = await fetch(`${API_URL}/updateUser`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentUsername, newUsername })
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem("username", data.user.username);
            showLoader("Perfil actualizado! Recargando...");
            showNotification("success", "Usuario actualizado con éxito");
            // Recarga para actualizar el sidebar
            setTimeout(() => {
                hideLoader();
                window.location.reload();
            }, 1000); 
        } else {
            hideLoader();
            showNotification("error", data.message || "Error al actualizar el usuario");
        }
    } catch (error) {
        console.error("Error al actualizar:", error);
        hideLoader();
        showNotification("error", "Error de conexión con el servidor");
    }
});


// --- 5. LÓGICA DE ACTUALIZACIÓN DE CONTRASEÑA (NUEVA FUNCIÓN) ---
document.getElementById("passwordForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentUsername = localStorage.getItem("username");
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        showNotification("error", "La nueva contraseña y la confirmación no coinciden.");
        return;
    }

    // Validación de seguridad (ejemplo)
    const minLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    if (!minLength || !hasUpper) {
        showNotification("error", "La nueva contraseña debe tener al menos 8 caracteres y una mayúscula.");
        return;
    }
    
    // **Asegúrate de que este endpoint /changePassword esté implementado en tu backend.**
    try {
        // Mostrar loader durante el cambio de contraseña
        showLoader("Cambiando contraseña...");
        
        const res = await fetch(`${API_URL}/changePassword`, { 
            method: "POST", // Usar POST o PUT para esta operación
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentUsername, currentPassword, newPassword })
        });

        const data = await res.json();

        if (data.success) {
            showLoader("Contraseña cambiada! Redirigiendo...");
            showNotification("success", "Contraseña cambiada con éxito. Serás redirigido al inicio.");
            document.getElementById("passwordForm").reset();
            // Redirige al inicio o al login para forzar reautenticación
            setTimeout(() => {
                hideLoader();
                window.location.href = "main.html";
            }, 1000); 

        } else {
            hideLoader();
            showNotification("error", data.message || "Error al cambiar la contraseña. Verifica tu contraseña actual.");
        }
    } catch (error) {
        hideLoader();
        showNotification("error", "Error de conexión con el servidor");
    }
});


// --- 6. LÓGICA DE ELIMINAR CUENTA (Mantenida) ---

document.getElementById("deleteAccountBtn").addEventListener("click", async () => {
    if (!confirm("¿Seguro que querés eliminar tu cuenta? Esta acción no se puede deshacer.")) return;
    
    const username = localStorage.getItem("username");
    
    try {
        // Mostrar loader durante la eliminación
        showLoader("Eliminando cuenta...");
        
        const res = await fetch(`${API_URL}/deleteUser`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
        
        const data = await res.json();
        
        if (data.success) {
            showLoader("Cuenta eliminada! Redirigiendo...");
            showNotification("success", "Cuenta eliminada correctamente");
            localStorage.removeItem("username");
            localStorage.removeItem("role");
            
            setTimeout(() => {
                hideLoader();
                window.location.href = LOGIN_URL;
            }, 1500);
        } else {
            hideLoader();
            showNotification("error", data.message || "No se pudo eliminar la cuenta");
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
        hideLoader();
        showNotification("error", "Error de conexión con el servidor");
    }
});


document.addEventListener("DOMContentLoaded", () => {

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      confirmarCerrarSesion();
    });
  }

});

function confirmarCerrarSesion() {
  if (window.mostrarConfirmacion) {
    window.mostrarConfirmacion(
      "Cerrar sesión",
      "¿Estás seguro de que querés cerrar sesión?",
      cerrarSesion,
      null,
      {
        confirmText: "Cerrar sesión",
        cancelText: "Cancelar",
        confirmClass: "red-btn",
        cancelClass: "gray-btn"
      }
    );
  } else {
    const ok = confirm("¿Estás seguro de que querés cerrar sesión?");
    if (ok) cerrarSesion();
  }
}

function cerrarSesion() {
  localStorage.removeItem("userId");
  localStorage.removeItem("username");
  localStorage.removeItem("email");
  localStorage.removeItem("token");
  localStorage.removeItem("role");

  window.location.href = LOGIN_URL;
}

// --- 7. LÓGICA DE CARGA DE MIS CLUBES (NUEVA FUNCIÓN) ---

async function loadMyClubs() {
    showLoader("Cargando tus clubes...");
    const currentUsername = localStorage.getItem("username");
    const clubsListContainer = document.getElementById("clubs-list");
    clubsListContainer.innerHTML = ''; // Limpia el contenido anterior
    

    try {
        // Este FETCH requiere el endpoint /user/{username}/clubs en tu backend
        const res = await fetch(`${API_URL}/user/${currentUsername}/clubs`);
        
        if (!res.ok) {
            throw new Error(`Error en la API: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.success && data.clubs) {
            const clubs = data.clubs;
        

            if (clubs.length === 0) {
                clubsListContainer.innerHTML = '<p class="no-clubs-message">Aún no estás suscrito a ningún club. ¡Busca uno!</p>';
            } else {
                clubs.forEach(club => {
                    // Determinar el texto de rol a mostrar
                    const roleText = club.role === 'OWNER' ? 'Dueño del Club' : club.role;
                    const clubCard = `
                        
                        <div class="club-card-row">

                            <img class="club-photo-small"
                                src="${club.imagen || '../images/default-club.png'}"
                                alt="Foto del club">

                            <div class="club-info">
                                <h3 class="club-name">${club.name}</h3>

                                <p class="club-detail"><strong>Rol:</strong> ${roleText}</p>
                                <p class="club-detail"><strong>Se unió el:</strong> ${new Date(club.joinedAt).toLocaleDateString()}</p>

                                <button class="btn-primary-club club-button"
                                    onclick="window.location.href='club_lectura.html?clubId=${club.id}'">
                                    Ir al Club
                                </button>
                            </div>

                        </div>
                    
                    `;
                    clubsListContainer.innerHTML += clubCard;
                });
            }
            
            hideLoader();
        } else {
            hideLoader();
            clubsListContainer.innerHTML = '<p class="error-message">No se pudo cargar la lista de clubes.</p>';
            showNotification("error", data.message || "Error al obtener los datos de los clubes.");
        }
    } catch (error) {
        console.error("Error en loadMyClubs:", error);
        hideLoader();
        clubsListContainer.innerHTML = '<p class="error-message">Error de conexión con el servidor. Por favor, verifica el endpoint.</p>';
        showNotification("error", "Error de conexión al cargar los clubes.");
    }
}

// Funciones del Modal de Avatar
async function abrirModalAvatar() {
    const modal = document.getElementById('modalSeleccionAvatar');
    if (!modal) return;
    
    // Obtener el nivel actual del usuario
    const userLevel = await obtenerNivelUsuario();
    
    if (userLevel === null) {
        showNotification("error", "No se pudo obtener tu nivel actual");
        return;
    }
    
    // Generar el HTML del modal con avatares filtrados por nivel
    generarGridAvataresPorNivel(userLevel);
    
    modal.style.display = 'flex';
    marcarAvatarActual();
}

function cerrarModalAvatar() {
    const modal = document.getElementById('modalSeleccionAvatar');
    if (modal) {
        modal.style.display = 'none';
        // Quitar selección visual
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.classList.remove('selected');
        });
    }
}

// Función para obtener el nivel actual del usuario
async function obtenerNivelUsuario() {
    try {
        const currentUsername = localStorage.getItem("username");
        if (!currentUsername) return null;
        
        const res = await fetch(`${API_URL}/user/${currentUsername}`);
        const data = await res.json();
        
        if (data.success && data.user && data.user.level) {
            return data.user.level;
        }
        return 1; // Nivel por defecto si no se encuentra
    } catch (error) {
        console.error("Error obteniendo nivel del usuario:", error);
        return 1; // Nivel por defecto en caso de error
    }
}

// Función para generar el grid de avatares según el nivel
function generarGridAvataresPorNivel(userLevel) {
    const avatarGrid = document.querySelector('.avatar-grid');
    if (!avatarGrid) return;
    
    // Obtener avatares disponibles para el nivel del usuario
    let avatarsDisponibles = [];
    for (let nivel = 1; nivel <= userLevel; nivel++) {
        if (AVATARS_POR_NIVEL[nivel]) {
            avatarsDisponibles = [...new Set([...avatarsDisponibles, ...AVATARS_POR_NIVEL[nivel]])];
        }
    }
    
    // Si el nivel es muy alto, mostrar todos
    if (userLevel > 10) {
        avatarsDisponibles = Object.values(AVATARS_POR_NIVEL).flat();
        avatarsDisponibles = [...new Set(avatarsDisponibles)]; // Remover duplicados
    }
    
    // Todos los avatares posibles con sus detalles
    const todosLosAvatares = [
        { archivo: 'DetectiveHombre.jpg', nombre: 'Detective Hombre', nivelRequerido: 1 },
        { archivo: 'DetectiveMujer.jpg', nombre: 'Detective Mujer', nivelRequerido: 1 },
        { archivo: 'AventureroFantasia.jpg', nombre: 'Aventurero de Fantasia', nivelRequerido: 2 },
        { archivo: 'Exploradora.jpg', nombre: 'Exploradora', nivelRequerido: 2 },
        { archivo: 'Filosofo.jpg', nombre: 'Filosofo', nivelRequerido: 3 },
        { archivo: 'ElfaArquera.jpg', nombre: 'ElfaArquera', nivelRequerido: 4 },
        { archivo: 'Hechizera2.jpg', nombre: 'Hechizera', nivelRequerido: 5 },
        { archivo: 'Mago.jpg', nombre: 'Mago', nivelRequerido: 5 },
        { archivo: 'Vampiro.jpg', nombre: 'Vampiro', nivelRequerido: 6 },
        { archivo: 'Hechizera.jpg', nombre: 'Bruja', nivelRequerido: 6 },
        { archivo: 'Cyborg.jpg', nombre: 'Cyborg', nivelRequerido: 7 },
        { archivo: 'Filosofo.jpg', nombre: 'Filosofo', nivelRequerido: 7 },
        { archivo: 'Reina.jpg', nombre: 'Reina', nivelRequerido: 8 },
        { archivo: 'SilverShroud.jpg', nombre: 'SilverShroud', nivelRequerido: 9 },
    ];
    
    // Primero crear el HTML de información del nivel
    const levelInfoHTML = `
        <div class="avatar-level-info">
            <h4>🌟 Tu nivel actual: ${userLevel}</h4>
            <p>Avatares disponibles: ${avatarsDisponibles.length} de ${todosLosAvatares.length}</p>
        </div>
    `;
    
    // Luego generar HTML de avatares
    let avatarsHTML = '';
    todosLosAvatares.forEach(avatar => {
        const disponible = avatarsDisponibles.includes(avatar.archivo);
        const clases = `avatar-option ${disponible ? 'available' : 'locked'}`;
        const onClick = disponible ? `seleccionarAvatar('${avatar.archivo}')` : `mostrarAvatarBloqueado('${avatar.nombre}', ${avatar.nivelRequerido})`;
        
        avatarsHTML += `
            <div class="avatar-item">
                <img src="../images/avatars/${avatar.archivo}" 
                     class="${clases}" 
                     onclick="${onClick}" 
                     alt="${avatar.nombre}"
                     title="${disponible ? avatar.nombre : `${avatar.nombre} (Nivel ${avatar.nivelRequerido} requerido)`}">
                ${!disponible ? `<div class="avatar-lock">
                    <i class="fa-solid fa-lock"></i>
                    <span>Nivel ${avatar.nivelRequerido}</span>
                </div>` : ''}
            </div>
        `;
    });
    
    // Insertar la información del nivel antes del grid
    const modalContent = avatarGrid.parentElement;
    
    // Verificar si ya existe el panel de información y eliminarlo
    const existingInfo = modalContent.querySelector('.avatar-level-info');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    // Insertar la nueva información antes del grid de avatares
    avatarGrid.insertAdjacentHTML('beforebegin', levelInfoHTML);
    
    // Actualizar solo el contenido del grid con los avatares
    avatarGrid.innerHTML = avatarsHTML;
}

// Función para mostrar mensaje cuando se intenta seleccionar un avatar bloqueado
function mostrarAvatarBloqueado(nombreAvatar, nivelRequerido) {
    showNotification("warning", `¡${nombreAvatar} se desbloquea en el Nivel ${nivelRequerido}! Sigue leyendo para alcanzarlo 📚`);
}

function marcarAvatarActual() {
    const currentAvatarImg = document.getElementById('currentAvatarImg');
    if (currentAvatarImg && currentAvatarImg.src) {
        const currentSrc = currentAvatarImg.src;
        const filename = currentSrc.split('/').pop();
        
        document.querySelectorAll('.avatar-option.available').forEach(option => {
            option.classList.remove('selected');
            if (option.src.includes(filename)) {
                option.classList.add('selected');
            }
        });
    }
}

async function seleccionarAvatar(nombreArchivo) {
    const userId = localStorage.getItem("userId");
    
    if (!userId) {
        showNotification("error", "No se encontró el ID del usuario");
        return;
    }
    
    try {
        showLoader("Actualizando avatar...");
        
        const res = await fetch(`${API_URL}/users/${userId}/update-avatar`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatarName: nombreArchivo })
        });

        const data = await res.json();

        if (data.success) {
            // Actualizar la imagen en la pantalla inmediatamente
            const avatarImg = document.getElementById('currentAvatarImg');
            const defaultIcon = document.getElementById('defaultAvatarIcon');
            
            if (avatarImg && defaultIcon) {
                avatarImg.src = data.avatar;
                avatarImg.style.display = 'block';
                defaultIcon.style.display = 'none';
            }
            
            showNotification("success", "¡Avatar actualizado correctamente!");
            cerrarModalAvatar();
        } else {
            showNotification("error", data.message || "Error al actualizar el avatar");
        }
    } catch (error) {
        console.error("Error al actualizar avatar:", error);
        showNotification("error", "Error de conexión al actualizar el avatar");
    } finally {
        hideLoader();
    }
}

// Función para cargar el avatar actual del usuario
async function cargarAvatarActual() {
    const currentUsername = localStorage.getItem("username");
    if (!currentUsername) return;
    
    try {
        const res = await fetch(`${API_URL}/user/${currentUsername}`);
        const data = await res.json();
        
        if (data.success && data.user && data.user.avatar) {
            const avatarImg = document.getElementById('currentAvatarImg');
            const defaultIcon = document.getElementById('defaultAvatarIcon');
            
            if (avatarImg && defaultIcon) {
                avatarImg.src = data.user.avatar;
                avatarImg.style.display = 'block';
                defaultIcon.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Error al cargar avatar actual:", error);
        // Si hay error, mantener el ícono por defecto
    }
}

// Exponer funciones globalmente para el HTML
window.abrirModalAvatar = abrirModalAvatar;
window.cerrarModalAvatar = cerrarModalAvatar;
window.seleccionarAvatar = seleccionarAvatar;
window.mostrarAvatarBloqueado = mostrarAvatarBloqueado;