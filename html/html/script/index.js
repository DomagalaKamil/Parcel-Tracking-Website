// index.js

async function loadAuthUI() {
  const authArea = document.getElementById('authArea');
  if (!authArea) return;

  const userId = localStorage.getItem('user_id');

  // Not logged in → show login button
  if (!userId) {
    authArea.innerHTML = `
      <a href="login.html" class="btn secondary">Zaloguj się</a>
    `;
    return;
  }

  try {
    const res = await fetch(`/api/userinfo/${userId}`);
    const data = await res.json();

    if (data.success && data.user && data.user.firstname) {
      const name = data.user.firstname;

      authArea.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="padding:10px 16px; font-weight:600; color:var(--accent);">
            Witaj, ${name}!
          </div>

          <button id="logoutBtn" class="btn secondary" style="padding: 8px 14px;">
            Wyloguj się
          </button>
        </div>
      `;

      // Attach logout event
      document.getElementById("logoutBtn").addEventListener("click", logoutUser);
    } 
    else {
      authArea.innerHTML = `
        <a href="login.html" class="btn secondary">Zaloguj się</a>
      `;
    }

  } catch (err) {
    console.error("Error loading user info:", err);
    authArea.innerHTML = `
      <a href="login.html" class="btn secondary">Zaloguj się</a>
    `;
  }
}

// Logout function
function logoutUser() {
  localStorage.removeItem("user_id");
  window.location.href = "index.html";
}

document.addEventListener('DOMContentLoaded', loadAuthUI);

document.getElementById("sendParcelBtn").addEventListener("click", () => {
    window.location.href = "parcel_selection.html";
});

