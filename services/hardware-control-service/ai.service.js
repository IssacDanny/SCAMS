const axios = require('axios');
const AI_API_URL = process.env.AI_API_URL;

if (!AI_API_URL) {
  throw new Error("FATAL ERROR: AI_API_URL is not defined.");
}

/**
 * Calls the external AI service to get the number of people in a room.
 * @param {string} roomId The ID of the room to check.
 * @returns {Promise<number>} The number of humans detected.
 */
const getHumanCount = async (roomId) => {
  const url = `${AI_API_URL}/detect`;
  try {
    const response = await axios.post(url, { roomId });
    return response.data.human_count;
  } catch (error) {
    console.error(`[AI Client] Error getting human count for room ${roomId}:`, error.message);
    // In a real system, we might want to return a specific error or a fallback value.
    // For now, re-throwing is fine.
    throw error;
  }
};

module.exports = {
  getHumanCount,
};