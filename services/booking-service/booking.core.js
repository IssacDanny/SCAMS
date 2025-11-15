// This is the Functional Core of the Booking Service.
// It contains pure functions that implement the business rules for booking.

/**
 * Checks if a new booking request conflicts with existing bookings.
 * This is a PURE function. It only depends on its inputs.
 * @param {Array<object>} existingBookings An array of booking objects for a specific room and day.
 * @param {object} newBookingRequest The details of the new booking to validate.
 * @returns {{isValid: boolean, reason?: string}} An object indicating if the booking is valid.
 */
const validateBookingRequest = (existingBookings, newBookingRequest) => {
  const newStartTime = new Date(newBookingRequest.startTime);
  const newEndTime = new Date(newBookingRequest.endTime);

  // Rule 1: End time must be after start time.
  if (newStartTime >= newEndTime) {
    return { isValid: false, reason: 'Booking end time must be after the start time.' };
  }

  // Rule 2: Check for overlaps with existing bookings.
  for (const existing of existingBookings) {
    const existingStartTime = new Date(existing.start_time);
    const existingEndTime = new Date(existing.end_time);

    // An overlap occurs if the new booking's start time is before an existing booking's
    // end time, AND the new booking's end time is after the existing booking's start time.
    if (newStartTime < existingEndTime && newEndTime > existingStartTime) {
      return {
        isValid: false,
        reason: `Time slot conflicts with an existing booking from ${existingStartTime.toLocaleTimeString()} to ${existingEndTime.toLocaleTimeString()}.`
      };
    }
  }

  // If no rules are violated, the booking is valid.
  return { isValid: true };
};

module.exports = {
  validateBookingRequest,
};