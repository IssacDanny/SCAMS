const express = require('express');
const app = express();
app.use(express.json());

// Configuration: Read port from environment variable, with a default
const PORT = process.env.PORT || 3001;

// --- In-Memory Database & Seed Data ---
// This object simulates our university's room schedule database.
let roomSchedules = {};

const seedData = {
  'C101': {
    '2025-11-20': [
      { hour: 9, status: 'free' },
      { hour: 10, status: 'booked', lecturer: 'Dr. Smith', course: 'CS101' },
      { hour: 11, status: 'free' },
    ]
  },
  'B203': {
    '2025-11-20': [
      { hour: 9, status: 'booked', lecturer: 'Dr. Jones', course: 'SE450' },
      { hour: 10, status: 'booked', lecturer: 'Dr. Jones', course: 'SE450' },
      { hour: 11, status: 'free' },
    ]
  }
};

// Function to reset the data to its initial state for testing
const resetData = () => {
  // Use structuredClone for a deep copy to prevent modifying the original seed
  roomSchedules = JSON.parse(JSON.stringify(seedData));
  console.log('Mock ROMS data has been reset to seed data.');
};

// Initialize with seed data on startup
resetData();


// --- API Endpoints ---

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Mock ROMS API is running.' });
});

// Get the schedule for a specific room on a specific date
app.get('/schedule/:roomId/:date', (req, res) => {
  const { roomId, date } = req.params;
  const room = roomSchedules[roomId];
  
  if (!room || !room[date]) {
    return res.status(404).json({ error: `Schedule not found for room ${roomId} on ${date}` });
  }
  
  res.status(200).json({ schedule: room[date] });
});

// Book a room (update a schedule)
app.post('/schedule/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { date, hour, lecturer, course } = req.body;

  // If the room doesn't exist at all, create it.
  if (!roomSchedules[roomId]) {
    roomSchedules[roomId] = {};
  }
  
  // ROBUSTNESS FIX: If the schedule for the date doesn't exist, create it on the fly.
  if (!roomSchedules[roomId][date]) {
    console.log(`[Mock ROMS] No schedule found for ${date}. Creating a new blank schedule.`);
    // Create a new 24-hour schedule, with all slots free.
    roomSchedules[roomId][date] = Array.from({ length: 24 }, (_, i) => ({ hour: i, status: 'free' }));
  }

  const schedule = roomSchedules[roomId][date];
  const timeSlot = schedule.find(s => s.hour === hour);

  if (!timeSlot) {
    // This should theoretically not happen now, but it's good to keep as a safeguard.
    return res.status(404).json({ error: `Invalid hour: ${hour}` });
  }

  if (timeSlot.status === 'booked') {
    return res.status(409).json({ error: `Conflict: Room ${roomId} is already booked at ${hour}:00` });
  }

  timeSlot.status = 'booked';
  timeSlot.lecturer = lecturer;
  timeSlot.course = course;

  console.log(`[Mock ROMS] Room ${roomId} booked by ${lecturer} at ${hour}:00 on ${date}`);
  res.status(200).json({ message: 'Booking successful', updatedSlot: timeSlot });
});


// --- Test Control Endpoint ---

// Reset the in-memory data to its initial state
app.post('/control/reset', (req, res) => {
  resetData();
  res.status(200).json({ message: 'Mock data has been successfully reset.' });
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Mock ROMS API server is listening on port ${PORT}`);
});