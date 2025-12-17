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

/* ============================================================================
   POST /api/register  — NEW VERSION (user + address)
============================================================================ */
app.post('/api/register', async (req, res) => {
  try {
    const { user, address } = req.body || {};

    if (!user || !address) {
      return res.status(400).json({
        success: false,
        message: 'Brak danych user lub address.'
      });
    }

    const {
      firstname,
      lastname,
      email,
      password,
      phone
    } = user;

    const {
      firstname: addrFirst,
      lastname: addrLast,
      street,
      house_number,
      apartment_number,
      city,
      postal_code,
      country,
      phone: addrPhone
    } = address;

    // VALIDATION
    if (!firstname || !lastname || !email || !password || !phone ||
        !street || !house_number || !city || !postal_code || !country) {
      return res.status(400).json({
        success: false,
        message: 'Proszę wypełnić wszystkie wymagane pola.'
      });
    }

    if (!validName(firstname) || !validName(lastname)) {
      return res.status(400).json({
        success: false,
        message: 'Imię lub nazwisko zawiera błędne znaki.'
      });
    }

    if (!validEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowy adres email.'
      });
    }

    if (onlyDigits(phone).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Numer telefonu jest nieprawidłowy.'
      });
    }

    const phoneClean = stripEmojis(phone);

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Check duplicate email
      const [existing] = await conn.execute(
        'SELECT user_id FROM users WHERE email = ?',
        [email]
      );

      if (existing.length > 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({
          success: false,
          message: 'Użytkownik o tym email już istnieje.'
        });
      }

      // Insert address
      const [addrRes] = await conn.execute(
        `INSERT INTO addresses
         (firstname, lastname, street, house_number, apartment_number, city, postal_code, country, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          addrFirst || firstname,
          addrLast || lastname,
          street,
          house_number,
          apartment_number || null,
          city,
          postal_code,
          stripEmojis(country),
          stripEmojis(addrPhone || phone)
        ]
      );

      const addressId = addrRes.insertId;

      // Hash password
      const hash = await bcrypt.hash(password, 10);

      // Insert user
      const [userRes] = await conn.execute(
        `INSERT INTO users
         (firstname, lastname, email, password_hash, phone, default_address_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [firstname, lastname, email, hash, phoneClean, addressId]
      );

      await conn.commit();
      conn.release();

      return res.json({
        success: true,
        user_id: userRes.insertId,
        message: 'Konto utworzone pomyślnie.'
      });

    } catch (err) {
      await conn.rollback();
      conn.release();
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Błąd serwera podczas rejestracji.'
      });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera.'
    });
  }
});

/* ============================================================================
   POST /api/login
============================================================================ */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Proszę wypełnić wszystkie pola.' });

    if (!validEmail(email))
      return res.status(400).json({ success: false, message: 'Nieprawidłowy adres email.' });

    const conn = await pool.getConnection();
    const [rows] = await conn.execute(
      'SELECT user_id, password_hash FROM users WHERE email = ?',
      [email]
    );
    conn.release();

    if (rows.length === 0)
      return res.status(400).json({ success: false, message: 'Nieprawidłowy email lub hasło.' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok)
      return res.status(400).json({ success: false, message: 'Nieprawidłowy email lub hasło.' });

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

/* ============================================================================
   GET /api/userinfo/:id — returns full user + default address
============================================================================ */
app.get('/api/userinfo/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const conn = await pool.getConnection();

    // 1) Pobierz użytkownika
    const [userRows] = await conn.execute(
      'SELECT firstname, lastname, email, phone, default_address_id FROM users WHERE user_id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      conn.release();
      return res.json({ success: false, message: "Nie znaleziono użytkownika." });
    }

    const user = userRows[0];
    let address = null;

    // 2) Pobierz adres
    if (user.default_address_id) {
      const [addrRows] = await conn.execute(
        `SELECT firstname, lastname, street, house_number, apartment_number,
                city, postal_code, country, phone
         FROM addresses
         WHERE address_id = ?`,
        [user.default_address_id]
      );

      if (addrRows.length > 0)
        address = addrRows[0];
    }

    conn.release();

    return res.json({
      success: true,
      user,
      address
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Błąd serwera."
    });
  }
});

/* ============================================================================
   PUT /api/profile/:id — update user + address
============================================================================ */
app.put('/api/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      firstname, lastname,
      street, house_number, apartment_number,
      city, postal_code, country
    } = req.body;

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    // Update user
    await conn.execute(
      `UPDATE users SET firstname=?, lastname=? WHERE user_id=?`,
      [firstname, lastname, userId]
    );

    // Update address
    await conn.execute(
      `UPDATE addresses a
       JOIN users u ON u.default_address_id = a.address_id
       SET street=?, house_number=?, apartment_number=?, city=?, postal_code=?, country=?
       WHERE u.user_id=?`,
      [street, house_number, apartment_number || null, city, postal_code, country, userId]
    );

    await conn.commit();
    conn.release();

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Błąd zapisu profilu"
    });
  }
});


// ====================================================================================
//  STATIC FILE SERVING (HTML frontend)
// ====================================================================================
app.use(express.static(path.join(__dirname, 'html')));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
