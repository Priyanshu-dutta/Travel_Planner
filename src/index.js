// Import built-in modules to handle terminal I/O, file system, and paths
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Create a readline interface connected to standard input (keyboard) and standard output (terminal)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Storage paths for persistent JSON trip data and itinerary text exports
const DATA_DIR = path.join(__dirname, '..', 'data');
const TRIPS_FILE_PATH = path.join(DATA_DIR, 'trips.json');
const EXPORTS_DIR = path.join(__dirname, '..', 'exports');

// In-memory storage for trips created during or loaded into the application session
const trips = [];

// In-memory storage for packing checklist items
const packingItems = [];

// Flag to track if the storage file exists but contains invalid/corrupted data
let isStorageCorrupted = false;

// Helper function to ensure the data directory exists
function ensureDataDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Helper function to ensure the exports directory exists
function ensureExportsDirectoryExists() {
  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }
}

// Helper function to generate a safe, sanitized filename from a destination string
function sanitizeFilename(destination) {
  const safeName = destination
    .trim()
    .toLowerCase()
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/[^a-z0-9_-]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return `${safeName || 'trip'}_itinerary.txt`;
}

// Function to safely load saved trips from local JSON file
function loadTrips() {
  try {
    ensureDataDirectoryExists();

    // If file does not exist, initialize it with an empty array
    if (!fs.existsSync(TRIPS_FILE_PATH)) {
      fs.writeFileSync(TRIPS_FILE_PATH, JSON.stringify([], null, 2), 'utf8');
      return [];
    }

    const rawData = fs.readFileSync(TRIPS_FILE_PATH, 'utf8');

    // Handle empty file gracefully
    if (!rawData.trim()) {
      return [];
    }

    const parsed = JSON.parse(rawData);

    if (!Array.isArray(parsed)) {
      isStorageCorrupted = true;
      console.error(`\n[Storage Warning] "${TRIPS_FILE_PATH}" does not contain a valid JSON array.`);
      console.error('To prevent data loss, automatic saving is disabled until the file is fixed.\n');
      return [];
    }

    return parsed;
  } catch (error) {
    isStorageCorrupted = true;
    console.error(`\n[Storage Error] Failed to read or parse "${TRIPS_FILE_PATH}": ${error.message}`);
    console.error('To prevent overwriting existing data, automatic saving is disabled until the file is fixed.\n');
    return [];
  }
}

// Function to safely save trips to local JSON file
function saveTrips() {
  if (isStorageCorrupted) {
    console.error(`\n[Storage Warning] Cannot save to "${TRIPS_FILE_PATH}" because the existing file contains invalid JSON.`);
    console.error('The trip was added to this session in memory, but the file was NOT overwritten to prevent data loss.\n');
    return false;
  }

  try {
    ensureDataDirectoryExists();
    fs.writeFileSync(TRIPS_FILE_PATH, JSON.stringify(trips, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`\n[Storage Error] Failed to write trips to "${TRIPS_FILE_PATH}": ${error.message}\n`);
    return false;
  }
}

// Function to display the main interactive menu options
function displayMenu() {
  console.log('\n=============================');
  console.log('     TRAVEL PLANNER CLI      ');
  console.log('=============================');
  console.log('1. Create a Trip');
  console.log('2. View Saved Trips');
  console.log('3. Packing Checklist');
  console.log('4. Export Itinerary');
  console.log('5. Exit');
  console.log('=============================');
}

// Helper function to format numbers into Indian Rupee currency format (INR)
function formatCurrency(amount) {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });
}

// Function to format and display a clean, readable trip summary
function displayTripSummary(trip) {
  // Correctly handle singular ("1 day") vs plural ("X days")
  const dayText = trip.days === 1 ? 'day' : 'days';

  // Format budget in Indian Rupees using formatCurrency helper
  const formattedBudget = formatCurrency(trip.budget);

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

// Baseline estimation rate constants (in INR) used for illustrative budget calculations
const BUDGET_ESTIMATION_RATES = {
  TRANSPORT_FIXED: 2000,        // Fixed estimated transport / travel allowance per trip
  ACCOMMODATION_PER_DAY: 1500,  // Estimated stay / lodging cost per day
  FOOD_PER_DAY: 1000,           // Estimated meal & dining cost per day
  ACTIVITIES_PER_DAY: 500,      // Estimated sightseeing & activity cost per day
};

// Function to calculate estimated trip expenses based on the number of days
function calculateEstimatedBudget(days) {
  const transport = BUDGET_ESTIMATION_RATES.TRANSPORT_FIXED;
  const accommodation = BUDGET_ESTIMATION_RATES.ACCOMMODATION_PER_DAY * days;
  const food = BUDGET_ESTIMATION_RATES.FOOD_PER_DAY * days;
  const activities = BUDGET_ESTIMATION_RATES.ACTIVITIES_PER_DAY * days;
  const total = transport + accommodation + food + activities;

  return {
    transport,
    accommodation,
    food,
    activities,
    total,
  };
}

// Function to format and display the estimated budget breakdown and comparison
function displayBudgetBreakdown(trip) {
  const estimated = trip.estimatedBudget || calculateEstimatedBudget(trip.days);
  const plannedBudget = trip.budget;
  const estimatedTotal = estimated.total;
  const difference = plannedBudget - estimatedTotal;
  const isWithinBudget = difference >= 0;

  console.log('\n========================================');
  console.log('        ESTIMATED TRIP BUDGET           ');
  console.log('========================================');
  console.log(`  Destination               : ${trip.destination}`);
  console.log(`  Duration                  : ${trip.days} ${trip.days === 1 ? 'day' : 'days'}`);
  console.log('  Note                      : Illustrative estimates only (not guaranteed prices)');
  console.log('----------------------------------------');
  console.log('  Expense Breakdown:');
  console.log(`    • Transport (Fixed)     : ${formatCurrency(estimated.transport)}`);
  console.log(`    • Accommodation         : ${formatCurrency(estimated.accommodation)} (${formatCurrency(BUDGET_ESTIMATION_RATES.ACCOMMODATION_PER_DAY)}/day)`);
  console.log(`    • Food                  : ${formatCurrency(estimated.food)} (${formatCurrency(BUDGET_ESTIMATION_RATES.FOOD_PER_DAY)}/day)`);
  console.log(`    • Activities            : ${formatCurrency(estimated.activities)} (${formatCurrency(BUDGET_ESTIMATION_RATES.ACTIVITIES_PER_DAY)}/day)`);
  console.log('----------------------------------------');
  console.log(`  Total Estimated Cost      : ${formatCurrency(estimatedTotal)}`);
  console.log(`  User's Planned Budget     : ${formatCurrency(plannedBudget)}`);
  console.log('----------------------------------------');

  // Budget status and remaining / over-budget calculation
  if (isWithinBudget) {
    console.log(`  Budget Status             : Within Budget`);
    console.log(`  Remaining Budget          : ${formatCurrency(difference)}`);
  } else {
    const overBudget = Math.abs(difference);
    console.log(`  Budget Status             : Over Budget`);
    console.log(`  Amount Over Budget        : ${formatCurrency(overBudget)}`);
  }

  // Percentage of budget used, where meaningful
  if (plannedBudget > 0) {
    const percentageUsed = ((estimatedTotal / plannedBudget) * 100).toFixed(1);
    console.log(`  Percentage of Budget Used : ${percentageUsed}%`);
  } else {
    console.log(`  Percentage of Budget Used : N/A (Planned budget is ₹0.00)`);
  }

  console.log('========================================');
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

      // Calculate and attach estimated budget breakdown
      newTrip.estimatedBudget = calculateEstimatedBudget(newTrip.days);

      // Store the trip in the in-memory array
      trips.push(newTrip);

      // Save trips to persistent JSON file storage
      saveTrips();

      // Display the formatted trip summary
      displayTripSummary(newTrip);

      // Display the generated day-by-day itinerary
      displayItinerary(newTrip);

      // Display the estimated budget breakdown and comparison
      displayBudgetBreakdown(newTrip);

      // Return to the main menu
      promptUser();
    });
  }

  // Begin with Step 1
  askDestination();
}

// Function to display the packing checklist submenu options
function displayPackingMenu() {
  console.log('\n=============================');
  console.log('      PACKING CHECKLIST      ');
  console.log('=============================');
  console.log('1. View packing items');
  console.log('2. Add a packing item');
  console.log('3. Mark an item as packed or unpacked');
  console.log('4. Return to the main menu');
  console.log('=============================');
}

// Function to format and display all packing checklist items
function viewPackingItems() {
  console.log('\n========================================');
  console.log('           PACKING CHECKLIST            ');
  console.log('========================================');

  if (packingItems.length === 0) {
    console.log('Your packing checklist is currently empty.');
    console.log('Use option 2 from the submenu to add an item.');
    console.log('========================================');
    return;
  }

  const totalCount = packingItems.length;
  const packedCount = packingItems.filter((item) => item.packed).length;
  const remainingCount = totalCount - packedCount;

  console.log(`  Total Items : ${totalCount}`);
  console.log(`  Packed      : ${packedCount}`);
  console.log(`  Remaining   : ${remainingCount}`);
  console.log('----------------------------------------');
  packingItems.forEach((item, index) => {
    const statusIcon = item.packed ? '[X]' : '[ ]';
    const statusText = item.packed ? 'Packed' : 'Unpacked';
    console.log(`  ${index + 1}. ${statusIcon} ${item.name} (${statusText})`);
  });
  console.log('----------------------------------------');
  const percentage = Math.round((packedCount / totalCount) * 100);
  console.log(`  Progress: ${packedCount} of ${totalCount} items packed (${percentage}%)`);
  console.log('========================================');
}

// Function to prompt for and add a new packing item
function addPackingItem() {
  console.log('\n--- Add a Packing Item ---');

  function promptItemName() {
    rl.question('Enter item name: ', (input) => {
      const name = input.trim();

      if (!name) {
        console.log('Error: Item name cannot be empty. Please enter a valid item name.');
        return promptItemName();
      }

      packingItems.push({
        name: name,
        packed: false,
      });

      console.log(`Added: "${name}" has been added to your packing checklist.`);
      managePackingChecklist();
    });
  }

  promptItemName();
}

// Function to format and display all saved trips and their summaries
function viewSavedTrips() {
  console.log('\n========================================');
  console.log('              SAVED TRIPS               ');
  console.log('========================================');

  if (trips.length === 0) {
    console.log('No saved trips found.');
    console.log('Use option 1 from the main menu to create a trip.');
    console.log('========================================');
    return;
  }

  const tripText = trips.length === 1 ? 'trip' : 'trips';
  console.log(`  Total Saved : ${trips.length} ${tripText}`);
  console.log('========================================');

  trips.forEach((trip, index) => {
    const dayText = trip.days === 1 ? 'day' : 'days';
    const formattedBudget = formatCurrency(trip.budget);
    const estimatedTotal = trip.estimatedBudget ? formatCurrency(trip.estimatedBudget.total) : 'N/A';

    console.log(`Trip #${index + 1}:`);
    console.log(`  Destination          : ${trip.destination}`);
    console.log(`  Duration             : ${trip.days} ${dayText}`);
    console.log(`  Planned Budget       : ${formattedBudget}`);
    console.log(`  Total Estimated Cost : ${estimatedTotal}`);
    console.log(`  Interests            : ${trip.interests.join(', ')}`);
    if (index < trips.length - 1) {
      console.log('----------------------------------------');
    }
  });

  console.log('========================================');
}

// Function to handle exporting a saved trip's itinerary to a text file
function exportItinerary() {
  console.log('\n========================================');
  console.log('            EXPORT ITINERARY            ');
  console.log('========================================');

  // Check if there are saved trips to export
  if (trips.length === 0) {
    console.log('No saved trips available to export.');
    console.log('Use option 1 from the main menu to create a trip first.');
    console.log('========================================');
    return promptUser();
  }

  console.log('Available Trips:');
  trips.forEach((trip, index) => {
    const dayText = trip.days === 1 ? 'day' : 'days';
    console.log(`  ${index + 1}. ${trip.destination} (${trip.days} ${dayText})`);
  });
  console.log('========================================');

  function promptTripSelection() {
    rl.question(`Enter the trip number to export (1-${trips.length}) or 0 to cancel: `, (input) => {
      const trimmed = input.trim();

      if (trimmed === '0') {
        console.log('\nExport cancelled. Returning to main menu.');
        return promptUser();
      }

      const tripIndex = Number(trimmed);

      if (!trimmed || !Number.isInteger(tripIndex) || tripIndex < 1 || tripIndex > trips.length) {
        console.log(`Error: Please enter a valid trip number between 1 and ${trips.length}.`);
        return promptTripSelection();
      }

      const selectedTrip = trips[tripIndex - 1];
      performTripExport(selectedTrip);
    });
  }

  promptTripSelection();
}

// Function to format and write the trip itinerary to a readable .txt file
function performTripExport(trip) {
  try {
    ensureExportsDirectoryExists();

    const filename = sanitizeFilename(trip.destination);
    const filePath = path.join(EXPORTS_DIR, filename);

    const dayText = trip.days === 1 ? 'day' : 'days';
    const formattedBudget = formatCurrency(trip.budget);
    const itinerary = trip.itinerary && trip.itinerary.length > 0 ? trip.itinerary : generateItinerary(trip);

    // Build the text content for the exported itinerary file
    let content = '';
    content += '============================================================\n';
    content += '                     TRIP ITINERARY                         \n';
    content += '============================================================\n';
    content += `Destination    : ${trip.destination}\n`;
    content += `Duration       : ${trip.days} ${dayText}\n`;
    content += `Planned Budget : ${formattedBudget}\n`;
    if (trip.estimatedBudget) {
      content += `Estimated Cost : ${formatCurrency(trip.estimatedBudget.total)}\n`;
    }
    content += `Interests      : ${trip.interests.join(', ')}\n`;
    content += '============================================================\n\n';
    content += 'DAY-BY-DAY ITINERARY:\n\n';

    itinerary.forEach((item) => {
      content += `Day ${item.day}:\n`;
      content += `  - Morning   : ${item.morning}\n`;
      content += `  - Afternoon : ${item.afternoon}\n`;
      content += `  - Evening   : ${item.evening}\n\n`;
    });

    content += '============================================================\n';
    content += `Exported on : ${new Date().toLocaleString()}\n`;
    content += 'Generated by Travel Planner CLI\n';
    content += '============================================================\n';

    fs.writeFileSync(filePath, content, 'utf8');

    console.log('\n========================================');
    console.log('           EXPORT SUCCESSFUL!           ');
    console.log('========================================');
    console.log('Itinerary exported successfully!');
    console.log(`Saved to : exports/${filename}`);
    console.log(`Full path: ${filePath}`);
    console.log('========================================');

    promptUser();
  } catch (error) {
    console.error(`\n[Export Error] Failed to export itinerary to file: ${error.message}\n`);
    promptUser();
  }
}

// Function to select and toggle an item's packed status
function togglePackingItem() {
  if (packingItems.length === 0) {
    console.log('\nYour packing checklist is currently empty. Please add items before marking them.');
    return managePackingChecklist();
  }

  console.log('\n--- Mark an Item as Packed or Unpacked ---');
  viewPackingItems();

  function promptItemNumber() {
    rl.question(`Enter the item number to toggle (1-${packingItems.length}): `, (input) => {
      const trimmed = input.trim();
      const itemNumber = Number(trimmed);

      if (!trimmed || !Number.isInteger(itemNumber) || itemNumber < 1 || itemNumber > packingItems.length) {
        console.log(`Error: Please enter a valid item number between 1 and ${packingItems.length}.`);
        return promptItemNumber();
      }

      const item = packingItems[itemNumber - 1];
      item.packed = !item.packed;
      const statusText = item.packed ? 'packed' : 'unpacked';
      console.log(`\nUpdated: "${item.name}" is now marked as ${statusText}.`);

      const packedCount = packingItems.filter((i) => i.packed).length;
      console.log(`Checklist status: ${packedCount} of ${packingItems.length} items packed (${packingItems.length - packedCount} remaining).`);

      managePackingChecklist();
    });
  }

  promptItemNumber();
}

// Function to handle packing checklist menu interaction
function managePackingChecklist() {
  displayPackingMenu();
  rl.question('Please enter your choice (1-4): ', (input) => {
    const choice = input.trim();

    switch (choice) {
      case '1':
        viewPackingItems();
        managePackingChecklist();
        break;

      case '2':
        addPackingItem();
        break;

      case '3':
        togglePackingItem();
        break;

      case '4':
        promptUser();
        break;

      default:
        console.log('\nInvalid choice. Please enter a number between 1 and 4.');
        managePackingChecklist();
        break;
    }
  });
}

// Function to prompt the user for input and route their choice
function promptUser() {
  displayMenu();
  rl.question('Please enter your choice (1-5): ', (input) => {
    const choice = input.trim();

    switch (choice) {
      case '1':
        createTrip();
        break;

      case '2':
        viewSavedTrips();
        promptUser();
        break;

      case '3':
        managePackingChecklist();
        break;

      case '4':
        exportItinerary();
        break;

      case '5':
        console.log('\nThank you for using Travel Planner CLI. Goodbye!');
        rl.close();
        break;

      default:
        console.log('\nInvalid choice. Please enter a number between 1 and 5.');
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

// Load saved trips from persistent JSON storage at startup
const savedTrips = loadTrips();
trips.push(...savedTrips);
if (savedTrips.length > 0) {
  console.log(`Loaded ${savedTrips.length} saved ${savedTrips.length === 1 ? 'trip' : 'trips'} from storage.`);
}

promptUser();

