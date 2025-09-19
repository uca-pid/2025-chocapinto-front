const API_URL = "http://127.0.0.1:5000"; // Express + Prisma (tu server.js)

const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })

            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                window.location.href = '../html/login.html';
            } else {
                document.getElementById("message").innerText = result.message || "Error en el registro";
            }
        } catch (error) {
            console.error("Error en registro:", error);
            document.getElementById("message").innerText = "Error de conexión con el servidor";
        }
    });
}