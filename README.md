# 🏋️‍♂️ MacroFit

MacroFit is a premium, AI-powered nutrition, weight, and macro tracking mobile application built with **React Native** and **Expo**. It is specifically designed to manage diets (especially popular Indian diet patterns like Veg, Eggetarian, and Non-Veg cycles) while providing personalized fitness advice, automated diet plans, and weight trend analysis powered by **Google Gemini AI**.

---

## 🌟 Key Features

### 1. 📊 Centralized Macro & Calorie Tracking
* **Dynamic Daily Targets**: Computes customized BMR (Mifflin-St Jeor) and TDEE based on age, height, weight, activity multiplier, and fitness goals (Cut, Maintain, Lean Bulk, Bulk).
* **Macro breakdown**: Tracks Calories, Protein, Carbs, and Fats using premium-themed, colour-coded progress bars.
* **SVG Progress Ring**: Interactive circular calorie progress indicator representing percentage of goal reached in real-time.

### 2. 🥦 Specialized Diet Budgeting & Preferences
* **Eggetarian & Non-Veg Budgeting**: Allows users to configure exact egg and non-veg days per week. The app dynamically tracks and enforces remaining weekly budgets.
* **🌱 Pure Veg Mode**: Easily toggle a temporary override (for Shravan, Navratri, or special fasting days) that forces vegetarian-only food lists and disables non-veg rules.

### 3. 📈 Weight Trends & Progress Tracking
* **Daily Log**: Pill-shaped integrated input and circular action button for logging body weight.
* **Line Chart**: Custom-styled visual line chart showcasing weight progression.
* **Stat Indicators**: Stat cards displaying starting weight, current weight, and net change (color-coded as weight lost vs. gained).

### 4. 🤖 Gemini AI Gym Coach
* **Interactive AI Chat**: Ask questions about your macros, diet recommendations, or workout advice. The coach responds with full awareness of your body profile, current diet settings, and today's logged food.
* **Automated Weekly Meal Plans**: Generates custom weekly diet schedules tailored to your target calories, protein requirements, and exact egg/non-veg day budgets.

### 5. 🎨 Premium Modern UI/UX
* Centralized HSL/Hex color tokens, custom typography, standard card corner radii, and shadow styling.
* Diagonal linear gradients (`expo-linear-gradient`), custom-styled SVGs (`react-native-svg`), and micro-animations with contextual icons (`@expo/vector-icons`).

---

## ⚙️ Tech Stack

* **Framework**: React Native & Expo (v54+)
* **Navigation**: React Navigation (Bottom Tabs & Native Stack)
* **Graphics & SVG**: React Native SVG & Expo Linear Gradient
* **Icons**: Expo Vector Icons (Ionicons)
* **AI Integration**: Google Gemini API Studio
* **State Management**: React Context API (AppContext)
* **Safe Area Handling**: React Native Safe Area Context (edge-to-edge layout)

---

## 📂 Project Structure

```bash
MacroFit/
├── App.js                     # Root configuration, Providers, and Tab/Stack Navigation
├── app.json                   # Expo configuration (Project ID, icons, builds)
├── package.json               # Package dependencies and overriding settings
└── src/
    ├── components/
    │   ├── FoodItemCard.js    # Premium card style displaying logged meals with delete controls
    │   ├── MacroProgressBar.js# dynamic progress bars themed by calorie/protein/carb/fat colors
    │   ├── SimpleLineChart.js # custom line chart visualization for weight history
    │   └── StreakBadge.js     # User streak indicator
    ├── context/
    │   └── AppContext.js      # Global state for profile, logs, history, and actions
    ├── screens/
    │   ├── OnboardingScreen.js# Step-by-step setup journey
    │   ├── HomeScreen.js      # Today's summaries, macro bars, meal sections, and FAB
    │   ├── AddFoodScreen.js   # Food database search, diet-border colors, and quantity preview
    │   ├── ProgressScreen.js  # Weight logger, line chart, and stat indicator cards
    │   ├── WeeklySummaryScreen.js# circular adherence ring and daily calorie vertical bars
    │   ├── AICoachScreen.js   # Chat window and AI diet generator
    │   └── SettingsScreen.js  # Profiles, diet settings, switches, and API keys
    ├── theme/
    │   └── theme.js           # Central design system (colors, radius, typography, shadows)
    └── utils/
        ├── calculations.js    # BMR, TDEE, macros formulas
        ├── dietBudget.js      # Eggs and non-veg weekly calculations
        ├── foodDatabase.js    # Indian & general food items database with scale helper
        └── geminiApi.js       # Client connection to Google Gemini API
```

---

## 🛠️ Design System (`src/theme/theme.js`)

* **Primary Colors**: Purple (`#5B5FEF`), Dark Purple (`#4338CA`), Soft Lavender (`#EEF0FF`).
* **Macro Colors**: Calories (`#5B5FEF`), Protein (`#22D3A5`), Carbs (`#F59E0B`), Fats (`#EC4899`).
* **Status Colors**: Success/Accent (`#22D3A5`), Warning (`#F59E0B`), Danger (`#EF4444`).
* **Corner Radii**: Small (`8px`), Medium (`14px`), Large (`20px`), Pill (`999px`).
* **Typography**: Structured configurations for Headers (`h1`, `h2`, `h3`), `body`, and `caption`.
* **Shadows**: Custom elevations for standard `card` components and `floating` action buttons (FAB).

---

## 📐 How Calculations Work

1. **BMR (Basal Metabolic Rate)**: Calculated using the Mifflin-St Jeor Equation:
   * **Men**: $10 \times \text{weight (kg)} + 6.25 \times \text{height (cm)} - 5 \times \text{age (y)} + 5$
   * **Women**: $10 \times \text{weight (kg)} + 6.25 \times \text{height (cm)} - 5 \times \text{age (y)} - 161$
2. **TDEE (Total Daily Energy Expenditure)**: Calculated by multiplying BMR with the selected activity multiplier (Sedentary: `1.2`, Active: `1.725`, etc.).
3. **Goal Adjustments**:
   * **Cut**: -20% calories
   * **Maintain**: 0% adjustment
   * **Lean Bulk**: +12% calories
   * **Bulk**: +18% calories
4. **Macros Breakdown**:
   * **Protein**: Fixed gram per kg depending on the goal (ranging from `1.8g/kg` for bulk to `2.2g/kg` for cut).
   * **Fat**: Dynamic calories percentage (ranging from `25%` for cut to `30%` for bulk).
   * **Carbohydrates**: Fills all remaining daily target calories after subtracting protein and fat.

---

## 🚀 Setup & Installation

### Prerequisites
Make sure you have Node.js (v18+) and npm installed.

### Steps
1. Clone this repository and navigate to the project directory:
   ```bash
   cd MacroFit/MacroFit
   ```
2. Install all dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start -c
   ```
4. Run on a simulator, emulator, or physical device:
   * Press **`a`** for Android emulator (or connect a USB device).
   * Press **`i`** for iOS Simulator.
   * Scan the QR code with the Expo Go app (on Android or iOS) to run on a physical phone.

---

## 🔑 AI Setup (Google Gemini)

To use the AI Gym Coach and automated weekly meal planner:
1. Visit [Google AI Studio](https://aistudio.google.com/apikey) and generate a free API key.
2. In the MacroFit app, navigate to **Settings** ➡️ **AI Coach Settings**.
3. Paste your key and tap **Save API Key**.
4. Your coach is now active and ready to plan your diet!
