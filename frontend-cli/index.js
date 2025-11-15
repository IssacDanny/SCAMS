const axios = require('axios');
const api = require('./api');

// Use 'let' instead of 'const' to allow for reassignment later.
let inquirer;
let chalk;

// --- STATE AND HANDLER FUNCTIONS (No changes needed in this section) ---
let state = {
  token: null,
  username: 'Guest'
};

const mainMenu = async () => {
    const choices = [];
    if (state.token) {
      choices.push(
        { name: 'View Room Schedule', value: 'view' },
        { name: 'Book a Room', value: 'book' },
        { name: 'Logout', value: 'logout' }
      );
    } else {
      choices.push({ name: 'Login', value: 'login' });
    }
    choices.push({ name: 'Exit', value: 'exit' });
  
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: `Welcome, ${chalk.cyan(state.username)}. What would you like to do?`,
        choices,
      },
    ]);
    return action;
};

const handleLogin = async () => {
  const credentials = await inquirer.prompt([
    { type: 'input', name: 'username', message: 'Username:', default: 'lecturer@university.com' },
    { type: 'password', name: 'password', message: 'Password:', default: 'password123' },
  ]);
  const token = await api.login(credentials.username, credentials.password);
  if (token) {
    state.token = token;
    state.username = credentials.username;
    console.log(chalk.green('✅ Login successful!'));
  } else {
    console.log(chalk.red('❌ Login failed. Please check credentials.'));
  }
};

const handleViewSchedule = async () => {
  const input = await inquirer.prompt([
    { type: 'input', name: 'roomId', message: 'Enter Room ID (e.g., C101):' },
    { type: 'input', name: 'date', message: 'Enter Date (YYYY-MM-DD):', default: '2025-11-21' },
  ]);
  const schedule = await api.getSchedule(state.token, input.roomId, input.date);
  if (schedule) {
    console.log(chalk.yellow(`\n--- Schedule for Room ${input.roomId} on ${input.date} ---`));
    if (schedule.length === 0) {
      console.log('No bookings found for this day.');
    } else {
      console.table(schedule.map(b => ({
        course: b.course_title,
        startTime: new Date(b.start_time).toLocaleTimeString(),
        endTime: new Date(b.end_time).toLocaleTimeString(),
      })));
    }
    console.log(chalk.yellow('-------------------------------------------\n'));
  }
};

const handleCreateBooking = async () => {
  const details = await inquirer.prompt([
      { type: 'input', name: 'roomId', message: 'Room ID:' },
      { type: 'input', name: 'courseTitle', message: 'Course Title:' },
      { type: 'input', name: 'startTime', message: 'Start Time (ISO Format e.g., 2025-11-21T10:00:00.000Z):' },
      { type: 'input', name: 'endTime', message: 'End Time (ISO Format e.g., 2025-11-21T11:00:00.000Z):' },
  ]);
  const booking = await api.createBooking(state.token, details);
  if(booking) {
    console.log(chalk.green('✅ Booking confirmed! Details:'));
    console.log(booking);
  }
};

const main = async () => {
  inquirer = (await import('inquirer')).default;
  chalk = (await import('chalk')).default;

  console.log(chalk.bold.blue('--- SCAMS Frontend Console Client ---'));

  while (true) {
    const action = await mainMenu();
    switch (action) {
      case 'login':
        await handleLogin();
        break;
      case 'view':
        await handleViewSchedule();
        break;
      case 'book':
        await handleCreateBooking();
        break;
      case 'logout':
        state.token = null;
        state.username = 'Guest';
        console.log(chalk.blue('You have been logged out.'));
        break;
      case 'exit':
        return;
    }
    console.log('\n');
  }
};

main();