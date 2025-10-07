import { API_URL } from "./env.js";
import { showNotification } from "../componentes/notificacion.js";
import { showLoader, hideLoader } from "../componentes/loader.js";


//Inicializador de pagina - mostrar loader inicial
showLoader("Iniciando perfil...");






// --- 2. MANEJO DE SECCIONES (Editar Perfil / Cambiar Contraseña) ---

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
    document.querySelector(`.sidebar-actions button[data-target="${targetId}"]`).classList.add('active-btn');
    
    // Limpia el formulario de contraseña al cambiar de sección
    if (targetId === 'edit-profile') {
        document.getElementById('passwordForm').reset();
    }
}

// Event listeners para los botones de la barra lateral
document.getElementById('showEditProfileBtn').addEventListener('click', () => switchSection('edit-profile'));
document.getElementById('showChangePasswordBtn').addEventListener('click', () => switchSection('change-password'));

// Event listener para el botón Cancelar de cambiar contraseña
document.getElementById('cancelPasswordBtn').addEventListener('click', () => switchSection('edit-profile'));


// --- 3. LÓGICA DE CARGA DE DATOS ---

document.addEventListener("DOMContentLoaded", async () => {
    const currentUsername = localStorage.getItem("username");
    if (!currentUsername) {
        hideLoader();
        window.location.href = "index.html";
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
            
            // Sidebar
            document.getElementById("sidebar-name").textContent = username; 
            document.getElementById("info-role").textContent = role;
            document.getElementById("info-email").textContent = email;

            // Formulario de Edición
            document.getElementById("username").value = username;
            document.getElementById("email").value = email;
            
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
        // Este es el error que estás viendo: si el endpoint no existe o falla la conexión.
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
                window.location.href = "index.html";
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