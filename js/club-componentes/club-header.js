
function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    window.location.href = "index.html";
}

function updateUsernameDisplay() {
    const username = localStorage.getItem("username");
    const usernameDisplay = document.getElementById("usernameDisplay");
    const usernameDisplayHover = document.getElementById("usernameDisplayHover");
    const userInitials = document.getElementById("userInitials");
    
    if (username) {
        // Actualizar displays antiguos si existen
        if (usernameDisplay) {
            usernameDisplay.textContent = username;
        }
        if (usernameDisplayHover) {
            usernameDisplayHover.textContent = username;
        }
        
        // Actualizar nuevo header
        if (userInitials) {
            // Sacar las iniciales del username (primera letra)
            userInitials.textContent = username.charAt(0).toUpperCase();
        }
    }
}