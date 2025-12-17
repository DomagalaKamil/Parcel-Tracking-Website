const userId = localStorage.getItem("user_id");
if (!userId) {
  window.location.href = "login.html";
}

const form = document.getElementById("profileForm");
const inputs = form.querySelectorAll("input");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");

// Load user data
async function loadProfile() {
  const res = await fetch(`/api/userinfo/${userId}`);
  const data = await res.json();

  if (!data.success) return alert("Błąd ładowania profilu");

  const { user, address } = data;

  document.getElementById("firstname").value = user.firstname;
  document.getElementById("lastname").value = user.lastname;

  if (address) {
    street.value = address.street;
    house_number.value = address.house_number;
    apartment_number.value = address.apartment_number || "";
    city.value = address.city;
    postal_code.value = address.postal_code;
    country.value = address.country;
  }
}

// Enable editing
editBtn.addEventListener("click", () => {
  inputs.forEach(i => i.disabled = false);
  saveBtn.disabled = false;
});

// Save changes
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    firstname: firstname.value,
    lastname: lastname.value,
    street: street.value,
    house_number: house_number.value,
    apartment_number: apartment_number.value,
    city: city.value,
    postal_code: postal_code.value,
    country: country.value
  };

  const res = await fetch(`/api/profile/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (data.success) {
    alert("Zapisano zmiany");
    inputs.forEach(i => i.disabled = true);
    saveBtn.disabled = true;
  } else {
    alert(data.message || "Błąd zapisu");
  }
});

loadProfile();
