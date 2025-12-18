// ================= PARCEL INFO =================
type.textContent = localStorage.getItem("parcel_type");
kg.textContent = localStorage.getItem("parcel_max_kg");
dim.textContent = localStorage.getItem("parcel_max_dim");
price.textContent = localStorage.getItem("parcel_price");

// ================= STEP SYSTEM =================
let step = 1;

const steps = {
  1: document.getElementById("step-1"),
  2: document.getElementById("step-2"),
  3: document.getElementById("step-3"),
  4: document.getElementById("step-4")
};

function showStep(n) {
  Object.values(steps).forEach(s => s.classList.add("hidden"));
  steps[n].classList.remove("hidden");

  prevBtn.disabled = n === 1;
  nextBtn.textContent = n === 4 ? "Wyślij paczkę" : "Dalej";

  calculateTotalPrice();
}

prevBtn.onclick = () => {
  if (step > 1) {
    step--;
    showStep(step);
  }
};

nextBtn.onclick = () => {
  if (step === 3) {
    if (!parcel_content.value.trim()) {
      alert("Proszę podać zawartość paczki.");
      return;
    }

    if (ins_yes.checked && Number(insurance_value.value) <= 0) {
      alert("Podaj wartość paczki do ubezpieczenia.");
      return;
    }

    buildSummary();
  }

  if (step < 4) {
    step++;
    showStep(step);
  } else {
    submitParcel();
  }
};

// ================= LOAD USER DATA =================
async function loadSenderInfo() {
  const btn = btnFillSender;
  const id = localStorage.getItem("user_id");

  if (!id) {
    btn.textContent = "Brak zalogowanego użytkownika";
    btn.disabled = true;
    return;
  }

  try {
    const res = await fetch(`/api/userinfo/${id}`);
    const json = await res.json();

    if (!json.success) {
      btn.textContent = "Nie można pobrać danych";
      return;
    }

    const user = json.user;
    const addr = json.address;

    btn.textContent = addr
      ? `Użyj mojego adresu: ${addr.firstname} ${addr.lastname}, ${addr.street} ${addr.house_number}`
      : `Użyj moich danych: ${user.firstname} ${user.lastname}`;

    btn.onclick = () => {
      sender_name.value = user.firstname ?? "";
      sender_lastname.value = user.lastname ?? "";
      sender_email.value = user.email ?? "";
      sender_phone.value = user.phone ?? "";

      if (addr) {
        sender_street.value = addr.street ?? "";
        sender_house.value = addr.house_number ?? "";
        sender_apartment.value = addr.apartment_number ?? "";
        sender_postcode.value = addr.postal_code ?? "";
        sender_city.value = addr.city ?? "";
        sender_country.value = addr.country ?? "Polska";
      }
    };
  } catch (e) {
    btn.textContent = "Błąd połączenia";
  }
}

loadSenderInfo();

// ================= CLEAR =================
function clearSender() {
  sender_name.value = "";
  sender_lastname.value = "";
  sender_phone.value = "";
  sender_email.value = "";
  sender_street.value = "";
  sender_house.value = "";
  sender_apartment.value = "";
  sender_postcode.value = "";
  sender_city.value = "";
  sender_country.value = "Polska";
}

function clearReceiver() {
  recv_name.value = "";
  recv_lastname.value = "";
  recv_phone.value = "";
  recv_email.value = "";
  recv_street.value = "";
  recv_house.value = "";
  recv_apartment.value = "";
  recv_postcode.value = "";
  recv_city.value = "";
  recv_country.value = "Polska";
}

// ================= INSURANCE =================
// 3.99 do 50 zł, +0.50 za każde kolejne rozpoczęte 50 zł
function calculateInsurancePrice(value) {
  if (value <= 0) return 0;
  if (value <= 50) return 3.99;

  const extraSteps = Math.ceil((value - 50) / 50);
  return 3.99 + extraSteps * 0.50;
}

ins_yes.onchange = () => {
  insurance_value_box.classList.remove("hidden");
  insurance_value.value = 0;
  insurance_price.textContent = "0.00";
  calculateTotalPrice();
};

ins_no.onchange = () => {
  insurance_value_box.classList.add("hidden");
  insurance_value.value = "";
  insurance_price.textContent = "0.00";
  calculateTotalPrice();
};

insurance_value.oninput = () => {
  const value = Number(insurance_value.value);

  if (!value || value <= 0) {
    insurance_price.textContent = "0.00";
    calculateTotalPrice();
    return;
  }

  insurance_price.textContent =
    calculateInsurancePrice(value).toFixed(2);

  calculateTotalPrice();
};

// ================= TOTAL PRICE =================
function calculateTotalPrice() {
  const base = Number(localStorage.getItem("parcel_price")) || 0;
  const insuranceCost = ins_yes.checked
    ? Number(insurance_price.textContent || 0)
    : 0;

  total_price.textContent = (base + insuranceCost).toFixed(2);
}

// ================= SUMMARY =================
function buildSummary() {
  summaryBox.innerHTML = `
    <b>Nadawca:</b><br>
    ${sender_name.value} ${sender_lastname.value}<br>
    ${sender_street.value} ${sender_house.value}${sender_apartment.value ? " / m. " + sender_apartment.value : ""}<br>
    ${sender_postcode.value} ${sender_city.value}, ${sender_country.value}<br><br>

    <b>Odbiorca:</b><br>
    ${recv_name.value} ${recv_lastname.value}<br>
    ${recv_street.value} ${recv_house.value}${recv_apartment.value ? " / m. " + recv_apartment.value : ""}<br>
    ${recv_postcode.value} ${recv_city.value}, ${recv_country.value}<br><br>

    <b>Paczka:</b><br>
    Rozmiar: ${localStorage.getItem("parcel_type")}<br>
    Maks. waga: ${localStorage.getItem("parcel_max_kg")} kg<br>
    Zawartość: ${parcel_content.value}<br><br>

    <b>Ubezpieczenie:</b><br>
    ${ins_yes.checked && Number(insurance_value.value) > 0
      ? `Tak — wartość ${insurance_value.value} PLN<br>
         Koszt ubezpieczenia: ${insurance_price.textContent} PLN`
      : "Nie"}
  `;
}

// ================= SUBMIT =================
function submitParcel() {
  alert("Paczka zgłoszona — demo");
}

// ================= INIT =================
showStep(1);
calculateTotalPrice();
