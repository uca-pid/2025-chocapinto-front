// exploracion.js

import { API_URL } from "./env.js"; 
// Importamos las funciones necesarias desde principal.js
import { crearTarjetaCrearClub, crearTarjetaClub, configurarEventosClub } from "./principal.js";
import { showLoader, hideLoader } from "../componentes/loader.js";


// Inicialización de la página de exploración
document.addEventListener("DOMContentLoaded", () => {
    cargarClubesExploracion();
});
/**
 * Carga y muestra todos los clubes en la grilla de exploración (sin limitación)
 */
async function cargarClubesExploracion() {
    const username = localStorage.getItem("username");
    const clubesGrid = document.getElementById("clubesGridExploracion");

    if (!clubesGrid) return;

    clubesGrid.innerHTML = "";
    
    // Insertamos la tarjeta de "Crear club" primero
    const crearClubCard = crearTarjetaCrearClub();
    clubesGrid.appendChild(crearClubCard);
    
    try {
        showLoader("Cargando clubes...");
        const res = await fetch(`${API_URL}/clubs`);
        const data = await res.json();
        
        hideLoader();

        if (!data.success) {
            clubesGrid.innerHTML += '<p style="margin-top:20px; color:#d63031;">Error al cargar la lista de clubes.</p>';
            return;
        }

        data.clubs.forEach(club => {
            const esMiembro = club.members.some(m => m.username === username);
            const esCreador = club.ownerUsername === username;
            const img = club.imagen || '../images/BooksyLogo.png';
            
            // 1. Creamos la tarjeta
            const clubCard = crearTarjetaClub(club, esMiembro, esCreador, img);

            clubCard.addEventListener("click", (e) => {
                if (
                    e.target.classList.contains("unirme-btn") ||
                    e.target.classList.contains("editar-btn")
                ) return;

                window.location.href = `club_lectura.html?clubId=${club.id}`;
            });

            // 2. Agregamos a la grilla
            clubesGrid.appendChild(clubCard);

            // 3. Configuramos los botones
            configurarEventosClub(clubCard, club, esMiembro, esCreador, username);

        });
        
    } catch (error) {
        console.error("Error al cargar clubes en Exploración:", error);
        hideLoader();
    }
}


