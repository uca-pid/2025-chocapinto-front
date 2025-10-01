const API_URL = "http://127.0.0.1:5000";

// --- 1. FUNCIONES Y MANEJADORES DE MODALES (CORREGIDOS Y GLOBALES) ---

// Las funciones de modal ya no están anidadas dentro del submit, son globales.
function showPerfilModalError(msg) {
    const modal = document.getElementById("modalPerfilError");
    const modalMsg = document.getElementById("modalPerfilErrorMsg");
    if (modalMsg) modalMsg.textContent = msg;
    if (modal) modal.style.display = "flex";
}

function showPerfilModalSuccess(msg) {
    const modal = document.getElementById("modalPerfilSuccess");
    const modalMsg = document.getElementById("modalPerfilSuccessMsg");
    if (modalMsg) modalMsg.textContent = msg;
    if (modal) modal.style.display = "flex";
}

// Escucha global para cerrar los modales
document.addEventListener('click', (e) => {
    // Cierre del modal de ERROR
    if (e.target.id === "closeModalPerfilError" || e.target.id === "modalPerfilError") {
        document.getElementById("modalPerfilError").style.display = "none";
    }
    // Cierre del modal de ÉXITO
    if (e.target.id === "closeModalPerfilSuccess" || e.target.id === "modalPerfilSuccess") {
        document.getElementById("modalPerfilSuccess").style.display = "none";
    }
});

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

document.addEventListener("DOMContentLoaded", () => {
    const currentUsername = localStorage.getItem("username");
    if (!currentUsername) {
        window.location.href = "login.html";
        return;
    }
    
    // Al cargar, siempre mostrar la sección de edición por defecto
    switchSection('edit-profile');

    fetch(`${API_URL}/user/${currentUsername}`)
        .then(res => res.json())
        .then(data => {
            console.log(data);
            if (data.success && data.user) {
                const username = data.user.username;
                const email = data.user.email || "Email no disponible";
                const role = data.user.role || "No asignado"; // Obtener el rol del schema
                
                // Sidebar
                document.getElementById("sidebar-name").textContent = username; 
                document.getElementById("info-role").textContent = role; // Mostrar el rol
                document.getElementById("info-email").textContent = email;

                // Formulario de Edición
                document.getElementById("username").value = username;
                document.getElementById("email").value = email;
            } else {
                console.error("Error al cargar datos del usuario:", data.message);
                showPerfilModalError("Error al cargar los datos del perfil.");
            }
        })
        .catch(() => {
            console.error("Error de conexión al cargar datos.");
            showPerfilModalError("Error de conexión al cargar datos del perfil.");
        });
});


// --- 4. LÓGICA DE ACTUALIZACIÓN DE PERFIL (Solo Username) ---

// Se eliminó la lógica de contraseña de este formulario, ya que debe estar separada.
document.getElementById("perfilForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentUsername = localStorage.getItem("username");
    const newUsername = document.getElementById("username").value;

    try {
        const res = await fetch(`${API_URL}/updateUser`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentUsername, newUsername })
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem("username", data.user.username);
            showPerfilModalSuccess("Usuario actualizado con éxito");
            // Recarga para actualizar el sidebar
            setTimeout(() => window.location.reload(), 1000); 
        } else {
            showPerfilModalError(data.message || "Error al actualizar el usuario");
        }
    } catch (error) {
        console.error("Error al actualizar:", error);
        showPerfilModalError("Error de conexión con el servidor");
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
        showPerfilModalError("La nueva contraseña y la confirmación no coinciden.");
        return;
    }

    // Validación de seguridad (ejemplo)
    const minLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    if (!minLength || !hasUpper) {
        showPerfilModalError("La nueva contraseña debe tener al menos 8 caracteres y una mayúscula.");
        return;
    }
    
    // **Asegúrate de que este endpoint /changePassword esté implementado en tu backend.**
    try {
        const res = await fetch(`${API_URL}/changePassword`, { 
            method: "POST", // Usar POST o PUT para esta operación
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentUsername, currentPassword, newPassword })
        });

        const data = await res.json();

        if (data.success) {
            showPerfilModalSuccess("Contraseña cambiada con éxito. Serás redirigido al inicio.");
            document.getElementById("passwordForm").reset();
            // Redirige al inicio o al login para forzar reautenticación
            setTimeout(() => window.location.href = "main.html", 1000); 

        } else {
            showPerfilModalError(data.message || "Error al cambiar la contraseña. Verifica tu contraseña actual.");
        }
    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        // Este es el error que estás viendo: si el endpoint no existe o falla la conexión.
        showPerfilModalError("Error de conexión con el servidor"); 
    }
});


// --- 6. LÓGICA DE ELIMINAR CUENTA (Mantenida) ---

document.getElementById("deleteAccountBtn").addEventListener("click", async () => {
    if (!confirm("¿Seguro que querés eliminar tu cuenta? Esta acción no se puede deshacer.")) return;
    const username = localStorage.getItem("username");
    try {
        const res = await fetch(`${API_URL}/deleteUser`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
        const data = await res.json();
        if (data.success) {
            alert("Cuenta eliminada correctamente");
            localStorage.removeItem("username");
            localStorage.removeItem("role");
            window.location.href = "login.html";
        } else {
            alert(data.message || "No se pudo eliminar la cuenta");
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Error de conexión con el servidor");
    }
});