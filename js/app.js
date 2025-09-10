const API_URL = "http://127.0.0.1:5000";  // tu back Flask local

// Manejar los botones "Unirme"
document.querySelectorAll(".unirme-btn").forEach(btn => {
  btn.addEventListener("click", async (e) => {
    const clubName = e.target.closest(".club-card").querySelector("h3").innerText;

    const res = await fetch(`${API_URL}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Juan", club: clubName })  // más adelante esto vendría de tu login
    });

    const data = await res.json();
    alert(data.message || data.error);
  });
});
