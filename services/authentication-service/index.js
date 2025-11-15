const express = require('express');
const { findUserByUsername } = require('./db');
const { loginUser } = require('./auth-core');

const app = express();
app.use(express.json());

// --- Configuration (Impure part of the shell) ---
const PORT = process.env.AUTH_PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
  process.exit(1); // Exit if critical configuration is missing
}

// --- API Endpoints (The Shell's main responsibility) ---

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Authentication Service is running.' });
});

// Login endpoint
app.post('/auth/login', async (req, res) => {
  try {
    // 1. Extract data from request
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // 2. Interact with external systems (database)
    const userFromDb = await findUserByUsername(username);
    
    // --- ADD THIS DEBUGGING LINE ---
    console.log('[Auth Service] User object fetched from DB:', userFromDb);

    // 3. Call the pure core logic
    const result = loginUser({ username, password }, userFromDb, JWT_SECRET);

    // 4. Send HTTP response
    if (result.success) {
      res.status(200).json({ token: result.token });
    } else {
      res.status(401).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// A protected endpoint to test JWT authentication
app.post('/auth/me', (req, res) => {
  // Note: In a real service, we would have middleware here to decode the JWT
  // and attach the user to the request. For now, Kong handles the protection,
  // so if the request gets here, it's already authenticated.
  // Kong can even be configured to pass the decoded JWT payload as headers.
  res.status(200).json({ 
    message: "You have accessed a protected route successfully!",
    // In a real scenario, you'd get this info from the decoded token headers.
    user: "lecturer@university.com" 
  });
});

// This endpoint is intentionally unsafe and is used to test our restart policy.
app.post('/auth/debug/crash', (req, res) => {
  console.error('[Auth Service] DEBUG: Received /crash command. Forcing a process exit.');
  res.status(200).json({ message: 'Crashing now.' });
  
  // Exit the Node.js process with a failure code after a short delay
  // to ensure the HTTP response has time to be sent.
  setTimeout(() => {
    process.exit(1);
  }, 500);
});

// --- Server Startup (Side effect) ---
app.listen(PORT, () => {
  console.log(`Authentication Service is listening on port ${PORT}`);
});