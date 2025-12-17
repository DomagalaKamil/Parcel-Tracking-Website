async function loadAuthUI() {
  const authArea = document.getElementById('authArea');
  if (!authArea) return;

  const userId = localStorage.getItem('user_id');

  // NOT LOGGED IN
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
        <div class="profile-wrapper">
          <button id="profileBtn" class="btn secondary">
            Witaj, ${name} ▾
          </button>

          <div id="profileMenu" class="profile-menu">
            <a href="profile.html">Mój profil</a>
            <button id="logoutBtn">Wyloguj się</button>
          </div>
        </div>
      `;

      const profileBtn = document.getElementById("profileBtn");
      const profileMenu = document.getElementById("profileMenu");
      const logoutBtn = document.getElementById("logoutBtn");

      profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle("show");
      });

      logoutBtn.addEventListener("click", logoutUser);

      document.addEventListener("click", () => {
        profileMenu.classList.remove("show");
      });

    } else {
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

// LOGOUT
function logoutUser() {
  localStorage.removeItem("user_id");
  window.location.href = "index.html";
}

document.addEventListener('DOMContentLoaded', loadAuthUI);

document.getElementById("sendParcelBtn").addEventListener("click", () => {
  window.location.href = "parcel_selection.html";
});
