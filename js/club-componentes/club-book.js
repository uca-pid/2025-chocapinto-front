let categoriasDisponibles = [];

// ========== VERIFICACIÓN DE ROLES ==========

/**
 * Verifica el rol del usuario actual en el club
 * @returns {Promise<{canManageCategories: boolean, role: string}>}
 */
async function verificarRolUsuario() {
    try {
        const clubId = getClubId();
        const userId = localStorage.getItem("userId");
        
        if (!clubId || !userId) {
            return { canManageCategories: false, role: 'LECTOR' };
        }

        const response = await fetch(`${API_URL}/club/${clubId}`);
        const data = await response.json();
        
        if (data.success && data.club && data.club.members) {
            const userMember = data.club.members.find(member => member.id == userId);
            
            if (userMember) {
                const role = userMember.role || 'LECTOR';
                const canManageCategories = role === 'OWNER' || role === 'MODERADOR';
                
                console.log(`👤 Usuario actual: Rol=${role}, PuedeGestionarCategorías=${canManageCategories}`);
                
                return { canManageCategories, role };
            }
        }
        
        // Si no se encuentra el usuario en los miembros, verificar si es owner por id_owner
        if (data.success && data.club && data.club.id_owner == userId) {
            return { canManageCategories: true, role: 'OWNER' };
        }
        
        return { canManageCategories: false, role: 'LECTOR' };
        
    } catch (error) {
        console.error('Error al verificar rol de usuario:', error);
        return { canManageCategories: false, role: 'LECTOR' };
    }
}

/**
 * Configura la visibilidad de elementos según el rol del usuario
 */
async function configurarPermisosCategorias() {
    const userRole = await verificarRolUsuario();
    
    // Aplicar clase CSS al body para estilos específicos del rol
    document.body.classList.remove('role-owner', 'role-moderador', 'role-lector');
    document.body.classList.add(`role-${userRole.role.toLowerCase()}`);
    
    // Elementos relacionados con gestión de categorías
    const crearCategoriaBox = document.getElementById('crearCategoriaBox');
    const modal = document.getElementById('modalLibro');
    
    // Configurar visibilidad de controles de gestión
    if (crearCategoriaBox) {
        if (userRole.canManageCategories) {
            crearCategoriaBox.style.display = 'block';
            console.log(`✅ ${userRole.role}: Puede gestionar categorías`);
        } else {
            crearCategoriaBox.style.display = 'none';
            console.log(`❌ ${userRole.role}: No puede gestionar categorías`);
        }
    }
    
    // Agregar indicador de rol para usuarios
    const roleIndicator = modal?.querySelector('.role-indicator');
    if (roleIndicator) {
        roleIndicator.remove();
    }
    
    if (modal && !modal.querySelector('.role-indicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'role-indicator';
        indicator.style.cssText = `
            position: absolute;
            top: 15px;
            right: 50px;
            background: ${getRoleColor(userRole.role)};
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            z-index: 10;
        `;
        indicator.textContent = getRoleDisplayName(userRole.role);
        modal.appendChild(indicator);
    }
    
    // Agregar aviso explicativo para usuarios sin permisos
    if (!userRole.canManageCategories) {
        const categoriasContainer = document.getElementById('categoriasContainer');
        if (categoriasContainer && !categoriasContainer.querySelector('.permission-notice')) {
            const notice = document.createElement('div');
            notice.className = 'permission-notice';
            notice.innerHTML = `
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                </svg>
                Solo moderadores y owners pueden crear nuevas categorías
            `;
            categoriasContainer.insertBefore(notice, categoriasContainer.firstChild);
        }
    } else {
        // Remover aviso si el usuario tiene permisos
        const existingNotice = document.querySelector('.permission-notice');
        if (existingNotice) {
            existingNotice.remove();
        }
    }
    
    return userRole;
}

/**
 * Obtiene el color del rol para el indicador
 */
function getRoleColor(role) {
    const colors = {
        'OWNER': '#e74c3c',     // Rojo
        'MODERADOR': '#f39c12', // Naranja
        'LECTOR': '#3498db'     // Azul
    };
    return colors[role] || '#95a5a6';
}

/**
 * Obtiene el nombre de visualización del rol
 */
function getRoleDisplayName(role) {
    const names = {
        'OWNER': '👑 Owner',
        'MODERADOR': '⭐ Moderador',
        'LECTOR': '📖 Lector'
    };
    return names[role] || role;
}

function setupModalLibro() {
    const agregarLibroBtn = document.querySelector('.primary-action-btn');
    if (agregarLibroBtn && !agregarLibroBtn.hasAttribute('data-listener-added')) {
        // Marcar que ya se agregó el listener para evitar duplicados
        agregarLibroBtn.setAttribute('data-listener-added', 'true');
        
        agregarLibroBtn.addEventListener('click', async () => {
            console.log("📖 Abriendo modal de agregar libro");
            document.getElementById('modalLibro').style.display = 'block';
            
            // Cargar categorías y configurar permisos
            await cargarCategorias();
            await configurarPermisosCategorias();
        });
        console.log("✅ Event listener agregado al botón de agregar libro");
    } else if (!agregarLibroBtn) {
        console.log("⚠️ No se encontró el botón de agregar libro (.primary-action-btn)");
    }
}

async function mostrarModalAgregarLibro() {
    console.log("📖 Mostrando modal agregar libro");
    const modal = document.getElementById('modalLibro');
    
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '1000';
        
        // Cargar categorías y configurar permisos basado en el rol
        await cargarCategorias();
        await configurarPermisosCategorias();
        
        console.log("✅ Modal de agregar libro configurado según permisos del usuario");
    } else {
        console.error("❌ No se encontró el modal de agregar libro");
    }
}

async function cargarCategorias() {
    try {
        const res = await fetch(`${API_URL}/categorias`);
        const data = await res.json();
        if (data.success && Array.isArray(data.categorias)) {
            categoriasDisponibles = data.categorias;
            renderCategoriasCheckboxes();
        }
    } catch (error) {
        categoriasContainer.innerHTML = '<span style="color:#d63031;">Error al cargar categorías</span>';
    }
}

function esCategoriasPredeterminada(nombreCategoria) {
    const categoriasPredeterminadas = [
        'Ficción',
        'No Ficción', 
        'Ciencia Ficción',
        'Fantasía',
        'Ensayo',
    ];
    return categoriasPredeterminadas.includes(nombreCategoria);
}

function renderCategoriasCheckboxes() {
  categoriasContainer.innerHTML = '';
  if (categoriasDisponibles.length === 0) {
    categoriasContainer.innerHTML = '<span style="color:#636e72;">No hay categorías aún.</span>';
    return;
  }

  const userId = localStorage.getItem("userId");
  const clubId = getClubId();

  // Verificar permisos del usuario basado en ClubMember
  verificarRolUsuario().then(userRole => {
    const canManageCategories = userRole.canManageCategories;
    
    categoriasDisponibles.forEach(cat => {
      const label = document.createElement('label');
      label.style.marginRight = '12px';
      label.style.fontWeight = '500';
      label.style.color = '#2c5a91';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = cat.id;
      checkbox.className = 'categoria-checkbox';

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + cat.nombre));

      // Si es OWNER o MODERADOR y la categoría NO es predeterminada, mostrar opciones de editar/eliminar
      if (canManageCategories && !esCategoriasPredeterminada(cat.nombre)) {
          const editBtn = document.createElement("span");
          editBtn.textContent = " ✏️";
          editBtn.style.cursor = "pointer";
          editBtn.title = `Editar categoría (${userRole.role})`;
          editBtn.onclick = () => editarCategoria(cat.id, cat.nombre);
          label.appendChild(editBtn);

          const deleteBtn = document.createElement("span");
          deleteBtn.textContent = " 🗑️";
          deleteBtn.style.cursor = "pointer";
          deleteBtn.title = `Eliminar categoría (${userRole.role})`;
          deleteBtn.onclick = () => eliminarCategoria(cat.id);
          label.appendChild(deleteBtn);
      }

      categoriasContainer.appendChild(label);
    });
  }).catch(error => {
    console.error('Error al verificar permisos para categorías:', error);
    // En caso de error, solo mostrar las categorías sin opciones de edición
    categoriasDisponibles.forEach(cat => {
      const label = document.createElement('label');
      label.style.marginRight = '12px';
      label.style.fontWeight = '500';
      label.style.color = '#2c5a91';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = cat.id;
      checkbox.className = 'categoria-checkbox';

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + cat.nombre));
      categoriasContainer.appendChild(label);
    });
  });
}

async function eliminarCategoria(categoriaId) {
  // Verificar permisos antes de eliminar
  const userRole = await verificarRolUsuario();
  
  if (!userRole.canManageCategories) {
    showNotification("error", "No tienes permisos para eliminar categorías");
    return;
  }

  confirmarEliminacion("esta categoría", () => {
    console.log(`🗑️ ${userRole.role} eliminando categoría ID: ${categoriaId}`);
    showLoader("Eliminando categoría...");
    
    fetch(`${API_URL}/categorias/${categoriaId}`, {
      method: "DELETE"
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // quitar de la lista en memoria y volver a renderizar
          categoriasDisponibles = categoriasDisponibles.filter(c => c.id !== categoriaId);
          renderCategoriasCheckboxes();
          hideLoader();
          showNotification("success", `Categoría eliminada por ${userRole.role}`);
        } else {
          hideLoader();
          showNotification("error", data.message || "Error al eliminar categoría");
        }
      })
      .catch(() => {
        hideLoader();
        showNotification("error", "Error de conexión al eliminar categoría");
      });
  });
}

async function editarCategoria(categoriaId, nombreActual) {
  // Verificar permisos antes de editar
  const userRole = await verificarRolUsuario();
  
  if (!userRole.canManageCategories) {
    showNotification("error", "No tienes permisos para editar categorías");
    return;
  }

  const nuevoNombre = prompt(`Editando categoría como ${userRole.role}.\nNuevo nombre:`, nombreActual);
  if (!nuevoNombre || nuevoNombre.trim() === "") return;

  console.log(`✏️ ${userRole.role} editando categoría ID: ${categoriaId} - Nuevo nombre: ${nuevoNombre.trim()}`);
  showLoader("Editando categoría...");
  
  fetch(`${API_URL}/categorias/${categoriaId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: nuevoNombre.trim() })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // actualizar lista en memoria y volver a renderizar
        const index = categoriasDisponibles.findIndex(c => c.id === categoriaId);
        if (index !== -1) {
          categoriasDisponibles[index].nombre = data.categoria.nombre;
        }
        renderCategoriasCheckboxes();
        hideLoader();
        showNotification("success", `Categoría editada por ${userRole.role}`);
      } else {
        hideLoader();
        showNotification("error", data.message || "Error al editar categoría");
      }
    })
    .catch(() => {
      hideLoader();
      showNotification("error", "Error de conexión al editar categoría");
    });
}

async function buscarLibrosGoogleBooksAPI(query) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!data.items) return [];
        const libros = data.items.map(item => ({
            title: item.volumeInfo.title || "Sin título",
            author: (item.volumeInfo.authors && item.volumeInfo.authors.join(", ")) || "Autor desconocido",
            thumbnail: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : ""
        }));
        return libros;
    } catch (error) {
        return [];
    }
}

agregarCategoriaBtn.addEventListener('click', async () => {
    // ✋ Verificar permisos antes de crear categoría
    const userRole = await verificarRolUsuario();
    if (!userRole.canManageCategories) {
        showNotification("error", "❌ Solo moderadores y owners pueden crear categorías");
        return;
    }
    
    const nombre = nuevaCategoriaInput.value.trim();
    if (!nombre) {
        showNotification("warning", "⚠️ Ingresa un nombre para la categoría");
        return;
    }
    
    // Evitar duplicados
    if (categoriasDisponibles.some(cat => cat.nombre.toLowerCase() === nombre.toLowerCase())) {
        showNotification("warning", "⚠️ La categoría ya existe");
        return;
    }
    
    showLoader("Creando categoría...");
    try {
        const res = await fetch(`${API_URL}/categorias`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre })
        });
        const data = await res.json();
        if (data.success && data.categoria) {
            categoriasDisponibles.push(data.categoria);
            // ✅ Actualización dinámica sin recargar toda la página
            await actualizarCategoriasEnModal(data.categoria);
            await actualizarCategoriasEnDashboard();
            nuevaCategoriaInput.value = '';
            hideLoader();
            showNotification("success", `Categoría "${data.categoria.nombre}" creada por ${userRole.role}`);
        } else {
            hideLoader();
            showNotification("error", "Error al crear categoría");
        }
    } catch (error) {
        hideLoader();
        showNotification("error", "Error al crear categoría");
    }
});

buscadorLibro.addEventListener("input", async function () {
    const query = buscadorLibro.value.trim();
    resultadosBusquedaLibro.innerHTML = "";
    if (query.length < 2) return;
    const libros = await buscarLibrosGoogleBooksAPI(query);
    if (libros.length === 0) {
        resultadosBusquedaLibro.innerHTML = "<div style='padding:0.5rem;color:#636e72;'>No se encontraron libros.</div>";
        return;
    }
    libros.forEach(libro => {
        const div = document.createElement("div");
        div.className = "busqueda-libro-item";
        div.innerHTML = `<div style='display:flex;align-items:center;gap:10px;'>${libro.thumbnail ? `<img src='${libro.thumbnail}' style='width:40px;height:auto;border-radius:4px;'>` : ""}<div><strong>${libro.title}</strong> <span style='color:#636e72;font-size:0.95em;'>${libro.author}</span></div></div>`;
        div.style.cursor = "pointer";
        div.style.marginBottom = "12px";
        div.style.borderRadius = "14px";
        div.style.border = "2px solid #5fa8e9";
        div.style.background = "#eaf6ff";
        div.style.padding = "10px 14px";
        console.log(libro);
        div.onclick = () => {
            // Restablecer el estilo de todos los elementos
            document.querySelectorAll(".busqueda-libro-item").forEach(item => {
                item.style.background = "#eaf6ff";
                item.style.border = "2px solid #5fa8e9";
            });

            // Resaltar el libro seleccionado
            div.style.background = "#d1e7ff";
            div.style.border = "2px solid #0984e3";

            // Mostrar datos del libro seleccionado en la consola
            console.log("Libro seleccionado:", libro);

            // Actualizar los valores del formulario
            tituloLibro.value = libro.title;
            autorLibro.value = libro.author;
            portadaLibro.value = libro.thumbnail || "";
            buscadorLibro.value = libro.title;
            resultadosBusquedaLibro.innerHTML = `<div style='color:#0984e3;padding:0.5rem;display:flex;align-items:center;gap:10px;margin-bottom:0.5rem;border:2px solid #0984e3;border-radius:8px;background:#eaf6ff;'>${libro.thumbnail ? `<img src='${libro.thumbnail}' style='width:40px;height:auto;border-radius:4px;margin-bottom:0.5rem;'>` : ""}Libro seleccionado: <strong>${libro.title}</strong></div>`;
        };
        resultadosBusquedaLibro.appendChild(div);
    });
});

document.getElementById("formLibro").addEventListener("submit", async function(e) {
    e.preventDefault();
    const title = tituloLibro.value;
    const author = autorLibro.value;
    const thumbnail = portadaLibro.value;
    const id_api = document.getElementById("idApiLibro").value;
    const clubId = getClubId();
    const username = localStorage.getItem("username");
    const msg = document.getElementById("msgLibro");
    msg.textContent = "";
    msg.style.display = "none";
    if (!title) {
        msg.textContent = "Seleccioná un libro de la búsqueda";
        msg.style.background = "#ffeaea";
        msg.style.color = "#d63031";
        msg.style.display = "block";
        return;
    }
    // Obtener categorías seleccionadas
    const categoriasSeleccionadas = Array.from(document.querySelectorAll('.categoria-checkbox:checked')).map(cb => cb.value);
    if (categoriasSeleccionadas.length === 0) {
        msg.textContent = "Seleccioná al menos una categoría";
        msg.style.background = "#ffeaea";
        msg.style.color = "#d63031";
        msg.style.display = "block";
        return;
    }
    showLoader("Agregando libro al club...");
    try {
        const res = await fetch(`${API_URL}/club/${clubId}/addBook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, author, thumbnail, id_api, username, categorias: categoriasSeleccionadas })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            hideLoader();
            msg.textContent = "Libro agregado con éxito";
            msg.style.background = "#eaf6ff";
            msg.style.color = "#0984e3";
            msg.style.display = "block";
            setTimeout(() => { document.getElementById('modalLibro').style.display='none'; renderClub(); }, 1200);
        } else {
            hideLoader();
            msg.textContent = data.message || "Error al agregar libro";
            msg.style.background = "#ffeaea";
            msg.style.color = "#d63031";
            msg.style.display = "block";
        }
    } catch (error) {
        hideLoader();
        msg.textContent = "Error de conexión con el servidor";
        msg.style.background = "#ffeaea";
        msg.style.color = "#d63031";
        msg.style.display = "block";
    }
});

// ========== INICIALIZACIÓN ==========
function initBookModal() {
    console.log('📖 Inicializando modal de libros...');
    
    // Configurar modal de libros
    setupModalLibro();
    
    // Exponer funciones globalmente
    window.setupModalLibro = setupModalLibro;
    window.mostrarModalAgregarLibro = mostrarModalAgregarLibro;
    window.cargarCategorias = cargarCategorias;
    window.buscarLibrosGoogleBooksAPI = buscarLibrosGoogleBooksAPI;
    window.actualizarCategoriasEnModal = actualizarCategoriasEnModal;
    window.actualizarCategoriasEnDashboard = actualizarCategoriasEnDashboard;
    window.verificarRolUsuario = verificarRolUsuario;
    window.configurarPermisosCategorias = configurarPermisosCategorias;
    window.getRoleColor = getRoleColor;
    window.getRoleDisplayName = getRoleDisplayName;
    
    console.log('✅ Modal de libros inicializado correctamente');
}

// ========== FUNCIONES PARA ACTUALIZACIÓN DINÁMICA DE CATEGORÍAS ==========

/**
 * Actualiza las categorías en el modal sin recargar la página
 */
async function actualizarCategoriasEnModal(nuevaCategoria) {
    try {
        const container = document.getElementById("categoriasContainer");
        if (!container) {
            console.warn('Container de categorías no encontrado');
            return;
        }
        
        // Crear el nuevo checkbox dinámicamente
        const checkbox = document.createElement("label");
        checkbox.className = "categoria-checkbox categoria-nueva";
        checkbox.setAttribute("data-categoria-id", nuevaCategoria.id);
        
        // Generar color aleatorio para la nueva categoría
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#FFB347'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        checkbox.innerHTML = `
            <input type="checkbox" name="categorias[]" value="${nuevaCategoria.id}">
            <span class="checkmark" style="background: ${randomColor}22; border-color: ${randomColor}; color: ${randomColor};">
                ${nuevaCategoria.nombre}
            </span>
        `;
        
        // Agregar con animación suave utilizando CSS
        container.appendChild(checkbox);
        
        // Remover la clase de animación después de que termine
        setTimeout(() => {
            checkbox.classList.remove('categoria-nueva');
        }, 300);
        
        console.log(`✅ Categoría "${nuevaCategoria.nombre}" agregada dinámicamente al modal`);
        
    } catch (error) {
        console.error('Error al actualizar categorías en modal:', error);
    }
}

/**
 * Actualiza la sección de categorías del dashboard principal
 */
async function actualizarCategoriasEnDashboard() {
    try {
        // Simplemente llamar a la función de actualización de estadísticas existente
        if (typeof window.actualizarEstadisticas === 'function' && window.clubData) {
            window.actualizarEstadisticas(window.clubData);
            console.log('✅ Estadísticas del dashboard actualizadas dinámicamente');
        }
        
        // Si existe algún widget de categorías específico, actualizarlo también
        if (typeof window.actualizarWidgetCategorias === 'function') {
            window.actualizarWidgetCategorias();
        }
        
    } catch (error) {
        console.error('Error al actualizar categorías en dashboard:', error);
    }
}

// Exponer las funciones globalmente
window.actualizarCategoriasEnModal = actualizarCategoriasEnModal;
window.actualizarCategoriasEnDashboard = actualizarCategoriasEnDashboard;

// Exportar función de inicialización
window.initBookModal = initBookModal;

// Export for ES6 modules
export { 
    initBookModal, 
    actualizarCategoriasEnModal, 
    actualizarCategoriasEnDashboard, 
    verificarRolUsuario, 
    configurarPermisosCategorias 
};