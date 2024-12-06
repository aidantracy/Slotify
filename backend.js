import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize Supabase client
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxb21pbWJzb2F0ZGFjZGJmZnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAzMTc2OTcsImV4cCI6MjA0NTg5MzY5N30.koFJO7zHBC13GkJomC8bT7rQC6OQkGxTzf7FxbWrJTw';
const supabaseUrl = 'https://gqomimbsoatdacdbffyw.supabase.co';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/html', express.static(path.join(__dirname, 'html')));
	
app.get('/', (req, res) => {
  res.sendFile(path.resolve('index.html'));
});

// Serve css files
app.use(express.static('css'));
// Example routes using Supabase
app.get('/get-user', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', 1)
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

app.get('/add-booking', async (req, res) => {
  const { start_time, date, email_address, first_name, last_name } = req.query;
  const provider_id = 1;

  if (!start_time || !date || !email_address || !first_name || !last_name) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  const { error } = await supabase
    .from('bookings')
    .insert([{ start_time, date, email_address, provider_id, first_name, last_name }]);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ message: "Booking added successfully." });
});

app.get('/get-available-slots', async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Date parameter is required." });
  }

  const [month, day, year] = date.split("-");
  const normalizedDate = `${month}-${day}-${year}`;
  const startHour = 7;
  const endHour = 20;

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('start_time')
    .eq('date', normalizedDate);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const allSlots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    const hourFormatted = hour % 12 === 0 ? 12 : hour % 12;
    const suffix = hour >= 12 ? "PM" : "AM";

    for (let minute of [0, 30]) {
      const time = `${hourFormatted}:${minute === 0 ? "00" : "30"} ${suffix}`;
      const isBooked = bookings.some((booking) => booking.start_time === time);

      if (!isBooked) {
        allSlots.push(time);
      }
    }
  }

  res.json(allSlots);
});

app.get('/get-bookings', async (req, res) => {
  const { data, error } = await supabase.from('bookings').select('*');

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

app.post('/add-user', express.json(), async (req, res) => {
  const { name, address, email, phone, company } = req.body;

  //only inserting values that are consistent with the database schema
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email}]);

  if (error) {
    console.log("Error inserting user:", error);
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json({ message: "User added successfully.", data });
});
