class ConfirmacionComponent {
    constructor() {
        this.currentModal = null;
    }

    show(titulo, mensaje = "¿Estás seguro que querés continuar?", onConfirm, onCancel = null, options = {}) {
        if (this.currentModal) {
            this.hide();
        }

        const {
            confirmText = "Aceptar",
            cancelText = "Cancelar",
            confirmClass = "green-btn",
            cancelClass = "red-btn"
        } = options;

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

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.currentModal = document.getElementById('confirmacion-modal');

        const cancelBtn = document.getElementById('confirm-cancel-btn');
        const acceptBtn = document.getElementById('confirm-accept-btn');

        const handleCancel = () => {
            this.hide();
            if (onCancel) onCancel();
        };

        const handleConfirm = () => {
            this.hide();
            if (onConfirm) onConfirm();
        };

        cancelBtn.addEventListener('click', handleCancel);
        acceptBtn.addEventListener('click', handleConfirm);

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        this.currentModal.addEventListener('click', (e) => {
            if (e.target === this.currentModal) {
                handleCancel();
            }
        });

        return this;
    }

    hide() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
        }
    }

    isOpen() {
        return this.currentModal !== null;
    }
}

const confirmacionComponent = new ConfirmacionComponent();

export function mostrarConfirmacion(titulo, mensaje, onConfirm, onCancel = null, options = {}) {
    return confirmacionComponent.show(titulo, mensaje, onConfirm, onCancel, options);
}

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

export function confirmarAccion(accion, onConfirm) {
    return mostrarConfirmacion(
        `¿Querés ${accion}?`,
        "Confirmá esta acción para continuar.",
        onConfirm
    );
}

export { ConfirmacionComponent };

window.mostrarConfirmacion = mostrarConfirmacion;
window.confirmarEliminacion = confirmarEliminacion;
window.confirmarAccion = confirmarAccion;
