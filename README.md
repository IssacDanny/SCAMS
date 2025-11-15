# Frontend Developer Guide: Using the SCAMS Console Client

Welcome to the SCAMS project! This guide will help you get started with the backend API using a simple, interactive console client.

## 1. Purpose

This console client is your bridge to the SCAMS backend. It allows you to perform all the essential user actions—like logging in, viewing room schedules, and creating bookings—directly from your terminal.

Use this tool to:
-   **Understand the API workflow** without needing to write any frontend code yet.
-   **See the exact JSON data structures** returned by the API.
-   **Test API responses** for both successful and failed requests.
-   **Develop your frontend components in parallel** with a working, interactive backend.

## 2. Prerequisites

1.  **Docker Desktop:** The entire backend is containerized. You must have Docker running.
2.  **Node.js and npm:** The console client itself is a Node.js application.

## 3. Setup & Running

You only need to run two terminals: one for the backend and one for the console client.

### Terminal 1: Start the Backend

Navigate to the project's root directory (`scams-monorepo`) and run the master `docker-compose` command.

```bash
# Make sure you are in the root 'scams-monorepo' directory
docker-compose up --build
```
Wait for all the services to start up. The backend is now running and accessible via the API Gateway at `http://localhost:8000`.

### Terminal 2: Start the Frontend Console Client

Navigate to this directory (`frontend-cli`) to run the interactive client.

```bash
# Make sure you are in the 'frontend-cli' directory
# First time only: install dependencies
npm install

# Run the client
node index.js
```

You will be greeted by the main menu. You are now ready to interact with the system.

## 4. Example Workflow: A Lecturer Books a Room

This step-by-step guide walks you through a complete, realistic user journey.

### Step 1: Login

The first thing you must do is authenticate.

1.  At the main menu, select **Login**.
2.  Use the default credentials provided:
    -   **Username:** `lecturer@university.com`
    -   **Password:** `password123`
3.  Upon success, you will see a confirmation, and the main menu will now show new options available only to authenticated users. The client has automatically stored your JWT for subsequent requests.

### Step 2: View a Room's Schedule

Let's check the schedule for room `C101` on November 21st, 2025.

1.  From the main menu, select **View Room Schedule**.
2.  When prompted, enter:
    -   **Room ID:** `C101`
    -   **Date:** `2025-11-21`
3.  **Expected Output:** You will see a table of existing bookings. If no bookings exist (which will be the case on a fresh database), you'll see a "No bookings found" message. This shows you the API returns an empty array `[]` in this case.

### Step 3: Book an Empty Room

Now, let's book a 10 AM lecture for that same room.

1.  From the main menu, select **Book a Room**.
2.  When prompted, enter the following details:
    -   **Room ID:** `C101`
    -   **Course Title:** `Advanced Frontend Development`
    -   **Start Time (ISO Format):** `2025-11-21T10:00:00.000Z`
    -   **End Time (ISO Format):** `2025-11-21T11:00:00.000Z`
3.  **Expected Output:** Upon success, the console will print a confirmation and the full JSON object for the booking you just created. This is the exact object the API returns from a successful `POST` request.

    ```json
    {
      "id": "some-uuid-string",
      "room_id": "C101",
      "lecturer_id": "some-uuid-string",
      "course_title": "Advanced Frontend Development",
      "start_time": "2025-11-21T10:00:00.000Z",
      "end_time": "2025-11-21T11:00:00.000Z",
      "created_at": "..."
    }
    ```

### Step 4: Verify Your Booking

Let's check the schedule again to confirm our booking was saved.

1.  Select **View Room Schedule** again.
2.  Enter the same details:
    -   **Room ID:** `C101`
    -   **Date:** `2025-11-21`
3.  **New Expected Output:** The schedule table will now contain the booking you just made.

    ```
    --- Schedule for Room C101 on 2025-11-21 ---
    ┌─────────┬───────────────────────────────────┬───────────┬───────────┐
    │ (index) │              course               │ startTime │  endTime  │
    ├─────────┼───────────────────────────────────┼───────────┼───────────┤
    │    0    │ 'Advanced Frontend Development' │ '5:00:00 PM' │ '6:00:00 PM' │
    └─────────┴───────────────────────────────────┴───────────┴───────────┘
    -------------------------------------------
    ```
    *(Note: Times will be displayed in your local timezone.)*

### Step 5: Test an Error Case (Double Booking)

Finally, let's see what happens when we try to book a time slot that is already taken.

1.  Select **Book a Room** again.
2.  Enter the **exact same details** as in Step 3.
3.  **Expected Output:** The API will reject the request with a `409 Conflict` error, and the client will display the error message from the server.

    ```
    Booking creation failed: This time slot conflicts with an existing booking...
    ```
    This shows you the exact error message you need to handle in your UI.

---

By following this workflow, you now have a complete picture of the API's behavior, its data structures, and its authentication requirements. Happy coding
