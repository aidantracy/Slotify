import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, initDb } from './db.js';
import { sendMeetingEmails } from './email.js';

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';

app.use(cors());
app.use(express.json());

// Resolve paths relative to the project root (one level up from /js).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Serve the static frontend so `npm start` alone serves the whole app.
app.use(express.static(rootDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email_address, first_name: user.first_name, last_name: user.last_name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Express middleware that requires a valid Bearer token and attaches req.user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'You must be logged in to do that.' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Your session is invalid or has expired.' });
  }
}

// ---------------------------------------------------------------------------
// Auth routes
// ---------------------------------------------------------------------------

// Register a new user (who then becomes a bookable provider).
app.post('/signup', async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.execute({
      sql: `INSERT INTO users (first_name, last_name, email_address, password)
            VALUES (?, ?, ?, ?)`,
      args: [first_name, last_name, email, hash],
    });
    const user = { id: Number(result.lastInsertRowid), first_name, last_name, email_address: email };
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    if (String(err.message).toUpperCase().includes('UNIQUE')) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Log in with email + password.
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email_address = ?',
      args: [email],
    });
    const user = result.rows[0];
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const safeUser = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email_address: user.email_address,
    };
    res.json({ token: signToken(safeUser), user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return the currently logged-in user.
app.get('/me', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    first_name: req.user.first_name,
    last_name: req.user.last_name,
    email_address: req.user.email,
  });
});

// Public list of users a guest can book with.
app.get('/providers', async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT id, first_name, last_name FROM users ORDER BY first_name, last_name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Booking routes
// ---------------------------------------------------------------------------

// Create a booking with a chosen provider (open to guests).
app.get('/add-booking', async (req, res) => {
  const { start_time, date, email_address, first_name, last_name, provider_id } = req.query;

  if (!start_time || !date || !email_address || !first_name || !last_name || !provider_id) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    // Make sure the chosen provider actually exists (and grab their details
    // so we can email them).
    const provider = await db.execute({
      sql: 'SELECT id, first_name, last_name, email_address FROM users WHERE id = ?',
      args: [provider_id],
    });
    if (provider.rows.length === 0) {
      return res.status(404).json({ error: 'That provider does not exist.' });
    }

    await db.execute({
      sql: `INSERT INTO bookings (start_time, date, provider_id, email_address, first_name, last_name)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [start_time, date, provider_id, email_address, first_name, last_name],
    });

    // Notify both parties. Best-effort: a mail failure must not fail the booking.
    sendMeetingEmails(
      { first_name, last_name, email_address, date, start_time },
      provider.rows[0]
    ).catch((err) => console.error('Failed to send meeting emails:', err.message));

    res.json({ message: 'Booking added successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Availability helpers ---
const DEFAULT_AVAILABILITY = { start_hour: 9, end_hour: 17, slot_minutes: 30, days: '1,2,3,4,5' };

async function getAvailability(userId) {
  const r = await db.execute({
    sql: 'SELECT start_hour, end_hour, slot_minutes, days FROM availability WHERE user_id = ?',
    args: [userId],
  });
  return r.rows[0] || { ...DEFAULT_AVAILABILITY };
}

// Build "h:mm AM/PM" slot labels from start_hour to end_hour, stepping by minutes.
function generateSlots(startHour, endHour, stepMinutes) {
  const slots = [];
  for (let mins = startHour * 60; mins < endHour * 60; mins += stepMinutes) {
    const hour = Math.floor(mins / 60);
    const minute = mins % 60;
    const h = hour % 12 === 0 ? 12 : hour % 12;
    const suffix = hour >= 12 ? 'PM' : 'AM';
    slots.push(`${h}:${String(minute).padStart(2, '0')} ${suffix}`);
  }
  return slots;
}

// Return the open slots for a given day and provider, based on that provider's
// availability settings (hours, slot length, and which weekdays they offer).
app.get('/get-available-slots', async (req, res) => {
  const { date, provider_id } = req.query;
  if (!date || !provider_id) {
    return res.status(400).json({ error: 'Date and provider are required.' });
  }

  try {
    const avail = await getAvailability(provider_id);
    const offeredDays = String(avail.days).split(',').map(Number);
    const weekday = new Date(`${date}T00:00:00`).getDay();

    // Provider doesn't work that weekday → no slots.
    if (!offeredDays.includes(weekday)) {
      return res.json([]);
    }

    const result = await db.execute({
      sql: 'SELECT start_time FROM bookings WHERE date = ? AND provider_id = ?',
      args: [date, provider_id],
    });
    const bookedTimes = new Set(result.rows.map((row) => row.start_time));

    const slots = generateSlots(avail.start_hour, avail.end_hour, avail.slot_minutes)
      .filter((t) => !bookedTimes.has(t));
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: a provider's availability, so the booking calendar can grey out days
// they don't offer. Returns days as an array of weekday numbers (0 = Sunday).
app.get('/providers/:id/availability', async (req, res) => {
  try {
    const avail = await getAvailability(req.params.id);
    res.json({
      start_hour: avail.start_hour,
      end_hour: avail.end_hour,
      slot_minutes: avail.slot_minutes,
      days: String(avail.days).split(',').map(Number),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// The logged-in user's own availability settings.
app.get('/availability', requireAuth, async (req, res) => {
  try {
    const avail = await getAvailability(req.user.id);
    res.json({
      start_hour: avail.start_hour,
      end_hour: avail.end_hour,
      slot_minutes: avail.slot_minutes,
      days: String(avail.days).split(',').map(Number),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update the logged-in user's availability settings.
app.put('/availability', requireAuth, async (req, res) => {
  let { start_hour, end_hour, slot_minutes, days } = req.body;
  start_hour = Number(start_hour);
  end_hour = Number(end_hour);
  slot_minutes = Number(slot_minutes);

  if (!Number.isInteger(start_hour) || !Number.isInteger(end_hour) ||
      start_hour < 0 || end_hour > 24 || start_hour >= end_hour) {
    return res.status(400).json({ error: 'Start time must be before end time (0–24).' });
  }
  if (![15, 30, 60].includes(slot_minutes)) {
    return res.status(400).json({ error: 'Slot length must be 15, 30, or 60 minutes.' });
  }
  if (!Array.isArray(days) || days.length === 0 ||
      !days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
    return res.status(400).json({ error: 'Choose at least one valid weekday.' });
  }

  const daysCsv = [...new Set(days)].sort((a, b) => a - b).join(',');

  try {
    await db.execute({
      sql: `INSERT INTO availability (user_id, start_hour, end_hour, slot_minutes, days)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              start_hour = excluded.start_hour,
              end_hour = excluded.end_hour,
              slot_minutes = excluded.slot_minutes,
              days = excluded.days`,
      args: [req.user.id, start_hour, end_hour, slot_minutes, daysCsv],
    });
    res.json({ message: 'Availability updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return the logged-in user's own bookings (people who booked time with them).
app.get('/my-bookings', requireAuth, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM bookings WHERE provider_id = ? ORDER BY date, start_time',
      args: [req.user.id],
    });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update one of the logged-in user's bookings (ownership enforced).
app.put('/bookings/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { start_time, date, email_address, first_name, last_name } = req.body;

  if (!start_time || !date || !email_address || !first_name || !last_name) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const result = await db.execute({
      sql: `UPDATE bookings
            SET start_time = ?, date = ?, email_address = ?, first_name = ?, last_name = ?
            WHERE id = ? AND provider_id = ?`,
      args: [start_time, date, email_address, first_name, last_name, id, req.user.id],
    });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    res.json({ message: 'Booking updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel one of the logged-in user's bookings (ownership enforced).
app.delete('/bookings/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.execute({
      sql: 'DELETE FROM bookings WHERE id = ? AND provider_id = ?',
      args: [id, req.user.id],
    });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    res.json({ message: 'Booking cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize the database, then start the server.
initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
