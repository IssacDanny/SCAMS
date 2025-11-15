// This file is the new "Imperative Shell" data layer, interacting with PostgreSQL.
const { Pool } = require('pg');

// --- CRITICAL DEBUGGING STEP ---
// Log the environment variable to see if it's being passed correctly.
console.log(`[Auth Service] DATABASE_URL is: ${process.env.DATABASE_URL}`);

// The pool will now EXPLICITLY use the connection string from the environment.
// If DATABASE_URL is undefined, this will throw an error, which is better than
// silently trying to connect to localhost.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log('[Auth Service] Database connection pool configured.');

/**
 * An impure function that queries the real PostgreSQL database.
 * @param {string} username The username to look for.
 * @returns {Promise<object|null>} A promise that resolves with the user object or null if not found.
 */
const findUserByUsername = async (username) => {
  const query = {
    text: 'SELECT id, username, password_hash as "passwordHash", role FROM auth.users WHERE username = $1',
    values: [username],
  };

  try {
    const result = await pool.query(query);
    return result.rows[0] || null;
  } catch (error) {
    console.error('[Auth Service] Error executing query', error.stack);
    throw error;
  }
};

module.exports = { findUserByUsername };