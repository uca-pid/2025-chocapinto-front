// 2025-chocapinto-front/js/authFetch.js
import { API_URL } from "./env.js";

/**
 * Fetch autenticado que incluye el JWT token
 */
export async function authFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'index.html';
        throw new Error('No token found');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    // Si el token expiró, redirigir al login
    if (response.status === 401) {
        localStorage.clear();
        window.location.href = 'index.html';
        throw new Error('Unauthorized');
    }

    return response;
}