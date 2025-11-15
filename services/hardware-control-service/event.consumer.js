const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL;
if (!RABBITMQ_URL) {
  throw new Error("FATAL ERROR: RABBITMQ_URL is not defined.");
}

const PREPARE_ROOM_QUEUE = 'prepare_room_queue';
const RETRY_DELAY_MS = 5000;

let channel = null;

/**
 * Connects to RabbitMQ and starts consuming messages from the queue.
 * @param {Function} onMessageCallback The function to call when a message is received.
 */
const connectAndConsume = async (onMessageCallback) => {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();
      
      connection.on('close', () => {
        console.error('[Event Consumer] RabbitMQ connection closed!');
        channel = null;
        process.exit(1);
      });

      await channel.assertQueue(PREPARE_ROOM_QUEUE, { durable: true });

      // This tells RabbitMQ to only send us one message at a time.
      // We must call `channel.ack(msg)` to get the next one.
      channel.prefetch(1);
      
      console.log(`[Event Consumer] Successfully connected to RabbitMQ on attempt ${attempt}. Waiting for messages...`);
      
      // Start consuming messages.
      channel.consume(PREPARE_ROOM_QUEUE, (msg) => {
        if (msg !== null) {
          onMessageCallback(msg); // Pass the raw message to our handler
        }
      });
      return; // Exit loop on success
    } catch (error) {
      console.error(`[Event Consumer] Attempt ${attempt}: Failed to connect. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

/**
 * Acknowledges a message, telling RabbitMQ it has been successfully processed.
 * @param {object} msg The raw message object from the consumer.
 */
const acknowledgeMessage = (msg) => {
  if (channel) {
    channel.ack(msg);
  }
};

module.exports = {
  connectAndConsume,
  acknowledgeMessage,
};