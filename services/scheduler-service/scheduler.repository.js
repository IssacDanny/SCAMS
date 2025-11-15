// This file is the data access layer for the Scheduler Service.

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
console.log('[Scheduler Repo] Database connection pool created.');

const PREPARATION_WINDOW_MINUTES = 15;

/**
 * Finds all bookings that are starting within the next 15 minutes
 * and have not already been marked as 'prepared'.
 * @returns {Promise<Array>} A promise that resolves with an array of upcoming booking objects.
 */
const findUpcomingBookings = async () => {
  const query = {
    // We are looking for bookings where the start_time is between NOW()
    // and 15 minutes from NOW().
    // We also join against a (yet to be created) 'prepared_events' table
    // to ensure we don't send the same event twice. For now, we simulate this.
    // NOTE: In the future, we will add a real 'prepared_events' table.
    text: `
      SELECT b.* FROM booking.bookings b
      LEFT JOIN scheduler.prepared_events e ON b.id = e.booking_id
      WHERE b.start_time BETWEEN NOW() AND NOW() + INTERVAL '${PREPARATION_WINDOW_MINUTES} minutes'
      AND e.booking_id IS NULL;
    `
  };

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('[Scheduler Repo] Error fetching upcoming bookings:', error.stack);
    throw error;
  }
};

/**
 * Records that a 'prepare_room_event' has been sent for a specific booking.
 * @param {string} bookingId The UUID of the booking.
 * @returns {Promise<void>}
 */
const recordEventAsPublished = async (bookingId) => {
  const query = {
    text: 'INSERT INTO scheduler.prepared_events (booking_id) VALUES ($1)',
    values: [bookingId],
  };

  try {
    await pool.query(query);
  } catch (error) {
    console.error(`[Scheduler Repo] Error recording event for booking ${bookingId}:`, error.stack);
    throw error;
  }
};

module.exports = {
  findUpcomingBookings,
  recordEventAsPublished,
};