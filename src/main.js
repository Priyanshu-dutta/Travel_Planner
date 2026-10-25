// Main Electron Process for Travel Planner Desktop
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');
const tripService = require('./tripService');

// Ensure trips are loaded from data/trips.json at startup
tripService.loadTrips();

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 980,
    minHeight: 650,
    title: 'Travel Planner — Desktop',
    backgroundColor: '#0f172a',
    titleBarStyle: 'hiddenInset', // clean native look on macOS
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const indexPath = path.join(__dirname, 'renderer', 'index.html');
  mainWindow.loadFile(indexPath);

  if (process.argv.includes('--test-launch')) {
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('ELECTRON_TEST_SUCCESS: Window loaded successfully!');
      setTimeout(() => {
        app.quit();
      }, 1000);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for Trip Operations

// Get all trips
ipcMain.handle('trips:get', async () => {
  try {
    const trips = tripService.getTrips();
    return { success: true, trips };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Create a new trip
ipcMain.handle('trips:create', async (_event, tripData) => {
  try {
    const validation = tripService.validateTripData(tripData);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }
    const newTrip = tripService.createTrip(tripData);
    return { success: true, trip: newTrip };
  } catch (error) {
    return { success: false, errors: [error.message] };
  }
});

// Update an existing trip
ipcMain.handle('trips:update', async (_event, { index, updatedData }) => {
  try {
    const result = tripService.updateTrip(index, updatedData);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Delete a trip
ipcMain.handle('trips:delete', async (_event, index) => {
  try {
    const deletedTrip = tripService.deleteTrip(index);
    return { success: true, trip: deletedTrip };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Export trip itinerary to text file
ipcMain.handle('trips:export', async (_event, index) => {
  try {
    const trip = tripService.getTripByIndex(index);
    if (!trip) {
      return { success: false, error: `Trip not found at index ${index}` };
    }
    const result = tripService.exportTripItinerary(trip);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Calculate budget breakdown dynamically
ipcMain.handle('budget:calculate', async (_event, days) => {
  try {
    const numDays = Math.max(1, Number(days) || 1);
    const breakdown = tripService.calculateEstimatedBudget(numDays);
    return { success: true, breakdown };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get fixed budget rate constants
ipcMain.handle('budget:getRates', async () => {
  return { success: true, rates: tripService.BUDGET_ESTIMATION_RATES };
});

// Packing Checklist IPC handlers
ipcMain.handle('packing:get', async () => {
  return { success: true, items: tripService.getPackingItems() };
});

ipcMain.handle('packing:add', async (_event, name) => {
  try {
    const item = tripService.addPackingItem(name);
    return { success: true, item };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('packing:toggle', async (_event, index) => {
  try {
    const item = tripService.togglePackingItem(index);
    return { success: true, item };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('packing:delete', async (_event, index) => {
  try {
    const item = tripService.deletePackingItem(index);
    return { success: true, item };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Open export folder in native file manager
ipcMain.handle('shell:openExports', async () => {
  try {
    tripService.ensureExportsDirectoryExists();
    await shell.openPath(tripService.EXPORTS_DIR);
    return { success: true, path: tripService.EXPORTS_DIR };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// System and app metadata
ipcMain.handle('app:getInfo', async () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    dataPath: tripService.TRIPS_FILE_PATH,
    exportsPath: tripService.EXPORTS_DIR,
  };
});
