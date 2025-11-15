// This file is the client for publishing messages to the RabbitMQ event broker.

const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL;
if (!RABBITMQ_URL) {
  throw new Error("FATAL ERROR: RABBITMQ_URL is not defined.");
}

// We will use a single, durable queue for preparing rooms.
const PREPARE_ROOM_QUEUE = 'prepare_room_queue';
const RETRY_DELAY_MS = 5000;

let channel = null;

/**
 * Connects to RabbitMQ and creates a channel.
 * This is an impure function with side effects.
 */
const connectToRabbitMQ = async () => {
  let attempt = 0;
  while (true) { // Loop indefinitely until a connection is made
    attempt++;
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();
      
      // Handle connection closing
      connection.on('close', () => {
        console.error('[Event Publisher] RabbitMQ connection closed!');
        channel = null;
        // Optionally, trigger a reconnection process or exit
        process.exit(1);
      });

      await channel.assertQueue(PREPARE_ROOM_QUEUE, { durable: true });
      
      console.log(`[Event Publisher] Successfully connected to RabbitMQ on attempt ${attempt}.`);
      return; // Exit the loop on successful connection
    } catch (error) {
      console.error(`[Event Publisher] Attempt ${attempt}: Failed to connect to RabbitMQ. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      console.error(`[Event Publisher] Error details: ${error.message}`);
      
      // Wait for a few seconds before the next attempt
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

/**
 * Publishes a 'prepare_room_event' to the queue.
 * @param {object} booking The booking object that triggered the event.
 */
const publishPrepareRoomEvent = (booking) => {
  if (!channel) {
    console.error('[Event Publisher] Channel is not available. Cannot publish event.');
    return;
  }

  const eventPayload = {
    bookingId: booking.id,
    roomId: booking.room_id,
    startTime: booking.start_time,
  };

  // Convert the event payload to a buffer for sending.
  const message = Buffer.from(JSON.stringify(eventPayload));

  // Send the message to the queue. 'persistent: true' ensures the message
  // will be saved to disk and survive a RabbitMQ restart.
  channel.sendToQueue(PREPARE_ROOM_QUEUE, message, { persistent: true });

  console.log(`[Event Publisher] Sent prepare_room_event for booking ${booking.id} (Room: ${booking.room_id})`);
};

module.exports = {
  connectToRabbitMQ,
  publishPrepareRoomEvent,
};