# Smart Stock Mobile

A professional inventory management mobile application built with **React Native Expo**, **TypeScript**, **SQLite**, and **Context API**. Designed for warehouse, wholesale, and enterprise stock management.

![Tech Stack](https://img.shields.io/badge/React%20Native-Expo-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![SQLite](https://img.shields.io/badge/Database-SQLite-green)

## Features

- **Authentication** — Login with validation (demo: `admin` / `admin123`)
- **Dashboard** — Total products, stock in/out stats, recent activities
- **Product Management** — Add, edit, delete, search, and view product details
- **QR/Barcode Scanner** — Scan barcodes and update stock (in/out)
- **Transaction History** — Full history with date and product filters
- **SQLite Database** — Auto-created tables with sample seed data

## Tech Stack

| Technology | Purpose |
|---|---|
| React Native Expo | Mobile framework |
| TypeScript | Type safety |
| expo-sqlite | Local database |
| React Navigation | Screen navigation |
| Context API | Global state management |
| expo-camera | Barcode/QR scanning |

## Project Structure

```
src/
├── screens/          # All app screens
├── navigation/       # React Navigation setup
├── database/         # SQLite operations
├── context/          # ProductContext (global state)
├── components/       # Reusable UI components
├── models/           # TypeScript interfaces
└── utils/            # Constants and helpers
```

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) app on your phone (for testing)
- Android Studio / Xcode (optional, for emulators)

### Step 1: Navigate to project

```bash
cd smart-stock-mobile
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Start the development server

```bash
npx expo start
```

### Step 4: Run on device

- Scan the QR code with **Expo Go** (Android) or the Camera app (iOS)
- Or press `a` for Android emulator / `i` for iOS simulator

## Demo Login

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |

## Sample Barcodes (pre-seeded)

| Product | Barcode |
|---|---|
| Wireless Mouse | `SSM10010001` |
| A4 Copy Paper | `SSM10010002` |
| Industrial Gloves | `SSM10010003` |

Use the **Scanner** tab to scan these barcodes (print or display on another screen).

## Database Schema

### Products

| Column | Type |
|---|---|
| id | INTEGER PRIMARY KEY |
| productName | TEXT |
| category | TEXT |
| quantity | REAL |
| barcode | TEXT (unique) |
| unit | TEXT |
| createdAt | TEXT |

### Transactions

| Column | Type |
|---|---|
| id | INTEGER PRIMARY KEY |
| productId | INTEGER (FK) |
| type | TEXT ('IN' / 'OUT') |
| quantity | REAL |
| createdAt | TEXT |

## Scripts

```bash
npm start       # Start Expo dev server
npm run android # Start on Android
npm run ios     # Start on iOS
npm run web     # Start web preview
npm run lint    # TypeScript type check
```

## License

MIT — Free to use for portfolio and interview projects.
