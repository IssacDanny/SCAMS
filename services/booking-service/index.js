require('dotenv').config();
const express = require('express');

// --- Import all our shell and core components ---
const repository = require('./booking.repository');
const romsService = require('./roms.service');
const core = require('./booking.core');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3003;

// --- API Endpoints ---

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Booking Service is running.' });
});


// --- QUERY Endpoint ---
// Gets the schedule for a specific room on a given day.
app.get('/schedule/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { date } = req.query; // e.g., ?date=2025-11-21

    if (!date) {
      return res.status(400).json({ error: 'A "date" query parameter is required.' });
    }
    
    // Side effect: Call the database repository to fetch data.
    const bookings = await repository.getBookingsForRoomByDate(roomId, date);
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error('[Booking Service] Error getting schedule:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});


// --- COMMAND Endpoint ---
// Creates a new booking for a room.
app.post('/schedule', async (req, res) => {
  try {
    const newBookingRequest = req.body;
    
    // For now, we will hardcode the lecturerId. In a real system,
    // this would be extracted from the decoded JWT provided by Kong.
    const lecturerId = '00000000-0000-0000-0000-000000000001'; // Placeholder
    
    // Side effect: Get existing bookings to validate against.
    const date = newBookingRequest.startTime.split('T')[0];
    const existingBookings = await repository.getBookingsForRoomByDate(newBookingRequest.roomId, date);

    // Call the PURE core logic to make a business decision.
    const validationResult = core.validateBookingRequest(existingBookings, newBookingRequest);

    if (!validationResult.isValid) {
      return res.status(409).json({ error: validationResult.reason }); // 409 Conflict
    }

    // If valid, proceed with side effects...
    // 1. Create the booking in our primary database.
    const finalBookingDetails = { ...newBookingRequest, lecturerId };
    const createdBooking = await repository.createBooking(finalBookingDetails);

    // 2. (Optional but important) Update the legacy system.
    // We do this after our own database is successfully updated.
    await romsService.updateRomsSchedule({
      roomId: createdBooking.room_id,
      date: date,
      hour: new Date(createdBooking.start_time).getUTCHours(),
      lecturer: 'Dr. Smith', // Placeholder
      course: createdBooking.course_title,
    });
    
    res.status(201).json(createdBooking); // 201 Created

  } catch (error) {
    console.error('[Booking Service] Error creating booking:', error);
    if (error.type === 'CONFLICT') {
        return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});


// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`Booking Service is listening on port ${PORT}`);
});