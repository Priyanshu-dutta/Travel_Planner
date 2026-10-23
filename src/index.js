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

// Function to collect trip details from the user
function createTrip() {
  console.log('\n--- Create a New Trip ---');
  rl.question('Enter destination: ', (destination) => {
    rl.question('Enter number of days: ', (days) => {
      rl.question('Enter total budget in rupees: ', (budget) => {
        rl.question('Enter interests (comma-separated, e.g. nature, food, shopping, adventure): ', (interestsInput) => {
          // Convert comma-separated string to an array of trimmed interest strings
          const interests = interestsInput
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

          // Create the trip object
          const newTrip = {
            destination: destination.trim(),
            days: days.trim(),
            budget: budget.trim(),
            interests: interests,
          };

          // Store the trip in the in-memory array
          trips.push(newTrip);

          // Display the trip summary
          console.log('\n--- Trip Summary ---');
          console.log(`Destination : ${newTrip.destination}`);
          console.log(`Days        : ${newTrip.days}`);
          console.log(`Budget (₹)  : ₹${newTrip.budget}`);
          console.log(`Interests   : ${newTrip.interests.length > 0 ? newTrip.interests.join(', ') : 'None'}`);
          console.log('--------------------');

          // Return to the main menu
          promptUser();
        });
      });
    });
  });
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

