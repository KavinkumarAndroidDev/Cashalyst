# Hooks

This directory contains custom React hooks for the Cashalyst app, primarily the Zustand state management store.

## Overview

The hooks provide centralized state management using Zustand, offering:
- **Global state** for transactions, accounts, and analytics
- **Optimistic updates** for immediate UI feedback
- **Error handling** with proper state management
- **Data persistence** with AsyncStorage integration

## Files

### `useStore.js`
Zustand store for global state management with AsyncStorage integration.

**Key Features:**
- Transaction management (add, delete, update, load)
- Account management (add, delete, update, load)
- Analytics (monthly stats, category stats)
- Optimistic updates with rollback on errors
- Parallel data loading for performance

**State:**
```javascript
{
  transactions: [],           // All transactions
  accounts: [],              // All financial accounts
  monthlyStats: {},          // Current month statistics
  categoryStats: [],         // Expense breakdown by category
  loading: false,            // Loading state
  error: null               // Error state
}
```

**Key Functions:**
- `loadTransactions(filters)` - Load transactions with optional filters
- `addTransaction(data)` - Add transaction with optimistic updates
- `deleteTransaction(id)` - Delete transaction with balance reversal
- `loadAccounts()` - Load all accounts
- `addAccount(data)` - Create new account
- `getStats()` - Calculate comprehensive statistics
- `initializeApp()` - Load all data on startup

**Usage:**
```javascript
import useStore from './hooks/useStore';

// In component
const { 
  transactions, 
  addTransaction, 
  loading, 
  error 
} = useStore();

// Add transaction
await addTransaction({
  amount: 100,
  type: 'expense',
  category: 'Food',
  source: 'Cash'
});
```

## State Management Pattern

1. **Optimistic Updates** - UI updates immediately for better UX
2. **Error Handling** - Automatic rollback on errors
3. **Parallel Loading** - Multiple data sources load simultaneously
4. **Consistent State** - All related data stays synchronized

## Dependencies

- `zustand` - State management library
- `../db/asyncStorageService` - Database operations
- `../utils/formatCurrency` - ID generation and date utilities

## Best Practices

1. **Always handle loading states** in components
2. **Use error states** for user feedback
3. **Call initializeApp()** on app startup
4. **Use filters** for efficient data loading
5. **Handle optimistic updates** gracefully 