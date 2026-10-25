// Desktop Renderer JavaScript for Travel Planner
// Communicates with Electron Main Process exclusively via window.travelPlannerAPI

document.addEventListener('DOMContentLoaded', () => {
  const api = window.travelPlannerAPI || window.api;

  if (!api) {
    console.error('Travel Planner API bridge is not available in window context.');
    return;
  }

  // Application State
  const state = {
    currentView: 'dashboard',
    trips: [],
    selectedItineraryIndex: 0,
    selectedBudgetIndex: 0,
    packingItems: [],
    packingFilter: 'all',
    searchQuery: '',
    pendingDeleteIndex: null,
    editingTripIndex: null,
  };

  // DOM Elements Cache
  const elements = {
    // Navigation
    navButtons: document.querySelectorAll('.nav-item'),
    viewSections: document.querySelectorAll('.view-section'),
    pageTitle: document.getElementById('page-title'),
    pageSubtitle: document.getElementById('page-subtitle'),
    sidebarTripsCount: document.getElementById('sidebar-trips-count'),
    headerBtnCreate: document.getElementById('header-btn-create'),
    btnOpenExports: document.getElementById('btn-open-exports'),
    btnViewAllTrips: document.getElementById('btn-view-all-trips'),

    // Dashboard
    statTotalTrips: document.getElementById('stat-total-trips'),
    statTotalDays: document.getElementById('stat-total-days'),
    statTotalBudget: document.getElementById('stat-total-budget'),
    statTotalEstimate: document.getElementById('stat-total-estimate'),
    dashboardRecentTrips: document.getElementById('dashboard-recent-trips'),

    // My Trips
    tripSearchInput: document.getElementById('trip-search-input'),
    tripsFilterStats: document.getElementById('trips-filter-stats'),
    tripsContainer: document.getElementById('trips-container'),

    // Create Trip Form & Preview
    createForm: document.getElementById('create-trip-form'),
    createErrorBanner: document.getElementById('create-error-banner'),
    tripDestination: document.getElementById('trip-destination'),
    tripDays: document.getElementById('trip-days'),
    tripBudget: document.getElementById('trip-budget'),
    interestPillsContainer: document.getElementById('interest-pills-container'),
    tripCustomInterests: document.getElementById('trip-custom-interests'),
    btnSubmitTrip: document.getElementById('btn-submit-trip'),
    btnCancelCreate: document.getElementById('btn-cancel-create'),

    // Live Preview
    previewDaysCount: document.getElementById('preview-days-count'),
    previewValTransport: document.getElementById('preview-val-transport'),
    previewValAccommodation: document.getElementById('preview-val-accommodation'),
    previewValFood: document.getElementById('preview-val-food'),
    previewValActivities: document.getElementById('preview-val-activities'),
    previewValTotal: document.getElementById('preview-val-total'),
    previewBudgetStatus: document.getElementById('preview-budget-status'),

    // Itinerary
    itineraryTripSelect: document.getElementById('itinerary-trip-select'),
    btnExportItinerary: document.getElementById('btn-export-itinerary'),
    itineraryContent: document.getElementById('itinerary-content'),

    // Budget
    budgetTripSelect: document.getElementById('budget-trip-select'),
    budgetContent: document.getElementById('budget-content'),

    // Packing
    packingStatusBadge: document.getElementById('packing-status-badge'),
    packingProgressFill: document.getElementById('packing-progress-fill'),
    newPackingItemInput: document.getElementById('new-packing-item-input'),
    btnAddPackingItem: document.getElementById('btn-add-packing-item'),
    packingFilterTabs: document.querySelectorAll('.packing-filter-tabs .tab-btn'),
    packingItemsList: document.getElementById('packing-items-list'),

    // Confirmation Modal
    confirmModal: document.getElementById('confirm-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalMessage: document.getElementById('modal-message'),
    modalBtnCancel: document.getElementById('modal-btn-cancel'),
    modalBtnConfirm: document.getElementById('modal-btn-confirm'),

    // Edit Trip Modal
    editTripModal: document.getElementById('edit-trip-modal'),
    editModalBtnClose: document.getElementById('edit-modal-btn-close'),
    editModalBtnCancel: document.getElementById('edit-modal-btn-cancel'),
    editForm: document.getElementById('edit-trip-form'),
    editErrorBanner: document.getElementById('edit-error-banner'),
    editTripDestination: document.getElementById('edit-trip-destination'),
    editTripDays: document.getElementById('edit-trip-days'),
    editTripBudget: document.getElementById('edit-trip-budget'),
    editInterestPillsContainer: document.getElementById('edit-interest-pills-container'),
    editTripCustomInterests: document.getElementById('edit-trip-custom-interests'),
    editPreviewTotal: document.getElementById('edit-preview-total'),
    editPreviewStatus: document.getElementById('edit-preview-status'),
    btnSaveEditTrip: document.getElementById('btn-save-edit-trip'),

    // Toast
    toastContainer: document.getElementById('toast-container'),
  };

  // View Titles & Subtitles Mapping
  const viewMetadata = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Overview of your travel journeys and planned itineraries',
    },
    trips: {
      title: 'My Trips',
      subtitle: 'Browse and manage all your saved trips',
    },
    create: {
      title: 'Plan a New Trip',
      subtitle: 'Generate customized day-by-day itineraries and budget estimates',
    },
    itinerary: {
      title: 'Day-by-Day Itinerary',
      subtitle: 'Explore full daily schedules tailored to your interests',
    },
    budget: {
      title: 'Budget Analysis',
      subtitle: 'Compare planned budgets against estimated costs',
    },
    packing: {
      title: 'Packing Checklist',
      subtitle: 'Track essential gear, clothing, and documents for your trip',
    },
  };

  // Currency Formatter Helper
  function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  }

  // Toast Notification System with optional action button
  function showToast(message, type = 'info', action = null) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;

    if (action && action.label && action.onClick) {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'toast-action-btn';
      actionBtn.textContent = action.label;
      actionBtn.onclick = (e) => {
        e.stopPropagation();
        action.onClick();
      };
      toast.appendChild(actionBtn);
    }

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'all 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // Delete Confirmation Modal System
  function openDeleteModal(tripIndex) {
    const trip = state.trips[tripIndex];
    if (!trip) return;

    state.pendingDeleteIndex = tripIndex;
    elements.modalTitle.textContent = `Delete Trip to ${trip.destination}?`;
    elements.modalMessage.textContent = `Are you sure you want to delete your ${trip.days}-day trip to ${trip.destination}? Exported text files will remain preserved in your exports folder.`;
    elements.confirmModal.style.display = 'flex';
  }

  function closeDeleteModal() {
    state.pendingDeleteIndex = null;
    elements.confirmModal.style.display = 'none';
  }

  elements.modalBtnCancel.addEventListener('click', closeDeleteModal);
  elements.confirmModal.addEventListener('click', (e) => {
    if (e.target === elements.confirmModal) closeDeleteModal();
  });

  elements.modalBtnConfirm.addEventListener('click', async () => {
    if (state.pendingDeleteIndex === null) return;
    const indexToDelete = state.pendingDeleteIndex;
    closeDeleteModal();

    try {
      const response = await api.deleteTrip(indexToDelete);
      if (response.success) {
        showToast(`Trip to "${response.trip.destination}" was deleted.`, 'success');
        await loadTripsData();
        // Adjust selected dropdown indices if needed
        if (state.selectedItineraryIndex >= state.trips.length) {
          state.selectedItineraryIndex = Math.max(0, state.trips.length - 1);
        }
        if (state.selectedBudgetIndex >= state.trips.length) {
          state.selectedBudgetIndex = Math.max(0, state.trips.length - 1);
        }
        renderCurrentView();
      } else {
        showToast(`Failed to delete trip: ${response.error}`, 'error');
      }
    } catch (err) {
      showToast(`Error deleting trip: ${err.message}`, 'error');
    }
  });

  // Edit Trip Modal System
  function openEditModal(tripIndex) {
    const trip = state.trips[tripIndex];
    if (!trip) return;

    state.editingTripIndex = tripIndex;
    elements.editErrorBanner.style.display = 'none';
    elements.editErrorBanner.innerHTML = '';

    elements.editTripDestination.value = trip.destination || '';
    elements.editTripDays.value = trip.days || 1;
    elements.editTripBudget.value = trip.budget || 0;

    // Synchronize interest pill selections
    const currentInterests = (trip.interests || []).map((i) => String(i).toLowerCase().trim());
    const pillButtons = elements.editInterestPillsContainer.querySelectorAll('.pill-chip');
    const knownPills = [];

    pillButtons.forEach((pill) => {
      const val = pill.dataset.value.toLowerCase();
      knownPills.push(val);
      const isSelected = currentInterests.includes(val);
      pill.classList.toggle('selected', isSelected);
    });

    // Populate custom interests with items not present in pill options
    const customInterests = currentInterests.filter((i) => !knownPills.includes(i));
    elements.editTripCustomInterests.value = customInterests.join(', ');

    updateEditModalPreview();
    elements.editTripModal.style.display = 'flex';
  }

  function closeEditModal() {
    state.editingTripIndex = null;
    elements.editTripModal.style.display = 'none';
    elements.editErrorBanner.style.display = 'none';
  }

  async function updateEditModalPreview() {
    const days = Math.max(1, Number(elements.editTripDays.value) || 1);
    const plannedBudget = Number(elements.editTripBudget.value) || 0;

    try {
      const res = await api.calculateBudget(days);
      if (res.success && res.breakdown) {
        const total = res.breakdown.total;
        elements.editPreviewTotal.textContent = formatCurrency(total);

        const diff = plannedBudget - total;
        if (plannedBudget <= 0) {
          elements.editPreviewStatus.textContent = '';
        } else if (diff >= 0) {
          elements.editPreviewStatus.innerHTML = `<span style="color: #34d399;">✓ Within budget (+${formatCurrency(diff)})</span>`;
        } else {
          elements.editPreviewStatus.innerHTML = `<span style="color: #fbbf24;">⚠️ Exceeds budget (-${formatCurrency(Math.abs(diff))})</span>`;
        }
      }
    } catch (err) {
      console.error('Failed to calculate edit preview budget:', err);
    }
  }

  elements.editInterestPillsContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill-chip');
    if (pill) {
      pill.classList.toggle('selected');
    }
  });

  elements.editTripDays.addEventListener('input', updateEditModalPreview);
  elements.editTripBudget.addEventListener('input', updateEditModalPreview);

  elements.editModalBtnClose.addEventListener('click', closeEditModal);
  elements.editModalBtnCancel.addEventListener('click', closeEditModal);
  elements.editTripModal.addEventListener('click', (e) => {
    if (e.target === elements.editTripModal) closeEditModal();
  });

  elements.editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.editingTripIndex === null) return;

    elements.editErrorBanner.style.display = 'none';
    elements.editErrorBanner.innerHTML = '';

    const selectedPills = Array.from(
      elements.editInterestPillsContainer.querySelectorAll('.pill-chip.selected')
    ).map((p) => p.dataset.value);

    const customInterests = elements.editTripCustomInterests.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const combinedInterests = Array.from(new Set([...selectedPills, ...customInterests]));

    const updatedData = {
      destination: elements.editTripDestination.value.trim(),
      days: Number(elements.editTripDays.value),
      budget: Number(elements.editTripBudget.value),
      interests: combinedInterests,
    };

    elements.btnSaveEditTrip.disabled = true;
    elements.btnSaveEditTrip.textContent = 'Saving Changes...';

    try {
      const response = await api.updateTrip(state.editingTripIndex, updatedData);

      if (!response.success) {
        elements.editErrorBanner.style.display = 'block';
        elements.editErrorBanner.innerHTML = `
          <strong>Please resolve the following issues:</strong>
          <ul style="margin-left: 20px; margin-top: 6px;">
            ${(response.errors || [response.error || 'Failed to update trip']).map((err) => `<li>${escapeHtml(err)}</li>`).join('')}
          </ul>
        `;
        return;
      }

      closeEditModal();
      const exportMsg = response.exportSyncNote ? ` (${response.exportSyncNote})` : '';
      showToast(`Trip to "${response.trip.destination}" updated successfully!${exportMsg}`, 'success');
      await loadTripsData();
      renderCurrentView();
    } catch (err) {
      elements.editErrorBanner.style.display = 'block';
      elements.editErrorBanner.textContent = `Error updating trip: ${err.message}`;
    } finally {
      elements.btnSaveEditTrip.disabled = false;
      elements.btnSaveEditTrip.textContent = 'Save Changes';
    }
  });

  // Switch Active View
  function switchView(viewName) {
    if (!viewMetadata[viewName]) return;
    state.currentView = viewName;

    // Update Sidebar Navigation
    elements.navButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update Sections
    elements.viewSections.forEach((section) => {
      section.classList.toggle('active', section.id === `view-${viewName}`);
    });

    // Update Header
    elements.pageTitle.textContent = viewMetadata[viewName].title;
    elements.pageSubtitle.textContent = viewMetadata[viewName].subtitle;

    renderCurrentView();
  }

  // Setup Navigation Click Handlers
  elements.navButtons.forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  elements.headerBtnCreate.addEventListener('click', () => switchView('create'));
  elements.btnViewAllTrips.addEventListener('click', () => switchView('trips'));
  elements.btnCancelCreate.addEventListener('click', () => switchView('trips'));

  elements.btnOpenExports.addEventListener('click', async () => {
    const res = await api.openExportsFolder();
    if (res.success) {
      showToast('Opened exports folder.', 'info');
    }
  });

  // 1. DATA LOADING
  async function loadTripsData() {
    try {
      const response = await api.getTrips();
      if (response.success) {
        state.trips = response.trips || [];
        elements.sidebarTripsCount.textContent = state.trips.length;
      }
    } catch (error) {
      console.error('Failed to load trips data:', error);
      showToast('Could not load saved trips.', 'error');
    }
  }

  async function loadPackingData() {
    try {
      const response = await api.getPackingItems();
      if (response.success) {
        state.packingItems = response.items || [];
      }
    } catch (error) {
      console.error('Failed to load packing items:', error);
    }
  }

  // 2. DASHBOARD VIEW RENDERER
  function renderDashboard() {
    const totalTrips = state.trips.length;
    let totalDays = 0;
    let totalBudget = 0;
    let totalEstimate = 0;

    state.trips.forEach((trip) => {
      totalDays += Number(trip.days) || 0;
      totalBudget += Number(trip.budget) || 0;
      if (trip.estimatedBudget && trip.estimatedBudget.total) {
        totalEstimate += Number(trip.estimatedBudget.total);
      }
    });

    elements.statTotalTrips.textContent = totalTrips;
    elements.statTotalDays.textContent = totalDays;
    elements.statTotalBudget.textContent = formatCurrency(totalBudget);
    elements.statTotalEstimate.textContent = formatCurrency(totalEstimate);

    // Render Recent Trips in Dashboard
    if (state.trips.length === 0) {
      elements.dashboardRecentTrips.innerHTML = `
        <div class="empty-state" style="padding: 30px 10px;">
          <p class="empty-state-title">No trips planned yet</p>
          <p class="empty-state-desc">Start your journey by creating your very first trip itinerary.</p>
          <button class="btn-primary btn-sm" id="btn-dash-create-trip">Plan a Trip</button>
        </div>
      `;
      const btn = document.getElementById('btn-dash-create-trip');
      if (btn) btn.addEventListener('click', () => switchView('create'));
      return;
    }

    const recentTrips = [...state.trips].reverse().slice(0, 3);
    elements.dashboardRecentTrips.innerHTML = recentTrips.map((trip) => {
      const originalIndex = state.trips.indexOf(trip);
      const isWithinBudget = !trip.estimatedBudget || trip.budget >= trip.estimatedBudget.total;

      return `
        <div class="trip-card" style="padding: 16px;">
          <div class="trip-card-header">
            <span class="trip-destination-title">${escapeHtml(trip.destination)}</span>
            <span class="trip-days-badge">${trip.days} ${trip.days === 1 ? 'Day' : 'Days'}</span>
          </div>
          <div class="trip-finance-row" style="margin-bottom: 10px;">
            <div class="finance-col">
              <span class="finance-label">Budget</span>
              <span class="finance-val">${formatCurrency(trip.budget)}</span>
            </div>
            <div class="finance-col">
              <span class="finance-label">Estimated</span>
              <span class="finance-val">${formatCurrency(trip.estimatedBudget ? trip.estimatedBudget.total : 0)}</span>
            </div>
            <span class="status-chip ${isWithinBudget ? 'within' : 'over'}">
              ${isWithinBudget ? 'Within Budget' : 'Over Budget'}
            </span>
          </div>
          <div class="trip-card-actions" style="padding-top: 10px;">
            <button class="btn-secondary btn-sm btn-dash-view" data-index="${originalIndex}">View Itinerary</button>
            <button class="btn-icon-only btn-dash-export" data-index="${originalIndex}" title="Export Itinerary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 15px; height: 15px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners for recent trip action buttons
    document.querySelectorAll('.btn-dash-view').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const index = Number(e.currentTarget.dataset.index);
        state.selectedItineraryIndex = index;
        switchView('itinerary');
      });
    });

    document.querySelectorAll('.btn-dash-export').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const index = Number(e.currentTarget.dataset.index);
        await exportTripByIndex(index);
      });
    });
  }

  // 3. MY TRIPS VIEW RENDERER
  function renderTrips() {
    const query = state.searchQuery.toLowerCase().trim();
    const filteredTrips = state.trips.filter((trip) => {
      if (!query) return true;
      const matchDest = (trip.destination || '').toLowerCase().includes(query);
      const matchInterest = (trip.interests || []).some((i) => i.toLowerCase().includes(query));
      return matchDest || matchInterest;
    });

    elements.tripsFilterStats.textContent = query
      ? `Found ${filteredTrips.length} of ${state.trips.length} trips`
      : `Showing ${state.trips.length} ${state.trips.length === 1 ? 'trip' : 'trips'}`;

    if (filteredTrips.length === 0) {
      if (state.trips.length === 0) {
        elements.tripsContainer.innerHTML = `
          <div class="empty-state">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <h3 class="empty-state-title">No Trips Created Yet</h3>
            <p class="empty-state-desc">You haven't planned any trips yet. Create your first itinerary to view personalized daily schedules and budget plans.</p>
            <button class="btn-primary" id="btn-empty-create-trip">Create Your First Trip</button>
          </div>
        `;
        const btn = document.getElementById('btn-empty-create-trip');
        if (btn) btn.addEventListener('click', () => switchView('create'));
      } else {
        elements.tripsContainer.innerHTML = `
          <div class="empty-state">
            <p class="empty-state-title">No Matching Trips</p>
            <p class="empty-state-desc">No saved trips matched "${escapeHtml(query)}". Try another search term.</p>
          </div>
        `;
      }
      return;
    }

    elements.tripsContainer.innerHTML = filteredTrips.map((trip) => {
      const realIndex = state.trips.indexOf(trip);
      const isWithinBudget = !trip.estimatedBudget || trip.budget >= trip.estimatedBudget.total;
      const interestsHtml = (trip.interests || [])
        .map((interest) => `<span class="interest-tag">#${escapeHtml(interest)}</span>`)
        .join('');

      return `
        <div class="trip-card">
          <div>
            <div class="trip-card-header">
              <h3 class="trip-destination-title">${escapeHtml(trip.destination)}</h3>
              <span class="trip-days-badge">${trip.days} ${trip.days === 1 ? 'Day' : 'Days'}</span>
            </div>

            <div class="trip-finance-row">
              <div class="finance-col">
                <span class="finance-label">Planned Budget</span>
                <span class="finance-val">${formatCurrency(trip.budget)}</span>
              </div>
              <div class="finance-col">
                <span class="finance-label">Estimated Cost</span>
                <span class="finance-val">${formatCurrency(trip.estimatedBudget ? trip.estimatedBudget.total : 0)}</span>
              </div>
              <span class="status-chip ${isWithinBudget ? 'within' : 'over'}">
                ${isWithinBudget ? 'Within Budget' : 'Over Budget'}
              </span>
            </div>

            <div class="interest-tag-list">
              ${interestsHtml}
            </div>
          </div>

          <div class="trip-card-actions">
            <button class="btn-secondary btn-sm action-view-itinerary" data-index="${realIndex}">
              Itinerary
            </button>
            <button class="btn-secondary btn-sm action-view-budget" data-index="${realIndex}">
              Budget
            </button>
            <button class="btn-icon-only action-edit-trip" data-index="${realIndex}" title="Edit Trip Details">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 15px; height: 15px;">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-icon-only action-export-trip" data-index="${realIndex}" title="Export Itinerary (.txt)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 15px; height: 15px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            <button class="btn-icon-only danger action-delete-trip" data-index="${realIndex}" title="Delete Trip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 15px; height: 15px;">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach Action Listeners
    document.querySelectorAll('.action-view-itinerary').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        state.selectedItineraryIndex = Number(e.currentTarget.dataset.index);
        switchView('itinerary');
      });
    });

    document.querySelectorAll('.action-view-budget').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        state.selectedBudgetIndex = Number(e.currentTarget.dataset.index);
        switchView('budget');
      });
    });

    document.querySelectorAll('.action-edit-trip').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        openEditModal(Number(e.currentTarget.dataset.index));
      });
    });

    document.querySelectorAll('.action-export-trip').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        await exportTripByIndex(Number(e.currentTarget.dataset.index));
      });
    });

    document.querySelectorAll('.action-delete-trip').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        openDeleteModal(Number(e.currentTarget.dataset.index));
      });
    });
  }

  // Search input handler
  elements.tripSearchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderTrips();
  });

  // Export trip helper
  async function exportTripByIndex(index) {
    try {
      const response = await api.exportTrip(index);
      if (response.success) {
        showToast(
          `Exported to exports/${response.filename}!`,
          'success',
          {
            label: 'Show in Folder',
            onClick: () => api.showItemInFolder(response.filePath),
          }
        );
      } else {
        showToast(`Export failed: ${response.error}`, 'error');
      }
    } catch (err) {
      showToast(`Export error: ${err.message}`, 'error');
    }
  }

  // 4. CREATE TRIP VIEW & LIVE PREVIEW
  // Interest pills selection
  elements.interestPillsContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill-chip');
    if (pill) {
      pill.classList.toggle('selected');
    }
  });

  // Live Cost Preview updates
  async function updateLivePreview() {
    const days = Math.max(1, Number(elements.tripDays.value) || 1);
    const plannedBudget = Number(elements.tripBudget.value) || 0;

    elements.previewDaysCount.textContent = days;

    try {
      const res = await api.calculateBudget(days);
      if (res.success && res.breakdown) {
        const b = res.breakdown;
        elements.previewValTransport.textContent = formatCurrency(b.transport);
        elements.previewValAccommodation.textContent = formatCurrency(b.accommodation);
        elements.previewValFood.textContent = formatCurrency(b.food);
        elements.previewValActivities.textContent = formatCurrency(b.activities);
        elements.previewValTotal.textContent = formatCurrency(b.total);

        const diff = plannedBudget - b.total;
        if (plannedBudget <= 0) {
          elements.previewBudgetStatus.innerHTML = `
            <span class="callout-icon">💡</span>
            <span class="callout-text">Enter your target budget to see savings/variance</span>
          `;
        } else if (diff >= 0) {
          elements.previewBudgetStatus.innerHTML = `
            <span class="callout-icon" style="color: #34d399;">✓</span>
            <span class="callout-text" style="color: #34d399;">Within target budget with <strong>${formatCurrency(diff)}</strong> buffer</span>
          `;
        } else {
          elements.previewBudgetStatus.innerHTML = `
            <span class="callout-icon" style="color: #fbbf24;">⚠️</span>
            <span class="callout-text" style="color: #fbbf24;">Estimated cost exceeds budget by <strong>${formatCurrency(Math.abs(diff))}</strong></span>
          `;
        }
      }
    } catch (err) {
      console.error('Failed to calculate preview budget:', err);
    }
  }

  elements.tripDays.addEventListener('input', updateLivePreview);
  elements.tripBudget.addEventListener('input', updateLivePreview);

  // Form Submission
  elements.createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    elements.createErrorBanner.style.display = 'none';
    elements.createErrorBanner.innerHTML = '';

    // Gather selected interest tags
    const selectedPills = Array.from(
      elements.interestPillsContainer.querySelectorAll('.pill-chip.selected')
    ).map((p) => p.dataset.value);

    // Custom interests
    const customInterests = elements.tripCustomInterests.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const combinedInterests = Array.from(new Set([...selectedPills, ...customInterests]));

    const tripData = {
      destination: elements.tripDestination.value.trim(),
      days: Number(elements.tripDays.value),
      budget: Number(elements.tripBudget.value),
      interests: combinedInterests,
    };

    // UI Loading state
    elements.btnSubmitTrip.disabled = true;
    elements.btnSubmitTrip.innerHTML = '<span>Saving Trip Plan...</span>';

    try {
      const response = await api.createTrip(tripData);

      if (!response.success) {
        elements.createErrorBanner.style.display = 'block';
        elements.createErrorBanner.innerHTML = `
          <strong>Please resolve the following issues:</strong>
          <ul style="margin-left: 20px; margin-top: 6px;">
            ${(response.errors || ['An error occurred']).map((err) => `<li>${escapeHtml(err)}</li>`).join('')}
          </ul>
        `;
        return;
      }

      // Success
      showToast(`Trip to "${response.trip.destination}" created successfully!`, 'success');
      elements.createForm.reset();
      elements.tripDays.value = '3';
      elements.tripBudget.value = '15000';
      updateLivePreview();

      // Refresh data and navigate to trips view
      await loadTripsData();
      state.selectedItineraryIndex = state.trips.length - 1;
      switchView('trips');
    } catch (error) {
      elements.createErrorBanner.style.display = 'block';
      elements.createErrorBanner.textContent = `Unexpected error: ${error.message}`;
    } finally {
      elements.btnSubmitTrip.disabled = false;
      elements.btnSubmitTrip.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>Create Trip & Generate Itinerary</span>
      `;
    }
  });

  // 5. ITINERARY VIEW RENDERER
  function renderItinerary() {
    if (state.trips.length === 0) {
      elements.itineraryTripSelect.innerHTML = '<option value="">No trips available</option>';
      elements.itineraryContent.innerHTML = `
        <div class="empty-state">
          <h3 class="empty-state-title">No Trips Available</h3>
          <p class="empty-state-desc">Create a trip to view its generated day-by-day itinerary.</p>
          <button class="btn-primary" id="btn-itin-create">Create Trip</button>
        </div>
      `;
      const btn = document.getElementById('btn-itin-create');
      if (btn) btn.addEventListener('click', () => switchView('create'));
      return;
    }

    // Populate dropdown
    elements.itineraryTripSelect.innerHTML = state.trips
      .map((trip, idx) => `<option value="${idx}" ${idx === state.selectedItineraryIndex ? 'selected' : ''}>${escapeHtml(trip.destination)} (${trip.days} Days)</option>`)
      .join('');

    const trip = state.trips[state.selectedItineraryIndex] || state.trips[0];
    if (!trip) return;

    const itinerary = trip.itinerary || [];
    if (itinerary.length === 0) {
      elements.itineraryContent.innerHTML = `
        <div class="empty-state">
          <p class="empty-state-title">Itinerary is empty</p>
        </div>
      `;
      return;
    }

    elements.itineraryContent.innerHTML = itinerary.map((dayPlan) => {
      return `
        <div class="itinerary-day-card">
          <div class="itinerary-day-header">
            <span class="day-badge">Day ${dayPlan.day}</span>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(trip.destination)}</span>
          </div>

          <div class="slots-grid">
            <div class="slot-box">
              <span class="slot-tag morning">Morning</span>
              <p class="slot-activity">${escapeHtml(dayPlan.morning)}</p>
            </div>

            <div class="slot-box">
              <span class="slot-tag afternoon">Afternoon</span>
              <p class="slot-activity">${escapeHtml(dayPlan.afternoon)}</p>
            </div>

            <div class="slot-box">
              <span class="slot-tag evening">Evening</span>
              <p class="slot-activity">${escapeHtml(dayPlan.evening)}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  elements.itineraryTripSelect.addEventListener('change', (e) => {
    state.selectedItineraryIndex = Number(e.target.value);
    renderItinerary();
  });

  elements.btnExportItinerary.addEventListener('click', async () => {
    if (state.trips.length === 0) return;
    await exportTripByIndex(state.selectedItineraryIndex);
  });

  // 6. BUDGET VIEW RENDERER
  function renderBudget() {
    if (state.trips.length === 0) {
      elements.budgetTripSelect.innerHTML = '<option value="">No trips available</option>';
      elements.budgetContent.innerHTML = `
        <div class="empty-state">
          <h3 class="empty-state-title">No Trips Available</h3>
          <p class="empty-state-desc">Create a trip to view its budget estimation breakdown.</p>
          <button class="btn-primary" id="btn-budget-create">Create Trip</button>
        </div>
      `;
      const btn = document.getElementById('btn-budget-create');
      if (btn) btn.addEventListener('click', () => switchView('create'));
      return;
    }

    elements.budgetTripSelect.innerHTML = state.trips
      .map((trip, idx) => `<option value="${idx}" ${idx === state.selectedBudgetIndex ? 'selected' : ''}>${escapeHtml(trip.destination)} (${trip.days} Days)</option>`)
      .join('');

    const trip = state.trips[state.selectedBudgetIndex] || state.trips[0];
    if (!trip) return;

    const est = trip.estimatedBudget || { transport: 0, accommodation: 0, food: 0, activities: 0, total: 0 };
    const diff = trip.budget - est.total;
    const isWithin = diff >= 0;
    const percentUsed = trip.budget > 0 ? ((est.total / trip.budget) * 100).toFixed(1) : '0.0';

    elements.budgetContent.innerHTML = `
      <div class="budget-summary-banner">
        <div class="budget-comparison-row" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
          <div class="budget-metric">
            <span class="budget-metric-label">Planned Budget Target</span>
            <span class="budget-metric-val" style="color: #60a5fa;">${formatCurrency(trip.budget)}</span>
          </div>

          <div class="budget-metric">
            <span class="budget-metric-label">Estimated Overall Cost</span>
            <span class="budget-metric-val">${formatCurrency(est.total)}</span>
          </div>

          <div class="budget-metric">
            <span class="budget-metric-label">${isWithin ? 'Remaining Budget' : 'Budget Deficit'}</span>
            <span class="budget-metric-val" style="color: ${isWithin ? '#34d399' : '#fbbf24'};">
              ${isWithin ? '+' : '-'}${formatCurrency(Math.abs(diff))}
            </span>
          </div>

          <div class="budget-metric">
            <span class="budget-metric-label">Budget Utilized</span>
            <span class="budget-metric-val" style="color: ${Number(percentUsed) <= 100 ? '#34d399' : '#fbbf24'};">
              ${percentUsed}%
            </span>
          </div>
        </div>

        <div style="background: rgba(0,0,0,0.25); padding: 14px 18px; border-radius: var(--radius-sm); font-size: 0.9rem; line-height: 1.5;">
          ${isWithin
            ? `<strong style="color: #34d399;">Budget Status: Within Budget (${percentUsed}% used).</strong> Your planned budget of ${formatCurrency(trip.budget)} comfortably covers the estimated standard cost of ${formatCurrency(est.total)} with ${formatCurrency(diff)} remaining.`
            : `<strong style="color: #fbbf24;">Budget Status: Exceeds Budget (${percentUsed}% used).</strong> Your planned budget of ${formatCurrency(trip.budget)} is ${formatCurrency(Math.abs(diff))} below the projected standard cost of ${formatCurrency(est.total)}. Consider adjusting your duration or accommodation options.`
          }
        </div>
      </div>

      <div class="section-card">
        <h3 class="card-heading" style="margin-bottom: 20px;">Standard Rate Breakdown (${trip.days} Days)</h3>
        <div class="preview-breakdown">
          <div class="preview-item">
            <div class="preview-item-label">
              <span>🚗 Regional Transportation</span>
              <small>Standard baseline rate</small>
            </div>
            <span class="preview-item-val">${formatCurrency(est.transport)}</span>
          </div>

          <div class="preview-item">
            <div class="preview-item-label">
              <span>🏨 Accommodation (${trip.days} nights)</span>
              <small>₹1,500 / night baseline</small>
            </div>
            <span class="preview-item-val">${formatCurrency(est.accommodation)}</span>
          </div>

          <div class="preview-item">
            <div class="preview-item-label">
              <span>🍽️ Food & Meals (${trip.days} days)</span>
              <small>₹800 / day</small>
            </div>
            <span class="preview-item-val">${formatCurrency(est.food)}</span>
          </div>

          <div class="preview-item">
            <div class="preview-item-label">
              <span>🎟️ Sightseeing & Activities (${trip.days} days)</span>
              <small>₹700 / day</small>
            </div>
            <span class="preview-item-val">${formatCurrency(est.activities)}</span>
          </div>

          <div class="preview-divider"></div>

          <div class="preview-total-row">
            <span>Total Estimated Cost</span>
            <span class="preview-total-val">${formatCurrency(est.total)}</span>
          </div>
        </div>
      </div>
    `;
  }

  elements.budgetTripSelect.addEventListener('change', (e) => {
    state.selectedBudgetIndex = Number(e.target.value);
    renderBudget();
  });

  // 7. PACKING CHECKLIST RENDERER
  function renderPacking() {
    const totalCount = state.packingItems.length;
    const packedCount = state.packingItems.filter((i) => i.packed).length;
    const percentage = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

    elements.packingStatusBadge.textContent = `${packedCount} / ${totalCount} Packed (${percentage}%)`;
    elements.packingProgressFill.style.width = `${percentage}%`;

    const filteredItems = state.packingItems.filter((item) => {
      if (state.packingFilter === 'packed') return item.packed;
      if (state.packingFilter === 'unpacked') return !item.packed;
      return true;
    });

    if (filteredItems.length === 0) {
      elements.packingItemsList.innerHTML = `
        <div class="empty-state" style="padding: 30px;">
          <p class="empty-state-title">${totalCount === 0 ? 'Your checklist is empty' : 'No items matching filter'}</p>
          <p class="empty-state-desc">${totalCount === 0 ? 'Add clothing, toiletries, chargers, and documents for your trip.' : 'Try selecting another tab.'}</p>
        </div>
      `;
      return;
    }

    elements.packingItemsList.innerHTML = filteredItems.map((item) => {
      const realIndex = state.packingItems.indexOf(item);
      return `
        <div class="packing-item-row">
          <div class="packing-item-left packing-toggle-item" data-index="${realIndex}">
            <div class="custom-checkbox ${item.packed ? 'checked' : ''}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span class="packing-item-name ${item.packed ? 'packed' : ''}">${escapeHtml(item.name)}</span>
          </div>
          <button class="btn-icon-only danger packing-delete-btn" data-index="${realIndex}" title="Delete Item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 15px; height: 15px;">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
    }).join('');

    // Toggle item status
    document.querySelectorAll('.packing-toggle-item').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const index = Number(e.currentTarget.dataset.index);
        try {
          const res = await api.togglePackingItem(index);
          if (res.success) {
            await loadPackingData();
            renderPacking();
          }
        } catch (err) {
          showToast(`Toggle error: ${err.message}`, 'error');
        }
      });
    });

    // Delete item
    document.querySelectorAll('.packing-delete-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const index = Number(e.currentTarget.dataset.index);
        try {
          const res = await api.deletePackingItem(index);
          if (res.success) {
            await loadPackingData();
            renderPacking();
          }
        } catch (err) {
          showToast(`Delete error: ${err.message}`, 'error');
        }
      });
    });
  }

  // Add packing item
  async function handleAddPackingItem() {
    const text = elements.newPackingItemInput.value.trim();
    if (!text) return;

    try {
      const res = await api.addPackingItem(text);
      if (res.success) {
        elements.newPackingItemInput.value = '';
        await loadPackingData();
        renderPacking();
      } else {
        showToast(res.error || 'Failed to add item', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  elements.btnAddPackingItem.addEventListener('click', handleAddPackingItem);
  elements.newPackingItemInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddPackingItem();
  });

  // Packing filter tabs
  elements.packingFilterTabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      elements.packingFilterTabs.forEach((t) => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.packingFilter = e.currentTarget.dataset.filter;
      renderPacking();
    });
  });

  // Switch Render Dispatcher
  function renderCurrentView() {
    switch (state.currentView) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'trips':
        renderTrips();
        break;
      case 'create':
        updateLivePreview();
        break;
      case 'itinerary':
        renderItinerary();
        break;
      case 'budget':
        renderBudget();
        break;
      case 'packing':
        renderPacking();
        break;
      default:
        renderDashboard();
    }
  }

  // HTML sanitization helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Initial App Startup
  async function init() {
    await loadTripsData();
    await loadPackingData();
    updateLivePreview();
    renderCurrentView();
  }

  init();
});
