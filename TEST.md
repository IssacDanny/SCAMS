# SCAMS - Smart Campus System

This repository contains the source code for the SCAMS project, a microservice-based application designed to automate and manage university campus facilities.

## System Architecture

The system is built on a microservice architecture, orchestrated with Docker Compose. Key components include:
-   **Kong API Gateway:** The single entry point for all client traffic, handling routing, security, and load balancing.
-   **Authentication Service:** Manages user login and issues JSON Web Tokens (JWTs).
-   **Booking Service:** Handles the creation and retrieval of room bookings.
-   **Scheduler Service:** A time-based worker that monitors upcoming bookings.
-   **Hardware Control Service:** An event-driven worker that simulates controlling physical room hardware.
-   **PostgreSQL:** The primary ACID-compliant database for authentication and booking data.
-   **RabbitMQ:** The event broker for asynchronous communication between services.

## Getting Started

### Prerequisites
-   Docker Desktop
-   A terminal or command-line interface

### Running the System
1.  Clone this repository.
2.  Create a local environment file by copying the template:
    ```bash
    cp .env.example .env
    ```
3.  Build and start all containerized services:
    ```bash
    docker-compose up --build
    ```
The system is now running. The main API Gateway is accessible at `http://localhost:8000`.

## Testing the System's Quality Attributes

This suite of tests is designed to verify the key architectural qualities promised in the system design report.

**First, start the system in a clean state:**
docker-compose down -v && docker-compose up --build```

### Test 1: Dependability - Availability (Self-Healing)

**Objective:** To prove that a critical service automatically recovers from an internal crash.

**Procedure:**
1.  **Get an Authentication Token:** In a separate terminal, navigate to the `test-client` directory and log in. You will need this token for the test.
    ```bash
    cd test-client
    node index.js login
    # Copy the full token string that is printed.
    ```
2.  **Store the Token:** Create a shell variable for your token.
    ```bash
    TOKEN="<paste-your-token-here>"
    ```
3.  **Simulate a Crash:** Trigger the debug endpoint to force the `authentication-service` to exit with a failure code.
    ```bash
    curl --location --request POST 'http://localhost:8000/auth/debug/crash' \
    --header "Authorization: Bearer $TOKEN"
    ```
4.  **Observe:** In your `docker-compose` logs, you will see the `authentication-service` container exit with code 1.
5.  **Verify Recovery:** In a new terminal, run `docker ps`.
    -   **Expected Result:** A new `authentication-service` container will have been started automatically within seconds. The "Up" status will show a shorter time than the other containers. The system has healed itself.

---

### Test 2: Dependability - Reliability (Message Persistence)

**Objective:** To prove that a critical command (event) is not lost if the consuming service is temporarily down.

**Procedure:**
1.  **Stop the Consumer:** In a new terminal, stop the `hardware-control-service` so it cannot process messages.
    ```bash
    docker-compose stop hardware-control-service
    ```
2.  **Publish an Event:** Use the test client to book a room for 1 minute in the future. This will cause the scheduler to publish a `prepare_room_event`.
    ```bash
    # In the test-client terminal
    node index.js book RELIABILITY_TEST_ROOM 1
    ```
3.  **Verify Message is Queued:** Open a browser to the RabbitMQ Management UI at `http://localhost:15672`. Log in with `scams_user` / `scams_password`.
    -   **Expected Result:** On the "Queues" tab, the `prepare_room_queue` will show **1** message in the "Ready" column.
4.  **Restart the Consumer:** Bring the service back online.
    ```bash
    docker-compose start hardware-control-service
    ```
5.  **Verify Processing:**
    -   **Observe Logs:** In your `docker-compose` logs, the `hardware-control-service` will start and immediately process the waiting message, printing the "[HARDWARE CONTROL]" logs.
    -   **Verify Queue is Empty:** Refresh the RabbitMQ UI. The `prepare_room_queue` will now show **0** messages. The command was not lost.

---

### Test 3: Fault Tolerance - Redundancy (High Availability)

**Objective:** To prove the system can withstand the failure of a single service instance without causing downtime.

**Procedure:**
1.  **Stop the System:** `docker-compose down`.
2.  **Start in Scaled Mode:** Start the system, telling Docker to run two instances of the `booking-service`.
    ```bash
    docker-compose up --build --scale booking-service=2
    ```
3.  **Verify Instances:** Run `docker ps`. You should see two `booking-service` containers running with unique names.
4.  **Start Load Generator:** In the `test-client` terminal, get a token and start a loop that continuously queries the booking service.
    ```bash
    # Get a token first with 'node index.js login'
    TOKEN="<paste-your-token-here>"
    while true; do curl --location 'http://localhost:8000/booking/schedule/C101?date=2025-11-21' --header "Authorization: Bearer $TOKEN" -w "\n"; sleep 1; done
    ```
5.  **Simulate a Crash:** While the loop is running, open another terminal. Get the container ID of one of the `booking-service` instances from `docker ps` and kill it.
    ```bash
    docker kill <paste-container-id-here>
    ```
6.  **Observe:**
    -   **Expected Result:** The `while` loop in the other terminal should continue to succeed without interruption. Kong automatically redirects traffic to the remaining healthy instance, providing zero downtime for the user.

---

### Test 4: Fault Tolerance - Diversity (Simulated)

**Objective:** To demonstrate the importance of diverse inputs to prevent systemic failure. This is a thought experiment and a manual test of the shutdown logic.

**Procedure:**
1.  **Book a Room:** Use the test client to book a room for 1 minute in the future.
    ```bash
    # In the test-client terminal
    node index.js book DIVERSITY_TEST_ROOM 1
    ```
2.  **Simulate Occupancy:** After the `hardware-control-service` prepares the room, simulate people being inside.
    ```bash
    node index.js set-ai DIVERSITY_TEST_ROOM 10
    ```
3.  **Wait for the Lecture to "End":** Wait for ~1-2 minutes for the scheduled end time of the booking to pass. The monitoring workflow will start in the background (check the logs).
4.  **Simulate AI Failure:** Tell the mock AI that the room is empty.
    ```bash
    node index.js set-ai DIVERSITY_TEST_ROOM 0
    ```
5.  **Observe:**
    -   **Expected Result:** In the `docker-compose` logs, the `hardware-control-service` will detect 0 humans and immediately issue the shutdown commands ("lights OFF," "door LOCK," etc.). This test proves that the system's shutdown logic is **entirely dependent** on this single sensor input, highlighting the risk that the design report mentioned and justifying the need for a diverse secondary sensor (like a PIR motion detector) in a real-world implementation.
