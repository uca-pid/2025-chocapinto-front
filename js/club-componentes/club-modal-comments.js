// Modal Comments Initialization
function initCommentsModal() {
    
    
    // Use global modal reference
    const modalComentarios = window.modalComentarios;
    const closeModalComentarios = document.getElementById("closeModalComentarios");
    const comentariosList = document.getElementById("comentariosList");
    const nuevoComentario = document.getElementById("nuevoComentario");
    const enviarComentarioBtn = document.getElementById("enviarComentarioBtn");
    
    // Setup event listeners
    if (closeModalComentarios) {
        closeModalComentarios.onclick = () => { modalComentarios.style.display = "none"; };
    }
    
    // Expose necessary functions globally for HTML compatibility
    window.cargarComentarios = cargarComentarios;
    // Note: enviarComentario functionality is handled by document event listener
    // Note: currentBookId and modalComentarios are now global variables
}


closeModalComentarios.onclick = () => { modalComentarios.style.display = "none"; };

document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-comentarios") || e.target.closest(".btn-comentarios")) {
    const button = e.target.classList.contains("btn-comentarios") ? e.target : e.target.closest(".btn-comentarios");
    window.currentBookId = button.dataset.bookid;
    const clubId = getClubId();
    window.modalComentarios.style.display = "flex";
    
    await cargarComentarios(window.currentBookId, clubId);
  }
  
  if (e.target.classList.contains("delete-btn-modern") || e.target.closest(".delete-btn-modern")) {
    const button = e.target.classList.contains("delete-btn-modern") ? e.target : e.target.closest(".delete-btn-modern");
    const bookId = button.dataset.bookid;
    const clubId = getClubId();
    const username = localStorage.getItem("username");
    
    mostrarConfirmacion(
      "¿Eliminar este libro?",
      "El libro será removido del club y ya no aparecerá en la lista de libros leídos.",
      async () => {
        await eliminarLibro(bookId, clubId, username);
        renderClub();
      },
      null,
      {
        confirmText: "Eliminar Libro",
        cancelText: "Cancelar",
        confirmClass: "red-btn",
        cancelClass: "green-btn"
      }
    );
  }
});

async function cargarComentarios(bookId, clubId) {
  comentariosList.innerHTML = "<div style='color:#636e72;text-align:center;padding:20px;'>Cargando comentarios...</div>";
  const commentsCount = document.getElementById('comments-count');
  
  try {
    const res = await fetch(`${API_URL}/comentario/book/${bookId}/club/${clubId}`);
    const data = await res.json();

    if (data.success && Array.isArray(data.comentarios)) {
      // Actualizar contador de comentarios
      if (commentsCount) {
        commentsCount.textContent = data.comentarios.length;
      }
      
      if (data.comentarios.length === 0) {
        comentariosList.innerHTML = "<div style='color:#636e72;text-align:center;padding:20px;'>No hay comentarios aún.</div>";
      } else {
        comentariosList.innerHTML = "";

        const userId = Number(localStorage.getItem("userId"));
        const clubRes = await fetch(`${API_URL}/club/${clubId}`);
        const clubData = await clubRes.json();
        
        // Usar el nuevo sistema de permisos basado en ClubMember
        const userRole = getUserRoleInClub(clubData.club, userId);
        const canManageComments = canUserManageClub(clubData.club, userId); // Owner y Moderador pueden gestionar
        
        

        data.comentarios.forEach(c => {
          const commentItem = document.createElement("div");
          commentItem.className = "comment-item";
          
          // Obtener la primera letra del username para el avatar
          const avatarLetter = c.user.username ? c.user.username.charAt(0).toUpperCase() : 'U';
          
          commentItem.innerHTML = `
            <div class="user">
              <div class="user-pic">
                ${avatarLetter}
              </div>
              <div class="user-info">
                <span>${c.user.username}</span>
                <p>Hace un momento</p>
              </div>
            </div>
            <p class="comment-content">${c.content}</p>
          `;

          // Mostrar botón de eliminar si:
          // - Es owner o moderador del club (canManageComments)
          // - O es el dueño del comentario
          const isCommentOwner = c.userId === userId;
          const canDeleteComment = canManageComments || isCommentOwner;
          
          if (canDeleteComment) {
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-comment";
            deleteBtn.innerHTML = "❌";
            
            // Tooltip más específico según el tipo de permiso
            if (canManageComments && !isCommentOwner) {
              deleteBtn.title = `Eliminar comentario (${userRole.role})`;
            } else if (isCommentOwner) {
              deleteBtn.title = "Eliminar mi comentario";
            } else {
              deleteBtn.title = "Eliminar comentario";
            }
            
            deleteBtn.onclick = async () => {
              // Mensaje de confirmación más específico
              const confirmMessage = isCommentOwner 
                ? "¿Eliminar tu comentario?"
                : `¿Eliminar este comentario como ${userRole.role}?`;
              
              const confirmSubtext = isCommentOwner
                ? "Tu comentario será eliminado permanentemente."
                : "El comentario será eliminado permanentemente y no se podrá recuperar.";
              
              mostrarConfirmacion(
                confirmMessage,
                confirmSubtext,
                async () => {
                  
                  await eliminarComentario(c.id, bookId, clubId);
                },
                null,
                {
                  confirmText: "Eliminar",
                  cancelText: "Cancelar",
                  confirmClass: "red-btn",
                  cancelClass: "green-btn"
                }
              );
            };
            commentItem.appendChild(deleteBtn);
          }

          comentariosList.appendChild(commentItem);
        });
      }
    } else {
      comentariosList.innerHTML = "<div style='color:#d63031;text-align:center;padding:20px;'>Error al cargar comentarios</div>";
      if (commentsCount) commentsCount.textContent = '0';
    }
  } catch {
    comentariosList.innerHTML = "<div style='color:#d63031;text-align:center;padding:20px;'>Error de conexión</div>";
    if (commentsCount) commentsCount.textContent = '0';
  }
}

async function eliminarComentario(comentarioId, bookId, clubId) {
  showLoader("Eliminando comentario...");
  try {
    const res = await fetch(`${API_URL}/comentario/${comentarioId}`, {
      method: "DELETE"
    });
    const data = await res.json();
    if (data.success) {
      await cargarComentarios(bookId, clubId);
      hideLoader();
      showNotification("success", "Comentario eliminado");
    } else {
      hideLoader();
      showNotification("error", data.message || "No se pudo eliminar el comentario");
    }
  } catch {
    hideLoader();
    showNotification("error", "Error de conexión al eliminar comentario");
  }
}

document.addEventListener('click', async (e) => {
  if (e.target.id === 'enviarComentarioBtn' || e.target.closest('#enviarComentarioBtn')) {
    e.preventDefault();
    const texto = nuevoComentario.value.trim();
    if (!texto) return;
    showLoader("Enviando comentario...");
    try {
      const userId = localStorage.getItem("userId");
      const clubId = getClubId();
      const res = await fetch(`${API_URL}/comentario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, bookId: window.currentBookId, clubId, content: texto })
      });
      const data = await res.json();
      if (data.success) {
        nuevoComentario.value = "";
        await cargarComentarios(window.currentBookId, clubId);
        hideLoader();
        showNotification("success", "Comentario enviado");
      } else {
        hideLoader();
        showNotification("error", data.message || "No se pudo enviar el comentario");
      }
    } catch {
      hideLoader();
      showNotification("error", "Error de conexión");
    }
  }
});

// Export for ES6 modules
export { initCommentsModal };