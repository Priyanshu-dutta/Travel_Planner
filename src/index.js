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

// Function to format and display a clean, readable trip summary
function displayTripSummary(trip) {
  // Correctly handle singular ("1 day") vs plural ("X days")
  const dayText = trip.days === 1 ? 'day' : 'days';

  // Format budget in Indian Rupees using toLocaleString with en-IN locale
  const formattedBudget = trip.budget.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });

  console.log('\n========================================');
  console.log('              TRIP SUMMARY              ');
  console.log('========================================');
  console.log(`  Destination : ${trip.destination}`);
  console.log(`  Duration    : ${trip.days} ${dayText}`);
  console.log(`  Budget      : ${formattedBudget}`);
  console.log(`  Interests   : ${trip.interests.join(', ')}`);
  console.log('========================================');
  console.log('Trip created successfully!');
}

// Rule-based activity suggestion templates categorized by interest and time slot
const ACTIVITY_SUGGESTIONS = {
  nature: {
    morning: [
      (dest) => `Visit a park, scenic viewpoint, or nature spot in ${dest}.`,
      (dest) => `Take a peaceful morning walk through a botanical garden or park in ${dest}.`,
    ],
    afternoon: [
      (dest) => `Explore a nature trail, scenic lake, or green space in ${dest}.`,
      (dest) => `Visit a popular nature reserve or scenic viewpoint in ${dest}.`,
    ],
    evening: [
      (dest) => `Relax and watch the sunset from a scenic nature viewpoint in ${dest}.`,
      (dest) => `Enjoy a tranquil twilight stroll along a scenic waterfront or park in ${dest}.`,
    ],
  },
  food: {
    morning: [
      (dest) => `Sample popular local breakfast dishes or visit a morning cafe in ${dest}.`,
      (dest) => `Try regional morning bakery specialties and local tea or coffee in ${dest}.`,
    ],
    afternoon: [
      (dest) => `Visit a local food market and try regional street snacks in ${dest}.`,
      (dest) => `Explore local eateries to taste authentic regional lunch dishes in ${dest}.`,
    ],
    evening: [
      (dest) => `Try local cuisine and signature specialties at a traditional restaurant in ${dest}.`,
      (dest) => `Dine at a vibrant night food market or traditional culinary spot in ${dest}.`,
    ],
  },
  adventure: {
    morning: [
      (dest) => `Explore an outdoor activity such as hiking or cycling around ${dest}.`,
      (dest) => `Set out on an energizing morning trek or outdoor trail in ${dest}.`,
    ],
    afternoon: [
      (dest) => `Explore an outdoor activity or exciting adventure sports spot in ${dest}.`,
      (dest) => `Participate in a guided outdoor adventure or recreational trail in ${dest}.`,
    ],
    evening: [
      (dest) => `Unwind after an active day at an open-air cafe or scenic spot in ${dest}.`,
      (dest) => `Relax and share adventure highlights at a scenic gathering spot in ${dest}.`,
    ],
  },
  shopping: {
    morning: [
      (dest) => `Browse local craft stalls and artisan shops for unique souvenirs in ${dest}.`,
      (dest) => `Visit artisan workshops and morning craft boutiques in ${dest}.`,
    ],
    afternoon: [
      (dest) => `Explore local shops or markets in ${dest}.`,
      (dest) => `Wander through traditional bazaars and local shopping streets in ${dest}.`,
    ],
    evening: [
      (dest) => `Stroll through an evening shopping street or night market in ${dest}.`,
      (dest) => `Browse evening souvenir markets and local specialty stores in ${dest}.`,
    ],
  },
  culture: {
    morning: [
      (dest) => `Visit a cultural or historical attraction in ${dest}.`,
      (dest) => `Tour an iconic historical monument or heritage landmark in ${dest}.`,
    ],
    afternoon: [
      (dest) => `Explore a local museum or historical monument in ${dest}.`,
      (dest) => `Visit a cultural heritage center or regional art gallery in ${dest}.`,
    ],
    evening: [
      (dest) => `Attend a cultural performance or take an evening heritage walk in ${dest}.`,
      (dest) => `Experience traditional music, dance, or evening historic street walks in ${dest}.`,
    ],
  },
  generic: {
    morning: [
      (dest) => `Take a morning walk and explore key sights around ${dest}.`,
      (dest) => `Start the day with a relaxed stroll around the town center in ${dest}.`,
    ],
    afternoon: [
      (dest) => `Discover popular local landmarks or scenic spots in ${dest}.`,
      (dest) => `Explore iconic neighborhood spots and public squares in ${dest}.`,
    ],
    evening: [
      (dest) => `Enjoy a relaxed evening stroll and dine at a welcoming local eatery in ${dest}.`,
      (dest) => `Unwind with a quiet evening walk and try dinner at a nearby cafe in ${dest}.`,
    ],
  },
};

// Helper function to map a user-entered interest string to a recognized interest category
function getInterestCategory(interest) {
  const normalized = interest.toLowerCase().trim();

  if (normalized.includes('nature') || normalized.includes('park') || normalized.includes('scenic')) {
    return 'nature';
  }
  if (normalized.includes('food') || normalized.includes('cuisine') || normalized.includes('culinary') || normalized.includes('dining')) {
    return 'food';
  }
  if (normalized.includes('adventure') || normalized.includes('hiking') || normalized.includes('trekking') || normalized.includes('sport')) {
    return 'adventure';
  }
  if (normalized.includes('shopping') || normalized.includes('shop') || normalized.includes('market') || normalized.includes('bazaar')) {
    return 'shopping';
  }
  if (normalized.includes('culture') || normalized.includes('history') || normalized.includes('historical') || normalized.includes('heritage') || normalized.includes('museum')) {
    return 'culture';
  }

  // Sensible generic fallback for unrecognized interests
  return 'generic';
}

// Helper function to get an activity suggestion based on interest, time slot, destination, and day number
function getSuggestion(interest, timeSlot, destination, dayNumber) {
  const category = getInterestCategory(interest);
  const slotOptions = ACTIVITY_SUGGESTIONS[category][timeSlot];
  // Cycle through variations using day number to keep multi-day itineraries diverse
  const variationIndex = (dayNumber - 1) % slotOptions.length;
  return slotOptions[variationIndex](destination);
}

// Function to generate a day-by-day itinerary data structure based on trip details and interests
function generateItinerary(trip) {
  const itinerary = [];
  const interests = trip.interests && trip.interests.length > 0 ? trip.interests : ['general'];

  // Loop through each day from 1 to the total number of days
  for (let day = 1; day <= trip.days; day++) {
    // Rotate through user interests across morning, afternoon, and evening slots
    const morningInterest = interests[((day - 1) * 3 + 0) % interests.length];
    const afternoonInterest = interests[((day - 1) * 3 + 1) % interests.length];
    const eveningInterest = interests[((day - 1) * 3 + 2) % interests.length];

    // Build the plan for the day with all three time slots
    const dayPlan = {
      day: day,
      morning: getSuggestion(morningInterest, 'morning', trip.destination, day),
      afternoon: getSuggestion(afternoonInterest, 'afternoon', trip.destination, day),
      evening: getSuggestion(eveningInterest, 'evening', trip.destination, day),
    };

    itinerary.push(dayPlan);
  }

  return itinerary;
}

// Function to format and display the day-by-day itinerary in the terminal
function displayItinerary(trip) {
  const itinerary = trip.itinerary || generateItinerary(trip);
  const dayText = trip.days === 1 ? 'day' : 'days';

  console.log('\n========================================');
  console.log('      SAMPLE DAY-BY-DAY ITINERARY       ');
  console.log('========================================');
  console.log(`  Destination : ${trip.destination}`);
  console.log(`  Duration    : ${trip.days} ${dayText}`);
  console.log('  Note        : Rule-based example suggestions');
  console.log('========================================');

  itinerary.forEach((item) => {
    console.log(`\nDay ${item.day}:`);
    console.log(`  - Morning   : ${item.morning}`);
    console.log(`  - Afternoon : ${item.afternoon}`);
    console.log(`  - Evening   : ${item.evening}`);
  });

  console.log('\n========================================');
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

      // Generate and attach day-by-day itinerary to the trip object
      newTrip.itinerary = generateItinerary(newTrip);

      // Store the trip in the in-memory array
      trips.push(newTrip);

      // Display the formatted trip summary
      displayTripSummary(newTrip);

      // Display the generated day-by-day itinerary
      displayItinerary(newTrip);

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

