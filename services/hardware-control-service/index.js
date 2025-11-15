require('dotenv').config();
const aiService = require('./ai.service');
const eventConsumer = require('./event.consumer');

const POLLING_INTERVAL_MS = 10000; // Check for people every 10 seconds after a lecture.

/**
 * Simulates controlling physical hardware. In a real system, this would
 * send MQTT commands or make HTTP requests to IoT devices.
 * @param {string} roomId
 * @param {string} device
 * @param {string} state "on" or "off"
 */
const controlHardware = (roomId, device, state) => {
  console.log(`[HARDWARE CONTROL] Command: Turn ${device} ${state.toUpperCase()} for room ${roomId}.`);
};

/**
 * The main workflow for monitoring and securing a room after a lecture ends.
 * @param {string} roomId
 */
const startMonitoringWorkflow = (roomId) => {
  console.log(`[Workflow] Starting post-lecture monitoring for room ${roomId}.`);

  const monitorInterval = setInterval(async () => {
    try {
      const humanCount = await aiService.getHumanCount(roomId);
      console.log(`[Workflow] Polling room ${roomId}: ${humanCount} human(s) detected.`);

      if (humanCount === 0) {
        console.log(`[Workflow] Room ${roomId} is empty. Securing the room.`);
        controlHardware(roomId, 'lights', 'off');
        controlHardware(roomId, 'projector', 'off');
        controlHardware(roomId, 'door', 'lock');
        
        // Stop the polling for this room.
        clearInterval(monitorInterval);
        console.log(`[Workflow] Monitoring stopped for room ${roomId}.`);
      }
    } catch (error) {
      console.error(`[Workflow] Error during monitoring for room ${roomId}:`, error.message);
      // In a real system, you might want to stop polling after too many errors.
    }
  }, POLLING_INTERVAL_MS);
};

/**
 * The handler function that is called for each message from RabbitMQ.
 * @param {object} msg The raw message object from the consumer.
 */
const handlePrepareRoomEvent = (msg) => {
  try {
    const event = JSON.parse(msg.content.toString());
    console.log(`[Event Handler] Received prepare_room_event for booking ${event.bookingId}`);

    const { roomId, startTime } = event;

    // 1. Send commands to prepare the room for the lecture.
    controlHardware(roomId, 'door', 'unlock');
    controlHardware(roomId, 'lights', 'on');
    controlHardware(roomId, 'projector', 'on');

    // 2. Schedule the post-lecture monitoring to start when the lecture ends.
    // We assume all lectures are 1 hour long for this simulation.
    const lectureEndTime = new Date(startTime).getTime() + (60 * 60 * 1000);
    const timeUntilEnd = lectureEndTime - Date.now();

    if (timeUntilEnd > 0) {
      console.log(`[Event Handler] Scheduling monitoring for room ${roomId} to start in ${Math.round(timeUntilEnd / 1000)} seconds.`);
      setTimeout(() => startMonitoringWorkflow(roomId), timeUntilEnd);
    } else {
      // If the lecture has already ended, start monitoring immediately.
      console.log(`[Event Handler] Lecture for room ${roomId} has already ended. Starting monitoring immediately.`);
      startMonitoringWorkflow(roomId);
    }

    // 3. Acknowledge the message so RabbitMQ knows it was processed.
    eventConsumer.acknowledgeMessage(msg);

  } catch (error) {
    console.error('[Event Handler] Error processing message:', error);
    // Here you might want to decide if the message should be rejected or re-queued.
    // For now, we will still acknowledge it to prevent it from being re-processed in a loop.
    eventConsumer.acknowledgeMessage(msg);
  }
};


/**
 * The main startup function for the service.
 */
const main = async () => {
  console.log('--- Starting SCAMS Hardware Control Service ---');
  // Start listening for messages and pass the handler function.
  await eventConsumer.connectAndConsume(handlePrepareRoomEvent);
};

main();