// Import the built-in readline module to handle terminal input/output
const readline = require('readline');

// Create a readline interface connected to standard input (keyboard) and standard output (terminal)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// In-memory storage for trips created during the application session
const trips = [];

// Function to display the main interactive menu options
function displayMenu() {
  console.log('\n=============================');
  console.log('     TRAVEL PLANNER CLI      ');
  console.log('=============================');
  console.log('1. Create a Trip');
  console.log('2. View Saved Trips');
  console.log('3. Packing Checklist');
  console.log('4. Exit');
  console.log('=============================');
}

// Function to collect and validate trip details step by step
function createTrip() {
  console.log('\n--- Create a New Trip ---');

  // Step 1: Destination validation
  function askDestination() {
    rl.question('Enter destination: ', (input) => {
      const destination = input.trim();

      if (!destination) {
        console.log('Error: Destination cannot be empty. Please enter a valid destination.');
        return askDestination();
      }

      askDays(destination);
    });
  }

  // Step 2: Number of days validation (positive integer only)
  function askDays(destination) {
    rl.question('Enter number of days: ', (input) => {
      const trimmed = input.trim();
      const days = Number(trimmed);

      if (!trimmed || !Number.isInteger(days) || days <= 0) {
        console.log('Error: Number of days must be a positive whole number (e.g. 1, 2, 5). Please try again.');
        return askDays(destination);
      }

      askBudget(destination, days);
    });
  }

  // Step 3: Budget validation (non-negative number, allows decimals)
  function askBudget(destination, days) {
    rl.question('Enter total budget in rupees: ', (input) => {
      const trimmed = input.trim();
      const budget = Number(trimmed);

      if (!trimmed || !Number.isFinite(budget) || budget < 0) {
        console.log('Error: Budget must be a non-negative number (0 or greater). Please try again.');
        return askBudget(destination, days);
      }

      askInterests(destination, days, budget);
    });
  }

  // Step 4: Interests validation (comma-separated, at least one valid item)
  function askInterests(destination, days, budget) {
    rl.question('Enter interests (comma-separated, e.g. nature, food, shopping, adventure): ', (input) => {
      const interests = input
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      if (interests.length === 0) {
        console.log('Error: Please provide at least one valid interest. Please try again.');
        return askInterests(destination, days, budget);
      }

      // Create the trip object with validated data
      const newTrip = {
        destination: destination,
        days: days,
        budget: budget,
        interests: interests,
      };

      // Store the trip in the in-memory array
      trips.push(newTrip);

      // Display the trip summary
      console.log('\n--- Trip Summary ---');
      console.log(`Destination : ${newTrip.destination}`);
      console.log(`Days        : ${newTrip.days}`);
      console.log(`Budget (₹)  : ₹${newTrip.budget}`);
      console.log(`Interests   : ${newTrip.interests.join(', ')}`);
      console.log('--------------------');

      // Return to the main menu
      promptUser();
    });
  }

  // Begin with Step 1
  askDestination();
}

// Function to prompt the user for input and route their choice
function promptUser() {
  displayMenu();
  rl.question('Please enter your choice (1-4): ', (input) => {
    const choice = input.trim();

    switch (choice) {
      case '1':
        createTrip();
        break;

      case '2':
        console.log('\nView Saved Trips feature will be implemented in a future commit.');
        promptUser();
        break;

      case '3':
        console.log('\nPacking Checklist feature will be implemented in a future commit.');
        promptUser();
        break;

      case '4':
        console.log('\nThank you for using Travel Planner CLI. Goodbye!');
        rl.close();
        break;

      default:
        console.log('\nInvalid choice. Please enter a number between 1 and 4.');
        promptUser();
        break;
    }
  });
}

// Gracefully handle when the terminal input is closed (e.g., Ctrl+C or rl.close())
rl.on('close', () => {
  process.exit(0);
});

// Initial startup greeting and menu launch
console.log('Welcome to Travel Planner CLI!');
promptUser();

