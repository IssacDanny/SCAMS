require('dotenv').config();
const repository = require('./scheduler.repository');
const publisher = require('./event.publisher');

const POLLING_INTERVAL_MS = 30000; // Check for new bookings every 30 seconds.

/**
 * The main business logic function for a single run of the scheduler.
 */
const checkAndPublishEvents = async () => {
  console.log('[Scheduler] Checking for upcoming bookings...');
  try {
    // 1. Query the database for upcoming bookings (Side effect)
    const upcomingBookings = await repository.findUpcomingBookings();

    if (upcomingBookings.length === 0) {
      console.log('[Scheduler] No upcoming bookings found.');
      return;
    }

    console.log(`[Scheduler] Found ${upcomingBookings.length} upcoming booking(s).`);

    // 2. For each booking, publish a prepare event (Side effect)
    for (const booking of upcomingBookings) {
      publisher.publishPrepareRoomEvent(booking);
      await repository.recordEventAsPublished(booking.id);
    }
  } catch (error) {
    console.error('[Scheduler] An error occurred during the check/publish cycle:', error);
  }
};

/**
 * The main startup function for the service.
 */
const main = async () => {
  console.log('--- Starting SCAMS Scheduler Service ---');
  
  // First, connect to RabbitMQ. The application will exit if this fails.
  await publisher.connectToRabbitMQ();

  // Run the check immediately on startup.
  checkAndPublishEvents();

  // Then, set up a timer to run the check periodically.
  setInterval(checkAndPublishEvents, POLLING_INTERVAL_MS);

  console.log(`[Scheduler] Service started. Polling every ${POLLING_INTERVAL_MS / 1000} seconds.`);
};

// Start the service.
main();