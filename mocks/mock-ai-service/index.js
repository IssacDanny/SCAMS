const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3004;

// --- In-Memory State ---
// This object will store the number of people in each room.
// The key is the roomId, and the value is the human count.
let roomOccupancy = {};

console.log('[Mock AI] Service starting with empty room occupancy state.');


// --- API Endpoints ---

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Mock AI Service is running.' });
});

// The main "human detection" endpoint
app.post('/detect', (req, res) => {
  const { roomId } = req.body;

  if (!roomId) {
    return res.status(400).json({ error: 'roomId is required in the request body.' });
  }

  // Look up the count for the given room.
  // If the room isn't in our state object, default to 0.
  const count = roomOccupancy[roomId] || 0;

  console.log(`[Mock AI] Detection request for room ${roomId}. Reporting ${count} human(s).`);
  
  res.status(200).json({ human_count: count });
});


// --- Test Control Endpoints ---

// This endpoint allows our tests (or us, via curl) to set the state of the mock.
app.post('/control/set-occupancy', (req, res) => {
  const { roomId, count } = req.body;

  if (!roomId || count === undefined) {
    return res.status(400).json({ error: 'roomId and count are required.' });
  }

  console.log(`[Mock AI CONTROL] Setting occupancy for room ${roomId} to ${count}.`);
  roomOccupancy[roomId] = count;
  
  res.status(200).json({ message: `Occupancy for room ${roomId} set to ${count}.`, state: roomOccupancy });
});

// Endpoint to reset the entire state for clean tests.
app.post('/control/reset', (req, res) => {
  console.log('[Mock AI CONTROL] Resetting all room occupancy states.');
  roomOccupancy = {};
  res.status(200).json({ message: 'All occupancy states have been reset.' });
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Mock AI Service is listening on port ${PORT}`);
});