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
        
        // Inyectar estilos CSS mejorados para avatares
        if (!document.getElementById('comment-avatar-styles')) {
          const style = document.createElement('style');
          style.id = 'comment-avatar-styles';
          style.textContent = `
            .comment-item {
              display: flex !important;
              align-items: flex-start !important;
              padding: 16px !important;
              margin-bottom: 12px !important;
              background: #f8f9fa !important;
              border-radius: 12px !important;
              border: 1px solid #e9ecef !important;
              position: relative !important;
              transition: all 0.2s ease !important;
            }
            
            .comment-item:hover {
              background: #f1f3f4 !important;
              transform: translateY(-1px) !important;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
            }
            
            .user {
              display: flex !important;
              align-items: center !important;
              margin-bottom: 8px !important;
              width: 100% !important;
            }
            
            .user-pic {
              position: relative !important;
              width: 44px !important;
              height: 44px !important;
              border-radius: 50% !important;
              overflow: hidden !important;
              margin-right: 12px !important;
              flex-shrink: 0 !important;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
              border: 2px solid #ffffff !important;
            }
            
            .user-pic img {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              border-radius: 50% !important;
              transition: transform 0.2s ease !important;
            }
            
            .user-pic:hover img {
              transform: scale(1.05) !important;
            }
            
            .user-pic .avatar-initials {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: 100% !important;
              border-radius: 50% !important;
              background: linear-gradient(135deg, #0984e3 0%, #74b9ff 100%) !important;
              color: white !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              font-weight: 600 !important;
              font-size: 18px !important;
              text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
            }
            
            .user-info {
              flex: 1 !important;
              display: flex !important;
              flex-direction: column !important;
            }
            
            .user-info span {
              font-weight: 600 !important;
              color: #2c3e50 !important;
              font-size: 14px !important;
              margin-bottom: 2px !important;
            }
            
            .user-info p {
              margin: 0 !important;
              color: #7f8c8d !important;
              font-size: 12px !important;
            }
            
            .comment-content {
              margin: 8px 0 0 56px !important;
              color: #34495e !important;
              font-size: 14px !important;
              line-height: 1.5 !important;
              word-wrap: break-word !important;
            }
            
            .delete-comment {
              position: absolute !important;
              top: 12px !important;
              right: 12px !important;
              background: none !important;
              border: none !important;
              font-size: 14px !important;
              cursor: pointer !important;
              opacity: 0.6 !important;
              transition: all 0.2s ease !important;
              padding: 4px !important;
              border-radius: 4px !important;
            }
            
            .delete-comment:hover {
              opacity: 1 !important;
              background: #fee !important;
              transform: scale(1.1) !important;
            }
          `;
          document.head.appendChild(style);
        }

        data.comentarios.forEach(c => {
          const commentItem = document.createElement("div");
          commentItem.className = "comment-item";
          
          // Obtener la primera letra del username para el avatar fallback
          const avatarLetter = c.user.username ? c.user.username.charAt(0).toUpperCase() : 'U';
          
          // Verificar si el usuario tiene avatar
          const hasAvatar = c.user.avatar && c.user.avatar.trim() !== '';
          console.log("tiene avatar:", hasAvatar);

          // Crear HTML del avatar con fallback a iniciales
          const avatarHTML = hasAvatar 
            ? `<img src="${c.user.avatar}" alt="Avatar de ${c.user.username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <div class="avatar-initials-comm" style="display:none;">R</div>`
            : `<div class="avatar-initials-comm">R</div>`;

          commentItem.innerHTML = `
            <div class="user">
              <div class="user-pic">
                ${avatarHTML}
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