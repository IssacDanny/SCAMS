const axios = require('axios');
const KONG_URL = 'http://localhost:8000';

/**
 * Logs in a user and returns the authentication token.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<string|null>} The JWT token or null on failure.
 */
const login = async (username, password) => {
  try {
    const res = await axios.post(`${KONG_URL}/auth/login`, { username, password });
    return res.data.token;
  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data.error : error.message);
    return null;
  }
};

/**
 * Fetches the schedule for a room on a specific date.
 * @param {string} token The user's JWT.
 * @param {string} roomId The ID of the room.
 * @param {string} date The date in YYYY-MM-DD format.
 * @returns {Promise<Array|null>} An array of bookings or null on failure.
 */
const getSchedule = async (token, roomId, date) => {
  try {
    const res = await axios.get(`${KONG_URL}/booking/schedule/${roomId}?date=${date}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    console.error('Failed to get schedule:', error.response ? error.response.data.message : error.message);
    return null;
  }
};

/**
 * Creates a new booking.
 * @param {string} token The user's JWT.
 * @param {object} bookingDetails The details for the new booking.
 * @returns {Promise<object|null>} The created booking object or null on failure.
 */
const createBooking = async (token, bookingDetails) => {
  try {
    const res = await axios.post(`${KONG_URL}/booking/schedule`, bookingDetails, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    console.error('Booking creation failed:', error.response ? error.response.data.error : error.message);
    return null;
  }
};

module.exports = {
  login,
  getSchedule,
  createBooking,
};