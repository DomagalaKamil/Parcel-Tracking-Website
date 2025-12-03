
const countryCodes = [
  { code: '+48', flag: '🇵🇱', name: 'Polska' }
];
const countries = [
  { name: 'Polska', flag: '🇵🇱' }
];


function stripEmojis(str) {
  return str
    .replace(/[\uD800-\uDFFF]/g, '')
    .replace(/[\u{1F300}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '');
}

function onlyDigits(str){
  return str.replace(/\D/g,'');
}

function validName(name){
  return /^[\p{L}\s'-]+$/u.test(name);
}
function validEmail(email){
  return /\S+@\S+\.\S+/.test(email);
}
function showMessage(elId, msg, type){
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.classList.remove('error','success');
  if(type === 'error') el.classList.add('error');
  if(type === 'success') el.classList.add('success');
}


const codeSelect = document.getElementById('regCountryCode');
countryCodes.forEach(c=>{
  const opt = document.createElement('option');
  opt.value = c.code;
  opt.text = `${c.flag} ${c.code}`;
  codeSelect.appendChild(opt);
});

const countrySelect = document.getElementById('regCountry');
countries.forEach(c=>{
  const opt = document.createElement('option');
  opt.value = c.name;
  opt.text = `${c.flag} ${c.name}`;
  countrySelect.appendChild(opt);
});


function showRegister(){
  document.getElementById('loginBox').style.display='none';
  document.getElementById('registerBox').style.display='block';
  showMessage('loginMessage','');
}

function showLogin(){
  document.getElementById('registerBox').style.display='none';
  document.getElementById('loginBox').style.display='block';
  showMessage('registerMessage','');
}

async function doLogin(){
  showMessage('loginMessage','');

  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value.trim();

  if(!email || !pass){
    showMessage('loginMessage','Proszę wypełnić wszystkie pola logowania.','error');
    return;
  }
  if(!validEmail(email)){
    showMessage('loginMessage','Nieprawidłowy format email.','error');
    return;
  }

  const payload = { 
    email: email, 
    password: pass 
  };

  try {
    const res  = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (json.success && json.user_id) {

      // Save logged user ID
      localStorage.setItem("user_id", json.user_id);

      // Redirect to homepage
      window.location.href = "index.html";
      return;
    }

    showMessage('loginMessage', json.message || 'Błąd logowania.', 'error');

  } catch(e){
    console.error(e);
    showMessage('loginMessage','Błąd sieci. Spróbuj ponownie.','error');
  }
}


async function doRegister(){
  showMessage('registerMessage','');

  const first     = document.getElementById('regFirst').value.trim();
  const last      = document.getElementById('regLast').value.trim();
  const email     = document.getElementById('regEmail').value.trim();
  const pass      = document.getElementById('regPass').value.trim();
  const phoneCode = document.getElementById('regCountryCode').value;
  const phone     = document.getElementById('regPhone').value.trim();
  const street    = document.getElementById('regStreet').value.trim();
  const house     = document.getElementById('regHouse').value.trim();
  const apt       = document.getElementById('regApt').value.trim();
  const city      = document.getElementById('regCity').value.trim();
  const postal    = document.getElementById('regPostal').value.trim();
  const country   = document.getElementById('regCountry').value;

  const required = { first, last, email, pass, phone, street, house, city, postal, country };
  for(const v of Object.values(required)){
    if(!v){
      showMessage('registerMessage','Proszę wypełnić wszystkie wymagane pola.','error');
      return;
    }
  }

  if(!validName(first) || !validName(last)){
    showMessage('registerMessage','Imię i nazwisko nie mogą zawierać cyfr ani nieprawidłowych znaków.','error');
    return;
  }
  if(!validEmail(email)){
    showMessage('registerMessage','Nieprawidłowy adres email.','error');
    return;
  }

  const phoneDigits = onlyDigits(phone);
  if(phoneDigits.length < 6){
    showMessage('registerMessage','Numer telefonu jest za krótki.','error');
    return;
  }

  // PAYLOAD zgodny z nową bazą MySQL
  const payload = {
    user: {
      firstname: first,
      lastname: last,
      email: email,
      password: pass,                    // backend musi hashować!
      phone: phoneCode + phoneDigits
    },
    address: {
      firstname: first,
      lastname: last,
      street: street,
      house_number: house,
      apartment_number: apt,
      city: city,
      postal_code: postal,
      country: country,
      phone: phoneCode + phoneDigits
    }
  };

  try {
    const res  = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (json.success) {
      showMessage('registerMessage', json.message || 'Konto utworzone.', 'success');

      setTimeout(() => showLogin(), 1200);
      return;
    }

    showMessage('registerMessage', json.message || 'Błąd rejestracji.', 'error');

  } catch(e){
    console.error(e);
    showMessage('registerMessage','Błąd sieci. Spróbuj ponownie.','error');
  }
}

console.log(req.body);
