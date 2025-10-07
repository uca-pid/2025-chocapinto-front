/**
 * Archivo principal para la página main.html
 * Maneja la carga de clubes, libros recomendados y funcionalidades de búsqueda
 */

import { API_URL } from "./env.js";
import { showNotification } from "../componentes/notificacion.js";
import { showLoader, hideLoader } from "../componentes/loader.js";

// ========== FUNCIONES DE UTILIDAD ==========

/**
 * Cierra sesión del usuario
 */
function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    window.location.href = "index.html";
}

// Exponer funciones al ámbito global
window.logout = logout;

// ========== FUNCIONES DE CARGA DE DATOS ==========

/**
 * Carga y muestra todos los clubes disponibles
 */
async function cargarClubes() {
    const username = localStorage.getItem("username");
    const misClubesGrid = document.querySelector(".mis-clubes-grid");
    const clubesGrid = document.getElementById("clubesGrid");

    // Limpiar contenido previo
    misClubesGrid.innerHTML = "";
    clubesGrid.innerHTML = "";

    try {
        showLoader();
        const res = await fetch(`${API_URL}/clubs`);
        const data = await res.json();
        
        setTimeout(() => {
            hideLoader();
        }, 1000);

        if (!data.success) return;

        data.clubs.forEach(club => {
            const esMiembro = club.members.some(m => m.username === username);
            const esCreador = club.ownerUsername === username;
            const img = club.imagen || '../images/BooksyLogo.png';
            
            const clubCard = crearTarjetaClub(club, esMiembro, esCreador, img);
            
            // Agregar a la grilla correspondiente
            if (esMiembro) {
                misClubesGrid.appendChild(clubCard);
                // Añadir navegación al hacer click en la tarjeta
                clubCard.addEventListener("click", (e) => {
                    if (!e.target.classList.contains("editar-btn")) {
                        window.location.href = `club_lectura.html?clubId=${club.id}`;
                    }
                });
            } else {
                clubesGrid.appendChild(clubCard);
            }

            // Configurar eventos de botones
            configurarEventosClub(clubCard, club, esMiembro, esCreador, username);
        });
    } catch (error) {
        console.error("Error al cargar clubes:", error);
        hideLoader();
    }
}

/**
 * Crea una tarjeta HTML para mostrar un club
 */
function crearTarjetaClub(club, esMiembro, esCreador, img) {
    const clubCard = document.createElement("div");
    clubCard.className = "section-card club-card";
    
    clubCard.innerHTML = `
        <div class="club-logo club-logo-default" style="width:70px;height:70px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f5f6fa;border-radius:50%;margin:0 auto 10px auto;">
            <img src="${img}" alt="Logo del club" style="width:100%;height:100%;object-fit:contain;object-position:center;display:block;">
        </div>
        <h3>${club.name}</h3>
        <p>${club.description}</p>
        ${esMiembro ? '<span style="color:#0984e3;font-weight:700;">Ya eres miembro</span>' : '<button class="unirme-btn">Unirme</button>'}
        ${esCreador ? '<button class="editar-btn">Editar</button>' : ''}
    `;
    
    return clubCard;
}

/**
 * Configura los eventos de los botones de la tarjeta del club
 */
function configurarEventosClub(clubCard, club, esMiembro, esCreador, username) {
    // Configurar botón "Unirme"
    if (!esMiembro) {
        const unirmeBtn = clubCard.querySelector(".unirme-btn");
        if (unirmeBtn) {
            unirmeBtn.addEventListener("click", async (event) => {
                await manejarSolicitudIngreso(event, club.id, username);
            });
        }
    }

    // Configurar botón "Editar"
    if (esCreador) {
        const editarBtn = clubCard.querySelector(".editar-btn");
        if (editarBtn) {
            editarBtn.addEventListener("click", () => {
                window.location.href = `editar_club.html?clubId=${club.id}`;
            });
        }
    }
}

/**
 * Maneja la solicitud de ingreso a un club
 */
async function manejarSolicitudIngreso(event, clubId, username) {
    event.preventDefault();
    event.stopPropagation();
    
    try {
        const res = await fetch(`${API_URL}/clubSolicitud`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clubId, username })
        });
        const data = await res.json();
        
        if (data.success) {
            showNotification("success", "Solicitud enviada. Espera la aprobación del moderador.");
            
            // Cambiar estado del botón
            const btn = event.target;
            btn.textContent = "Solicitud enviada";
            btn.disabled = true;
            btn.style.background = "#636e72";
            btn.style.cursor = "not-allowed";
        } else {
            showNotification("error", data.message || "No se pudo enviar la solicitud.");
        }
    } catch (error) {
        console.error("Error al enviar solicitud:", error);
        showNotification("error", "Error al enviar la solicitud.");
    }
}

// ========== INICIALIZACIÓN Y CONFIGURACIÓN DE EVENTOS ==========

/**
 * Configura el dropdown del perfil de usuario
 */
function configurarDropdownPerfil() {
    const dropdownBtn = document.getElementById("profileDropdownBtn");
    const dropdownContent = document.getElementById("profileDropdownContent");
    
    if (dropdownBtn && dropdownContent) {
        dropdownBtn.addEventListener("mouseenter", () => {
            dropdownContent.style.display = "block";
        });
        
        dropdownBtn.addEventListener("mouseleave", () => {
            setTimeout(() => {
                if (!dropdownContent.matches(':hover')) {
                    dropdownContent.style.display = "none";
                }
            }, 100);
        });
        
        dropdownContent.addEventListener("mouseleave", () => {
            dropdownContent.style.display = "none";
        });
        
        dropdownContent.addEventListener("mouseenter", () => {
            dropdownContent.style.display = "block";
        });
    }
}

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
function inicializarAplicacion() {
    // Mostrar loader inmediatamente al inicializar
    showLoader("Cargando aplicación...");
    
    const username = localStorage.getItem("username");
    const usernameDisplay = document.getElementById("usernameDisplay");
    const usernameDisplayHover = document.getElementById("usernameDisplayHover");

    // Verificar autenticación
    if (username && usernameDisplay) {
        usernameDisplay.textContent = username;
        if (usernameDisplayHover) {
            usernameDisplayHover.textContent = username;
        }
    } else {
        hideLoader(); // Ocultar loader antes de redirigir
        window.location.href = "index.html";
        return;
    }

    // Cargar datos iniciales
    cargarClubes();
    cargarLibrosRecomendados();

    // Configurar funcionalidades
    configurarDropdownPerfil();
    configurarBusquedaTiempoReal();
    
    // El loader se ocultará automáticamente cuando cargarClubes termine
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", inicializarAplicacion);

// ========== FUNCIONES GLOBALES ==========
// Exponer funciones que necesitan ser accesibles desde HTML

window.buscarLibrosGoogleBooks = buscarLibrosGoogleBooks;

/**
 * Carga y muestra los libros recomendados con efecto 3D
 */
async function cargarLibrosRecomendados() {
    const grid = document.getElementById("recomendacionesGrid");
    grid.innerHTML = "";
    
    try {
        const res = await fetch(`${API_URL}/books`);
        const data = await res.json();
        
        if (!data.success || !data.books) {
            grid.innerHTML = '<p style="color:#636e72;">No hay libros recomendados.</p>';
            return;
        }
        
        data.books.forEach(libro => {
            const bookContainer = crearTarjetaLibro3D(libro);
            grid.appendChild(bookContainer);
        });
    } catch (error) {
        console.error("Error al cargar libros:", error);
        grid.innerHTML = '<p style="color:#d63031;">Error al cargar libros.</p>';
    }
}

/**
 * Crea una tarjeta 3D para mostrar un libro
 */
function crearTarjetaLibro3D(libro) {
    const bookContainer = document.createElement("div");
    bookContainer.className = "book";
    
    // Contenido interno del libro (se ve cuando se abre)
    const bookContent = document.createElement("div");
    bookContent.className = "book-content";
    bookContent.innerHTML = `
        <div class="book-title">${libro.title}</div>
        <div class="book-author">${libro.author ? libro.author : "Autor desconocido"}</div>
    `;
    
    // Portada del libro (se ve por defecto)
    const cover = document.createElement("div");
    cover.className = "cover";
    
    if (libro.portada) {
        cover.innerHTML = `
            <img src="${libro.portada}" alt="Portada de ${libro.title}">
            <div class="cover-text" style="position:absolute;bottom:10px;">Ver detalles</div>
        `;
    } else {
        cover.innerHTML = `
            <div class="default-cover">
                <img src="../images/BooksyLogo.png" alt="Logo" style="width:60px;height:60px;margin-bottom:10px;opacity:0.7;">
                <div class="cover-text">Ver detalles</div>
            </div>
        `;
    }
    
    bookContainer.appendChild(bookContent);
    bookContainer.appendChild(cover);
    
    return bookContainer;
}
// ========== FUNCIONES DE BÚSQUEDA DE LIBROS ==========

/**
 * Maneja el formulario de búsqueda de libros de Google Books
 */
async function buscarLibrosGoogleBooks(event) {
    event.preventDefault();
    const query = document.getElementById("busquedaLibro").value.trim();
    const resultadosDiv = document.getElementById("resultadosBusquedaLibros");
    
    // Limpiar resultados previos
    resultadosDiv.innerHTML = "";

    if (!query) return;

    const libros = await buscarLibrosGoogleBooksAPI(query);

    if (libros.length === 0) {
        resultadosDiv.innerHTML = "<p style='color:#636e72;'>No se encontraron libros.</p>";
        return;
    }

    libros.forEach(libro => {
        const card = crearTarjetaBusquedaLibro(libro);
        resultadosDiv.appendChild(card);
    });
}

/**
 * Realiza la búsqueda en la API de Google Books
 */
async function buscarLibrosGoogleBooksAPI(query) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.items) return [];
        
        return data.items.map(item => ({
            title: item.volumeInfo.title || "Sin título",
            author: (item.volumeInfo.authors && item.volumeInfo.authors.join(", ")) || "Autor desconocido",
            description: item.volumeInfo.description || "",
            thumbnail: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : ""
        }));
    } catch (error) {
        console.error("Error al buscar libros en Google Books:", error);
        return [];
    }
}

/**
 * Crea una tarjeta para mostrar un libro en los resultados de búsqueda
 */
function crearTarjetaBusquedaLibro(libro) {
    const card = document.createElement("div");
    card.className = "libro-busqueda-card";
    
    card.innerHTML = `
        <div style="display:flex;gap:12px;">
            ${libro.thumbnail ? `<img src="${libro.thumbnail}" alt="Portada" style="width:60px;height:auto;border-radius:4px;">` : ""}
            <div>
                <h4 style="margin:0 0 4px 0;">${libro.title}</h4>
                <p style="margin:0 0 4px 0;font-size:0.95em;color:#636e72;">${libro.author}</p>
                <p style="margin:0;font-size:0.9em;">${libro.description ? libro.description.substring(0, 120) + "..." : ""}</p>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Configura la búsqueda en tiempo real mientras el usuario escribe
 */
function configurarBusquedaTiempoReal() {
    const input = document.getElementById("busquedaLibro");
    const resultados = document.getElementById("resultadosBusquedaLibros");
    let lastQuery = "";

    input.addEventListener("input", async function () {
        const query = input.value.trim();
        resultados.innerHTML = "";
        
        if (query.length < 2) return;
        
        lastQuery = query;
        const libros = await buscarLibrosGoogleBooksAPI(query);
        
        // Si el usuario siguió escribiendo, no mostrar resultados viejos
        if (lastQuery !== input.value.trim()) return;
        
        if (libros.length === 0) {
            resultados.innerHTML = "<div style='padding:0.5rem;color:#636e72;'>No se encontraron libros.</div>";
            return;
        }
        
        libros.forEach(libro => {
            const div = document.createElement("div");
            div.className = "busqueda-libro-item";
            div.innerHTML = `<strong>${libro.title}</strong> <span style='color:#636e72;font-size:0.95em;'>${libro.author}</span>`;
            resultados.appendChild(div);
        });
    });
}

/**
 * Muestra libros en formato de tarjetas (función legacy - mantener por compatibilidad)
 */
function mostrarLibros(libros) {
    const librosList = document.getElementById('libros-list');
    if (!librosList) return;
    
    librosList.innerHTML = "";

    if (libros.length > 0) {
        libros.forEach(libro => {
            const card = crearTarjetaLibroLegacy(libro);
            librosList.appendChild(card);
        });
    } else {
        librosList.innerHTML = '<div style="color:#636e72;">No hay libros disponibles.</div>';
    }
}

/**
 * Crea tarjeta de libro (formato legacy)
 */
function crearTarjetaLibroLegacy(libro) {
    const card = document.createElement('div');
    card.className = 'libro-card';
    
    // Estilos de la tarjeta
    Object.assign(card.style, {
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        border: '1px solid #eaf6ff',
        width: '100%',
        maxWidth: '200px',
        minHeight: '300px',
        position: 'relative'
    });

    const categoriasHTML = libro.categorias ? 
        libro.categorias.map(cat => 
            `<span style="background:#eaf6ff;color:#2c5a91;padding:2px 6px;border-radius:8px;font-size:0.8rem;margin-right:4px;">${cat.nombre}</span>`
        ).join(" ") : "";

    card.innerHTML = `
        <div style='width:100%;display:flex;flex-direction:column;align-items:center;'>
            ${libro.portada ? 
                `<img src='${libro.portada}' style='width:100%;height:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0, 0, 0, 0.1);margin-bottom:1rem;'>` : 
                `<div style='width:100%;height:150px;background:#eaf6ff;border-radius:8px;margin-bottom:1rem;'></div>`
            }
            <div style='text-align:center;'>
                <strong style='color:#2c5a91;font-size:1.1rem;'>${libro.title}</strong>
                ${libro.author ? `<br><span style="color:#636e72;font-size:0.9rem;">de ${libro.author}</span>` : ''}
                <div style="margin-top:6px;">${categoriasHTML}</div>
            </div>
        </div>
    `;

    return card;
}
