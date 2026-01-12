import { API_URL } from './env.js';
import { showNotification } from '../componentes/notificacion.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgot-form');
  
  if (form) {
    form.addEventListener('submit', handleForgotPassword);
  }
});

async function handleForgotPassword(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const messageEl = document.getElementById('message');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Deshabilitar botón
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';
  messageEl.textContent = '';
  
  try {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (data.success) {
      messageEl.style.color = '#00b894';
      messageEl.textContent = '✓ Te enviamos un correo con las instrucciones para recuperar tu contraseña.';
      
      // Usar e.target en lugar de form
      e.target.reset();
      
      showNotification('success', 'Revisa tu correo electrónico');
    } else {
      messageEl.style.color = '#d63031';
      messageEl.textContent = data.message || 'Error al enviar el correo';
      
      showNotification('error', data.message || 'Error al enviar el correo');
    }
  } catch (error) {
    messageEl.style.color = '#d63031';
    messageEl.textContent = 'Error de conexión. Intenta nuevamente.';
    
    showNotification('error', 'Error de conexión con el servidor');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar correo de recuperación';
  }
}