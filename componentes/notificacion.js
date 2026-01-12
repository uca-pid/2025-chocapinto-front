function showNotification(type, message) {
    let container = document.getElementById("notifications");
    
    // Crear el contenedor si no existe
    if (!container) {
        container = document.createElement("div");
        container.id = "notifications";
        document.body.appendChild(container);
    }

    // Crear el elemento
    const notif = document.createElement("div");
    notif.className = `notification-item ${type}`;
    notif.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <!-- icono check -->
                <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>
                </svg>
            </div>
            <div class="notification-text">${message}</div>
        </div>
        <div class="notification-icon notification-close">&times;</div>
        <div class="notification-progress-bar"></div>
    `;

    // Cerrar al clickear ❌
    notif.querySelector(".notification-close").addEventListener("click", () => {
        notif.remove();
    });

    // Auto cerrar después de 3s
    setTimeout(() => {
        notif.remove();
    }, 3000);

    container.appendChild(notif);
}

// Exponer la función al ámbito global
window.showNotification = showNotification;

// También para ES6 modules
export { showNotification };