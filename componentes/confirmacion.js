/**
 * Componente de Confirmación Reutilizable
 * Muestra un modal de confirmación con botones de Cancelar y Aceptar
 */

class ConfirmacionComponent {
    constructor() {
        this.currentModal = null;
    }

    /**
     * Muestra un modal de confirmación
     * @param {string} titulo - Título principal en negrita
     * @param {string} mensaje - Mensaje descriptivo opcional
     * @param {function} onConfirm - Callback cuando se confirma
     * @param {function} onCancel - Callback cuando se cancela (opcional)
     * @param {object} options - Opciones adicionales
     */
    show(titulo, mensaje = "¿Estás seguro que querés continuar?", onConfirm, onCancel = null, options = {}) {
        // Si ya hay un modal abierto, lo cerramos
        if (this.currentModal) {
            this.hide();
        }

        const {
            confirmText = "Aceptar",
            cancelText = "Cancelar",
            confirmClass = "green-btn",
            cancelClass = "red-btn"
        } = options;

        // Crear el modal
        const modalHTML = `
            <div class="warning-general" id="confirmacion-modal">
                <div class="confirm-div">
                    <p>
                        <strong>${titulo}</strong>
                        <span>${mensaje}</span>
                    </p>
                    <div class="modals-container">
                        <button class="${cancelClass}" id="confirm-cancel-btn">${cancelText}</button>
                        <button class="${confirmClass}" id="confirm-accept-btn">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;

        // Agregar al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.currentModal = document.getElementById('confirmacion-modal');

        // Event listeners
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        const acceptBtn = document.getElementById('confirm-accept-btn');

        // Manejar cancelar
        const handleCancel = () => {
            this.hide();
            if (onCancel) onCancel();
        };

        // Manejar confirmar
        const handleConfirm = () => {
            this.hide();
            if (onConfirm) onConfirm();
        };

        // Asignar eventos
        cancelBtn.addEventListener('click', handleCancel);
        acceptBtn.addEventListener('click', handleConfirm);

        // Cerrar con escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Cerrar haciendo click fuera del modal
        this.currentModal.addEventListener('click', (e) => {
            if (e.target === this.currentModal) {
                handleCancel();
            }
        });

        return this;
    }

    /**
     * Oculta el modal actual
     */
    hide() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
        }
    }

    /**
     * Verifica si hay un modal abierto
     */
    isOpen() {
        return this.currentModal !== null;
    }
}

// Instancia global del componente
const confirmacionComponent = new ConfirmacionComponent();

/**
 * Función helper para mostrar confirmación rápidamente
 * @param {string} titulo - Título principal
 * @param {string} mensaje - Mensaje descriptivo
 * @param {function} onConfirm - Callback de confirmación
 * @param {function} onCancel - Callback de cancelación (opcional)
 * @param {object} options - Opciones adicionales
 */
export function mostrarConfirmacion(titulo, mensaje, onConfirm, onCancel = null, options = {}) {
    return confirmacionComponent.show(titulo, mensaje, onConfirm, onCancel, options);
}

/**
 * Función helper para confirmación de eliminación
 * @param {string} elemento - Nombre del elemento a eliminar
 * @param {function} onConfirm - Callback de confirmación
 */
export function confirmarEliminacion(elemento, onConfirm) {
    return mostrarConfirmacion(
        `El elemento "${elemento}" será eliminado.`,
        "Esta acción no se puede deshacer. ¿Querés continuar?",
        onConfirm,
        null,
        {
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            confirmClass: "red-btn",
            cancelClass: "green-btn"
        }
    );
}

/**
 * Función helper para confirmación genérica
 * @param {string} accion - Acción a realizar
 * @param {function} onConfirm - Callback de confirmación
 */
export function confirmarAccion(accion, onConfirm) {
    return mostrarConfirmacion(
        `¿Querés ${accion}?`,
        "Confirmá esta acción para continuar.",
        onConfirm
    );
}

// Exportar también la clase para uso avanzado
export { ConfirmacionComponent };

// Funciones globales para compatibilidad
window.mostrarConfirmacion = mostrarConfirmacion;
window.confirmarEliminacion = confirmarEliminacion;
window.confirmarAccion = confirmarAccion;
