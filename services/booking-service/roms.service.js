// This file is a client for the external Room Management Service (ROMS).
// It isolates the logic for making HTTP requests to that specific API.

const axios = require('axios');

// Get the base URL for the ROMS API from environment variables.
const ROMS_API_URL = process.env.ROMS_API_URL;

if (!ROMS_API_URL) {
  throw new Error("FATAL ERROR: ROMS_API_URL is not defined in environment variables.");
}

/**
 * Updates the legacy ROMS system with a new booking.
 * @param {object} bookingDetails Contains roomId, date, hour, lecturer, course.
 * @returns {Promise<object>} A promise that resolves with the response data from the ROMS API.
 */
const updateRomsSchedule = async (bookingDetails) => {
  const { roomId, date, hour, lecturer, course } = bookingDetails;
  
  const url = `${ROMS_API_URL}/schedule/${roomId}`;
  const payload = {
    date,
    hour,
    lecturer,
    course,
  };

  console.log(`[ROMS Service] Sending booking update to legacy system at ${url}`);

  try {
    const response = await axios.post(url, payload);
    console.log('[ROMS Service] Successfully updated legacy ROMS schedule.');
    return response.data;
  } catch (error) {
    // Axios throws an error for non-2xx responses.
    console.error(`[ROMS Service] Error updating legacy ROMS: ${error.message}`);
    // We create a more specific error to be handled by the main service logic.
    const serviceError = new Error('Failed to update the legacy ROMS system.');
    serviceError.details = error.response ? error.response.data : error.message;
    throw serviceError;
  }
};

module.exports = {
  updateRomsSchedule,
};