# utils/ README

This folder contains core utility modules for the Cashalyst app. These utilities provide essential services and reusable logic that power the app's backup, notification, theming, scaling, and formatting features.

## Key Modules

- **backupService.js**
  - Handles backup and restore of user data (transactions, accounts, username).
  - Supports saving backups to AsyncStorage and the device file system.
  - Allows exporting, sharing, and deleting backup files.
  - Provides methods for restoring from files and checking backup status.

- **notificationService.js**
  - Manages local notifications for reminders and reports.
  - Handles permission requests, scheduling, and cancellation.
  - Supports smart notifications with random motivational messages and daily/weekly reminders.
  - Tracks notification state and usage.

- **theme.js**
  - Centralizes the app's design system (colors, fonts, spacing, radii, shadows).
  - Exports reusable style objects for consistent UI across components.

- **scale.js**
  - Provides responsive scaling utilities for font sizes and layout dimensions.
  - Ensures UI adapts well to different device sizes.

- **formatCurrency.js**
  - Utility for formatting numbers as currency strings (e.g., for displaying amounts).
  - Ensures consistent currency formatting throughout the app.

## General Overview

- All utilities are designed for modular use throughout the app.
- Backup and notification services are asynchronous and handle errors gracefully.
- The theme system ensures a consistent look and feel.
- Scaling and formatting utilities help maintain accessibility and visual consistency.

> Use these utilities to keep your app logic