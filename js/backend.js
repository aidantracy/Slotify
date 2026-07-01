import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initDb } from './db.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Resolve paths relative to the project root (one level up from /js).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Serve the static frontend so `npm start` alone serves the whole app.
app.use(express.static(rootDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Get the default provider's name (placeholder until auth exists).
app.get('/get-user', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT first_name, last_name FROM users WHERE id = ?',
      args: [1],
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a booking for a given day/time.
app.get('/add-booking', async (req, res) => {
  const { start_time, date, email_address, first_name, last_name } = req.query;
  const provider_id = 1;

  if (!start_time || !date || !email_address || !first_name || !last_name) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    await db.execute({
      sql: `INSERT INTO bookings (start_time, date, provider_id, email_address, first_name, last_name)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [start_time, date, provider_id, email_address, first_name, last_name],
    });
    res.json({ message: 'Booking added successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return the open 30-minute slots for a given day (7 AM–8 PM), excluding
// times already booked with the default provider.
app.get('/get-available-slots', async (req, res) => {
  const { date } = req.query;
  const provider_id = 1;

  if (!date) {
    return res.status(400).json({ error: 'Date parameter is required.' });
  }

  const startHour = 7;
  const endHour = 20;

  try {
    const result = await db.execute({
      sql: 'SELECT start_time FROM bookings WHERE date = ? AND provider_id = ?',
      args: [date, provider_id],
    });
    const bookedTimes = new Set(result.rows.map((row) => row.start_time));

    const allSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      const hourFormatted = hour % 12 === 0 ? 12 : hour % 12;
      const suffix = hour >= 12 ? 'PM' : 'AM';
      for (const minute of [0, 30]) {
        const time = `${hourFormatted}:${minute === 0 ? '00' : '30'} ${suffix}`;
        if (!bookedTimes.has(time)) {
          allSlots.push(time);
        }
      }
    }
    res.json(allSlots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return all bookings (used by the "My Meetings" page for now).
app.get('/get-bookings', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM bookings ORDER BY date, start_time');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/save a user profile. Maps the profile form's single "name" field to
// first/last name to match the users schema.
app.post('/add-user', express.json(), async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const [first_name, ...rest] = name.trim().split(/\s+/);
  const last_name = rest.join(' ') || null;

  try {
    const result = await db.execute({
      sql: `INSERT INTO users (first_name, last_name, email_address)
            VALUES (?, ?, ?)`,
      args: [first_name, last_name, email],
    });
    res.status(201).json({
      message: 'User added successfully.',
      id: Number(result.lastInsertRowid),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an existing booking (edit its date, time, name, or email).
app.put('/bookings/:id', express.json(), async (req, res) => {
  const { id } = req.params;
  const { start_time, date, email_address, first_name, last_name } = req.body;

  if (!start_time || !date || !email_address || !first_name || !last_name) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const result = await db.execute({
      sql: `UPDATE bookings
            SET start_time = ?, date = ?, email_address = ?, first_name = ?, last_name = ?
            WHERE id = ?`,
      args: [start_time, date, email_address, first_name, last_name, id],
    });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    res.json({ message: 'Booking updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel (delete) a booking.
app.delete('/bookings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.execute({
      sql: 'DELETE FROM bookings WHERE id = ?',
      args: [id],
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
