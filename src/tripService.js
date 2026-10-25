// ============================================================
// tripService.js - Business Logic and Storage for Travel Planner
// ============================================================
// This module encapsulates non-UI logic for managing trips,
// calculating budgets, generating itineraries, persistence,
// and file exports. It is designed to be reusable across both
// the existing CLI application and future GUI frameworks (e.g. Electron).

const fs = require('fs');
const path = require('path');

// Storage paths configured relative to this file so they work regardless of process working directory
const DATA_DIR = path.join(__dirname, '..', 'data');
const TRIPS_FILE_PATH = path.join(DATA_DIR, 'trips.json');
const EXPORTS_DIR = path.join(__dirname, '..', 'exports');

// In-memory collection of trips for the current session
let trips = [];

// Flag to indicate if the storage file exists but contains invalid/corrupted JSON
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

// Function to safely load saved trips from data/trips.json
function loadTrips() {
  try {
    ensureDataDirectoryExists();

    if (!fs.existsSync(TRIPS_FILE_PATH)) {
      fs.writeFileSync(TRIPS_FILE_PATH, JSON.stringify([], null, 2), 'utf8');
      trips.length = 0;
      return trips;
    }

    const rawData = fs.readFileSync(TRIPS_FILE_PATH, 'utf8');

    if (!rawData.trim()) {
      trips.length = 0;
      return trips;
    }

    const parsed = JSON.parse(rawData);

    if (!Array.isArray(parsed)) {
      isStorageCorrupted = true;
      console.error(`\n[Storage Warning] "${TRIPS_FILE_PATH}" does not contain a valid JSON array.`);
      console.error('To prevent data loss, automatic saving is disabled until the file is fixed.\n');
      trips.length = 0;
      return trips;
    }

    trips.length = 0;
    trips.push(...parsed);
    return trips;
  } catch (error) {
    isStorageCorrupted = true;
    console.error(`\n[Storage Error] Failed to read or parse "${TRIPS_FILE_PATH}": ${error.message}`);
    console.error('To prevent overwriting existing data, automatic saving is disabled until the file is fixed.\n');
    trips.length = 0;
    return trips;
  }
}

// Function to safely save trips to data/trips.json
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

// Returns the active in-memory trips array
function getTrips() {
  return trips;
}

// Returns a single trip by 0-based index
function getTripByIndex(index) {
  return trips[index];
}

// Helper function to format numbers into Indian Rupee currency format (INR)
function formatCurrency(amount) {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });
}

// Baseline estimation rate constants (in INR)
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

  return 'generic';
}

// Helper function to get an activity suggestion based on interest, time slot, destination, and day number
function getSuggestion(interest, timeSlot, destination, dayNumber) {
  const category = getInterestCategory(interest);
  const slotOptions = ACTIVITY_SUGGESTIONS[category][timeSlot];
  const variationIndex = (dayNumber - 1) % slotOptions.length;
  return slotOptions[variationIndex](destination);
}

// Function to generate a day-by-day itinerary data structure based on trip details and interests
function generateItinerary(trip) {
  const itinerary = [];
  const interests = trip.interests && trip.interests.length > 0 ? trip.interests : ['general'];

  for (let day = 1; day <= trip.days; day++) {
    const morningInterest = interests[((day - 1) * 3 + 0) % interests.length];
    const afternoonInterest = interests[((day - 1) * 3 + 1) % interests.length];
    const eveningInterest = interests[((day - 1) * 3 + 2) % interests.length];

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

// Function to create a new trip with calculated itinerary and budget, saving to storage
function createTrip(tripData) {
  const parsedInterests = Array.isArray(tripData.interests)
    ? tripData.interests
    : tripData.interests
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

  const newTrip = {
    destination: tripData.destination.trim(),
    days: Number(tripData.days),
    budget: Number(tripData.budget),
    interests: parsedInterests,
  };

  newTrip.itinerary = generateItinerary(newTrip);
  newTrip.estimatedBudget = calculateEstimatedBudget(newTrip.days);

  trips.push(newTrip);
  saveTrips();
  return newTrip;
}

// Function to update an existing trip by index, refreshing calculations and syncing export files
function updateTrip(index, updatedData) {
  if (index < 0 || index >= trips.length) {
    throw new Error(`Invalid trip index: ${index}`);
  }

  const trip = trips[index];
  const oldDestination = trip.destination;
  const previousExportFilename = trip.lastExportedFile || sanitizeFilename(oldDestination);
  const previousExportPath = path.join(EXPORTS_DIR, previousExportFilename);
  const hadPreviousExport = fs.existsSync(previousExportPath);

  if (updatedData.destination !== undefined) {
    trip.destination = updatedData.destination.trim();
  }
  if (updatedData.days !== undefined) {
    trip.days = Number(updatedData.days);
  }
  if (updatedData.budget !== undefined) {
    trip.budget = Number(updatedData.budget);
  }
  if (updatedData.interests !== undefined) {
    trip.interests = Array.isArray(updatedData.interests)
      ? updatedData.interests
      : updatedData.interests
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
  }

  trip.itinerary = generateItinerary(trip);
  trip.estimatedBudget = calculateEstimatedBudget(trip.days);

  let exportSyncNote = null;
  if (hadPreviousExport) {
    const newExportFilename = sanitizeFilename(trip.destination);
    const newExportPath = path.join(EXPORTS_DIR, newExportFilename);

    if (newExportFilename !== previousExportFilename) {
      const isUsedByOtherTrip = trips.some(
        (t) => t !== trip && sanitizeFilename(t.destination) === previousExportFilename
      );
      if (!isUsedByOtherTrip && fs.existsSync(previousExportPath)) {
        try {
          fs.unlinkSync(previousExportPath);
        } catch (e) {
          // ignore cleanup error
        }
      }
      exportSyncNote = `[Export Synced] Renamed and updated export file to: exports/${newExportFilename}`;
    } else {
      exportSyncNote = `[Export Synced] Automatically updated existing file: exports/${newExportFilename}`;
    }

    writeTripExportFile(trip, newExportFilename);
    trip.lastExportedFile = newExportFilename;
  } else {
    const targetFilename = sanitizeFilename(trip.destination);
    exportSyncNote = `[Export Note] Export filename will be "exports/${targetFilename}" when exported.`;
  }

  saveTrips();
  return { trip, exportSyncNote };
}

// Function to delete a trip by index, saving to storage
function deleteTrip(index) {
  if (index < 0 || index >= trips.length) {
    throw new Error(`Invalid trip index: ${index}`);
  }

  const removedTrip = trips.splice(index, 1)[0];
  saveTrips();
  return removedTrip;
}

// Helper function to build and write a formatted plain text itinerary file
function writeTripExportFile(trip, filename) {
  ensureExportsDirectoryExists();
  const filePath = path.join(EXPORTS_DIR, filename);

  const dayText = trip.days === 1 ? 'day' : 'days';
  const formattedBudget = formatCurrency(trip.budget);
  const itinerary = (trip.itinerary && trip.itinerary.length === trip.days)
    ? trip.itinerary
    : generateItinerary(trip);
  const estimatedBudget = trip.estimatedBudget || calculateEstimatedBudget(trip.days);

  let content = '';
  content += '============================================================\n';
  content += '                     TRIP ITINERARY                         \n';
  content += '============================================================\n';
  content += `Destination    : ${trip.destination}\n`;
  content += `Duration       : ${trip.days} ${dayText}\n`;
  content += `Planned Budget : ${formattedBudget}\n`;
  if (estimatedBudget) {
    content += `Estimated Cost : ${formatCurrency(estimatedBudget.total)}\n`;
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
  return filePath;
}

// Function to export an itinerary for a trip object, managing filename and sync
function exportTripItinerary(trip) {
  ensureExportsDirectoryExists();

  const filename = sanitizeFilename(trip.destination);

  if (trip.lastExportedFile && trip.lastExportedFile !== filename) {
    const oldExportPath = path.join(EXPORTS_DIR, trip.lastExportedFile);
    const isUsedByOtherTrip = trips.some(
      (t) => t !== trip && sanitizeFilename(t.destination) === trip.lastExportedFile
    );
    if (fs.existsSync(oldExportPath) && !isUsedByOtherTrip) {
      try {
        fs.unlinkSync(oldExportPath);
      } catch (e) {
        // ignore cleanup error
      }
    }
  }

  trip.itinerary = (trip.itinerary && trip.itinerary.length === trip.days)
    ? trip.itinerary
    : generateItinerary(trip);
  trip.estimatedBudget = trip.estimatedBudget || calculateEstimatedBudget(trip.days);

  const filePath = writeTripExportFile(trip, filename);

  trip.lastExportedFile = filename;
  saveTrips();

  return { filename, filePath, trip };
}

// In-memory packing checklist state
const packingItems = [];

// Helper to get all packing items
function getPackingItems() {
  return packingItems;
}

// Helper to add a packing item
function addPackingItem(name) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('Item name cannot be empty.');
  }
  const item = {
    name: name.trim(),
    packed: false,
    id: Date.now() + Math.random().toString(36).substring(2, 7),
  };
  packingItems.push(item);
  return item;
}

// Helper to toggle packing status
function togglePackingItem(index) {
  if (index < 0 || index >= packingItems.length) {
    throw new Error(`Invalid packing item index: ${index}`);
  }
  packingItems[index].packed = !packingItems[index].packed;
  return packingItems[index];
}

// Helper to delete a packing item
function deletePackingItem(index) {
  if (index < 0 || index >= packingItems.length) {
    throw new Error(`Invalid packing item index: ${index}`);
  }
  return packingItems.splice(index, 1)[0];
}

// Trip input validation helper
function validateTripData(tripData) {
  const errors = [];
  if (!tripData || typeof tripData !== 'object') {
    return { valid: false, errors: ['Trip data must be provided as an object.'] };
  }

  const destination = (tripData.destination || '').trim();
  if (!destination) {
    errors.push('Destination cannot be empty.');
  } else if (!/^[a-zA-Z\s\-',.]+$/.test(destination)) {
    errors.push('Destination must contain valid alphabetic characters.');
  }

  const days = Number(tripData.days);
  if (!tripData.days || isNaN(days) || !Number.isInteger(days) || days <= 0) {
    errors.push('Number of days must be a positive whole number greater than 0.');
  }

  const budget = Number(tripData.budget);
  if (tripData.budget === undefined || tripData.budget === null || isNaN(budget) || budget <= 0) {
    errors.push('Budget must be a positive number greater than 0.');
  }

  const interests = Array.isArray(tripData.interests)
    ? tripData.interests
    : (tripData.interests || '').split(',').map((s) => s.trim()).filter(Boolean);

  if (!interests || interests.length === 0) {
    errors.push('Please specify at least one interest (e.g., nature, food, culture).');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// CommonJS module exports
module.exports = {
  // Paths & directory helpers
  DATA_DIR,
  TRIPS_FILE_PATH,
  EXPORTS_DIR,
  ensureDataDirectoryExists,
  ensureExportsDirectoryExists,
  sanitizeFilename,

  // Storage and trips state
  loadTrips,
  saveTrips,
  getTrips,
  getTripByIndex,
  isStorageCorrupted: () => isStorageCorrupted,

  // Formatting & budget calculations
  formatCurrency,
  BUDGET_ESTIMATION_RATES,
  calculateEstimatedBudget,

  // Activity & itinerary generation
  ACTIVITY_SUGGESTIONS,
  getInterestCategory,
  getSuggestion,
  generateItinerary,

  // Trip operations (CRUD)
  validateTripData,
  createTrip,
  updateTrip,
  deleteTrip,

  // Packing Checklist
  getPackingItems,
  addPackingItem,
  togglePackingItem,
  deletePackingItem,

  // Export
  writeTripExportFile,
  exportTripItinerary,
};
