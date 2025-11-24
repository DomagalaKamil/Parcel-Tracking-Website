// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const pool = require('./db');

const app = express();
const PORT = 3000;

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'html')));

// helpers
function stripEmojis(str = '') {
  return str
    .replace(/[\uD800-\uDFFF]/g, '')
    .replace(/[\u{1F300}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '');
}

function validName(name = '') {
  return /^[\p{L}\s'-]+$/u.test(name);
}

function validEmail(email = '') {
  return /\S+@\S+\.\S+/.test(email);
}

function onlyDigits(str = '') {
  return str.replace(/\D/g, '');
}

/* ========== POST /api/register ========== */
app.post('/api/register', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      phone_code,
      phone,
      street,
      house,
      apartment,
      city,
      postal,
      country,
    } = req.body || {};

    // required fields
    if (
      !first_name || !last_name || !email || !password ||
      !phone_code || !phone || !street || !house || !city || !postal || !country
    ) {
      return res.status(400).json({ success: false, message: 'Proszę wypełnić wszystkie wymagane pola.' });
    }

    // name (no numbers)
    if (!validName(first_name) || !validName(last_name)) {
      return res.status(400).json({
        success: false,
        message: 'Imię i nazwisko nie mogą zawierać cyfr ani nieprawidłowych znaków.',
      });
    }

    // email with @
    if (!validEmail(email)) {
      return res.status(400).json({ success: false, message: 'Nieprawidłowy adres email.' });
    }

    // phone only digits
    const phoneDigits = onlyDigits(phone);
    if (phoneDigits.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Numer telefonu jest za krótki lub zawiera nieprawidłowe znaki.',
      });
    }

    const countryClean   = stripEmojis(country).trim();
    const phoneCodeClean = stripEmojis(phone_code).trim();
    const fullPhone      = `${phoneCodeClean}${phoneDigits}`;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // check email uniqueness
      const [existing] = await conn.execute(
        'SELECT user_id FROM users WHERE email = ?',
        [email]
      );
      if (existing.length > 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({
          success: false,
          message: 'Użytkownik z takim adresem email już istnieje.',
        });
      }

      // insert address
      const [addrRes] = await conn.execute(
        `INSERT INTO addresses
        (street_name, house_number, apartment_no, city, postal_code, country)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [street, house, apartment || null, city, postal, countryClean]
      );
      const addressId = addrRes.insertId;

      // hash password
      const hash = await bcrypt.hash(password, 10);

      // insert user
      await conn.execute(
        `INSERT INTO users
         (first_name, last_name, email, password_hash, phone_number, default_address_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [first_name, last_name, email, hash, fullPhone, addressId]
      );

      await conn.commit();
      conn.release();

      return res.json({ success: true, message: 'Konto utworzone pomyślnie.' });
    } catch (err) {
      await conn.rollback();
      conn.release();
      console.error(err);
      return res.status(500).json({ success: false, message: 'Błąd serwera podczas rejestracji.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Błąd serwera.' });
  }
});

/* ========== POST /api/login ========== */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Proszę wypełnić wszystkie pola.' });
    }
    if (!validEmail(email)) {
      return res.status(400).json({ success: false, message: 'Nieprawidłowy adres email.' });
    }

    const conn = await pool.getConnection();
    const [rows] = await conn.execute(
      'SELECT user_id, password_hash FROM users WHERE email = ?',
      [email]
    );
    conn.release();

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Nieprawidłowy email lub hasło.' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Nieprawidłowy email lub hasło.' });
    }

    // tutaj możesz dodać JWT / sesję
    return res.json({
      success: true,
      message: 'Zalogowano pomyślnie.',
      user_id: user.user_id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Błąd serwera.' });
  }
});

/* ========== START SERVER ========== */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
