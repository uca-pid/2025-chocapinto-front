// Variables para el gráfico
let graficoInstancia = null;

// Agregar estilos CSS para avatares en modales
const modalAvatarStyles = document.createElement('style');
modalAvatarStyles.textContent = `
/* Estilos para avatares en modales */
.ranking-avatar-container, .member-avatar-container, .request-avatar-container {
    position: relative;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.ranking-avatar-img, .member-avatar-img, .request-avatar-img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #eaf6ff;
}

.ranking-avatar-initials, .member-avatar-initials, .request-avatar-initials {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0984e3, #74b9ff);
    color: white;
    font-weight: 600;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #eaf6ff;
    text-transform: uppercase;
}

/* Backwards compatibility - hide old avatar classes */
.ranking-avatar, .member-avatar, .request-avatar {
    display: none !important;
}

/* Request date styling */
.request-date {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #666;
}

.request-date svg {
    opacity: 0.7;
}
`;

// Agregar estilos al head si no existen
if (!document.querySelector('#modal-avatar-styles')) {
    modalAvatarStyles.id = 'modal-avatar-styles';
    document.head.appendChild(modalAvatarStyles);
}

function initInfoModals() {
    configurarModalGrafico();
    
    window.configurarModalGrafico = configurarModalGrafico;
    window.generarGraficoGeneros = generarGraficoGeneros;
    window.mostrarListaRanking = mostrarListaRanking;
    window.mostrarListaMiembros = mostrarListaMiembros;
    window.eliminarMiembro = eliminarMiembro;
    window.mostrarSolicitudesModal = mostrarSolicitudesModal;
    window.mostrarSolicitudes = mostrarSolicitudesModal;
}

function configurarModalGrafico() {
    const chartBtn = document.getElementById('ver-grafico-btn');
    const modal = document.getElementById('modalGrafico');
    const closeBtn = document.getElementById('closeModalGrafico');
    const chartEstadoFilter = document.getElementById('chart-estado-filter');

    if (chartBtn) {
        chartBtn.addEventListener('click', () => {
            modal.classList.add('show');
            modal.style.display = 'flex';
            generarGraficoGeneros('todos');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    }

    if (chartEstadoFilter) {
        chartEstadoFilter.addEventListener('change', (e) => {
            generarGraficoGeneros(e.target.value);
        });
    }
}

function generarGraficoGeneros(estadoFiltro = 'todos') {
    if (!window.clubData) {
        return;
    }
    
    if (!window.clubData.readBooks) {
        return;
    }

    let todosLosLibros = window.clubData.readBooks;
    
    let librosFiltrados;
    if (estadoFiltro === 'todos') {
        librosFiltrados = todosLosLibros;
    } else {
        librosFiltrados = todosLosLibros.filter(book => {
            return book.estado === estadoFiltro;
        });
    }
    const conteoGeneros = {};
    
    librosFiltrados.forEach(book => {
        if (book.categorias && book.categorias.length > 0) {
            book.categorias.forEach(categoria => {
                const nombreCategoria = categoria.nombre || categoria.name || `Categoría ${categoria.id}`;
                conteoGeneros[nombreCategoria] = (conteoGeneros[nombreCategoria] || 0) + 1;
            });
        } else {
            conteoGeneros['Sin categoría'] = (conteoGeneros['Sin categoría'] || 0) + 1;
        }
    });

    // Preparar datos para el gráfico
    const labels = Object.keys(conteoGeneros);
    const data = Object.values(conteoGeneros);
    const total = data.reduce((sum, value) => sum + value, 0);

    const colores = [
        '#0ea5e9', '#06b6d4', '#3b82f6', '#1d4ed8', '#0284c7',
        '#0891b2', '#075985', '#38bdf8', '#67e8f9', '#7dd3fc'
    ];

    const canvas = document.getElementById('genreChart');
    if (!canvas) {
        return;
    }
    const ctx = canvas.getContext('2d');
    if (graficoInstancia) {
        graficoInstancia.destroy();
    }

    // Crear nuevo gráfico
    if (labels.length === 0) {
        const container = canvas.parentElement;
        container.innerHTML = `
            <div class="chart-no-data">
                <div class="no-data-icon">📊</div>
                <h4>No hay libros para mostrar</h4>
                <p>Selecciona un filtro diferente o agrega libros al club para ver la distribución por géneros.</p>
            </div>
        `;
        
        const leyenda = document.getElementById('chartLegend');
        if (leyenda) {
            leyenda.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📚</div>
                    <p>No hay datos para mostrar en la leyenda</p>
                </div>
            `;
        }
        return;
    }

    if (typeof Chart === 'undefined') {
        return;
    }
    
    const colores3D = [
        'rgba(14, 165, 233, 0.8)', 'rgba(56, 189, 248, 0.8)', 'rgba(125, 211, 252, 0.8)',
        'rgba(6, 182, 212, 0.8)', 'rgba(34, 197, 218, 0.8)', 'rgba(103, 232, 249, 0.8)',
        'rgba(59, 130, 246, 0.8)', 'rgba(147, 197, 253, 0.8)', 'rgba(191, 219, 254, 0.8)',
        'rgba(30, 58, 138, 0.8)'
    ];

    const coloresBorde = [
        'rgba(14, 165, 233, 1)', 'rgba(56, 189, 248, 1)', 'rgba(125, 211, 252, 1)',
        'rgba(6, 182, 212, 1)', 'rgba(34, 197, 218, 1)', 'rgba(103, 232, 249, 1)',
        'rgba(59, 130, 246, 1)', 'rgba(147, 197, 253, 1)', 'rgba(191, 219, 254, 1)',
        'rgba(30, 58, 138, 1)'
    ];
    
    graficoInstancia = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colores3D.slice(0, labels.length),
                borderColor: coloresBorde.slice(0, labels.length),
                borderWidth: 3,
                hoverBackgroundColor: coloresBorde.slice(0, labels.length),
                hoverBorderWidth: 5,
                hoverOffset: 15,
                cutout: '40%',
                borderRadius: 8,
                spacing: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.2,
            interaction: {
                intersect: false,
                mode: 'nearest'
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1500,
                easing: 'easeInOutQuart'
            },
            elements: {
                arc: {
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 6
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    align: 'center',
                    labels: {
                        boxWidth: 20,
                        boxHeight: 20,
                        padding: 15,
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        color: '#333',
                        usePointStyle: true,
                        pointStyle: 'circle',
                        generateLabels: function(chart) {
                            const data = chart.data;
                            return data.labels.map((label, index) => {
                                const value = data.datasets[0].data[index];
                                const percentage = ((value / total) * 100).toFixed(1);
                                return {
                                    text: `${label} (${percentage}%)`,
                                    fillStyle: data.datasets[0].backgroundColor[index],
                                    strokeStyle: data.datasets[0].borderColor[index],
                                    lineWidth: 2,
                                    index: index
                                };
                            });
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                    cornerRadius: 12,
                    displayColors: true,
                    boxPadding: 6,
                    padding: 12,
                    titleFont: {
                        size: 16,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 14
                    },
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const value = context.parsed;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return [
                                `📚 ${value} libro${value !== 1 ? 's' : ''}`,
                                `📊 ${percentage}% del total`,
                                `🎯 ${total} libros en total`
                            ];
                        }
                    }
                }
            },
            layout: {
                padding: {
                    top: 20,
                    bottom: 20,
                    left: 20,
                    right: 20
                }
            },
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            }
        }
    });

    actualizarLeyendaGrafico(labels, data, colores.slice(0, labels.length), total);
}

function actualizarLeyendaGrafico(labels, data, colores, total) {
    const leyenda = document.getElementById('chartLegend');
    if (!leyenda) return;

    leyenda.innerHTML = '';
    
    const datosOrdenados = labels.map((label, index) => ({
        label,
        cantidad: data[index],
        color: colores[index],
        porcentaje: ((data[index] / total) * 100).toFixed(1)
    })).sort((a, b) => b.cantidad - a.cantidad);
    
    datosOrdenados.forEach((item, index) => {
        const itemLeyenda = document.createElement('div');
        itemLeyenda.className = 'legend-item';
        itemLeyenda.style.setProperty('--legend-color', item.color);
        itemLeyenda.style.animationDelay = `${index * 0.1}s`;
        
        let emoji = '📖';
        const labelLower = item.label.toLowerCase();
        if (labelLower.includes('ficción') || labelLower.includes('novela')) emoji = '📚';
        else if (labelLower.includes('historia') || labelLower.includes('biografía')) emoji = '📜';
        else if (labelLower.includes('ciencia') || labelLower.includes('técnico')) emoji = '🔬';
        else if (labelLower.includes('arte') || labelLower.includes('cultura')) emoji = '🎨';
        else if (labelLower.includes('filosofía') || labelLower.includes('religión')) emoji = '🤔';
        else if (labelLower.includes('infantil') || labelLower.includes('juvenil')) emoji = '🧸';
        else if (labelLower.includes('misterio') || labelLower.includes('thriller')) emoji = '🔍';
        else if (labelLower.includes('romance') || labelLower.includes('amor')) emoji = '💕';
        else if (labelLower.includes('aventura') || labelLower.includes('acción')) emoji = '⚡';
        else if (labelLower.includes('fantasía') || labelLower.includes('magia')) emoji = '🧙‍♂️';
        
        itemLeyenda.innerHTML = `
            <div class="legend-color" style="background: linear-gradient(135deg, ${item.color}, ${item.color}dd);"></div>
            <div class="legend-info">
                <div class="legend-label">
                    ${emoji} ${item.label}
                    <span style="font-size: 12px; color: #666; font-weight: 400;">#${index + 1}</span>
                </div>
                <div class="legend-value">${item.cantidad} libro${item.cantidad !== 1 ? 's' : ''} • ${item.porcentaje}%</div>
            </div>
        `;
        
        itemLeyenda.addEventListener('mouseenter', () => {
            itemLeyenda.style.transform = 'translateX(12px) scale(1.02)';
            itemLeyenda.style.zIndex = '10';
        });
        
        itemLeyenda.addEventListener('mouseleave', () => {
            itemLeyenda.style.transform = 'translateX(0) scale(1)';
            itemLeyenda.style.zIndex = '1';
        });
        
        leyenda.appendChild(itemLeyenda);
    });
    
    const items = leyenda.querySelectorAll('.legend-item');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        setTimeout(() => {
            item.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

async function mostrarRanking() {
    const clubId = getClubId();
    const modal = document.getElementById('modalRanking');
    const loader = document.getElementById('rankingLoader');
    const lista = document.getElementById('rankingList');
    const empty = document.getElementById('rankingEmpty');

    modal.classList.add('show');
    modal.style.display = 'flex';
    loader.style.display = 'block';
    lista.style.display = 'none';
    empty.style.display = 'none';

    try {
        const [rankingResponse, clubActualizado] = await Promise.all([
            fetch(`${API_URL}/api/ranking/club/${clubId}/ranking`),
            cargarDatosActualizadosClub()
        ]);
        
        const rankingData = await rankingResponse.json();

        if (rankingData.success && rankingData.ranking && rankingData.ranking.length > 0) {
            const rankingConNiveles = rankingData.ranking.map(usuario => {
                const miembroActualizado = clubActualizado.members?.find(m => m.id === usuario.userId || m.username === usuario.username);
                return {
                    ...usuario,
                    level: miembroActualizado?.level || 1,
                    xp: miembroActualizado?.xp || 0
                };
            });
            
            // Mostrar ranking con niveles
            mostrarListaRanking(rankingConNiveles, clubActualizado);
            loader.style.display = 'none';
            lista.style.display = 'block';
        } else {
            // Mostrar estado vacío
            loader.style.display = 'none';
            empty.style.display = 'block';
        }
    } catch (error) {
        loader.style.display = 'none';
        empty.style.display = 'block';
        
        const emptyTitle = empty.querySelector('h3');
        const emptyText = empty.querySelector('p');
        emptyTitle.textContent = 'Error al cargar ranking';
        emptyText.textContent = 'No se pudo conectar al servidor. Intenta nuevamente.';
    }
}

function mostrarListaRanking(ranking, club) {
    const lista = document.getElementById('rankingList');
    
    const html = ranking.map((usuario, index) => {
        const positionClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        const initials = usuario.username.charAt(0).toUpperCase();
        
        const miembro = club.members?.find(m => m.id === usuario.userId || m.username === usuario.username);
        const hasAvatar = miembro && miembro.avatar && miembro.avatar.trim() !== '';
        
        const avatarHTML = hasAvatar 
            ? `<img src="${miembro.avatar}" alt="Avatar de ${usuario.username}" class="ranking-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` 
            : '';
        
        const initialsHTML = `<div class="ranking-avatar-initials" style="${hasAvatar ? 'display: none;' : 'display: flex;'}">${initials}</div>`;
        
        return `
            <li>
                <div class="ranking-position ${positionClass}">${index + 1}</div>
                <div class="ranking-avatar-container">
                    ${avatarHTML}
                    ${initialsHTML}
                </div>
                <div class="ranking-info">
                    <h4 class="ranking-name">
                        ${usuario.username}
                        ${index < 3 ? `<span class="ranking-badge">${index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}</span>` : ''}
                    </h4>
                    <p class="ranking-stats">
                        <span>💬 ${usuario.commentsCount} comentarios</span>
                        <span>📚 ${usuario.booksAddedCount} libros</span>
                        <span class="member-level" data-level="${usuario.level || 1}">
                            <svg class="level-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="12,2 15.09,8.26 22,9 17,14 18.18,21 12,17.77 5.82,21 7,14 2,9 8.91,8.26"/>
                            </svg>
                            Nivel ${usuario.level || 1}
                        </span>
                    </p>
                </div>
                <div class="ranking-score">
                    ${usuario.totalScore}
                    <span>pts</span>
                </div>
            </li>
        `;
    }).join('');
    
    lista.innerHTML = html;
}

async function mostrarMiembros() {
    const modal = document.getElementById('modalMiembros');
    const loader = document.getElementById('membersLoader');
    const lista = document.getElementById('membersList');
    const empty = document.getElementById('membersEmpty');

    modal.classList.add('show');
    modal.style.display = 'flex';
    loader.style.display = 'block';
    lista.style.display = 'none';
    empty.style.display = 'none';

    try {
        const clubActualizado = await cargarDatosActualizadosClub();
        
        if (clubActualizado && clubActualizado.members && clubActualizado.members.length > 0) {
            window.clubData = clubActualizado;
            
            mostrarListaMiembros(clubActualizado.members, clubActualizado);
            loader.style.display = 'none';
            lista.style.display = 'block';
        } else {
            // Mostrar estado vacío
            loader.style.display = 'none';
            empty.style.display = 'block';
        }
    } catch (error) {
        loader.style.display = 'none';
        empty.style.display = 'block';
        
        const emptyTitle = empty.querySelector('h3');
        const emptyText = empty.querySelector('p');
        emptyTitle.textContent = 'Error al cargar miembros';
        emptyText.textContent = 'No se pudieron cargar los miembros del club.';
    }
}

async function cargarDatosActualizadosClub() {
    try {
        const clubId = getClubId();
        
        if (!clubId) {
            throw new Error('No se encontró ID del club');
        }

        const response = await fetch(`${window.API_URL}/club/${clubId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Error al obtener datos del club');
        }

        return data.club;
    } catch (error) {
        throw error;
    }
}

function mostrarListaMiembros(miembros, club) {
    const lista = document.getElementById('membersList');
    const currentUserId = localStorage.getItem("userId");
    const isCurrentUserOwner = club.id_owner == currentUserId;
    
    const html = miembros.map((miembro) => {
        const initials = miembro.username.charAt(0).toUpperCase();
        const isOwner = club.id_owner == miembro.id;
        const isCurrentUser = currentUserId == miembro.id;
        const canRemove = isCurrentUserOwner && !isCurrentUser && !isOwner;
        
        const hasAvatar = miembro.avatar && miembro.avatar.trim() !== '';
        
        const memberRole = miembro.role || (isOwner ? 'OWNER' : 'LECTOR');
        const canChangeRole = isCurrentUserOwner && !isCurrentUser && !isOwner;
        
        // Configurar display del rol
        const roleInfo = getRoleDisplayInfo(memberRole, isOwner);
        
        // Calcular tiempo como miembro (simulado)
        const joinDate = new Date(miembro.createdAt || Date.now());
        const joinDateStr = joinDate.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short' 
        });
        
        const avatarHTML = hasAvatar 
            ? `<img src="${miembro.avatar}" alt="Avatar de ${miembro.username}" class="member-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` 
            : '';
        
        const initialsHTML = `<div class="member-avatar-initials" style="${hasAvatar ? 'display: none;' : 'display: flex;'}">${initials}</div>`;
        
        return `
            <li>
                <div class="member-avatar-container">
                    ${avatarHTML}
                    ${initialsHTML}
                </div>
                <div class="member-info">
                    <h4 class="member-name">
                        ${miembro.username}
                        ${isCurrentUser ? '<span style="color: #666; font-size: 12px;">(Tú)</span>' : ''}
                        <span class="member-badge ${roleInfo.cssClass}">${roleInfo.displayText}</span>
                    </h4>
                    <p class="member-role">
                        ${roleInfo.description}
                        <span class="member-level" data-level="${miembro.level || 1}">
                            <svg class="level-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="12,2 15.09,8.26 22,9 17,14 18.18,21 12,17.77 5.82,21 7,14 2,9 8.91,8.26"/>
                            </svg>
                            Nivel ${miembro.level || 1}
                        </span>
                    </p>
                </div>
                <div class="member-stats">
                    <div class="member-join-date">Desde ${joinDateStr}</div>
                    <div class="member-activity">${roleInfo.activityText}</div>
                </div>
                <div class="member-actions">
                    ${canChangeRole ? `
                        <div class="role-management">
                            ${memberRole === 'LECTOR' ? `
                                <button class="promote-btn" onclick="cambiarRolMiembro(${miembro.id}, '${miembro.username}', 'MODERADOR')" title="Promover a Moderador">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                                    </svg>
                                </button>
                            ` : ''}
                            ${memberRole === 'MODERADOR' ? `
                                <button class="demote-btn" onclick="cambiarRolMiembro(${miembro.id}, '${miembro.username}', 'LECTOR')" title="Quitar Moderador">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M7 13l3 3 7-7"/>
                                        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.07.74 5.61 1.97"/>
                                    </svg>
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                    ${canRemove ? `
                        <button class="remove-member-btn" onclick="eliminarMiembro(${miembro.id}, '${miembro.username}')" title="Eliminar miembro">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </li>
        `;
    }).join('');
    
    lista.innerHTML = html;
}

function getRoleDisplayInfo(role, isOwner) {
    if (isOwner) {
        return {
            displayText: 'Owner',
            cssClass: 'owner',
            description: '🛡️ Propietario',
            activityText: 'Fundador'
        };
    }
    
    const roleConfigs = {
        'OWNER': {
            displayText: 'Owner',
            cssClass: 'owner',
            description: '🛡️ Propietario',
            activityText: 'Fundador'
        },
        'MODERADOR': {
            displayText: 'Moderador',
            cssClass: 'moderador',
            description: '⚡ Moderador',
            activityText: 'Moderador'
        },
        'LECTOR': {
            displayText: 'Miembro',
            cssClass: 'miembro',
            description: '📖 Lector',
            activityText: 'Activo'
        }
    };
    
    return roleConfigs[role] || roleConfigs['LECTOR'];
}

function eliminarMiembro(miembroId, username) {
    const clubId = getClubId();
    
    mostrarConfirmacion(
        "Eliminar miembro",
        `¿Estás seguro de que quieres eliminar a <strong>${username}</strong> del club?`,
        async () => {
            // Esta función se ejecuta solo si el usuario confirma
            try {
                showLoader(`Eliminando a ${username} del club...`);
                
                const res = await fetch(`${API_URL}/club/${clubId}/removeMember/${miembroId}`, {
                    method: "DELETE"
                });
                
                const data = await res.json();
                
                if (data.success) {
                    showNotification("success", `${username} ha sido eliminado del club`);
                    
                    document.getElementById('modalMiembros').style.display = 'none';
                    document.getElementById('modalMiembros').classList.remove('show');
                    
                    // Actualizar los datos del club
                    await renderClub();
                    
                    // Reabrir el modal con datos actualizados después de un pequeño delay
                    setTimeout(() => {
                        mostrarMiembros();
                    }, 500);
                    
                } else {
                    showNotification("error", data.message || "Error al eliminar el miembro");
                }
            } catch (error) {
                showNotification("error", "Error de conexión al eliminar el miembro");
            } finally {
                hideLoader();
            }
        },
        null,
        {
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            confirmClass: "red-btn"
        }
    );
}

async function cambiarRolMiembro(miembroId, username, nuevoRol) {
    const clubId = getClubId();
    
    const accionTexto = nuevoRol === 'MODERADOR' ? 'promover a Moderador' : 'quitar el rol de Moderador';
    const confirmText = nuevoRol === 'MODERADOR' 
        ? `¿Estás seguro de que quieres <strong>promover a ${username}</strong> como Moderador del club?<br><br>Los moderadores pueden gestionar libros y contenido del club.`
        : `¿Estás seguro de que quieres <strong>quitar el rol de Moderador</strong> a ${username}?<br><br>Volverá a ser un miembro regular del club.`;
    
    mostrarConfirmacion(
        `${nuevoRol === 'MODERADOR' ? 'Promover' : 'Quitar'} Moderador`,
        confirmText,
        async () => {
            try {
                showLoader(`${nuevoRol === 'MODERADOR' ? 'Promoviendo' : 'Quitando rol de moderador a'} ${username}...`);
                
                const res = await fetch(`${API_URL}/club/${clubId}/change-role/${miembroId}`, {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        newRole: nuevoRol
                    })
                });
                
                const data = await res.json();
                
                if (data.success) {
                    const successMessage = nuevoRol === 'MODERADOR' 
                        ? `${username} ha sido promovido a Moderador` 
                        : `Se ha quitado el rol de Moderador a ${username}`;
                    
                    showNotification("success", successMessage);
                    
                    document.getElementById('modalMiembros').style.display = 'none';
                    document.getElementById('modalMiembros').classList.remove('show');
                    
                    // Actualizar los datos del club
                    await renderClub();
                    
                    // Reabrir el modal con datos actualizados después de un pequeño delay
                    setTimeout(() => {
                        mostrarMiembros();
                    }, 500);
                    
                } else {
                    showNotification("error", data.message || "Error al cambiar el rol del miembro");
                }
            } catch (error) {
                showNotification("error", "Error de conexión al cambiar el rol del miembro");
            } finally {
                hideLoader();
            }
        },
        null,
        {
            confirmText: nuevoRol === 'MODERADOR' ? "Promover" : "Quitar Rol",
            cancelText: "Cancelar",
            confirmClass: nuevoRol === 'MODERADOR' ? "orange-btn" : "orange-btn"
        }
    );
}

function mostrarSolicitudesModal() {
    const modal = document.getElementById('modalSolicitudes');
    const loader = document.getElementById('requestsLoader');
    const lista = document.getElementById('requestsList');
    const empty = document.getElementById('requestsEmpty');
    
    if (!modal || !loader || !lista || !empty) {
        return;
    }
    
    modal.style.display = 'flex';
    loader.style.display = 'flex';
    lista.style.display = 'none';
    empty.style.display = 'none';
    
    // Simular un pequeño delay para mostrar el loader
    setTimeout(() => {
        try {
            // Usar los datos del club que ya tenemos
            if (window.clubData && window.clubData.solicitudes && window.clubData.solicitudes.length > 0) {
                const solicitudesPendientes = window.clubData.solicitudes.filter(s => s.estado === 'pendiente');
                
                if (solicitudesPendientes.length > 0) {
                    mostrarListaSolicitudes(solicitudesPendientes);
                    loader.style.display = 'none';
                    lista.style.display = 'block';
                } else {
                    // No hay solicitudes pendientes
                    loader.style.display = 'none';
                    empty.style.display = 'block';
                }
            } else {
                loader.style.display = 'none';
                empty.style.display = 'block';
            }
        } catch (error) {
            showNotification("error", "Error al mostrar las solicitudes");
            loader.style.display = 'none';
            empty.style.display = 'block';
        }
    }, 500);
}

function mostrarListaSolicitudes(solicitudes) {
    const lista = document.getElementById('requestsList');
    
    const html = solicitudes.map(solicitud => {
        const fechaSolicitud = new Date(solicitud.fecha_solicitud);
        const ahora = new Date();
        const diffMs = ahora - fechaSolicitud;
        const diffMinutos = Math.floor(diffMs / 60000);
        const diffHoras = Math.floor(diffMinutos / 60);
        const diffDias = Math.floor(diffHoras / 24);
        
        let tiempoTranscurrido;
        if (diffDias > 0) {
            tiempoTranscurrido = `Hace ${diffDias} día${diffDias !== 1 ? 's' : ''}`;
        } else if (diffHoras > 0) {
            tiempoTranscurrido = `Hace ${diffHoras} hora${diffHoras !== 1 ? 's' : ''}`;
        } else if (diffMinutos > 0) {
            tiempoTranscurrido = `Hace ${diffMinutos} minuto${diffMinutos !== 1 ? 's' : ''}`;
        } else {
            tiempoTranscurrido = 'Hace un momento';
        }
        
        const inicial = solicitud.username ? solicitud.username.charAt(0).toUpperCase() : '?';
        const hasAvatar = solicitud.avatar && solicitud.avatar.trim() !== '';
        
        const avatarHTML = hasAvatar 
            ? `<img src="${solicitud.avatar}" alt="Avatar de ${solicitud.username}" class="request-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` 
            : '';
        
        const initialsHTML = `<div class="request-avatar-initials" style="${hasAvatar ? 'display: none;' : 'display: flex;'}">${inicial}</div>`;
        
        return `
            <div class="request-item">
                <div class="request-user">
                    <div class="request-avatar-container">
                        ${avatarHTML}
                        ${initialsHTML}
                    </div>
                    <div class="request-info">
                        <div class="request-name">${solicitud.username || 'Usuario desconocido'}</div>
                        <div class="request-date">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${tiempoTranscurrido}
                        </div>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="request-btn accept" onclick="gestionarSolicitudModal(${solicitud.id}, true)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"/>
                        </svg>
                        Aceptar
                    </button>
                    <button class="request-btn reject" onclick="gestionarSolicitudModal(${solicitud.id}, false)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Rechazar
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    lista.innerHTML = html;
}

async function gestionarSolicitudModal(solicitudId, aceptar) {
    const clubId = getClubId();
    
    try {
        showLoader(aceptar ? "Aceptando solicitud..." : "Rechazando solicitud...");
        
        const res = await fetch(`${API_URL}/club/${clubId}/solicitud/${solicitudId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ aceptar })
        });
        
        const data = await res.json();
        
        if (data.success) {
            showNotification("success", data.message || (aceptar ? "Solicitud aceptada" : "Solicitud rechazada"));
            
            document.getElementById('modalSolicitudes').style.display = 'none';
            
            await renderClub();
            
            if (window.clubData && typeof window.actualizarBadgeSolicitudes === 'function') {
                window.actualizarBadgeSolicitudes(window.clubData);
            }
            // Reabrir el modal con datos actualizados después de un pequeño delay
            setTimeout(() => {
                mostrarSolicitudesModal();
            }, 500);
            
        } else {
            showNotification("error", data.message || "Error al procesar la solicitud");
        }
    } catch (error) {
        showNotification("error", "Error de conexión");
    } finally {
        hideLoader();
    }
}
window.mostrarRanking = mostrarRanking;

window.mostrarMiembros = mostrarMiembros;
window.eliminarMiembro = eliminarMiembro;
window.cambiarRolMiembro = cambiarRolMiembro;

window.mostrarSolicitudesModal = mostrarSolicitudesModal;
window.mostrarSolicitudes = mostrarSolicitudesModal;
window.gestionarSolicitudModal = gestionarSolicitudModal;

export { initInfoModals };