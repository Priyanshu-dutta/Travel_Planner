# Travel Planner – CLI

A lightweight, beginner-friendly command-line application built with JavaScript and Node.js to organize, budget, and plan your trips efficiently.

---

## 📌 Project Overview

**Travel Planner – CLI** is an interactive terminal-based tool designed to help travelers plan trips seamlessly from their terminal. Built incrementally using core Node.js capabilities, it focuses on modular, readable code without heavy external dependencies.

---

## 🚀 Planned Features

The project will be built incrementally and will include the following capabilities:

- **Trip Creation:** Define trip details such as destination, dates, and travelers.
- **Day-by-Day Itinerary Generation:** Plan daily activities, schedules, and sightseeing stops based on interests.
- **Budget Calculation (Implemented in Commit 7):** Track estimated expenses across transport, lodging, food, and activities, and compare against user's planned budget.
- **Packing Checklist (Implemented in Commit 8):** Create and manage customized packing lists, track packed/unpacked status, and monitor preparation progress.
- **Saving & Viewing Trips (Implemented in Commit 9):** Store trips locally in a JSON file, load previous trips on startup, and view all saved trip summaries.
- **Exporting Itineraries (Implemented in Commit 10):** Export generated itineraries into readable plain text (`.txt`) files inside a dedicated `exports/` directory.
- **Managing Trips – Edit & Delete (Implemented in Commit 11):** Edit existing trip details with automatic itinerary regeneration and budget recalculation, or safely delete trips with confirmation.
- **Modular Architecture (Implemented in Commit 13):** Separated business logic, calculations, storage, and file export operations into a dedicated reusable module (`src/tripService.js`) in preparation for future desktop GUI integration.

---

## 💰 Trip Budget Calculator

The application includes an automated trip expense estimator that calculates an illustrative budget breakdown based on trip duration:

### Baseline Estimation Rates (INR)
- **Transport (Fixed):** ₹2,000 (Base travel & transit allowance per trip)
- **Accommodation:** ₹1,500 / day (Lodging & stay)
- **Food:** ₹1,000 / day (Meals & dining)
- **Activities:** ₹500 / day (Sightseeing & entry tickets)

### Estimation Formula
$$\text{Total Estimated Cost} = \text{Transport (Fixed)} + [(\text{Accommodation/Day} + \text{Food/Day} + \text{Activities/Day}) \times \text{Days}]$$

For example, for a **3-day trip**:
- Transport = ₹2,000
- Accommodation = 3 × ₹1,500 = ₹4,500
- Food = 3 × ₹1,000 = ₹3,000
- Activities = 3 × ₹500 = ₹1,500
- **Total Estimated Cost:** ₹2,000 + ₹4,500 + ₹3,000 + ₹1,500 = **₹11,000.00**

### Budget Comparison
- **Within Budget:** If User Budget $\ge$ Estimated Cost, displays the **Remaining Budget** and **Percentage of Budget Used**.
- **Over Budget:** If Estimated Cost $>$ User Budget, displays the **Amount Over Budget** and **Percentage of Budget Used**.
- **Zero Budget Handling:** When a user enters ₹0, the application cleanly displays the full estimated cost as over budget without division-by-zero errors.

> **Disclaimer:** All expense estimates are illustrative baseline approximations intended for planning demonstrations. They are not live market prices or guaranteed commercial rates.

---

## 🎒 Packing Checklist

The interactive packing checklist submenu allows travelers to track luggage preparation directly from the terminal:

### Submenu Capabilities
1. **View packing items:** Lists all items with their index numbers, visual checkmark status (`[X]` for packed, `[ ]` for unpacked), and real-time progress metrics (total items, packed count, remaining count, and completion percentage).
2. **Add a packing item:** Prompts for an item name, validates against empty strings, and adds the new item with a default `packed: false` status.
3. **Mark an item as packed or unpacked:** Allows selecting any item by its number to toggle its packed state. Handles empty lists and invalid indices gracefully.
4. **Return to the main menu:** Returns cleanly to the primary application menu without losing checklist items stored in-memory.

---

## 💾 Persistent Trip Storage

The application provides local file-based persistent storage using Node.js built-in `fs` and `path` modules:

- **Storage Location:** Trips are persisted in `data/trips.json` formatted as readable JSON. The directory and file are created automatically if they do not exist.
- **Automatic Saving:** Every newly created trip is immediately persisted to `data/trips.json` with all trip details, day-by-day itineraries, and estimated budget breakdown.
- **Startup Loading:** On application launch, previously saved trips are automatically read from disk into memory, displaying a summary count of loaded trips.
- **Viewing Saved Trips:** Option 2 from the main menu lists all saved trips with their destinations, durations, planned budgets, estimated costs, and interests.
- **Data Protection:** If `data/trips.json` is missing or empty, it initializes cleanly. If the file contains invalid JSON or corrupted data, a clear warning is logged and automatic overwrites are disabled to prevent data loss.

---

## 📄 Exporting Itineraries

The application allows users to export any saved trip's itinerary into a readable `.txt` file:

- **Menu Option:** Choose Option 4 ("Export Itinerary") from the main menu.
- **Trip Selection:** Lists all available saved trips with index numbers and duration. Users select a trip by its number or enter `0` to cancel.
- **Export Directory:** Output files are automatically saved in the `exports/` directory, which is created automatically if it doesn't already exist.
- **Sanitized Filenames:** Filenames are automatically sanitized based on the destination name (e.g. `goa_itinerary.txt`, `new_york_itinerary.txt`), removing any characters invalid for filesystems.
- **File Content:** The generated text document includes the trip destination, duration, planned budget, estimated costs, interests, and the complete morning, afternoon, and evening daily schedule.

---

## 🛠️ Managing Trips (Edit & Delete)

The application provides a dedicated submenu under Option 5 ("Manage Trips") to update or delete previously saved trips:

### Submenu Capabilities
1. **Edit a Trip:**
   - Displays all saved trips with numbered selections or `0` to cancel.
   - Allows users to selectively update Destination, Duration (days), Planned Budget, and Interests.
   - Users can press **Enter** without typing to retain the current value of any field.
   - Comprehensive validation ensures updated fields cannot be left blank, days must be a positive integer, and budget must be a non-negative number.
   - Automatically **regenerates the day-by-day itinerary** and **recalculates the estimated budget breakdown** based on the updated inputs.
   - Saves the updated trip to `data/trips.json` and immediately displays the refreshed trip summary and schedule.

2. **Delete a Trip:**
   - Displays all saved trips with numbered selections or `0` to cancel.
   - Prompts for explicit confirmation before removing: `Are you sure you want to delete this trip? (yes/no)`.
   - Deletes the trip from memory and saves the updated list to `data/trips.json` only if the user explicitly confirms with `yes`.
   - Safely cancels the operation if the user answers `no` or cancels.
   - **File Preservation:** Previously exported `.txt` itinerary files in `exports/` are preserved and never automatically deleted.

3. **Return to Main Menu:** Returns cleanly to the main CLI menu.

---

## 🛠️ Technology Stack

- **Language:** JavaScript (ES6+)
- **Runtime:** Node.js (Built-in modules)
- **Dependencies:** None (No heavy third-party frameworks or external libraries)

---

## 🏁 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v16 or higher recommended). You can check your version by running:

```bash
node -v
```

### Running the Application

1. Clone or navigate to the project directory:

   ```bash
   cd "Travel Planner"
   ```

2. Start the application using npm:

   ```bash
   npm start
   ```

3. Alternatively, you can run the entry file directly with Node:

   ```bash
   node src/index.js
   ```

---

## 🧱 Modular Architecture (Trip Service)

To support future desktop interfaces (such as Electron), core business logic, calculations, and storage have been extracted from the CLI interface into `src/tripService.js`:

- **Data Persistence:** Reads and writes trip records to `data/trips.json` with error handling and corruption safeguards.
- **Trip Operations (CRUD):** Functions to create (`createTrip`), update (`updateTrip`), and delete (`deleteTrip`) trips cleanly.
- **Itinerary & Budget Calculations:** Generates rule-based multi-day schedules and calculates expense breakdowns.
- **File Exporting:** Creates formatted plain text `.txt` files in `exports/` with safe filename sanitization.
- **CommonJS Module:** Exports reusable functions that can be directly imported by both the current terminal CLI (`src/index.js`) and future desktop windows.

---

## 📂 Project Structure

```text
Travel Planner/
├── data/
│   └── trips.json     # Saved trip data (auto-generated)
├── exports/           # Exported plain text itineraries (.txt)
├── src/
│   ├── index.js       # Main CLI application entry point
│   └── tripService.js # Core business logic, calculations & storage service
├── .gitignore         # Files and directories ignored by Git
├── package.json       # Project configuration and npm scripts
└── README.md          # Project documentation and roadmap
```
