// Preload script exposing a secure, isolated IPC bridge to the renderer
const { contextBridge, ipcRenderer } = require('electron');

// Define exposed APIs with strict parameter passing
const api = {
  // Trip management operations
  getTrips: () => ipcRenderer.invoke('trips:get'),
  createTrip: (tripData) => ipcRenderer.invoke('trips:create', tripData),
  updateTrip: (index, updatedData) => ipcRenderer.invoke('trips:update', { index, updatedData }),
  deleteTrip: (index) => ipcRenderer.invoke('trips:delete', index),
  exportTrip: (index) => ipcRenderer.invoke('trips:export', index),

  // Budget calculations
  calculateBudget: (days) => ipcRenderer.invoke('budget:calculate', days),
  getBudgetRates: () => ipcRenderer.invoke('budget:getRates'),

  // Packing checklist operations
  getPackingItems: () => ipcRenderer.invoke('packing:get'),
  addPackingItem: (name) => ipcRenderer.invoke('packing:add', name),
  togglePackingItem: (index) => ipcRenderer.invoke('packing:toggle', index),
  deletePackingItem: (index) => ipcRenderer.invoke('packing:delete', index),

  // Utilities
  openExportsFolder: () => ipcRenderer.invoke('shell:openExports'),
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
};

// Expose in isolated window context
contextBridge.exposeInMainWorld('travelPlannerAPI', api);
// Provide shorthand alias
contextBridge.exposeInMainWorld('api', api);
