# Screens Directory

This folder contains all the main screens for the Cashalyst app. Each file represents a distinct view or workflow in the application, handling navigation, UI, and business logic for its respective feature.

## Screen Files Overview

- **HomeScreen.jsx**  
  The dashboard screen showing account balances, recent transactions, and quick actions.

- **AddTransactionScreen.jsx**  
  Allows users to add new income or expense transactions, select categories, sources, and add notes.

- **HistoryScreen.jsx**  
  Displays a searchable and filterable list of all transactions, grouped by month. Includes advanced filtering, editing, and deletion features.  
  See [`HistoryScreen`](HistoryScreen.jsx) for details.

- **InsightsScreen.jsx**  
  Provides analytics and visualizations of spending and income trends, category breakdowns, and charts.

- **AccountsScreen.jsx**  
  Manages user accounts/sources (e.g., cash, bank, wallet), allowing creation, editing, and deletion.

- **EditTransactionScreen.jsx**  
  Lets users modify existing transactions, update details, or change categories and sources.

- **SettingsScreen.jsx**  
  App settings including theme, currency, backup/restore, and other preferences.

- **SetupScreen.jsx**  
  Initial onboarding and setup flow for new users, including account creation and preferences.

- **RestoreScreen.jsx**  
  Handles restoring data from backups or previous sessions.

## Common Features

- All screens use the app's theme system from [`utils/theme.js`](../utils/theme.js) for consistent styling.
- Navigation is managed via React Navigation stack and tab navigators.
- Most screens utilize custom components from [`components/`](../components/README.md) for UI consistency.
- State management is handled via [`useStore`](../hooks/useStore.js).

## Adding New Screens

1. Name the file with a `Screen` suffix (e.g., `BudgetScreen.jsx`).
2. Use the theme and custom components for styling.
3. Document the screen's purpose and props at the top of the file.
4. Add the screen to the main navigator in [`App.js`](../App.js) if needed.

## See Also

- [components/README.md](../components/README.md) for reusable UI components.
- [hooks/README.md](../hooks/README.md)