// ============================================================
// index.js - Command-Line Interface for Travel Planner
// ============================================================
// Responsible for terminal I/O, user prompts, input validation,
// and formatted console output. Business logic, calculations,
// and persistent storage are handled by src/tripService.js.

const readline = require('readline');
const tripService = require('./tripService');

// Destructure reusable helper functions and rates from tripService
const {
  formatCurrency,
  calculateEstimatedBudget,
  BUDGET_ESTIMATION_RATES,
  generateItinerary,
} = tripService;

// Create a readline interface connected to standard input (keyboard) and standard output (terminal)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Reference to in-memory trips array managed by tripService
const trips = tripService.getTrips();

// Reference to in-memory packing checklist items managed by tripService
const packingItems = tripService.getPackingItems();

// Function to display the main interactive menu options
function displayMenu() {
  console.log('\n=============================');
  console.log('     TRAVEL PLANNER CLI      ');
  console.log('=============================');
  console.log('1. Create a Trip');
  console.log('2. View Saved Trips');
  console.log('3. Packing Checklist');
  console.log('4. Export Itinerary');
  console.log('5. Manage Trips');
  console.log('6. Exit');
  console.log('=============================');
}

// Function to format and display a clean, readable trip summary in the terminal
function displayTripSummary(trip, successMessage = 'Trip created successfully!') {
  const dayText = trip.days === 1 ? 'day' : 'days';
  const formattedBudget = formatCurrency(trip.budget);

  console.log('\n========================================');
  console.log('              TRIP SUMMARY              ');
  console.log('========================================');
  console.log(`  Destination : ${trip.destination}`);
  console.log(`  Duration    : ${trip.days} ${dayText}`);
  console.log(`  Budget      : ${formattedBudget}`);
  console.log(`  Interests   : ${trip.interests.join(', ')}`);
  console.log('========================================');
  if (successMessage) {
    console.log(successMessage);
  }
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

  if (isWithinBudget) {
    console.log(`  Budget Status             : Within Budget`);
    console.log(`  Remaining Budget          : ${formatCurrency(difference)}`);
  } else {
    const overBudget = Math.abs(difference);
    console.log(`  Budget Status             : Over Budget`);
    console.log(`  Amount Over Budget        : ${formatCurrency(overBudget)}`);
  }

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

      // Delegate trip creation, itinerary generation, budget calculation, and saving to tripService
      const newTrip = tripService.createTrip({
        destination: destination,
        days: days,
        budget: budget,
        interests: interests,
      });

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

      tripService.addPackingItem(name);

      console.log(`Added: "${name}" has been added to your packing checklist.`);
      managePackingChecklist();
    });
  }

  promptItemName();
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

      const item = tripService.togglePackingItem(itemNumber - 1);
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

      try {
        // Delegate export file creation, timestamping, and path resolution to tripService
        const result = tripService.exportTripItinerary(selectedTrip);

        console.log('\n========================================');
        console.log('           EXPORT SUCCESSFUL!           ');
        console.log('========================================');
        console.log('Itinerary exported successfully using latest trip data!');
        console.log(`Saved to : exports/${result.filename}`);
        console.log(`Full path: ${result.filePath}`);
        console.log(`Note     : Export filename is derived from the destination ("${selectedTrip.destination}").`);
        console.log('========================================');

        promptUser();
      } catch (error) {
        console.error(`\n[Export Error] Failed to export itinerary to file: ${error.message}\n`);
        promptUser();
      }
    });
  }

  promptTripSelection();
}

// Function to display the Manage Trips submenu options
function displayManageTripsMenu() {
  console.log('\n=============================');
  console.log('        MANAGE TRIPS         ');
  console.log('=============================');
  console.log('1. Edit a Trip');
  console.log('2. Delete a Trip');
  console.log('3. Return to Main Menu');
  console.log('=============================');
}

// Function to handle Manage Trips submenu interaction
function manageTrips() {
  displayManageTripsMenu();
  rl.question('Please enter your choice (1-3): ', (input) => {
    const choice = input.trim();

    switch (choice) {
      case '1':
        editTrip();
        break;

      case '2':
        deleteTrip();
        break;

      case '3':
        promptUser();
        break;

      default:
        console.log('\nInvalid choice. Please enter a number between 1 and 3.');
        manageTrips();
        break;
    }
  });
}

// Function to select and edit an existing trip
function editTrip() {
  console.log('\n========================================');
  console.log('               EDIT TRIP                ');
  console.log('========================================');

  if (trips.length === 0) {
    console.log('No saved trips available to edit.');
    console.log('Use option 1 from the main menu to create a trip first.');
    console.log('========================================');
    return manageTrips();
  }

  console.log('Available Trips:');
  trips.forEach((trip, index) => {
    const dayText = trip.days === 1 ? 'day' : 'days';
    console.log(`  ${index + 1}. ${trip.destination} (${trip.days} ${dayText})`);
  });
  console.log('========================================');

  function promptTripSelection() {
    rl.question(`Enter the trip number to edit (1-${trips.length}) or 0 to cancel: `, (input) => {
      const trimmed = input.trim();

      if (trimmed === '0') {
        console.log('\nEdit cancelled. Returning to Manage Trips menu.');
        return manageTrips();
      }

      const tripIndex = Number(trimmed);

      if (!trimmed || !Number.isInteger(tripIndex) || tripIndex < 1 || tripIndex > trips.length) {
        console.log(`Error: Please enter a valid trip number between 1 and ${trips.length}.`);
        return promptTripSelection();
      }

      const selectedTrip = trips[tripIndex - 1];
      promptEditDetails(selectedTrip);
    });
  }

  promptTripSelection();
}

// Function to prompt for each trip property, allowing existing values to be preserved on empty input (Enter)
function promptEditDetails(trip) {
  console.log(`\n--- Editing Trip: ${trip.destination} ---`);
  console.log('Press Enter to keep the current value shown in brackets.\n');

  // Step 1: Destination
  function askDestination() {
    rl.question(`Enter destination [Current: ${trip.destination}]: `, (input) => {
      if (input === '') {
        return askDays(trip.destination);
      }

      const destination = input.trim();
      if (!destination) {
        console.log('Error: Destination cannot be empty when changed. Please enter a valid destination or press Enter to keep current.');
        return askDestination();
      }

      askDays(destination);
    });
  }

  // Step 2: Number of days
  function askDays(newDestination) {
    const dayText = trip.days === 1 ? 'day' : 'days';
    rl.question(`Enter number of days [Current: ${trip.days} ${dayText}]: `, (input) => {
      if (input === '') {
        return askBudget(newDestination, trip.days);
      }

      const trimmed = input.trim();
      const days = Number(trimmed);

      if (!trimmed || !Number.isInteger(days) || days <= 0) {
        console.log('Error: Number of days must be a positive whole number (e.g. 1, 2, 5). Please try again.');
        return askDays(newDestination);
      }

      askBudget(newDestination, days);
    });
  }

  // Step 3: Planned budget
  function askBudget(newDestination, newDays) {
    rl.question(`Enter total budget in rupees [Current: ${trip.budget}]: `, (input) => {
      if (input === '') {
        return askInterests(newDestination, newDays, trip.budget);
      }

      const trimmed = input.trim();
      const budget = Number(trimmed);

      if (!trimmed || !Number.isFinite(budget) || budget < 0) {
        console.log('Error: Budget must be a non-negative number (0 or greater). Please try again.');
        return askBudget(newDestination, newDays);
      }

      askInterests(newDestination, newDays, budget);
    });
  }

  // Step 4: Interests
  function askInterests(newDestination, newDays, newBudget) {
    const currentInterestsStr = trip.interests.join(', ');
    rl.question(`Enter interests (comma-separated) [Current: ${currentInterestsStr}]: `, (input) => {
      let finalInterests;

      if (input === '') {
        finalInterests = [...trip.interests];
      } else {
        const interests = input
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);

        if (interests.length === 0) {
          console.log('Error: Please provide at least one valid interest or press Enter to keep current.');
          return askInterests(newDestination, newDays, newBudget);
        }

        finalInterests = interests;
      }

      // Find the index of the trip being edited
      const tripIndex = trips.indexOf(trip);

      // Delegate update, itinerary regeneration, budget recalculation, and export sync to tripService
      const { trip: updatedTrip, exportSyncNote } = tripService.updateTrip(tripIndex, {
        destination: newDestination,
        days: newDays,
        budget: newBudget,
        interests: finalInterests,
      });

      // Display success confirmation, updated summary, itinerary, and budget breakdown
      console.log('\n========================================');
      console.log('       TRIP UPDATED SUCCESSFULLY!       ');
      console.log('========================================');
      displayTripSummary(updatedTrip, 'Trip details updated successfully!');
      if (exportSyncNote) {
        console.log(exportSyncNote);
      }
      displayItinerary(updatedTrip);
      displayBudgetBreakdown(updatedTrip);

      manageTrips();
    });
  }

  askDestination();
}

// Function to select and delete an existing trip with explicit confirmation
function deleteTrip() {
  console.log('\n========================================');
  console.log('              DELETE TRIP               ');
  console.log('========================================');

  if (trips.length === 0) {
    console.log('No saved trips available to delete.');
    console.log('Use option 1 from the main menu to create a trip first.');
    console.log('========================================');
    return manageTrips();
  }

  console.log('Available Trips:');
  trips.forEach((trip, index) => {
    const dayText = trip.days === 1 ? 'day' : 'days';
    console.log(`  ${index + 1}. ${trip.destination} (${trip.days} ${dayText})`);
  });
  console.log('========================================');

  function promptTripSelection() {
    rl.question(`Enter the trip number to delete (1-${trips.length}) or 0 to cancel: `, (input) => {
      const trimmed = input.trim();

      if (trimmed === '0') {
        console.log('\nDeletion cancelled. Returning to Manage Trips menu.');
        return manageTrips();
      }

      const tripIndex = Number(trimmed);

      if (!trimmed || !Number.isInteger(tripIndex) || tripIndex < 1 || tripIndex > trips.length) {
        console.log(`Error: Please enter a valid trip number between 1 and ${trips.length}.`);
        return promptTripSelection();
      }

      const selectedTrip = trips[tripIndex - 1];
      promptDeleteConfirmation(selectedTrip, tripIndex - 1);
    });
  }

  function promptDeleteConfirmation(trip, index) {
    console.log(`\nSelected trip: ${trip.destination} (${trip.days} ${trip.days === 1 ? 'day' : 'days'})`);
    rl.question('Are you sure you want to delete this trip? (yes/no): ', (input) => {
      const answer = input.trim().toLowerCase();

      if (answer === 'yes') {
        // Delegate deletion and saving to tripService (exported files are preserved)
        const removedTrip = tripService.deleteTrip(index);

        console.log('\n========================================');
        console.log('       TRIP DELETED SUCCESSFULLY!       ');
        console.log('========================================');
        console.log(`Trip "${removedTrip.destination}" has been deleted.`);
        console.log(`Remaining saved trips: ${trips.length}`);
        console.log('========================================');
        manageTrips();
      } else {
        console.log('\nDeletion cancelled. No changes were made to your trips.');
        manageTrips();
      }
    });
  }

  promptTripSelection();
}

// Function to prompt the user for input and route their choice
function promptUser() {
  displayMenu();
  rl.question('Please enter your choice (1-6): ', (input) => {
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
        manageTrips();
        break;

      case '6':
        console.log('\nThank you for using Travel Planner CLI. Goodbye!');
        rl.close();
        break;

      default:
        console.log('\nInvalid choice. Please enter a number between 1 and 6.');
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

// Load saved trips from persistent JSON storage at startup via tripService
const savedTrips = tripService.loadTrips();
if (savedTrips.length > 0) {
  console.log(`Loaded ${savedTrips.length} saved ${savedTrips.length === 1 ? 'trip' : 'trips'} from storage.`);
}

promptUser();
