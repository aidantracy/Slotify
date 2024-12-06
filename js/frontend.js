const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.0.0/dist/umd/supabase.min.js');

const supabaseUrl = 'https://gqomimbsoatdacdbffyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxb21pbWJzb2F0ZGFjZGJmZnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAzMTc2OTcsImV4cCI6MjA0NTg5MzY5N30.koFJO7zHBC13GkJomC8bT7rQC6OQkGxTzf7FxbWrJTw';
const supabase = createClient(supabaseUrl, supabaseKey);

// Insert a new user into the 'users' table
async function fetchName() {
  const { data, error } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', 1)  
    .single();

  if (error) {
    console.error("Error fetching name:", error.message);
    return null;
  }

  console.log("Name fetched:", data);
  document.getElementById('name').innerHTML = data.first_name + " " + data.last_name;
}

async function insertBooking(startTime, endTime, date, email, firstName, lastName) {
  const { data, error } = await supabase
    .from('bookings')
    .insert([
      {start_time: startTime,
       end_time: endTime, 
       date: date, 
       email_address: email, 
       first_name: firstName, 
       last_name: lastName },
    ]);

  if (error) {
    console.error("Error inserting booking:", error.message);
    return null;
  }

  console.log("Booking inserted:", data);
  return data;
}

async function insertEvents() {
    for (const event of Calendar.events) {
      await this.insertBooking(event);
    }
  }


function getData(query) {
    
}
fetchName();
// Add front end javascript