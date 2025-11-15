// This file is the data access layer for the Booking Service.
// It is the ONLY file that should contain SQL queries.

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log('[Booking Repo] Database connection pool created.');

/**
 * Fetches all bookings for a specific room on a given date.
 * @param {string} roomId The ID of the room to check.
 * @param {string} date A date string in 'YYYY-MM-DD' format.
 * @returns {Promise<Array>} A promise that resolves with an array of booking objects.
 */
const getBookingsForRoomByDate = async (roomId, date) => {
  const query = {
    // We cast the start_time to a date to compare it with the input date,
    // ignoring the time-of-day component for the initial lookup.
    text: 'SELECT * FROM booking.bookings WHERE room_id = $1 AND start_time::date = $2::date',
    values: [roomId, date],
  };

  try {
    const result = await pool.query(query);
    return result.rows; // Returns an array, which will be empty if no bookings are found.
  } catch (error) {
    console.error('[Booking Repo] Error fetching bookings:', error.stack);
    throw error; // Re-throw the error to be handled by the service layer.
  }
};

/**
 * Creates a new booking record in the database.
 * @param {object} bookingDetails Contains roomId, lecturerId, courseTitle, startTime, endTime.
 * @returns {Promise<object>} A promise that resolves with the newly created booking object.
 */
const createBooking = async (bookingDetails) => {
  const { roomId, lecturerId, courseTitle, startTime, endTime } = bookingDetails;
  
  const query = {
    text: `
      INSERT INTO booking.bookings (room_id, lecturer_id, course_title, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *; 
    `, // 'RETURNING *' is a PostgreSQL feature that returns the complete new row.
    values: [roomId, lecturerId, courseTitle, startTime, endTime],
  };

  try {
    const result = await pool.query(query);
    return result.rows[0]; // Returns the single, newly created booking object.
  } catch (error)
  {
    console.error('[Booking Repo] Error creating booking:', error.stack);
    // Check for a unique constraint violation (double-booking)
    if (error.code === '23505') { // PostgreSQL's unique violation error code
      const specificError = new Error('This time slot is already booked.');
      specificError.type = 'CONFLICT';
      throw specificError;
    }
    throw error; // Re-throw other errors.
  }
};

module.exports = {
  getBookingsForRoomByDate,
  createBooking,
};