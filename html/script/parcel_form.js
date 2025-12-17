/* AUTOMATYCZNE WYPEŁNIANIE DANYCH NADAWCY */
async function loadSenderInfo(){
  const id = localStorage.getItem("user_id");
  if(!id){
    document.getElementById("btnFillSender").textContent = "Brak zalogowanego użytkownika";
    return;
  }

  const res = await fetch(`/api/userinfo/${id}`);
  const json = await res.json();

  if(!json.success){
    document.getElementById("btnFillSender").textContent = "Nie można pobrać danych";
    return;
  }

  const user = json.user;
  const addr = json.address;

  if(addr){
    document.getElementById("btnFillSender").textContent =
      `Użyj mojego adresu: ${addr.firstname} ${addr.lastname}, ${addr.street} ${addr.house_number}`;
  } else {
    document.getElementById("btnFillSender").textContent =
      `Użyj moich danych: ${user.firstname} ${user.lastname}`;
  }

  document.getElementById("btnFillSender").onclick = () => {
    sender_name.value = user.firstname;
    sender_lastname.value = user.lastname;
    sender_email.value = user.email;
    sender_phone.value = user.phone;

    if(addr){
      sender_street.value = addr.street;
      sender_house.value  = addr.house_number;
      sender_postcode.value = addr.postal_code;
      sender_city.value = addr.city;
      sender_country.value = addr.country;
    }
  };
}

loadSenderInfo();

function clearSender(){
  sender_name.value = "";
  sender_lastname.value = "";
  sender_phone.value = "";
  sender_email.value = "";
  sender_street.value = "";
  sender_house.value = "";
  sender_postcode.value = "";
  sender_city.value = "";
}

function clearReceiver(){
  recv_name.value = "";
  recv_lastname.value = "";
  recv_phone.value = "";
  recv_email.value = "";
  recv_street.value = "";
  recv_house.value = "";
  recv_postcode.value = "";
  recv_city.value = "";
}


ins_yes.addEventListener("change", () => {
  insurance_form.style.opacity = "1";
  insurance_form.style.pointerEvents = "auto";
});

ins_no.addEventListener("change", () => {
  insurance_form.style.opacity = "0.4";
  insurance_form.style.pointerEvents = "none";

  ins_content.value = "";
  ins_value.value = "";
});


function submitParcel(){

  const insurance = {
    enabled: ins_yes.checked,
    content: ins_yes.checked ? ins_content.value.trim() : null,
    value: ins_yes.checked ? Number(ins_value.value) : 0
  };

  const parcelData = {
    type: localStorage.getItem("parcel_type"),
    max_kg: localStorage.getItem("parcel_max_kg"),
    max_dim: localStorage.getItem("parcel_max_dim"),
    base_price: localStorage.getItem("parcel_price"),
    insurance,

    sender:{
      name: sender_name.value,
      last: sender_lastname.value,
      phone: sender_phone.value,
      email: sender_email.value,
      street: sender_street.value,
      house: sender_house.value,
      postcode: sender_postcode.value,
      city: sender_city.value,
      country: sender_country.value
    },

    receiver:{
      name: recv_name.value,
      last: recv_lastname.value,
      phone: recv_phone.value,
      email: recv_email.value,
      street: recv_street.value,
      house: recv_house.value,
      postcode: recv_postcode.value,
      city: recv_city.value,
      country: recv_country.value
    }
  };

  localStorage.setItem("last_parcel", JSON.stringify(parcelData));

  alert("Paczka zgłoszona — dane zapisane lokalnie.");
}