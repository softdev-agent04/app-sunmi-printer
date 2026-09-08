# Sunmi Printer React Capacitor App

A React-based mobile application designed to interface with SUNMI printer hardware using Capacitor. This app provides a dashboard to initialize, check the status of, and print test/order receipts on SUNMI POS devices.

## Features

- **Printer Management**: Initialize and destroy printer connections.
- **Status Monitoring**: Real-time status checks (connectivity and readiness).
- **Print Functionality**: 
  - Test print capability.
  - Formatted order receipt printing (supports Table and Takeaway order types).
- **Activity Logging**: Built-in log viewer to debug printer interactions.
- **Responsive UI**: A modern, styled interface for easy management.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Native Bridge**: Capacitor 6 (Android)
- **Printer Plugin**: `@desipayments/sunmi-printer`

## Development

### Prerequisites

- Node.js (v18+)
- Capacitor CLI installed globally (`npm install -g @capacitor/cli`)
- Android Studio (for native Android builds)

### Installation

```bash
npm install
```

### Running in Development

```bash
npm run dev
```

### Building for Android

1. Build the web assets:
   ```bash
   npm run build
   ```
2. Sync with Capacitor (if needed):
   ```bash
   npx cap sync android
   ```
3. Open in Android Studio:
   ```bash
   npx cap open android
   ```

## Project Structure

- `src/App.tsx`: Main application logic, UI, and printer plugin integration.
- `src/main.tsx`: Entry point.
- `android/`: Native Android project files.
- `capacitor.config.ts`: Capacitor configuration.

## Usage

1. **Initialization**: On launch, the app attempts to initialize the printer.
2. **Status**: Monitor the "Printer Status" card.
3. **Printing**: Use the "Controls" section to print test receipts or simulated order receipts. Choose between **Table ($)** and **Takeaway (৳)** order types to see different receipt formats.


