const axios = require('axios');

const KONG_URL = 'http://localhost:8000';
const AI_MOCK_URL = 'http://localhost:3004';
let authToken = null; // We will store the JWT here

// --- API Client Functions ---

const login = async (username, password) => {
  try {
    const res = await axios.post(`${KONG_URL}/auth/login`, { username, password });
    authToken = res.data.token;
    console.log('✅ Login successful. Token stored.');
  } catch (error) {
    console.error('❌ Login failed:', error.response ? error.response.data : error.message);
  }
};

const createBooking = async (roomId, minsFromNow) => {
  if (!authToken) {
    console.error('❌ Cannot create booking. Please login first.');
    return;
  }
  const startTime = new Date(Date.now() + minsFromNow * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1-hour lecture

  try {
    const res = await axios.post(`${KONG_URL}/booking/schedule`, {
      roomId,
      courseTitle: `Test Lecture for ${roomId}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(`✅ Booking created successfully for room ${roomId} at ${startTime.toLocaleTimeString()}`);
    console.log('   Booking ID:', res.data.id);
  } catch (error) {
    console.error('❌ Booking failed:', error.response ? error.response.data : error.message);
  }
};

const setAIOccupancy = async (roomId, count) => {
  try {
    await axios.post(`${AI_MOCK_URL}/control/set-occupancy`, { roomId, count: parseInt(count, 10) });
    console.log(`✅ Mock AI: Occupancy for room ${roomId} set to ${count}.`);
  } catch (error) {
    console.error('❌ Failed to set AI occupancy:', error.message);
  }
};

const resetAIMock = async () => {
    try {
        await axios.post(`${AI_MOCK_URL}/control/reset`);
        console.log('✅ Mock AI: All occupancy states have been reset.');
    } catch (error) {
        console.error('❌ Failed to reset AI mock:', error.message);
    }
}

// --- Main CLI Logic ---

const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('\n--- SCAMS Test Client ---');

  switch (command) {
    case 'login':
      await login('lecturer@university.com', 'password123');
      break;
    case 'book':
      // Usage: node index.js book <roomId> <minutesFromNow>
      await login('lecturer@university.com', 'password123'); // Auto-login for convenience
      await createBooking(args[1], parseInt(args[2], 10));
      break;
    case 'set-ai':
      // Usage: node index.js set-ai <roomId> <count>
      await setAIOccupancy(args[1], args[2]);
      break;
    case 'reset-ai':
      await resetAIMock();
      break;
    default:
      console.log('Available Commands:');
      console.log('  login                               - Authenticates and stores the token.');
      console.log('  book <roomId> <minutesFromNow>      - Books a room for a lecture starting in X minutes.');
      console.log('  set-ai <roomId> <count>             - Sets the human count for a room in the mock AI.');
      console.log('  reset-ai                            - Resets the entire state of the mock AI.');
  }
  console.log('-----------------------\n');
};

main();