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
- **Saving & Viewing Trips:** Store trips locally and view summaries of past or upcoming journeys.
- **Exporting Itineraries:** Export generated itineraries into readable plain text (`.txt`) files.

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

## 📂 Project Structure

```text
Travel Planner/
├── src/
│   └── index.js       # Main application entry point
├── .gitignore         # Files and directories ignored by Git
├── package.json       # Project configuration and npm scripts
└── README.md          # Project documentation and roadmap
```
